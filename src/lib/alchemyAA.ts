'use client'

import {
  createAlchemySmartAccountClient,
  type AlchemySmartAccountClient,
} from "@alchemy/aa-alchemy"
import {
  createLightAccount,
  type LightAccount,
} from "@alchemy/aa-accounts"
import { 
  sepolia, 
  polygon, 
  mainnet,
  type Chain,
  type SmartAccountSigner,
} from "@alchemy/aa-core"
import { encodeFunctionData } from 'viem'

// Environment variables
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || ''
const ALCHEMY_POLICY_ID = process.env.NEXT_PUBLIC_ALCHEMY_POLICY_ID || ''

// Only check during runtime, not build time
const checkAlchemyConfig = () => {
  if (typeof window !== 'undefined' && (!ALCHEMY_API_KEY || !ALCHEMY_POLICY_ID)) {
    throw new Error('Missing Alchemy configuration. Please set NEXT_PUBLIC_ALCHEMY_API_KEY and NEXT_PUBLIC_ALCHEMY_POLICY_ID')
  }
}

// Supported chains for Account Abstraction
export const AA_SUPPORTED_CHAINS = {
  sepolia: sepolia,
  polygon: polygon, 
  mainnet: mainnet,
} as const

export type AASupportedChain = keyof typeof AA_SUPPORTED_CHAINS

// Default chain for development
export const DEFAULT_CHAIN: AASupportedChain = 'sepolia'

/**
 * Gas Policy Configuration for Gasless Transactions
 */
export const GAS_POLICY_CONFIG = {
  policyId: ALCHEMY_POLICY_ID,
  entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", // Standard EntryPoint v0.6
} as const

/**
 * Account Abstraction Service Class
 */
export class AlchemyAAService {
  private client: AlchemySmartAccountClient | null = null
  private account: LightAccount | null = null
  private chain: AASupportedChain = DEFAULT_CHAIN
  private smartAccountAddress: string | null = null

  constructor(chain: AASupportedChain = DEFAULT_CHAIN) {
    this.chain = chain
  }

  /**
   * Initialize the AA client with Account Kit signer
   */
  async initialize(accountKitSigner?: SmartAccountSigner): Promise<void> {
    try {
      // Check configuration first
      checkAlchemyConfig()
      
      if (!accountKitSigner) {
        throw new Error('Account Kit signer is required for AA initialization')
      }

      const selectedChain = AA_SUPPORTED_CHAINS[this.chain]
      
      console.log(`🔄 Initializing Alchemy AA on ${this.chain}...`)

      // Create Light Account (smart contract wallet)
      this.account = await createLightAccount({
        signer: accountKitSigner,
        chain: selectedChain,
        initCode: "0x", // Will be generated automatically
      })

      // Create Alchemy Smart Account Client
      this.client = createAlchemySmartAccountClient({
        apiKey: ALCHEMY_API_KEY,
        chain: selectedChain,
        account: this.account,
        gasManagerConfig: {
          policyId: ALCHEMY_POLICY_ID,
        },
      })
      
      // Get smart account address
      this.smartAccountAddress = await this.client.getAddress()
      
      console.log(`✅ Alchemy AA initialized on ${this.chain}`)
      console.log(`📍 Smart Account Address: ${this.smartAccountAddress}`)
    } catch (error) {
      console.error('❌ Failed to initialize Alchemy AA:', error)
      throw error
    }
  }

  /**
   * Get the smart contract wallet address
   */
  getAddress(): string | null {
    return this.smartAccountAddress
  }

  /**
   * Get the AA client
   */
  getClient(): AlchemySmartAccountClient | null {
    return this.client
  }

  /**
   * Send gasless transaction using Account Abstraction
   */
  async sendTransaction(to: string, value: string, data?: string): Promise<string> {
    if (!this.client) {
      throw new Error('AA Client not initialized. Call initialize() first.')
    }

    try {
      console.log(`🔄 Sending gasless transaction to ${to}...`)
      
      // Send UserOperation (gasless transaction)
      const txHash = await this.client.sendTransaction({
        to: to as `0x${string}`,
        data: (data || '0x') as `0x${string}`,
        value: BigInt(value),
      })
      
      console.log(`✅ Gasless transaction sent: ${txHash}`)
      return txHash
    } catch (error) {
      console.error('❌ Gasless transaction failed:', error)
      throw error
    }
  }

  /**
   * Send USDC tokens to a recipient address
   */
  async sendUSDC(to: string, amount: string, usdcContractAddress: string): Promise<string> {
    if (!this.client) {
      throw new Error('AA Client not initialized. Call initialize() first.')
    }

    try {
      console.log(`💰 Sending ${amount} USDC to ${to}...`)
      
      // Convert amount to proper decimals (USDC has 6 decimals)
      const amountInDecimals = BigInt(parseFloat(amount) * 10**6)
      
      // ERC20 transfer function signature: transfer(address,uint256)
      const transferData = encodeFunctionData({
        abi: [
          {
            name: 'transfer',
            type: 'function',
            inputs: [
              { name: 'to', type: 'address' },
              { name: 'value', type: 'uint256' }
            ],
            outputs: [{ name: '', type: 'bool' }]
          }
        ],
        functionName: 'transfer',
        args: [to as `0x${string}`, amountInDecimals]
      })
      
      // Send UserOperation to USDC contract
      const txHash = await this.client.sendTransaction({
        to: usdcContractAddress as `0x${string}`,
        data: transferData,
        value: 0n, // No ETH value for ERC20 transfers
      })
      
      console.log(`✅ USDC transfer sent: ${txHash}`)
      return txHash
    } catch (error) {
      console.error('❌ USDC transfer failed:', error)
      throw error
    }
  }

  /**
   * Get smart account balance
   */
  async getBalance(): Promise<string> {
    if (!this.client || !this.smartAccountAddress) {
      return '0'
    }

    try {
      const balance = await this.client.getBalance({
        address: this.smartAccountAddress as `0x${string}`,
      })
      
      // Convert from wei to ether
      return (Number(balance) / 1e18).toString()
    } catch (error) {
      console.error('Failed to get AA balance:', error)
      return '0'
    }
  }

  /**
   * Switch to different chain
   */
  async switchChain(newChain: AASupportedChain): Promise<void> {
    this.chain = newChain
    // Re-initialize with new chain - will need Account Kit signer
    console.log(`🔄 Switching to chain: ${newChain}`)
  }

  /**
   * Check if Account Abstraction is ready
   */
  isReady(): boolean {
    return !!this.client && !!this.smartAccountAddress
  }

  /**
   * Get current chain
   */
  getCurrentChain(): AASupportedChain {
    return this.chain
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    this.client = null
    this.account = null
    this.smartAccountAddress = null
    console.log('🔌 Alchemy AA disconnected')
  }
}

// Singleton instance
export const alchemyAAService = new AlchemyAAService()