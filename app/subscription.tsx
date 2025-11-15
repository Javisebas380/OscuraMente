import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Crown, Check, ArrowLeft, Star, Download, ChartBar as BarChart, Users, Sparkles, Zap, RotateCcw } from 'lucide-react-native';
import { useTranslation } from '../hooks/useTranslation';
import { useSubscription } from '../hooks/useSubscription';
import Toast from '../components/Toast';

export default function Subscription() {
  const { t } = useTranslation();
  const { restorePurchases } = useSubscription();
  const [isRestoring, setIsRestoring] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, []);

  const handleRestorePurchases = async () => {
    if (isRestoring) return;

    setIsRestoring(true);

    try {
      const result = await restorePurchases();

      if (result.success) {
        setToastType('success');
        setToastMessage(result.message || 'Compras restauradas correctamente');
        setToastVisible(true);

        // Opcionalmente, navegar de regreso después de una restauración exitosa
        setTimeout(() => {
          router.back();
        }, 2000);
      } else {
        setToastType('error');
        setToastMessage(result.message || 'No se encontraron compras previas');
        setToastVisible(true);
      }
    } catch (error) {
      setToastType('error');
      setToastMessage('Error al restaurar compras');
      setToastVisible(true);
    } finally {
      setIsRestoring(false);
    }
  };

  const features = [
    { icon: BarChart, text: t('comprehensive_report'), premium: true },
    { icon: Download, text: t('pdf_export'), premium: true },
    { icon: Users, text: 'Comparar con rankings globales de usuarios', premium: true },
    { icon: Star, text: t('exclusive_assessments'), premium: true },
    { icon: Zap, text: 'Soporte prioritario y acceso anticipado', premium: true },
  ];

  const plans = [
    {
      id: 'weekly',
      title: t('monthly'),
      price: '$7.99',
      period: '/mes',
      savings: null,
      popular: false,
    },
    {
      id: 'annual',
      title: t('yearly'),
      price: '$49.99',
      period: '/año',
      savings: t('save_48'),
      popular: true,
    },
  ];

  const renderFeature = (feature: any, index: number) => {
    const featureAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(featureAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 150,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View
        key={index}
        style={{
          opacity: featureAnim,
          transform: [{
            translateX: featureAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            })
          }]
        }}
      >
        <View style={styles.featureRow}>
          <LinearGradient
            colors={['rgba(200, 169, 81, 0.1)', 'rgba(200, 169, 81, 0.05)']}
            style={styles.featureGlow}
          />
          <View style={styles.featureIcon}>
            <feature.icon size={18} color="#C8A951" strokeWidth={1.5} />
          </View>
          <Text style={styles.featureText}>{feature.text}</Text>
          <Check size={16} color="#C8A951" strokeWidth={1.5} />
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background Texture */}
      <View style={styles.backgroundTexture} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color="#F5F5F5" strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Premium</Text>
        <Text style={styles.headerTitle}>{t('premium')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <Animated.View 
          style={[
            styles.heroSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.crownContainer,
              {
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
                transform: [{
                  scale: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.05],
                  })
                }]
              }
            ]}
          >
            <LinearGradient
              colors={['#C8A951', '#E6C068', '#C8A951']}
              style={styles.crownGradient}
            >
              <Crown size={36} color="#0D0D0D" strokeWidth={1.5} />
            </LinearGradient>
          </Animated.View>
          <Text style={styles.heroTitle}>Unlock Your Full Potential</Text>
          <Text style={styles.heroTitle}>{t('unlock_potential')}</Text>
          <Text style={styles.heroSubtitle}>{t('premium_description')}</Text>
        </Animated.View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>{t('premium_features_title')}</Text>
          {features.map(renderFeature)}
        </View>

        {/* Pricing Plans */}
        <View style={styles.pricingSection}>
          <Text style={styles.sectionTitle}>{t('choose_plan')}</Text>
          {plans.map((plan, index) => {
            const planAnim = useRef(new Animated.Value(0)).current;

            useEffect(() => {
              Animated.timing(planAnim, {
                toValue: 1,
                duration: 400,
                delay: index * 200,
                useNativeDriver: true,
              }).start();
            }, []);

            return (
              <Animated.View
                key={plan.id}
                style={{
                  opacity: planAnim,
                  transform: [{
                    translateY: planAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    })
                  }]
                }}
              >
                <TouchableOpacity 
                  style={[
                    styles.planCard,
                    plan.popular && styles.popularPlan
                  ]}
                  activeOpacity={0.85}
                >
                  {plan.popular && (
                    <LinearGradient
                      colors={['rgba(200, 169, 81, 0.15)', 'rgba(200, 169, 81, 0.08)', 'transparent']}
                      style={styles.popularGlow}
                    />
                  )}
                  
                  <View style={styles.planContent}>
                    {plan.popular && (
                      <View style={styles.popularBadge}>
                        <LinearGradient
                          colors={['#C8A951', '#E6C068']}
                          style={styles.popularBadgeGradient}
                        >
                          <Star size={12} color="#0D0D0D" strokeWidth={1.5} />
                          <Text style={styles.popularText}>{t('most_popular')}</Text>
                        </LinearGradient>
                      </View>
                    )}
                    
                    <View style={styles.planHeader}>
                      <Text style={styles.planTitle}>{plan.title}</Text>
                      {plan.savings && (
                        <View style={styles.savingsBadge}>
                          <Text style={styles.savingsText}>{plan.savings}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.priceContainer}>
                      <Text style={styles.price}>{plan.price}</Text>
                      <Text style={styles.period}>{plan.period}</Text>
                    </View>

                    <Text style={styles.trialText}>7-day free trial</Text>
                    <Text style={styles.trialText}>{t('free_trial')}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* CTA Button */}
        <TouchableOpacity style={styles.subscribeButton}>
          <LinearGradient
            colors={['#C8A951', '#E6C068', '#C8A951']}
            style={styles.subscribeGradient}
          >
            <Sparkles size={18} color="#0D0D0D" strokeWidth={1.5} />
            <Text style={styles.subscribeText}>{t('start_free_trial')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Restore Purchases Button */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestorePurchases}
          disabled={isRestoring}
          activeOpacity={0.7}
        >
          {isRestoring ? (
            <ActivityIndicator size="small" color="#C8A951" />
          ) : (
            <RotateCcw size={16} color="#C8A951" strokeWidth={1.5} />
          )}
          <Text style={styles.restoreText}>
            {isRestoring ? 'Restaurando...' : t('restore')}
          </Text>
        </TouchableOpacity>

        {/* Terms */}
        <View style={styles.termsSection}>
          <Text style={styles.termsText}>{t('trial_terms')}</Text>
          <View style={styles.termsLinks}>
            <Text style={styles.termsLink}>{t('terms_service')}</Text>
            <Text style={styles.termsSeparator}>•</Text>
            <Text style={styles.termsLink}>{t('privacy_policy')}</Text>
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Toast Notification */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 70,
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  backButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
  },
  headerTitle: {
    fontSize: 18,
    color: '#F5F5F5',
    fontFamily: 'Playfair-Bold',
    letterSpacing: -0.2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  crownContainer: {
    marginBottom: 24,
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: '#C8A951',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  crownGradient: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    color: '#F5F5F5',
    fontFamily: 'Playfair-Bold',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 24,
    letterSpacing: 0.1,
  },
  featuresSection: {
    marginBottom: 44,
  },
  sectionTitle: {
    fontSize: 22,
    color: '#F5F5F5',
    fontFamily: 'Playfair-Bold',
    textAlign: 'center',
    marginBottom: 28,
    letterSpacing: -0.3,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 13, 13, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(200, 169, 81, 0.2)',
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  featureGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(200, 169, 81, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(200, 169, 81, 0.3)',
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: '#F5F5F5',
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.1,
  },
  pricingSection: {
    marginBottom: 36,
  },
  planCard: {
    backgroundColor: 'rgba(13, 13, 13, 0.8)',
    borderWidth: 1,
    borderColor: '#1A1A1A',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  popularPlan: {
    borderColor: 'rgba(200, 169, 81, 0.4)',
    borderWidth: 2,
  },
  popularGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  planContent: {
    padding: 28,
    position: 'relative',
    zIndex: 1,
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderRadius: 20,
    overflow: 'hidden',
  },
  popularBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  popularText: {
    fontSize: 11,
    color: '#0D0D0D',
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  planTitle: {
    fontSize: 20,
    color: '#F5F5F5',
    fontFamily: 'Playfair-Bold',
    letterSpacing: -0.3,
  },
  savingsBadge: {
    backgroundColor: 'rgba(200, 169, 81, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(200, 169, 81, 0.4)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  savingsText: {
    fontSize: 11,
    color: '#C8A951',
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  price: {
    fontSize: 32,
    color: '#F5F5F5',
    fontFamily: 'Playfair-Bold',
    letterSpacing: -0.5,
  },
  period: {
    fontSize: 16,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    marginLeft: 6,
    letterSpacing: 0.1,
  },
  trialText: {
    fontSize: 13,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.2,
  },
  subscribeButton: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 36,
    shadowColor: '#C8A951',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  subscribeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
  },
  subscribeText: {
    fontSize: 16,
    color: '#0D0D0D',
    fontFamily: 'Playfair-Bold',
    letterSpacing: -0.2,
  },
  termsSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  termsText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    letterSpacing: 0.1,
  },
  termsLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  termsLink: {
    fontSize: 12,
    color: '#00A3FF',
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.2,
  },
  termsSeparator: {
    fontSize: 12,
    color: '#333333',
  },
  bottomSpace: {
    height: 40,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(200, 169, 81, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(200, 169, 81, 0.3)',
    borderRadius: 16,
    marginBottom: 28,
  },
  restoreText: {
    fontSize: 15,
    color: '#C8A951',
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.2,
  },
});