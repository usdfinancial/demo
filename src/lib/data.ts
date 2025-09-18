// Stablecoin-focused data models for USD Financial

export type StablecoinSymbol = 'USDC';
export type ChainId = 1 | 137 | 42161 | 10 | 56 | 11155111; // Ethereum, Polygon, Arbitrum, Optimism, BSC, Sepolia

// Re-export types from services for compatibility
export interface TokenBalance {
  address: string
  balance: string
  decimals: number
  symbol: string
  name: string
  rawBalance: string
  network: string
  chainId: number
}

export interface NetworkBalance {
  network: string
  chainId: number
  isTestnet: boolean
  eth: string
  usdc: TokenBalance | null
  error?: string
  errorDetails?: any
  circuitBreakerState?: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  lastSuccessTime?: number
}

export interface AggregatedBalance {
  totalUSDC: string
  networks: NetworkBalance[]
  lastUpdated: Date
}

// Base record interface
interface BaseRecord {
  id: string
  created_at: string
  updated_at: string
}

export interface UserInvestment extends BaseRecord {
  user_id: string
  asset_id: string
  quantity: string
  average_cost: string
  total_invested: string
  current_value: string
  unrealized_pnl: string
  currency: StablecoinSymbol
  is_active: boolean
}

export interface TransactionWithDetails {
  id: string
  networkName?: string
  explorerUrl?: string
  usdValue?: string
  description: string
  amount: string
  date: string
  type: 'deposit' | 'withdrawal' | 'yield' | 'swap' | 'bridge' | 'spend'
  status: 'completed' | 'pending' | 'failed'
}

export interface StablecoinBalance {
  symbol: StablecoinSymbol;
  amount: number;
  chainId: ChainId;
  protocol?: string;
  apy?: number;
  isYieldBearing: boolean;
  contractAddress: string;
}

export interface YieldPosition {
  id: string;
  protocol: string;
  stablecoin: StablecoinSymbol;
  depositAmount: number;
  currentValue: number;
  apy: number;
  duration: number; // days
  chainId: ChainId;
  isActive: boolean;
  lastUpdated: string;
}

export interface StablecoinTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'deposit' | 'withdrawal' | 'yield' | 'swap' | 'bridge' | 'spend';
  status: 'completed' | 'pending' | 'failed';
  stablecoin: StablecoinSymbol;
  chainId: ChainId;
  protocol?: string;
  txHash?: string;
  fromChain?: ChainId;
  toChain?: ChainId;
}

export interface ProtocolInfo {
  id: string;
  name: string;
  type: 'lending' | 'vault' | 'liquidity' | 'yield-aggregator';
  currentApy: number;
  tvl: number; // Total Value Locked
  risk: 'Low' | 'Medium' | 'High';
  description: string;
  supportedStablecoins: StablecoinSymbol[];
  chainIds: ChainId[];
  logoUrl: string;
}

export interface CrossChainBridge {
  id: string;
  name: string;
  fromChain: ChainId;
  toChain: ChainId;
  stablecoin: StablecoinSymbol;
  estimatedTime: string;
  fees: number;
  isActive: boolean;
}

// Stablecoin portfolio data - USDC only
export const stablecoinPortfolio: StablecoinBalance[] = [
  {
    symbol: 'USDC',
    amount: 25431.89,
    chainId: 1,
    protocol: 'Aave',
    apy: 4.2,
    isYieldBearing: true,
    contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  },
  {
    symbol: 'USDC',
    amount: 15200.00,
    chainId: 137,
    protocol: 'Compound',
    apy: 3.8,
    isYieldBearing: true,
    contractAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
  }
];

