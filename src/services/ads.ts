import { Platform } from 'react-native';
import { devLog, errorLog, isExpoGo, getEnvironment, getAppEnvironment, isValidAdMobId } from '../utils/environment';

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
    const appEnv = getAppEnvironment();
    devLog('AdsManager', `Initializing in ${environment} environment (app: ${appEnv})`);

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

    const iosAppId = appEnv === 'production'
      ? process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID_PROD
      : process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID_TEST;

    const androidAppId = appEnv === 'production'
      ? process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID_PROD
      : process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID_TEST;

    const currentAppId = Platform.OS === 'ios' ? iosAppId : androidAppId;

    if (!isValidAdMobId(currentAppId)) {
      errorLog('AdsManager', `Invalid or missing AdMob App ID for ${Platform.OS} in ${appEnv} mode`);
      errorLog('AdsManager', `Using mock implementation instead`);
      this.initialized = true;
      return true;
    }

    try {
      const { MobileAds } = await import('react-native-google-mobile-ads');
      const mobileAdsInstance = MobileAds();
      this.googleMobileAds = mobileAdsInstance;

      devLog('AdsManager', `Initializing Google Mobile Ads with ID: ${currentAppId}`);

      const initTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AdMob initialization timeout')), 3000)
      );

      await Promise.race([
        mobileAdsInstance.initialize(),
        initTimeout
      ]);

      this.initialized = true;
      devLog('AdsManager', 'Google Mobile Ads initialized successfully');
      return true;
    } catch (error) {
      errorLog('AdsManager', 'Failed to initialize Google Mobile Ads', error);
      errorLog('AdsManager', 'Continuing with mock implementation');
      this.initialized = true;
      return true;
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
    const appEnv = getAppEnvironment();

    if (environment === 'web' || environment === 'expo-go' || !this.googleMobileAds) {
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

      const { RewardedAd, RewardedAdEventType, AdEventType, TestIds } = await import('react-native-google-mobile-ads');

      let unitId: string;
      if (adUnitId) {
        unitId = adUnitId;
      } else {
        if (appEnv === 'production') {
          unitId = Platform.OS === 'ios'
            ? process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS_PROD || TestIds.REWARDED
            : process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID_PROD || TestIds.REWARDED;
        } else {
          unitId = Platform.OS === 'ios'
            ? process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS_TEST || TestIds.REWARDED
            : process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID_TEST || TestIds.REWARDED;
        }
      }

      devLog('AdsManager', `Using ad unit ID: ${unitId} (env: ${appEnv})`);

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
            unsubscribeClosed();
            resolve({ success: true });
          }
        );

        const unsubscribeClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
          devLog('AdsManager', 'Ad closed by user');
          unsubscribeLoaded();
          unsubscribeEarned();
          unsubscribeClosed();
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
            unsubscribeClosed();
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
