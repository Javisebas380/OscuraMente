import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { ChevronDown, ChevronUp, RefreshCw, Info } from 'lucide-react-native';
import { useSubscriptionContext } from '../src/contexts/SubscriptionContext';
import { getAppEnvironment, getRevenueCatKeyType, isValidRevenueCatKey } from '../src/utils/environment';

export function SubscriptionDebugPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const context = useSubscriptionContext();
  const appEnv = getAppEnvironment();

  if (!__DEV__) {
    return null;
  }

  const iosKey = appEnv === 'production'
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY_PROD
    : process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY_DEV;

  const androidKey = appEnv === 'production'
    ? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY_PROD
    : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY_DEV;

  const currentKey = Platform.OS === 'ios' ? iosKey : androidKey;
  const keyType = getRevenueCatKeyType(currentKey);
  const isValid = isValidRevenueCatKey(currentKey);

  const getStatusColor = () => {
    if (context.error) return '#FF6B6B';
    if (context.initializing) return '#FFA500';
    if (context.isActive) return '#4CAF50';
    return '#666666';
  };

  const getStatusText = () => {
    if (context.error) return 'ERROR';
    if (context.initializing) return 'INITIALIZING';
    if (context.isActive) return 'ACTIVE';
    return 'INACTIVE';
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.header, { backgroundColor: getStatusColor() }]}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.8}
      >
        <View style={styles.headerLeft}>
          <Info size={16} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.headerTitle}>RevenueCat Debug</Text>
          <View style={[styles.statusBadge, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>
        {isExpanded ? (
          <ChevronUp size={20} color="#FFFFFF" strokeWidth={2} />
        ) : (
          <ChevronDown size={20} color="#FFFFFF" strokeWidth={2} />
        )}
      </TouchableOpacity>

      {isExpanded && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Environment</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Platform:</Text>
              <Text style={styles.value}>{Platform.OS}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>App Env:</Text>
              <Text style={styles.value}>{appEnv}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Key Type:</Text>
              <Text style={[styles.value, { color: keyType === 'production' ? '#4CAF50' : '#FFA500' }]}>
                {keyType.toUpperCase()}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Key Valid:</Text>
              <Text style={[styles.value, { color: isValid ? '#4CAF50' : '#FF6B6B' }]}>
                {isValid ? '✅ YES' : '❌ NO'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Key Preview:</Text>
              <Text style={styles.valueSmall}>
                {currentKey ? `${currentKey.substring(0, 15)}...` : 'NOT SET'}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Initializing:</Text>
              <Text style={styles.value}>{context.initializing ? 'YES' : 'NO'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Loading:</Text>
              <Text style={styles.value}>{context.loading ? 'YES' : 'NO'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Is Active:</Text>
              <Text style={[styles.value, { color: context.isActive ? '#4CAF50' : '#666666' }]}>
                {context.isActive ? 'YES' : 'NO'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Error:</Text>
              <Text style={[styles.value, { color: context.error ? '#FF6B6B' : '#666666' }]}>
                {context.error || 'None'}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Offering</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Available:</Text>
              <Text style={styles.value}>{context.currentOffering ? 'YES' : 'NO'}</Text>
            </View>
            {context.currentOffering && (
              <>
                <View style={styles.row}>
                  <Text style={styles.label}>Identifier:</Text>
                  <Text style={styles.value}>{context.currentOffering.identifier}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Packages:</Text>
                  <Text style={styles.value}>{context.currentOffering.availablePackages?.length || 0}</Text>
                </View>
              </>
            )}
          </View>

          {context.customerInfo && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Customer Info</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Entitlement:</Text>
                <Text style={styles.value}>{context.entitlement}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Active:</Text>
                <Text style={styles.value}>
                  {context.customerInfo.entitlements.active[context.entitlement] ? 'YES' : 'NO'}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => context.retry()}
            activeOpacity={0.8}
          >
            <RefreshCw size={16} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.refreshButtonText}>Retry Initialization</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9998,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  content: {
    maxHeight: 400,
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingBottom: 100,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00A3FF',
    marginBottom: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '500',
  },
  value: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  valueSmall: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00A3FF',
    margin: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
