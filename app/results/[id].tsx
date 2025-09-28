import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { ArrowLeft, Share, Crown, Eye, Zap, Download, Users, Star, Sparkles } from 'lucide-react-native';
import { ChevronDown } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RadarChart from '../../components/RadarChart';
import LockedSection from '../../components/LockedSection';
import { useSubscription } from '../../hooks/useSubscription';
import { useUnlockState } from '../../hooks/useUnlockState';
import { useAnalytics } from '../../hooks/useAnalytics';
import Toast from '../../components/Toast';
import * as Haptics from 'expo-haptics';
import { Platform, DeviceEventEmitter } from 'react-native';
import { adsManager } from '../../src/services/ads';
import { unlockManager } from '../../src/services/unlockManager';

// Import test results configurations
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

const testResultsMap = {
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

export default function TestResults() {
  const { id } = useLocalSearchParams();
  const { subscription, refreshSubscription } = useSubscription();
  const { isUnlocked, canUseFreeUnlock, unlockSection, refreshUnlockState } = useUnlockState(subscription);
  const { trackEvent } = useAnalytics();
  
  const [results, setResults] = useState<{ [key: string]: number } | null>(null);
  const [testConfig, setTestConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTraits, setExpandedTraits] = useState<{ [key: string]: boolean }>({});
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success'
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Stable derived values using useMemo
  const accentColor = React.useMemo(() => {
    if (!testConfig) return '#C8A951';
    switch (testConfig.nivel) {
      case 'avanzado': return '#C8A951';
      case 'intermedio': return '#1E3A8A';
      case 'basico': return '#6B7280';
      default: return '#C8A951';
    }
  }, [testConfig?.nivel]);

  const dominantTrait = React.useMemo(() => {
    if (!results) return '';
    return Object.keys(results).reduce((a, b) => 
      results[a] > results[b] ? a : b
    );
  }, [results]);

  const dominantArchetype = React.useMemo(() => {
    if (!testConfig || !dominantTrait) return null;
    return testConfig.arquetipos?.find((arch: any) => arch.clave === dominantTrait);
  }, [testConfig?.arquetipos, dominantTrait]);
  
  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ visible: true, message, type });
  };

  // Stable loadResults function
  const loadResults = useCallback(async () => {
    try {
      const savedResults = await AsyncStorage.getItem(`test_${id}_results`);
      
      if (!savedResults) {
        showToast('No se encontraron resultados para este test', 'error');
        setTimeout(() => router.replace('/'), 2000);
        return;
      }

      const parsedResults = JSON.parse(savedResults);
      
      const config = testResultsMap[id as keyof typeof testResultsMap];
      
      if (!config) {
        showToast(`Configuración no encontrada para el test: ${id}`, 'error');
        setTimeout(() => router.replace('/'), 2000);
        return;
      }

      // Simple migration for trait mapping
      let finalResults = parsedResults;
      if (config.traitMap) {
        const migratedResults: { [key: string]: number } = {};
        Object.keys(parsedResults).forEach(oldKey => {
          const newKey = config.traitMap[oldKey] || oldKey;
          migratedResults[newKey] = parsedResults[oldKey];
        });
        finalResults = migratedResults;
      }
      
      setResults(finalResults);
      setTestConfig(config);
      trackEvent('results_view', { testId: id });
    } catch (error) {
      showToast('Error al cargar los resultados', 'error');
      setTimeout(() => router.replace('/'), 2000);
    } finally {
      setIsLoading(false);
    }
  }, [id, trackEvent]);

  // Load results only once when component mounts
  useEffect(() => {
    loadResults();
  }, [loadResults]);

  // Simple animations on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Listen for subscription updates
  useEffect(() => {
    const listener = DeviceEventEmitter.addListener('subscription-updated', () => {
      refreshSubscription();
      showToast('Premium activado: contenido desbloqueado', 'success');
    });
    return () => listener.remove();
  }, [refreshSubscription]);

  const handleUnlockSection = useCallback(async (trait: string, section: string) => {
    triggerHaptic();
    
    if (section === 'premium') {
      router.push('/suscripcion');
      return;
    }

    if (section === 'ad_unlock') {
      showToast('Cargando anuncio...', 'success');
      
      try {
        const result = await unlockSection(id as string, trait, 'ad_unlock', 'ad');
        
        if (result.success) {
          showToast('¡Contenido desbloqueado!', 'success');
        } else {
          showToast('Error al mostrar anuncio', 'error');
        }
      } catch (error) {
        showToast('Error al cargar anuncio', 'error');
      }
    }
  }, [id, triggerHaptic, unlockSection]);

  const toggleTraitExpansion = useCallback((trait: string) => {
    triggerHaptic();
    setExpandedTraits(prev => ({
      ...prev,
      [trait]: !prev[trait]
    }));
  }, [triggerHaptic]);

  const getBandForTrait = useCallback((trait: string, score: number) => {
    if (!testConfig?.bands?.[trait]) return null;
    const bands = testConfig.bands[trait];
    return bands.find((band: any) => score >= band.min && score <= band.max);
  }, [testConfig]);

  const getTraitName = useCallback((trait: string) => {
    const names: { [key: string]: string } = {
      'narcisismo': 'Narcisismo',
      'maquiavelismo': 'Maquiavelismo',
      'psicopatia': 'Psicopatía',
      'autenticidad': 'Autenticidad',
      'aceptacion': 'Aceptación',
      'integracion': 'Integración',
      'ansiedad': 'Ansiedad',
      'paranoia': 'Paranoia',
      'impulsividad': 'Impulsividad',
      'conciencia': 'Autoconciencia',
      'regulacion': 'Autorregulación',
      'empatia': 'Empatía',
      'presencia': 'Presencia',
      'conexion': 'Conexión',
      'magnetismo': 'Magnetismo',
      'vision': 'Visión',
      'comunicacion': 'Comunicación',
      'ejecucion': 'Ejecución',
      'resistencia': 'Resistencia',
      'adaptacion': 'Adaptación',
      'fortaleza': 'Fortaleza',
      'observacion': 'Observación',
      'intuicion': 'Intuición',
      'proteccion': 'Protección',
      'valoracion': 'Autovaloración',
      'confianza': 'Autoconfianza',
      'seguridad': 'Seguridad',
      'dependencia': 'Dependencia',
      'evitacion': 'Evitación',
      'timidez': 'Timidez',
      'hiperconciencia': 'Hiperconciencia',
      'introspeccion': 'Introspección',
      'reflexion': 'Reflexión',
      'consciencia': 'Consciencia',
      'deteccion': 'Detección',
      'contraataque': 'Contraataque',
      'carisma': 'Carisma',
      'logica': 'Lógica',
      'manipulacion': 'Manipulación',
      'confirmacion': 'Confirmación',
      'disponibilidad': 'Disponibilidad',
      'anclaje': 'Anclaje'
    };
    return names[trait] || trait;
  }, []);

  if (subscription.isLoading && !subscription.isActiveChecked) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C8A951" />
        <Text style={styles.loadingText}>Actualizando suscripción...</Text>
      </View>
    );
  }
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C8A951" />
        <Text style={styles.loadingText}>Cargando resultados...</Text>
      </View>
    );
  }

  if (!results || !testConfig) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Resultados No Encontrados</Text>
        <Text style={styles.errorMessage}>
          No se pudieron cargar los resultados para este test
        </Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.retryText}>Volver al Inicio</Text>
        </TouchableOpacity>
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
        <Text style={styles.headerTitle}>{testConfig.titulo}</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Share size={18} color="#F5F5F5" strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
          <View style={styles.overviewSection}>
            <Text style={styles.resultsTitle}>Tus Resultados</Text>
            
            {dominantArchetype && (
              <View style={styles.archetypeCard}>
                <LinearGradient
                  colors={[`${accentColor}1A`, `${accentColor}0D`]}
                  style={styles.archetypeGradient}
                >
                  <Text style={styles.archetypeLabel}>Tu Arquetipo Dominante</Text>
                  <Text style={[styles.archetypeName, { color: accentColor }]}>
                    {dominantArchetype.label}
                  </Text>
                  <Text style={styles.archetypeDescription}>
                    {dominantArchetype.descripcion}
                  </Text>
                </LinearGradient>
              </View>
            )}

            {/* Radar Chart */}
            {testConfig.visual === 'radar' && (
              <View style={styles.chartContainer}>
                <RadarChart 
                  data={results} 
                  size={290} 
                  accentColor={accentColor}
                />
              </View>
            )}
          </View>

          {/* Trait Analysis */}
          <View style={styles.analysisSection}>
            <Text style={styles.sectionTitle}>Análisis Detallado</Text>
            {testConfig?.rasgos?.map((trait: string) => {
              const score = results[trait] || 0;
              const band = getBandForTrait(trait, score);
              const traitName = getTraitName(trait);
              const isExpanded = expandedTraits[trait] || false;
              
              if (!band) return null;

              return (
                <View key={trait} style={styles.traitSection}>
                  <TouchableOpacity 
                    style={styles.traitHeader}
                    onPress={() => toggleTraitExpansion(trait)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.traitTitleRow}>
                      <Text style={[styles.traitTitle, { color: accentColor }]}>
                        {traitName}
                      </Text>
                      <View style={[styles.scoreBadge, { backgroundColor: accentColor }]}>
                        <Text style={styles.scoreText}>{score}%</Text>
                      </View>
                    </View>
                    <View style={styles.expandIndicator}>
                      <ChevronDown 
                        size={20} 
                        color="#B3B3B3" 
                        strokeWidth={1.5}
                        style={{
                          transform: [{ rotate: isExpanded ? '180deg' : '0deg' }]
                        }}
                      />
                    </View>
                  </TouchableOpacity>

                  <View style={styles.basicInfo}>
                    <Text style={styles.bandLabel}>Nivel: {band.label}</Text>
                    <Text style={styles.freeSummary}>{band.free_summary}</Text>
                  </View>

                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      {/* Ad Unlock Section */}
                      <LockedSection
                        isUnlocked={isUnlocked(testConfig.id, trait, 'ad_unlock')}
                        lockType="ad"
                        onUnlockPress={() => handleUnlockSection(trait, 'ad_unlock')}
                        sectionName={`análisis de ${traitName.toLowerCase()}`}
                      >
                        <View style={styles.adUnlockContent}>
                          <View style={styles.strengthsWeaknesses}>
                            <View style={styles.column}>
                              <Text style={styles.columnTitle}>Fortalezas</Text>
                              {band.ad_unlock?.fortalezas?.map((strength: string, idx: number) => (
                                <Text key={idx} style={styles.listItem}>• {strength}</Text>
                              ))}
                            </View>
                            <View style={styles.column}>
                              <Text style={styles.columnTitle}>Debilidades</Text>
                              {band.ad_unlock?.debilidades?.map((weakness: string, idx: number) => (
                                <Text key={idx} style={styles.listItem}>• {weakness}</Text>
                              ))}
                            </View>
                          </View>
                          <View style={styles.recommendations}>
                            <Text style={styles.columnTitle}>Recomendaciones</Text>
                            {band.ad_unlock?.recomendaciones_breves?.map((rec: string, idx: number) => (
                              <Text key={idx} style={styles.listItem}>• {rec}</Text>
                            ))}
                          </View>
                        </View>
                      </LockedSection>

                      {/* Premium Section */}
                      <LockedSection
                        isUnlocked={subscription.isActive}
                        lockType="premium"
                        onUnlockPress={() => router.push('/suscripcion')}
                        sectionName={`análisis completo de ${traitName.toLowerCase()}`}
                      >
                        <View style={styles.premiumContent}>
                          <Text style={styles.detailText}>{band.premium?.detalle}</Text>
                          
                          <View style={styles.premiumSection}>
                            <Text style={styles.sectionTitle}>Cómo Mejorar</Text>
                            {band.premium?.mejorar?.map((item: string, idx: number) => (
                              <Text key={idx} style={styles.listItem}>• {item}</Text>
                            ))}
                          </View>

                          <View style={styles.premiumSection}>
                            <Text style={styles.sectionTitle}>Alertas</Text>
                            {band.premium?.alertas?.map((alert: string, idx: number) => (
                              <Text key={idx} style={styles.alertItem}>⚠️ {alert}</Text>
                            ))}
                          </View>

                          <View style={styles.premiumSection}>
                            <Text style={styles.sectionTitle}>Oportunidades</Text>
                            {band.premium?.oportunidades?.map((opp: string, idx: number) => (
                              <Text key={idx} style={styles.listItem}>• {opp}</Text>
                            ))}
                          </View>

                          <View style={styles.premiumSection}>
                            <Text style={styles.sectionTitle}>Impacto en Relaciones</Text>
                            {band.premium?.impacto_relaciones?.map((impact: string, idx: number) => (
                              <Text key={idx} style={styles.listItem}>• {impact}</Text>
                            ))}
                          </View>

                          <View style={styles.premiumSection}>
                            <Text style={styles.sectionTitle}>Plan de 7 Días</Text>
                            {band.premium?.plan_7_dias?.map((day: string, idx: number) => (
                              <Text key={idx} style={styles.dayItem}>{day}</Text>
                            ))}
                          </View>

                          <View style={styles.quoteSection}>
                            <Text style={styles.quote}>"{band.premium?.cita}"</Text>
                          </View>
                        </View>
                      </LockedSection>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Global Comparison - Premium */}
          {testConfig.comparativa?.enabled && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Comparación Global</Text>
              <LockedSection
                isUnlocked={subscription.isActive}
                lockType="premium"
                onUnlockPress={() => router.push('/suscripcion')}
                sectionName="comparación global"
              >
                <View style={styles.globalSection}>
                  <Text style={styles.globalText}>
                    {testConfig.comparativa.texto_premium}
                  </Text>
                  
                  <View style={styles.globalStats}>
                    <View style={styles.globalStat}>
                      <Users size={24} color={accentColor} strokeWidth={1.5} />
                      <Text style={styles.globalStatText}>Comparado con 10,000+ usuarios</Text>
                    </View>
                    <View style={styles.globalStat}>
                      <Star size={24} color={accentColor} strokeWidth={1.5} />
                      <Text style={styles.globalStatText}>Percentiles detallados por rasgo</Text>
                    </View>
                  </View>
                </View>
              </LockedSection>
            </View>
          )}

          {/* Compatibility Analysis - Premium Global Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Compatibilidad de Personalidad</Text>
            <LockedSection
              isUnlocked={subscription.isActive}
              lockType="premium"
              onUnlockPress={() => router.push('/suscripcion')}
              sectionName="análisis de compatibilidad"
            >
              <View style={styles.compatibilitySection}>
                {testConfig.premium_global?.compatibilidad?.relaciones && (
                  <View style={styles.compatibilityCategory}>
                    <Text style={styles.categoryTitle}>💕 Relaciones</Text>
                    <View style={styles.compatibilityList}>
                      <Text style={styles.compatibilitySubtitle}>Fácil compatibilidad:</Text>
                      {testConfig.premium_global.compatibilidad.relaciones.facil?.map((item: string, idx: number) => (
                        <Text key={idx} style={styles.compatibilityText}>• {item}</Text>
                      ))}
                      
                      <Text style={styles.compatibilitySubtitle}>Compatibilidad desafiante:</Text>
                      {testConfig.premium_global.compatibilidad.relaciones.dificil?.map((item: string, idx: number) => (
                        <Text key={idx} style={styles.compatibilityText}>• {item}</Text>
                      ))}
                    </View>
                  </View>
                )}
                <View style={styles.compatibilityCategory}>
                  <Text style={styles.categoryTitle}>💼 Trabajo</Text>
                  <View style={styles.compatibilityList}>
                    <Text style={styles.compatibilitySubtitle}>Entornos ideales:</Text>
                    <Text style={styles.compatibilityText}>• Culturas de feedback honesto y alto rendimiento</Text>
                    <Text style={styles.compatibilityText}>• Espacios de innovación y liderazgo transformacional</Text>
                    
                    <Text style={styles.compatibilitySubtitle}>Entornos desafiantes:</Text>
                    <Text style={styles.compatibilityText}>• Ambientes altamente políticos sin propósito claro</Text>
                    <Text style={styles.compatibilityText}>• Estructuras que requieren conformidad absoluta</Text>
                  </View>
                </View>

                {testConfig.premium_global?.compatibilidad?.amistades && (
                  <View style={styles.compatibilityCategory}>
                    <Text style={styles.categoryTitle}>👥 Amistades</Text>
                    <View style={styles.compatibilityList}>
                      <Text style={styles.compatibilitySubtitle}>Conexiones naturales:</Text>
                      {testConfig.premium_global.compatibilidad.amistades.facil?.map((item: string, idx: number) => (
                        <Text key={idx} style={styles.compatibilityText}>• {item}</Text>
                      ))}
                      
                      <Text style={styles.compatibilitySubtitle}>Conexiones desafiantes:</Text>
                      {testConfig.premium_global.compatibilidad.amistades.dificil?.map((item: string, idx: number) => (
                        <Text key={idx} style={styles.compatibilityText}>• {item}</Text>
                      ))}
                    </View>
                    
                    {testConfig.premium_global.compatibilidad.insights && (
                      <View style={styles.compatibilityList}>
                        <Text style={styles.compatibilitySubtitle}>Insights clave:</Text>
                        {testConfig.premium_global.compatibilidad.insights.map((insight: string, idx: number) => (
                          <Text key={idx} style={styles.insightText}>💡 {insight}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            </LockedSection>
          </View>

          {/* Behavioral Predictions - Premium Global Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Predicciones de Comportamiento</Text>
            <LockedSection
              isUnlocked={subscription.isActive}
              lockType="premium"
              onUnlockPress={() => router.push('/suscripcion')}
              sectionName="predicciones de comportamiento"
            >
              <View style={styles.predictionsSection}>
                {testConfig.premium_global?.predicciones?.map((prediction: any, idx: number) => (
                  <View key={idx} style={styles.predictionCard}>
                    <Text style={styles.scenarioTitle}>🎯 {prediction.escenario}</Text>
                    <Text style={styles.predictionText}>
                      {prediction.prediccion}
                    </Text>
                    <Text style={styles.adviceText}>
                      💡 Consejo: {prediction.consejo}
                    </Text>
                  </View>
                ))}
              </View>
            </LockedSection>
          </View>

          {/* Quotes and Reflections - Premium Global Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Citas y Reflexiones</Text>
            <LockedSection
              isUnlocked={subscription.isActive}
              lockType="premium"
              onUnlockPress={() => router.push('/suscripcion')}
              sectionName="citas y reflexiones"
            >
              <View style={styles.quotesSection}>
                {testConfig.premium_global?.citas_reflexiones?.map((quote: any, idx: number) => (
                  <View key={idx} style={styles.quoteCard}>
                    <Text style={styles.quoteTraitTitle}>{quote.rasgo.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</Text>
                    <Text style={styles.mainQuote}>"{quote.cita}"</Text>
                    <Text style={styles.reflectionText}>
                      {quote.reflexion}
                    </Text>
                  </View>
                ))}
              </View>
            </LockedSection>
          </View>

          {/* Premium Features Banner */}
          {!subscription.isActive && (
            <TouchableOpacity 
              style={styles.premiumBanner}
              onPress={() => {
                triggerHaptic();
                router.push('/suscripcion');
              }}
            >
              <LinearGradient
                colors={['#C8A951', '#E6C068']}
                style={styles.bannerGradient}
              >
                <View style={styles.bannerContent}>
                  <Crown size={24} color="#0D0D0D" strokeWidth={1.5} />
                  <View style={styles.bannerText}>
                    <Text style={styles.bannerTitle}>Desbloquea Análisis Completo</Text>
                    <Text style={styles.bannerSubtitle}>
                      Reportes detallados, comparaciones globales y recomendaciones personalizadas
                    </Text>
                  </View>
                  <Sparkles size={20} color="#0D0D0D" strokeWidth={1.5} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <View style={styles.bottomSpace} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
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
  errorContainer: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: 'Playfair-Bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#C8A951',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  retryText: {
    color: '#0D0D0D',
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: '#F5F5F5',
    fontFamily: 'Playfair-Bold',
    letterSpacing: -0.2,
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
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
  overviewSection: {
    marginBottom: 36,
  },
  resultsTitle: {
    fontSize: 28,
    color: '#FFFFFF',
    fontFamily: 'Playfair-Bold',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  archetypeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(200, 169, 81, 0.3)',
  },
  archetypeGradient: {
    padding: 24,
    alignItems: 'center',
  },
  archetypeLabel: {
    fontSize: 14,
    color: '#B3B3B3',
    fontFamily: 'Inter-Medium',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  archetypeName: {
    fontSize: 24,
    fontFamily: 'Playfair-Bold',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  archetypeDescription: {
    fontSize: 15,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  chartContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(13, 13, 13, 0.8)',
    borderWidth: 1,
    borderColor: '#1A1A1A',
    borderRadius: 20,
    padding: 24,
  },
  analysisSection: {
    marginBottom: 36,
  },
  sectionTitle: {
    fontSize: 24, 
    color: '#FFFFFF',
    fontFamily: 'Playfair-Bold',
    marginBottom: 5,
    marginTop: 30, 
    letterSpacing: -0.3,
  },
  traitSection: {
    backgroundColor: 'rgba(13, 13, 13, 0.8)',
    borderWidth: 1,
    borderColor: '#1A1A1A',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  traitHeader: {
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  traitTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  expandIndicator: {
    alignItems: 'center',
    marginTop: 8,
  },
  basicInfo: {
    marginBottom: 16,
  },
  expandedContent: {
    gap: 20,
  },
  traitTitle: {
    fontSize: 26, 
    fontFamily: 'Playfair-Bold',
    letterSpacing: -0.3,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 16,
    color: '#0D0D0D',
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.2,
  },
  bandLabel: {
    fontSize: 18.5,
    color: '#00A3FF',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  freeSummary: {
    fontSize: 16.5,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
    marginBottom: 20,
    letterSpacing: 0.1,
  },
  adUnlockContent: {
    gap: 20,
  },
  strengthsWeaknesses: {
    flexDirection: 'row',
    gap: 20,
  },
  column: {
    flex: 1,
  },
  columnTitle: {
    fontSize: 18.5,
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  listItem: {
    fontSize: 14,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  recommendations: {
    marginTop: 8,
  },
  premiumContent: {
    gap: 24,
  },
  detailText: {
    fontSize: 15, 
    color: '#FFFFFF',
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
    letterSpacing: 0.1,
    marginRight: 0,
    marginTop: 14,
  },
  premiumSection: {
    gap: 12,
  },
  alertItem: {
    fontSize: 14,
    color: '#EF4444',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  dayItem: {
    fontSize: 14,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  quoteSection: {
    backgroundColor: 'rgba(200, 169, 81, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#C8A951',
    padding: 20,
    borderRadius: 12,
  },
  quote: {
    fontSize: 16,
    color: '#C8A951',
    fontFamily: 'Playfair-SemiBold',
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  globalSection: {
    gap: 20,
  },
  section: {
    gap: 16,
  },
  globalText: {
    fontSize: 15,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  globalStats: {
    gap: 16,
  },
  globalStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    padding: 16,
    borderRadius: 12,
  },
  globalStatText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.1,
  },
  compatibilitySection: {
    gap: 24,
  },
  compatibilityCategory: {
    gap: 16,
  },
  categoryTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: 'Playfair-Bold',
    letterSpacing: -0.2,
  },
  compatibilityList: {
    gap: 12,
  },
  compatibilitySubtitle: {
    fontSize: 16,
    color: '#C8A951',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 0,
    letterSpacing: 0.1,
    marginTop: 12,
  },
  compatibilityText: {
    fontSize: 14,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 4, 
    letterSpacing: 0.1,
  },
  insightText: {
    fontSize: 14,
    color: '#00A3FF',
    fontFamily: 'Inter-Medium',
    lineHeight: 20,
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  predictionsSection: {
    gap: 20,
  },
  predictionCard: {
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  scenarioTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Playfair-SemiBold',
    letterSpacing: -0.2,
  },
  predictionText: {
    fontSize: 14,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  adviceText: {
    fontSize: 14,
    color: '#00A3FF',
    fontFamily: 'Inter-Medium',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  quotesSection: {
    gap: 20,
  },
  quoteCard: {
    backgroundColor: 'rgba(200, 169, 81, 0.08)',
    borderLeftWidth: 4,
    borderLeftColor: '#C8A951',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  quoteTraitTitle: {
    fontSize: 16,
    color: '#C8A951',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  mainQuote: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Playfair-SemiBold',
    fontStyle: 'italic',
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  reflectionText: {
    fontSize: 14,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  premiumBanner: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
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
    fontSize: 18,
    fontFamily: 'Playfair-Bold',
    color: '#0D0D0D',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: 'rgba(13, 13, 13, 0.8)',
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  bottomSpace: {
    height: 40,
  },
});