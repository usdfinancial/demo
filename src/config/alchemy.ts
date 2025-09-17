import { AlchemyAccountsUIConfig, createConfig } from "@account-kit/react";
import { sepolia, arbitrumSepolia, baseSepolia, optimismSepolia, alchemy } from "@account-kit/infra";
import { QueryClient } from "@tanstack/react-query";


const getUiConfig = (): AlchemyAccountsUIConfig => ({
  illustrationStyle: "linear",
  auth: {
    sections: [
      // Primary: Email (most trusted for financial services)
      [{ type: "email" }],
      // Secondary: Social login with Google (convenience + trust)
      [{ type: "social", authProviderId: "google", mode: "popup" }],
      // Progressive: Passkeys (after initial auth for returning users)
      [{ type: "passkey" }],
    ],
    addPasskeyOnSignup: true, // Enable passkey creation for enhanced security
  },
  // Enhanced branding for USD Financial with trust indicators
  theme: {
    borderRadius: "md", // Slightly rounded for friendliness
    colors: {
      // USD Financial brand colors
      "btn-primary": "#059669", // emerald-600
      "btn-primary-hover": "#047857", // emerald-700
      "fg-accent-brand": "#059669",
      // Trust-building colors for financial services
      "bg-surface-default": "#ffffff",
      "bg-surface-inset": "#f8fafc", // slate-50
      "bg-surface-emphasis": "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)", // emerald to cyan gradient
      "border-color": "#e2e8f0", // slate-200
      // Professional text colors
      "fg-primary": "#0f172a", // slate-900
      "fg-secondary": "#64748b", // slate-500
      "fg-tertiary": "#94a3b8", // slate-400
      // Trust indicators
      "fg-success": "#059669",
      "fg-error": "#dc2626",
      "fg-warning": "#d97706",
    },
  },
  // Modal and component styling optimized for financial services
  modal: {
    backdrop: "blur",
    position: "center",
  },
  // Custom labels for USD Financial branding
  labels: {
    signInTitle: "Access USD Financial",
    signInSubtitle: "Your secure stablecoin financial platform",
    emailPlaceholder: "Enter your email address",
    signInButton: "Sign In Securely",
    continueButton: "Continue to USD Financial",
  },
});

// Singleton config to prevent multiple instances
let configInstance: any = null;

export const getConfig = () => {
  if (configInstance) {
    return configInstance;
  }
  
  configInstance = createConfig(
    {
      // Use the Alchemy API key from environment variables
      transport: alchemy({ 
        apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "demo-api-key" 
      }),
      chain: sepolia, // Using Sepolia testnet (consider mainnet for production)
      ssr: false, // Disable SSR to prevent hydration mismatches
      enablePopupOauth: true, // Enable popup-based OAuth flows for better UX
      // Enhanced settings for financial services
      sessionConfig: {
        expirationTimeMs: 30 * 60 * 1000, // 30 minute sessions
        inactivityTimeoutMs: 15 * 60 * 1000, // 15 minute inactivity timeout
      },
      // Enhanced OAuth error handling for v4.55.0
      auth: {
        // Iframe handling for better OAuth compatibility
        iframe: {
          timeoutMs: 60000, // 1 minute timeout for OAuth flows
          allowedDomains: ['accounts.google.com', '*.alchemy.com'],
        },
        // Retry configuration for failed OAuth attempts
        retry: {
          maxAttempts: 3,
          delayMs: 1000,
        },
      },
    },
    getUiConfig(),
  );
  
  return configInstance;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    },
  },
});

