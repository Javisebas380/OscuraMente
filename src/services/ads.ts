import { Platform } from 'react-native';
import { devLog, errorLog, isExpoGo, getEnvironment } from '../utils/environment';

export type AdType = 'rewarded' | 'interstitial' | 'banner';

export interface AdManagerInterface {
  initialize(): Promise<boolean>;
  showRewardedAd(adUnitId?: string): Promise<{ success: boolean; error?: string }>;
  isInitialized(): boolean;
  canShowAd(): boolean;
  getLastAdTime(): number | null;
  resetAdCooldown(): void;
}

class AdsManager implements AdManagerInterface {
  private initialized = false;
  private googleMobileAds: any = null;
  private lastAdTime: number | null = null;
  private readonly AD_COOLDOWN_MS = 90000; // 90 seconds

  async initialize(): Promise<boolean> {
    const environment = getEnvironment();
    devLog('AdsManager', `Initializing in ${environment} environment`);

    if (Platform.OS === 'web') {
      devLog('AdsManager', 'Web platform detected - using mock implementation');
      this.initialized = true;
      return true;
    }

    if (isExpoGo()) {
      devLog('AdsManager', 'Expo Go detected - using mock implementation');
      this.initialized = true;
      return true;
    }

    try {
      if (Platform.OS !== 'web') {
        const { default: mobileAds } = await import('react-native-google-mobile-ads');
        this.googleMobileAds = mobileAds;

        devLog('AdsManager', 'Initializing Google Mobile Ads...');
        await mobileAds.initialize();

        this.initialized = true;
        devLog('AdsManager', 'Google Mobile Ads initialized successfully');
        return true;
      }

      this.initialized = true;
      return true;
    } catch (error) {
      errorLog('AdsManager', 'Failed to initialize Google Mobile Ads', error);
      this.initialized = false;
      return false;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  canShowAd(): boolean {
    if (!this.lastAdTime) return true;

    const timeSinceLastAd = Date.now() - this.lastAdTime;
    return timeSinceLastAd >= this.AD_COOLDOWN_MS;
  }

  getLastAdTime(): number | null {
    return this.lastAdTime;
  }

  resetAdCooldown(): void {
    this.lastAdTime = null;
    devLog('AdsManager', 'Ad cooldown reset');
  }

  async showRewardedAd(adUnitId?: string): Promise<{ success: boolean; error?: string }> {
    devLog('AdsManager', 'showRewardedAd called');

    if (!this.initialized) {
      errorLog('AdsManager', 'Ads not initialized');
      return { success: false, error: 'Ads not initialized' };
    }

    if (!this.canShowAd()) {
      const timeRemaining = Math.ceil((this.AD_COOLDOWN_MS - (Date.now() - this.lastAdTime!)) / 1000);
      devLog('AdsManager', `Ad cooldown active. ${timeRemaining}s remaining`);
      return {
        success: false,
        error: `Por favor espera ${timeRemaining} segundos antes de ver otro anuncio`
      };
    }

    const environment = getEnvironment();

    if (environment === 'web' || environment === 'expo-go') {
      devLog('AdsManager', `Mock ad in ${environment} - simulating 2 second ad`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      this.lastAdTime = Date.now();
      devLog('AdsManager', 'Mock ad completed successfully');
      return { success: true };
    }

    try {
      devLog('AdsManager', 'Loading rewarded ad...');

      if (Platform.OS === 'web') {
        return { success: false, error: 'Ads not supported on web' };
      }

      const { RewardedAd, RewardedAdEventType, TestIds } = await import('react-native-google-mobile-ads');

      const unitId = adUnitId || (
        Platform.OS === 'ios'
          ? process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS_PROD || TestIds.REWARDED
          : process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID_PROD || TestIds.REWARDED
      );

      devLog('AdsManager', `Using ad unit ID: ${unitId}`);

      const rewarded = RewardedAd.createForAdRequest(unitId);

      return new Promise((resolve) => {
        let adLoaded = false;

        const unsubscribeLoaded = rewarded.addAdEventListener(
          RewardedAdEventType.LOADED,
          () => {
            devLog('AdsManager', 'Ad loaded successfully');
            adLoaded = true;
            rewarded.show().catch((error: any) => {
              errorLog('AdsManager', 'Error showing ad', error);
              resolve({ success: false, error: 'Error al mostrar el anuncio' });
            });
          }
        );

        const unsubscribeEarned = rewarded.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD,
          (reward: any) => {
            devLog('AdsManager', 'User earned reward:', reward);
            this.lastAdTime = Date.now();
            unsubscribeLoaded();
            unsubscribeEarned();
            resolve({ success: true });
          }
        );

        rewarded.addAdEventListener(RewardedAdEventType.CLOSED, () => {
          devLog('AdsManager', 'Ad closed by user');
          unsubscribeLoaded();
          unsubscribeEarned();
          if (!adLoaded || this.lastAdTime === null) {
            resolve({ success: false, error: 'Anuncio cerrado sin completar' });
          }
        });

        rewarded.load();

        setTimeout(() => {
          if (!adLoaded) {
            errorLog('AdsManager', 'Ad load timeout (10s)');
            unsubscribeLoaded();
            unsubscribeEarned();
            resolve({ success: false, error: 'Tiempo de espera agotado al cargar el anuncio' });
          }
        }, 10000);
      });
    } catch (error) {
      errorLog('AdsManager', 'Error in showRewardedAd', error);
      return { success: false, error: 'Error al cargar el anuncio' };
    }
  }
}

export const adsManager = new AdsManager();
