import { EnhancedUser } from '@/components/providers/EnhancedAuthProvider'

export interface DemoUser extends EnhancedUser {
  password: string
  accountType: 'personal' | 'business' | 'premium'
  balance: number
  joinDate: string
  lastLogin: string
  preferences: {
    currency: 'USDC'
    notifications: boolean
    twoFactorAuth: boolean
  }
  portfolio: {
    totalValue: number
    monthlyGain: number
    riskScore: number
  }
}

export const demoUsers: DemoUser[] = [
  {
    id: 'demo-user-1',
    name: 'John Anderson',
    email: 'john@example.com',
    password: 'demo123',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    accountType: 'personal',
    balance: 125750.50,
    joinDate: '2023-08-15',
    lastLogin: new Date().toISOString(),
    preferences: {
      currency: 'USDC',
      notifications: true,
      twoFactorAuth: false
    },
    portfolio: {
      totalValue: 125750.50,
      monthlyGain: 8.2,
      riskScore: 75
    }
  },
  {
    id: 'demo-user-2',
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    password: 'demo123',
    image: 'https://images.unsplash.com/photo-1494790108755-2616b22e5e1f?w=150&h=150&fit=crop&crop=face',
    accountType: 'premium',
    balance: 285640.75,
    joinDate: '2023-06-22',
    lastLogin: new Date().toISOString(),
    preferences: {
      currency: 'USDC',
      notifications: true,
      twoFactorAuth: true
    },
    portfolio: {
      totalValue: 285640.75,
      monthlyGain: 12.5,
      riskScore: 65
    }
  },
  {
    id: 'demo-user-3',
    name: 'Michael Rodriguez',
    email: 'michael@example.com',
    password: 'demo123',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    accountType: 'business',
    balance: 750000.00,
    joinDate: '2023-03-10',
    lastLogin: new Date().toISOString(),
    preferences: {
      currency: 'USDC',
      notifications: true,
      twoFactorAuth: true
    },
    portfolio: {
      totalValue: 750000.00,
      monthlyGain: 15.8,
      riskScore: 85
    }
  },
  {
    id: 'demo-user-4',
    name: 'Emma Thompson',
    email: 'emma@example.com',
    password: 'demo123',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    accountType: 'personal',
    balance: 52850.25,
    joinDate: '2023-11-05',
    lastLogin: new Date().toISOString(),
    preferences: {
      currency: 'USDC',
      notifications: false,
      twoFactorAuth: false
    },
    portfolio: {
      totalValue: 52850.25,
      monthlyGain: 5.4,
      riskScore: 55
    }
  },
  {
    id: 'demo-user-5',
    name: 'David Kim',
    email: 'david@example.com',
    password: 'demo123',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    accountType: 'premium',
    balance: 445920.80,
    joinDate: '2023-01-18',
    lastLogin: new Date().toISOString(),
    preferences: {
      currency: 'USDC',
      notifications: true,
      twoFactorAuth: true
    },
    portfolio: {
      totalValue: 445920.80,
      monthlyGain: 18.7,
      riskScore: 92
    }
  },
  {
    id: 'demo-user-6',
    name: 'Lisa Wang',
    email: 'lisa@example.com',
    password: 'demo123',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    accountType: 'business',
    balance: 1250000.00,
    joinDate: '2022-12-03',
    lastLogin: new Date().toISOString(),
    preferences: {
      currency: 'USDC',
      notifications: true,
      twoFactorAuth: true
    },
    portfolio: {
      totalValue: 1250000.00,
      monthlyGain: 22.3,
      riskScore: 88
    }
  },
  // Demo admin user
  {
    id: 'demo-admin-1',
    name: 'Admin User',
    email: 'admin@usdfinancial.com',
    password: 'admin123',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    accountType: 'business',
    balance: 5000000.00,
    joinDate: '2023-01-01',
    lastLogin: new Date().toISOString(),
    preferences: {
      currency: 'USDC',
      notifications: true,
      twoFactorAuth: true
    },
    portfolio: {
      totalValue: 5000000.00,
      monthlyGain: 25.0,
      riskScore: 95
    }
  },
  // Quick demo user for easy testing
  {
    id: 'demo-test-1',
    name: 'Test User',
    email: 'test@test.com',
    password: 'test',
    image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
    accountType: 'personal',
    balance: 10000.00,
    joinDate: new Date().toISOString().split('T')[0],
    lastLogin: new Date().toISOString(),
    preferences: {
      currency: 'USDC',
      notifications: true,
      twoFactorAuth: false
    },
    portfolio: {
      totalValue: 10000.00,
      monthlyGain: 0.0,
      riskScore: 50
    }
  }
]

export function findUserByEmail(email: string): DemoUser | undefined {
  return demoUsers.find(user => user.email.toLowerCase() === email.toLowerCase())
}

export function findUserById(id: string): DemoUser | undefined {
  return demoUsers.find(user => user.id === id)
}

export function validateUserCredentials(email: string, password: string): DemoUser | null {
  const user = findUserByEmail(email)
  if (user && user.password === password) {
    // Update last login
    user.lastLogin = new Date().toISOString()
    return user
  }
  return null
}

// Demo credentials for easy testing
export const DEMO_CREDENTIALS = [
  { email: 'john@example.com', password: 'demo123', name: 'John Anderson' },
  { email: 'sarah@example.com', password: 'demo123', name: 'Sarah Chen (Premium)' },
  { email: 'michael@example.com', password: 'demo123', name: 'Michael Rodriguez (Business)' },
  { email: 'emma@example.com', password: 'demo123', name: 'Emma Thompson' },
  { email: 'david@example.com', password: 'demo123', name: 'David Kim (Premium)' },
  { email: 'lisa@example.com', password: 'demo123', name: 'Lisa Wang (Business)' },
  { email: 'admin@usdfinancial.com', password: 'admin123', name: 'Admin User' },
  { email: 'test@test.com', password: 'test', name: 'Test User (Quick Login)' }
]