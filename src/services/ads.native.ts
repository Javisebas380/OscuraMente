import { Platform } from 'react-native';
import { isExpoGo, devLog, errorLog, isProduction } from '../utils/environment';

interface AdResult {
  success: boolean;
  rewarded: boolean;
  error?: string;
}

class AdsManager {
  private isInitialized = false;
  private readonly COOLDOWN_TIME = 90000; // 90 seconds
  private lastAdShown: { [key: string]: number } = {};
  private loadedAds: { [key: string]: any } = {}; // Store loaded ad instances
  private usesMockAds = false;

  async initialize(): Promise<boolean> {
    devLog('AdsManager', 'Initializing ads manager...');

    if (Platform.OS === 'web') {
      devLog('AdsManager', 'Web platform detected - using mock implementation');
      this.isInitialized = true;
      this.usesMockAds = true;
      return true;
    }

    try {
      if (isExpoGo()) {
        devLog('AdsManager', 'Expo Go detected - using mock implementation for compatibility');
        this.isInitialized = true;
        this.usesMockAds = true;
        return true;
      }

      // Try to initialize real AdMob for development/production builds
      devLog('AdsManager', 'Attempting to initialize real AdMob...');
      const { GoogleMobileAds } = require('react-native-google-mobile-ads');

      // Timeout de seguridad para la inicialización
      const initPromise = GoogleMobileAds().initialize();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AdMob initialization timeout')), 5000)
      );

      await Promise.race([initPromise, timeoutPromise]);
      devLog('AdsManager', 'Real AdMob initialized successfully');
      this.isInitialized = true;
      this.usesMockAds = false;
      return true;
    } catch (error: any) {
      errorLog('AdsManager', 'Failed to initialize real AdMob, falling back to mock', error);
      this.isInitialized = true;
      this.usesMockAds = true;
      return true;
    }
  }

  async preloadRewarded(placementKey: string): Promise<boolean> {
    console.log(`[AdsManager] Preloading rewarded ad for placement: ${placementKey}`);

    if (!this.isInitialized) {
      console.log('[AdsManager] Not initialized, cannot preload');
      return false;
    }

    try {
      if (this.usesMockAds) {
        console.log(`[AdsManager] Mock preload for ${placementKey} - success`);
        return true;
      }

      // Real AdMob preload logic
      console.log(`[AdsManager] Starting real AdMob preload for ${placementKey}`);
      const { RewardedAd, AdEventType, TestIds } = require('react-native-google-mobile-ads');
      
      // Use test ID for development, real ID for production
      const adUnitId = __DEV__ ? TestIds.REWARDED : (process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID_PROD || TestIds.REWARDED);
      devLog('AdsManager', `Using ad unit ID: ${adUnitId?.substring(0, 20)}... (dev: ${__DEV__})`);
      
      const rewarded = RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });

      // Store the ad instance
      this.loadedAds[placementKey] = rewarded;

      return new Promise((resolve) => {
        const unsubscribeLoaded = rewarded.addAdEventListener(AdEventType.LOADED, () => {
          console.log(`[AdsManager] Real ad loaded successfully for ${placementKey}`);
          unsubscribeLoaded();
          resolve(true);
        });

        const unsubscribeError = rewarded.addAdEventListener(AdEventType.ERROR, (error: any) => {
          console.log(`[AdsManager] Error loading real ad for ${placementKey}:`, error);
          unsubscribeError();
          resolve(false);
        });

        rewarded.load();
      });
    } catch (error: any) {
      errorLog('AdsManager', `Error preloading ad for ${placementKey}`, error);
      return false;
    }
  }

  async showRewarded(placementKey: string): Promise<AdResult> {
    console.log(`[AdsManager] Attempting to show rewarded ad for placement: ${placementKey}`);
    
    if (!this.isInitialized) {
      console.log('[AdsManager] Not initialized, cannot show ad');
      return { success: false, rewarded: false, error: 'Ads not initialized' };
    }

    // Check cooldown
    const now = Date.now();
    const lastShown = this.lastAdShown[placementKey] || 0;
    if (now - lastShown < this.COOLDOWN_TIME) {
      const remainingTime = Math.ceil((this.COOLDOWN_TIME - (now - lastShown)) / 1000);
      console.log(`[AdsManager] Cooldown active for ${placementKey}, ${remainingTime}s remaining`);
      return { 
        success: false, 
        rewarded: false, 
        error: `Espera ${remainingTime} segundos antes de ver otro anuncio` 
      };
    }

    try {
      if (this.usesMockAds) {
        console.log(`[AdsManager] Showing mock ad for ${placementKey}...`);
        
        // Simulate ad showing for Expo Go
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        this.lastAdShown[placementKey] = now;
        console.log(`[AdsManager] Mock ad completed successfully for ${placementKey}`);
        return { success: true, rewarded: true };
      }

      // Real AdMob show logic
      console.log(`[AdsManager] Attempting to show real ad for ${placementKey}`);
      const { AdEventType } = require('react-native-google-mobile-ads');
      
      const rewarded = this.loadedAds[placementKey];
      if (!rewarded) {
        console.log(`[AdsManager] No preloaded ad found for ${placementKey}, attempting to preload first`);
        const preloadSuccess = await this.preloadRewarded(placementKey);
        if (!preloadSuccess) {
          return { success: false, rewarded: false, error: 'Failed to load ad' };
        }
      }

      return new Promise((resolve) => {
        let adResult: AdResult = { success: false, rewarded: false };

        const unsubscribeEarned = rewarded.addAdEventListener(AdEventType.EARNED_REWARD, (reward: any) => {
          console.log(`[AdsManager] User earned reward for ${placementKey}:`, reward);
          adResult = { success: true, rewarded: true };
        });

        const unsubscribeClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
          console.log(`[AdsManager] Ad closed for ${placementKey}, result:`, adResult);
          unsubscribeEarned();
          unsubscribeClosed();
          unsubscribeError();
          
          if (adResult.rewarded) {
            this.lastAdShown[placementKey] = now;
          }
          
          // Clean up the ad instance
          delete this.loadedAds[placementKey];
          resolve(adResult);
        });

        const unsubscribeError = rewarded.addAdEventListener(AdEventType.ERROR, (error: any) => {
          console.log(`[AdsManager] Error showing ad for ${placementKey}:`, error);
          unsubscribeEarned();
          unsubscribeClosed();
          unsubscribeError();
          
          // Clean up the ad instance
          delete this.loadedAds[placementKey];
          resolve({ success: false, rewarded: false, error: 'Ad failed to show' });
        });

        rewarded.show();
      });
    } catch (error: any) {
      errorLog('AdsManager', `Error showing ad for ${placementKey}`, error);
      return { success: false, rewarded: false, error: 'Failed to show ad' };
    }
  }

  canShowRewarded(placementKey: string): boolean {
    console.log(`[AdsManager] Checking if can show ad for ${placementKey}`);
    
    if (!this.isInitialized) {
      console.log('[AdsManager] Not initialized, cannot show ad');
      return false;
    }

    const now = Date.now();
    const lastShown = this.lastAdShown[placementKey] || 0;
    const canShow = (now - lastShown) >= this.COOLDOWN_TIME;
    
    console.log(`[AdsManager] Can show ad for ${placementKey}: ${canShow}`);
    return canShow;
  }

  getRemainingCooldown(placementKey: string): number {
    const now = Date.now();
    const lastShown = this.lastAdShown[placementKey] || 0;
    const remaining = this.COOLDOWN_TIME - (now - lastShown);
    const remainingSeconds = Math.max(0, Math.ceil(remaining / 1000));
    
    console.log(`[AdsManager] Remaining cooldown for ${placementKey}: ${remainingSeconds}s`);
    return remainingSeconds;
  }
}

export const adsManager = new AdsManager();