// Stablecoin transactions
export const mockStablecoinTransactions: StablecoinTransaction[] = [
  {
    id: '1',
    description: 'USDC Yield Earned - Aave',
    amount: 15.42,
    date: '2024-01-15',
    type: 'yield',
    status: 'completed',
    stablecoin: 'USDC',
    chainId: 1,
    protocol: 'Aave',
    txHash: '0x1234...5678'
  },
  {
    id: '2',
    description: 'USDC Deposit',
    amount: 5000.00,
    date: '2024-01-15',
    type: 'deposit',
    status: 'completed',
    stablecoin: 'USDC',
    chainId: 1,
    txHash: '0x2345...6789'
  },
  {
    id: '3',
    description: 'USDC → USDC Swap',
    amount: -500.00,
    date: '2024-01-14',
    type: 'swap',
    status: 'completed',
    stablecoin: 'USDC',
    chainId: 1,
    txHash: '0x3456...7890'
  },
  {
    id: '4',
    description: 'USDC Bridge to Polygon',
    amount: -2000.00,
    date: '2024-01-14',
    type: 'bridge',
    status: 'completed',
    stablecoin: 'USDC',
    chainId: 1,
    fromChain: 1,
    toChain: 137,
    txHash: '0x4567...8901'
  },
  {
    id: '5',
    description: 'Stablecoin Card Payment - Amazon',
    amount: -89.99,
    date: '2024-01-13',
    type: 'spend',
    status: 'completed',
    stablecoin: 'USDC',
    chainId: 1,
    txHash: '0x5678...9012'
  },
  {
    id: '6',
    description: 'USDC Yield Earned - Convex',
    amount: 28.75,
    date: '2024-01-13',
    type: 'yield',
    status: 'completed',
    stablecoin: 'USDC',
    chainId: 42161,
    protocol: 'Convex',
    txHash: '0x6789...0123'
  },
  {
    id: '7',
    description: 'USDC Deposit to Yearn Vault',
    amount: 3000.00,
    date: '2024-01-12',
    type: 'deposit',
    status: 'completed',
    stablecoin: 'USDC',
    chainId: 1,
    protocol: 'Yearn',
    txHash: '0x7890...1234'
  },
  {
    id: '8',
    description: 'USDC Withdrawal',
    amount: -1200.00,
    date: '2024-01-12',
    type: 'withdrawal',
    status: 'completed',
    stablecoin: 'USDC',
    chainId: 1,
    txHash: '0x8901...2345'
  },
  {
    id: '9',
    description: 'USDC Yield Earned - Compound',
    amount: 12.33,
    date: '2024-01-11',
    type: 'yield',
    status: 'completed',
    stablecoin: 'USDC',
    chainId: 137,
    protocol: 'Compound',
    txHash: '0x9012...3456'
  },
  {
    id: '10',
    description: 'USDC Bridge from Arbitrum',
    amount: 2500.00,
    date: '2024-01-10',
    type: 'bridge',
    status: 'pending',
    stablecoin: 'USDC',
    chainId: 42161,
    fromChain: 42161,
    toChain: 1,
    txHash: '0x0123...4567'
  }
];

// Yield positions data
export const yieldPositions: YieldPosition[] = [
  {
    id: '1',
    protocol: 'Aave',
    stablecoin: 'USDC',
    depositAmount: 25000.00,
    currentValue: 25431.89,
    apy: 4.2,
    duration: 45,
    chainId: 1,
    isActive: true,
    lastUpdated: '2024-01-15'
  },
  {
    id: '2',
    protocol: 'Compound',
    stablecoin: 'USDC',
    depositAmount: 15000.00,
    currentValue: 15200.00,
    apy: 3.8,
    duration: 32,
    chainId: 137,
    isActive: true,
    lastUpdated: '2024-01-15'
  },
  {
    id: '3',
    protocol: 'Yearn',
    stablecoin: 'USDC',
    depositAmount: 8500.00,
    currentValue: 8750.50,
    apy: 5.1,
    duration: 28,
    chainId: 1,
    isActive: true,
    lastUpdated: '2024-01-15'
  },
  {
    id: '4',
    protocol: 'Convex',
    stablecoin: 'USDC',
    depositAmount: 3000.00,
    currentValue: 3200.00,
    apy: 6.8,
    duration: 18,
    chainId: 42161,
    isActive: true,
    lastUpdated: '2024-01-15'
  }
];

