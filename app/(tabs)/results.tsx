import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Award, TrendingUp, Sparkles, Star, Calendar, Share, Crown, Brain, Target } from 'lucide-react-native';
import { useFocusEffect, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ResultCard from '../../components/ResultCard';
import { useSubscription } from '../../hooks/useSubscription';
import { useTranslation } from '../../hooks/useTranslation';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

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

interface TestResult {
  id: string;
  testName: string;
  archetype: string;
  score: number;
  date: string;
  isPremium: boolean;
  results: { [key: string]: number };
}

export default function Results() {
  const { t } = useTranslation();
  const { subscription } = useSubscription();
  const [completedTests, setCompletedTests] = useState<TestResult[]>([]);
  const [averageScore, setAverageScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const loadCompletedTests = async () => {
    try {
      setIsLoading(true);
      const allKeys = await AsyncStorage.getAllKeys();
      const resultKeys = allKeys.filter(key => key.includes('_results') && !key.includes('_answers'));
      
      const testResults: TestResult[] = [];
      let totalScore = 0;
      let scoreCount = 0;

      for (const key of resultKeys) {
        try {
          const testId = key.replace('test_', '').replace('_results', '');
          const resultsData = await AsyncStorage.getItem(key);
          
          if (resultsData) {
            const results = JSON.parse(resultsData);
            const testConfig = testConfigMap[testId as keyof typeof testConfigMap];
            
            if (testConfig) {
              // Calculate average score for this test
              const scores = Object.values(results) as number[];
              const testAverage = scores.reduce((sum, score) => sum + score, 0) / scores.length;
              
              // Find dominant trait
              const dominantTrait = Object.keys(results).reduce((a, b) => 
                results[a] > results[b] ? a : b
              );
              
              // Get archetype for dominant trait
              const archetype = testConfig.arquetipos?.find((arch: any) => arch.clave === dominantTrait);
              
              // Get completion date (use current date as fallback)
              const completionDate = new Date().toISOString().split('T')[0];
              
              // Determine if test is premium based on level
              const isPremium = testConfig.nivel === 'avanzado';
              
              testResults.push({
                id: testId,
                testName: testConfig.titulo,
                archetype: archetype?.label || 'Resultado',
                score: Math.round(testAverage),
                date: completionDate,
                isPremium,
                results
              });
              
              totalScore += testAverage;
              scoreCount++;
            }
          }
        } catch (error) {
          console.error(`Error processing test ${key}:`, error);
        }
      }

      // Sort by date (most recent first) and take last 5
      testResults.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const recentTests = testResults.slice(0, 5);
      
      setCompletedTests(recentTests);
      setAverageScore(scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0);
      
    } catch (error) {
      console.error('Error loading completed tests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCompletedTests();
    }, [])
  );

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

  const getPremiumBannerText = () => {
    const testCount = completedTests.length;
    
    if (testCount === 0) {
      return {
        title: 'Desbloquea Análisis Premium',
        subtitle: 'Reportes detallados y características exclusivas'
      };
    } else if (testCount <= 2) {
      return {
        title: 'Descubre Comparaciones Globales',
        subtitle: 'Gráficos detallados y análisis avanzados en Premium'
      };
    } else {
      return {
        title: 'Ya has avanzado mucho',
        subtitle: 'Desbloquea tu perfil Premium para análisis avanzados'
      };
    }
  };

  const renderProgressBar = (score: number, color: string) => (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressBarBackground}>
        <View 
          style={[
            styles.progressBarFill, 
            { 
              width: `${score}%`,
              backgroundColor: color 
            }
          ]} 
        />
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <Animated.View 
      style={[
        styles.emptyStateContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <View style={styles.emptyIconContainer}>
        <Brain size={48} color="#C8A951" strokeWidth={1.5} />
      </View>
      
      <Text style={styles.emptyTitle}>Aún no has completado pruebas</Text>
      <Text style={styles.emptySubtitle}>
        ¡Empieza ahora tu primer test y descubre tus resultados!
      </Text>
      
      <TouchableOpacity 
        style={styles.emptyCtaButton}
        onPress={() => {
          triggerHaptic();
          router.push('/(tabs)');
        }}
      >
        <LinearGradient
          colors={['#C8A951', '#E6C068']}
          style={styles.emptyCtaGradient}
        >
          <Target size={18} color="#0D0D0D" strokeWidth={1.5} />
          <Text style={styles.emptyCtaText}>Explorar Tests</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C8A951" />
        <Text style={styles.loadingText}>Cargando historial...</Text>
      </View>
    );
  }

  // Show empty state if no tests completed
  if (completedTests.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.backgroundTexture} />
        
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <Text style={styles.titleText}>{t('assessment_history')}</Text>
          <Text style={styles.subtitleText}>{t('journey_subtitle')}</Text>
        </Animated.View>

        {renderEmptyState()}
      </View>
    );
  }

  const bannerText = getPremiumBannerText();

  return (
    <View style={styles.container}>
      {/* Background Texture */}
      <View style={styles.backgroundTexture} />
      
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Text style={styles.titleText}>{t('assessment_history')}</Text>
        <Text style={styles.subtitleText}>{t('journey_subtitle')}</Text>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View 
          style={[
            styles.statsContainer,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(0, 163, 255, 0.1)', 'rgba(0, 163, 255, 0.05)']}
              style={styles.statGradient}
            >
              <TrendingUp size={24} color="#00A3FF" strokeWidth={1.5} />
              <Text style={styles.statValue}>{averageScore}%</Text>
              <Text style={styles.statLabel}>{t('average_score')}</Text>
              {renderProgressBar(averageScore, '#00A3FF')}
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(200, 169, 81, 0.1)', 'rgba(200, 169, 81, 0.05)']}
              style={styles.statGradient}
            >
              <Award size={24} color="#C8A951" strokeWidth={1.5} />
              <Text style={styles.statValue}>{completedTests.length}</Text>
              <Text style={styles.statLabel}>{t('tests_completed')}</Text>
            </LinearGradient>
          </View>
        </Animated.View>

        <Text style={styles.sectionTitle}>{t('recent_assessments')}</Text>
        
        <View style={styles.resultsContainer}>
          {completedTests.map((result, index) => (
            <TouchableOpacity
              key={`${result.id}-${result.date}`}
              style={[
                styles.resultCard,
                result.isPremium && styles.premiumResultCard
              ]}
              activeOpacity={0.85}
              onPress={() => {
                triggerHaptic();
                router.push(`/results/${result.id}`);
              }}
            >
              {result.isPremium && (
                <LinearGradient
                  colors={['rgba(200, 169, 81, 0.08)', 'rgba(200, 169, 81, 0.03)', 'transparent']}
                  style={styles.premiumCardGlow}
                />
              )}
              
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View style={styles.testInfo}>
                    <Text style={styles.testName}>{result.testName}</Text>
                    <Text style={[
                      styles.archetype,
                      result.isPremium && styles.premiumArchetype
                    ]}>{result.archetype}</Text>
                  </View>
                  {result.isPremium && (
                    <View style={styles.premiumBadge}>
                      <LinearGradient
                        colors={['#C8A951', '#E6C068']}
                        style={styles.premiumIndicator}
                      >
                        <Crown size={14} color="#0D0D0D" strokeWidth={1.5} />
                      </LinearGradient>
                    </View>
                  )}
                </View>

                <View style={styles.scoreSection}>
                  <View style={[
                    styles.scoreContainer, 
                    { borderColor: result.score >= 80 ? '#00A3FF' : result.score >= 60 ? '#C8A951' : '#B3B3B3' },
                    result.isPremium && styles.premiumScoreContainer
                  ]}>
                    <LinearGradient
                      colors={result.isPremium ? 
                        ['rgba(200, 169, 81, 0.1)', 'transparent'] : 
                        ['rgba(0, 163, 255, 0.05)', 'transparent']
                      }
                      style={styles.scoreGradient}
                    />
                    <Text style={[
                      styles.scoreText, 
                      { color: result.score >= 80 ? '#00A3FF' : result.score >= 60 ? '#C8A951' : '#B3B3B3' }
                    ]}>
                      {result.score}%
                    </Text>
                  </View>
                  
                  {/* Mini progress bar */}
                  <View style={styles.miniProgressContainer}>
                    {renderProgressBar(result.score, result.score >= 80 ? '#00A3FF' : result.score >= 60 ? '#C8A951' : '#B3B3B3')}
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.dateContainer}>
                    <Calendar size={12} color="#666666" strokeWidth={1.5} />
                    <Text style={styles.date}>{result.date}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.shareButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      triggerHaptic();
                      // Share functionality
                    }}
                  >
                    <Share size={14} color="#00A3FF" strokeWidth={1.5} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Premium Banner - Only show if not premium */}
        {!subscription.isActive && (
          <TouchableOpacity 
            style={styles.premiumButton}
            onPress={() => {
              triggerHaptic();
              router.push('/suscripcion');
            }}
          >
            <LinearGradient
              colors={['#C8A951', '#E6C068', '#C8A951']}
              style={styles.premiumGradient}
            >
              <View style={styles.premiumContent}>
                <Sparkles size={20} color="#0D0D0D" strokeWidth={1.5} />
                <View style={styles.premiumText}>
                  <Text style={styles.premiumTitle}>{bannerText.title}</Text>
                  <Text style={styles.premiumSubtitle}>{bannerText.subtitle}</Text>
                </View>
                <Star size={16} color="#0D0D0D" strokeWidth={1.5} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

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
    backgroundColor: '#0D0D0D',
    opacity: 0.4,
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
  header: {
    paddingTop: 70,
    paddingHorizontal: 28,
    paddingBottom: 36,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 32,
    color: '#F5F5F5',
    fontFamily: 'Playfair-Bold',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 15,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 36,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1A1A1A',
    backgroundColor: '#0D0D0D',
  },
  statGradient: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'Playfair-Bold',
    color: '#F5F5F5',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#B3B3B3',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressBarContainer: {
    width: '100%',
    marginTop: 8,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 22,
    color: '#F5F5F5',
    fontFamily: 'Playfair-Bold',
    marginBottom: 24,
    letterSpacing: -0.3,
  },
  resultsContainer: {
    gap: 16,
    marginBottom: 36,
  },
  resultCard: {
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    borderColor: '#1A1A1A',
    borderRadius: 18,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  premiumResultCard: {
    borderColor: 'rgba(200, 169, 81, 0.25)',
  },
  premiumCardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardContent: {
    padding: 20,
    position: 'relative',
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    fontSize: 16,
    color: '#F5F5F5',
    fontFamily: 'Playfair-SemiBold',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  archetype: {
    fontSize: 14,
    color: '#00A3FF',
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.2,
  },
  premiumArchetype: {
    color: '#C8A951',
  },
  premiumBadge: {
    marginLeft: 12,
  },
  premiumIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  scoreContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D0D0D',
    position: 'relative',
    overflow: 'hidden',
  },
  premiumScoreContainer: {
    shadowColor: '#C8A951',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scoreText: {
    fontSize: 18,
    fontFamily: 'Playfair-Bold',
    letterSpacing: -0.5,
    zIndex: 1,
  },
  miniProgressContainer: {
    width: 100,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  date: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.3,
  },
  shareButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 163, 255, 0.1)',
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(200, 169, 81, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(200, 169, 81, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  emptyTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: 'Playfair-Bold',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    letterSpacing: 0.1,
  },
  emptyCtaButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#C8A951',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  emptyCtaText: {
    fontSize: 16,
    color: '#0D0D0D',
    fontFamily: 'Playfair-Bold',
    letterSpacing: -0.2,
  },
  premiumButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#C8A951',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  premiumGradient: {
    padding: 24,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  premiumText: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 18,
    fontFamily: 'Playfair-Bold',
    color: '#0D0D0D',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  premiumSubtitle: {
    fontSize: 13,
    color: 'rgba(13, 13, 13, 0.8)',
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.2,
  },
  bottomSpace: {
    height: 40,
  },
});