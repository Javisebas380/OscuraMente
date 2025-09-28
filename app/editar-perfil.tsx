import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Animated } from 'react-native';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, User, Mail, Save, Camera } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAnalytics } from '../hooks/useAnalytics';
import Toast from '../components/Toast';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export default function EditarPerfil() {
  const { trackEvent } = useAnalytics();
  const [profile, setProfile] = useState({
    name: 'Explorador de Psicología',
    email: 'explorador@psicoscura.app',
    alias: 'Explorador'
  });
  const [isEdited, setIsEdited] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success'
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    trackEvent('perfil_click_editar');
    
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

  const handleInputChange = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setIsEdited(true);
  };

  const saveProfile = async () => {
    triggerHaptic();
    setIsSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      trackEvent('perfil_guardar_ok');
      showToast('Perfil actualizado correctamente', 'success');
      setIsEdited(false);
      setTimeout(() => router.back(), 1500);
    } catch (error) {
      trackEvent('perfil_guardar_error');
      showToast('Error al guardar el perfil. Inténtalo de nuevo.', 'error');
    } finally {
      setIsSaving(false);
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
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <TouchableOpacity 
          style={[styles.saveButton, !isEdited && styles.saveDisabled]}
          onPress={saveProfile}
          disabled={!isEdited || isSaving}
        >
          <Save size={18} color={isEdited ? "#00A3FF" : "#666666"} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['rgba(0, 163, 255, 0.2)', 'rgba(0, 163, 255, 0.1)']}
                style={styles.avatarGradient}
              >
                <User size={40} color="#F5F5F5" strokeWidth={1.5} />
              </LinearGradient>
            </View>
            <TouchableOpacity 
              style={styles.changeAvatarButton}
              onPress={() => {
                triggerHaptic();
                showToast('Función de cambio de avatar próximamente', 'success');
              }}
            >
              <Camera size={14} color="#00A3FF" strokeWidth={1.5} />
              <Text style={styles.changeAvatarText}>Cambiar Foto</Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre Completo</Text>
              <TextInput
                style={styles.textInput}
                value={profile.name}
                onChangeText={(text) => handleInputChange('name', text)}
                placeholder="Tu nombre completo"
                placeholderTextColor="#666666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Alias / Apodo</Text>
              <TextInput
                style={styles.textInput}
                value={profile.alias}
                onChangeText={(text) => handleInputChange('alias', text)}
                placeholder="Cómo quieres que te llamemos"
                placeholderTextColor="#666666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Correo Electrónico</Text>
              <TextInput
                style={[styles.textInput, styles.readOnlyInput]}
                value={profile.email}
                editable={false}
                placeholder="tu@email.com"
                placeholderTextColor="#666666"
              />
              <Text style={styles.readOnlyText}>
                El correo no se puede modificar por seguridad
              </Text>
            </View>
          </View>

          {/* Save Button */}
          {isEdited && (
            <TouchableOpacity 
              style={styles.saveProfileButton}
              onPress={saveProfile}
              disabled={isSaving}
            >
              <LinearGradient
                colors={['#00A3FF', '#0080CC']}
                style={styles.saveGradient}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Save size={16} color="#FFFFFF" strokeWidth={1.5} />
                    <Text style={styles.saveText}>Guardar Cambios</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
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
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveDisabled: {
    opacity: 0.5,
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
  avatarSection: {
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    borderRadius: 50,
    overflow: 'hidden',
  },
  avatarGradient: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 163, 255, 0.3)',
  },
  changeAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 163, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 163, 255, 0.3)',
    borderRadius: 20,
  },
  changeAvatarText: {
    fontSize: 13,
    color: '#00A3FF',
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.2,
  },
  formSection: {
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
  readOnlyInput: {
    backgroundColor: 'rgba(26, 26, 26, 0.5)',
    borderColor: '#1A1A1A',
    color: '#B3B3B3',
  },
  readOnlyText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.1,
    marginTop: 4,
  },
  saveProfileButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  saveText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.2,
  },
  bottomSpace: {
    height: 40,
  },
});