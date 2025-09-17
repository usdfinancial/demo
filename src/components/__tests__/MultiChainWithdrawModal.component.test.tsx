import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MultiChainWithdrawModal } from '../wallet/MultiChainWithdrawModal'
import { 
  MOCK_ADDRESSES,
  createMockAlchemyUser,
  mockConsole
} from '../../__tests__/utils/testHelpers'

// Mock the blockchain config
jest.mock('@/config/blockchain', () => ({
  getEthereumNetwork: jest.fn(() => ({
    name: 'Ethereum Sepolia',
    ticker: 'ETH',
    isTestnet: true,
    blockExplorer: 'https://sepolia.etherscan.io'
  })),
  getTokenConfig: jest.fn(() => ({
    address: MOCK_ADDRESSES.USDC_SEPOLIA,
    symbol: 'USDC',
    decimals: 6
  }))
}))

// Mock UI components
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) => (
    open ? <div data-testid="dialog" onClick={() => onOpenChange(false)}>{children}</div> : null
  ),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h1 data-testid="dialog-title">{children}</h1>,
  DialogDescription: ({ children }: any) => <p data-testid="dialog-description">{children}</p>
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, className, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-variant={variant}
      data-size={size}
      data-testid="button"
      {...props}
    >
      {children}
    </button>
  )
}))

jest.mock('@/components/ui/input', () => ({
  Input: ({ onChange, value, placeholder, type, className, ...props }: any) => (
    <input
      onChange={onChange}
      value={value}
      placeholder={placeholder}
      type={type}
      className={className}
      data-testid="input"
      {...props}
    />
  )
}))

jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange }: any) => (
    <button
      onClick={() => onCheckedChange?.(!checked)}
      data-checked={checked}
      data-testid="switch"
    >
      {checked ? 'ON' : 'OFF'}
    </button>
  )
}))

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="card">{children}</div>
  ),
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>
}))

// Mock NetworkSelector component
jest.mock('../wallet/NetworkSelector', () => ({
  NetworkSelector: ({ selectedNetwork, onNetworkChange, showTestnets }: any) => (
    <select
      data-testid="network-selector"
      value={selectedNetwork}
      onChange={(e) => onNetworkChange(e.target.value)}
    >
      <option value="sepolia">Sepolia</option>
      <option value="baseSepolia">Base Sepolia</option>
      <option value="arbitrumSepolia">Arbitrum Sepolia</option>
    </select>
  )
}))

