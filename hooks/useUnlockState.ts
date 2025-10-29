import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { SubscriptionState } from './useSubscription';
import { adsManager } from '../src/services/ads';
import { devLog, errorLog } from '../src/utils/environment';

interface UnlockState {
  [testId: string]: {
    [trait: string]: {
      [section: string]: boolean;
    };
  };
}

interface DailyFreeUsage {
  [key: string]: string; // key: testId_trait_section, value: date string
}

export function useUnlockState(subscription: SubscriptionState) {
  const [unlockedSections, setUnlockedSections] = useState<UnlockState>({});
  const [dailyFreeUsage, setDailyFreeUsage] = useState<DailyFreeUsage>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUnlockState();
  }, []);

  const loadUnlockState = async () => {
    try {
      const [unlockedData, dailyData] = await Promise.all([
        AsyncStorage.getItem('unlocked_sections'),
        AsyncStorage.getItem('daily_free_usage')
      ]);

      if (unlockedData) {
        setUnlockedSections(JSON.parse(unlockedData));
      }

      if (dailyData) {
        setDailyFreeUsage(JSON.parse(dailyData));
      }
    } catch (error) {
      console.error('Error loading unlock state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUnlockState = async (newState: UnlockState) => {
    try {
      await AsyncStorage.setItem('unlocked_sections', JSON.stringify(newState));
    } catch (error) {
      console.error('Error saving unlock state:', error);
    }
  };

  const saveDailyFreeUsage = async (newUsage: DailyFreeUsage) => {
    try {
      await AsyncStorage.setItem('daily_free_usage', JSON.stringify(newUsage));
    } catch (error) {
      console.error('Error saving daily free usage:', error);
    }
  };

  const isUnlocked = (testId: string, trait: string, section: string): boolean => {
    // Premium users get everything unlocked
    const isPremiumSection = section === 'premium' || section === 'premium_global' || trait === 'global';
    
    if (isPremiumSection && subscription.isActive && subscription.isActiveChecked) {
      return true;
    }

    // Check if specifically unlocked
    const specificUnlock = unlockedSections[testId]?.[trait]?.[section] || false;
    
    return specificUnlock;
  };

  const canUseFreeUnlock = (testId: string, trait: string, section: string): boolean => {
    const key = `${testId}_${trait}_${section}`;
    const lastUsed = dailyFreeUsage[key];
    
    if (!lastUsed) return true;
    
    const today = new Date().toDateString();
    const canUse = lastUsed !== today;
    return canUse;
  };

  const unlockSection = async (testId: string, trait: string, section: string, method: 'ad' | 'premium' | 'free') => {
    try {
      devLog('useUnlockState', `Attempting to unlock section: ${section} via ${method}`);

      // If unlocking via ad, show the ad first
      if (method === 'ad') {
        devLog('useUnlockState', 'Showing rewarded ad...');

        // Ensure ads are initialized
        if (!adsManager.isInitialized()) {
          errorLog('useUnlockState', 'Ads not initialized, initializing now...');
          await adsManager.initialize();
        }

        // Show the rewarded ad
        const adResult = await adsManager.showRewardedAd();

        if (!adResult.success) {
          errorLog('useUnlockState', 'Ad failed to show', adResult.error);
          return {
            success: false,
            error: adResult.error || 'No se pudo mostrar el anuncio'
          };
        }

        devLog('useUnlockState', 'Ad completed successfully, unlocking section');
      }

      // Update unlocked sections
      const newUnlockedSections = {
        ...unlockedSections,
        [testId]: {
          ...unlockedSections[testId],
          [trait]: {
            ...unlockedSections[testId]?.[trait],
            [section]: true,
          },
        },
      };

      setUnlockedSections(newUnlockedSections);
      await saveUnlockState(newUnlockedSections);

      // Track daily free usage
      if (method === 'free') {
        const key = `${testId}_${trait}_${section}`;
        const today = new Date().toDateString();
        const newDailyUsage = {
          ...dailyFreeUsage,
          [key]: today,
        };

        setDailyFreeUsage(newDailyUsage);
        await saveDailyFreeUsage(newDailyUsage);
      }

      devLog('useUnlockState', `Section unlocked successfully via ${method}`);
      return { success: true };
    } catch (error) {
      errorLog('useUnlockState', 'Error in unlockSection', error);
      return { success: false, error: 'Error al desbloquear contenido' };
    }
  };

  const refreshUnlockState = async (testId?: string) => {
    try {
      if (testId) {
        // Clear cache for specific test
        const newUnlockedSections = { ...unlockedSections };
        if (newUnlockedSections[testId]) {
          delete newUnlockedSections[testId];
          setUnlockedSections(newUnlockedSections);
          await saveUnlockState(newUnlockedSections);
        }
      } else {
        // Reload all unlock state
        await loadUnlockState();
      }
    } catch (error) {
      console.error('Error refreshing unlock state:', error);
    }
  };
  return {
    isUnlocked,
    canUseFreeUnlock,
    unlockSection,
    refreshUnlockState,
    isLoading,
  };
}