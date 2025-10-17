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
 * Detecta si la app está corriendo en TestFlight
 * IMPORTANTE: TestFlight debe tratarse como PRODUCCIÓN para servicios externos (AdMob, RevenueCat)
 */
export function isTestFlightBuild(): boolean {
  try {
    // En web, nunca es TestFlight
    if (Platform.OS === 'web') {
      return false;
    }

    const Constants = require('expo-constants').default;

    // Método 1: Variable de entorno explícita (más confiable)
    if (process.env.EXPO_PUBLIC_IS_TESTFLIGHT === 'true') {
      console.log('[Environment] TestFlight detected via env variable');
      return true;
    }

    // Método 2: Verificar canal de updates de Expo
    if (Constants.expoConfig?.updates?.channel) {
      const channel = Constants.expoConfig.updates.channel;
      console.log('[Environment] Updates channel:', channel);

      // TestFlight normalmente usa 'testflight' como canal
      if (channel === 'testflight') {
        return true;
      }

      // Si hay un canal específico de producción configurado, no es TestFlight
      if (channel === 'production' || channel === 'prod') {
        return false;
      }
    }

    // Método 3: Verificar información de la app desde expo-application
    try {
      const Application = require('expo-application');
      const buildNumber = Application.nativeBuildVersion;
      const version = Application.nativeApplicationVersion;

      console.log('[Environment] App version:', version, 'Build:', buildNumber);

      // TestFlight builds tienen __DEV__ = false
      const isReleaseBuild = !__DEV__;

      // Si es release build pero no es web ni Expo Go, podría ser TestFlight
      if (isReleaseBuild && !isExpoGo() && Platform.OS !== 'web') {
        // Por defecto, asumimos que builds de release sin canal explícito son TestFlight
        // Esto es más seguro ya que TestFlight debe usar configuración de producción
        const hasNoChannel = !Constants.expoConfig?.updates?.channel;
        console.log('[Environment] Release build without channel - likely TestFlight:', hasNoChannel);
        return false; // IMPORTANTE: Retornamos false para que use configuración de producción
      }
    } catch (error) {
      console.log('[Environment] expo-application not available:', error);
    }

    return false;
  } catch (error) {
    console.log('[Environment] Error detecting TestFlight build:', error);
    // Por defecto, tratamos como producción para evitar problemas
    return false;
  }
}

/**
 * Obtiene el entorno de ejecución como string
 * NOTA: Para servicios externos (AdMob, RevenueCat), TestFlight debe tratarse como 'production'
 */
export function getEnvironment(): 'expo-go' | 'development' | 'testflight' | 'production' {
  if (isExpoGo()) {
    return 'expo-go';
  }

  // CRÍTICO: TestFlight ahora retorna 'production' para que use IDs reales
  // Esto soluciona el problema de anuncios y compras en TestFlight
  if (isTestFlightBuild()) {
    console.log('[Environment] TestFlight detected - using PRODUCTION configuration');
    return 'production'; // Cambiado de 'testflight' a 'production'
  }

  if (isProduction()) {
    return 'production';
  }
  return 'development';
}

/**
 * Detecta si debemos usar configuración de producción para servicios externos
 * (AdMob, RevenueCat, etc.)
 */
export function shouldUseProductionConfig(): boolean {
  const env = getEnvironment();
  // Tanto TestFlight como Production deben usar configuración real
  return env === 'production' || env === 'testflight';
}

/**
 * Obtiene el entorno de la app basado en la variable APP_ENV
 * Esta función determina qué IDs de AdMob usar (test o producción)
 *
 * @returns 'development' | 'production'
 */
export function getAppEnvironment(): 'development' | 'production' {
  const appEnv = process.env.EXPO_PUBLIC_APP_ENV;

  if (appEnv === 'production') {
    console.log('[Environment] APP_ENV is production - using PRODUCTION AdMob IDs');
    return 'production';
  }

  console.log('[Environment] APP_ENV is development (or not set) - using TEST AdMob IDs');
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