// DeFi protocols supporting stablecoins
export const protocolsData: ProtocolInfo[] = [
  {
    id: 'aave',
    name: 'Aave',
    type: 'lending',
    currentApy: 4.2,
    tvl: 8500000000,
    risk: 'Low',
    description: 'Leading decentralized lending protocol with battle-tested security',
    supportedStablecoins: ['USDC'],
    chainIds: [1, 137, 42161],
    logoUrl: '/logos/aave.svg'
  },
  {
    id: 'compound',
    name: 'Compound',
    type: 'lending',
    currentApy: 3.8,
    tvl: 2800000000,
    risk: 'Low',
    description: 'Autonomous interest rate protocol for crypto assets',
    supportedStablecoins: ['USDC'],
    chainIds: [1, 137],
    logoUrl: '/logos/compound.svg'
  },
  {
    id: 'yearn',
    name: 'Yearn Finance',
    type: 'yield-aggregator',
    currentApy: 5.1,
    tvl: 1200000000,
    risk: 'Medium',
    description: 'Automated yield farming strategies for maximum returns',
    supportedStablecoins: ['USDC'],
    chainIds: [1, 42161],
    logoUrl: '/logos/yearn.svg'
  },
  {
    id: 'convex',
    name: 'Convex Finance',
    type: 'yield-aggregator',
    currentApy: 6.8,
    tvl: 3200000000,
    risk: 'Medium',
    description: 'Boosted Curve yields with simplified staking',
    supportedStablecoins: ['USDC'],
    chainIds: [1, 42161],
    logoUrl: '/logos/convex.svg'
  },
  {
    id: 'curve',
    name: 'Curve Finance',
    type: 'liquidity',
    currentApy: 4.5,
    tvl: 4100000000,
    risk: 'Low',
    description: 'Efficient stablecoin trading with minimal slippage',
    supportedStablecoins: ['USDC'],
    chainIds: [1, 137, 42161],
    logoUrl: '/logos/curve.svg'
  }
];

// Total stablecoin portfolio value
export const totalPortfolioValue = stablecoinPortfolio.reduce((sum, balance) => sum + balance.amount, 0);

// Portfolio balance change (yield earnings)
export const portfolioChange = {
  amount: 856.39, // Total yield earned this month
  percentage: 1.8,
  isPositive: true
};

// User data
export const mockUser = {
  name: 'Alex Johnson',
  email: 'alex.johnson@usdfinancial.com',
  avatar: '/api/placeholder/40/40',
  initials: 'AJ',
  totalYieldEarned: 2847.52,
  accountCreated: '2023-08-15'
};

// Stablecoin allocation chart config
export const stablecoinChartConfig = {
  'USDC': {
    label: 'USDC',
    color: 'hsl(220, 70%, 50%)', // Blue
  },
};

// Cross-chain bridge options
export const bridgeOptions: CrossChainBridge[] = [
  {
    id: 'usdc-eth-polygon',
    name: 'USDC: Ethereum → Polygon',
    fromChain: 1,
    toChain: 137,
    stablecoin: 'USDC',
    estimatedTime: '5-10 minutes',
    fees: 2.50,
    isActive: true
  },
  {
    id: 'usdc-eth-arbitrum',
    name: 'USDC: Ethereum → Arbitrum',
    fromChain: 1,
    toChain: 42161,
    stablecoin: 'USDC',
    estimatedTime: '2-5 minutes',
    fees: 1.80,
    isActive: true
  },
  {
    id: 'dai-eth-optimism',
    name: 'USDC: Ethereum → Optimism',
    fromChain: 1,
    toChain: 10,
    stablecoin: 'USDC',
    estimatedTime: '1-3 minutes',
    fees: 1.20,
    isActive: true
  }
];

// Helper functions
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function getStablecoinIcon(symbol: StablecoinSymbol): string {
  const iconMap: Record<StablecoinSymbol, string> = {
    'USDC': '🔵' // Blue circle for USDC
  };
  return iconMap[symbol] || '💰';
}

export function getTransactionTypeIcon(type: StablecoinTransaction['type']): string {
  const iconMap: Record<StablecoinTransaction['type'], string> = {
    'deposit': '⬇️',
    'withdrawal': '⬆️', 
    'yield': '📈',
    'swap': '🔄',
    'bridge': '🌉',
    'spend': '💳'
  };
  return iconMap[type] || '💰';
}

export function getChainName(chainId: ChainId): string {
  const chainNames: Record<ChainId, string> = {
    1: 'Ethereum',
    137: 'Polygon',
    42161: 'Arbitrum',
    10: 'Optimism',
    56: 'BSC',
    11155111: 'Sepolia Testnet'
  };
  return chainNames[chainId] || 'Unknown';
}

