import { createMockProvider, createMockContract, MOCK_ADDRESSES } from '../utils/testHelpers'

// Mock ethers module
export const JsonRpcProvider = jest.fn().mockImplementation(() => createMockProvider())
export const Contract = jest.fn().mockImplementation(() => createMockContract())

export const formatEther = jest.fn().mockImplementation((value: bigint | string) => {
  const num = typeof value === 'string' ? BigInt(value) : value
  return (Number(num) / 1e18).toString()
})

export const formatUnits = jest.fn().mockImplementation((value: bigint | string, decimals = 18) => {
  const num = typeof value === 'string' ? BigInt(value) : value
  return (Number(num) / Math.pow(10, decimals)).toString()
})

export const parseEther = jest.fn().mockImplementation((value: string) => {
  return BigInt(Math.floor(parseFloat(value) * 1e18))
})

export const parseUnits = jest.fn().mockImplementation((value: string, decimals = 18) => {
  return BigInt(Math.floor(parseFloat(value) * Math.pow(10, decimals)))
})

export const isAddress = jest.fn().mockImplementation((address: string) => {
  return typeof address === 'string' && address.startsWith('0x') && address.length === 42
})

export const getAddress = jest.fn().mockImplementation((address: string) => {
  if (!isAddress(address)) {
    throw new Error('Invalid address')
  }
  return address.toLowerCase()
})

export const AbiCoder = {
  defaultAbiCoder: () => ({
    encode: jest.fn().mockReturnValue('0x1234567890abcdef'),
    decode: jest.fn().mockReturnValue(['decoded', 'data']),
    encodeFunctionData: jest.fn().mockReturnValue('0xabcdef123456'),
    decodeFunctionResult: jest.fn().mockReturnValue(['result'])
  })
}

// Transaction response mock
export class TransactionResponse {
  constructor(
    public hash: string,
    public to?: string,
    public from?: string,
    public value?: bigint,
    public gasLimit?: bigint,
    public gasPrice?: bigint
  ) {}

  async wait(confirmations = 1) {
    return {
      hash: this.hash,
      status: 1,
      blockNumber: 12345,
      gasUsed: BigInt(21000),
      cumulativeGasUsed: BigInt(21000),
      logs: [],
      transactionIndex: 0
    }
  }
}

// Mock Wallet class
export class Wallet {
  constructor(
    public privateKey: string,
    public provider?: any
  ) {}

  get address() {
    return MOCK_ADDRESSES.SMART_WALLET
  }

  async getAddress() {
    return this.address
  }

  async signMessage(message: string) {
    return '0x' + Buffer.from(`signed:${message}`).toString('hex')
  }

  async sendTransaction(transaction: any) {
    return new TransactionResponse(
      '0xa1b2c3d4e5f6789012345678901234567890123456789012345678901234567890',
      transaction.to,
      this.address,
      transaction.value,
      transaction.gasLimit,
      transaction.gasPrice
    )
  }

  connect(provider: any) {
    return new Wallet(this.privateKey, provider)
  }
}

// Export all ethers constants and utilities that might be used
export const constants = {
  AddressZero: '0x0000000000000000000000000000000000000000',
  HashZero: '0x0000000000000000000000000000000000000000000000000000000000000000',
  MaxUint256: BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
}

export const utils = {
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
  isAddress,
  getAddress,
  AbiCoder
}