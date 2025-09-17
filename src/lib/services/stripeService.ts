import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia'
})

export interface CreateCardholderData {
  userId: string
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  dateOfBirth: {
    day: number
    month: number
    year: number
  }
  address: {
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  type?: 'individual' | 'company'
}

export interface CreateCardData {
  userId: string
  cardholderId: string
  cardName: string
  currency?: 'usd'
  type?: 'virtual'
  spendingLimits?: Array<{
    amount: number
    interval: 'per_authorization' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  }>
  blockedCategories?: string[]
  allowedCategories?: string[]
}

export interface StripeCard {
  id: string
  cardName: string
  last4: string
  brand: string
  expiryMonth: number
  expiryYear: number
  status: string
  type: string
  currency: string
  cardholderId: string
  createdAt: string
  spendingControls?: any
}

export interface StripeCardDetails extends StripeCard {
  number: string
  cvc: string
}

export class StripeService {
  /**
   * Create a new cardholder in Stripe
   */
  static async createCardholder(data: CreateCardholderData): Promise<{ id: string; status: string }> {
    try {
      const cardholder = await stripe.issuing.cardholders.create({
        type: data.type || 'individual',
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        phone_number: data.phoneNumber,
        individual: {
          first_name: data.firstName,
          last_name: data.lastName,
          dob: data.dateOfBirth
        },
        billing: {
          address: {
            line1: data.address.line1,
            line2: data.address.line2,
            city: data.address.city,
            state: data.address.state,
            postal_code: data.address.postalCode,
            country: data.address.country
          }
        },
        metadata: {
          userId: data.userId,
          createdBy: 'usd-financial'
        }
      })

      return {
        id: cardholder.id,
        status: cardholder.status
      }
    } catch (error) {
      console.error('Error creating Stripe cardholder:', error)
      throw error
    }
  }

  /**
   * Issue a new virtual card
   */
  static async issueCard(data: CreateCardData): Promise<StripeCardDetails> {
    try {
      // Verify cardholder belongs to user
      const cardholder = await stripe.issuing.cardholders.retrieve(data.cardholderId)
      if (cardholder.metadata?.userId !== data.userId) {
        throw new Error('Cardholder access denied')
      }

      // Create spending controls if provided
      let spendingControls: Stripe.Issuing.CardCreateParams.SpendingControls | undefined
      
      if (data.spendingLimits || data.blockedCategories || data.allowedCategories) {
        spendingControls = {
          spending_limits: data.spendingLimits?.map(limit => ({
            amount: limit.amount * 100, // Convert to cents
            interval: limit.interval
          })),
          blocked_categories: data.blockedCategories,
          allowed_categories: data.allowedCategories
        }
      }

      // Issue the card
      const card = await stripe.issuing.cards.create({
        cardholder: data.cardholderId,
        currency: data.currency || 'usd',
        type: data.type || 'virtual',
        status: 'active',
        spending_controls: spendingControls,
        metadata: {
          userId: data.userId,
          cardName: data.cardName,
          createdBy: 'usd-financial'
        }
      })

      return {
        id: card.id,
        cardName: data.cardName,
        last4: card.last4,
        brand: card.brand,
        expiryMonth: card.exp_month,
        expiryYear: card.exp_year,
        status: card.status,
        type: card.type,
        currency: card.currency,
        cardholderId: card.cardholder as string,
        createdAt: new Date(card.created * 1000).toISOString(),
        spendingControls: card.spending_controls,
        number: card.number!,
        cvc: card.cvc!
      }
    } catch (error) {
      console.error('Error issuing Stripe card:', error)
      throw error
    }
  }

  /**
   * Get cards for a user
   */
  static async getUserCards(userId: string): Promise<StripeCard[]> {
    try {
      // Get all cardholders for the user
      const cardholders = await stripe.issuing.cardholders.list({
        limit: 100
      })

      const userCardholders = cardholders.data.filter(
        cardholder => cardholder.metadata?.userId === userId
      )

      const allCards: StripeCard[] = []
      
      for (const cardholder of userCardholders) {
        const cards = await stripe.issuing.cards.list({
          cardholder: cardholder.id,
          limit: 100
        })
        
        allCards.push(...cards.data.map(card => ({
          id: card.id,
          cardName: card.metadata?.cardName || 'Unnamed Card',
          last4: card.last4,
          brand: card.brand,
          expiryMonth: card.exp_month,
          expiryYear: card.exp_year,
          status: card.status,
          type: card.type,
          currency: card.currency,
          cardholderId: card.cardholder as string,
          createdAt: new Date(card.created * 1000).toISOString(),
          spendingControls: card.spending_controls
        })))
      }

      return allCards
    } catch (error) {
      console.error('Error fetching user cards:', error)
      throw error
    }
  }

  /**
   * Get sensitive card details
   */
  static async getCardDetails(userId: string, cardId: string): Promise<StripeCardDetails> {
    try {
      const card = await stripe.issuing.cards.retrieve(cardId)

      // Verify card belongs to user's cardholder
      const cardholder = await stripe.issuing.cardholders.retrieve(card.cardholder as string)
      
      if (cardholder.metadata?.userId !== userId) {
        throw new Error('Card access denied')
      }

      return {
        id: card.id,
        cardName: card.metadata?.cardName || 'Unnamed Card',
        last4: card.last4,
        brand: card.brand,
        expiryMonth: card.exp_month,
        expiryYear: card.exp_year,
        status: card.status,
        type: card.type,
        currency: card.currency,
        cardholderId: card.cardholder as string,
        createdAt: new Date(card.created * 1000).toISOString(),
        spendingControls: card.spending_controls,
        number: card.number!,
        cvc: card.cvc!
      }
    } catch (error) {
      console.error('Error fetching card details:', error)
      throw error
    }
  }

  /**
   * Update card status (activate/block/freeze)
   */
  static async updateCardStatus(userId: string, cardId: string, status: 'active' | 'inactive' | 'canceled'): Promise<void> {
    try {
      const card = await stripe.issuing.cards.retrieve(cardId)

      // Verify card belongs to user's cardholder
      const cardholder = await stripe.issuing.cardholders.retrieve(card.cardholder as string)
      
      if (cardholder.metadata?.userId !== userId) {
        throw new Error('Card access denied')
      }

      await stripe.issuing.cards.update(cardId, {
        status
      })
    } catch (error) {
      console.error('Error updating card status:', error)
      throw error
    }
  }

  /**
   * Get cardholders for a user
   */
  static async getUserCardholders(userId: string) {
    try {
      const cardholders = await stripe.issuing.cardholders.list({
        limit: 100
      })

      return cardholders.data
        .filter(cardholder => cardholder.metadata?.userId === userId)
        .map(cardholder => ({
          id: cardholder.id,
          name: cardholder.name,
          email: cardholder.email,
          status: cardholder.status,
          type: cardholder.type,
          createdAt: new Date(cardholder.created * 1000).toISOString()
        }))
    } catch (error) {
      console.error('Error fetching user cardholders:', error)
      throw error
    }
  }
}

export default StripeService