import { createMockAlchemyUser, createMockAlchemySigner, createMockSmartAccountClient } from '../../utils/testHelpers'

// Mock Account Kit React hooks
export const useUser = jest.fn(() => createMockAlchemyUser('email'))

export const useSigner = jest.fn(() => createMockAlchemySigner())

export const useSmartAccountClient = jest.fn(() => ({
  client: createMockSmartAccountClient()
}))

export const useAuthenticate = jest.fn(() => ({
  authenticate: jest.fn().mockResolvedValue({ user: createMockAlchemyUser('email') }),
  isPending: false
}))

export const useLogout = jest.fn(() => ({
  logout: jest.fn().mockResolvedValue(undefined),
  isPending: false
}))

export const useSignerStatus = jest.fn(() => ({
  isInitializing: false,
  isConnecting: false,
  isConnected: true,
  isDisconnected: false,
  isReconnecting: false,
  status: 'READY'
}))

export const useAccount = jest.fn(() => ({
  account: {
    address: '0x2226bDB4F36fb86698db9340111803577b5a4114',
    type: 'LightAccount'
  },
  isLoadingAccount: false
}))

// Mock AlchemyAccountsUIConfig
export const AlchemyAccountsUIConfig = {
  auth: {
    sections: [['email'], ['passkey', 'social']],
    addPasskeyOnSignup: false
  },
  supportUrl: 'https://support.usdfinancial.com'
}

// Mock config functions
export const createConfig = jest.fn(() => ({
  transport: 'http',
  chain: { id: 11155111, name: 'Sepolia' },
  ssr: true
}))

export const cookieToInitialState = jest.fn(() => ({}))

// Mock provider components
export const AlchemyAccountProvider = ({ children }: { children: React.ReactNode }) => children

export const AlchemyClientState = {
  INITIALIZING: 'INITIALIZING',
  READY: 'READY',
  ERROR: 'ERROR'
}