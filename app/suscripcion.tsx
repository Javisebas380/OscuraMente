import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, ActivityIndicator, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Crown, Check, ArrowLeft, Star, Download, ChartBar as BarChart, Users, Sparkles, Zap, RefreshCw, X, TrendingUp, Plus, Headphones, Shield, Award, Target, Eye, Gem, Infinity } from 'lucide-react-native';
import { useSubscription } from '../hooks/useSubscription';
import { useAnalytics } from '../hooks/useAnalytics';
import Toast from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';
import * as Haptics from 'expo-haptics';
import { Platform, DeviceEventEmitter } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function Suscripcion() {
  const { subscription, refresh, refreshSubscription, purchaseSubscription, restorePurchases, cancelSubscription } = useSubscription();
  const { trackEvent } = useAnalytics();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isRestoring, setIsRestoring] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success'
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    trackEvent('perfil_click_suscripcion');
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, []);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ visible: true, message, type });
  };

  const handlePurchase = async () => {
    triggerHaptic();
    trackEvent('suscripcion_compra_intento', { plan: selectedPlan });
    
    const result = await purchaseSubscription(selectedPlan);
    
    if (result.success) {
      DeviceEventEmitter.emit('premium-purchased');
      trackEvent('suscripcion_compra_ok', { plan: selectedPlan });
      showToast(result.message, 'success');
      setTimeout(() => router.back(), 2000);
    } else {
      trackEvent('suscripcion_compra_error', { plan: selectedPlan });
      showToast(result.message, 'error');
    }
  };

  const handleRestore = async () => {
    triggerHaptic();
    setIsRestoring(true);
    
    const result = await restorePurchases();
    
    if (result.success) {
      await refreshSubscription();
      DeviceEventEmitter.emit('premium-purchased');
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
    }
    
    setIsRestoring(false);
  };

  const handleCancel = async () => {
    triggerHaptic();
    setIsCancelling(true);
    
    const result = await cancelSubscription();
    
    if (result.success) {
      trackEvent('suscripcion_cancelada');
      showToast(result.message, 'success');
      setShowCancelModal(false);
      setTimeout(() => router.back(), 2000);
    } else {
      showToast(result.message, 'error');
    }
    
    setIsCancelling(false);
  };

  const premiumFeatures = [
    { icon: BarChart, text: 'Análisis psicológicos completos y personalizados', highlight: true },
    { icon: Target, text: 'Fortalezas, debilidades y planes de mejora', highlight: true },
    { icon: Award, text: 'Guías prácticas y planes de acción de 7 días', highlight: false },
    { icon: Users, text: 'Compatibilidad en relaciones, trabajo y amistades', highlight: true },
    { icon: Sparkles, text: 'Citas exclusivas y reflexiones para tu crecimiento', highlight: false },
    
  ];

  const socialProof = [
    { number: '50,000+', label: 'Usuarios Premium' },
    { number: '4.9★', label: 'Valoración Media' },
    { number: '95%', label: 'Satisfacción' },
  ];

  const plans = [
    {
      id: 'monthly',
      title: 'Semanal',
      subtitle: 'Perfecto para empezar',
      price: '$3.99',
      period: '/semana',
      
      savings: null,
      popular: false,
      badge: null,
    },
    {
      id: 'yearly',
      title: 'Anual',
      subtitle: 'Máximo valor',
      price: '$2.08',
      period: '/mes',
      totalPrice: '$24.99/año',
      savings: 'Ahorra 48%',
      popular: true,
      badge: 'RECOMENDADO',
    },
  ];

  if (subscription.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C8A951" />
        <Text style={styles.loadingText}>Cargando estado de suscripción...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(prev => ({ ...prev, visible: false }))}
      />

      <ConfirmationModal
        visible={showCancelModal}
        title="Cancelar Suscripción"
        message="¿Estás seguro de que quieres cancelar tu suscripción Premium? Perderás acceso a todas las características premium inmediatamente."
        confirmText="Cancelar Suscripción"
        cancelText="Mantener Premium"
        type="danger"
        onConfirm={handleCancel}
        onCancel={() => setShowCancelModal(false)}
      />

      {/* Premium Background */}
      <View style={styles.backgroundContainer}>
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
        
        {/* Geometric Pattern Overlay */}
        <Animated.View 
          style={[
            styles.geometricPattern,
            {
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.05, 0.15],
              })
            }
          ]}
        />
        
        {/* Floating Orbs */}
        <Animated.View 
          style={[
            styles.floatingOrb1,
            {
              transform: [{
                translateY: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -15],
                })
              }]
            }
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingOrb2,
            {
              transform: [{
                translateY: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 12],
                })
              }]
            }
          ]}
        />
        
        {/* Mysterious Vignette */}
        <View style={styles.vignette} />
        
        {/* Subtle Grid Pattern */}
        <View style={styles.gridPattern} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            triggerHaptic();
            router.back();
          }}
        >
          <ArrowLeft size={20} color="#F5F5F5" strokeWidth={1.5} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Gem size={20} color="#C8A951" strokeWidth={1.5} />
          <Text style={styles.headerTitle}>Premium</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X size={18} color="#B3B3B3" strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Status */}
        {subscription.isActive && (
          <Animated.View 
            style={[
              styles.statusSection,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
            ]}
          >
            <LinearGradient
              colors={['rgba(200, 169, 81, 0.15)', 'rgba(200, 169, 81, 0.08)', 'rgba(200, 169, 81, 0.03)']}
              style={styles.statusCard}
            >
              <View style={styles.statusIcon}>
                <Crown size={28} color="#C8A951" strokeWidth={1.5} />
              </View>
              <Text style={styles.statusTitle}>¡Eres Premium!</Text>
              <Text style={styles.statusText}>
                Plan {subscription.plan === 'yearly' ? 'Anual' : 'Mensual'} Activo
              </Text>
              <Text style={styles.expiryText}>
                Renovación: {subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString('es-ES') : 'N/A'}
              </Text>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Hero Section */}
        <Animated.View 
          style={[
            styles.heroSection,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}
        >
          <Animated.View 
            style={[
              styles.heroIconContainer,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <LinearGradient
              colors={['#C8A951', '#E6C068', '#F4D484']}
              style={styles.heroIconGradient}
            >
              <Crown size={48} color="#0D0D0D" strokeWidth={1.5} />
              <View style={styles.sparkleContainer}>
                <Sparkles size={16} color="rgba(13, 13, 13, 0.6)" strokeWidth={1.5} />
              </View>
            </LinearGradient>
          </Animated.View>

          <Text style={styles.heroTitle}>
            {subscription.isActive ? 'Gestiona tu Premium' : 'Desbloquea tu Potencial Completo'}
          </Text>
          <Text style={styles.heroSubtitle}>
            Accede a análisis psicológicos profundos, reportes personalizados y herramientas exclusivas de crecimiento personal
          </Text>

          {/* Social Proof */}
          <View style={styles.socialProofContainer}>
            {socialProof.map((item, index) => (
              <Animated.View
                key={index}
                style={{
                  opacity: fadeAnim,
                  transform: [{
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    })
                  }]
                }}
              >
                <View style={styles.socialProofItem}>
                  <Text style={styles.socialProofNumber}>{item.number}</Text>
                  <Text style={styles.socialProofLabel}>{item.label}</Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Value Proposition */}
        <View style={styles.valueSection}>
          <Text style={styles.valueTitle}>¿Por qué elegir Premium?</Text>
          <View style={styles.valueGrid}>
            {premiumFeatures.map((feature, index) => (
              <Animated.View
                key={index}
                style={{
                  opacity: fadeAnim,
                  transform: [{
                    translateX: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [index % 2 === 0 ? -30 : 30, 0],
                    })
                  }]
                }}
              >
                <View style={[
                  styles.featureCard,
                  feature.highlight && styles.highlightFeature
                ]}>
                  {feature.highlight && (
                    <LinearGradient
                      colors={['rgba(200, 169, 81, 0.1)', 'rgba(200, 169, 81, 0.05)', 'transparent']}
                      style={styles.featureGlow}
                    />
                  )}
                  
                  <View style={[
                    styles.featureIconContainer,
                    feature.highlight && styles.highlightIcon
                  ]}>
                    <feature.icon 
                      size={20} 
                      color={feature.highlight ? "#C8A951" : "#00A3FF"} 
                      strokeWidth={1.5} 
                    />
                  </View>
                  
                  <Text style={[
                    styles.featureText,
                    feature.highlight && styles.highlightText
                  ]}>
                    {feature.text}
                  </Text>
                  
                  <View style={styles.checkContainer}>
                    <Check size={14} color="#10B981" strokeWidth={2} />
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Pricing Plans */}
        {!subscription.isActive && (
          <View style={styles.pricingSection}>
            <Text style={styles.pricingTitle}>Elige tu Plan Premium</Text>
            <Text style={styles.pricingSubtitle}>Comienza con Premium, cancela cuando quieras</Text>
            
            <View style={styles.plansContainer}>
              {plans.map((plan, index) => (
                <Animated.View
                  key={plan.id}
                  style={{
                    opacity: fadeAnim,
                    transform: [{
                      scale: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.9, 1],
                      })
                    }]
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.planCard,
                      selectedPlan === plan.id && styles.selectedPlan,
                      plan.popular && styles.popularPlan
                    ]}
                    onPress={() => {
                      triggerHaptic();
                      setSelectedPlan(plan.id as 'monthly' | 'yearly');
                    }}
                    activeOpacity={0.9}
                  >
                    {plan.popular && (
                      <>
                        <LinearGradient
                          colors={['rgba(200, 169, 81, 0.15)', 'rgba(200, 169, 81, 0.08)', 'transparent']}
                          style={styles.popularGlow}
                        />
                        <View style={styles.popularBadge}>
                          <LinearGradient
                            colors={['#C8A951', '#E6C068']}
                            style={styles.popularBadgeGradient}
                          >
                            <Star size={12} color="#0D0D0D" strokeWidth={1.5} />
                            <Text style={styles.popularText}>{plan.badge}</Text>
                          </LinearGradient>
                        </View>
                      </>
                    )}
                    
                    <View style={[styles.planContent, plan.popular && styles.popularPlanContent]}>
                      <View style={styles.planHeader}>
                        <Text style={styles.planTitle}>{plan.title}</Text>
                        <Text style={styles.planSubtitle}>{plan.subtitle}</Text>
                      </View>

                      <View style={styles.priceSection}>
                        <View style={styles.priceContainer}>
                          <Text style={styles.price}>{plan.price}</Text>
                          <Text style={styles.period}>{plan.period}</Text>
                        </View>
                        
                        {plan.totalPrice && (
                          <Text style={styles.totalPrice}>Facturado como {plan.totalPrice}</Text>
                        )}
                        
                        {plan.savings && (
                          <View style={styles.savingsBadge}>
                            <Text style={styles.savingsText}>{plan.savings}</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.planBenefits}>
                        
                        <View style={styles.benefitItem}>
                          <Infinity size={14} color="#10B981" strokeWidth={1.5} />
                          <Text style={styles.benefitText}>Acceso ilimitado</Text>
                        </View>
                        <View style={styles.benefitItem}>
                          <X size={14} color="#10B981" strokeWidth={1.5} />
                          <Text style={styles.benefitText}>Cancela cuando quieras</Text>
                        </View>
                      </View>
                    </View>

                    {selectedPlan === plan.id && (
                      <View style={styles.selectedIndicator}>
                        <LinearGradient
                          colors={['#C8A951', '#E6C068']}
                          style={styles.selectedIndicatorGradient}
                        >
                          <Check size={16} color="#0D0D0D" strokeWidth={2} />
                        </LinearGradient>
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </View>
        )}


        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          {!subscription.isActive ? (
            <>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  style={styles.subscribeButton}
                  onPress={handlePurchase}
                  disabled={subscription.isLoading}
                >
                  <LinearGradient
                    colors={['#C8A951', '#E6C068', '#F4D484']}
                    style={styles.subscribeGradient}
                  >
                    {subscription.isLoading ? (
                      <ActivityIndicator size="small" color="#0D0D0D" />
                    ) : (
                      <>
                        <Crown size={20} color="#0D0D0D" strokeWidth={1.5} />
                        <Text style={styles.subscribeText}>
                          Comenzar con Premium ya
                        </Text>
                        <Sparkles size={18} color="#0D0D0D" strokeWidth={1.5} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              <Text style={styles.renewalInfo}>
                La suscripción se renueva automáticamente, salvo que se cancele al menos 24 horas antes del final del período en curso. El usuario puede gestionar o cancelar su suscripción en cualquier momento desde la configuración de su cuenta.
              </Text>
            </>
          ) : (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                triggerHaptic();
                setShowCancelModal(true);
              }}
            >
              <Text style={styles.cancelText}>Cancelar Suscripción</Text>
            </TouchableOpacity>
          )}

        </View>

        {/* Restore Purchases Button */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={isRestoring}
          activeOpacity={0.7}
        >
          {isRestoring ? (
            <ActivityIndicator size="small" color="#C8A951" />
          ) : (
            <RefreshCw size={16} color="#C8A951" strokeWidth={1.5} />
          )}
          <Text style={styles.restoreText}>
            {isRestoring ? 'Restaurando...' : 'Restaurar Compras'}
          </Text>
        </TouchableOpacity>

        {/* Urgency Section */}
        {!subscription.isActive && (
          <View style={styles.urgencySection}>
            <LinearGradient
              colors={['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.05)']}
              style={styles.urgencyCard}
            >
              <Eye size={20} color="#EF4444" strokeWidth={1.5} />
              <Text style={styles.urgencyText}>
                <Text style={styles.urgencyHighlight}>Oferta limitada:</Text> Únete a los miles de usuarios que ya han transformado su autoconocimiento
              </Text>
            </LinearGradient>
          </View>
        )}


        {/* Testimonial */}
        <View style={styles.testimonialSection}>
          <LinearGradient
            colors={['rgba(200, 169, 81, 0.08)', 'rgba(200, 169, 81, 0.03)']}
            style={styles.testimonialCard}
          >
            <View style={styles.testimonialHeader}>
              <View style={styles.starsContainer}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} color="#C8A951" fill="#C8A951" strokeWidth={1} />
                ))}
              </View>
              <Text style={styles.testimonialRating}>5.0</Text>
            </View>
            <Text style={styles.testimonialText}>
              "Los análisis son increíblemente precisos y las recomendaciones me han ayudado a mejorar mis relaciones y mi carrera profesional."
            </Text>
            <Text style={styles.testimonialAuthor}>— María S., Psicóloga</Text>
          </LinearGradient>
        </View>

        

        {/* Terms */}
        <View style={styles.termsSection}>
          <Text style={styles.termsText}>
            Al continuar, aceptas nuestros términos de servicio. La suscripción se renueva automáticamente. Cancela en cualquier momento desde configuración.
          </Text>
          <View style={styles.termsLinks}>
            <TouchableOpacity onPress={() => {
              triggerHaptic();
              router.push('/terminos');
            }}>
              <Text style={styles.termsLink}>Términos de Servicio</Text>
            </TouchableOpacity>
            <Text style={styles.termsSeparator}>•</Text>
            <TouchableOpacity onPress={() => {
              triggerHaptic();
              router.push('/privacidad');
            }}>
              <Text style={styles.termsLink}>Política de Privacidad</Text>
            </TouchableOpacity>
          </View>
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
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundGradient: {
    flex: 1,
  },
  geometricPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(200, 169, 81, 0.1)',
    borderStyle: 'solid',
    transform: [{ rotate: '45deg' }, { scale: 2 }],
  },
  floatingOrb1: {
    position: 'absolute',
    top: 120,
    right: 40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(200, 169, 81, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(200, 169, 81, 0.15)',
  },
  floatingOrb2: {
    position: 'absolute',
    bottom: 200,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 163, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0, 163, 255, 0.12)',
  },
  vignette: {},
  gridPattern: {},
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 70,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    color: '#F5F5F5',
    fontFamily: 'Playfair-Bold',
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  statusSection: {
    marginBottom: 0,
  },
  statusCard: {
    padding: 23,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(200, 169, 81, 0.4)',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#C8A951',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    
  },
  statusIcon: {
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 22,
    color: '#C8A951',
    fontFamily: 'Playfair-Bold',
    letterSpacing: -0.3,
  },
  statusText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Inter-Medium',
  },
  expiryText: {
    fontSize: 14,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
    marginBottom: 0,
  },
  heroIconContainer: {
    marginBottom: 32,
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: '#C8A951',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
    position: 'relative',
  },
  heroIconGradient: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  sparkleContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  heroTitle: {
    fontSize: 32,
    color: '#FFFFFF',
    fontFamily: 'Playfair-Bold',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.8,
    paddingHorizontal: 20,
    lineHeight: 38,
  },
  heroSubtitle: {
    fontSize: 17,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 24,
    letterSpacing: 0.1,
    marginBottom: 32,
  },
  socialProofContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: 'rgba(13, 13, 13, 0.8)',
    borderWidth: 1,
    borderColor: '#1A1A1A',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  socialProofItem: {
    alignItems: 'center',
    flex: 1,
  },
  socialProofNumber: {
    fontSize: 23,
    color: '#C8A951',
    fontFamily: 'Playfair-Bold',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  socialProofLabel: {
    fontSize: 10,
    color: '#B3B3B3',
    fontFamily: 'Inter-Medium',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  valueSection: {
    marginBottom: 40,
  },
  valueTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: 'Playfair-Bold',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: -0.5,
  },
  valueGrid: {
    gap: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 13, 13, 0.8)',
    borderWidth: 1,
    borderColor: '#1A1A1A',
    padding: 20,
    borderRadius: 18,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  highlightFeature: {
    borderColor: 'rgba(200, 169, 81, 0.3)',
    shadowColor: '#C8A951',
    shadowOpacity: 0.3,
  },
  featureGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 163, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 163, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  highlightIcon: {
    backgroundColor: 'rgba(200, 169, 81, 0.15)',
    borderColor: 'rgba(200, 169, 81, 0.4)',
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.1,
    lineHeight: 22,
  },
  highlightText: {
    fontFamily: 'Inter-Medium',
    color: '#F5F5F5',
  },
  checkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pricingSection: {
    marginBottom: 32,
  },
  pricingTitle: {
    fontSize: 26,
    color: '#FFFFFF',
    fontFamily: 'Playfair-Bold',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  pricingSubtitle: {
    fontSize: 15,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: 0.1,
  },
  plansContainer: {
    gap: 20,
  },
  planCard: {
    backgroundColor: 'rgba(13, 13, 13, 0.9)',
    borderWidth: 3,
    borderColor: '#1A1A1A',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6, 
  },
  selectedPlan: {
    borderColor: '#C8A951',
    borderWidth: 2,
    shadowColor: '#C8A951',
    shadowOpacity: 0.4,
  },
  popularPlan: {
    borderColor: 'rgba(200, 169, 81, 0.5)',
    borderWidth: 2,
  },
  popularGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderRadius: 24,
    overflow: 'hidden',
  },
  popularBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  popularText: {
    fontSize: 11,
    color: '#0D0D0D',
    fontFamily: 'Inter-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  planContent: {
    padding: 28,
    paddingTop: 17, 
  },
  popularPlanContent: {
    paddingTop: 44,
  },
  planHeader: {
    marginBottom: 10,
  },
  planTitle: {
    fontSize: 22,
    color: '#FFFFFF',
    fontFamily: 'Playfair-Bold',
    letterSpacing: -0.4,
    marginBottom: 2,
  },
  planSubtitle: {
    fontSize: 14,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.2,
  },
  priceSection: {
    alignItems: 'center',
    marginBottom: 0,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 0,
  },
  price: {
    fontSize: 36,
    color: '#FFFFFF',
    fontFamily: 'Playfair-Bold',
    letterSpacing: -0.8,
  },
  period: {
    fontSize: 18,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    marginLeft: 8,
    letterSpacing: 0.1,
  },
  totalPrice: {
    fontSize: 13,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  savingsBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  savingsText: {
    fontSize: 12,
    color: '#10B981',
    fontFamily: 'Inter-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    
  },
  planBenefits: {
    gap: 12,
    paddingTop: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.1,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 53,
    right: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  selectedIndicatorGradient: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgencySection: {
    marginBottom: 32,
  },
  urgencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20, 
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  urgencyText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  urgencyHighlight: {
    color: '#EF4444',
    fontFamily: 'Inter-Bold',
  },
  actionsSection: {
    gap: 16,
    marginBottom: 32,
  },
  subscribeButton: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#C8A951',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  subscribeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  subscribeText: {
    fontSize: 20,
    color: '#0D0D0D',
    fontFamily: 'Playfair-Bold',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#EF4444',
    fontFamily: 'Playfair-Bold',
    letterSpacing: -0.2,
  },
  testimonialSection: {
    marginBottom: 32,
  },
  testimonialCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(200, 169, 81, 0.2)',
  },
  testimonialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  testimonialRating: {
    fontSize: 14,
    color: '#C8A951',
    fontFamily: 'Inter-Bold',
    marginLeft: 4,
  },
  testimonialText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Playfair-SemiBold',
    fontStyle: 'italic',
    lineHeight: 24,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  testimonialAuthor: {
    fontSize: 13,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.3,
  },
  guaranteeSection: {
    marginBottom: 32,
  },
  guaranteeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    padding: 20,
    borderRadius: 18,
  },
  guaranteeText: {
    flex: 1,
  },
  guaranteeTitle: {
    fontSize: 16,
    color: '#10B981',
    fontFamily: 'Playfair-Bold',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  guaranteeDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  termsSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
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
  renewalInfo: {
    fontSize: 11,
    color: '#666666',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 16,
    letterSpacing: 0.1,
    paddingHorizontal: 20,
    marginTop: 16,
  },
});