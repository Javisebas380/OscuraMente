import { useEffect, useState, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import {
  Merriweather_700Bold,
  Merriweather_900Black,
} from '@expo-google-fonts/merriweather';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import * as SplashScreen from 'expo-splash-screen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useOnboardingSeen } from '@/hooks/useOnboardingSeen';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { devLog, errorLog, isExpoGo, validateEnvironmentConfig, getAppEnvironment } from '../src/utils/environment';
import { EnvironmentBanner } from '../components/EnvironmentBanner';
import { SubscriptionProvider } from '../src/contexts/SubscriptionContext';
import { SubscriptionDebugPanel } from '../components/SubscriptionDebugPanel';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const { hasSeenOnboarding, isLoading } = useOnboardingSeen();
  const [servicesReady, setServicesReady] = useState(false);
  const hasInitialized = useRef(false);
  const globalTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [fontsLoaded, fontError] = useFonts({
    'Montserrat-SemiBold': Montserrat_600SemiBold,
    'Montserrat-Bold': Montserrat_700Bold,
    'Merriweather-Bold': Merriweather_700Bold,
    'Merriweather-Black': Merriweather_900Black,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Playfair-SemiBold': PlayfairDisplay_600SemiBold,
    'Playfair-Bold': PlayfairDisplay_700Bold,
  });


  useEffect(() => {
    if (fontsLoaded || fontError) {
      devLog('RootLayout', 'Fonts loaded');

      if (fontError) {
        errorLog('RootLayout', 'Font loading error - using system fonts', fontError);
      }

      devLog('RootLayout', `Platform: ${Platform.OS}`);
      devLog('RootLayout', `Env: ${getAppEnvironment()}`);

      const validation = validateEnvironmentConfig();
      if (validation.warnings.length > 0) {
        validation.warnings.forEach(warning => {
          errorLog('RootLayout', `Config Warning: ${warning}`);
        });
      }

      devLog('RootLayout', 'Hiding splash screen');
      SplashScreen.hideAsync().catch(err =>
        errorLog('RootLayout', 'Failed to hide splash screen', err)
      );

      if (!hasInitialized.current) {
        hasInitialized.current = true;
        initializeServicesInBackground();
      }

      globalTimeoutRef.current = setTimeout(() => {
        if (!servicesReady) {
          devLog('RootLayout', 'Global timeout reached - forcing services ready');
          setServicesReady(true);
        }
      }, 3000);
    }

    return () => {
      if (globalTimeoutRef.current) {
        clearTimeout(globalTimeoutRef.current);
      }
    };
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (!isLoading && hasSeenOnboarding === false && fontsLoaded && servicesReady) {
      devLog('RootLayout', 'Navigating to onboarding');
      router.replace('/onboarding');
    }
  }, [hasSeenOnboarding, isLoading, fontsLoaded, servicesReady]);

  const initializeServicesInBackground = async () => {
    devLog('RootLayout', 'Starting background init');

    try {
      if (Platform.OS === 'ios' && !isExpoGo()) {
        devLog('RootLayout', 'iOS: Requesting tracking permission');
        try {
          const TrackingTransparency = await import('expo-tracking-transparency');
          const { status } = await Promise.race([
            TrackingTransparency.requestTrackingPermissionsAsync(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
          ]) as any;
          devLog('RootLayout', `Tracking: ${status}`);
        } catch (error) {
          devLog('RootLayout', 'Tracking permission skipped');
          errorLog('RootLayout', 'Tracking permission error', error);
        }
      }

      devLog('RootLayout', 'Initializing services');

      const { adsManager } = await import('../src/services/ads');
      const { unlockManager } = await import('../src/services/unlockManager');

      Promise.allSettled([
        adsManager.initialize().catch(err => {
          devLog('RootLayout', 'AdsManager failed');
          errorLog('RootLayout', 'AdsManager init failed', err);
          return false;
        }),
        unlockManager.initialize().catch(err => {
          devLog('RootLayout', 'UnlockManager failed');
          errorLog('RootLayout', 'UnlockManager init failed', err);
          return false;
        })
      ]).then(results => {
        devLog('RootLayout', 'Services initialized');
        setServicesReady(true);
        if (globalTimeoutRef.current) {
          clearTimeout(globalTimeoutRef.current);
        }
        devLog('RootLayout', 'Services results:', results);
      });
    } catch (error) {
      devLog('RootLayout', 'Init error - app continues');
      errorLog('RootLayout', 'Background initialization error', error);
      setServicesReady(true);
      if (globalTimeoutRef.current) {
        clearTimeout(globalTimeoutRef.current);
      }
    }
  };

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SubscriptionProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
      {__DEV__ && <EnvironmentBanner />}
      {__DEV__ && <SubscriptionDebugPanel />}
    </SubscriptionProvider>
  );
}


