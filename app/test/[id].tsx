import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import testsData from '../../data/tests.json';
import OptionItem from '../../components/OptionItem';
import { useAnalytics } from '../../hooks/useAnalytics';
import Toast from '../../components/Toast';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export default function TestQuestions() {
  const { id } = useLocalSearchParams();
  const { trackEvent } = useAnalytics();
  
  const [testData, setTestData] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success'
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadTestData();
  }, [id]);

  useEffect(() => {
    if (!isLoading && testData) {
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
    }
  }, [isLoading, testData]);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ visible: true, message, type });
  };

  const loadTestData = async () => {
    try {
      const test = testsData[id as keyof typeof testsData];
      if (!test) {
        showToast('Test no encontrado', 'error');
        setTimeout(() => router.replace('/'), 2000);
        return;
      }

      if (!test.preguntas || test.preguntas.length === 0) {
        showToast('Test inválido: sin preguntas', 'error');
        setTimeout(() => router.replace('/'), 2000);
        return;
      }

      setTestData(test);
      
      // Load saved answers
      const savedAnswers = await AsyncStorage.getItem(`test_${id}_answers`);
      if (savedAnswers) {
        setAnswers(JSON.parse(savedAnswers));
      }

      trackEvent('test_start', { testId: id });
    } catch (error) {
      console.error('Error loading test data:', error);
      showToast('Error al cargar el test', 'error');
      setTimeout(() => router.replace('/'), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAnswers = async (newAnswers: { [key: number]: number }) => {
    try {
      await AsyncStorage.setItem(`test_${id}_answers`, JSON.stringify(newAnswers));
    } catch (error) {
      console.error('Error saving answers:', error);
    }
  };

  const handleAnswer = (optionIndex: number) => {
    triggerHaptic();
    const newAnswers = { ...answers, [currentQuestion]: optionIndex };
    setAnswers(newAnswers);
    saveAnswers(newAnswers);
  };

  const goToNext = () => {
    triggerHaptic();
    if (currentQuestion < testData.preguntas.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishTest();
    }
  };

  const goToPrevious = () => {
    triggerHaptic();
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateResults = () => {
    const traits: { [key: string]: number[] } = {};
    
    // Group scores by trait
    testData.preguntas.forEach((question: any, index: number) => {
      const answer = answers[index];
      if (answer !== undefined) {
        const score = question.reverse ? 3 - answer : answer;
        
        if (!traits[question.rasgo]) {
          traits[question.rasgo] = [];
        }
        traits[question.rasgo].push(score);
      }
    });

    // Calculate percentages for each trait
    const results: { [key: string]: number } = {};
    Object.keys(traits).forEach(trait => {
      const scores = traits[trait];
      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      results[trait] = Math.round((average / 3) * 100);
    });

    return results;
  };

  const finishTest = async () => {
    setIsSubmitting(true);
    
    try {
      const results = calculateResults();
      
      // Save results
      await AsyncStorage.setItem(`test_${id}_results`, JSON.stringify(results));
      
      // Clear temporary answers
      await AsyncStorage.removeItem(`test_${id}_answers`);
      
      trackEvent('test_complete', { testId: id, results });
      
      // Navigate to results
      router.replace(`/results/${id}`);
    } catch (error) {
      console.error('Error finishing test:', error);
      showToast('Error al procesar resultados', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAccentColor = () => {
    if (!testData) return '#C8A951';
    
    switch (testData.nivel) {
      case 'avanzado': return '#C8A951';
      case 'intermedio': return '#1E3A8A';
      case 'basico': return '#6B7280';
      default: return '#C8A951';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C8A951" />
        <Text style={styles.loadingText}>Cargando test...</Text>
      </View>
    );
  }

  if (!testData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Test No Encontrado</Text>
        <Text style={styles.errorMessage}>El test solicitado no existe o no está disponible</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.retryText}>Volver al Inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQuestionData = testData.preguntas[currentQuestion];
  const progress = ((currentQuestion + 1) / testData.preguntas.length) * 100;
  const isAnswered = answers[currentQuestion] !== undefined;
  const isLastQuestion = currentQuestion === testData.preguntas.length - 1;
  const accentColor = getAccentColor();

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
        <Text style={styles.headerTitle}>{testData.titulo}</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <Animated.View 
              style={[
                styles.progressFill,
                { 
                  width: `${progress}%`,
                  backgroundColor: accentColor,
                }
              ]} 
            />
          </View>
        </View>
        <Text style={styles.progressText}>
          Pregunta {currentQuestion + 1} de {testData.preguntas.length}
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Question */}
          <View style={styles.questionSection}>
            <Text style={styles.questionText}>{currentQuestionData.texto}</Text>
          </View>

          {/* Options */}
          <View style={styles.optionsSection}>
            {currentQuestionData.opciones.map((option: string, index: number) => (
              <OptionItem
                key={index}
                option={option}
                index={index}
                isSelected={answers[currentQuestion] === index}
                onSelect={handleAnswer}
                currentQuestion={currentQuestion}
                accentColor={accentColor}
              />
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigationSection}>
        <TouchableOpacity 
          style={[
            styles.navButton,
            currentQuestion === 0 && styles.navButtonDisabled
          ]}
          onPress={goToPrevious}
          disabled={currentQuestion === 0}
        >
          <ArrowLeft size={16} color={currentQuestion === 0 ? "#666666" : "#F5F5F5"} strokeWidth={1.5} />
          <Text style={[
            styles.navButtonText,
            currentQuestion === 0 && styles.navButtonTextDisabled
          ]}>
            Anterior
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.nextButton,
            !isAnswered && styles.nextButtonDisabled,
            { backgroundColor: isAnswered ? accentColor : '#2A2A2A' }
          ]}
          onPress={goToNext}
          disabled={!isAnswered || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={[
                styles.nextButtonText,
                !isAnswered && styles.nextButtonTextDisabled
              ]}>
                {isLastQuestion ? 'Finalizar' : 'Siguiente'}
              </Text>
              {isLastQuestion ? (
                <Check size={16} color={isAnswered ? "#FFFFFF" : "#666666"} strokeWidth={1.5} />
              ) : (
                <ArrowRight size={16} color={isAnswered ? "#FFFFFF" : "#666666"} strokeWidth={1.5} />
              )}
            </>
          )}
        </TouchableOpacity>
      </View>
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
  },
  errorMessage: {
    fontSize: 16,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 32,
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
    paddingBottom: 20,
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
  progressSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 12,
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#1A1A1A',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBackground: {
    flex: 1,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 13,
    color: '#B3B3B3',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  content: {
    gap: 32,
  },
  questionSection: {
    backgroundColor: 'rgba(13, 13, 13, 0.8)',
    borderWidth: 1,
    borderColor: '#1A1A1A',
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  questionText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'Playfair-SemiBold',
    textAlign: 'center',
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  optionsSection: {
    gap: 16,
  },
  navigationSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 40,
    gap: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    minWidth: 44,
    minHeight: 44,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 15,
    color: '#F5F5F5',
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.2,
  },
  navButtonTextDisabled: {
    color: '#666666',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    minWidth: 44,
    minHeight: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.2,
  },
  nextButtonTextDisabled: {
    color: '#666666',
  },
});