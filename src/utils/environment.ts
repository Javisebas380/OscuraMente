import { Platform } from 'react-native';
import Constants from 'expo-constants';

export function isExpoGo(): boolean {
  if (Platform.OS === 'web') {
    return false;
  }
  return Constants.appOwnership === 'expo';
}

export function isDevelopment(): boolean {
  return __DEV__;
}

export function isProduction(): boolean {
  return !__DEV__;
}

export type AppEnvironment = 'development' | 'production';

export function getAppEnvironment(): AppEnvironment {
  const env = process.env.EXPO_PUBLIC_APP_ENV;
  return env === 'production' ? 'production' : 'development';
}

export function getEnvironment(): 'expo-go' | 'development-build' | 'web' {
  if (Platform.OS === 'web') {
    return 'web';
  }
  if (isExpoGo()) {
    return 'expo-go';
  }
  return 'development-build';
}

export function isValidAdMobId(id: string | undefined): boolean {
  if (!id) return false;
  return id.startsWith('ca-app-pub-') && id.includes('~');
}

export function isValidRevenueCatKey(key: string | undefined): boolean {
  if (!key) return false;
  return key.startsWith('appl_') || key.startsWith('goog_') || key.startsWith('test_');
}

export function isTestRevenueCatKey(key: string | undefined): boolean {
  if (!key) return false;
  return key.startsWith('test_');
}

export function getRevenueCatKeyType(key: string | undefined): 'production' | 'test' | 'invalid' {
  if (!key) return 'invalid';
  if (key.startsWith('test_')) return 'test';
  if (key.startsWith('appl_') || key.startsWith('goog_')) return 'production';
  return 'invalid';
}

export function validateEnvironmentConfig(): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];
  const appEnv = getAppEnvironment();

  if (Platform.OS === 'web' || isExpoGo()) {
    return { isValid: true, warnings: ['Running in mock mode (web or Expo Go)'], errors: [] };
  }

  const iosAdMobId = appEnv === 'production'
    ? process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID_PROD
    : process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID_TEST;

  const androidAdMobId = appEnv === 'production'
    ? process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID_PROD
    : process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID_TEST;

  const iosRcKey = appEnv === 'production'
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY_PROD
    : process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY_DEV;

  const androidRcKey = appEnv === 'production'
    ? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY_PROD
    : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY_DEV;

  if (Platform.OS === 'ios') {
    if (!isValidAdMobId(iosAdMobId)) {
      warnings.push(`AdMob iOS ID is invalid or missing (env: ${appEnv})`);
    }
    if (!isValidRevenueCatKey(iosRcKey)) {
      warnings.push(`RevenueCat iOS key is invalid or missing (env: ${appEnv})`);
    } else {
      const keyType = getRevenueCatKeyType(iosRcKey);
      if (keyType === 'test' && appEnv === 'production') {
        warnings.push(`Using TEST RevenueCat key in PRODUCTION mode (iOS)`);
      }
    }
  } else if (Platform.OS === 'android') {
    if (!isValidAdMobId(androidAdMobId)) {
      warnings.push(`AdMob Android ID is invalid or missing (env: ${appEnv})`);
    }
    if (!isValidRevenueCatKey(androidRcKey)) {
      warnings.push(`RevenueCat Android key is invalid or missing (env: ${appEnv})`);
    } else {
      const keyType = getRevenueCatKeyType(androidRcKey);
      if (keyType === 'test' && appEnv === 'production') {
        warnings.push(`Using TEST RevenueCat key in PRODUCTION mode (Android)`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

export function devLog(component: string, ...args: any[]): void {
  if (isDevelopment()) {
    console.log(`[${component}]`, ...args);
  }
}

export function errorLog(component: string, message: string, error?: any): void {
  console.error(`[${component}] ${message}`, error || '');
}

export function warnLog(component: string, ...args: any[]): void {
  console.warn(`[${component}]`, ...args);
}

export function logRevenueCatStatus(): void {
  if (!isDevelopment()) return;

  const appEnv = getAppEnvironment();
  const platform = Platform.OS;

  const key = platform === 'ios'
    ? (appEnv === 'production'
        ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY_PROD
        : process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY_DEV)
    : (appEnv === 'production'
        ? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY_PROD
        : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY_DEV);

  const keyType = getRevenueCatKeyType(key);
  const isValid = isValidRevenueCatKey(key);
  const keyPreview = key ? `${key.substring(0, 10)}...` : 'NOT SET';

  console.log('='.repeat(60));
  console.log('📊 REVENUECAT STATUS');
  console.log('='.repeat(60));
  console.log(`Platform: ${platform}`);
  console.log(`App Environment: ${appEnv}`);
  console.log(`Key Type: ${keyType}`);
  console.log(`Key Valid: ${isValid ? '✅' : '❌'}`);
  console.log(`Key Preview: ${keyPreview}`);
  console.log(`Entitlement: ${process.env.EXPO_PUBLIC_RC_ENTITLEMENT || 'premium'}`);
  console.log('='.repeat(60));
}