export function calculateTotalYield(): number {
  return yieldPositions.reduce((total, position) => {
    return total + (position.currentValue - position.depositAmount);
  }, 0);
}

export function getWeightedAverageAPY(): number {
  const totalValue = yieldPositions.reduce((sum, pos) => sum + pos.currentValue, 0);
  const weightedSum = yieldPositions.reduce((sum, pos) => {
    return sum + (pos.apy * pos.currentValue);
  }, 0);
  return totalValue > 0 ? weightedSum / totalValue : 0;
}

// ============================================================================
// COMPREHENSIVE DEMO DATA FOR ALL MODULES
// ============================================================================

// Loan Products and User Loans
export interface LoanProduct {
  id: string
  name: string
  maxLTV: number
  interestRate: number
  minAmount: number
  maxAmount: number
  description: string
  collateralTypes: StablecoinSymbol[]
  features: string[]
}

export interface UserLoan {
  id: string
  productName: string
  principalAmount: number
  outstandingBalance: number
  interestRate: number
  collateralValue: number
  ltv: number
  status: 'active' | 'pending' | 'completed' | 'defaulted'
  nextPayment: string
  monthlyPayment: number
  startDate: string
  maturityDate: string
  collateralType: StablecoinSymbol
}

export const loanProducts: LoanProduct[] = [
  {
    id: '1',
    name: 'Standard USDC Loan',
    maxLTV: 50,
    interestRate: 8.5,
    minAmount: 1000,
    maxAmount: 100000,
    description: 'Flexible USDC-collateralized loan with competitive rates',
    collateralTypes: ['USDC'],
    features: ['No credit check', 'Instant approval', 'Flexible terms', 'Early repayment']
  },
  {
    id: '2',
    name: 'Premium USDC Loan',
    maxLTV: 65,
    interestRate: 6.8,
    minAmount: 10000,
    maxAmount: 500000,
    description: 'Premium loan product for high-value collateral',
    collateralTypes: ['USDC'],
    features: ['Higher LTV', 'Lower rates', 'Priority support', 'Custom terms']
  },
  {
    id: '3',
    name: 'Business USDC Loan',
    maxLTV: 70,
    interestRate: 7.2,
    minAmount: 25000,
    maxAmount: 1000000,
    description: 'Corporate lending solution for business needs',
    collateralTypes: ['USDC'],
    features: ['Business rates', 'Bulk processing', 'API access', 'Multi-user']
  }
]

export const userLoans: UserLoan[] = [
  {
    id: '1',
    productName: 'Standard USDC Loan',
    principalAmount: 15000,
    outstandingBalance: 12500,
    interestRate: 8.5,
    collateralValue: 30000,
    ltv: 41.7,
    status: 'active',
    nextPayment: '2024-02-15',
    monthlyPayment: 450,
    startDate: '2023-08-15',
    maturityDate: '2025-08-15',
    collateralType: 'USDC'
  },
  {
    id: '2',
    productName: 'Premium USDC Loan',
    principalAmount: 50000,
    outstandingBalance: 48200,
    interestRate: 6.8,
    collateralValue: 80000,
    ltv: 60.3,
    status: 'active',
    nextPayment: '2024-02-20',
    monthlyPayment: 1250,
    startDate: '2023-12-01',
    maturityDate: '2026-12-01',
    collateralType: 'USDC'
  }
]

// Insurance Products and Policies
export interface InsuranceProduct {
  id: string
  name: string
  type: 'smart_contract' | 'defi_protocol' | 'exchange' | 'wallet'
  coverage: number
  premium: number
  description: string
  features: string[]
  riskLevel: 'Low' | 'Medium' | 'High'
}

export interface UserInsurancePolicy {
  id: string
  productName: string
  coverageAmount: number
  premiumPaid: number
  status: 'active' | 'expired' | 'claimed' | 'pending'
  startDate: string
  endDate: string
  claimsCount: number
  protectedAssets: string[]
}

