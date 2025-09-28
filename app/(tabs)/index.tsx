import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { Brain, Eye, Heart, Shield, Zap, Users, Target, Crown, Sparkles, Activity, Smile, MessageCircle, User, CircleHelp as HelpCircle } from 'lucide-react-native';
import { useTranslation } from '../../hooks/useTranslation';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const testsByDifficulty = {
  advanced: [
    {
      id: 'dark-triad',
      title: 'Tríada Oscura',
      subtitle: 'Narcisismo, Maquiavelismo y Psicopatía',
      icon: Crown,
      duration: '5',
      questions: 19,
    },
    {
      id: 'psychological-shadow',
      title: 'Sombra Psicológica',
      subtitle: 'Explora los rasgos ocultos de tu personalidad (basado en Jung)',
      icon: Sparkles,
      duration: '6',
      questions: 20,
    },
    {
      id: 'light-psychopathology',
      title: 'Psicopatología Ligera',
      subtitle: 'Detecta tendencias leves hacia paranoia, ansiedad o impulsividad',
      icon: Activity,
      duration: '6',
      questions: 20,
    },
    {
      id: 'persuasion-power',
      title: 'Poder de Persuasión',
      subtitle: 'Mide tus habilidades de influencia',
      icon: Zap,
      duration: '5',
      questions: 19,
    },
    {
      id: 'sesgos_cognitivos',
      title: 'Sesgos Cognitivos',
      subtitle: 'Identifica tus patrones de pensamiento',
      icon: Brain,
      duration: '6',
      questions: 19,
    },
  ],
  intermediate: [
    {
      id: 'deteccion_manipulacion',
      title: 'Detección de Manipulación',
      subtitle: 'Detecta y comprende patrones de manipulación',
      icon: Eye,
      duration: '5', 
      questions: 18,
    },
    {
      id: 'test_carisma',
      title: 'Test de Carisma',
      subtitle: 'Descubre tu personalidad magnética',
      icon: Users,
      duration: '5',
      questions: 18,
    },
    {
      id: 'inteligencia_emocional',
      title: 'Inteligencia Emocional',
      subtitle: 'Mide autoconciencia empatia y regulación emocional',
      icon: Heart,
      duration: '6',
      questions: 19,
    },
    {
      id: 'test_liderazgo',
      title: 'Test de Liderazgo',
      subtitle: 'Evalúa tu capacidad de influir y guiar a otros',
      icon: Target,
      duration: '5',
      questions: 18,
    },
    {
      id: 'resistencia_psicologica',
      title: 'Resistencia Psicológica',
      subtitle: 'Prueba tu fortaleza psicológica',
      icon: Shield,
      duration: '4',
      questions: 16,
    },
  ],
  beginner: [
    {
      id: 'senales_alerta',
      title: 'Señales de Alerta',
      subtitle: 'Identifica señales de advertencia en relaciones',
      icon: Eye,
      duration: '6',
      questions: 20,
    },
    {
      id: 'estilo_apego',
      title: 'Estilo de Apego',
      subtitle: 'Comprende tus patrones de relación',
      icon: Heart,
      duration: '5',
      questions: 18,
    },
    {
      id: 'autoestima',
      title: 'Autoestima',
      subtitle: 'Evalúa tu nivel de confianza personal',
      icon: Smile,
      duration: '5',
      questions: 18,
    },
    {
      id: 'ansiedad_social',
      title: 'Ansiedad Social',
      subtitle: 'Descubre tu nivel de incomodidad en interacciones sociales',
      icon: MessageCircle,
      duration: '5',
      questions: 18,
    },
    {
      id: 'autoconocimiento_rapido',
      title: 'Autoconocimiento Rápido',
      subtitle: 'Pequeño test introductorio para conocerte mejor',
      icon: User,
      duration: '3',
      questions: 12,
    },
  ],
};

