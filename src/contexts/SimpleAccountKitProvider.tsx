'use client'

import { ReactNode } from 'react'
import { AlchemyAccountKitProvider } from '@/components/providers/AlchemyAccountKitProvider'
import { useAlchemyAuth } from '@/hooks/useAlchemyAuth'

// Simple wrapper around our existing Alchemy provider
export function SimpleAccountKitProvider({ children }: { children: ReactNode }) {
  return (
    <AlchemyAccountKitProvider>
      {children}
    </AlchemyAccountKitProvider>
  )
}

// Hook that uses our existing Alchemy auth
export function useSimpleAccountKit() {
  return useAlchemyAuth()
}

// Export as default for easier imports
export default SimpleAccountKitProvider