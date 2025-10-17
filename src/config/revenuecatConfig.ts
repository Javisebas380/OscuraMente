import Purchases from 'react-native-purchases';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const EXTRA = (Constants.manifest?.extra ?? Constants.expoConfig?.extra) || {};
const APP_ENV = process.env.EXPO_PUBLIC_APP_ENV ?? EXTRA.APP_ENV ?? (__DEV__ ? 'development' : 'production');

export const IS_DEV_REVENUECAT = APP_ENV === 'development' || APP_ENV === 'test' || __DEV__;

// Keys via env / expo extra
const KEY_DEV = process.env.EXPO_PUBLIC_REVENUECAT_PUBLIC_KEY_DEV ?? EXTRA.REVENUECAT_PUBLIC_KEY_DEV ?? '';
const KEY_PROD = process.env.EXPO_PUBLIC_REVENUECAT_PUBLIC_KEY_PROD ?? EXTRA.REVENUECAT_PUBLIC_KEY_PROD ?? '';

export const REVENUECAT_API_KEY = IS_DEV_REVENUECAT ? KEY_DEV : KEY_PROD;

let isInitialized = false;

/**
 * Inicializa RevenueCat con la API key correcta según el entorno
 * Esta función debe llamarse antes de cualquier operación de RevenueCat
 */
export function initRevenueCat(): void {
  if (isInitialized) {
    console.log('[RevenueCat] Already initialized, skipping');
    return;
  }

  if (!REVENUECAT_API_KEY) {
    console.warn('[RevenueCat] ⚠️ API key missing for env:', APP_ENV);
    console.warn('[RevenueCat] ⚠️ RevenueCat will not be available');
    return;
  }

  try {
    // Habilitar logs de debug en desarrollo
    Purchases.setDebugLogsEnabled(IS_DEV_REVENUECAT);

    // Configurar RevenueCat con la API key correcta
    Purchases.configure({ apiKey: REVENUECAT_API_KEY });

    console.log('='.repeat(60));
    console.log('[RevenueCat] Configuration');
    console.log('='.repeat(60));
    console.log(`Environment: ${APP_ENV}`);
    console.log(`Using DEV key: ${IS_DEV_REVENUECAT}`);
    console.log(`Platform: ${Platform.OS}`);
    console.log(`API Key (prefix): ${REVENUECAT_API_KEY.slice(0, 10)}...`);
    console.log(`Debug logs: ${IS_DEV_REVENUECAT ? 'enabled' : 'disabled'}`);
    console.log('='.repeat(60));

    isInitialized = true;
  } catch (error) {
    console.error('[RevenueCat] ❌ Failed to initialize:', error);
  }
}

/**
 * Carga las ofertas disponibles desde RevenueCat
 * @returns Offerings object o null si falla
 */
export async function loadOfferings() {
  if (!isInitialized) {
    console.warn('[RevenueCat] Not initialized, call initRevenueCat() first');
    return null;
  }

  try {
    console.log('[RevenueCat] Loading offerings...');
    const offerings = await Purchases.getOfferings();
    console.log('[RevenueCat] ✅ Offerings loaded:', {
      current: offerings.current?.identifier || 'none',
      availableCount: Object.keys(offerings.all).length
    });
    return offerings;
  } catch (e) {
    console.error('[RevenueCat] ❌ loadOfferings error:', e);
    return null;
  }
}

/**
 * Obtiene productos específicos por sus IDs
 * @param productIds Array de IDs de productos
 * @returns Array de productos o array vacío si falla
 */
export async function getProducts(productIds: string[]) {
  if (!isInitialized) {
    console.warn('[RevenueCat] Not initialized, call initRevenueCat() first');
    return [];
  }

  try {
    console.log('[RevenueCat] Getting products:', productIds);
    const products = await Purchases.getProducts(productIds);
    console.log('[RevenueCat] ✅ Products loaded:', products.length);
    return products;
  } catch (e) {
    console.error('[RevenueCat] ❌ getProducts error:', e);
    return [];
  }
}

/**
 * Obtiene la información del cliente actual
 * @returns CustomerInfo object o null si falla
 */
export async function getCustomerInfo() {
  if (!isInitialized) {
    console.warn('[RevenueCat] Not initialized, call initRevenueCat() first');
    return null;
  }

  try {
    console.log('[RevenueCat] Getting customer info...');
    const info = await Purchases.getCustomerInfo();
    console.log('[RevenueCat] ✅ Customer info loaded:', {
      hasActiveEntitlements: Object.keys(info.entitlements.active).length > 0,
      activeEntitlements: Object.keys(info.entitlements.active)
    });
    return info;
  } catch (e) {
    console.error('[RevenueCat] ❌ getCustomerInfo error:', e);
    return null;
  }
}

/**
 * Ejecuta una compra de un paquete
 * @param pkg Package object de RevenueCat
 * @returns Purchase result o lanza error
 */
export async function purchasePackage(pkg: any) {
  if (!isInitialized) {
    throw new Error('RevenueCat not initialized, call initRevenueCat() first');
  }

  try {
    console.log('[RevenueCat] Purchasing package:', pkg.identifier);
    const result = await Purchases.purchasePackage(pkg);
    console.log('[RevenueCat] ✅ Purchase successful:', result);
    return result;
  } catch (e: any) {
    console.error('[RevenueCat] ❌ purchasePackage error:', e);

    // Manejar errores comunes de RevenueCat
    if (e.code === 'PURCHASE_CANCELLED') {
      console.log('[RevenueCat] Purchase was cancelled by user');
    } else if (e.code === 'PRODUCT_ALREADY_PURCHASED') {
      console.log('[RevenueCat] Product already purchased');
    } else if (e.code === 'PAYMENT_PENDING') {
      console.log('[RevenueCat] Payment is pending');
    }

    throw e;
  }
}

/**
 * Restaura las compras del usuario
 * @returns CustomerInfo después de restaurar o null si falla
 */
export async function restorePurchases() {
  if (!isInitialized) {
    console.warn('[RevenueCat] Not initialized, call initRevenueCat() first');
    return null;
  }

  try {
    console.log('[RevenueCat] Restoring purchases...');
    const info = await Purchases.restorePurchases();
    console.log('[RevenueCat] ✅ Purchases restored:', {
      hasActiveEntitlements: Object.keys(info.entitlements.active).length > 0,
      activeEntitlements: Object.keys(info.entitlements.active)
    });
    return info;
  } catch (e) {
    console.error('[RevenueCat] ❌ restorePurchases error:', e);
    return null;
  }
}

/**
 * Obtiene información de debug para mostrar en pantalla
 */
export function getDebugInfo() {
  return {
    environment: APP_ENV,
    isDev: IS_DEV_REVENUECAT,
    platform: Platform.OS,
    apiKeyPrefix: REVENUECAT_API_KEY ? REVENUECAT_API_KEY.slice(0, 10) + '...' : 'NOT CONFIGURED',
    isInitialized,
    debugLogsEnabled: IS_DEV_REVENUECAT
  };
}

/**
 * Verifica si el usuario tiene un entitlement activo
 * @param entitlementId ID del entitlement (ej: "premium")
 * @returns true si el usuario tiene el entitlement activo
 */
export async function hasActiveEntitlement(entitlementId: string): Promise<boolean> {
  try {
    const info = await getCustomerInfo();
    if (!info) return false;

    return info.entitlements.active[entitlementId] !== undefined;
  } catch (e) {
    console.error('[RevenueCat] Error checking entitlement:', e);
    return false;
  }
}