const difficultyConfig = {
  advanced: {
    title: 'Avanzado',
    accentColor: '#C8A951',
    borderColor: 'rgba(200, 169, 81, 0.3)',
    iconBackground: 'rgba(200, 169, 81, 0.08)',
    iconBorder: 'rgba(200, 169, 81, 0.25)',
    buttonBackground: '#C8A951',
    buttonText: '#FFFFFF',
    sectionBackground: 'rgba(200, 169, 81, 0.03)',
  },
  intermediate: {
    title: 'Intermedio',
    accentColor: '#1E3A8A',
    borderColor: 'rgba(30, 58, 138, 0.3)',
    iconBackground: 'rgba(30, 58, 138, 0.08)',
    iconBorder: 'rgba(30, 58, 138, 0.25)',
    buttonBackground: '#1E3A8A',
    buttonText: '#FFFFFF',
    sectionBackground: 'rgba(30, 58, 138, 0.03)',
  },
  beginner: {
    title: 'Principiante',
    accentColor: '#6B7280',
    borderColor: 'rgba(107, 114, 128, 0.3)',
    iconBackground: 'rgba(107, 114, 128, 0.08)',
    iconBorder: 'rgba(107, 114, 128, 0.25)',
    buttonBackground: '#6B7280',
    buttonText: '#FFFFFF',
    sectionBackground: 'rgba(107, 114, 128, 0.03)',
  },
};

