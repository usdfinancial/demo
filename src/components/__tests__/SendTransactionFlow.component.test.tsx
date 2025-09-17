import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SendTransactionFlow, SendTransactionData } from '../send/SendTransactionFlow'
import { 
  MOCK_ADDRESSES,
  MOCK_TX_HASHES,
  createMockAlchemyUser,
  createMockAlchemySigner,
  mockConsole
} from '../../__tests__/utils/testHelpers'

// Mock the Enhanced Auth Provider
const mockEnhancedAuth = {
  user: createMockAlchemyUser(),
  sendGaslessTransaction: jest.fn(),
  sendUSDC: jest.fn(),
  smartAccountAddress: MOCK_ADDRESSES.SMART_WALLET
}

jest.mock('@/components/providers/EnhancedAuthProvider', () => ({
  useEnhancedAuth: () => mockEnhancedAuth
}))

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-testid="button"
    >
      {children}
    </button>
  )
}))

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="card">{children}</div>
  ),
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>,
  CardDescription: ({ children }: any) => <p data-testid="card-description">{children}</p>
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span className={className} data-variant={variant} data-testid="badge">
      {children}
    </span>
  )
}))

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: any) => (
    <div className={className} data-testid="progress" data-value={value}>
      <div style={{ width: `${value}%` }} data-testid="progress-bar" />
    </div>
  )
}))

// Mock data formatting utility
jest.mock('@/lib/data', () => ({
  formatCurrency: jest.fn((value: number) => `$${value.toFixed(2)}`),
  StablecoinSymbol: 'USDC'
}))

