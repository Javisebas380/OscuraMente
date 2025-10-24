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
import { adsManager } from '../src/services/ads';
import { unlockManager } from '../src/services/unlockManager';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { devLog, errorLog, isExpoGo } from '../src/utils/environment';

// Importar TrackingTransparency solo si está disponible
let TrackingTransparency: any = null;
try {
  if (Platform.OS === 'ios' && !isExpoGo()) {
    TrackingTransparency = require('expo-tracking-transparency');
  }
} catch (error) {
  console.log('[RootLayout] expo-tracking-transparency not available:', error);
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const { hasSeenOnboarding, isLoading } = useOnboardingSeen();
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const splashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      devLog('RootLayout', 'Fonts loaded, initializing app...');
      devLog('RootLayout', 'Environment:', Platform.OS);
      devLog('RootLayout', 'Onboarding status:', { hasSeenOnboarding, isLoading });

      // Timeout de seguridad extendido: ocultar splash después de 15 segundos máximo
      splashTimeoutRef.current = setTimeout(() => {
        devLog('RootLayout', 'Safety timeout reached (15s), hiding splash screen');
        SplashScreen.hideAsync().catch(err =>
          errorLog('RootLayout', 'Failed to hide splash screen', err)
        );
      }, 15000);

      // Request tracking permissions first (iOS only), then initialize services
      requestTrackingPermissionsAndInitialize();

      // Ocultar splash después de que los servicios estén inicializados
      setTimeout(() => {
        if (splashTimeoutRef.current) {
          clearTimeout(splashTimeoutRef.current);
        }
        devLog('RootLayout', 'Hiding splash screen after initialization');
        SplashScreen.hideAsync().catch(err =>
          errorLog('RootLayout', 'Failed to hide splash screen', err)
        );
      }, 2500);

      // Navigate to onboarding if not seen
      if (!isLoading && hasSeenOnboarding === false) {
        devLog('RootLayout', 'Navigating to onboarding');
        setTimeout(() => {
          router.replace('/onboarding');
        }, 100);
      }
    }

    return () => {
      if (splashTimeoutRef.current) {
        clearTimeout(splashTimeoutRef.current);
      }
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, [fontsLoaded, fontError, hasSeenOnboarding, isLoading]);

  const requestTrackingPermissionsAndInitialize = async () => {
    devLog('RootLayout', 'Requesting tracking permissions...');

    try {
      if (Platform.OS === 'ios' && TrackingTransparency) {
        // Solo solicitar permisos si el módulo está disponible
        try {
          const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
          devLog('RootLayout', `Tracking permission status: ${status}`);

          if (status === 'granted') {
            devLog('RootLayout', 'Tracking permission granted - ads can be personalized');
          } else {
            devLog('RootLayout', 'Tracking permission denied - showing non-personalized ads');
          }
        } catch (permError) {
          errorLog('RootLayout', 'Error requesting tracking permissions', permError);
        }
      } else if (Platform.OS === 'ios' && !TrackingTransparency) {
        devLog('RootLayout', 'iOS platform - TrackingTransparency module not available (Expo Go or web)');
        devLog('RootLayout', 'Will show non-personalized ads');
      } else {
        devLog('RootLayout', 'Android platform - no tracking permission needed');
      }
    } catch (error) {
      errorLog('RootLayout', 'Error in tracking permissions flow', error);
    }

    await initializeServices();
  };

  const initializeServices = async () => {
    devLog('RootLayout', 'Starting service initialization...');
    devLog('RootLayout', 'Platform:', Platform.OS);
    devLog('RootLayout', 'APP_ENV:', process.env.EXPO_PUBLIC_APP_ENV || 'not set');

    // Timeout extendido para modo preview: 20 segundos
    initTimeoutRef.current = setTimeout(() => {
      errorLog('RootLayout', 'Service initialization timeout (20s) - continuing anyway');
      setInitializationError(null);
    }, 20000);

    try {
      devLog('RootLayout', 'Initializing AdsManager...');
      const adsResult = await adsManager.initialize().catch(err => {
        errorLog('RootLayout', 'AdsManager initialization failed', err);
        errorLog('RootLayout', 'Error details:', JSON.stringify(err, null, 2));
        return null;
      });
      devLog('RootLayout', 'AdsManager initialization result:', adsResult);

      devLog('RootLayout', 'Initializing UnlockManager...');
      const unlockResult = await unlockManager.initialize().catch(err => {
        errorLog('RootLayout', 'UnlockManager initialization failed', err);
        errorLog('RootLayout', 'Error details:', JSON.stringify(err, null, 2));
        return null;
      });
      devLog('RootLayout', 'UnlockManager initialization result:', unlockResult);

      devLog('RootLayout', 'All services initialization complete');

      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    } catch (error) {
      errorLog('RootLayout', 'Critical error during service initialization', error);
      errorLog('RootLayout', 'Stack trace:', error instanceof Error ? error.stack : 'No stack');
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    }
  };

  // Mostrar pantalla de carga mientras se cargan las fuentes
  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Si hay error de fuentes, mostrar error pero permitir continuar
  if (fontError) {
    errorLog('RootLayout', 'Font loading error', fontError);
    // Continuamos igual - las fuentes del sistema serán el fallback
  }

  // Si hay error crítico de inicialización, mostrar pantalla de error
  if (initializationError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error de Inicialización</Text>
        <Text style={styles.errorMessage}>{initializationError}</Text>
        <Text style={styles.errorHint}>
          Por favor, cierra y vuelve a abrir la aplicación.
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#B3B3B3',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorHint: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});

