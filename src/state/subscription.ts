import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { devLog, errorLog, isExpoGo, getEnvironment, getAppEnvironment } from '../utils/environment';
import { REVENUECAT_API_KEY, REVENUECAT_ENTITLEMENT, isRevenueCatConfigured } from '../config/revenuecatConfig';

export interface CustomerInfo {
  entitlements: {
    active: {
      [key: string]: {
        productIdentifier: string;
        expirationDate: string | null;
      };
    };
  };
}

export interface RevenueCatState {
  isActive: boolean;
  loading: boolean;
  customerInfo: CustomerInfo | null;
  currentOffering: any;
  entitlement: string;
  refresh: () => Promise<void>;
  purchase: (pkg: any) => Promise<{ success: boolean; error?: string }>;
  restore: () => Promise<{ success: boolean; error?: string }>;
  cancel: () => Promise<{ success: boolean; error?: string }>;
}

const MOCK_CUSTOMER_INFO: CustomerInfo = {
  entitlements: {
    active: {
      pro: {
        productIdentifier: 'psico_weekly_399',
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
  },
};

const MOCK_OFFERING = {
  identifier: 'default',
  availablePackages: [
    {
      identifier: '$rc_weekly',
      packageType: 'WEEKLY',
      product: {
        identifier: 'psico_weekly_399',
        priceString: '$3.99',
      },
    },
    {
      identifier: '$rc_annual',
      packageType: 'ANNUAL',
      product: {
        identifier: 'psico_annual_2499',
        priceString: '$24.99',
      },
    },
  ],
};

export function useRevenueCatIntegration(): RevenueCatState {
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] = useState<any>(null);
  const [purchases, setPurchases] = useState<any>(null);

  const entitlement = REVENUECAT_ENTITLEMENT;
  const environment = getEnvironment();
  const appEnv = getAppEnvironment();

  useEffect(() => {
    initializeRevenueCat();
  }, []);

  const initializeRevenueCat = async () => {
    devLog('RevenueCat', `Initializing in ${environment} environment (app: ${appEnv})`);
    setLoading(true);

    if (Platform.OS === 'web') {
      devLog('RevenueCat', 'Web platform - using mock subscription (inactive by default)');
      setIsActive(false);
      setCustomerInfo(null);
      setCurrentOffering(MOCK_OFFERING);
      setLoading(false);
      return;
    }

    if (isExpoGo()) {
      devLog('RevenueCat', 'Expo Go - using mock subscription (inactive by default)');
      setIsActive(false);
      setCustomerInfo(null);
      setCurrentOffering(MOCK_OFFERING);
      setLoading(false);
      return;
    }

    if (!isRevenueCatConfigured()) {
      errorLog('RevenueCat', `Invalid or missing API key for ${Platform.OS} in ${appEnv} mode`);
      errorLog('RevenueCat', 'Using mock mode - subscriptions will not work');
      setIsActive(false);
      setCustomerInfo(null);
      setCurrentOffering(MOCK_OFFERING);
      setLoading(false);
      return;
    }

    try {
      if (Platform.OS !== 'web') {
        const { default: Purchases } = await import('react-native-purchases');
        setPurchases(Purchases);

        devLog('RevenueCat', `Configuring SDK with key: ${REVENUECAT_API_KEY.substring(0, 10)}...`);

        const initTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('RevenueCat initialization timeout')), 8000)
        );

        await Promise.race([
          Purchases.configure({ apiKey: REVENUECAT_API_KEY }),
          initTimeout
        ]);

        devLog('RevenueCat', 'Fetching customer info...');
        const info = await Purchases.getCustomerInfo();

        const hasActiveEntitlement = info.entitlements.active[entitlement] !== undefined;
        devLog('RevenueCat', `Active entitlement (${entitlement}):`, hasActiveEntitlement);

        setIsActive(hasActiveEntitlement);
        setCustomerInfo(info);

        devLog('RevenueCat', 'Fetching offerings...');
        const offerings = await Purchases.getOfferings();

        if (offerings.current) {
          devLog('RevenueCat', `Found offering: ${offerings.current.identifier}`);
          devLog('RevenueCat', `Available packages: ${offerings.current.availablePackages.length}`);
          setCurrentOffering(offerings.current);
        } else {
          errorLog('RevenueCat', 'No current offering found');
          setCurrentOffering(MOCK_OFFERING);
        }

        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch (error) {
      errorLog('RevenueCat', 'Initialization error - falling back to mock', error);
      setIsActive(false);
      setCustomerInfo(null);
      setCurrentOffering(MOCK_OFFERING);
      setLoading(false);
    }
  };

  const refresh = useCallback(async () => {
    if (Platform.OS === 'web' || isExpoGo() || !purchases) {
      devLog('RevenueCat', 'Refresh - using mock data');
      return;
    }

    try {
      devLog('RevenueCat', 'Refreshing customer info...');
      const info = await purchases.getCustomerInfo();

      const hasActiveEntitlement = info.entitlements.active[entitlement] !== undefined;
      devLog('RevenueCat', `Refreshed - Active: ${hasActiveEntitlement}`);

      setIsActive(hasActiveEntitlement);
      setCustomerInfo(info);
    } catch (error) {
      errorLog('RevenueCat', 'Refresh error', error);
    }
  }, [purchases, entitlement]);

  const purchase = useCallback(async (pkg: any) => {
    if (Platform.OS === 'web' || isExpoGo()) {
      devLog('RevenueCat', 'Mock purchase - simulating success');
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsActive(true);
      setCustomerInfo(MOCK_CUSTOMER_INFO);
      return { success: true };
    }

    if (!purchases) {
      return { success: false, error: 'RevenueCat not initialized' };
    }

    try {
      devLog('RevenueCat', `Purchasing package: ${pkg.identifier}`);
      const purchaseResult = await purchases.purchasePackage(pkg);

      const hasActiveEntitlement = purchaseResult.customerInfo.entitlements.active[entitlement] !== undefined;
      devLog('RevenueCat', `Purchase complete - Active: ${hasActiveEntitlement}`);

      setIsActive(hasActiveEntitlement);
      setCustomerInfo(purchaseResult.customerInfo);

      return { success: true };
    } catch (error: any) {
      if (error.userCancelled) {
        devLog('RevenueCat', 'Purchase cancelled by user');
        return { success: false, error: 'Compra cancelada' };
      }

      errorLog('RevenueCat', 'Purchase error', error);
      return { success: false, error: error.message || 'Error en la compra' };
    }
  }, [purchases, entitlement]);

  const restore = useCallback(async () => {
    if (Platform.OS === 'web' || isExpoGo()) {
      devLog('RevenueCat', 'Mock restore - simulating success');
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsActive(true);
      setCustomerInfo(MOCK_CUSTOMER_INFO);
      return { success: true };
    }

    if (!purchases) {
      return { success: false, error: 'RevenueCat not initialized' };
    }

    try {
      devLog('RevenueCat', 'Restoring purchases...');
      const info = await purchases.restorePurchases();

      const hasActiveEntitlement = info.entitlements.active[entitlement] !== undefined;
      devLog('RevenueCat', `Restore complete - Active: ${hasActiveEntitlement}`);

      setIsActive(hasActiveEntitlement);
      setCustomerInfo(info);

      if (hasActiveEntitlement) {
        return { success: true };
      } else {
        return { success: false, error: 'No se encontraron compras previas' };
      }
    } catch (error: any) {
      errorLog('RevenueCat', 'Restore error', error);
      return { success: false, error: error.message || 'Error al restaurar compras' };
    }
  }, [purchases, entitlement]);

  const cancel = useCallback(async () => {
    devLog('RevenueCat', 'Cancel subscription requested');

    if (Platform.OS === 'web' || isExpoGo()) {
      devLog('RevenueCat', 'Mock cancel - simulating success');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsActive(false);
      setCustomerInfo(null);
      return { success: true };
    }

    return {
      success: false,
      error: 'Cancela tu suscripción desde la configuración de tu cuenta de Apple/Google'
    };
  }, []);

  return {
    isActive,
    loading,
    customerInfo,
    currentOffering,
    entitlement,
    refresh,
    purchase,
    restore,
    cancel,
  };
}
