import { Platform } from 'react-native';
import { getEnvironment, getAppEnvironment, isValidRevenueCatKey } from '../utils/environment';

function getRevenueCatKey(): string {
  const appEnv = getAppEnvironment();

  if (appEnv === 'production') {
    const key = Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY_PROD
      : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY_PROD;
    return key || '';
  } else {
    const key = Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY_DEV
      : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY_DEV;
    return key || '';
  }
}

export const REVENUECAT_API_KEY = getRevenueCatKey();

export const REVENUECAT_ENTITLEMENT = process.env.EXPO_PUBLIC_RC_ENTITLEMENT || 'premium';

export const IS_DEV_REVENUECAT = getAppEnvironment() !== 'production';

export function isRevenueCatConfigured(): boolean {
  return isValidRevenueCatKey(REVENUECAT_API_KEY);
}

export const REVENUECAT_PRODUCTS = {
  weekly: 'psico_weekly_399',
  annual: 'psico_annual_2499',
};

export function getDebugInfo() {
  const environment = getEnvironment();

  return {
    platform: Platform.OS,
    environment,
    isDevelopment: IS_DEV_REVENUECAT,
    hasApiKey: !!REVENUECAT_API_KEY,
    entitlement: REVENUECAT_ENTITLEMENT,
    products: REVENUECAT_PRODUCTS,
  };
}

export async function loadOfferings() {
  const environment = getEnvironment();

  if (environment === 'web' || environment === 'expo-go') {
    return {
      current: {
        identifier: 'default',
        availablePackages: [
          {
            identifier: '$rc_weekly',
            packageType: 'WEEKLY',
            product: {
              identifier: REVENUECAT_PRODUCTS.weekly,
              title: 'Suscripción Semanal',
              priceString: '$3.99',
            },
          },
          {
            identifier: '$rc_annual',
            packageType: 'ANNUAL',
            product: {
              identifier: REVENUECAT_PRODUCTS.annual,
              title: 'Suscripción Anual',
              priceString: '$24.99',
            },
          },
        ],
      },
      all: {
        default: {},
      },
    };
  }

  try {
    if (Platform.OS !== 'web') {
      const { default: Purchases } = await import('react-native-purchases');
      const offerings = await Purchases.getOfferings();
      return offerings;
    }
    return null;
  } catch (error) {
    console.error('[RevenueCatConfig] Error loading offerings:', error);
    return null;
  }
}

export async function getProducts(productIds: string[]) {
  const environment = getEnvironment();

  if (environment === 'web' || environment === 'expo-go') {
    return [
      {
        identifier: REVENUECAT_PRODUCTS.weekly,
        title: 'Suscripción Semanal Premium',
        priceString: '$3.99',
      },
      {
        identifier: REVENUECAT_PRODUCTS.annual,
        title: 'Suscripción Anual Premium',
        priceString: '$24.99',
      },
    ];
  }

  try {
    if (Platform.OS !== 'web') {
      const { default: Purchases } = await import('react-native-purchases');
      const products = await Purchases.getProducts(productIds);
      return products;
    }
    return [];
  } catch (error) {
    console.error('[RevenueCatConfig] Error getting products:', error);
    return [];
  }
}

export async function getCustomerInfo() {
  const environment = getEnvironment();

  if (environment === 'web' || environment === 'expo-go') {
    return {
      originalAppUserId: 'mock-user-' + Date.now(),
      entitlements: {
        active: {
          [REVENUECAT_ENTITLEMENT]: {
            productIdentifier: REVENUECAT_PRODUCTS.weekly,
            expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        },
      },
    };
  }

  try {
    if (Platform.OS !== 'web') {
      const { default: Purchases } = await import('react-native-purchases');
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    }
    return null;
  } catch (error) {
    console.error('[RevenueCatConfig] Error getting customer info:', error);
    return null;
  }
}