export const insuranceProducts: InsuranceProduct[] = [
  {
    id: '1',
    name: 'DeFi Protocol Protection',
    type: 'defi_protocol',
    coverage: 100000,
    premium: 2.5,
    description: 'Protect your DeFi investments against smart contract risks',
    features: ['Smart contract coverage', '24/7 monitoring', 'Instant claims', 'Multi-protocol'],
    riskLevel: 'Medium'
  },
  {
    id: '2',
    name: 'Wallet Security Insurance',
    type: 'wallet',
    coverage: 50000,
    premium: 1.8,
    description: 'Comprehensive wallet protection against hacks and theft',
    features: ['Private key protection', 'Phishing coverage', 'Hardware wallet', 'Recovery support'],
    riskLevel: 'Low'
  },
  {
    id: '3',
    name: 'Exchange Risk Coverage',
    type: 'exchange',
    coverage: 250000,
    premium: 3.2,
    description: 'Protect funds held on centralized exchanges',
    features: ['Exchange insolvency', 'Hack protection', 'Regulatory coverage', 'Instant payout'],
    riskLevel: 'High'
  }
]

export const userInsurancePolicies: UserInsurancePolicy[] = [
  {
    id: '1',
    productName: 'DeFi Protocol Protection',
    coverageAmount: 100000,
    premiumPaid: 2500,
    status: 'active',
    startDate: '2023-09-01',
    endDate: '2024-09-01',
    claimsCount: 0,
    protectedAssets: ['Aave USDC', 'Compound USDC', 'Yearn USDC']
  },
  {
    id: '2',
    productName: 'Wallet Security Insurance',
    coverageAmount: 50000,
    premiumPaid: 900,
    status: 'active',
    startDate: '2023-10-15',
    endDate: '2024-10-15',
    claimsCount: 0,
    protectedAssets: ['Smart Wallet', 'Hardware Wallet']
  }
]

// Business Services and Metrics
export interface BusinessService {
  id: string
  name: string
  description: string
  category: 'payments' | 'treasury' | 'lending' | 'compliance' | 'analytics'
  features: string[]
  pricing: string
  status: 'active' | 'coming-soon' | 'beta'
}

export interface BusinessMetrics {
  totalRevenue: number
  monthlyTransactions: number
  activeEmployees: number
  complianceScore: number
  monthlyGrowth: number
  averageTransactionSize: number
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'employee' | 'viewer'
  permissions: string[]
  lastActive: string
  status: 'active' | 'inactive' | 'pending'
}

export const businessServices: BusinessService[] = [
  {
    id: '1',
    name: 'Business Payments',
    description: 'Accept USDC payments from customers worldwide',
    category: 'payments',
    features: ['Global payments', 'Instant settlement', 'Low fees', 'Multi-currency'],
    pricing: '0.5% per transaction',
    status: 'active'
  },
  {
    id: '2',
    name: 'Treasury Management',
    description: 'Manage corporate funds with yield optimization',
    category: 'treasury',
    features: ['Yield farming', 'Risk management', 'Automated strategies', 'Real-time reporting'],
    pricing: '0.25% management fee',
    status: 'active'
  },
  {
    id: '3',
    name: 'Corporate Lending',
    description: 'Access to institutional lending products',
    category: 'lending',
    features: ['Bulk lending', 'Custom terms', 'API integration', 'Multi-signature'],
    pricing: 'Custom pricing',
    status: 'beta'
  },
  {
    id: '4',
    name: 'Compliance Suite',
    description: 'Automated compliance and reporting tools',
    category: 'compliance',
    features: ['AML screening', 'KYC automation', 'Regulatory reporting', 'Audit trails'],
    pricing: '$500/month',
    status: 'active'
  },
  {
    id: '5',
    name: 'Business Analytics',
    description: 'Advanced analytics and reporting dashboard',
    category: 'analytics',
    features: ['Real-time dashboards', 'Custom reports', 'API access', 'Data export'],
    pricing: '$200/month',
    status: 'active'
  }
]

export const businessMetrics: BusinessMetrics = {
  totalRevenue: 2847500,
  monthlyTransactions: 1247,
  activeEmployees: 12,
  complianceScore: 98,
  monthlyGrowth: 15.7,
  averageTransactionSize: 2284
}