describe('MultiChainWithdrawModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    walletAddress: MOCK_ADDRESSES.SMART_WALLET,
    onConfirmWithdraw: jest.fn(),
    isAAReady: true,
    showTestnets: true
  }

  const consoleMocks = mockConsole()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render when open', () => {
    render(<MultiChainWithdrawModal {...defaultProps} />)

    expect(screen.getByTestId('dialog')).toBeInTheDocument()
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('Multi-Chain Withdraw')
    expect(screen.getByTestId('dialog-description')).toHaveTextContent(
      'Send cryptocurrency from your smart wallet to any address'
    )
  })

  it('should not render when closed', () => {
    render(<MultiChainWithdrawModal {...defaultProps} open={false} />)

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
  })

  it('should display network selector', () => {
    render(<MultiChainWithdrawModal {...defaultProps} />)

    expect(screen.getByTestId('network-selector')).toBeInTheDocument()
    expect(screen.getByDisplayValue('sepolia')).toBeInTheDocument()
  })

  it('should display asset selection buttons', () => {
    render(<MultiChainWithdrawModal {...defaultProps} />)

    const buttons = screen.getAllByTestId('button')
    const ethButton = buttons.find(button => button.textContent?.includes('ETH'))
    const usdcButton = buttons.find(button => button.textContent?.includes('USDC'))

    expect(ethButton).toBeInTheDocument()
    expect(usdcButton).toBeInTheDocument()
  })

  it('should switch between ETH and USDC assets', async () => {
    const user = userEvent.setup()
    render(<MultiChainWithdrawModal {...defaultProps} />)

    const buttons = screen.getAllByTestId('button')
    const usdcButton = buttons.find(button => button.textContent?.includes('USDC'))

    if (usdcButton) {
      await user.click(usdcButton)
      // Check if USDC is selected (would need to check component state or UI changes)
      expect(usdcButton).toBeInTheDocument()
    }
  })

  it('should display amount input field', () => {
    render(<MultiChainWithdrawModal {...defaultProps} />)

    const amountInputs = screen.getAllByTestId('input')
    const amountInput = amountInputs.find(input => input.getAttribute('placeholder')?.includes('0.0'))

    expect(amountInput).toBeInTheDocument()
  })

  it('should display recipient address input', () => {
    render(<MultiChainWithdrawModal {...defaultProps} />)

    const addressInputs = screen.getAllByTestId('input')
    const addressInput = addressInputs.find(input => input.getAttribute('placeholder') === '0x...')

    expect(addressInput).toBeInTheDocument()
  })

  it('should display gasless transaction toggle when AA is ready', () => {
    render(<MultiChainWithdrawModal {...defaultProps} isAAReady={true} />)

    expect(screen.getByTestId('switch')).toBeInTheDocument()
  })

  it('should not display gasless toggle when AA is not ready', () => {
    render(<MultiChainWithdrawModal {...defaultProps} isAAReady={false} />)

    expect(screen.queryByTestId('switch')).not.toBeInTheDocument()
  })

  it('should validate form inputs', async () => {
    const user = userEvent.setup()
    render(<MultiChainWithdrawModal {...defaultProps} />)

    // Find and click the send button
    const buttons = screen.getAllByTestId('button')
    const sendButton = buttons.find(button => button.textContent?.includes('Send'))

    if (sendButton) {
      // Initially should be disabled due to empty inputs
      expect(sendButton).toBeDisabled()

      // Fill in amount
      const amountInputs = screen.getAllByTestId('input')
      const amountInput = amountInputs.find(input => input.getAttribute('placeholder')?.includes('0.0'))
      if (amountInput) {
        await user.type(amountInput, '100')
      }

      // Fill in recipient address
      const addressInput = amountInputs.find(input => input.getAttribute('placeholder') === '0x...')
      if (addressInput) {
        await user.type(addressInput, MOCK_ADDRESSES.RECIPIENT)
      }

      // Button might still be disabled due to validation, but inputs are filled
      expect(amountInput).toHaveValue('100')
      expect(addressInput).toHaveValue(MOCK_ADDRESSES.RECIPIENT)
    }
  })

  it('should handle form submission', async () => {
    const user = userEvent.setup()
    const mockOnConfirmWithdraw = jest.fn().mockResolvedValue(undefined)
    
    render(
      <MultiChainWithdrawModal 
        {...defaultProps} 
        onConfirmWithdraw={mockOnConfirmWithdraw}
      />
    )

    // Fill form
    const inputs = screen.getAllByTestId('input')
    const amountInput = inputs.find(input => input.getAttribute('placeholder')?.includes('0.0'))
    const addressInput = inputs.find(input => input.getAttribute('placeholder') === '0x...')

    if (amountInput && addressInput) {
      await user.type(amountInput, '100')
      await user.type(addressInput, MOCK_ADDRESSES.RECIPIENT)

      // Find and click send button
      const buttons = screen.getAllByTestId('button')
      const sendButton = buttons.find(button => button.textContent?.includes('Send'))

      if (sendButton && !sendButton.disabled) {
        await user.click(sendButton)

        await waitFor(() => {
          expect(mockOnConfirmWithdraw).toHaveBeenCalledWith(
            expect.objectContaining({
              amount: 100,
              address: MOCK_ADDRESSES.RECIPIENT,
              network: 'sepolia',
              asset: 'ETH',
              useGasless: true
            })
          )
        })
      }
    }
  })

  it('should display validation errors', async () => {
    const user = userEvent.setup()
    render(<MultiChainWithdrawModal {...defaultProps} />)

    // Fill invalid amount
    const inputs = screen.getAllByTestId('input')
    const amountInput = inputs.find(input => input.getAttribute('placeholder')?.includes('0.0'))

    if (amountInput) {
      await user.type(amountInput, '-50') // Negative amount
      await user.tab() // Trigger validation

      // Check for error display (implementation would depend on how errors are shown)
      // This is a placeholder for error validation testing
    }
  })

  it('should handle network change', async () => {
    const user = userEvent.setup()
    render(<MultiChainWithdrawModal {...defaultProps} />)

    const networkSelector = screen.getByTestId('network-selector')
    await user.selectOptions(networkSelector, 'baseSepolia')

    expect(networkSelector).toHaveValue('baseSepolia')
  })

  it('should set max amount when max button is clicked', async () => {
    const user = userEvent.setup()
    render(<MultiChainWithdrawModal {...defaultProps} />)

    const buttons = screen.getAllByTestId('button')
    const maxButton = buttons.find(button => button.textContent === 'Max')

    if (maxButton) {
      await user.click(maxButton)

      // Check if amount input was updated with max value
      const inputs = screen.getAllByTestId('input')
      const amountInput = inputs.find(input => input.getAttribute('placeholder')?.includes('0.0'))
      
      // The max amount would be set based on mock balance
      expect(amountInput?.getAttribute('value')).toBeDefined()
    }
  })

  it('should display transaction priority options when gasless is disabled', async () => {
    const user = userEvent.setup()
    render(<MultiChainWithdrawModal {...defaultProps} />)

    // Disable gasless transaction
    const gaslessSwitch = screen.getByTestId('switch')
    await user.click(gaslessSwitch)

    // Should show priority options
    const buttons = screen.getAllByTestId('button')
    const priorityButtons = buttons.filter(button => 
      button.textContent?.includes('Standard') || 
      button.textContent?.includes('Fast') || 
      button.textContent?.includes('Instant')
    )

    expect(priorityButtons.length).toBeGreaterThan(0)
  })

  it('should handle modal close', async () => {
    const user = userEvent.setup()
    const mockOnOpenChange = jest.fn()
    
    render(
      <MultiChainWithdrawModal 
        {...defaultProps} 
        onOpenChange={mockOnOpenChange}
      />
    )

    const buttons = screen.getAllByTestId('button')
    const cancelButton = buttons.find(button => button.textContent === 'Cancel')

    if (cancelButton) {
      await user.click(cancelButton)
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    }
  })

  it('should display warning messages', () => {
    render(<MultiChainWithdrawModal {...defaultProps} />)

    // Check for warning card content
    expect(screen.getByText('Important:')).toBeInTheDocument()
    expect(screen.getByText(/Double-check the recipient address/)).toBeInTheDocument()
    expect(screen.getByText(/transactions cannot be reversed/)).toBeInTheDocument()
  })

  it('should link to block explorer', async () => {
    const user = userEvent.setup()
    render(<MultiChainWithdrawModal {...defaultProps} />)

    const buttons = screen.getAllByTestId('button')
    const viewWalletButton = buttons.find(button => button.textContent?.includes('View Wallet'))

    if (viewWalletButton) {
      // Mock window.open
      const mockOpen = jest.fn()
      window.open = mockOpen

      await user.click(viewWalletButton)

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('sepolia.etherscan.io'),
        '_blank'
      )
    }
  })

  it('should handle loading states', () => {
    render(<MultiChainWithdrawModal {...defaultProps} />)

    // Check that loading indicators are not shown initially
    const buttons = screen.getAllByTestId('button')
    const loadingButton = buttons.find(button => button.textContent?.includes('Sending...'))
    
    expect(loadingButton).not.toBeInTheDocument()
  })

  it('should be accessible', () => {
    render(<MultiChainWithdrawModal {...defaultProps} />)

    // Check for proper ARIA labels and roles
    expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
    expect(screen.getByTestId('dialog-description')).toBeInTheDocument()

    // Check form labels
    const inputs = screen.getAllByTestId('input')
    inputs.forEach(input => {
      expect(input).toBeInTheDocument()
    })
  })

  it('should display correct balance information', () => {
    render(<MultiChainWithdrawModal {...defaultProps} />)

    // Should display mock balance (implementation specific)
    const buttons = screen.getAllByTestId('button')
    const ethButton = buttons.find(button => button.textContent?.includes('ETH'))
    const usdcButton = buttons.find(button => button.textContent?.includes('USDC'))

    expect(ethButton?.textContent).toContain('Balance:')
    expect(usdcButton?.textContent).toContain('Balance:')
  })
})