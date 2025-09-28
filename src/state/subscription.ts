import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PurchasesOffering,
  LOG_LEVEL,
  ATTRIBUTION_NETWORK,
  PurchasesStoreProduct,
  PurchasesStoreProductDiscount,
  PurchasesPackageType,
  PurchasesEntitlementInfo,
  PurchasesCustomerInfo,
} from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Keep for web fallback

// Environment variables for RevenueCat API Key and Entitlement
const EXPO_PUBLIC_RC_API_KEY_IOS = process.env.EXPO_PUBLIC_RC_API_KEY_IOS || 'appl_mock_key_for_development';
const EXPO_PUBLIC_RC_API_KEY_ANDROID = process.env.EXPO_PUBLIC_RC_API_KEY_ANDROID || 'goog_mock_key_for_development';
const EXPO_PUBLIC_RC_ENTITLEMENT = process.env.EXPO_PUBLIC_RC_ENTITLEMENT || 'pro';

// Select the appropriate API key based on platform
const getApiKey = () => {
  if (Platform.OS === 'ios') {
    return EXPO_PUBLIC_RC_API_KEY_IOS;
  } else if (Platform.OS === 'android') {
    return EXPO_PUBLIC_RC_API_KEY_ANDROID;
  }
  // Fallback for web or other platforms
  return EXPO_PUBLIC_RC_API_KEY_IOS;
};

console.log('[RevenueCat] INITIAL Configuration loaded:', {
  apiKeyIOS: EXPO_PUBLIC_RC_API_KEY_IOS.substring(0, 10) + '...',
  apiKeyAndroid: EXPO_PUBLIC_RC_API_KEY_ANDROID.substring(0, 10) + '...',
  selectedApiKey: getApiKey().substring(0, 10) + '...',
  entitlement: EXPO_PUBLIC_RC_ENTITLEMENT,
  platform: Platform.OS,
  globalNativeModules: !!global.nativeModules,
  rcPurchasesModule: !!(global.nativeModules && global.nativeModules.RCPurchases),
  timestamp: new Date().toISOString()
});

export interface RevenueCatSubscriptionState {
  isActive: boolean;
  entitlement: string | null;
  offerings: PurchasesOffering[];
  currentOffering: PurchasesOffering | null;
  loading: boolean;
  error: string | null;
  customerInfo: PurchasesCustomerInfo | null;
}

