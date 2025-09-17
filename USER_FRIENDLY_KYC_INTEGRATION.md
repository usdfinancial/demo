# User-Friendly KYC Integration Guide

## Overview

Instead of requiring users to manually navigate to `/kyc`, we've created several user-friendly approaches to guide users through verification seamlessly:

## 1. **Contextual KYC Prompts** ⭐ (Best Approach)

Automatically trigger KYC when users attempt actions requiring higher tiers:

### Usage Example:
```typescript
// In any component where user tries to send money
import KycGatedAction from '@/components/common/KycGatedAction'

<KycGatedAction action="transfer" amount={5000}>
  <button className="bg-blue-600 text-white px-4 py-2 rounded">
    Send $5,000
  </button>
</KycGatedAction>
```

**What happens:**
- User clicks "Send $5,000"
- System checks if they can perform this action
- If not verified for Tier 2, shows beautiful modal explaining requirements
- User can start verification directly from the modal

## 2. **Smart Onboarding Flow**

Show progressive verification steps on dashboard:

### Usage:
```typescript
// In dashboard or main app layout
import KycOnboardingFlow from '@/components/onboarding/KycOnboardingFlow'

function Dashboard() {
  return (
    <div>
      <KycOnboardingFlow /> {/* Shows tier progress */}
      {/* Rest of dashboard */}
    </div>
  )
}
```

**Features:**
- Progress bar showing verification levels
- Clear next steps and benefits
- "Skip for now" option (remembers for 7 days)
- Only shows when relevant

## 3. **Integration Points**

### A. **Wallet Actions**
```typescript
// Wrap any financial action
<KycGatedAction action="withdraw" amount={amount}>
  <WithdrawButton />
</KycGatedAction>
```

### B. **Feature Access**
```typescript
// Gate entire features
<KycGatedAction action="defi">
  <DeFiYieldFarming />
</KycGatedAction>
```

### C. **Card Applications**
```typescript
// Require Tier 3 for cards
<KycGatedAction action="card">
  <ApplyForCardButton />
</KycGatedAction>
```

## 4. **User Experience Flow**

### Scenario: User wants to send $5,000

1. **User clicks "Send $5,000"**
2. **System checks:** Current tier (Tier 1) vs Required tier (Tier 2)
3. **Modal appears:** "To send $5,000, you need Tier 2 verification"
4. **Shows requirements:** Government ID, address verification, etc.
5. **User clicks "Verify Now"**
6. **Redirects to KYC page** with context: `/kyc?tier=tier_2&action=transfer&amount=5000`
7. **After verification:** User returns to complete their original action

## 5. **Implementation Steps**

### Step 1: Add to existing buttons/actions
```typescript
// Before (manual KYC)
<button onClick={handleSend}>Send Money</button>

// After (automatic KYC guidance)
<KycGatedAction action="transfer" amount={amount}>
  <button onClick={handleSend}>Send Money</button>
</KycGatedAction>
```

### Step 2: Add onboarding to dashboard
```typescript
// In your main dashboard component
import KycOnboardingFlow from '@/components/onboarding/KycOnboardingFlow'

function Dashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <KycOnboardingFlow />
      {/* Existing dashboard content */}
    </div>
  )
}
```

### Step 3: Add tier status widget
```typescript
// Show current tier status in header/sidebar
import { useAuth } from '@/hooks/useAuth'
import { TieredKycService } from '@/lib/services/tieredKycService'

function TierStatusWidget() {
  const { user } = useAuth()
  const [tier, setTier] = useState('tier_0')
  
  // Load and display current tier
  // Show upgrade prompts when relevant
}
```

## 6. **Key Benefits**

✅ **No manual URL navigation** - Users never need to find `/kyc`
✅ **Contextual guidance** - Explains exactly why verification is needed
✅ **Progressive disclosure** - Only shows relevant requirements
✅ **Seamless flow** - Returns user to original action after verification
✅ **Smart timing** - Prompts appear when most relevant
✅ **Mobile optimized** - Works perfectly on all devices

## 7. **Files Created**

- `KycPromptModal.tsx` - Beautiful modal explaining verification needs
- `useKycGuidance.ts` - Hook for checking permissions and showing guidance
- `KycGatedAction.tsx` - Wrapper component for any action requiring KYC
- `KycOnboardingFlow.tsx` - Progressive onboarding widget for dashboard

## 8. **Example Integrations**

### Transfer Page:
```typescript
<KycGatedAction action="transfer" amount={transferAmount}>
  <button className="w-full bg-blue-600 text-white py-3 rounded-lg">
    Send ${transferAmount.toLocaleString()}
  </button>
</KycGatedAction>
```

### DeFi Section:
```typescript
<KycGatedAction action="defi">
  <div className="defi-yield-section">
    <h2>Earn Yield on Your USDC</h2>
    {/* DeFi content */}
  </div>
</KycGatedAction>
```

### Card Application:
```typescript
<KycGatedAction action="card">
  <button className="bg-emerald-600 text-white px-6 py-3 rounded-lg">
    Apply for Debit Card
  </button>
</KycGatedAction>
```

This approach makes KYC verification feel natural and helpful rather than a barrier!
