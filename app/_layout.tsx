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
import { View, Text, StyleSheet } from 'react-native';
import { devLog, errorLog } from '../src/utils/environment';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const { hasSeenOnboarding, isLoading } = useOnboardingSeen();
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const splashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

      // Timeout de seguridad: ocultar splash después de 5 segundos máximo
      splashTimeoutRef.current = setTimeout(() => {
        devLog('RootLayout', 'Safety timeout reached, hiding splash screen');
        SplashScreen.hideAsync().catch(err =>
          errorLog('RootLayout', 'Failed to hide splash screen', err)
        );
      }, 5000);

      // Initialize services (no bloqueante)
      initializeServices();

      // Ocultar splash después de un breve delay para mejor UX
      setTimeout(() => {
        if (splashTimeoutRef.current) {
          clearTimeout(splashTimeoutRef.current);
        }
        SplashScreen.hideAsync().catch(err =>
          errorLog('RootLayout', 'Failed to hide splash screen', err)
        );
      }, 1000);

      // Navigate to onboarding if not seen
      if (!isLoading && hasSeenOnboarding === false) {
        router.replace('/onboarding');
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

  const initializeServices = async () => {
    devLog('RootLayout', 'Starting service initialization...');

    // Timeout para inicialización: si tarda más de 10 segundos, continuar igual
    initTimeoutRef.current = setTimeout(() => {
      errorLog('RootLayout', 'Service initialization timeout - continuing anyway');
      setInitializationError(null); // Continuar aunque haya timeout
    }, 10000);

    try {
      // Inicializar servicios con manejo individual de errores
      const results = await Promise.allSettled([
        adsManager.initialize().catch(err => {
          errorLog('RootLayout', 'AdsManager initialization failed', err);
          return null;
        }),
        unlockManager.initialize().catch(err => {
          errorLog('RootLayout', 'UnlockManager initialization failed', err);
          return null;
        }),
      ]);

      const failedServices = results.filter(r => r.status === 'rejected');

      if (failedServices.length > 0) {
        errorLog('RootLayout', `${failedServices.length} service(s) failed to initialize`);
        // No bloqueamos la app, solo registramos el error
      } else {
        devLog('RootLayout', 'All services initialized successfully');
      }

      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    } catch (error) {
      errorLog('RootLayout', 'Critical error during service initialization', error);
      // No establecemos error - dejamos que la app continúe
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
}, 
