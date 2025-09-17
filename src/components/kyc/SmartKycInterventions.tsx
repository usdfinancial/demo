'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { KycTier, TieredKycManager } from '@/lib/compliance/tieredKyc';
import KycGuidanceManager, { KycPromptTrigger } from './KycGuidanceManager';

interface SmartInterventionConfig {
  id: string;
  trigger: KycPromptTrigger;
  conditions: {
    minAmount?: number;
    frequency?: number;
    timeWindow?: number; // hours
    userSegment?: string[];
    currentTier?: KycTier[];
  };
  cooldown?: number; // hours before showing again
  priority: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

// Smart intervention rules inspired by Stripe, Coinbase, Revolut patterns
const SMART_INTERVENTIONS: SmartInterventionConfig[] = [
  {
    id: 'large_deposit_prompt',
    trigger: KycPromptTrigger.LARGE_DEPOSIT,
    conditions: {
      minAmount: 1000,
      currentTier: [KycTier.TIER_0, KycTier.TIER_1]
    },
    cooldown: 24,
    priority: 'critical',
    enabled: true
  },
  {
    id: 'withdrawal_blocked',
    trigger: KycPromptTrigger.WITHDRAWAL_ATTEMPT,
    conditions: {
      minAmount: 100,
      currentTier: [KycTier.TIER_0]
    },
    priority: 'critical',
    enabled: true
  },
  {
    id: 'card_feature_unlock',
    trigger: KycPromptTrigger.CARD_REQUEST,
    conditions: {
      currentTier: [KycTier.TIER_0, KycTier.TIER_1, KycTier.TIER_2]
    },
    cooldown: 72,
    priority: 'medium',
    enabled: true
  },
  {
    id: 'power_user_upgrade',
    trigger: KycPromptTrigger.HIGH_FREQUENCY_TRADING,
    conditions: {
      frequency: 10, // 10+ transactions
      timeWindow: 24,
      currentTier: [KycTier.TIER_0, KycTier.TIER_1]
    },
    cooldown: 48,
    priority: 'medium',
    enabled: true
  },
  {
    id: 'monthly_limit_reached',
    trigger: KycPromptTrigger.MONTHLY_LIMIT_REACHED,
    conditions: {
      currentTier: [KycTier.TIER_1, KycTier.TIER_2]
    },
    priority: 'high',
    enabled: true
  },
  {
    id: 'welcome_onboarding',
    trigger: KycPromptTrigger.ONBOARDING_COMPLETE,
    conditions: {
      currentTier: [KycTier.TIER_0]
    },
    cooldown: 168, // 1 week
    priority: 'low',
    enabled: true
  },
  {
    id: 'bridge_unlock',
    trigger: KycPromptTrigger.CROSS_CHAIN_BRIDGE,
    conditions: {
      currentTier: [KycTier.TIER_0, KycTier.TIER_1]
    },
    cooldown: 24,
    priority: 'medium',
    enabled: true
  }
];

interface InterventionEvent {
  userId: string;
  action: string;
  amount?: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface SmartKycInterventionsProps {
  className?: string;
}

const SmartKycInterventions: React.FC<SmartKycInterventionsProps> = ({ className }) => {
  const { user } = useAuth();
  const [activeIntervention, setActiveIntervention] = useState<{
    trigger: KycPromptTrigger;
    amount?: number;
    currentLimit?: number;
  } | null>(null);
  const [currentTier, setCurrentTier] = useState<KycTier>(KycTier.TIER_0);
  const [userEvents, setUserEvents] = useState<InterventionEvent[]>([]);
  const [cooldownData, setCooldownData] = useState<Record<string, Date>>({});

  // Load user tier and intervention history
  useEffect(() => {
    if (user?.id) {
      loadUserData();
      loadCooldownData();
    }
  }, [user?.id]);

  const loadUserData = async () => {
    try {
      // Get current tier
      const tierResponse = await fetch(`/api/user/tier?userId=${user?.id}`);
      if (tierResponse.ok) {
        const tierData = await tierResponse.json();
        setCurrentTier(tierData.data?.currentTier || KycTier.TIER_0);
      }

      // Get recent user events for analysis
      const eventsResponse = await fetch(`/api/user/events?userId=${user?.id}&days=30`);
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setUserEvents(eventsData.data?.events || []);
      }
    } catch (error) {
      console.error('Error loading user data for interventions:', error);
    }
  };