export default function Dashboard() {
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const trackEvent = (eventName: string, properties: any) => {
    // Analytics tracking implementation
    console.log('Analytics:', eventName, properties);
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const renderSection = (difficulty: keyof typeof testsByDifficulty, index: number) => {
    const config = difficultyConfig[difficulty];
    const tests = testsByDifficulty[difficulty];
    
    const sectionAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(sectionAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 200,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View
        key={difficulty}
        style={{
          opacity: sectionAnim,
          transform: [{
            translateY: sectionAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            })
          }]
        }}
      >
        <View style={styles.sectionContainer}>
          {/* Section Header */}
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDivider, { backgroundColor: config.accentColor }]} />
            <Text style={[styles.sectionTitle, { color: config.accentColor }]}>
              {config.title}
            </Text>
            <View style={[styles.sectionDivider, { backgroundColor: config.accentColor }]} />
          </View>

          {/* Tests in Section */}
          <View style={styles.testsGrid}>
            {tests.map((test, testIndex) => renderTestCard(test, testIndex, config))}
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderTestCard = (test: any, index: number, config: any) => {
    const IconComponent = test.icon;
    const cardAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 150,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View
        key={test.id}
        style={{
          opacity: cardAnim,
          transform: [{
            translateY: cardAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            })
          }]
        }}
      >
        <TouchableOpacity
          onPress={() => router.push(`/test/${test.id}`)}
          activeOpacity={0.9}
          style={styles.cardTouchable}
        >
          <View style={[
            styles.testCard,
            { 
              borderColor: config.borderColor,
              shadowColor: config.accentColor,
            }
          ]}>
            {/* Subtle background texture */}
            <LinearGradient
              colors={[config.sectionBackground, 'transparent', 'transparent']}
              style={styles.cardBackgroundTexture}
            />

            {/* Card Content */}
            <View style={styles.cardContent}>
              {/* Icon and Meta */}
              <View style={styles.cardHeader}>
                <View style={[
                  styles.iconContainer,
                  { 
                    backgroundColor: config.iconBackground,
                    borderColor: config.iconBorder,
                  }
                ]}>
                  <IconComponent 
                    size={24} 
                    color={config.accentColor} 
                    strokeWidth={1.5} 
                  />
                </View>
                
                <View style={styles.metaContainer}>
                  <Text style={styles.durationText}>{test.duration} min</Text>
                  <Text style={styles.questionsText}>{test.questions} {t('questions')}</Text>
                </View>
              </View>

              {/* Title and Description */}
              <View style={styles.textContent}>
                <Text style={styles.cardTitle}>{test.title}</Text>
                <Text style={styles.cardSubtitle}>{test.subtitle}</Text>
              </View>

              {/* Start Button */}
              <TouchableOpacity 
                style={[
                  styles.startButton,
                  { 
                    backgroundColor: config.buttonBackground,
                    shadowColor: config.accentColor,
                  }
                ]}
                activeOpacity={0.85}
                onPress={() => router.push(`/test/${test.id}`)}
              >
                <Text style={[styles.buttonText, { color: config.buttonText }]}>
                  {t('start_test')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Abstract Background Texture */}
      <View style={styles.backgroundTexture}>
        <LinearGradient
          colors={[
            'rgba(13, 13, 13, 0.95)',
            'rgba(26, 26, 26, 0.3)',
            'rgba(13, 13, 13, 0.95)',
            'rgba(40, 40, 40, 0.2)',
            'rgba(13, 13, 13, 1)',
          ]}
          locations={[0, 0.3, 0.5, 0.7, 1]}
          style={styles.backgroundGradient}
        />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.welcomeText}>{t('welcome')}</Text>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>{t('dark_psychology')}</Text>
            <View style={styles.titleUnderline} />
          </View>
          <Text style={styles.subtitleText}>{t('subtitle')}</Text>
        </Animated.View>

        {/* How It Works Button */}
        <View style={styles.howItWorksContainer}>
          <TouchableOpacity 
            style={styles.howItWorksButton}
            onPress={() => {
              triggerHaptic();
              trackEvent('home_onboarding_open', { source: 'home' });
              router.push('/onboarding?source=home');
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="¿Cómo funciona? - Ver introducción de la app"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <HelpCircle size={16} color="#C8A951" strokeWidth={1.5} />
            <Text style={styles.howItWorksText}>¿Cómo funciona?</Text>
          </TouchableOpacity>
        </View>

        {/* Test Sections */}
        <View style={styles.sectionsContainer}>
          {Object.keys(testsByDifficulty).map((difficulty, index) => 
            renderSection(difficulty as keyof typeof testsByDifficulty, index)
          )}
        </View>

        <View style={styles.bottomSpace} />
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
  },
  backgroundGradient: {
    flex: 1,
    opacity: 0.6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: 80,
    paddingHorizontal: 32,
    paddingBottom: 20,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  titleText: {
    fontSize: 32,
    fontFamily: 'Playfair-Bold',
    textAlign: 'center',
    letterSpacing: -0.8,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  titleUnderline: {
    width: 60,
    height: 1,
    backgroundColor: '#C8A951',
    opacity: 0.6,
  },
  subtitleText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 24,
    letterSpacing: 0.2,
    color: '#B3B3B3',
  },
  sectionsContainer: {
    paddingHorizontal: 24,
    gap: 40,
  },
  sectionContainer: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    opacity: 0.3,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginHorizontal: 20,
  },
  testsGrid: {
    gap: 20,
  },
  cardTouchable: {
    borderRadius: 20,
  },
  testCard: {
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  cardBackgroundTexture: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardContent: {
    padding: 24,
    position: 'relative',
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  metaContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  durationText: {
    fontSize: 13,
    color: '#B3B3B3',
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.3,
  },
  questionsText: {
    fontSize: 11,
    color: '#666666',
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  textContent: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: 'Playfair-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  cardSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#B3B3B3',
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  startButton: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: 'Playfair-SemiBold',
    letterSpacing: 0.3,
  },
  bottomSpace: {
    height: 40,
  },
  howItWorksContainer: {
    paddingHorizontal: 32,
    paddingBottom: 25,
    paddingTop: 0,
    alignItems: 'center',
  },
  howItWorksButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12, 
    backgroundColor: 'rgba(200, 169, 81, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(200, 169, 81, 0.3)',
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#C8A951',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 0,
      },
      default: {
        shadowColor: '#C8A951',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
    }),
  },
  howItWorksText: {
    fontSize: 15,
    color: '#C8A951',
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.2,
  },
});