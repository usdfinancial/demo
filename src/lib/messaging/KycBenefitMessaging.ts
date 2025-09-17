import { KycTier } from '@/lib/compliance/tieredKyc';

export interface BenefitMessage {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  icon: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  timeToValue: string; // Time to realize benefit
  valueProposition: string;
  socialProof?: string;
  category: 'financial' | 'convenience' | 'security' | 'status' | 'access';
}

export interface ContextualMessage {
  trigger: string;
  userSegment: string[];
  currentTier: KycTier[];
  targetTier: KycTier;
  primaryMessage: BenefitMessage;
  supportingMessages: BenefitMessage[];
  callToAction: {
    primary: string;
    secondary?: string;
  };
  testimonial?: {
    quote: string;
    author: string;
    role: string;
    avatar?: string;
  };
}

// Benefit messaging inspired by leading fintech firms
export class KycBenefitMessaging {
  private static benefitLibrary: Record<string, BenefitMessage> = {
    // Financial Benefits
    instant_access: {
      id: 'instant_access',
      title: '💰 Instant Access to Your Funds',
      description: 'No waiting periods or holds - use your money immediately after verification',
      icon: '⚡',
      urgency: 'high',
      timeToValue: 'Immediate',
      valueProposition: 'Access your full deposit instantly',
      socialProof: 'Over 95% of users complete verification in under 5 minutes',
      category: 'financial'
    },
    
    higher_limits: {
      id: 'higher_limits',
      title: '📈 10x Higher Transaction Limits',
      subtitle: 'From $1K to $10K per transaction',
      description: 'Scale your financial activities without restrictions',
      icon: '🚀',
      urgency: 'medium',
      timeToValue: 'Immediate',
      valueProposition: 'Send and receive larger amounts',
      category: 'financial'
    },
    
    unlimited_access: {
      id: 'unlimited_access',
      title: '∞ Unlimited Transaction Power',
      description: 'No caps, no limits - complete financial freedom',
      icon: '👑',
      urgency: 'medium',
      timeToValue: '5-10 minutes',
      valueProposition: 'Remove all transaction limits',
      category: 'financial'
    },
    
    competitive_rates: {
      id: 'competitive_rates',
      title: '💎 Best-in-Class Rates',
      subtitle: 'Up to 8.5% APY on stablecoin deposits',
      description: 'Earn more with our premium yield farming partnerships',
      icon: '📊',
      urgency: 'medium',
      timeToValue: 'Same day',
      valueProposition: 'Maximize your earnings potential',
      category: 'financial'
    },

    // Convenience Benefits
    one_click_features: {
      id: 'one_click_features',
      title: '🎯 One-Click DeFi Access',
      description: 'Bridge, swap, and yield farm across all major chains seamlessly',
      icon: '🌉',
      urgency: 'medium',
      timeToValue: 'Immediate',
      valueProposition: 'Simplify complex DeFi operations',
      category: 'convenience'
    },
    
    mobile_first: {
      id: 'mobile_first',
      title: '📱 Full Mobile Experience',
      description: 'Complete control of your finances from anywhere, anytime',
      icon: '🔥',
      urgency: 'low',
      timeToValue: 'Immediate',
      valueProposition: 'Bank on the go with full functionality',
      category: 'convenience'
    },
    
    automated_features: {
      id: 'automated_features',
      title: '🤖 Smart Automation',
      description: 'Set it and forget it - automated investments, bill pay, and more',
      icon: '⚙️',
      urgency: 'low',
      timeToValue: '1 hour setup',
      valueProposition: 'Save time with intelligent automation',
      category: 'convenience'
    },

    // Security Benefits
    bank_grade_security: {
      id: 'bank_grade_security',
      title: '🛡️ Bank-Grade Protection',
      description: 'Military-grade encryption, biometric authentication, fraud monitoring',
      icon: '🔒',
      urgency: 'high',
      timeToValue: 'Immediate',
      valueProposition: 'Your money is safer than traditional banks',
      category: 'security'
    },
    
    insurance_coverage: {
      id: 'insurance_coverage',
      title: '🏦 FDIC-Equivalent Coverage',
      subtitle: 'Up to $250K protection per account',
      description: 'Your funds are protected by institutional-grade insurance',
      icon: '🛡️',
      urgency: 'medium',
      timeToValue: 'Immediate',
      valueProposition: 'Sleep soundly knowing your money is protected',
      category: 'security'
    },

    // Status Benefits
    premium_status: {
      id: 'premium_status',
      title: '⭐ Premium Member Status',
      description: 'Join an exclusive group of verified users with premium benefits',
      icon: '👑',
      urgency: 'low',
      timeToValue: 'Immediate',
      valueProposition: 'Access exclusive features and priority support',
      socialProof: 'Only 15% of users achieve Premium status',
      category: 'status'
    },
    
    priority_support: {
      id: 'priority_support',
      title: '🎧 VIP Customer Support',
      subtitle: 'Dedicated support team, faster response times',
      description: '24/7 priority support from our expert financial advisors',
      icon: '💬',
      urgency: 'low',
      timeToValue: 'Immediate',
      valueProposition: 'Get help when you need it most',
      category: 'status'
    },

    // Access Benefits
    exclusive_features: {
      id: 'exclusive_features',
      title: '🎉 Exclusive Feature Access',
      description: 'Be first to access new features, beta programs, and premium tools',
      icon: '🚀',
      urgency: 'low',
      timeToValue: 'Ongoing',
      valueProposition: 'Stay ahead with cutting-edge financial tools',
      category: 'access'
    },
    
    defi_universe: {
      id: 'defi_universe',
      title: '🌌 DeFi Universe Unlocked',
      description: 'Access to 500+ protocols, yield farms, and trading opportunities',
      icon: '🔓',
      urgency: 'medium',
      timeToValue: 'Immediate',
      valueProposition: 'Explore the full potential of decentralized finance',
      category: 'access'
    },

    physical_card: {
      id: 'physical_card',
      title: '💳 Physical Debit Card',
      subtitle: '2% cashback worldwide',
      description: 'Spend your crypto anywhere Visa is accepted',
      icon: '💎',
      urgency: 'medium',
      timeToValue: '5-7 business days',
      valueProposition: 'Bridge crypto and traditional spending',
      category: 'access'
    }
  };

