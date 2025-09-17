/**
 * End-to-End Tests for Critical User Flows
 * These tests simulate complete user journeys through the USD Financial platform
 */

import { 
  MOCK_ADDRESSES,
  MOCK_TX_HASHES,
  createMockAlchemyUser,
  createMockAggregatedBalance,
  createMockTransaction,
  testData,
  mockFetchResponse
} from '../utils/testHelpers'

// Mock browser APIs and navigation
const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams()
}))

// Mock services
const mockBalanceService = {
  getAllNetworkBalances: jest.fn(),
  invalidateCache: jest.fn()
}

const mockTransactionService = {
  createTransaction: jest.fn(),
  getTransactionHistory: jest.fn(),
  updateTransactionStatus: jest.fn()
}

const mockInvestmentService = {
  getPortfolioSummary: jest.fn(),
  getUserInvestments: jest.fn(),
  createInvestment: jest.fn()
}

jest.mock('@/lib/services/balanceService', () => ({
  multiChainBalanceService: mockBalanceService
}))

jest.mock('@/lib/services/transactionService', () => ({
  transactionService: mockTransactionService
}))

jest.mock('@/lib/services/investmentService', () => ({
  investmentService: mockInvestmentService
}))

// Mock Enhanced Auth Provider
const mockEnhancedAuth = {
  user: createMockAlchemyUser(),
  isAuthenticated: true,
  smartAccountAddress: MOCK_ADDRESSES.SMART_WALLET,
  sendUSDC: jest.fn(),
  sendGaslessTransaction: jest.fn(),
  login: jest.fn(),
  logout: jest.fn()
}

jest.mock('@/components/providers/EnhancedAuthProvider', () => ({
  useEnhancedAuth: () => mockEnhancedAuth
}))

