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
        if (entitlement.productIdentifier?.includes('monthly')) {
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
    const targetPackage = revenueCatState.currentOffering?.availablePackages.find(pkg => {
      if (Platform.OS === 'web') {
        return (planType === 'monthly' && pkg.packageType === 'MONTHLY') ||
               (planType === 'yearly' && pkg.packageType === 'ANNUAL');
      } else {
        try {
          const { PurchasesPackageType } = require('react-native-purchases');
          return (planType === 'monthly' && pkg.packageType === PurchasesPackageType.MONTHLY) ||
                 (planType === 'yearly' && pkg.packageType === PurchasesPackageType.ANNUAL);
        } catch {
          return (planType === 'monthly' && pkg.packageType === 'MONTHLY') ||
                 (planType === 'yearly' && pkg.packageType === 'ANNUAL');
        }
      }
    });

    if (!targetPackage) {
      return { success: false, message: 'Plan no encontrado. Asegúrate de que las ofertas de RevenueCat estén configuradas.' };
    }

    const result = await revenueCatState.purchase(targetPackage);
    
    if (result.success) {
      // Emit event for other components to react
      DeviceEventEmitter.emit('subscription-updated', {
        isActive: true,
        plan: planType,
        expiresAt: new Date(Date.now() + (planType === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
      });
      return { success: true, message: 'Suscripción activada correctamente' };
    } else {
      return { success: false, message: result.error || 'Error al procesar la compra. Inténtalo de nuevo.' };
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