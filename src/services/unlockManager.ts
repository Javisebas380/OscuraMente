import AsyncStorage from '@react-native-async-storage/async-storage';
import { adsManager } from './ads';

interface UnlockState {
  [testId: string]: {
    [sectionKey: string]: {
      unlockedAt: string;
      method: 'ad' | 'premium';
    };
  };
}

class UnlockManager {
  private unlockState: UnlockState = {};
  private isLoaded = false;

  async initialize(): Promise<void> {
    console.log('[UnlockManager] Initializing unlock manager...');
    if (this.isLoaded) return;

    try {
      const stored = await AsyncStorage.getItem('unlock_state');
      console.log('[UnlockManager] Stored unlock state:', stored);
      if (stored) {
        this.unlockState = JSON.parse(stored);
        console.log('[UnlockManager] Parsed unlock state:', Object.keys(this.unlockState));
      }
      this.isLoaded = true;
      console.log('[UnlockManager] Initialization completed');
    } catch (error) {
      console.error('[UnlockManager] Error loading unlock state:', error);
    }
  }

  private async saveState(): Promise<void> {
    try {
      await AsyncStorage.setItem('unlock_state', JSON.stringify(this.unlockState));
      console.log('[UnlockManager] Unlock state saved successfully');
    } catch (error) {
      console.error('[UnlockManager] Error saving unlock state:', error);
    }
  }

  isUnlocked(testId: string, sectionKey: string): boolean {
    const isUnlocked = !!this.unlockState[testId]?.[sectionKey];
    console.log('[UnlockManager] Checking unlock status:', { testId, sectionKey, isUnlocked });
    return isUnlocked;
  }

  async unlockWithAd(testId: string, sectionKey: string): Promise<{ success: boolean; error?: string }> {
    const placementKey = `unlock:${testId}:${sectionKey}`;
    console.log('[UnlockManager] Starting ad unlock process:', { testId, sectionKey, placementKey });
    
    try {
      console.log('[UnlockManager] Calling adsManager.showRewarded...');
      const result = await adsManager.showRewarded(placementKey);
      console.log('[UnlockManager] Ad result received:', result);
      
      if (result.success && result.rewarded) {
        console.log('[UnlockManager] Ad was successful, marking as unlocked');
        // Mark as unlocked
        if (!this.unlockState[testId]) {
          this.unlockState[testId] = {};
        }
        
        this.unlockState[testId][sectionKey] = {
          unlockedAt: new Date().toISOString(),
          method: 'ad',
        };
        
        await this.saveState();
        console.log('[UnlockManager] Section unlocked and state saved');
        return { success: true };
      } else {
        console.log('[UnlockManager] Ad was not successful or not rewarded');
        return { 
          success: false, 
          error: result.error || 'Ad was not completed' 
        };
      }
    } catch (error) {
      console.error('[UnlockManager] Error unlocking with ad:', error);
      return { success: false, error: 'Failed to show ad' };
    }
  }

  async unlockWithPremium(testId: string, sectionKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.unlockState[testId]) {
        this.unlockState[testId] = {};
      }
      
      this.unlockState[testId][sectionKey] = {
        unlockedAt: new Date().toISOString(),
        method: 'premium',
      };
      
      await this.saveState();
      return { success: true };
    } catch (error) {
      console.error('Error unlocking with premium:', error);
      return { success: false, error: 'Failed to unlock' };
    }
  }

  async preloadAdsForTest(testId: string, sections: string[]): Promise<void> {
    console.log('[UnlockManager] Preloading ads for test:', { testId, sections });
    
    if (!this.isLoaded) {
      console.log('[UnlockManager] Not initialized, skipping preload');
      return;
    }
    
    const promises = sections.map(section => {
      const placementKey = `unlock:${testId}:${section}`;
      console.log('[UnlockManager] Preloading ad for placement:', placementKey);
      return adsManager.preloadRewarded(placementKey);
    });

    try {
      await Promise.all(promises);
      console.log('[UnlockManager] All ads preloaded successfully');
    } catch (error) {
      console.error('[UnlockManager] Error preloading ads:', error);
    }
  }

  canShowAd(testId: string, sectionKey: string): boolean {
    const placementKey = `unlock:${testId}:${sectionKey}`;
    console.log('[UnlockManager] Checking if can show ad:', { testId, sectionKey, placementKey });
    return adsManager.canShowRewarded(placementKey);
  }

  getAdCooldown(testId: string, sectionKey: string): number {
    const placementKey = `unlock:${testId}:${sectionKey}`;
    console.log('[UnlockManager] Getting ad cooldown:', { testId, sectionKey, placementKey });
    return adsManager.getRemainingCooldown(placementKey);
  }
}

export const unlockManager = new UnlockManager();