  const loadCooldownData = () => {
    const stored = localStorage.getItem(`kyc_cooldowns_${user?.id}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      const cooldowns: Record<string, Date> = {};
      Object.entries(parsed).forEach(([key, value]) => {
        cooldowns[key] = new Date(value as string);
      });
      setCooldownData(cooldowns);
    }
  };

  const saveCooldownData = (interventionId: string) => {
    const updated = {
      ...cooldownData,
      [interventionId]: new Date()
    };
    setCooldownData(updated);
    
    const serializable = Object.entries(updated).reduce((acc, [key, date]) => {
      acc[key] = date.toISOString();
      return acc;
    }, {} as Record<string, string>);
    
    localStorage.setItem(`kyc_cooldowns_${user?.id}`, JSON.stringify(serializable));
  };

  // Check if intervention should be shown based on conditions and cooldown
  const shouldShowIntervention = (config: SmartInterventionConfig): boolean => {
    if (!config.enabled) return false;

    // Check cooldown
    if (config.cooldown) {
      const lastShown = cooldownData[config.id];
      if (lastShown) {
        const hoursSince = (Date.now() - lastShown.getTime()) / (1000 * 60 * 60);
        if (hoursSince < config.cooldown) return false;
      }
    }

    // Check tier conditions
    if (config.conditions.currentTier && !config.conditions.currentTier.includes(currentTier)) {
      return false;
    }

    return true;
  };

  // Public methods for triggering interventions
  const triggerDepositIntervention = (amount: number) => {
    const config = SMART_INTERVENTIONS.find(i => i.trigger === KycPromptTrigger.LARGE_DEPOSIT);
    if (!config || !shouldShowIntervention(config)) return;

    if (amount >= (config.conditions.minAmount || 0)) {
      setActiveIntervention({
        trigger: KycPromptTrigger.LARGE_DEPOSIT,
        amount
      });
      saveCooldownData(config.id);
    }
  };

  const triggerWithdrawalIntervention = (amount: number) => {
    const config = SMART_INTERVENTIONS.find(i => i.trigger === KycPromptTrigger.WITHDRAWAL_ATTEMPT);
    if (!config || !shouldShowIntervention(config)) return;

    if (currentTier === KycTier.TIER_0) {
      setActiveIntervention({
        trigger: KycPromptTrigger.WITHDRAWAL_ATTEMPT,
        amount
      });
    }
  };

  const triggerCardIntervention = () => {
    const config = SMART_INTERVENTIONS.find(i => i.trigger === KycPromptTrigger.CARD_REQUEST);
    if (!config || !shouldShowIntervention(config)) return;

    setActiveIntervention({
      trigger: KycPromptTrigger.CARD_REQUEST
    });
    saveCooldownData(config.id);
  };

  const triggerLimitReachedIntervention = (currentLimit: number) => {
    const config = SMART_INTERVENTIONS.find(i => i.trigger === KycPromptTrigger.MONTHLY_LIMIT_REACHED);
    if (!config || !shouldShowIntervention(config)) return;

    setActiveIntervention({
      trigger: KycPromptTrigger.MONTHLY_LIMIT_REACHED,
      currentLimit
    });
  };

  const triggerOnboardingIntervention = () => {
    const config = SMART_INTERVENTIONS.find(i => i.trigger === KycPromptTrigger.ONBOARDING_COMPLETE);
    if (!config || !shouldShowIntervention(config)) return;

    if (currentTier === KycTier.TIER_0) {
      setActiveIntervention({
        trigger: KycPromptTrigger.ONBOARDING_COMPLETE
      });
      saveCooldownData(config.id);
    }
  };

  const triggerBridgeIntervention = () => {
    const config = SMART_INTERVENTIONS.find(i => i.trigger === KycPromptTrigger.CROSS_CHAIN_BRIDGE);
    if (!config || !shouldShowIntervention(config)) return;

    setActiveIntervention({
      trigger: KycPromptTrigger.CROSS_CHAIN_BRIDGE
    });
    saveCooldownData(config.id);
  };

  const handleInterventionAction = async (action: 'proceed' | 'dismiss' | 'learn_more') => {
    if (!activeIntervention) return;

    // Track intervention outcome
    try {
      await fetch('/api/analytics/kyc-intervention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          trigger: activeIntervention.trigger,
          action,
          currentTier,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error tracking intervention outcome:', error);
    }

    if (action === 'proceed') {
      // Redirect to appropriate KYC flow
      const targetTier = getRecommendedTier(activeIntervention.trigger);
      window.location.href = `/kyc?tier=${targetTier}&trigger=${activeIntervention.trigger}`;
    }

    setActiveIntervention(null);
  };

  const getRecommendedTier = (trigger: KycPromptTrigger): KycTier => {
    const config = SMART_INTERVENTIONS.find(i => i.trigger === trigger);
    if (!config) return KycTier.TIER_1;

    // Smart tier recommendation based on trigger
    switch (trigger) {
      case KycPromptTrigger.LARGE_DEPOSIT:
        return KycTier.TIER_2;
      case KycPromptTrigger.WITHDRAWAL_ATTEMPT:
        return KycTier.TIER_1;
      case KycPromptTrigger.CARD_REQUEST:
      case KycPromptTrigger.LOAN_APPLICATION:
      case KycPromptTrigger.MONTHLY_LIMIT_REACHED:
        return KycTier.TIER_3;
      case KycPromptTrigger.CROSS_CHAIN_BRIDGE:
      case KycPromptTrigger.HIGH_FREQUENCY_TRADING:
        return KycTier.TIER_2;
      default:
        return KycTier.TIER_1;
    }
  };

  // Auto-trigger welcome intervention for new users
  useEffect(() => {
    if (currentTier === KycTier.TIER_0 && user?.id) {
      const timer = setTimeout(() => {
        triggerOnboardingIntervention();
      }, 5000); // Show after 5 seconds for new users
      
      return () => clearTimeout(timer);
    }
  }, [currentTier, user?.id]);

  // Expose trigger methods globally for other components
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).kycInterventions = {
        triggerDeposit: triggerDepositIntervention,
        triggerWithdrawal: triggerWithdrawalIntervention,
        triggerCard: triggerCardIntervention,
        triggerLimitReached: triggerLimitReachedIntervention,
        triggerBridge: triggerBridgeIntervention
      };
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).kycInterventions;
      }
    };
  }, [currentTier]);

  return (
    <div className={className}>
      {activeIntervention && (
        <KycGuidanceManager
          trigger={activeIntervention.trigger}
          amount={activeIntervention.amount}
          currentLimit={activeIntervention.currentLimit}
          onPromptAction={handleInterventionAction}
          onClose={() => setActiveIntervention(null)}
        />
      )}
    </div>
  );
};

export default SmartKycInterventions;