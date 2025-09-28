import { Platform } from 'react-native';

interface AdResult {
  success: boolean;
  rewarded: boolean;
  error?: string;
}

class AdsManager {
  private isInitialized = false;

  async initialize(): Promise<boolean> {
    console.log('AdMob not supported on web platform');
    this.isInitialized = true;
    return false;
  }

  async preloadRewarded(placementKey: string): Promise<boolean> {
    console.log(`Mock preload rewarded ad for ${placementKey} on web`);
    return false;
  }

  async showRewarded(placementKey: string): Promise<AdResult> {
    console.log(`Mock show rewarded ad for ${placementKey} on web`);
    return { 
      success: false, 
      rewarded: false, 
      error: 'Ads not available on web platform' 
    };
  }

  canShowRewarded(placementKey: string): boolean {
    return false;
  }

  getRemainingCooldown(placementKey: string): number {
    return 0;
  }
}

export const adsManager = new AdsManager();