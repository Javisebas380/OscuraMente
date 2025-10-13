import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import { DeviceEventEmitter, Platform } from 'react-native';
import { useRevenueCatIntegration } from '../src/state/subscription';

export interface SubscriptionState {
  isActive: boolean;
  plan: 'monthly' | 'yearly' | null;
  expiresAt: string | null;
  isLoading: boolean;
  isActiveChecked: boolean;
}

export function useSubscription() {
  const revenueCatState = useRevenueCatIntegration();

  // Derive subscription state directly from RevenueCat state to avoid loops
  const subscription = React.useMemo(() => {
    let currentPlan: 'monthly' | 'yearly' | null = null;
    let currentExpiresAt: string | null = null;

    if (revenueCatState.isActive && revenueCatState.customerInfo) {
      const entitlement = revenueCatState.customerInfo.entitlements.active[revenueCatState.entitlement || ''];
      if (entitlement) {
        if (entitlement.productIdentifier?.includes('weekly') || entitlement.productIdentifier?.includes('monthly')) {
          currentPlan = 'monthly';
        } else if (entitlement.productIdentifier?.includes('annual')) {
          currentPlan = 'yearly';
        }
        currentExpiresAt = entitlement.expirationDate;
      }
    }

    return {
      isActive: revenueCatState.isActive,
      plan: currentPlan,
      expiresAt: currentExpiresAt,
      isLoading: revenueCatState.loading,
      isActiveChecked: !revenueCatState.loading,
    };
  }, [revenueCatState.isActive, revenueCatState.loading, revenueCatState.customerInfo, revenueCatState.entitlement]);

  const refreshSubscription = useCallback(async () => {
    await revenueCatState.refresh();
    return revenueCatState.isActive;
  }, [revenueCatState]);

  const purchaseSubscription = useCallback(async (planType: 'monthly' | 'yearly') => {
    console.log('[useSubscription] purchaseSubscription - Starting purchase process');
    console.log('[useSubscription] Requested plan type:', planType);
    console.log('[useSubscription] Current offering available:', !!revenueCatState.currentOffering);

    // Debug: Log all available offerings
    if (revenueCatState.currentOffering) {
      console.log('[useSubscription] Current offering identifier:', revenueCatState.currentOffering.identifier);
      console.log('[useSubscription] Available packages count:', revenueCatState.currentOffering.availablePackages.length);

      // Log each package for debugging
      revenueCatState.currentOffering.availablePackages.forEach((pkg, index) => {
        console.log(`[useSubscription] Package ${index + 1}:`);
        console.log(`  - Identifier: ${pkg.identifier}`);
        console.log(`  - Package Type: ${pkg.packageType}`);
        console.log(`  - Product ID: ${pkg.product.identifier}`);
        console.log(`  - Price: ${pkg.product.priceString}`);
      });
    } else {
      console.error('[useSubscription] ❌ CRITICAL: No current offering available!');
      console.error('[useSubscription] This means:');
      console.error('[useSubscription] 1. RevenueCat is not configured properly');
      console.error('[useSubscription] 2. No products are set up in RevenueCat Dashboard');
      console.error('[useSubscription] 3. Products are not linked to an offering');
      return {
        success: false,
        message: 'No hay planes disponibles. Verifica la configuración de RevenueCat en el dashboard.'
      };
    }

    const targetPackage = revenueCatState.currentOffering?.availablePackages.find(pkg => {
      if (Platform.OS === 'web') {
        return (planType === 'monthly' && (pkg.packageType === 'WEEKLY' || pkg.packageType === 'MONTHLY')) ||
               (planType === 'yearly' && pkg.packageType === 'ANNUAL');
      } else {
        try {
          const { PurchasesPackageType } = require('react-native-purchases');
          return (planType === 'monthly' && (pkg.packageType === PurchasesPackageType.WEEKLY || pkg.packageType === PurchasesPackageType.MONTHLY)) ||
                 (planType === 'yearly' && pkg.packageType === PurchasesPackageType.ANNUAL);
        } catch {
          return (planType === 'monthly' && (pkg.packageType === 'WEEKLY' || pkg.packageType === 'MONTHLY')) ||
                 (planType === 'yearly' && pkg.packageType === 'ANNUAL');
        }
      }
    });

    if (!targetPackage) {
      console.error('[useSubscription] ❌ Package not found for plan type:', planType);
      console.error('[useSubscription] Available package types:', revenueCatState.currentOffering?.availablePackages.map(p => p.packageType).join(', '));
      console.error('[useSubscription] Expected package type:', planType === 'monthly' ? 'WEEKLY or MONTHLY' : 'ANNUAL');
      console.error('[useSubscription] ');
      console.error('[useSubscription] SOLUTION: Check RevenueCat Dashboard');
      console.error('[useSubscription] 1. Go to https://app.revenuecat.com/');
      console.error('[useSubscription] 2. Navigate to your project');
      console.error('[useSubscription] 3. Check Offerings > default offering');
      console.error('[useSubscription] 4. Ensure products are added to the offering');
      console.error('[useSubscription] 5. Products must match: psico_weekly_399 and psico_annual_2499');

      const availableTypes = revenueCatState.currentOffering?.availablePackages
        .map(p => `${p.identifier} (${p.packageType})`)
        .join(', ') || 'ninguno';

      return {
        success: false,
        message: `Plan ${planType} no encontrado. Paquetes disponibles: ${availableTypes}. Configura los productos en RevenueCat Dashboard.`
      };
    }

    console.log('[useSubscription] ✅ Target package found:', targetPackage.identifier);
    console.log('[useSubscription] Initiating purchase with RevenueCat...');

    const result = await revenueCatState.purchase(targetPackage);

    if (result.success) {
      console.log('[useSubscription] ✅ Purchase successful!');
      // Emit event for other components to react
      DeviceEventEmitter.emit('subscription-updated', {
        isActive: true,
        plan: planType,
        expiresAt: new Date(Date.now() + (planType === 'yearly' ? 365 : 7) * 24 * 60 * 60 * 1000).toISOString(),
      });
      return { success: true, message: 'Suscripción activada correctamente' };
    } else {
      console.error('[useSubscription] ❌ Purchase failed:', result.error);
      return {
        success: false,
        message: result.error || 'Error al procesar la compra. Verifica tu conexión e inténtalo de nuevo.'
      };
    }
  }, [revenueCatState.currentOffering, revenueCatState.purchase]);

  const restorePurchases = useCallback(async () => {
    const result = await revenueCatState.restore();
    if (result.success) {
      return { success: true, message: 'Suscripción restaurada correctamente' };
    } else {
      return { success: false, message: result.error || 'No se encontraron compras previas' };
    }
  }, [revenueCatState.restore]);

  const cancelSubscription = useCallback(async () => {
    try {
      const result = await revenueCatState.cancel();
      
      if (result.success) {
        DeviceEventEmitter.emit('subscription-updated', {
          isActive: false,
          plan: null,
          expiresAt: null,
        });
        
        return { success: true, message: 'Suscripción cancelada correctamente' };
      } else {
        return { success: false, message: result.error || 'Error al cancelar la suscripción' };
      }
    } catch (error) {
      return { success: false, message: 'Error al procesar la cancelación' };
    }
  }, [revenueCatState]);

  const refresh = refreshSubscription;

  return {
    subscription,
    refresh,
    refreshSubscription,
    purchaseSubscription,
    restorePurchases,
    cancelSubscription,
  };
}