import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export function useNotifications() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      if (Platform.OS === 'web') {
        setNotificationsEnabled(false);
        return;
      }
      
      const enabled = await SecureStore.getItemAsync('notifications_enabled');
      setNotificationsEnabled(enabled === 'true');
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'web') {
      return { granted: false, canAskAgain: false };
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      return { granted: status === 'granted', canAskAgain: status !== 'denied' };
    }
    
    return { granted: true, canAskAgain: true };
  };

  const toggleNotifications = async () => {
    setIsLoading(true);
    
    try {
      if (!notificationsEnabled) {
        const { granted, canAskAgain } = await requestPermissions();
        
        if (granted) {
          if (Platform.OS !== 'web') {
          await SecureStore.setItemAsync('notifications_enabled', 'true');
          }
          setNotificationsEnabled(true);
          return { success: true, message: 'Notificaciones activadas correctamente' };
        } else {
          return { 
            success: false, 
            message: canAskAgain ? 
              'Permiso denegado. Actívalas en Ajustes del sistema.' : 
              'Permiso denegado permanentemente. Ve a Ajustes para activarlas.',
            showSettings: !canAskAgain
          };
        }
      } else {
        if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync('notifications_enabled', 'false');
        }
        setNotificationsEnabled(false);
        return { success: true, message: 'Notificaciones desactivadas' };
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      return { success: false, message: 'Error al cambiar configuración de notificaciones' };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    notificationsEnabled,
    isLoading,
    toggleNotifications,
  };
}