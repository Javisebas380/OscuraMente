import { Platform } from 'react-native';
import { getEnvironment } from '../utils/environment';

export const REVENUECAT_API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_RC_API_KEY_IOS || process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY_DEV || '',
  android: process.env.EXPO_PUBLIC_RC_API_KEY_ANDROID || process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY_DEV || '',
  default: '',
});

export const REVENUECAT_ENTITLEMENT = process.env.EXPO_PUBLIC_RC_ENTITLEMENT || 'pro';

export const IS_DEV_REVENUECAT = process.env.EXPO_PUBLIC_APP_ENV !== 'production';

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