export function useRevenueCatIntegration() {
  const [state, setState] = useState<RevenueCatSubscriptionState>({
    isActive: false,
    entitlement: null,
    offerings: [],
    currentOffering: null,
    loading: true,
    error: null,
    customerInfo: null,
  });

  const configurePurchases = useCallback(async () => {
    console.log('[RevenueCat] configurePurchases - Starting configuration...');
    console.log('[RevenueCat] configurePurchases - Platform.OS:', Platform.OS);
    console.log('[RevenueCat] configurePurchases - Environment check starting...');
    console.log('[RevenueCat] configurePurchases - global object exists:', typeof global !== 'undefined');
    console.log('[RevenueCat] configurePurchases - global.nativeModules exists:', !!global.nativeModules);
    console.log('[RevenueCat] configurePurchases - RCPurchases module exists:', !!(global.nativeModules && global.nativeModules.RCPurchases));
    
    if (Platform.OS === 'web') {
      console.warn('[RevenueCat] configurePurchases - Web platform detected, using mock data');
      // Mock data for web
      const mockOfferings: PurchasesOffering[] = [
        {
          identifier: 'default',
          serverDescription: 'Default offering',
          availablePackages: [
            {
              identifier: 'monthly',
              packageType: 'MONTHLY' as any,
              product: {
                identifier: 'premium_monthly',
                description: 'Premium Monthly Subscription',
                title: 'Premium Monthly',
                price: '7.99',
                priceString: '$7.99',
                currencyCode: 'USD',
              } as PurchasesStoreProduct,
            },
            {
              identifier: 'annual',
              packageType: 'ANNUAL' as any,
              product: {
                identifier: 'premium_annual',
                description: 'Premium Annual Subscription',
                title: 'Premium Annual',
                price: '49.99',
                priceString: '$49.99',
                currencyCode: 'USD',
              } as PurchasesStoreProduct,
            },
          ],
        },
      ];
      setState(prev => ({
        ...prev,
        offerings: mockOfferings,
        currentOffering: mockOfferings[0],
        loading: false,
      }));
      console.log('[RevenueCat] configurePurchases - Web mock offerings configured');
      return;
    }

    try {
      // Check if we're in Expo Go
      const isExpoGo = !global.nativeModules || !global.nativeModules.RCPurchases;
      console.log('[RevenueCat] configurePurchases - Environment detection - isExpoGo:', isExpoGo);
      console.log('[RevenueCat] configurePurchases - global.nativeModules exists:', !!global.nativeModules);
      console.log('[RevenueCat] configurePurchases - RCPurchases module exists:', !!(global.nativeModules && global.nativeModules.RCPurchases));
      console.log('[RevenueCat] configurePurchases - Platform.OS:', Platform.OS);
      
      if (isExpoGo) {
        console.log('[RevenueCat] configurePurchases - Expo Go detected - using mock implementation');
        // Use same mock data as web for Expo Go
        const mockOfferings: PurchasesOffering[] = [
          {
            identifier: 'default',
            serverDescription: 'Default offering',
            availablePackages: [
              {
                identifier: 'monthly',
                packageType: 'MONTHLY' as any,
                product: {
                  identifier: 'premium_monthly',
                  description: 'Premium Monthly Subscription',
                  title: 'Premium Monthly',
                  price: '7.99',
                  priceString: '$7.99',
                  currencyCode: 'USD',
                } as PurchasesStoreProduct,
              },
              {
                identifier: 'annual',
                packageType: 'ANNUAL' as any,
                product: {
                  identifier: 'premium_annual',
                  description: 'Premium Annual Subscription',
                  title: 'Premium Annual',
                  price: '49.99',
                  priceString: '$49.99',
                  currencyCode: 'USD',
                } as PurchasesStoreProduct,
              },
            ],
          },
        ];
        setState(prev => ({
          ...prev,
          offerings: mockOfferings,
          currentOffering: mockOfferings[0],
          loading: false,
        }));
        console.log('[RevenueCat] configurePurchases - Expo Go mock offerings configured');
        return;
      }

      // Real RevenueCat configuration for development builds
      console.log('[RevenueCat] configurePurchases - Development build detected, configuring real RevenueCat');
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      Purchases.configure({ apiKey: getApiKey() });
      console.log('[RevenueCat] configurePurchases - Real RevenueCat configured successfully for platform:', Platform.OS);
    } catch (e) {
      console.error('[RevenueCat] configurePurchases - Error configuring RevenueCat:', e);
      setState(prev => ({ ...prev, error: 'Failed to configure RevenueCat', loading: false }));
    }
  }, []);

  const checkSubscriptionStatus = useCallback(async () => {
    console.log('[RevenueCat] checkSubscriptionStatus - Starting subscription check');
    console.log('[RevenueCat] checkSubscriptionStatus - Platform.OS:', Platform.OS);
    
    if (Platform.OS === 'web') {
      // Web fallback: check AsyncStorage for mock subscription
      console.log('[RevenueCat] checkSubscriptionStatus - Web platform - checking mock subscription');
      try {
        const subscriptionData = await AsyncStorage.getItem('mock_subscription_state');
        console.log('[RevenueCat] checkSubscriptionStatus - Web mock subscription data:', subscriptionData);
        if (subscriptionData) {
          const parsed = JSON.parse(subscriptionData);
          console.log('[RevenueCat] checkSubscriptionStatus - Web parsed subscription:', parsed);
          setState({
            isActive: parsed.isActive || false,
            entitlement: parsed.entitlement || null,
            offerings: [],
            currentOffering: null,
            loading: false,
            error: null,
            customerInfo: parsed.customerInfo || null,
          });
        } else {
          console.log('[RevenueCat] checkSubscriptionStatus - Web no mock subscription found, setting inactive');
          setState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('[RevenueCat] checkSubscriptionStatus - Error checking mock subscription status:', error);
        setState(prev => ({ ...prev, loading: false, error: 'Failed to check mock subscription' }));
      }
      return;
    }

    console.log('[RevenueCat] checkSubscriptionStatus - Native platform - checking subscription status');
    setState(prev => ({ ...prev, loading: true }));
    try {
      const isExpoGo = !global.nativeModules || !global.nativeModules.RCPurchases;
      console.log('[RevenueCat] checkSubscriptionStatus - CRITICAL DETECTION - Platform.OS:', Platform.OS);
      console.log('[RevenueCat] checkSubscriptionStatus - CRITICAL DETECTION - isExpoGo:', isExpoGo);
      console.log('[RevenueCat] checkSubscriptionStatus - CRITICAL DETECTION - global.nativeModules:', !!global.nativeModules);
      console.log('[RevenueCat] checkSubscriptionStatus - CRITICAL DETECTION - RCPurchases module:', !!(global.nativeModules && global.nativeModules.RCPurchases));
      console.log('[RevenueCat] checkSubscriptionStatus - CRITICAL DETECTION - typeof global:', typeof global);
      console.log('[RevenueCat] checkSubscriptionStatus - CRITICAL DETECTION - global keys:', global ? Object.keys(global) : 'global is undefined');
      
      if (isExpoGo) {
        console.log('[RevenueCat] checkSubscriptionStatus - Expo Go detected - using mock subscription');
        console.log('[RevenueCat] checkSubscriptionStatus - Expo Go - Platform.OS:', Platform.OS);
        console.log('[RevenueCat] checkSubscriptionStatus - Expo Go - Checking for subscription state...');
        
        // Check if subscription was manually cancelled
        try {
          const cancelledState = await AsyncStorage.getItem('subscription_cancelled');
          console.log('[RevenueCat] checkSubscriptionStatus - Expo Go - cancelled state from storage:', cancelledState);
          if (cancelledState === 'true') {
            console.log('[RevenueCat] checkSubscriptionStatus - Expo Go - subscription was cancelled, setting INACTIVE');
            setState(prev => ({
              ...prev,
              isActive: false,
              entitlement: null,
              customerInfo: null,
              loading: false,
              error: null,
            }));
            return;
          }
        } catch (error) {
          console.log('[RevenueCat] checkSubscriptionStatus - Error checking cancelled state:', error);
        }
        
        // Check if subscription is active from previous purchase
        try {
          const activeState = await AsyncStorage.getItem('mock_expo_subscription_active');
          console.log('[RevenueCat] checkSubscriptionStatus - Expo Go - active state from storage:', activeState);
          if (activeState === 'true') {
            console.log('[RevenueCat] checkSubscriptionStatus - Expo Go - subscription is active, setting ACTIVE');
            const mockCustomerInfo = {
              entitlements: {
                active: {
                  [EXPO_PUBLIC_RC_ENTITLEMENT]: {
                    isActive: true,
                    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                    productIdentifier: 'premium_mock'
                  }
                }
              }
            };
            setState(prev => ({
              ...prev,
              isActive: true,
              entitlement: EXPO_PUBLIC_RC_ENTITLEMENT,
              customerInfo: mockCustomerInfo,
              loading: false,
              error: null,
            }));
            console.log('[RevenueCat] checkSubscriptionStatus - Expo Go subscription set to ACTIVE from storage');
            return;
          }
        } catch (error) {
          console.log('[RevenueCat] checkSubscriptionStatus - Error checking active state:', error);
        }
        
        // Default to INACTIVE for testing if not purchased
        console.log('[RevenueCat] checkSubscriptionStatus - Expo Go - Setting mock subscription to INACTIVE by default for testing buttons');
        console.log('[RevenueCat] checkSubscriptionStatus - Expo Go - This should make Premium buttons visible');
        const mockCustomerInfo = {
          entitlements: {
            active: {
              // INTENTIONALLY EMPTY - no active entitlements (Premium inactive)
            }
          }
        };
        setState(prev => ({
          ...prev,
          isActive: false,
          entitlement: null,
          customerInfo: mockCustomerInfo,
          loading: false,
          error: null,
        }));
        console.log('[RevenueCat] checkSubscriptionStatus - Expo Go mock subscription set to INACTIVE for testing');
        return;
      }

      // Real RevenueCat for development builds
      console.log('[RevenueCat] checkSubscriptionStatus - Development build - getting real customer info');
      console.log('[RevenueCat] checkSubscriptionStatus - About to call Purchases.getCustomerInfo()');
      const customerInfo: PurchasesCustomerInfo = await Purchases.getCustomerInfo();
      console.log('[RevenueCat] checkSubscriptionStatus - Real customerInfo received:', JSON.stringify(customerInfo, null, 2));
      console.log('[RevenueCat] checkSubscriptionStatus - Checking entitlement:', EXPO_PUBLIC_RC_ENTITLEMENT);
      console.log('[RevenueCat] checkSubscriptionStatus - Active entitlements:', Object.keys(customerInfo.entitlements.active));
      const isActive = customerInfo.entitlements.active[EXPO_PUBLIC_RC_ENTITLEMENT] !== undefined;
      const entitlementInfo = customerInfo.entitlements.active[EXPO_PUBLIC_RC_ENTITLEMENT];
      console.log('[RevenueCat] checkSubscriptionStatus - Entitlement info:', entitlementInfo);
      console.log('[RevenueCat] checkSubscriptionStatus - Calculated isActive:', isActive);

      setState(prev => ({
        ...prev,
        isActive,
        entitlement: isActive ? EXPO_PUBLIC_RC_ENTITLEMENT : null,
        customerInfo,
        loading: false,
        error: null,
      }));
    } catch (e) {
      console.error('[RevenueCat] checkSubscriptionStatus - Error checking subscription status:', e);
      setState(prev => ({ ...prev, error: 'Failed to check subscription status', loading: false }));
    }
  }, [EXPO_PUBLIC_RC_ENTITLEMENT]);

  const loadOfferings = useCallback(async () => {
    console.log('[RevenueCat] loadOfferings - Starting...');
    if (Platform.OS === 'web') {
      // Mock offerings for web (already set in configurePurchases for web)
      console.log('[RevenueCat] loadOfferings - Web platform - mock offerings already set');
      return;
    }

    console.log('[RevenueCat] loadOfferings - Native platform - Loading offerings...');
    try {
      const isExpoGo = !global.nativeModules || !global.nativeModules.RCPurchases;
      console.log('[RevenueCat] loadOfferings - Platform.OS:', Platform.OS);
      console.log('[RevenueCat] loadOfferings - isExpoGo:', isExpoGo);
      
      if (isExpoGo) {
        console.log('[RevenueCat] loadOfferings - Expo Go - offerings already set in configurePurchases');
        return;
      }

      console.log('[RevenueCat] loadOfferings - Development build - getting real offerings');
      const offerings = await Purchases.getOfferings();
      console.log('[RevenueCat] loadOfferings - Real offerings received:', Object.keys(offerings.all));
      console.log('[RevenueCat] loadOfferings - Current offering:', offerings.current?.identifier);
      setState(prev => ({
        ...prev,
        offerings: Object.values(offerings.all),
        currentOffering: offerings.current,
        error: null,
      }));
      console.log('[RevenueCat] loadOfferings - Offerings loaded successfully');
    } catch (e) {
      console.error('[RevenueCat] loadOfferings - Error loading offerings:', e);
      setState(prev => ({ ...prev, error: 'Failed to load offerings' }));
    }
  }, []);

  const purchase = useCallback(async (packageToPurchase: PurchasesPackage): Promise<{ success: boolean; error?: string }> => {
    console.log('[RevenueCat] purchase - Starting purchase process');
    console.log('[RevenueCat] purchase - Platform.OS:', Platform.OS);
    console.log('[RevenueCat] purchase - Package:', packageToPurchase.identifier);
    
    if (Platform.OS === 'web') {
      // Mock purchase for web
      console.log('[RevenueCat] purchase - Web platform - mock purchase');
      try {
        // Clear any previous cancellation state
        await AsyncStorage.removeItem('subscription_cancelled');
        
        const mockSubscription = {
          isActive: true,
          entitlement: EXPO_PUBLIC_RC_ENTITLEMENT,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year mock
          customerInfo: { 
            entitlements: { 
              active: { 
                [EXPO_PUBLIC_RC_ENTITLEMENT]: { 
                  isActive: true,
                  productIdentifier: packageToPurchase.product.identifier
                } 
              } 
            } 
          },
        };
        await AsyncStorage.setItem('mock_subscription_state', JSON.stringify(mockSubscription));
        console.log('[RevenueCat] purchase - Web mock purchase completed, setting state to ACTIVE');
        setState({
          isActive: true,
          entitlement: EXPO_PUBLIC_RC_ENTITLEMENT,
          offerings: state.offerings,
          currentOffering: state.currentOffering,
          loading: false,
          error: null,
          customerInfo: mockSubscription.customerInfo,
        });
        return { success: true };
      } catch (error) {
        console.error('[RevenueCat] purchase - Web mock purchase error:', error);
        return { success: false, error: 'Mock purchase failed' };
      }
    }

    console.log('[RevenueCat] purchase - Native platform - attempting purchase');
    setState(prev => ({ ...prev, loading: true }));
    try {
      const isExpoGo = !global.nativeModules || !global.nativeModules.RCPurchases;
      console.log('[RevenueCat] purchase - Platform.OS:', Platform.OS);
      console.log('[RevenueCat] purchase - isExpoGo:', isExpoGo);
      
      if (isExpoGo) {
        console.log('[RevenueCat] purchase - Expo Go - mock purchase');
        // Simulate purchase for Expo Go
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Clear any previous cancellation state
        await AsyncStorage.removeItem('subscription_cancelled');
        
        // Set active state for persistence
        await AsyncStorage.setItem('mock_expo_subscription_active', 'true');
        
        const mockCustomerInfo = {
          entitlements: {
            active: {
              [EXPO_PUBLIC_RC_ENTITLEMENT]: {
                isActive: true,
                expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                productIdentifier: packageToPurchase.product.identifier
              }
            }
          }
        };
        
        setState(prev => ({
          ...prev,
          isActive: true,
          entitlement: EXPO_PUBLIC_RC_ENTITLEMENT,
          customerInfo: mockCustomerInfo,
          loading: false,
          error: null,
        }));
        console.log('[RevenueCat] purchase - Expo Go mock purchase completed successfully, setting state to ACTIVE');
        return { success: true };
      }

      console.log('[RevenueCat] purchase - Development build - real purchase');
      console.log('[RevenueCat] purchase - Package to purchase:', packageToPurchase.identifier);
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      console.log('[RevenueCat] purchase - Purchase completed, customerInfo:', JSON.stringify(customerInfo, null, 2));
      const isActive = customerInfo.entitlements.active[EXPO_PUBLIC_RC_ENTITLEMENT] !== undefined;
      console.log('[RevenueCat] purchase - Purchase result - isActive:', isActive);
      setState(prev => ({
        ...prev,
        isActive,
        entitlement: isActive ? EXPO_PUBLIC_RC_ENTITLEMENT : null,
        customerInfo,
        loading: false,
        error: null,
      }));
      console.log('[RevenueCat] purchase - Purchase successful, final state set');
      return { success: true };
    } catch (e: any) {
      console.error('[RevenueCat] purchase - Error making purchase:', e);
      setState(prev => ({ ...prev, error: e.message || 'Purchase failed', loading: false }));
      return { success: false, error: e.message };
    }
  }, [EXPO_PUBLIC_RC_ENTITLEMENT, state.offerings, state.currentOffering]);

  const restore = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    console.log('[RevenueCat] restore - Starting restore process');
    console.log('[RevenueCat] restore - Platform.OS:', Platform.OS);
    
    if (Platform.OS === 'web') {
      console.log('[RevenueCat] restore - Web platform - restore not available');
      return { success: false, error: 'Restore not available on web' };
    }

    console.log('[RevenueCat] restore - Native platform - attempting restore');
    setState(prev => ({ ...prev, loading: true }));
    try {
      const isExpoGo = !global.nativeModules || !global.nativeModules.RCPurchases;
      console.log('[RevenueCat] restore - Platform.OS:', Platform.OS);
      console.log('[RevenueCat] restore - isExpoGo:', isExpoGo);
      
      if (isExpoGo) {
        console.log('[RevenueCat] restore - Expo Go - mock restore (no purchases to restore)');
        setState(prev => ({ ...prev, loading: false }));
        return { success: false, error: 'No purchases to restore in Expo Go' };
      }

      console.log('[RevenueCat] restore - Development build - real restore');
      const customerInfo: PurchasesCustomerInfo = await Purchases.restorePurchases();
      console.log('[RevenueCat] restore - Restore completed, customerInfo:', JSON.stringify(customerInfo, null, 2));
      const isActive = customerInfo.entitlements.active[EXPO_PUBLIC_RC_ENTITLEMENT] !== undefined;
      console.log('[RevenueCat] restore - Restore result - isActive:', isActive);
      setState(prev => ({
        ...prev,
        isActive,
        entitlement: isActive ? EXPO_PUBLIC_RC_ENTITLEMENT : null,
        customerInfo,
        loading: false,
        error: null,
      }));
      console.log('[RevenueCat] restore - Purchases restored successfully');
      return { success: true };
    } catch (e: any) {
      console.error('[RevenueCat] restore - Error restoring purchases:', e);
      setState(prev => ({ ...prev, error: e.message || 'Restore failed', loading: false }));
      return { success: false, error: e.message };
    }
  }, [EXPO_PUBLIC_RC_ENTITLEMENT]);

  const cancel = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    console.log('[RevenueCat] cancel - Starting cancellation process');
    console.log('[RevenueCat] cancel - Platform.OS:', Platform.OS);
    
    if (Platform.OS === 'web') {
      // Web cancellation: clear mock subscription
      console.log('[RevenueCat] cancel - Web platform - clearing mock subscription');
      try {
        await AsyncStorage.removeItem('mock_subscription_state');
        console.log('[RevenueCat] cancel - Web mock subscription cleared, setting state to INACTIVE');
        setState({
          isActive: false,
          entitlement: null,
          offerings: state.offerings,
          currentOffering: state.currentOffering,
          loading: false,
          error: null,
          customerInfo: null,
        });
        return { success: true };
      } catch (error) {
        console.error('[RevenueCat] cancel - Error clearing mock subscription:', error);
        return { success: false, error: 'Failed to cancel mock subscription' };
      }
    }

    console.log('[RevenueCat] cancel - Native platform - attempting cancellation');
    try {
      const isExpoGo = !global.nativeModules || !global.nativeModules.RCPurchases;
      console.log('[RevenueCat] cancel - Platform.OS:', Platform.OS);
      console.log('[RevenueCat] cancel - isExpoGo:', isExpoGo);
      
      if (isExpoGo) {
        console.log('[RevenueCat] cancel - Expo Go - clearing mock subscription');
        // For Expo Go, clear any stored mock subscription and force inactive state
        await AsyncStorage.setItem('subscription_cancelled', 'true');
        await AsyncStorage.removeItem('mock_expo_subscription_active');
        console.log('[RevenueCat] cancel - Expo Go - Set subscription_cancelled to true');
        setState(prev => ({
          ...prev,
          isActive: false,
          entitlement: null,
          customerInfo: null,
          loading: false,
          error: null,
        }));
        console.log('[RevenueCat] cancel - Expo Go mock subscription cancelled successfully, state set to INACTIVE');
        return { success: true };
      }

      // Real RevenueCat doesn't have direct cancellation API
      // Users must cancel through their app store subscriptions
      console.log('[RevenueCat] cancel - Real RevenueCat - cancellation must be done through app store');
      return { 
        success: false, 
        error: 'Para cancelar tu suscripción, ve a los ajustes de suscripciones de tu dispositivo (App Store o Google Play Store)' 
      };
    } catch (e: any) {
      console.error('[RevenueCat] cancel - Error in cancellation:', e);
      return { success: false, error: e.message };
    }
  }, [state.offerings, state.currentOffering]);

  const refresh = useCallback(async () => {
    console.log('[RevenueCat] refresh - Starting refresh process');
    setState(prev => ({ ...prev, loading: true }));
    await Promise.all([checkSubscriptionStatus(), loadOfferings()]);
    console.log('[RevenueCat] refresh - Refresh process completed');
  }, [checkSubscriptionStatus, loadOfferings]);

  useEffect(() => {
    console.log('[RevenueCat] useEffect - Initial setup starting');
    configurePurchases();
    
    // Initial load without refresh to avoid loops
    const initialLoad = async () => {
      await Promise.all([checkSubscriptionStatus(), loadOfferings()]);
    };
    initialLoad();

    console.log('[RevenueCat] useEffect - Setting up customer info listener...');

    // Listener for customer info updates
    if (Platform.OS !== 'web') {
      // Only add listener if we have real RevenueCat (not Expo Go)
      const isExpoGo = !global.nativeModules || !global.nativeModules.RCPurchases;
      console.log('[RevenueCat] useEffect - Listener setup - Platform.OS:', Platform.OS);
      console.log('[RevenueCat] useEffect - Listener setup - isExpoGo:', isExpoGo);
      
      if (!isExpoGo) {
        console.log('[RevenueCat] useEffect - Setting up real RevenueCat listener');
        const customerInfoUpdateListener = (customerInfo: PurchasesCustomerInfo) => {
          console.log('[RevenueCat] useEffect - Customer info updated via listener');
          console.log('[RevenueCat] useEffect - Listener customerInfo:', JSON.stringify(customerInfo, null, 2));
          const isActive = customerInfo.entitlements.active[EXPO_PUBLIC_RC_ENTITLEMENT] !== undefined;
          console.log('[RevenueCat] useEffect - Listener calculated isActive:', isActive);
          setState(prev => ({
            ...prev,
            isActive,
            entitlement: isActive ? EXPO_PUBLIC_RC_ENTITLEMENT : null,
            customerInfo,
            loading: false,
            error: null,
          }));
          console.log('[RevenueCat] useEffect - Listener update completed:', { isActive });
        };
        Purchases.addCustomerInfoUpdateListener(customerInfoUpdateListener);
        return () => {
          Purchases.removeCustomerInfoUpdateListener(customerInfoUpdateListener);
        };
      } else {
        console.log('[RevenueCat] useEffect - Expo Go - skipping real RevenueCat listener');
      }
    }
  }, [configurePurchases, checkSubscriptionStatus, loadOfferings, EXPO_PUBLIC_RC_ENTITLEMENT]);

  return {
    ...state,
    purchase,
    restore,
    refresh,
    cancel,
  };
}