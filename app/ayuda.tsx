import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Animated, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CircleHelp as HelpCircle, ChevronDown, ChevronUp, Send, Mail } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAnalytics } from '../hooks/useAnalytics';
import Toast from '../components/Toast';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

const faqData = [
  {
    question: '¿Cómo funcionan las evaluaciones psicológicas?',
    answer: 'Nuestras evaluaciones están basadas en investigación científica y utilizan escalas psicológicas validadas. Cada pregunta está diseñada para medir aspectos específicos de la personalidad y el comportamiento.'
  },
  {
    question: '¿Son precisos los resultados?',
    answer: 'Los resultados proporcionan una aproximación basada en tus respuestas. Son herramientas de autoconocimiento, no diagnósticos clínicos. Para evaluaciones profesionales, consulta con un psicólogo.'
  },
  {
    question: '¿Qué incluye la suscripción Premium?',
    answer: 'Premium incluye reportes detallados, análisis de rasgos específicos, exportación PDF, comparaciones con otros usuarios y acceso a evaluaciones exclusivas mensuales.'
  },
  {
    question: '¿Puedo cancelar mi suscripción?',
    answer: 'Sí, puedes cancelar en cualquier momento desde la configuración de tu cuenta o desde los ajustes de suscripciones de tu dispositivo.'
  },
  {
    question: '¿Mis datos están seguros?',
    answer: 'Absolutamente. Utilizamos encriptación de extremo a extremo y tus datos se almacenan de forma segura. Nunca compartimos información personal con terceros.'
  },
];

const categories = [
  'General',
  'Suscripción',
  'Técnico',
  'Privacidad',
  'Otro'
];

export default function Ayuda() {
  const { trackEvent } = useAnalytics();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'General',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success'
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    trackEvent('perfil_click_ayuda');
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ visible: true, message, type });
  };

  const toggleFAQ = (index: number) => {
    triggerHaptic();
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const submitTicket = async () => {
    if (!ticketForm.subject.trim() || !ticketForm.message.trim()) {
      showToast('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    triggerHaptic();
    setIsSubmitting(true);
    
    try {
      // Prepare email content
      const emailSubject = `[${ticketForm.category}] ${ticketForm.subject}`;
      const emailBody = `Categoría: ${ticketForm.category}\n\nMensaje:\n${ticketForm.message}\n\n---\nEnviado desde la app de Psicología Oscura`;
      
      // Create mailto URL
      const mailtoUrl = `mailto:javisebas380@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      
      // Check if email can be opened
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        
        trackEvent('perfil_enviar_ticket_ok', {
          category: ticketForm.category,
          subject: ticketForm.subject
        });
        
        showToast('Abriendo tu app de email para enviar el ticket...', 'success');
        setTicketForm({ subject: '', category: 'General', message: '' });
      } else {
        // Fallback: copy to clipboard or show email address
        showToast('No se pudo abrir el email. Contacta a: javisebas380@gmail.com', 'error');
      }
    } catch (error) {
      console.error('Error opening email:', error);
      trackEvent('perfil_enviar_ticket_error');
      showToast('Error al abrir el email. Contacta directamente a: javisebas380@gmail.com', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <Text style={styles.headerTitle}>Ayuda y Soporte</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* FAQ Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preguntas Frecuentes</Text>
            {faqData.map((faq, index) => (
              <View key={index} style={styles.faqItem}>
                <TouchableOpacity 
                  style={styles.faqQuestion}
                  onPress={() => toggleFAQ(index)}
                >
                  <HelpCircle size={18} color="#00A3FF" strokeWidth={1.5} />
                  <Text style={styles.questionText}>{faq.question}</Text>
                  {expandedFAQ === index ? (
                    <ChevronUp size={16} color="#B3B3B3" strokeWidth={1.5} />
                  ) : (
                    <ChevronDown size={16} color="#B3B3B3" strokeWidth={1.5} />
                  )}
                </TouchableOpacity>
                
                {expandedFAQ === index && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.answerText}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Contact Form */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Enviar Ticket de Soporte</Text>
            
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Asunto *</Text>
                <TextInput
                  style={styles.textInput}
                  value={ticketForm.subject}
                  onChangeText={(text) => setTicketForm(prev => ({ ...prev, subject: text }))}
                  placeholder="Describe brevemente tu consulta"
                  placeholderTextColor="#666666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Categoría</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryButton,
                        ticketForm.category === category && styles.selectedCategory
                      ]}
                      onPress={() => {
                        triggerHaptic();
                        setTicketForm(prev => ({ ...prev, category }));
                      }}
                    >
                      <Text style={[
                        styles.categoryText,
                        ticketForm.category === category && styles.selectedCategoryText
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mensaje *</Text>
                <TextInput
                  style={[styles.textInput, styles.messageInput]}
                  value={ticketForm.message}
                  onChangeText={(text) => setTicketForm(prev => ({ ...prev, message: text }))}
                  placeholder="Describe tu consulta o problema en detalle"
                  placeholderTextColor="#666666"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity 
                style={[
                  styles.submitButton,
                  (!ticketForm.subject.trim() || !ticketForm.message.trim()) && styles.submitDisabled
                ]}
                onPress={submitTicket}
                disabled={isSubmitting || !ticketForm.subject.trim() || !ticketForm.message.trim()}
              >
                <LinearGradient
                  colors={['#00A3FF', '#0080CC']}
                  style={styles.submitGradient}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Send size={16} color="#FFFFFF" strokeWidth={1.5} />
                      <Text style={styles.submitText}>Enviar Ticket</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  content: {
    gap: 32,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'Playfair-Bold',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  faqItem: {
    backgroundColor: 'rgba(13, 13, 13, 0.6)',
    borderWidth: 1,
    borderColor: '#1A1A1A',
    borderRadius: 16,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
  },
  questionText: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.1,
  },
  faqAnswer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  answerText: {
    fontSize: 14,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
    letterSpacing: 0.1,
    paddingLeft: 34,
  },
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.2,
  },
  textInput: {
    backgroundColor: 'rgba(13, 13, 13, 0.8)',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#FFFFFF',
    fontFamily: 'Inter-Regular',
  },
  messageInput: {
    height: 100,
    paddingTop: 14,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginRight: 12,
  },
  selectedCategory: {
    backgroundColor: 'rgba(0, 163, 255, 0.2)',
    borderColor: '#00A3FF',
  },
  categoryText: {
    fontSize: 13,
    color: '#B3B3B3',
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.2,
  },
  selectedCategoryText: {
    color: '#00A3FF',
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  submitText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.2,
  },
  bottomSpace: {
    height: 40,
  },
});