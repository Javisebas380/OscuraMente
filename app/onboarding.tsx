import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions, AccessibilityInfo } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Brain, Eye, Shield, Users, Star, Sparkles, Crown, ArrowRight, Check, Lock, Zap } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingSeen } from '../hooks/useOnboardingSeen';
import { useAnalytics } from '../hooks/useAnalytics';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const slides = [
  {
    id: 'welcome',
    title: 'Bienvenido a tu perfil psicológico',
    subtitle: 'Evaluaciones precisas, resultados accionables y una experiencia premium',
    icon: Brain,
    primaryCta: 'Continuar',
    secondaryCta: null,
    bullets: [],
  },
  {
    id: 'how-it-works',
    title: 'Cómo funciona',
    subtitle: 'Un proceso simple para conocerte mejor',
    icon: Zap,
    primaryCta: 'Continuar',
    secondaryCta: null,
    bullets: [
      'Responde 15 a 20 preguntas por test',
      'Resultados claros y accionables',
      'Análisis basado en investigación científica',
    ],
  },
  {
    id: 'results',
    title: 'Qué obtienes',
    subtitle: 'Insights profundos sobre tu personalidad',
    icon: Star,
    primaryCta: 'Continuar',
    secondaryCta: null,
    bullets: [
      'Análisis psicológicos completos y personalizados',
      'Fortalezas y debilidades con recomendaciones',
      'Informe extendido y plan de 7 días',
      'Compatibilidad, predicciones e insights',
    ],
  },
  {
    id: 'privacy',
    title: 'Tus datos, bajo control',
    subtitle: 'Privacidad y transparencia total',
    icon: Shield,
    primaryCta: 'Continuar',
    secondaryCta: null,
    bullets: [
      'Respuestas locales y anónimas',
      'Puedes borrar tus datos en Perfil',
      'Tus resultados están hechos para ayudarte',
    ],
  },
  {
    id: 'ready',
    title: 'Estás listo para empezar',
    subtitle: 'Elige un test y descubre tu perfil',
    icon: Crown,
    primaryCta: 'Entendido',
    secondaryCta: null,
    bullets: [],
  },
];

