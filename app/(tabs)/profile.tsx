import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState, useCallback } from 'react';
import { User, Settings, Crown, Bell, Shield, CircleHelp as HelpCircle, Mail, LogOut, ChevronRight, Sparkles, Star, CreditCard as Edit } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from '../../hooks/useNotifications';
import { useSubscription } from '../../hooks/useSubscription';
import { useAnalytics } from '../../hooks/useAnalytics';
import Toast from '../../components/Toast';
import ConfirmationModal from '../../components/ConfirmationModal';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';

// Import test configurations to get test names
import darkTriadResults from '../../data/test-results/dark-triad.json';
import psychologicalShadowResults from '../../data/test-results/psychological-shadow.json';
import lightPsychopathologyResults from '../../data/test-results/light-psychopathology.json';
import persuasionPowerResults from '../../data/test-results/persuasion-power.json';
import sesgosCognitivosResults from '../../data/test-results/sesgos-cognitivos.json';
import deteccionManipulacionResults from '../../data/test-results/deteccion-manipulacion.json';
import testCarismaResults from '../../data/test-results/test-carisma.json';
import inteligenciaEmocionalResults from '../../data/test-results/inteligencia-emocional.json';
import testLiderazgoResults from '../../data/test-results/test-liderazgo.json';
import resistenciaPsicologicaResults from '../../data/test-results/resistencia-psicologica.json';
import senalesAlertaResults from '../../data/test-results/senales-alerta.json';
import estiloApegoResults from '../../data/test-results/estilo-apego.json';
import autoestimaResults from '../../data/test-results/autoestima.json';
import ansiedadSocialResults from '../../data/test-results/ansiedad-social.json';
import autoconocimientoRapidoResults from '../../data/test-results/autoconocimiento-rapido.json';

const testConfigMap = {
  'dark-triad': darkTriadResults,
  'psychological-shadow': psychologicalShadowResults,
  'light-psychopathology': lightPsychopathologyResults,
  'persuasion-power': persuasionPowerResults,
  'sesgos_cognitivos': sesgosCognitivosResults,
  'deteccion_manipulacion': deteccionManipulacionResults,
  'test_carisma': testCarismaResults,
  'inteligencia_emocional': inteligenciaEmocionalResults,
  'test_liderazgo': testLiderazgoResults,
  'resistencia_psicologica': resistenciaPsicologicaResults,
  'senales_alerta': senalesAlertaResults,
  'estilo_apego': estiloApegoResults,
  'autoestima': autoestimaResults,
  'ansiedad_social': ansiedadSocialResults,
  'autoconocimiento_rapido': autoconocimientoRapidoResults,
};

