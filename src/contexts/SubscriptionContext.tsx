import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { devLog, errorLog, isExpoGo, getEnvironment, getAppEnvironment, logRevenueCatStatus } from '../utils/environment';
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

export interface SubscriptionContextState {
  isActive: boolean;
  loading: boolean;
  initializing: boolean;
  isRevenueCatReady: boolean;
  customerInfo: CustomerInfo | null;
  currentOffering: any;
  entitlement: string;
  error: string | null;
  refresh: () => Promise<void>;
  purchase: (pkg: any) => Promise<{ success: boolean; error?: string }>;
  restore: () => Promise<{ success: boolean; error?: string }>;
  cancel: () => Promise<{ success: boolean; error?: string }>;
  retry: () => Promise<void>;
}

const MOCK_CUSTOMER_INFO: CustomerInfo = {
  entitlements: {
    active: {
      premium: {
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

const SubscriptionContext = createContext<SubscriptionContextState | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [isRevenueCatReady, setIsRevenueCatReady] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] = useState<any>(MOCK_OFFERING);
  const [error, setError] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<any>(null);

  const initializationAttempted = useRef(false);
  const entitlement = REVENUECAT_ENTITLEMENT;
  const environment = getEnvironment();
  const appEnv = getAppEnvironment();

  useEffect(() => {
    if (!initializationAttempted.current) {
      initializationAttempted.current = true;
      setTimeout(() => {
        initializeRevenueCat();
      }, 100);
    }
  }, []);

  const initializeRevenueCat = async () => {
    devLog('SubscriptionContext', `Initializing in ${environment} environment (app: ${appEnv})`);
    setInitializing(true);
    setError(null);

    if (Platform.OS === 'web') {
      devLog('SubscriptionContext', 'Web platform - using mock subscription (inactive by default)');
      setIsActive(false);
      setCustomerInfo(null);
      setCurrentOffering(MOCK_OFFERING);
      setInitializing(false);
      setIsRevenueCatReady(true);
      return;
    }

    if (isExpoGo()) {
      devLog('SubscriptionContext', 'Expo Go - using mock subscription (inactive by default)');
      setIsActive(false);
      setCustomerInfo(null);
      setCurrentOffering(MOCK_OFFERING);
      setInitializing(false);
      setIsRevenueCatReady(true);
      return;
    }

    if (!isRevenueCatConfigured()) {
      errorLog('SubscriptionContext', `Invalid or missing API key for ${Platform.OS} in ${appEnv} mode`);
      errorLog('SubscriptionContext', 'Using mock mode - subscriptions will not work');
      setIsActive(false);
      setCustomerInfo(null);
      setCurrentOffering(MOCK_OFFERING);
      setError('RevenueCat not configured');
      setInitializing(false);
      setIsRevenueCatReady(false);
      return;
    }

    try {
      if (Platform.OS !== 'web') {
        logRevenueCatStatus();

        const { default: Purchases } = await import('react-native-purchases');

        devLog('SubscriptionContext', `Configuring SDK with key: ${REVENUECAT_API_KEY.substring(0, 10)}...`);

        const initTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('RevenueCat initialization timeout')), 5000)
        );

        await Promise.race([
          Purchases.configure({ apiKey: REVENUECAT_API_KEY }),
          initTimeout
        ]);

        devLog('SubscriptionContext', '✅ RevenueCat SDK configured successfully');
        setPurchases(Purchases);
        setIsRevenueCatReady(true);

        devLog('SubscriptionContext', 'Fetching customer info...');
        const info = await Purchases.getCustomerInfo();

        const hasActiveEntitlement = info.entitlements.active[entitlement] !== undefined;
        devLog('SubscriptionContext', `Active entitlement (${entitlement}):`, hasActiveEntitlement);

        setIsActive(hasActiveEntitlement);
        setCustomerInfo(info);

        devLog('SubscriptionContext', 'Fetching offerings...');
        const offeringsTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Offerings fetch timeout')), 3000)
        );

        const offerings = await Promise.race([
          Purchases.getOfferings(),
          offeringsTimeout
        ]) as any;

        if (offerings.current) {
          devLog('SubscriptionContext', `✅ Found offering: ${offerings.current.identifier}`);
          devLog('SubscriptionContext', `✅ Available packages: ${offerings.current.availablePackages.length}`);
          setCurrentOffering(offerings.current);
        } else {
          errorLog('SubscriptionContext', '⚠️ No current offering found - using mock');
          setCurrentOffering(MOCK_OFFERING);
        }

        devLog('SubscriptionContext', '✅ RevenueCat initialization complete');
        setInitializing(false);
      } else {
        setInitializing(false);
      }
    } catch (error) {
      errorLog('SubscriptionContext', '❌ Initialization error - falling back to mock', error);
      setIsActive(false);
      setCustomerInfo(null);
      setCurrentOffering(MOCK_OFFERING);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setInitializing(false);
      setIsRevenueCatReady(false);
      setPurchases(null);
    }
  };

  const refresh = useCallback(async () => {
    if (Platform.OS === 'web' || isExpoGo() || !purchases) {
      devLog('SubscriptionContext', 'Refresh - using mock data');
      return;
    }

    try {
      setLoading(true);
      devLog('SubscriptionContext', 'Refreshing customer info...');
      const info = await purchases.getCustomerInfo();

      const hasActiveEntitlement = info.entitlements.active[entitlement] !== undefined;
      devLog('SubscriptionContext', `Refreshed - Active: ${hasActiveEntitlement}`);

      setIsActive(hasActiveEntitlement);
      setCustomerInfo(info);
      setError(null);
    } catch (error) {
      errorLog('SubscriptionContext', 'Refresh error', error);
      setError(error instanceof Error ? error.message : 'Refresh failed');
    } finally {
      setLoading(false);
    }
  }, [purchases, entitlement]);

  const purchase = useCallback(async (pkg: any) => {
    if (Platform.OS === 'web' || isExpoGo()) {
      devLog('SubscriptionContext', 'Mock purchase - simulating success');
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsActive(true);
      setCustomerInfo(MOCK_CUSTOMER_INFO);
      return { success: true };
    }

    if (!purchases || !isRevenueCatReady) {
      errorLog('SubscriptionContext', '❌ Cannot purchase - RevenueCat not ready', {
        hasPurchases: !!purchases,
        isReady: isRevenueCatReady,
        initializing
      });
      return {
        success: false,
        error: initializing
          ? 'RevenueCat aún se está inicializando. Espera unos segundos e inténtalo de nuevo.'
          : 'RevenueCat no está inicializado. Por favor, reinicia la aplicación.'
      };
    }

    try {
      setLoading(true);
      devLog('SubscriptionContext', `Purchasing package: ${pkg.identifier}`);
      const purchaseResult = await purchases.purchasePackage(pkg);

      const hasActiveEntitlement = purchaseResult.customerInfo.entitlements.active[entitlement] !== undefined;
      devLog('SubscriptionContext', `Purchase complete - Active: ${hasActiveEntitlement}`);

      setIsActive(hasActiveEntitlement);
      setCustomerInfo(purchaseResult.customerInfo);
      setError(null);

      return { success: true };
    } catch (error: any) {
      if (error.userCancelled) {
        devLog('SubscriptionContext', 'Purchase cancelled by user');
        return { success: false, error: 'Compra cancelada' };
      }

      errorLog('SubscriptionContext', 'Purchase error', error);
      return { success: false, error: error.message || 'Error en la compra' };
    } finally {
      setLoading(false);
    }
  }, [purchases, entitlement, isRevenueCatReady, initializing]);

  const restore = useCallback(async () => {
    if (Platform.OS === 'web' || isExpoGo()) {
      devLog('SubscriptionContext', 'Mock restore - simulating success');
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsActive(true);
      setCustomerInfo(MOCK_CUSTOMER_INFO);
      return { success: true };
    }

    if (!purchases || !isRevenueCatReady) {
      return {
        success: false,
        error: initializing
          ? 'RevenueCat aún se está inicializando. Espera unos segundos.'
          : 'RevenueCat no está inicializado'
      };
    }

    try {
      setLoading(true);
      devLog('SubscriptionContext', 'Restoring purchases...');
      const info = await purchases.restorePurchases();

      const hasActiveEntitlement = info.entitlements.active[entitlement] !== undefined;
      devLog('SubscriptionContext', `Restore complete - Active: ${hasActiveEntitlement}`);

      setIsActive(hasActiveEntitlement);
      setCustomerInfo(info);
      setError(null);

      if (hasActiveEntitlement) {
        return { success: true };
      } else {
        return { success: false, error: 'No se encontraron compras previas' };
      }
    } catch (error: any) {
      errorLog('SubscriptionContext', 'Restore error', error);
      return { success: false, error: error.message || 'Error al restaurar compras' };
    } finally {
      setLoading(false);
    }
  }, [purchases, entitlement, isRevenueCatReady, initializing]);

  const cancel = useCallback(async () => {
    devLog('SubscriptionContext', 'Cancel subscription requested');

    if (Platform.OS === 'web' || isExpoGo()) {
      devLog('SubscriptionContext', 'Mock cancel - simulating success');
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

  const retry = useCallback(async () => {
    devLog('SubscriptionContext', 'Retrying initialization...');
    initializationAttempted.current = false;
    await initializeRevenueCat();
  }, []);

  const value: SubscriptionContextState = {
    isActive,
    loading,
    initializing,
    isRevenueCatReady,
    customerInfo,
    currentOffering,
    entitlement,
    error,
    refresh,
    purchase,
    restore,
    cancel,
    retry,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext(): SubscriptionContextState {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
}