export default function Onboarding() {
  const { markOnboardingAsSeen } = useOnboardingSeen();
  const { trackEvent } = useAnalytics();
  const { source } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    trackEvent('onboarding_ver_pantalla', { slide: slides[currentSlide].id });
    
    // Announce slide change for accessibility
    if (Platform.OS !== 'web') {
      AccessibilityInfo.announceForAccessibility(
        `Pantalla ${currentSlide + 1} de ${slides.length}: ${slides[currentSlide].title}`
      );
    }

    // Animate slide entrance
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    
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
  }, [currentSlide]);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSkip = async () => {
    triggerHaptic();
    trackEvent('onboarding_saltar', { slide: slides[currentSlide].id });
    if (source !== 'home') {
      await markOnboardingAsSeen();
    }
    router.replace('/(tabs)');
  };

  const handleNext = () => {
    triggerHaptic();
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
      scrollViewRef.current?.scrollTo({ x: (currentSlide + 1) * screenWidth, animated: true });
    }
  };

  const handlePrimaryCta = async () => {
    triggerHaptic();
    trackEvent('onboarding_cta', { 
      slide: slides[currentSlide].id, 
      action: 'primary',
      cta: slides[currentSlide].primaryCta 
    });

    if (currentSlide === slides.length - 1) {
      // Last slide - go to tests
      trackEvent('onboarding_finalizar');
      if (source !== 'home') {
        await markOnboardingAsSeen();
      }
      router.replace('/(tabs)');
    } else {
      // Continue to next slide
      handleNext();
    }
  };

  const renderSlide = (slide: any, index: number) => {
    const IconComponent = slide.icon;
    
    return (
      <View key={slide.id} style={styles.slideContainer}>
        <Animated.View 
          style={[
            styles.slideContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['rgba(200, 169, 81, 0.12)', 'rgba(200, 169, 81, 0.06)']}
              style={styles.iconGradient}
            >
              <IconComponent size={48} color="#C8A951" strokeWidth={1.5} />
            </LinearGradient>
          </View>

          {/* Title and Subtitle */}
          <View style={styles.textSection}>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
          </View>

          {/* Bullets */}
          {slide.bullets.length > 0 && (
            <View style={styles.bulletsContainer}>
              {slide.bullets.map((bullet: string, bulletIndex: number) => (
                <View key={bulletIndex} style={styles.bulletItem}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{bullet}</Text>
                </View>
              ))}
            </View>
          )}

          {/* CTAs */}
          <View style={styles.ctaContainer}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handlePrimaryCta}
              accessibilityRole="button"
              accessibilityLabel={slide.primaryCta}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <LinearGradient
                colors={['#C8A951', '#E6C068', '#C8A951']}
                style={styles.primaryGradient}
              >
                <Text style={styles.primaryButtonText}>{slide.primaryCta}</Text>
                <ArrowRight size={18} color="#0D0D0D" strokeWidth={1.5} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    );
  };

  const currentSlideData = slides[currentSlide];

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={[
          'rgba(13, 13, 13, 0.98)',
          'rgba(26, 26, 26, 0.4)',
          'rgba(13, 13, 13, 0.98)',
          'rgba(40, 40, 40, 0.3)',
          'rgba(13, 13, 13, 1)',
        ]}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={styles.backgroundGradient}
      />

      {/* Skip Button */}
      <TouchableOpacity 
        style={styles.skipButton}
        onPress={handleSkip}
        accessibilityRole="button"
        accessibilityLabel="Saltar introducción"
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.skipText}>Saltar</Text>
      </TouchableOpacity>

      {/* Progress Indicators */}
      <View style={styles.progressContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === currentSlide && styles.progressDotActive,
              index < currentSlide && styles.progressDotCompleted,
            ]}
          />
        ))}
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{
          paddingTop: insets?.top ? insets.top + 16 : 24,
          paddingBottom: insets?.bottom ? Math.max(insets.bottom, 8) : 12,
          alignItems: 'center',
          justifyContent: 'flex-start',
          rowGap: 12
        }}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.slidesContainer}
      >
        {slides.map((slide, index) => renderSlide(slide, index))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D', 
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.8,
  },
  skipButton: {
    position: 'absolute',
    top: 100,
    right: 28,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8, 
    borderRadius: 20,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
    color: '#B3B3B3',
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.2,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingTop: 120, 
    paddingBottom: 0,  
    zIndex: 5,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(179, 179, 179, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(179, 179, 179, 0.2)',
  },
  progressDotActive: {
    backgroundColor: '#C8A951',
    borderColor: '#C8A951',
    width: 24,
    borderRadius: 4,
  },
  progressDotCompleted: {
    backgroundColor: 'rgba(200, 169, 81, 0.6)',
    borderColor: 'rgba(200, 169, 81, 0.4)',
  },
  slidesContainer: {
    flexGrow: 1,
  },
  slideContainer: {
    width: screenWidth,
    maxWidth: 720,
    alignSelf: 'center',
    alignItems: 'center' as const,
    justifyContent: 'flex-start' as const,
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 150,
  },
  slideContent: {
    width: '92%',
    alignItems: 'center' as const,
    justifyContent: 'flex-start' as const,
    gap: 12,
  },
  iconGradient: {
    width: 80, 
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
    borderColor: 'rgba(200, 169, 81, 0.3)',
  },
  iconContainer: {
    borderRadius: 40,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#C8A951',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
      },
      android: {
        elevation: 0,
      },
      default: {
        shadowColor: '#C8A951',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
      },
    }),
  },
  textSection: {
    alignItems: 'center',
    gap: 8,
  },
  slideTitle: {
    fontSize: 32,
    color: '#FFFFFF',
    fontFamily: 'Playfair-Bold',
    textAlign: 'center',
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  slideSubtitle: {
    fontSize: 17,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 26,
    letterSpacing: 0.1,
  },
  bulletsContainer: {
    width: '100%',
    gap: 12,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C8A951',
    marginTop: 6,
    shadowColor: '#C8A951',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    color: '#F5F5F5',
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  ctaContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButton: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#C8A951',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16, 
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    fontSize: 17,
    color: '#0D0D0D',
    fontFamily: 'Playfair-Bold',
    letterSpacing: -0.3,
  },
});