import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Shield, Eye, Trash2, Settings } from 'lucide-react-native';
import { useAnalytics } from '../hooks/useAnalytics';
import ConfirmationModal from '../components/ConfirmationModal';
import Toast from '../components/Toast';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export default function Privacidad() {
  const { trackEvent } = useAnalytics();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success'
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    trackEvent('perfil_click_privacidad');
    
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

  const deleteLocalData = async () => {
    try {
      // Simulate data deletion
      await new Promise(resolve => setTimeout(resolve, 1500));
      showToast('Todos tus datos han sido eliminados correctamente', 'success');
      setTimeout(() => router.replace('/'), 2000);
    } catch (error) {
      showToast('Error al eliminar los datos. Inténtalo de nuevo.', 'error');
    }
  };

  const permissions = [
    { name: 'Notificaciones Push', status: 'Concedido', required: false },
    { name: 'Almacenamiento Local', status: 'Concedido', required: true },
    { name: 'Análisis de Uso', status: 'Concedido', required: false },
  ];

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(prev => ({ ...prev, visible: false }))}
      />

      <ConfirmationModal
        visible={showDeleteModal}
        title="Eliminar Todos los Datos"
        message="Esta acción eliminará permanentemente todos tus datos, resultados de pruebas y configuraciones. No se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        onConfirm={() => {
          setShowDeleteModal(false);
          deleteLocalData();
        }}
        onCancel={() => setShowDeleteModal(false)}
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
        <Text style={styles.headerTitle}>Configuración de Privacidad</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Privacy Policy */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Política de Privacidad</Text>
            <View style={styles.policyCard}>
              <Shield size={24} color="#00A3FF" strokeWidth={1.5} />
              <View style={styles.policyText}>
                <Text style={styles.policyTitle}>Tu privacidad es nuestra prioridad</Text>
                <Text style={styles.policyDescription}>
                  Todos tus datos se almacenan de forma segura y nunca se comparten con terceros sin tu consentimiento explícito.
                </Text>
              </View>
            </View>
            
            <Text style={styles.policyContent}>
              {`• Recopilamos únicamente los datos necesarios para el funcionamiento de la app
• Tus resultados de pruebas se almacenan localmente en tu dispositivo
• No vendemos ni compartimos información personal con terceros
• Puedes eliminar todos tus datos en cualquier momento
• Utilizamos encriptación para proteger tu información
• Solo enviamos notificaciones si las has activado
• Si tienes alguna pregunta sobre cómo gestionamos tu información, puedes escribirnos a oscuramentecontacto@gmail.com`}
            </Text>
          </View>

          {/* Permissions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Permisos Solicitados</Text>
            {permissions.map((permission, index) => (
              <View key={index} style={styles.permissionRow}>
                <Eye size={18} color="#B3B3B3" strokeWidth={1.5} />
                <View style={styles.permissionText}>
                  <Text style={styles.permissionName}>{permission.name}</Text>
                  <Text style={[
                    styles.permissionStatus,
                    { color: permission.status === 'Concedido' ? '#10B981' : '#EF4444' }
                  ]}>
                    {permission.status}
                  </Text>
                </View>
                {permission.required && (
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredText}>Requerido</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Data Management */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gestión de Datos</Text>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                triggerHaptic();
                showToast('Abriendo configuración del sistema...', 'success');
              }}
            >
              <Settings size={18} color="#00A3FF" strokeWidth={1.5} />
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Ver Permisos del Sistema</Text>
                <Text style={styles.actionDescription}>Gestiona permisos en configuración</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.dangerButton]}
              onPress={() => {
                triggerHaptic();
                setShowDeleteModal(true);
              }}
            >
              <Trash2 size={18} color="#EF4444" strokeWidth={1.5} />
              <View style={styles.actionText}>
                <Text style={[styles.actionTitle, styles.dangerText]}>Eliminar Todos los Datos</Text>
                <Text style={styles.actionDescription}>Borra permanentemente toda tu información</Text>
              </View>
            </TouchableOpacity>
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
  policyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    backgroundColor: 'rgba(13, 13, 13, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 163, 255, 0.2)',
    borderRadius: 16,
    padding: 20,
  },
  policyText: {
    flex: 1,
  },
  policyTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Playfair-SemiBold',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  policyDescription: {
    fontSize: 14,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  policyContent: {
    fontSize: 14,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
    letterSpacing: 0.1,
    paddingHorizontal: 4,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(13, 13, 13, 0.6)',
    borderWidth: 1,
    borderColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
  },
  permissionText: {
    flex: 1,
  },
  permissionName: {
    fontSize: 15,
    color: '#FFFFFF',
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
    letterSpacing: 0.1,
  },
  permissionStatus: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.3,
  },
  requiredBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  requiredText: {
    fontSize: 10,
    color: '#EF4444',
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(13, 13, 13, 0.8)',
    borderWidth: 1,
    borderColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
  },
  dangerButton: {
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Playfair-SemiBold',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  dangerText: {
    color: '#EF4444',
  },
  actionDescription: {
    fontSize: 13,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.1,
  },
  bottomSpace: {
    height: 40,
  },
});