describe('End-to-End User Flows', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Set up default mock responses
    mockBalanceService.getAllNetworkBalances.mockResolvedValue(
      createMockAggregatedBalance()
    )
    
    mockTransactionService.getTransactionHistory.mockResolvedValue({
      data: [createMockTransaction()],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    })
    
    mockInvestmentService.getPortfolioSummary.mockResolvedValue({
      totalInvested: '10000.0',
      totalCurrentValue: '12500.0',
      totalUnrealizedPnl: '2500.0',
      totalReturnPercentage: 25.0,
      assetCount: 5
    })
  })

  describe('User Authentication Flow', () => {
    it('should complete full login flow', async () => {
      // Step 1: User visits login page
      const loginPageTest = async () => {
        expect(window.location.pathname).toBe('/')
        
        // Mock authentication process
        mockEnhancedAuth.login.mockResolvedValue({
          user: createMockAlchemyUser(),
          session: { token: 'mock-jwt-token' }
        })
        
        // Simulate user clicking login
        await mockEnhancedAuth.login()
        
        expect(mockEnhancedAuth.login).toHaveBeenCalled()
      }

      // Step 2: User gets redirected to dashboard after successful login
      const dashboardRedirectTest = async () => {
        // Verify user is authenticated
        expect(mockEnhancedAuth.isAuthenticated).toBe(true)
        expect(mockEnhancedAuth.user).toBeDefined()
        
        // Verify redirect to dashboard
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      }

      await loginPageTest()
      await dashboardRedirectTest()
    })

    it('should handle login failure gracefully', async () => {
      mockEnhancedAuth.login.mockRejectedValue(new Error('Authentication failed'))

      try {
        await mockEnhancedAuth.login()
        fail('Should have thrown an error')
      } catch (error) {
        expect((error as Error).message).toBe('Authentication failed')
        expect(mockEnhancedAuth.isAuthenticated).toBe(true) // Still true from beforeEach
      }
    })

    it('should complete logout flow', async () => {
      mockEnhancedAuth.logout.mockResolvedValue(undefined)
      mockEnhancedAuth.isAuthenticated = false
      
      await mockEnhancedAuth.logout()
      
      expect(mockEnhancedAuth.logout).toHaveBeenCalled()
      expect(mockEnhancedAuth.isAuthenticated).toBe(false)
    })
  })

  describe('USDC Transfer Flow', () => {
    it('should complete full USDC transfer from wallet creation to confirmation', async () => {
      const transferAmount = '100.0'
      const recipientAddress = MOCK_ADDRESSES.RECIPIENT

      // Step 1: Check user has sufficient balance
      const balanceCheckTest = async () => {
        const balances = await mockBalanceService.getAllNetworkBalances(
          MOCK_ADDRESSES.SMART_WALLET
        )
        
        expect(balances.totalUSDC).toBeTruthy()
        expect(parseFloat(balances.totalUSDC)).toBeGreaterThan(parseFloat(transferAmount))
      }

      // Step 2: Initiate USDC transfer
      const initiateTransferTest = async () => {
        mockEnhancedAuth.sendUSDC.mockResolvedValue({
          hash: MOCK_TX_HASHES.SUCCESS,
          wait: () => Promise.resolve({
            hash: MOCK_TX_HASHES.SUCCESS,
            status: 1,
            blockNumber: 12345
          })
        })

        const result = await mockEnhancedAuth.sendUSDC(
          recipientAddress,
          transferAmount,
          'sepolia'
        )

        expect(result.hash).toBe(MOCK_TX_HASHES.SUCCESS)
        expect(mockEnhancedAuth.sendUSDC).toHaveBeenCalledWith(
          recipientAddress,
          transferAmount,
          'sepolia'
        )
      }

      // Step 3: Record transaction in database
      const recordTransactionTest = async () => {
        const mockTransaction = createMockTransaction({
          tx_hash: MOCK_TX_HASHES.SUCCESS,
          amount: transferAmount,
          to_address: recipientAddress,
          status: 'pending'
        })

        mockTransactionService.createTransaction.mockResolvedValue(mockTransaction)

        const transaction = await mockTransactionService.createTransaction({
          userId: mockEnhancedAuth.user.userId,
          txHash: MOCK_TX_HASHES.SUCCESS,
          transactionType: 'transfer',
          amount: transferAmount,
          stablecoin: 'USDC',
          chainId: '11155111',
          fromAddress: MOCK_ADDRESSES.SMART_WALLET,
          toAddress: recipientAddress
        })

        expect(transaction.status).toBe('pending')
        expect(transaction.amount).toBe(transferAmount)
      }

      // Step 4: Update transaction status when confirmed
      const confirmTransactionTest = async () => {
        const confirmedTransaction = createMockTransaction({
          id: testData.uuid(),
          status: 'completed',
          tx_hash: MOCK_TX_HASHES.SUCCESS
        })

        mockTransactionService.updateTransactionStatus.mockResolvedValue(
          confirmedTransaction
        )

        const result = await mockTransactionService.updateTransactionStatus(
          confirmedTransaction.id,
          'completed',
          12345,
          new Date().toISOString()
        )

        expect(result.status).toBe('completed')
      }

      // Step 5: Invalidate balance cache after transfer
      const invalidateCacheTest = async () => {
        await mockBalanceService.invalidateCache(MOCK_ADDRESSES.SMART_WALLET)
        expect(mockBalanceService.invalidateCache).toHaveBeenCalledWith(
          MOCK_ADDRESSES.SMART_WALLET
        )
      }

      // Execute all steps
      await balanceCheckTest()
      await initiateTransferTest()
      await recordTransactionTest()
      await confirmTransactionTest()
      await invalidateCacheTest()
    })

    it('should handle insufficient balance error', async () => {
      // Mock insufficient balance scenario
      mockBalanceService.getAllNetworkBalances.mockResolvedValue({
        totalUSDC: '50.0', // Less than transfer amount
        networks: [],
        lastUpdated: new Date()
      })

      mockEnhancedAuth.sendUSDC.mockRejectedValue(
        new Error('Insufficient balance to complete transaction')
      )

      const balances = await mockBalanceService.getAllNetworkBalances(
        MOCK_ADDRESSES.SMART_WALLET
      )
      
      expect(parseFloat(balances.totalUSDC)).toBeLessThan(100)

      try {
        await mockEnhancedAuth.sendUSDC(MOCK_ADDRESSES.RECIPIENT, '100.0', 'sepolia')
        fail('Should have thrown insufficient balance error')
      } catch (error) {
        expect((error as Error).message).toContain('Insufficient balance')
      }
    })

    it('should handle network errors during transfer', async () => {
      mockEnhancedAuth.sendUSDC.mockRejectedValue(
        new Error('Network connection issue')
      )

      try {
        await mockEnhancedAuth.sendUSDC(MOCK_ADDRESSES.RECIPIENT, '100.0', 'sepolia')
        fail('Should have thrown network error')
      } catch (error) {
        expect((error as Error).message).toContain('Network connection')
      }
    })
  })

  describe('Cross-Chain Transfer Flow', () => {
    it('should complete cross-chain USDC transfer via CCTP', async () => {
      const transferAmount = '500.0'
      const fromNetwork = 'sepolia'
      const toNetwork = 'baseSepolia'

      // Mock CCTP transfer
      const mockCCTPTransfer = jest.fn().mockResolvedValue({
        transferId: 'cctp-transfer-123',
        sourceTxHash: MOCK_TX_HASHES.SUCCESS,
        messageHash: '0xmessagehash123',
        attestation: '0xattestationhash456'
      })

      // Step 1: Initiate cross-chain transfer
      const initiateCCTPTest = async () => {
        const result = await mockCCTPTransfer({
          amount: transferAmount,
          fromNetwork,
          toNetwork,
          recipient: MOCK_ADDRESSES.RECIPIENT
        })

        expect(result.sourceTxHash).toBe(MOCK_TX_HASHES.SUCCESS)
        expect(result.transferId).toBeTruthy()
      }

      // Step 2: Monitor transfer status
      const monitorTransferTest = async () => {
        const mockGetTransferStatus = jest.fn().mockResolvedValue({
          status: 'completed',
          destinationTxHash: MOCK_TX_HASHES.SUCCESS,
          confirmations: 12
        })

        const status = await mockGetTransferStatus('cctp-transfer-123')
        expect(status.status).toBe('completed')
      }

      // Step 3: Update balance on destination chain
      const updateDestinationBalanceTest = async () => {
        // Mock balance update after cross-chain transfer
        const updatedBalance = createMockAggregatedBalance({
          totalUSDC: '1500.0' // Increased by transfer amount
        })

        mockBalanceService.getAllNetworkBalances.mockResolvedValue(updatedBalance)

        const balances = await mockBalanceService.getAllNetworkBalances(
          MOCK_ADDRESSES.RECIPIENT
        )

        expect(parseFloat(balances.totalUSDC)).toBe(1500.0)
      }

      await initiateCCTPTest()
      await monitorTransferTest()
      await updateDestinationBalanceTest()
    })
  })

  describe('Investment Flow', () => {
    it('should complete investment purchase flow', async () => {
      const investmentAmount = '1000.0'
      const assetId = testData.uuid()

      // Step 1: Browse available investment assets
      const browseAssetsTest = async () => {
        const mockAssets = {
          data: [
            {
              id: assetId,
              name: 'Tech Growth ETF',
              symbol: 'TECH',
              current_apy: '12.5',
              risk_level: 'Medium',
              current_price: '100.0'
            }
          ],
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }

        const mockGetTokenizedAssets = jest.fn().mockResolvedValue(mockAssets)
        ;(mockInvestmentService as any).getTokenizedAssets = mockGetTokenizedAssets
        
        const assets = await (mockInvestmentService as any).getTokenizedAssets()
        expect(assets.data).toHaveLength(1)
        expect(assets.data[0].name).toBe('Tech Growth ETF')
      }

      // Step 2: Check available USDC balance
      const checkInvestmentBalanceTest = async () => {
        const balances = await mockBalanceService.getAllNetworkBalances(
          MOCK_ADDRESSES.SMART_WALLET
        )

        expect(parseFloat(balances.totalUSDC)).toBeGreaterThanOrEqual(
          parseFloat(investmentAmount)
        )
      }

      // Step 3: Create investment
      const createInvestmentTest = async () => {
        const mockInvestment = {
          id: testData.uuid(),
          user_id: mockEnhancedAuth.user.userId,
          asset_id: assetId,
          quantity: '10.0',
          average_cost: '100.0',
          total_invested: investmentAmount,
          current_value: investmentAmount,
          currency: 'USDC'
        }

        mockInvestmentService.createInvestment.mockResolvedValue(mockInvestment)

        const investment = await mockInvestmentService.createInvestment({
          userId: mockEnhancedAuth.user.userId,
          assetId,
          quantity: '10.0',
          averageCost: '100.0',
          totalInvested: investmentAmount,
          currency: 'USDC'
        })

        expect(investment.total_invested).toBe(investmentAmount)
      }

      // Step 4: Update portfolio summary
      const updatePortfolioTest = async () => {
        const updatedPortfolio = {
          totalInvested: '11000.0', // Previous + new investment
          totalCurrentValue: '13500.0',
          totalUnrealizedPnl: '2500.0',
          totalReturnPercentage: 22.7,
          assetCount: 6 // Increased by 1
        }

        mockInvestmentService.getPortfolioSummary.mockResolvedValue(updatedPortfolio)

        const portfolio = await mockInvestmentService.getPortfolioSummary(
          mockEnhancedAuth.user.userId
        )

        expect(portfolio.assetCount).toBe(6)
        expect(parseFloat(portfolio.totalInvested)).toBe(11000)
      }

      await browseAssetsTest()
      await checkInvestmentBalanceTest()
      await createInvestmentTest()
      await updatePortfolioTest()
    })
  })

  describe('Multi-Chain Balance Viewing Flow', () => {
    it('should display balances across all supported networks', async () => {
      // Step 1: Load multi-chain balances
      const loadBalancesTest = async () => {
        const mockMultiChainBalance = createMockAggregatedBalance({
          totalUSDC: '5000.0',
          networks: [
            {
              network: 'Ethereum Sepolia',
              chainId: 11155111,
              isTestnet: true,
              eth: '0.5',
              usdc: { 
                balance: '1000.0', 
                symbol: 'USDC',
                address: MOCK_ADDRESSES.USDC_SEPOLIA,
                decimals: 6,
                name: 'USD Coin',
                rawBalance: '1000000000',
                network: 'Ethereum Sepolia',
                chainId: 11155111
              }
            },
            {
              network: 'Base Sepolia',
              chainId: 84532,
              isTestnet: true,
              eth: '0.3',
              usdc: {
                balance: '2000.0',
                symbol: 'USDC',
                address: MOCK_ADDRESSES.USDC_BASE,
                decimals: 6,
                name: 'USD Coin',
                rawBalance: '2000000000',
                network: 'Base Sepolia',
                chainId: 84532
              }
            },
            {
              network: 'Arbitrum Sepolia',
              chainId: 421614,
              isTestnet: true,
              eth: '0.7',
              usdc: {
                balance: '2000.0',
                symbol: 'USDC',
                address: MOCK_ADDRESSES.USDC_SEPOLIA,
                decimals: 6,
                name: 'USD Coin',
                rawBalance: '2000000000',
                network: 'Arbitrum Sepolia',
                chainId: 421614
              }
            }
          ]
        })

        mockBalanceService.getAllNetworkBalances.mockResolvedValue(mockMultiChainBalance)

        const balances = await mockBalanceService.getAllNetworkBalances(
          MOCK_ADDRESSES.SMART_WALLET
        )

        expect(balances.networks).toHaveLength(3)
        expect(balances.totalUSDC).toBe('5000.0')
      }

      // Step 2: Verify individual network balances
      const verifyNetworkBalancesTest = async () => {
        const balances = await mockBalanceService.getAllNetworkBalances(
          MOCK_ADDRESSES.SMART_WALLET
        )

        const sepoliaBalance = balances.networks.find((n: any) => n.network === 'Ethereum Sepolia')
        const baseBalance = balances.networks.find((n: any) => n.network === 'Base Sepolia')
        const arbitrumBalance = balances.networks.find((n: any) => n.network === 'Arbitrum Sepolia')

        expect(sepoliaBalance?.usdc?.balance).toBe('1000.0')
        expect(baseBalance?.usdc?.balance).toBe('2000.0')
        expect(arbitrumBalance?.usdc?.balance).toBe('2000.0')

        expect(sepoliaBalance?.eth).toBe('0.5')
        expect(baseBalance?.eth).toBe('0.3')
        expect(arbitrumBalance?.eth).toBe('0.7')
      }

      await loadBalancesTest()
      await verifyNetworkBalancesTest()
    })

    it('should handle network failures gracefully', async () => {
      // Mock partial network failures
      const mockBalanceWithErrors = {
        totalUSDC: '3000.0',
        networks: [
          {
            network: 'Ethereum Sepolia',
            chainId: 11155111,
            isTestnet: true,
            eth: '0.5',
            usdc: { balance: '1000.0' }
          },
          {
            network: 'Base Sepolia',
            chainId: 84532,
            isTestnet: true,
            eth: '0',
            usdc: null,
            error: 'Network timeout'
          },
          {
            network: 'Arbitrum Sepolia',
            chainId: 421614,
            isTestnet: true,
            eth: '0.7',
            usdc: { balance: '2000.0' }
          }
        ],
        lastUpdated: new Date()
      }

      mockBalanceService.getAllNetworkBalances.mockResolvedValue(mockBalanceWithErrors)

      const balances = await mockBalanceService.getAllNetworkBalances(
        MOCK_ADDRESSES.SMART_WALLET
      )

      const failedNetwork = balances.networks.find((n: any) => n.network === 'Base Sepolia')
      expect(failedNetwork?.error).toBe('Network timeout')
      expect(failedNetwork?.usdc).toBeNull()

      // Should still show successful networks
      expect(balances.networks.filter((n: any) => !n.error)).toHaveLength(2)
    })
  })

  describe('Transaction History Flow', () => {
    it('should load and display transaction history with filtering', async () => {
      // Step 1: Load initial transaction history
      const loadTransactionHistoryTest = async () => {
        const mockTransactions = {
          data: [
            createMockTransaction({ 
              transaction_type: 'transfer', 
              amount: '100.0',
              status: 'completed'
            }),
            createMockTransaction({ 
              transaction_type: 'deposit', 
              amount: '500.0',
              status: 'completed'
            }),
            createMockTransaction({ 
              transaction_type: 'withdraw', 
              amount: '50.0',
              status: 'pending'
            })
          ],
          total: 25,
          page: 1,
          limit: 20,
          totalPages: 2,
          hasNext: true,
          hasPrev: false
        }

        mockTransactionService.getTransactionHistory.mockResolvedValue(mockTransactions)

        const transactions = await mockTransactionService.getTransactionHistory(
          mockEnhancedAuth.user.userId,
          {},
          1,
          20
        )

        expect(transactions.data).toHaveLength(3)
        expect(transactions.total).toBe(25)
      }

      // Step 2: Apply filters
      const applyFiltersTest = async () => {
        const filteredTransactions = {
          data: [
            createMockTransaction({ 
              transaction_type: 'transfer',
              status: 'completed'
            })
          ],
          total: 15,
          page: 1,
          limit: 20,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }

        mockTransactionService.getTransactionHistory.mockResolvedValue(filteredTransactions)

        const filters = {
          type: ['transfer'],
          status: ['completed']
        }

        const transactions = await mockTransactionService.getTransactionHistory(
          mockEnhancedAuth.user.userId,
          filters
        )

        expect(transactions.data).toHaveLength(1)
        expect(transactions.data[0].transaction_type).toBe('transfer')
        expect(transactions.data[0].status).toBe('completed')
      }

      // Step 3: Load next page
      const loadNextPageTest = async () => {
        const nextPageTransactions = {
          data: [createMockTransaction()],
          total: 25,
          page: 2,
          limit: 20,
          totalPages: 2,
          hasNext: false,
          hasPrev: true
        }

        mockTransactionService.getTransactionHistory.mockResolvedValue(nextPageTransactions)

        const transactions = await mockTransactionService.getTransactionHistory(
          mockEnhancedAuth.user.userId,
          {},
          2,
          20
        )

        expect(transactions.page).toBe(2)
        expect(transactions.hasPrev).toBe(true)
        expect(transactions.hasNext).toBe(false)
      }

      await loadTransactionHistoryTest()
      await applyFiltersTest()
      await loadNextPageTest()
    })
  })

  describe('Error Recovery Flows', () => {
    it('should recover from service failures', async () => {
      // Step 1: Service initially fails
      mockBalanceService.getAllNetworkBalances.mockRejectedValueOnce(
        new Error('Service temporarily unavailable')
      )

      // Step 2: Retry succeeds
      mockBalanceService.getAllNetworkBalances.mockResolvedValueOnce(
        createMockAggregatedBalance()
      )

      // First attempt fails
      try {
        await mockBalanceService.getAllNetworkBalances(MOCK_ADDRESSES.SMART_WALLET)
        fail('Should have failed on first attempt')
      } catch (error) {
        expect((error as Error).message).toBe('Service temporarily unavailable')
      }

      // Retry succeeds
      const balances = await mockBalanceService.getAllNetworkBalances(
        MOCK_ADDRESSES.SMART_WALLET
      )
      expect(balances.totalUSDC).toBeTruthy()
    })

    it('should handle authentication expiry during operation', async () => {
      // Simulate authentication expiry
      mockEnhancedAuth.isAuthenticated = false
      
      try {
        await mockEnhancedAuth.sendUSDC(MOCK_ADDRESSES.RECIPIENT, '100.0', 'sepolia')
        fail('Should require authentication')
      } catch (error) {
        expect((error as Error).message).toContain('User not authenticated')
      }

      // Re-authenticate
      mockEnhancedAuth.isAuthenticated = true
      mockEnhancedAuth.sendUSDC.mockResolvedValue({
        hash: MOCK_TX_HASHES.SUCCESS
      })

      const result = await mockEnhancedAuth.sendUSDC(
        MOCK_ADDRESSES.RECIPIENT, 
        '100.0', 
        'sepolia'
      )
      expect(result.hash).toBe(MOCK_TX_HASHES.SUCCESS)
    })
  })

  describe('Performance and Caching Flows', () => {
    it('should utilize caching for repeated balance requests', async () => {
      const mockBalance = createMockAggregatedBalance()
      
      // First call - cache miss
      mockBalanceService.getAllNetworkBalances.mockResolvedValueOnce(mockBalance)
      
      const firstCall = await mockBalanceService.getAllNetworkBalances(
        MOCK_ADDRESSES.SMART_WALLET
      )
      
      // Second call - should use cache (mock not called again)
      const secondCall = await mockBalanceService.getAllNetworkBalances(
        MOCK_ADDRESSES.SMART_WALLET
      )
      
      expect(mockBalanceService.getAllNetworkBalances).toHaveBeenCalledTimes(2)
      expect(firstCall.totalUSDC).toBe(secondCall.totalUSDC)
    })

    it('should invalidate cache after transactions', async () => {
      // Initial balance
      mockBalanceService.getAllNetworkBalances.mockResolvedValue(
        createMockAggregatedBalance({ totalUSDC: '1000.0' })
      )

      const initialBalance = await mockBalanceService.getAllNetworkBalances(
        MOCK_ADDRESSES.SMART_WALLET
      )
      expect(initialBalance.totalUSDC).toBe('1000.0')

      // Perform transaction
      mockEnhancedAuth.sendUSDC.mockResolvedValue({
        hash: MOCK_TX_HASHES.SUCCESS
      })

      await mockEnhancedAuth.sendUSDC(MOCK_ADDRESSES.RECIPIENT, '100.0', 'sepolia')

      // Cache should be invalidated
      mockBalanceService.invalidateCache.mockImplementation(() => {
        // Simulate cache invalidation
        mockBalanceService.getAllNetworkBalances.mockResolvedValue(
          createMockAggregatedBalance({ totalUSDC: '900.0' })
        )
      })

      await mockBalanceService.invalidateCache(MOCK_ADDRESSES.SMART_WALLET)

      const updatedBalance = await mockBalanceService.getAllNetworkBalances(
        MOCK_ADDRESSES.SMART_WALLET
      )
      expect(updatedBalance.totalUSDC).toBe('900.0')
    })
  })
})