  private static contextualMessages: Record<string, ContextualMessage> = {
    large_deposit_tier1: {
      trigger: 'large_deposit',
      userSegment: ['new_user', 'returning_user'],
      currentTier: [KycTier.TIER_0, KycTier.TIER_1],
      targetTier: KycTier.TIER_2,
      primaryMessage: this.benefitLibrary.instant_access,
      supportingMessages: [
        this.benefitLibrary.higher_limits,
        this.benefitLibrary.one_click_features,
        this.benefitLibrary.bank_grade_security
      ],
      callToAction: {
        primary: 'Verify Now & Access Your $[AMOUNT]',
        secondary: 'I\'ll verify later'
      },
      testimonial: {
        quote: "Verification was so quick, I had access to my full deposit in 3 minutes!",
        author: "Sarah Chen",
        role: "DeFi Trader"
      }
    },

    withdrawal_attempt_tier0: {
      trigger: 'withdrawal_attempt',
      userSegment: ['new_user'],
      currentTier: [KycTier.TIER_0],
      targetTier: KycTier.TIER_1,
      primaryMessage: {
        ...this.benefitLibrary.instant_access,
        title: '🔓 Unlock Withdrawals',
        description: 'Complete quick verification to process your withdrawal'
      },
      supportingMessages: [
        this.benefitLibrary.bank_grade_security,
        this.benefitLibrary.mobile_first
      ],
      callToAction: {
        primary: 'Verify & Withdraw Now',
        secondary: 'Cancel withdrawal'
      }
    },

    card_request_tier2: {
      trigger: 'card_request',
      userSegment: ['power_user', 'high_value'],
      currentTier: [KycTier.TIER_0, KycTier.TIER_1, KycTier.TIER_2],
      targetTier: KycTier.TIER_3,
      primaryMessage: this.benefitLibrary.physical_card,
      supportingMessages: [
        this.benefitLibrary.unlimited_access,
        this.benefitLibrary.premium_status,
        this.benefitLibrary.priority_support
      ],
      callToAction: {
        primary: 'Unlock Card Access',
        secondary: 'Learn more about cards'
      },
      testimonial: {
        quote: "The premium card pays for itself with the cashback rewards!",
        author: "Marcus Johnson",
        role: "Business Owner"
      }
    },

    monthly_limit_reached: {
      trigger: 'monthly_limit',
      userSegment: ['active_trader', 'power_user'],
      currentTier: [KycTier.TIER_1, KycTier.TIER_2],
      targetTier: KycTier.TIER_3,
      primaryMessage: this.benefitLibrary.unlimited_access,
      supportingMessages: [
        this.benefitLibrary.competitive_rates,
        this.benefitLibrary.automated_features,
        this.benefitLibrary.exclusive_features
      ],
      callToAction: {
        primary: 'Remove All Limits',
        secondary: 'Wait for next month'
      }
    },

    onboarding_welcome: {
      trigger: 'onboarding_complete',
      userSegment: ['new_user'],
      currentTier: [KycTier.TIER_0],
      targetTier: KycTier.TIER_1,
      primaryMessage: {
        ...this.benefitLibrary.one_click_features,
        title: '🎉 Welcome to USD Financial!',
        description: 'Complete verification to unlock the full stablecoin banking experience'
      },
      supportingMessages: [
        this.benefitLibrary.higher_limits,
        this.benefitLibrary.defi_universe,
        this.benefitLibrary.mobile_first
      ],
      callToAction: {
        primary: 'Get Started (3 minutes)',
        secondary: 'Explore features first'
      }
    },

    power_user_upgrade: {
      trigger: 'high_frequency_trading',
      userSegment: ['active_trader', 'defi_user'],
      currentTier: [KycTier.TIER_1],
      targetTier: KycTier.TIER_2,
      primaryMessage: {
        ...this.benefitLibrary.competitive_rates,
        title: '⚡ Pro Trader Benefits',
        subtitle: 'Lower fees, higher limits, advanced features'
      },
      supportingMessages: [
        this.benefitLibrary.higher_limits,
        this.benefitLibrary.one_click_features,
        this.benefitLibrary.priority_support
      ],
      callToAction: {
        primary: 'Upgrade Trading Account',
        secondary: 'Continue with basic'
      },
      testimonial: {
        quote: "The advanced trading features save me hours every day.",
        author: "Alex Rivera",
        role: "Professional Trader"
      }
    }
  };

