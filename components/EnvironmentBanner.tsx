import { View, Text, StyleSheet } from 'react-native';
import { getAppEnvironment, validateEnvironmentConfig } from '../src/utils/environment';

export function EnvironmentBanner() {
  const appEnv = getAppEnvironment();
  const validation = validateEnvironmentConfig();

  if (appEnv === 'production' && validation.warnings.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.banner, appEnv === 'production' ? styles.production : styles.development]}>
        <Text style={styles.envText}>
          {appEnv === 'production' ? '🔴 PRODUCTION' : '🟡 DEVELOPMENT'}
        </Text>
        {validation.warnings.length > 0 && (
          <Text style={styles.warningText}>
            {validation.warnings.length} warning{validation.warnings.length > 1 ? 's' : ''}
          </Text>
        )}
      </View>
      {validation.warnings.length > 0 && __DEV__ && (
        <View style={styles.detailsContainer}>
          {validation.warnings.map((warning, index) => (
            <Text key={index} style={styles.detailText}>
              ⚠️ {warning}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  banner: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  development: {
    backgroundColor: '#FFA500',
  },
  production: {
    backgroundColor: '#FF0000',
  },
  envText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  warningText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
  },
  detailsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 8,
    gap: 4,
  },
  detailText: {
    color: '#FFA500',
    fontSize: 9,
    fontFamily: 'monospace',
  },
});
