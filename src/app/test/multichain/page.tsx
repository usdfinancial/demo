'use client'

import { MultiChainBalanceTest } from '@/components/test/MultiChainBalanceTest'

export default function MultiChainTestPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Multi-Chain Balance Testing
        </h1>
        <p className="text-gray-600">
          Test the multi-chain USDC balance checking functionality across different networks.
        </p>
      </div>
      
      <MultiChainBalanceTest />
    </div>
  )
}