export const teamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    role: 'admin',
    permissions: ['full_access', 'user_management', 'financial_operations', 'compliance'],
    lastActive: '2024-01-15T10:30:00Z',
    status: 'active'
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.chen@company.com',
    role: 'manager',
    permissions: ['financial_operations', 'reporting', 'team_management'],
    lastActive: '2024-01-15T09:15:00Z',
    status: 'active'
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@company.com',
    role: 'employee',
    permissions: ['basic_operations', 'reporting'],
    lastActive: '2024-01-14T16:45:00Z',
    status: 'active'
  },
  {
    id: '4',
    name: 'David Kim',
    email: 'david.kim@company.com',
    role: 'viewer',
    permissions: ['view_only'],
    lastActive: '2024-01-13T11:20:00Z',
    status: 'inactive'
  }
]

// Enhanced Transaction Data
export interface EnhancedTransaction {
  id: string
  type: 'deposit' | 'withdrawal' | 'transfer' | 'payment' | 'exchange' | 'yield' | 'loan' | 'insurance'
  amount: number
  currency: StablecoinSymbol
  description: string
  status: 'completed' | 'pending' | 'failed' | 'cancelled'
  timestamp: string
  recipient?: string
  sender?: string
  fee?: number
  category?: string
  tags?: string[]
  chainId?: ChainId
  txHash?: string
  merchantInfo?: {
    name: string
    category: string
    location?: string
  }
}

export const enhancedTransactions: EnhancedTransaction[] = [
  {
    id: '1',
    type: 'deposit',
    amount: 5000,
    currency: 'USDC',
    description: 'Deposit from Bank Transfer',
    status: 'completed',
    timestamp: '2024-01-15T10:30:00Z',
    fee: 0,
    category: 'funding',
    tags: ['bank', 'deposit'],
    chainId: 1
  },
  {
    id: '2',
    type: 'payment',
    amount: -89.99,
    currency: 'USDC',
    description: 'Amazon Purchase',
    status: 'completed',
    timestamp: '2024-01-15T09:15:00Z',
    recipient: 'Amazon',
    fee: 0.50,
    category: 'shopping',
    tags: ['retail', 'online'],
    merchantInfo: {
      name: 'Amazon',
      category: 'E-commerce',
      location: 'Online'
    }
  },
  {
    id: '3',
    type: 'yield',
    amount: 24.50,
    currency: 'USDC',
    description: 'Aave Yield Earned',
    status: 'completed',
    timestamp: '2024-01-14T16:45:00Z',
    fee: 0,
    category: 'earning',
    tags: ['defi', 'yield'],
    chainId: 1
  },
  {
    id: '4',
    type: 'transfer',
    amount: -1500,
    currency: 'USDC',
    description: 'Transfer to John Doe',
    status: 'completed',
    timestamp: '2024-01-14T14:20:00Z',
    recipient: 'john.doe@email.com',
    fee: 1.00,
    category: 'transfer',
    tags: ['p2p', 'personal'],
    chainId: 137
  },
  {
    id: '5',
    type: 'loan',
    amount: 15000,
    currency: 'USDC',
    description: 'Loan Disbursement - Standard USDC Loan',
    status: 'completed',
    timestamp: '2024-01-10T11:00:00Z',
    fee: 150,
    category: 'lending',
    tags: ['loan', 'credit']
  }
]

// Investment Assets and Portfolio Data
export interface TokenizedAsset {
  id: string
  name: string
  symbol: string
  type: 'treasury' | 'real_estate' | 'commodities' | 'corporate_bonds' | 'equity'
  price: number
  change24h: number
  marketCap: number
  yield: number
  description: string
  riskLevel: 'Low' | 'Medium' | 'High'
  minimumInvestment: number
}

export interface UserInvestmentPosition {
  id: string
  assetId: string
  assetName: string
  quantity: number
  averageCost: number
  currentValue: number
  unrealizedPnL: number
  realizedPnL: number
  yieldEarned: number
  purchaseDate: string
  status: 'active' | 'sold' | 'pending'
}