  /**
   * Get contextual messaging for a specific trigger and user state
   */
  static getContextualMessage(
    trigger: string, 
    currentTier: KycTier, 
    userSegment: string = 'general'
  ): ContextualMessage | null {
    const messageKey = `${trigger}_${currentTier.toLowerCase()}`;
    let message = this.contextualMessages[messageKey];
    
    // Fallback to more general message
    if (!message) {
      message = Object.values(this.contextualMessages).find(msg => 
        msg.trigger === trigger && msg.currentTier.includes(currentTier)
      );
    }
    
    return message || null;
  }

  /**
   * Get benefit messages for a specific tier upgrade
   */
  static getTierBenefits(targetTier: KycTier): BenefitMessage[] {
    switch (targetTier) {
      case KycTier.TIER_1:
        return [
          this.benefitLibrary.higher_limits,
          this.benefitLibrary.mobile_first,
          this.benefitLibrary.bank_grade_security
        ];
      case KycTier.TIER_2:
        return [
          this.benefitLibrary.one_click_features,
          this.benefitLibrary.competitive_rates,
          this.benefitLibrary.defi_universe
        ];
      case KycTier.TIER_3:
        return [
          this.benefitLibrary.unlimited_access,
          this.benefitLibrary.physical_card,
          this.benefitLibrary.premium_status,
          this.benefitLibrary.priority_support
        ];
      default:
        return [];
    }
  }

  /**
   * Get urgency-based messaging
   */
  static getUrgencyMessage(amount?: number, timeRemaining?: number): string {
    if (amount && amount > 10000) {
      return `🚨 Large transaction detected: $${amount.toLocaleString()}. Verification required for immediate access.`;
    }
    
    if (timeRemaining && timeRemaining < 24) {
      return `⏰ Complete verification within ${timeRemaining} hours to maintain account access.`;
    }
    
    return '✨ Quick verification unlocks your full USD Financial experience.';
  }

  /**
   * Get social proof messaging based on user segment
   */
  static getSocialProof(userSegment: string): string {
    const socialProofMessages = {
      new_user: "Join 500K+ verified users who trust USD Financial with their stablecoin banking",
      power_user: "95% of active traders complete verification to access advanced features", 
      high_value: "Premium members enjoy 3x faster transaction processing",
      defi_user: "Access 500+ DeFi protocols with institutional-grade security",
      business: "Trusted by 10K+ businesses for corporate stablecoin banking"
    };
    
    return socialProofMessages[userSegment as keyof typeof socialProofMessages] || 
           socialProofMessages.new_user;
  }

  /**
   * Get time-sensitive messaging
   */
  static getTimeSensitiveMessage(tier: KycTier): string {
    const timeMessages = {
      [KycTier.TIER_1]: "⚡ 2-3 minutes to unlock basic features",
      [KycTier.TIER_2]: "🚀 5-7 minutes to unlock advanced trading", 
      [KycTier.TIER_3]: "👑 10-12 minutes to unlock unlimited access"
    };
    
    return timeMessages[tier] || "Quick verification unlocks new features";
  }

  /**
   * Replace dynamic values in messages
   */
  static processMessageText(text: string, values: Record<string, any>): string {
    let processed = text;
    
    Object.entries(values).forEach(([key, value]) => {
      const placeholder = `[${key.toUpperCase()}]`;
      processed = processed.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return processed;
  }
}