import { Platform } from 'react-native';

/**
 * Detecta de forma robusta si la app está corriendo en Expo Go
 * Esta función maneja múltiples casos de detección para mayor confiabilidad
 */
export function isExpoGo(): boolean {
  try {
    // Intento 1: Verificar usando expo-constants
    const Constants = require('expo-constants').default;
    if (Constants && typeof Constants.appOwnership === 'string') {
      return Constants.appOwnership === 'expo';
    }
  } catch (error) {
    // Si expo-constants falla, continuamos con otros métodos
    console.log('[Environment] expo-constants not available or failed:', error);
  }

  try {
    // Intento 2: Verificar usando ExecutionEnvironment (solo web)
    if (Platform.OS === 'web') {
      return false; // Web nunca es Expo Go
    }

    // Intento 3: Verificar presencia de módulos nativos
    // En Expo Go, ciertos módulos nativos no están disponibles
    const { NativeModules } = require('react-native');

    // Si hay módulos nativos personalizados, probablemente no es Expo Go
    if (NativeModules.RNGoogleMobileAds || NativeModules.RNPurchases) {
      return false;
    }
  } catch (error) {
    console.log('[Environment] NativeModules check failed:', error);
  }

  // Por defecto, asumimos Expo Go en entornos donde no podemos determinar con certeza
  // Esto es más seguro porque usa mock implementations
  return true;
}

/**
 * Detecta si la app está en modo producción
 */
export function isProduction(): boolean {
  // __DEV__ es una variable global de React Native
  return !__DEV__;
}

/**
 * Obtiene el entorno de ejecución como string
 */
export function getEnvironment(): 'expo-go' | 'development' | 'production' {
  if (isExpoGo()) {
    return 'expo-go';
  }
  if (isProduction()) {
    return 'production';
  }
  return 'development';
}

/**
 * Verifica si un módulo nativo está disponible
 */
export function isNativeModuleAvailable(moduleName: string): boolean {
  try {
    const { NativeModules } = require('react-native');
    return !!NativeModules[moduleName];
  } catch {
    return false;
  }
}

/**
 * Log seguro que solo muestra en desarrollo
 */
export function devLog(category: string, message: string, data?: any) {
  if (!isProduction()) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}][${category}] ${message}`, data || '');
  }
}

/**
 * Log de error que siempre se muestra
 */
export function errorLog(category: string, message: string, error?: any) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}][${category}] ERROR: ${message}`, error || '');
}
