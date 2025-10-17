import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, XCircle, Info } from 'lucide-react-native';
import {
  getDebugInfo,
  loadOfferings,
  getProducts,
  getCustomerInfo,
  REVENUECAT_API_KEY,
  IS_DEV_REVENUECAT
} from '../src/config/revenuecatConfig';

export default function RevenueCatDebugScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [offerings, setOfferings] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [customerInfo, setCustomerInfo] = useState<any>(null);

  useEffect(() => {
    loadDebugData();
  }, []);

  const loadDebugData = async () => {
    setLoading(true);

    // Get debug info
    const info = getDebugInfo();
    setDebugInfo(info);

    // Load offerings
    const offeringsData = await loadOfferings();
    setOfferings(offeringsData);

    // Get products
    const productsData = await getProducts(['psico_weekly_399', 'psico_annual_2499']);
    setProducts(productsData);

    // Get customer info
    const customerData = await getCustomerInfo();
    setCustomerInfo(customerData);

    setLoading(false);
  };

  const handleBack = () => {
    router.back();
  };

  const renderSection = (title: string, data: any, isSuccess?: boolean) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {isSuccess !== undefined && (
          isSuccess ?
            <CheckCircle size={20} color="#4CAF50" /> :
            <XCircle size={20} color="#F44336" />
        )}
      </View>
      <View style={styles.dataContainer}>
        <Text style={styles.dataText}>
          {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>RevenueCat Debug</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Environment Badge */}
        <View style={[styles.badge, IS_DEV_REVENUECAT ? styles.badgeDev : styles.badgeProd]}>
          <Info size={16} color="#FFFFFF" />
          <Text style={styles.badgeText}>
            {IS_DEV_REVENUECAT ? 'DEVELOPMENT MODE' : 'PRODUCTION MODE'}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#BB86FC" />
            <Text style={styles.loadingText}>Cargando información de RevenueCat...</Text>
          </View>
        ) : (
          <>
            {/* Debug Info */}
            {renderSection('Configuración', debugInfo, !!REVENUECAT_API_KEY)}

            {/* API Key */}
            {renderSection(
              'API Key',
              {
                prefix: REVENUECAT_API_KEY ? REVENUECAT_API_KEY.slice(0, 15) + '...' : 'NOT CONFIGURED',
                configured: !!REVENUECAT_API_KEY
              },
              !!REVENUECAT_API_KEY
            )}

            {/* Offerings */}
            {renderSection(
              'Offerings',
              offerings ? {
                current: offerings.current?.identifier || 'none',
                availablePackages: offerings.current?.availablePackages?.length || 0,
                allOfferings: Object.keys(offerings.all || {}).length
              } : 'No offerings available',
              !!offerings?.current
            )}

            {/* Products */}
            {renderSection(
              'Products',
              products.length > 0 ?
                products.map(p => ({
                  id: p.identifier,
                  title: p.title,
                  price: p.priceString
                })) :
                'No products found',
              products.length > 0
            )}

            {/* Customer Info */}
            {renderSection(
              'Customer Info',
              customerInfo ? {
                hasActiveEntitlements: Object.keys(customerInfo.entitlements?.active || {}).length > 0,
                activeEntitlements: Object.keys(customerInfo.entitlements?.active || {}),
                originalAppUserId: customerInfo.originalAppUserId
              } : 'No customer info available',
              !!customerInfo
            )}

            {/* Refresh Button */}
            <TouchableOpacity style={styles.refreshButton} onPress={loadDebugData}>
              <Text style={styles.refreshButtonText}>Recargar Información</Text>
            </TouchableOpacity>

            {/* Instructions */}
            <View style={styles.instructions}>
              <Text style={styles.instructionsTitle}>💡 Instrucciones</Text>
              <Text style={styles.instructionsText}>
                • En DEVELOPMENT: se usa la key de desarrollo (proyecto RevenueCat separado){'\n'}
                • En PRODUCTION: se usa la key de producción (proyecto RevenueCat principal){'\n'}
                • Para cambiar el entorno, modifica EXPO_PUBLIC_APP_ENV en .env o EAS Secrets{'\n'}
                • Si API Key muestra "NOT CONFIGURED", verifica tus variables de entorno
              </Text>
            </View>
          </>
        )}
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  badgeDev: {
    backgroundColor: '#FF9800',
  },
  badgeProd: {
    backgroundColor: '#4CAF50',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#999',
    fontSize: 16,
    marginTop: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#BB86FC',
  },
  dataContainer: {
    backgroundColor: '#0D0D0D',
    borderRadius: 8,
    padding: 12,
  },
  dataText: {
    color: '#E0E0E0',
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  refreshButton: {
    backgroundColor: '#BB86FC',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  refreshButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  instructions: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BB86FC',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#BB86FC',
    marginBottom: 12,
  },
  instructionsText: {
    color: '#E0E0E0',
    fontSize: 14,
    lineHeight: 22,
  },
});
