import { BaseService } from './baseService'
import Stripe from 'stripe'

export interface UserCard {
  id: string
  userId: string
  stripeCardId: string
  last4: string
  brand: string
  expMonth: number
  expYear: number
  isDefault: boolean
  isActive: boolean
  cardholderName?: string
  billingAddress?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface CardTransaction {
  id: string
  userId: string
  cardId: string
  stripeChargeId?: string
  stripePaymentIntentId?: string
  amount: number
  currency: string
  description: string
  status: 'pending' | 'succeeded' | 'failed' | 'canceled' | 'refunded'
  transactionType: 'payment' | 'refund' | 'dispute' | 'chargeback'
  merchantName?: string
  merchantCategory?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface CreateCardRequest {
  userId: string
  stripeCardId: string
  cardholderName?: string
  billingAddress?: UserCard['billingAddress']
  isDefault?: boolean
  metadata?: Record<string, any>
}

export interface CreateTransactionRequest {
  userId: string
  cardId: string
  stripeChargeId?: string
  stripePaymentIntentId?: string
  amount: number
  currency: string
  description: string
  status: CardTransaction['status']
  transactionType: CardTransaction['transactionType']
  merchantName?: string
  merchantCategory?: string
  metadata?: Record<string, any>
}

/**
 * Card Service - Local database integration with Stripe
 *
 * Maintains local copies of card data for:
 * - Analytics and reporting
 * - Offline access and backup
 * - Enhanced fraud detection
 * - Compliance and audit trails
 */
class CardService extends BaseService {
  private stripe: Stripe

  constructor() {
    super('user_cards')

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is required for CardService')
    }

    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20'
    })
  }

  /**
   * Store card information locally after Stripe card creation
   */
  async createCard(data: CreateCardRequest): Promise<UserCard> {
    try {
      // First, get card details from Stripe to ensure data accuracy
      const stripeCard = await this.stripe.paymentMethods.retrieve(data.stripeCardId)

      if (!stripeCard.card) {
        throw new Error('Invalid Stripe card data')
      }

      // If this is set as default, unset all other default cards for user
      if (data.isDefault) {
        await this.setAllCardsNonDefault(data.userId)
      }

      const cardId = this.generateId()

      const query = `
        INSERT INTO user_cards (
          id, user_id, stripe_card_id, last_4, brand, exp_month, exp_year,
          is_default, is_active, cardholder_name, billing_address, metadata,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING *
      `

      const result = await this.customQuery(query, [
        cardId,
        data.userId,
        data.stripeCardId,
        stripeCard.card.last4,
        stripeCard.card.brand,
        stripeCard.card.exp_month,
        stripeCard.card.exp_year,
        data.isDefault || false,
        true, // is_active
        data.cardholderName || null,
        data.billingAddress ? JSON.stringify(data.billingAddress) : null,
        data.metadata ? JSON.stringify(data.metadata) : null
      ])

      if (result.length === 0) {
        throw new Error('Failed to create card record')
      }

      console.log('✅ Card stored locally:', {
        cardId,
        userId: data.userId,
        last4: stripeCard.card.last4,
        brand: stripeCard.card.brand,
        isDefault: data.isDefault
      })

      return this.mapDatabaseRowToCard(result[0])
    } catch (error) {
      console.error('❌ Error creating card:', error)
      throw error
    }
  }

  /**
   * Get user's cards with Stripe sync verification
   */
  async getUserCards(userId: string, syncWithStripe: boolean = false): Promise<UserCard[]> {
    try {
      const query = `
        SELECT * FROM user_cards
        WHERE user_id = $1 AND is_active = true
        ORDER BY is_default DESC, created_at DESC
      `

      const result = await this.customQuery(query, [userId])
      const cards = result.map(row => this.mapDatabaseRowToCard(row))

      // Optional Stripe sync verification
      if (syncWithStripe && cards.length > 0) {
        await this.syncCardsWithStripe(cards)
      }

      return cards
    } catch (error) {
      console.error('❌ Error getting user cards:', error)
      return []
    }
  }

  /**
   * Record card transaction locally
   */
  async recordTransaction(data: CreateTransactionRequest): Promise<CardTransaction> {
    try {
      const transactionId = this.generateId()

      const query = `
        INSERT INTO card_transactions (
          id, user_id, card_id, stripe_charge_id, stripe_payment_intent_id,
          amount, currency, description, status, transaction_type,
          merchant_name, merchant_category, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
        RETURNING *
      `

      const result = await this.customQuery(query, [
        transactionId,
        data.userId,
        data.cardId,
        data.stripeChargeId || null,
        data.stripePaymentIntentId || null,
        data.amount,
        data.currency.toUpperCase(),
        data.description,
        data.status,
        data.transactionType,
        data.merchantName || null,
        data.merchantCategory || null,
        data.metadata ? JSON.stringify(data.metadata) : null
      ])

      if (result.length === 0) {
        throw new Error('Failed to record transaction')
      }

      console.log('✅ Transaction recorded:', {
        transactionId,
        userId: data.userId,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        type: data.transactionType
      })

      return this.mapDatabaseRowToTransaction(result[0])
    } catch (error) {
      console.error('❌ Error recording transaction:', error)
      throw error
    }
  }

  /**
   * Get user's transaction history
   */
  async getUserTransactions(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<CardTransaction[]> {
    try {
      const query = `
        SELECT ct.*, uc.last_4, uc.brand
        FROM card_transactions ct
        LEFT JOIN user_cards uc ON ct.card_id = uc.id
        WHERE ct.user_id = $1
        ORDER BY ct.created_at DESC
        LIMIT $2 OFFSET $3
      `

      const result = await this.customQuery(query, [userId, limit, offset])
      return result.map(row => this.mapDatabaseRowToTransaction(row))
    } catch (error) {
      console.error('❌ Error getting user transactions:', error)
      return []
    }
  }

  /**
   * Update card status (activate/deactivate)
   */
  async updateCardStatus(cardId: string, isActive: boolean): Promise<void> {
    try {
      const query = `
        UPDATE user_cards
        SET is_active = $1, updated_at = NOW()
        WHERE id = $2
      `

      await this.customQuery(query, [isActive, cardId])

      console.log(`✅ Card ${cardId} ${isActive ? 'activated' : 'deactivated'}`)
    } catch (error) {
      console.error('❌ Error updating card status:', error)
      throw error
    }
  }

  /**
   * Set card as default
   */
  async setDefaultCard(userId: string, cardId: string): Promise<void> {
    try {
      // First, unset all other default cards
      await this.setAllCardsNonDefault(userId)

      // Then set this card as default
      const query = `
        UPDATE user_cards
        SET is_default = true, updated_at = NOW()
        WHERE id = $1 AND user_id = $2
      `

      await this.customQuery(query, [cardId, userId])

      console.log(`✅ Card ${cardId} set as default for user ${userId}`)
    } catch (error) {
      console.error('❌ Error setting default card:', error)
      throw error
    }
  }

  /**
   * Sync local cards with Stripe data
   */
  private async syncCardsWithStripe(cards: UserCard[]): Promise<void> {
    try {
      for (const card of cards) {
        try {
          const stripeCard = await this.stripe.paymentMethods.retrieve(card.stripeCardId)

          if (!stripeCard.card) {
            // Card deleted from Stripe, deactivate locally
            await this.updateCardStatus(card.id, false)
            continue
          }

          // Check if local data needs updating
          if (card.last4 !== stripeCard.card.last4 ||
              card.brand !== stripeCard.card.brand ||
              card.expMonth !== stripeCard.card.exp_month ||
              card.expYear !== stripeCard.card.exp_year) {

            await this.updateCardFromStripe(card.id, stripeCard.card)
          }
        } catch (stripeError) {
          console.warn(`⚠️ Could not sync card ${card.id} with Stripe:`, stripeError)
          // Don't fail the entire sync for one card
        }
      }
    } catch (error) {
      console.error('❌ Error syncing cards with Stripe:', error)
    }
  }

  /**
   * Update local card data from Stripe
   */
  private async updateCardFromStripe(cardId: string, stripeCard: any): Promise<void> {
    const query = `
      UPDATE user_cards
      SET last_4 = $1, brand = $2, exp_month = $3, exp_year = $4, updated_at = NOW()
      WHERE id = $5
    `

    await this.customQuery(query, [
      stripeCard.last4,
      stripeCard.brand,
      stripeCard.exp_month,
      stripeCard.exp_year,
      cardId
    ])
  }

  /**
   * Set all cards for user as non-default
   */
  private async setAllCardsNonDefault(userId: string): Promise<void> {
    const query = `
      UPDATE user_cards
      SET is_default = false, updated_at = NOW()
      WHERE user_id = $1
    `

    await this.customQuery(query, [userId])
  }

  /**
   * Ensure required tables exist
   */
  async ensureCardTables(): Promise<void> {
    try {
      const createTablesQuery = `
        -- User Cards Table
        CREATE TABLE IF NOT EXISTS user_cards (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          stripe_card_id VARCHAR(255) NOT NULL UNIQUE,
          last_4 VARCHAR(4) NOT NULL,
          brand VARCHAR(50) NOT NULL,
          exp_month INTEGER NOT NULL,
          exp_year INTEGER NOT NULL,
          is_default BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          cardholder_name VARCHAR(255),
          billing_address JSONB,
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Card Transactions Table
        CREATE TABLE IF NOT EXISTS card_transactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          card_id UUID NOT NULL REFERENCES user_cards(id) ON DELETE CASCADE,
          stripe_charge_id VARCHAR(255),
          stripe_payment_intent_id VARCHAR(255),
          amount BIGINT NOT NULL, -- Amount in cents
          currency VARCHAR(3) NOT NULL DEFAULT 'USD',
          description TEXT NOT NULL,
          status VARCHAR(20) NOT NULL,
          transaction_type VARCHAR(20) NOT NULL,
          merchant_name VARCHAR(255),
          merchant_category VARCHAR(100),
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Indexes for performance
        CREATE INDEX IF NOT EXISTS idx_user_cards_user_id ON user_cards(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_cards_is_active ON user_cards(is_active);
        CREATE INDEX IF NOT EXISTS idx_user_cards_is_default ON user_cards(is_default);
        CREATE INDEX IF NOT EXISTS idx_card_transactions_user_id ON card_transactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_card_transactions_card_id ON card_transactions(card_id);
        CREATE INDEX IF NOT EXISTS idx_card_transactions_status ON card_transactions(status);
        CREATE INDEX IF NOT EXISTS idx_card_transactions_created_at ON card_transactions(created_at DESC);
      `

      await this.customQuery(createTablesQuery, [])
      console.log('✅ Card tables ensured')
    } catch (error) {
      console.warn('⚠️ Could not ensure card tables exist:', error.message)
    }
  }

  /**
   * Map database row to UserCard object
   */
  private mapDatabaseRowToCard(row: any): UserCard {
    return {
      id: row.id,
      userId: row.user_id,
      stripeCardId: row.stripe_card_id,
      last4: row.last_4,
      brand: row.brand,
      expMonth: row.exp_month,
      expYear: row.exp_year,
      isDefault: row.is_default,
      isActive: row.is_active,
      cardholderName: row.cardholder_name,
      billingAddress: row.billing_address ? JSON.parse(row.billing_address) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }

  /**
   * Map database row to CardTransaction object
   */
  private mapDatabaseRowToTransaction(row: any): CardTransaction {
    return {
      id: row.id,
      userId: row.user_id,
      cardId: row.card_id,
      stripeChargeId: row.stripe_charge_id,
      stripePaymentIntentId: row.stripe_payment_intent_id,
      amount: row.amount,
      currency: row.currency,
      description: row.description,
      status: row.status,
      transactionType: row.transaction_type,
      merchantName: row.merchant_name,
      merchantCategory: row.merchant_category,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }
}

// Export singleton instance
export const cardService = new CardService()
export default cardService