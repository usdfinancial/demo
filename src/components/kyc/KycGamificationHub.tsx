'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { KycTier } from '@/lib/compliance/tieredKyc';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: KycTier;
  completed: boolean;
  reward: string;
  progress: number;
  maxProgress: number;
}

interface KycGamificationHubProps {
  currentTier: KycTier;
  onTierUpgrade: (targetTier: KycTier) => void;
  className?: string;
}

const KycGamificationHub: React.FC<KycGamificationHubProps> = ({
  currentTier,
  onTierUpgrade,
  className = ''
}) => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalProgress, setTotalProgress] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');

  const achievementDefinitions: Achievement[] = [
    {
      id: 'first_steps',
      title: '🚀 First Steps',
      description: 'Complete basic account setup',
      icon: '🎯',
      tier: KycTier.TIER_0,
      completed: false,
      reward: 'Account Dashboard Access',
      progress: 0,
      maxProgress: 1
    },
    {
      id: 'verified_user',
      title: '✅ Verified User',
      description: 'Complete Tier 1 basic verification',
      icon: '🛡️',
      tier: KycTier.TIER_1,
      completed: false,
      reward: '$1,000 transaction limit unlock',
      progress: 0,
      maxProgress: 1
    },
    {
      id: 'power_user',
      title: '⚡ Power User',
      description: 'Complete Tier 2 full verification',
      icon: '🔥',
      tier: KycTier.TIER_2,
      completed: false,
      reward: '$10,000 limits + DeFi access',
      progress: 0,
      maxProgress: 1
    },
    {
      id: 'premium_member',
      title: '👑 Premium Member',
      description: 'Complete Tier 3 enhanced verification',
      icon: '💎',
      tier: KycTier.TIER_3,
      completed: false,
      reward: 'Unlimited access + Premium features',
      progress: 0,
      maxProgress: 1
    },
    {
      id: 'first_deposit',
      title: '💰 First Deposit',
      description: 'Make your first deposit',
      icon: '🎁',
      tier: KycTier.TIER_1,
      completed: false,
      reward: 'Welcome bonus eligibility',
      progress: 0,
      maxProgress: 1
    },
    {
      id: 'cross_chain_explorer',
      title: '🌉 Cross-Chain Explorer',
      description: 'Complete your first bridge transaction',
      icon: '🔗',
      tier: KycTier.TIER_2,
      completed: false,
      reward: 'Advanced trading features',
      progress: 0,
      maxProgress: 1
    },
    {
      id: 'card_holder',
      title: '💳 Card Holder',
      description: 'Activate your USD Financial card',
      icon: '🎴',
      tier: KycTier.TIER_3,
      completed: false,
      reward: '2% cashback on all purchases',
      progress: 0,
      maxProgress: 1
    }
  ];

  useEffect(() => {
    loadAchievements();
  }, [user?.id, currentTier]);

  const loadAchievements = async () => {
    try {
      // Load user progress from API or localStorage
      const stored = localStorage.getItem(`achievements_${user?.id}`);
      let userAchievements = achievementDefinitions.map(def => ({ ...def }));

      if (stored) {
        const progress = JSON.parse(stored);
        userAchievements = userAchievements.map(achievement => ({
          ...achievement,
          completed: progress[achievement.id]?.completed || false,
          progress: progress[achievement.id]?.progress || 0
        }));
      }

      // Update achievements based on current tier
      userAchievements = userAchievements.map(achievement => {
        if (getCurrentTierLevel(currentTier) >= getCurrentTierLevel(achievement.tier)) {
          if (!achievement.completed && achievement.tier !== KycTier.TIER_0) {
            triggerCelebration(achievement);
          }
          return { ...achievement, completed: true, progress: achievement.maxProgress };
        }
        return achievement;
      });

      setAchievements(userAchievements);
      calculateTotalProgress(userAchievements);
      saveAchievements(userAchievements);

    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const getCurrentTierLevel = (tier: KycTier): number => {
    switch (tier) {
      case KycTier.TIER_0: return 0;
      case KycTier.TIER_1: return 1;
      case KycTier.TIER_2: return 2;
      case KycTier.TIER_3: return 3;
      default: return 0;
    }
  };

  const calculateTotalProgress = (achievements: Achievement[]) => {
    const totalCompleted = achievements.filter(a => a.completed).length;
    const totalPossible = achievements.length;
    const progressPercentage = Math.round((totalCompleted / totalPossible) * 100);
    setTotalProgress(progressPercentage);
  };

  const saveAchievements = (achievements: Achievement[]) => {
    const progress = achievements.reduce((acc, achievement) => {
      acc[achievement.id] = {
        completed: achievement.completed,
        progress: achievement.progress
      };
      return acc;
    }, {} as Record<string, { completed: boolean; progress: number }>);

    localStorage.setItem(`achievements_${user?.id}`, JSON.stringify(progress));
  };

  const triggerCelebration = (achievement: Achievement) => {
    setShowCelebration(true);
    setCelebrationMessage(`🎉 Achievement Unlocked: ${achievement.title}!`);
    
    setTimeout(() => {
      setShowCelebration(false);
    }, 3000);
  };

  const getNextTier = (): KycTier | null => {
    const currentLevel = getCurrentTierLevel(currentTier);
    const nextLevel = currentLevel + 1;
    
    switch (nextLevel) {
      case 1: return KycTier.TIER_1;
      case 2: return KycTier.TIER_2;
      case 3: return KycTier.TIER_3;
      default: return null;
    }
  };

  const getProgressToNextTier = (): number => {
    const currentLevel = getCurrentTierLevel(currentTier);
    return Math.min(currentLevel * 33.33, 100);
  };

  const nextTier = getNextTier();

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 ${className}`}>
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
          {celebrationMessage}
        </div>
      )}

      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Verification Progress</h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-emerald-600">{totalProgress}%</div>
            <div className="text-sm text-gray-500">Complete</div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="relative">
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700 ease-out"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Getting Started</span>
            <span>Full Access</span>
          </div>
        </div>
      </div>

      {/* Current Tier Status */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">Current Level</h4>
            <div className="flex items-center">
              <span className="text-2xl mr-2">
                {currentTier === KycTier.TIER_0 && '🌱'}
                {currentTier === KycTier.TIER_1 && '🛡️'}
                {currentTier === KycTier.TIER_2 && '🔥'}
                {currentTier === KycTier.TIER_3 && '👑'}
              </span>
              <span className="font-medium text-gray-700">
                {currentTier === KycTier.TIER_0 && 'Getting Started'}
                {currentTier === KycTier.TIER_1 && 'Verified User'}
                {currentTier === KycTier.TIER_2 && 'Power User'}
                {currentTier === KycTier.TIER_3 && 'Premium Member'}
              </span>
            </div>
          </div>

          {nextTier && (
            <button
              onClick={() => onTierUpgrade(nextTier)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              Upgrade Now
            </button>
          )}
        </div>

        {nextTier && (
          <div className="bg-emerald-50 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-800">Next: 
                {nextTier === KycTier.TIER_1 && ' Verified User'}
                {nextTier === KycTier.TIER_2 && ' Power User'}
                {nextTier === KycTier.TIER_3 && ' Premium Member'}
              </span>
              <span className="text-emerald-600 font-medium">
                {getCurrentTierLevel(nextTier) === 1 && '2-3 minutes'}
                {getCurrentTierLevel(nextTier) === 2 && '5-7 minutes'}
                {getCurrentTierLevel(nextTier) === 3 && '10-12 minutes'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Achievements Grid */}
      <div className="p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Achievements
        </h4>

        <div className="grid gap-3">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-lg border transition-all ${
                achievement.completed
                  ? 'border-emerald-200 bg-emerald-50'
                  : getCurrentTierLevel(currentTier) >= getCurrentTierLevel(achievement.tier) - 1
                    ? 'border-yellow-200 bg-yellow-50'
                    : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <div className="text-2xl mr-3">
                    {achievement.completed ? '✅' : achievement.icon}
                  </div>
                  <div className="flex-1">
                    <h5 className={`font-medium ${
                      achievement.completed ? 'text-emerald-800' : 'text-gray-900'
                    }`}>
                      {achievement.title}
                    </h5>
                    <p className="text-sm text-gray-600 mb-1">
                      {achievement.description}
                    </p>
                    <p className="text-xs text-emerald-600 font-medium">
                      🎁 {achievement.reward}
                    </p>
                  </div>
                </div>

                <div className="text-right ml-4">
                  {achievement.completed ? (
                    <div className="text-emerald-600">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Preview */}
      {nextTier && (
        <div className="p-6 border-t border-gray-100 bg-gradient-to-r from-emerald-50 to-blue-50">
          <h4 className="font-semibold text-gray-900 mb-3">Unlock Next Level</h4>
          <div className="text-sm text-gray-700 space-y-1">
            {nextTier === KycTier.TIER_1 && (
              <>
                <div>• Send up to $1,000 per transaction</div>
                <div>• Monthly volume up to $3,000</div>
                <div>• Basic swaps and transfers</div>
              </>
            )}
            {nextTier === KycTier.TIER_2 && (
              <>
                <div>• Transactions up to $10,000</div>
                <div>• Fiat on/off ramps</div>
                <div>• Cross-chain bridging</div>
                <div>• DeFi yield farming</div>
              </>
            )}
            {nextTier === KycTier.TIER_3 && (
              <>
                <div>• Unlimited transaction amounts</div>
                <div>• Virtual & physical debit cards</div>
                <div>• Crypto-collateralized loans</div>
                <div>• Priority customer support</div>
              </>
            )}
          </div>
          
          <button
            onClick={() => onTierUpgrade(nextTier)}
            className="mt-4 w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200"
          >
            Upgrade Now ({getCurrentTierLevel(nextTier) === 1 && '2-3 min'}{getCurrentTierLevel(nextTier) === 2 && '5-7 min'}{getCurrentTierLevel(nextTier) === 3 && '10-12 min'})
          </button>
        </div>
      )}
    </div>
  );
};

export default KycGamificationHub;