export const tokenizedAssets: TokenizedAsset[] = [
  {
    id: '1',
    name: 'US Treasury Bills 3M',
    symbol: 'USTB3M',
    type: 'treasury',
    price: 100.25,
    change24h: 0.12,
    marketCap: 2500000000,
    yield: 5.2,
    description: '3-month US Treasury Bills tokenized for easy access',
    riskLevel: 'Low',
    minimumInvestment: 1000
  },
  {
    id: '2',
    name: 'Real Estate Index Fund',
    symbol: 'REIF',
    type: 'real_estate',
    price: 45.80,
    change24h: 1.8,
    marketCap: 850000000,
    yield: 7.5,
    description: 'Diversified real estate investment fund',
    riskLevel: 'Medium',
    minimumInvestment: 500
  },
  {
    id: '3',
    name: 'Gold Token',
    symbol: 'GOLD',
    type: 'commodities',
    price: 2024.50,
    change24h: -0.5,
    marketCap: 1200000000,
    yield: 0,
    description: 'Physical gold backed digital token',
    riskLevel: 'Medium',
    minimumInvestment: 100
  },
  {
    id: '4',
    name: 'Corporate Bond Index',
    symbol: 'CBOND',
    type: 'corporate_bonds',
    price: 98.75,
    change24h: 0.3,
    marketCap: 3200000000,
    yield: 6.8,
    description: 'Investment grade corporate bond index',
    riskLevel: 'Low',
    minimumInvestment: 1000
  }
]

export const userInvestmentPositions: UserInvestmentPosition[] = [
  {
    id: '1',
    assetId: '1',
    assetName: 'US Treasury Bills 3M',
    quantity: 100,
    averageCost: 99.80,
    currentValue: 10025,
    unrealizedPnL: 245,
    realizedPnL: 0,
    yieldEarned: 156.50,
    purchaseDate: '2023-11-15',
    status: 'active'
  },
  {
    id: '2',
    assetId: '2',
    assetName: 'Real Estate Index Fund',
    quantity: 50,
    averageCost: 44.20,
    currentValue: 2290,
    unrealizedPnL: 80,
    realizedPnL: 125,
    yieldEarned: 89.25,
    purchaseDate: '2023-10-01',
    status: 'active'
  },
  {
    id: '3',
    assetId: '3',
    assetName: 'Gold Token',
    quantity: 2.5,
    averageCost: 2010.00,
    currentValue: 5061.25,
    unrealizedPnL: 36.25,
    realizedPnL: 0,
    yieldEarned: 0,
    purchaseDate: '2023-12-01',
    status: 'active'
  }
]

// Auto-Investment Plans
export interface AutoInvestPlan {
  id: string
  name: string
  targetAllocation: { assetId: string; percentage: number }[]
  monthlyAmount: number
  frequency: 'weekly' | 'monthly' | 'quarterly'
  status: 'active' | 'paused' | 'cancelled'
  startDate: string
  nextExecution: string
  totalInvested: number
  currentValue: number
  strategy: 'conservative' | 'moderate' | 'aggressive'
}

export const autoInvestPlans: AutoInvestPlan[] = [
  {
    id: '1',
    name: 'Conservative Growth',
    targetAllocation: [
      { assetId: '1', percentage: 60 }, // Treasury Bills
      { assetId: '4', percentage: 30 }, // Corporate Bonds
      { assetId: '2', percentage: 10 }  // Real Estate
    ],
    monthlyAmount: 1000,
    frequency: 'monthly',
    status: 'active',
    startDate: '2023-09-01',
    nextExecution: '2024-02-01',
    totalInvested: 5000,
    currentValue: 5247.50,
    strategy: 'conservative'
  },
  {
    id: '2',
    name: 'Balanced Portfolio',
    targetAllocation: [
      { assetId: '1', percentage: 40 }, // Treasury Bills
      { assetId: '2', percentage: 35 }, // Real Estate
      { assetId: '4', percentage: 25 }  // Corporate Bonds
    ],
    monthlyAmount: 2000,
    frequency: 'monthly',
    status: 'active',
    startDate: '2023-10-15',
    nextExecution: '2024-02-15',
    totalInvested: 8000,
    currentValue: 8456.80,
    strategy: 'moderate'
  }
]

// Backward compatibility exports
export const mockTransactions = mockStablecoinTransactions;
export const accountBalance = totalPortfolioValue;
export const balanceChange = portfolioChange;