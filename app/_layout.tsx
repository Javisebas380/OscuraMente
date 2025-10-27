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
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { devLog, errorLog, isExpoGo, validateEnvironmentConfig, getAppEnvironment } from '../src/utils/environment';
import { EnvironmentBanner } from '../components/EnvironmentBanner';
import { SubscriptionProvider } from '../src/contexts/SubscriptionContext';
import { SubscriptionDebugPanel } from '../components/SubscriptionDebugPanel';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const { hasSeenOnboarding, isLoading } = useOnboardingSeen();
  const [servicesReady, setServicesReady] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const hasInitialized = useRef(false);

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

  const addDebugLog = (message: string) => {
    setDebugLogs(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
    devLog('RootLayout', message);
  };

  useEffect(() => {
    if (fontsLoaded || fontError) {
      addDebugLog('Fonts loaded');

      if (fontError) {
        errorLog('RootLayout', 'Font loading error - using system fonts', fontError);
      }

      addDebugLog(`Platform: ${Platform.OS}`);
      addDebugLog(`Env: ${getAppEnvironment()}`);

      const validation = validateEnvironmentConfig();
      if (validation.warnings.length > 0) {
        validation.warnings.forEach(warning => {
          errorLog('RootLayout', `Config Warning: ${warning}`);
        });
      }

      setTimeout(() => {
        addDebugLog('Hiding splash screen');
        SplashScreen.hideAsync().catch(err =>
          errorLog('RootLayout', 'Failed to hide splash screen', err)
        );
      }, 500);

      if (!hasInitialized.current) {
        hasInitialized.current = true;
        initializeServicesInBackground();
      }
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (!isLoading && hasSeenOnboarding === false && fontsLoaded) {
      addDebugLog('Navigating to onboarding');
      setTimeout(() => {
        router.replace('/onboarding');
      }, 1000);
    }
  }, [hasSeenOnboarding, isLoading, fontsLoaded]);

  const initializeServicesInBackground = async () => {
    addDebugLog('Starting background init');

    try {
      if (Platform.OS === 'ios' && !isExpoGo()) {
        addDebugLog('iOS: Requesting tracking permission');
        try {
          const TrackingTransparency = await import('expo-tracking-transparency');
          const { status } = await Promise.race([
            TrackingTransparency.requestTrackingPermissionsAsync(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
          ]) as any;
          addDebugLog(`Tracking: ${status}`);
        } catch (error) {
          addDebugLog('Tracking permission skipped');
          errorLog('RootLayout', 'Tracking permission error', error);
        }
      }

      addDebugLog('Initializing services');

      const { adsManager } = await import('../src/services/ads');
      const { unlockManager } = await import('../src/services/unlockManager');

      Promise.allSettled([
        adsManager.initialize().catch(err => {
          addDebugLog('AdsManager failed');
          errorLog('RootLayout', 'AdsManager init failed', err);
          return false;
        }),
        unlockManager.initialize().catch(err => {
          addDebugLog('UnlockManager failed');
          errorLog('RootLayout', 'UnlockManager init failed', err);
          return false;
        })
      ]).then(results => {
        addDebugLog('Services initialized');
        setServicesReady(true);
        devLog('RootLayout', 'Services results:', results);
      });
    } catch (error) {
      addDebugLog('Init error - app continues');
      errorLog('RootLayout', 'Background initialization error', error);
      setServicesReady(true);
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
      {Platform.OS === 'ios' && !servicesReady && (
        <View style={styles.debugOverlay}>
          <View style={styles.debugPanel}>
            <Text style={styles.debugTitle}>Inicializando...</Text>
            <ActivityIndicator color="#00A3FF" style={{ marginVertical: 12 }} />
            {debugLogs.map((log, index) => (
              <Text key={index} style={styles.debugLog}>
                {log}
              </Text>
            ))}
          </View>
        </View>
      )}
    </SubscriptionProvider>
  );
}

const styles = StyleSheet.create({
  debugOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  debugPanel: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 32,
    borderWidth: 1,
    borderColor: '#333333',
    minWidth: 280,
  },
  debugTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  debugLog: {
    fontSize: 11,
    color: '#B3B3B3',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

