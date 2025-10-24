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

export function getEnvironment(): 'expo-go' | 'development-build' | 'web' {
  if (Platform.OS === 'web') {
    return 'web';
  }
  if (isExpoGo()) {
    return 'expo-go';
  }
  return 'development-build';
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