// Enhanced configuration for USD Financial with security and compliance focus
export const getUsdFinancialConfig = () => {
  const baseConfig = getConfig();
  const uiConfig = getUiConfig();

  return {
    ...baseConfig,
    // Enhanced security settings for financial services
    gasPolicy: {
      // Sponsor gas for standard financial operations
      sponsorUserOperations: true,
      // Set reasonable limits for compliance
      maxSponsorship: "0.01", // ETH equivalent
    },
    // Tier-aware session management
    sessionConfig: {
      expirationTimeMs: 30 * 60 * 1000, // 30 minute sessions
      inactivityTimeoutMs: 15 * 60 * 1000, // 15 minute inactivity timeout
      // Tier-based session validation
      onSessionStart: async (user: any) => {
        // Initialize user with Tier 0 by default
        await initializeUserTier(user);
      },
      onSessionValidate: async (user: any) => {
        // Validate tier permissions on each session check
        return await validateUserTierSession(user);
      },
    },
    uiConfig: {
      ...uiConfig,
      // Enhanced authentication options for financial services
      auth: {
        ...uiConfig.auth,
        sections: [
          // Primary: Email authentication (most trusted)
          [{ type: "email" }],
          // Secondary: Google OAuth (secure and convenient)
          [{ type: "social", authProviderId: "google", mode: "popup" }],
          // Progressive: Passkeys (for returning users)
          [{ type: "passkey" }],
        ],
        addPasskeyOnSignup: true,
        // Additional security options
        requireEmailVerification: true,
        // Tier 0 onboarding hooks
        onSignupComplete: async (user: any) => {
          await handleTier0Onboarding(user);
        },
        onSigninComplete: async (user: any) => {
          await handleUserSignin(user);
        },
      },
      // Professional styling for financial services
      theme: {
        ...uiConfig.theme,
        colors: {
          ...uiConfig.theme?.colors,
          // Professional USD Financial brand colors
          "btn-primary": "#059669", // emerald-600
          "btn-primary-hover": "#047857", // emerald-700
          "fg-accent-brand": "#059669",
          // Trust indicators
          "bg-surface-emphasis": "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
          "border-accent": "#059669",
        },
      },
      // USD Financial specific branding
      logo: {
        light: "/logo-light.svg", // Add your logo files to public/
        dark: "/logo-dark.svg",
      },
      // Financial services focused labels
      labels: {
        signInTitle: "Welcome to USD Financial",
        signInSubtitle: "Your secure stablecoin financial platform",
        emailPlaceholder: "Enter your email address",
        signInButton: "Access Your Wallet",
        continueButton: "Continue to Dashboard",
        securityNotice: "🔒 Bank-level security • 256-bit encryption • Regulatory compliant",
      },
      // Trust and security messaging
      features: [
        {
          icon: "🔒",
          title: "Bank-Level Security",
          description: "Your funds and data are protected with enterprise-grade encryption and multi-signature technology"
        },
        {
          icon: "⚡",
          title: "Gasless Experience", 
          description: "We sponsor your transactions for seamless stablecoin financial with zero gas fees"
        },
        {
          icon: "🏦",
          title: "Regulatory Compliant",
          description: "Full KYC/AML compliance with progressive verification for enhanced features"
        }
      ],
    },
  };
};

// Tier-aware authentication helpers
async function initializeUserTier(user: any) {
  try {
    const { KycTier } = await import('@/lib/compliance/tieredKyc');
    
    // Set user to Tier 0 by default (wallet-only access)
    const response = await fetch('/api/user/tier', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.userId,
        tier: KycTier.TIER_0,
        source: 'alchemy_signup'
      })
    });
    
    if (response.ok) {
      console.log(`🎯 Initialized user ${user.userId} with Tier 0 access`);
    }
  } catch (error) {
    console.error('❌ Error initializing user tier:', error);
  }
}

async function validateUserTierSession(user: any): Promise<boolean> {
  try {
    const response = await fetch(`/api/user/tier?userId=${user.userId}`);
    const data = await response.json();
    
    if (!data.success) {
      console.warn('⚠️ Could not validate user tier, allowing session');
      return true; // Allow session but user will be limited to Tier 0
    }
    
    // Store tier in session for quick access
    user.kycTier = data.data.currentTier;
    user.tierLimits = data.data.tierLimits;
    return true;
  } catch (error) {
    console.error('❌ Error validating user tier session:', error);
    return true; // Allow session but user will be limited
  }
}

async function handleTier0Onboarding(user: any) {
  try {
    console.log(`🚀 Tier 0 onboarding for user ${user.userId}`);
    
    // Send elegant welcome notification
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.userId,
        type: 'WELCOME_TIER_0',
        title: '🎉 Welcome to USD Financial!',
        message: 'Your secure wallet is ready. Complete identity verification to unlock transfers, trading, and premium features.',
        actionUrl: '/kyc?tier=tier_1&welcome=true',
        priority: 'medium',
        category: 'onboarding',
        design: {
          backgroundColor: '#f0fdf4', // emerald-50
          borderColor: '#059669', // emerald-600
          iconColor: '#059669'
        }
      })
    });
  } catch (error) {
    console.error('❌ Error in Tier 0 onboarding:', error);
  }
}

async function handleUserSignin(user: any) {
  try {
    // Check if user needs tier upgrade prompts
    const response = await fetch(`/api/user/tier?userId=${user.userId}`);
    const data = await response.json();
    
    if (data.success && data.data.upgradeRequired) {
      // Show elegant tier upgrade notification
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.userId,
          type: 'TIER_UPGRADE_REMINDER',
          title: '🔐 Complete Your Verification',
          message: `Upgrade to ${data.data.requiredTier?.replace('_', ' ').toUpperCase()} to access all features and higher limits.`,
          actionUrl: `/kyc?tier=${data.data.requiredTier}&upgrade=true`,
          priority: 'high',
          category: 'compliance',
          design: {
            backgroundColor: '#fef3c7', // amber-100
            borderColor: '#d97706', // amber-600
            iconColor: '#d97706'
          }
        })
      });
    }
  } catch (error) {
    console.error('❌ Error in user signin handling:', error);
  }
}
