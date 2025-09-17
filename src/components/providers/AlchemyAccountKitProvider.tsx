'use client'

import { ReactNode, useEffect } from 'react'
import { AlchemyAccountProvider } from '@account-kit/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { getUsdFinancialConfig, queryClient } from '@/config/alchemy'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { setupIframeCleanup, cleanupAuthIframes } from '@/utils/iframeCleanup'

interface AlchemyAccountKitProviderProps {
  children: ReactNode
}

function AlchemyProviderWrapper({ children }: { children: ReactNode }) {
  try {
    const config = getUsdFinancialConfig()
    
    // Validate API key before initialization
    if (!process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY === 'demo-api-key') {
      console.warn('⚠️ Missing or demo Alchemy API key - OAuth may fail. Please set NEXT_PUBLIC_ALCHEMY_API_KEY in .env.local')
    }
    
    console.log('⚙️ Initializing USD Financial Account Kit with enhanced config', {
      hasApiKey: !!process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
      apiKeyPrefix: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY?.substring(0, 8) + '...',
      authSections: config.uiConfig?.auth?.sections?.length,
      passkeysEnabled: config.uiConfig?.auth?.addPasskeyOnSignup,
      gasSponsorship: config.gasPolicy?.sponsorUserOperations,
      oauthEnabled: config.enablePopupOauth
    })
    
    return (
      <AlchemyAccountProvider config={config} queryClient={queryClient}>
        {children}
      </AlchemyAccountProvider>
    )
  } catch (error) {
    console.error('❌ Alchemy Provider initialization error:', error)
    // Return a fallback with error message
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-red-800 font-semibold">Authentication Service Error</h3>
        <p className="text-red-700 text-sm mt-1">
          Failed to initialize Alchemy Account Kit. Please check your configuration.
        </p>
        <details className="mt-2">
          <summary className="text-red-600 text-xs cursor-pointer">Technical Details</summary>
          <pre className="text-xs text-red-600 mt-1">{String(error)}</pre>
        </details>
        {children}
      </div>
    )
  }
}

export function AlchemyAccountKitProvider({ children }: AlchemyAccountKitProviderProps) {
  useEffect(() => {
    // Clean up any existing auth iframes on mount
    cleanupAuthIframes();
    
    // Set up periodic cleanup
    const cleanup = setupIframeCleanup();
    
    // Cleanup on unmount
    return cleanup;
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AlchemyProviderWrapper>
          {children}
        </AlchemyProviderWrapper>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}