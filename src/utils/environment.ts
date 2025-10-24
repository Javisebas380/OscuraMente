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
  return key.startsWith('appl_') || key.startsWith('goog_');
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
    }
  } else if (Platform.OS === 'android') {
    if (!isValidAdMobId(androidAdMobId)) {
      warnings.push(`AdMob Android ID is invalid or missing (env: ${appEnv})`);
    }
    if (!isValidRevenueCatKey(androidRcKey)) {
      warnings.push(`RevenueCat Android key is invalid or missing (env: ${appEnv})`);
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
