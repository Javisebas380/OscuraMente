import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ArrowLeft, FileText, Scale, Shield } from 'lucide-react-native';
import { useAnalytics } from '../hooks/useAnalytics';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export default function Terminos() {
  const { trackEvent } = useAnalytics();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    trackEvent('terminos_screen_view');

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

  const sections = [
    {
      icon: FileText,
      title: 'Aceptación de los Términos',
      content: 'Por favor, lee atentamente estos términos antes de usar la aplicación. Tu uso continuo de OscuraMente constituye tu aceptación de estos términos. Al usar OscuraMente, aceptas estar legalmente vinculado por estos Términos de Servicio. Si no estás de acuerdo, no uses la aplicación.'
    },
    {
      icon: Shield,
      title: 'Naturaleza del Servicio',
      content: 'Esta aplicación es educativa y NO sustituye servicios profesionales de salud mental. Los resultados son para autoconocimiento únicamente.'
    },
    {
      icon: Scale,
      title: 'Suscripciones',
      content: 'La suscripción se renueva automáticamente, salvo que se cancele al menos 24 horas antes del final del período en curso. El usuario puede gestionar o cancelar su suscripción en cualquier momento desde la configuración de su cuenta.'
    }
  ];

  return (
    <View style={styles.container}>
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
        <Text style={styles.headerTitle}>Términos de Servicio</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.introSection}>
            <Text style={styles.introTitle}>Términos y Condiciones</Text>
            <Text style={styles.introText}>
              Por favor, lee atentamente estos términos antes de usar la aplicación. Tu uso continuo de OscuraMente constituye tu aceptación de estos términos.
            </Text>
          </View>

          {sections.map((section, index) => (
            <View key={index} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.iconContainer}>
                  <section.icon size={20} color="#00A3FF" strokeWidth={1.5} />
                </View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              <Text style={styles.sectionContent}>{section.content}</Text>
            </View>
          ))}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Licencia de Uso</Text>
            <Text style={styles.sectionContent}>
              Te otorgamos una licencia limitada, no exclusiva, no transferible y revocable para usar la aplicación en tu dispositivo personal.
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• No puedes copiar o modificar la aplicación</Text>
              <Text style={styles.bulletItem}>• No puedes usar la app para propósitos ilegales</Text>
              <Text style={styles.bulletItem}>• No puedes revender el contenido</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suscripciones Premium</Text>
            <Text style={styles.sectionContent}>
              Ofrecemos planes de suscripción con renovación automática:
            </Text>
            <View style={styles.priceList}>
              <View style={styles.priceItem}>
                <Text style={styles.priceLabel}>Semanal:</Text>
                <Text style={styles.priceValue}>$3.99 USD/semana</Text>
              </View>
              <View style={styles.priceItem}>
                <Text style={styles.priceLabel}>Anual:</Text>
                <Text style={styles.priceValue}>$24.99 USD/año</Text>
              </View>
            </View>
            <Text style={styles.sectionContent}>
              La suscripción se renueva automáticamente, salvo que se cancele al menos 24 horas antes del final del período en curso.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cancelación</Text>
            <Text style={styles.sectionContent}>
              Puedes cancelar tu suscripción en cualquier momento:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• iOS: Configuración → Suscripciones</Text>
              <Text style={styles.bulletItem}>• Android: Google Play Store → Suscripciones</Text>
            </View>
            <Text style={styles.sectionContent}>
              La cancelación será efectiva al final del período de facturación actual.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Limitación de Responsabilidad</Text>
            <Text style={styles.sectionContent}>
              Los tests y análisis son para propósitos educativos. NO deben usarse para diagnóstico médico, decisiones laborales o evaluaciones legales.
            </Text>
            <View style={styles.warningBox}>
              <Shield size={18} color="#EF4444" strokeWidth={1.5} />
              <Text style={styles.warningText}>
                Esta app NO es un servicio de salud mental profesional. Si experimentas problemas de salud mental, consulta a un profesional calificado.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacidad</Text>
            <Text style={styles.sectionContent}>
              Tu privacidad es importante. Consulta nuestra Política de Privacidad para conocer cómo recopilamos, usamos y protegemos tu información.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cambios a los Términos</Text>
            <Text style={styles.sectionContent}>
              Nos reservamos el derecho de modificar estos términos en cualquier momento. Te notificaremos sobre cambios importantes mediante la aplicación.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contacto</Text>
            <Text style={styles.sectionContent}>
              Para preguntas sobre estos términos, contáctanos desde la sección de Ayuda en la aplicación.
            </Text>
          </View>

          <View style={styles.footerSection}>
            <Text style={styles.footerText}>
              Al usar Psicología Oscura, reconoces que has leído estos términos, los entiendes y aceptas estar legalmente vinculado por ellos.
            </Text>
            <Text style={styles.footerDate}>Última actualización: Enero 2025</Text>
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
    gap: 24,
  },
  introSection: {
    backgroundColor: 'rgba(13, 13, 13, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 163, 255, 0.2)',
    borderRadius: 16,
    padding: 24,
  },
  introTitle: {
    fontSize: 22,
    color: '#FFFFFF',
    fontFamily: 'Playfair-Bold',
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  introText: {
    fontSize: 14,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 163, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 163, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Playfair-Bold',
    letterSpacing: -0.3,
  },
  sectionContent: {
    fontSize: 14,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  bulletList: {
    gap: 8,
    paddingLeft: 8,
  },
  bulletItem: {
    fontSize: 14,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  priceList: {
    gap: 8,
    paddingVertical: 8,
  },
  priceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.1,
  },
  priceValue: {
    fontSize: 14,
    color: '#C8A951',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.1,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#EF4444',
    fontFamily: 'Inter-Medium',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  footerSection: {
    backgroundColor: 'rgba(13, 13, 13, 0.6)',
    borderWidth: 1,
    borderColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    marginTop: 16,
  },
  footerText: {
    fontSize: 13,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  footerDate: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  bottomSpace: {
    height: 40,
  },
});