export default function Profile() {
  const { t } = useTranslation();
  const { notificationsEnabled, isLoading: notificationsLoading, toggleNotifications } = useNotifications();
  const { subscription } = useSubscription();
  const { trackEvent } = useAnalytics();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [completedTestsCount, setCompletedTestsCount] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success'
  });
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const loadUserStats = async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const resultKeys = allKeys.filter(key => key.includes('_results') && !key.includes('_answers'));
      
      let totalScore = 0;
      let scoreCount = 0;
      let validTestsCount = 0;

      for (const key of resultKeys) {
        try {
          const testId = key.replace('test_', '').replace('_results', '');
          const resultsData = await AsyncStorage.getItem(key);
          
          if (resultsData) {
            const results = JSON.parse(resultsData);
            const testConfig = testConfigMap[testId as keyof typeof testConfigMap];
            
            if (testConfig && results) {
              // Calculate average score for this test
              const scores = Object.values(results) as number[];
              if (scores.length > 0) {
                const testAverage = scores.reduce((sum, score) => sum + score, 0) / scores.length;
                totalScore += testAverage;
                scoreCount++;
                validTestsCount++;
              }
            }
          }
        } catch (error) {
          console.error(`Error processing test ${key}:`, error);
        }
      }

      setCompletedTestsCount(validTestsCount);
      setAverageScore(scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0);
      
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUserStats();
    }, [])
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ visible: true, message, type });
  };

  const handleNotificationToggle = async () => {
    triggerHaptic();
    trackEvent(`perfil_toggle_notificaciones_${notificationsEnabled ? 'off' : 'on'}`);
    
    const result = await toggleNotifications();
    
    if (result.success) {
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
      if (result.showSettings) {
        setShowSettingsModal(true);
      }
    }
  };

  const handleContactOption = (type: 'email' | 'whatsapp' | 'twitter') => {
    triggerHaptic();
    trackEvent(`perfil_contacto_${type}`);
    
    switch (type) {
      case 'email':
        Linking.openURL('mailto:javisebas380@gmail.com?subject=Consulta desde la app');
        break;
      case 'whatsapp':
        Linking.openURL('https://wa.me/1234567890?text=Hola, tengo una consulta sobre la app de Psicología Oscura');
        break;
      case 'twitter':
        Linking.openURL('https://twitter.com/intent/tweet?text=@PsicoOscura');
        break;
    }
  };

  const handleMenuAction = (action: string) => {
    triggerHaptic();
    
    switch (action) {
      case 'subscription':
        router.push('/suscripcion');
        break;
      case 'privacy':
        router.push('/privacidad');
        break;
      case 'help':
        router.push('/ayuda');
        break;
      case 'contact':
        // Show contact options
        handleContactOption('email');
        break;
      case 'edit':
        router.push('/editar-perfil');
        break;
    }
  };

  const menuItems = [
    {
      icon: Crown,
      title: t('subscription_premium'),
      subtitle: t('unlock_detailed_insights'),
      color: '#C8A951',
      action: 'subscription',
      isPremium: true,
      isActive: subscription.isActive,
    },
    {
      icon: Bell,
      title: t('notifications'),
      subtitle: t('test_reminders'),
      color: '#00A3FF',
      action: 'notifications',
      hasSwitch: true,
      switchValue: notificationsEnabled,
      isLoading: notificationsLoading,
    },
    {
      icon: Shield,
      title: t('privacy_settings'),
      subtitle: t('manage_data'),
      color: '#F5F5F5',
      action: 'privacy',
    },
    {
      icon: HelpCircle,
      title: t('help_support'),
      subtitle: t('faq_contact'),
      color: '#B3B3B3',
      action: 'help',
    },
    {
      icon: Mail,
      title: t('contact_us'),
      subtitle: t('get_in_touch'),
      color: '#F5F5F5',
      action: 'contact',
    },
    {
      icon: Edit,
      title: 'Editar Perfil',
      subtitle: 'Cambiar nombre y configuración',
      color: '#F5F5F5',
      action: 'edit',
    },
  ];

  const renderMenuItem = (item: any, index: number) => {
    const itemAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(itemAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View
        key={index}
        style={{
          opacity: itemAnim,
          transform: [{
            translateX: itemAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            })
          }]
        }}
      >
        <TouchableOpacity 
          style={[
            styles.menuItem,
            item.isPremium && styles.premiumMenuItem
          ]} 
          activeOpacity={0.85}
          onPress={() => item.hasSwitch ? handleNotificationToggle() : handleMenuAction(item.action)}
        >
          {item.isPremium && (
            <LinearGradient
              colors={['rgba(200, 169, 81, 0.08)', 'rgba(200, 169, 81, 0.03)', 'transparent']}
              style={styles.premiumMenuGlow}
            />
          )}
          
          <View style={styles.menuContent}>
            <View style={[
              styles.iconContainer,
              item.isPremium && styles.premiumIconContainer,
              item.isActive && styles.activeIconContainer
            ]}>
              <item.icon size={18} color={item.color} strokeWidth={1.5} />
            </View>
            <View style={styles.menuText}>
              <View style={styles.titleRow}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                {item.isActive && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeText}>Activo</Text>
                  </View>
                )}
              </View>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            {item.hasSwitch ? (
              <Switch
                value={item.switchValue}
                onValueChange={handleNotificationToggle}
                disabled={item.isLoading}
                trackColor={{ false: '#1A1A1A', true: '#00A3FF' }}
                thumbColor="#F5F5F5"
              />
            ) : (
              <View style={styles.menuAction}>
                <ChevronRight size={16} color="#666666" strokeWidth={1.5} />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(prev => ({ ...prev, visible: false }))}
      />

      <ConfirmationModal
        visible={showSettingsModal}
        title="Activar Notificaciones"
        message="Para recibir notificaciones, actívalas en los Ajustes del sistema."
        confirmText="Abrir Ajustes"
        cancelText="Cancelar"
        onConfirm={() => {
          setShowSettingsModal(false);
          Linking.openSettings();
        }}
        onCancel={() => setShowSettingsModal(false)}
      />

      {/* Background Texture */}
      <View style={styles.backgroundTexture} />
      
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={['rgba(0, 163, 255, 0.2)', 'rgba(0, 163, 255, 0.1)']}
            style={styles.avatarGradient}
          >
            <User size={32} color="#F5F5F5" strokeWidth={1.5} />
          </LinearGradient>
        </View>
        <Text style={styles.nameText}>Explorador de Psicología</Text>
        <Text style={styles.emailText}>{t('psychology_explorer').toLowerCase()}@psicoscura.app</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{completedTestsCount}</Text>
            <Text style={styles.statLabel}>Pruebas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{subscription.isActive ? '∞' : '3'}</Text>
            <Text style={styles.statLabel}>Premium</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{averageScore}%</Text>
            <Text style={styles.statLabel}>Promedio</Text>
          </View>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <>
        <View style={styles.menuContainer}>
          {menuItems.map(renderMenuItem)}
        </View>

        {!subscription.isActive && (
          <TouchableOpacity 
            style={styles.premiumBanner}
            onPress={() => {
              triggerHaptic();
              router.push('/suscripcion');
            }}
          >
            <LinearGradient
              colors={['#C8A951', '#E6C068', '#C8A951']}
              style={styles.bannerGradient}
            >
              <View style={styles.bannerContent}>
                <Sparkles size={28} color="#0D0D0D" strokeWidth={1.5} />
                <View style={styles.bannerText}>
                  <Text style={styles.bannerTitle}>Desbloquea Premium</Text>
                  <Text style={styles.bannerSubtitle}>Análisis completos y características exclusivas</Text>
                </View>
                <TouchableOpacity style={styles.upgradeBtn}>
                  <Text style={styles.upgradeBtnText}>Actualizar</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => {
            triggerHaptic();
            showToast('Cerrando sesión...', 'success');
            setTimeout(() => router.replace('/'), 1500);
          }}
        >
          <LogOut size={18} color="#FF4444" strokeWidth={1.5} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpace} />
        </>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  backgroundTexture: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0D0D0D',
    opacity: 0.4,
  },
  header: {
    paddingTop: 70,
    paddingHorizontal: 28,
    paddingBottom: 36,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 20,
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: '#00A3FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarGradient: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 163, 255, 0.3)',
  },
  nameText: {
    fontSize: 24,
    color: '#F5F5F5',
    fontFamily: 'Playfair-Bold',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  emailText: {
    fontSize: 14,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    marginBottom: 28,
    letterSpacing: 0.2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 13, 13, 0.8)',
    borderWidth: 1,
    borderColor: '#1A1A1A',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    color: '#00A3FF',
    fontFamily: 'Playfair-Bold',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    color: '#B3B3B3',
    fontFamily: 'Inter-Medium',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#1A1A1A',
    marginHorizontal: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  menuContainer: {
    gap: 12,
    marginBottom: 36,
  },
  menuItem: {
    backgroundColor: 'rgba(13, 13, 13, 0.8)',
    borderWidth: 1,
    borderColor: '#1A1A1A',
    borderRadius: 18,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  premiumMenuItem: {
    borderColor: 'rgba(200, 169, 81, 0.2)',
  },
  premiumMenuGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menuContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    position: 'relative',
    zIndex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  premiumIconContainer: {
    backgroundColor: 'rgba(200, 169, 81, 0.1)',
    borderColor: 'rgba(200, 169, 81, 0.3)',
  },
  activeIconContainer: {
    backgroundColor: 'rgba(200, 169, 81, 0.15)',
    borderColor: '#C8A951',
  },
  menuText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuTitle: {
    fontSize: 16,
    color: '#F5F5F5',
    fontFamily: 'Playfair-SemiBold',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  activeBadge: {
    backgroundColor: 'rgba(200, 169, 81, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(200, 169, 81, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeText: {
    fontSize: 10,
    color: '#C8A951',
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.1,
  },
  menuAction: {
    padding: 8,
  },
  premiumBanner: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 28,
    shadowColor: '#C8A951',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  bannerGradient: {
    padding: 24,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 20,
    fontFamily: 'Playfair-Bold',
    color: '#0D0D0D',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: 'rgba(13, 13, 13, 0.8)',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  upgradeBtn: {
    backgroundColor: 'rgba(13, 13, 13, 0.2)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(13, 13, 13, 0.3)',
  },
  upgradeBtnText: {
    fontSize: 12,
    color: '#0D0D0D',
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 18,
    backgroundColor: 'rgba(13, 13, 13, 0.8)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.2)',
  },
  logoutText: {
    fontSize: 15,
    color: '#FF4444',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.2,
  },
  bottomSpace: {
    height: 40,
  },
});