describe('SendTransactionFlow', () => {
  const mockTransactionData: SendTransactionData = {
    recipient: MOCK_ADDRESSES.RECIPIENT,
    amount: '100.0',
    stablecoin: 'USDC' as any,
    message: 'Test payment',
    recipientName: 'Test Recipient',
    useGasless: true,
    selectedNetwork: 'Ethereum Sepolia'
  }

  const defaultProps = {
    transactionData: mockTransactionData,
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
    isOpen: true
  }

  const consoleMocks = mockConsole()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should render when open', () => {
    render(<SendTransactionFlow {...defaultProps} />)

    expect(screen.getByTestId('card')).toBeInTheDocument()
    expect(screen.getByText('Confirm Transaction')).toBeInTheDocument()
    expect(screen.getByText('Review your transaction details before sending')).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    render(<SendTransactionFlow {...defaultProps} isOpen={false} />)

    expect(screen.queryByTestId('card')).not.toBeInTheDocument()
  })

  it('should display transaction details correctly', () => {
    render(<SendTransactionFlow {...defaultProps} />)

    // Check recipient information
    expect(screen.getByText('Test Recipient')).toBeInTheDocument()
    expect(screen.getByText(`${MOCK_ADDRESSES.RECIPIENT.slice(0, 6)}...${MOCK_ADDRESSES.RECIPIENT.slice(-4)}`)).toBeInTheDocument()

    // Check amount
    expect(screen.getByText('$100.00')).toBeInTheDocument()
    expect(screen.getByText('100.0 USDC')).toBeInTheDocument()

    // Check message
    expect(screen.getByText('"Test payment"')).toBeInTheDocument()
  })

  it('should show gasless transaction badge', () => {
    render(<SendTransactionFlow {...defaultProps} />)

    const freeBadge = screen.getByTestId('badge')
    expect(freeBadge).toHaveTextContent('FREE')
  })

  it('should show network fee for non-gasless transactions', () => {
    const nonGaslessData = {
      ...mockTransactionData,
      useGasless: false
    }

    render(
      <SendTransactionFlow 
        {...defaultProps} 
        transactionData={nonGaslessData}
      />
    )

    expect(screen.getByText('$0.50')).toBeInTheDocument() // Network fee
    expect(screen.getByText('$100.50')).toBeInTheDocument() // Total cost
  })

  it('should display security information', () => {
    render(<SendTransactionFlow {...defaultProps} />)

    expect(screen.getByText('USD Financial Security')).toBeInTheDocument()
    expect(screen.getByText(/Transaction is secured by smart contract technology/)).toBeInTheDocument()
    expect(screen.getByText(/Zero gas fees with Account Abstraction/)).toBeInTheDocument()
  })

  it('should handle transaction confirmation', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    
    mockEnhancedAuth.sendUSDC.mockResolvedValue({
      hash: MOCK_TX_HASHES.SUCCESS,
      wait: jest.fn().mockResolvedValue({
        hash: MOCK_TX_HASHES.SUCCESS,
        status: 1
      })
    })

    render(<SendTransactionFlow {...defaultProps} />)

    const confirmButton = screen.getByText('Confirm Send')
    await user.click(confirmButton)

    // Should show processing state
    expect(screen.getByText('Processing Transaction')).toBeInTheDocument()
    expect(screen.getByTestId('progress')).toBeInTheDocument()

    // Fast-forward through the processing animation
    jest.advanceTimersByTime(10000)

    // Wait for transaction to complete
    await waitFor(() => {
      expect(mockEnhancedAuth.sendUSDC).toHaveBeenCalledWith(
        mockTransactionData.recipient,
        mockTransactionData.amount,
        mockTransactionData.selectedNetwork
      )
    }, { timeout: 15000 })
  })

  it('should show progress updates during processing', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    
    mockEnhancedAuth.sendUSDC.mockResolvedValue({
      hash: MOCK_TX_HASHES.SUCCESS
    })

    render(<SendTransactionFlow {...defaultProps} />)

    const confirmButton = screen.getByText('Confirm Send')
    await user.click(confirmButton)

    // Check initial progress state
    expect(screen.getByText('Validating transaction...')).toBeInTheDocument()
    
    // Advance time to see progress updates
    jest.advanceTimersByTime(2000)
    expect(screen.getByText('Preparing smart wallet...')).toBeInTheDocument()

    jest.advanceTimersByTime(2000)
    expect(screen.getByText('Broadcasting to network...')).toBeInTheDocument()

    jest.advanceTimersByTime(3000)
    expect(screen.getByText('Confirming on blockchain...')).toBeInTheDocument()
  })

  it('should show success state after transaction completes', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    
    mockEnhancedAuth.sendUSDC.mockResolvedValue({
      hash: MOCK_TX_HASHES.SUCCESS
    })

    render(<SendTransactionFlow {...defaultProps} />)

    const confirmButton = screen.getByText('Confirm Send')
    await user.click(confirmButton)

    // Fast-forward to completion
    jest.advanceTimersByTime(15000)

    await waitFor(() => {
      expect(screen.getByText('Transaction Sent!')).toBeInTheDocument()
      expect(screen.getByText('Your stablecoins have been sent successfully')).toBeInTheDocument()
    }, { timeout: 20000 })
  })

  it('should display transaction hash in success state', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    
    mockEnhancedAuth.sendUSDC.mockResolvedValue({
      hash: MOCK_TX_HASHES.SUCCESS
    })

    render(<SendTransactionFlow {...defaultProps} />)

    const confirmButton = screen.getByText('Confirm Send')
    await user.click(confirmButton)

    jest.advanceTimersByTime(15000)

    await waitFor(() => {
      expect(screen.getByText('Transaction Hash:')).toBeInTheDocument()
      expect(screen.getByText(MOCK_TX_HASHES.SUCCESS)).toBeInTheDocument()
    }, { timeout: 20000 })
  })

  it('should provide copy transaction hash functionality', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined)
      }
    })

    mockEnhancedAuth.sendUSDC.mockResolvedValue({
      hash: MOCK_TX_HASHES.SUCCESS
    })

    render(<SendTransactionFlow {...defaultProps} />)

    const confirmButton = screen.getByText('Confirm Send')
    await user.click(confirmButton)

    jest.advanceTimersByTime(15000)

    await waitFor(async () => {
      const copyButton = screen.getByRole('button', { name: /copy/i })
      await user.click(copyButton)
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(MOCK_TX_HASHES.SUCCESS)
    }, { timeout: 20000 })
  })

  it('should show block explorer link for valid transaction hash', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    
    mockEnhancedAuth.sendUSDC.mockResolvedValue({
      hash: MOCK_TX_HASHES.SUCCESS
    })

    render(<SendTransactionFlow {...defaultProps} />)

    const confirmButton = screen.getByText('Confirm Send')
    await user.click(confirmButton)

    jest.advanceTimersByTime(15000)

    await waitFor(() => {
      const explorerLink = screen.getByText(/View on/)
      expect(explorerLink).toBeInTheDocument()
    }, { timeout: 20000 })
  })

  it('should handle transaction errors', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    
    mockEnhancedAuth.sendUSDC.mockRejectedValue(new Error('Insufficient funds'))

    render(<SendTransactionFlow {...defaultProps} />)

    const confirmButton = screen.getByText('Confirm Send')
    await user.click(confirmButton)

    jest.advanceTimersByTime(15000)

    await waitFor(() => {
      expect(screen.getByText('Transaction Failed')).toBeInTheDocument()
      expect(screen.getByText('Insufficient balance to complete transaction')).toBeInTheDocument()
    }, { timeout: 20000 })
  })

  it('should handle user rejection errors', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    
    mockEnhancedAuth.sendUSDC.mockRejectedValue(new Error('User rejected the transaction'))

    render(<SendTransactionFlow {...defaultProps} />)

    const confirmButton = screen.getByText('Confirm Send')
    await user.click(confirmButton)

    jest.advanceTimersByTime(15000)

    await waitFor(() => {
      expect(screen.getByText('Transaction was cancelled by user')).toBeInTheDocument()
    }, { timeout: 20000 })
  })

  it('should handle network errors', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    
    mockEnhancedAuth.sendUSDC.mockRejectedValue(new Error('Network connection issue'))

    render(<SendTransactionFlow {...defaultProps} />)

    const confirmButton = screen.getByText('Confirm Send')
    await user.click(confirmButton)

    jest.advanceTimersByTime(15000)

    await waitFor(() => {
      expect(screen.getByText('Network connection issue. Please try again.')).toBeInTheDocument()
    }, { timeout: 20000 })
  })

  it('should handle cancel during confirmation', async () => {
    const user = userEvent.setup()
    const mockOnCancel = jest.fn()

    render(
      <SendTransactionFlow 
        {...defaultProps} 
        onCancel={mockOnCancel}
      />
    )

    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('should handle done after successful transaction', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const mockOnConfirm = jest.fn()
    
    mockEnhancedAuth.sendUSDC.mockResolvedValue({
      hash: MOCK_TX_HASHES.SUCCESS
    })

    render(
      <SendTransactionFlow 
        {...defaultProps} 
        onConfirm={mockOnConfirm}
      />
    )

    const confirmButton = screen.getByText('Confirm Send')
    await user.click(confirmButton)

    jest.advanceTimersByTime(15000)

    await waitFor(async () => {
      const doneButton = screen.getByText('Done')
      await user.click(doneButton)
      
      expect(mockOnConfirm).toHaveBeenCalled()
    }, { timeout: 20000 })
  })

  it('should reset state when modal reopens', () => {
    const { rerender } = render(<SendTransactionFlow {...defaultProps} isOpen={false} />)

    // Open modal
    rerender(<SendTransactionFlow {...defaultProps} isOpen={true} />)

    // Should be back to confirmation state
    expect(screen.getByText('Confirm Transaction')).toBeInTheDocument()
  })

  it('should handle gasless transaction fallback', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    
    // Mock USDC transaction to fail, fallback to gasless
    mockEnhancedAuth.sendUSDC.mockRejectedValue(new Error('USDC transfer failed'))
    mockEnhancedAuth.sendGaslessTransaction.mockResolvedValue({
      hash: MOCK_TX_HASHES.SUCCESS
    })

    const nonUSDCData = {
      ...mockTransactionData,
      stablecoin: 'DAI' as any
    }

    render(
      <SendTransactionFlow 
        {...defaultProps} 
        transactionData={nonUSDCData}
      />
    )

    const confirmButton = screen.getByText('Confirm Send')
    await user.click(confirmButton)

    jest.advanceTimersByTime(15000)

    await waitFor(() => {
      expect(mockEnhancedAuth.sendGaslessTransaction).toHaveBeenCalledWith(
        nonUSDCData.recipient,
        nonUSDCData.amount
      )
    }, { timeout: 20000 })
  })

  it('should show warning for non-gasless transactions', () => {
    const nonGaslessData = {
      ...mockTransactionData,
      useGasless: false
    }

    render(
      <SendTransactionFlow 
        {...defaultProps} 
        transactionData={nonGaslessData}
      />
    )

    expect(screen.queryByText(/Zero gas fees with Account Abstraction/)).not.toBeInTheDocument()
  })

  it('should be accessible', () => {
    render(<SendTransactionFlow {...defaultProps} />)

    // Check for proper heading structure
    expect(screen.getByRole('heading', { name: /Confirm Transaction/i })).toBeInTheDocument()
    
    // Check for buttons with proper labels
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Confirm Send/i })).toBeInTheDocument()
  })
})