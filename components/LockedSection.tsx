import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Play, Crown, RefreshCw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAnalytics } from '../hooks/useAnalytics';
import { unlockManager } from '../src/services/unlockManager';

interface LockedSectionProps {
  isUnlocked: boolean;
  lockType: 'ad' | 'premium';
  onUnlockPress: () => void;
  onRetryPress?: () => void;
  onFreeUnlockPress?: () => void;
  children: React.ReactNode;
  isLoading?: boolean;
  hasFailed?: boolean;
  canUseFreeUnlock?: boolean;
  sectionName?: string;
  extraCtas?: {
    top?: boolean;
    middle?: boolean;
    bottom?: boolean;
    sticky?: boolean;
    labelOverride?: string;
  };
}

export default function LockedSection({
  isUnlocked,
  lockType,
  onUnlockPress,
  onRetryPress,
  onFreeUnlockPress,
  children,
  isLoading = false,
  hasFailed = false,
  canUseFreeUnlock = false,
  sectionName = 'contenido',
  extraCtas = {}
}: LockedSectionProps) {
  const insets = useSafeAreaInsets();
  const { trackEvent } = useAnalytics();
  const overlayOpacity = React.useRef(new Animated.Value(isUnlocked ? 0 : 1)).current;
  const dimOpacity = React.useRef(new Animated.Value(isUnlocked ? 0 : 1)).current;
  const [scrollY, setScrollY] = React.useState(0);
  const [contentHeight, setContentHeight] = React.useState(0);
  const [containerHeight, setContainerHeight] = React.useState(0);

  // CTA animations
  const topCtaAnim = React.useRef(new Animated.Value(0)).current;
  const middleCtaAnim = React.useRef(new Animated.Value(0)).current;
  const bottomCtaAnim = React.useRef(new Animated.Value(0)).current;
  const stickyCtaAnim = React.useRef(new Animated.Value(0)).current;

  // Set initial animation values without animations to prevent scroll jumping
  React.useEffect(() => {
    if (isUnlocked) {
      overlayOpacity.setValue(0);
      dimOpacity.setValue(0);
      topCtaAnim.setValue(0);
      middleCtaAnim.setValue(0);
      bottomCtaAnim.setValue(0);
      stickyCtaAnim.setValue(0);
    } else {
      overlayOpacity.setValue(1);
      dimOpacity.setValue(1);
      if (lockType === 'premium') {
        topCtaAnim.setValue(1);
        bottomCtaAnim.setValue(1);
      }
    }
  }, [isUnlocked, lockType]);

  // Middle CTA for long sections
  const isLongSection = contentHeight >= 1000 && containerHeight >= 700;
  
  React.useEffect(() => {
    if (!isUnlocked && lockType === 'premium' && isLongSection && extraCtas.middle !== false) {
      middleCtaAnim.setValue(1);
    } else {
      middleCtaAnim.setValue(0);
    }
  }, [isUnlocked, lockType, isLongSection, extraCtas.middle]);

  // Sticky CTA logic
  const shouldShowSticky = extraCtas.sticky && scrollY > (contentHeight * 0.4);

  React.useEffect(() => {
    if (shouldShowSticky && !isUnlocked && lockType === 'premium') {
      stickyCtaAnim.setValue(1);
    } else {
      stickyCtaAnim.setValue(0);
    }
  }, [shouldShowSticky, isUnlocked, lockType, extraCtas.sticky]);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleUnlockPress = (position?: string) => {
    triggerHaptic();
    if (position) {
      trackEvent(`cta_click_${position}`, { 
        lockType, 
        sectionName,
        testId: 'current'
      });
    }
    onUnlockPress();
  };

  const handleRetryPress = () => {
    if (onRetryPress) {
      triggerHaptic();
      onRetryPress();
    }
  };

  const handleFreeUnlockPress = () => {
    if (onFreeUnlockPress) {
      triggerHaptic();
      onFreeUnlockPress();
    }
  };

  const getAccessibilityLabel = (position?: string) => {
    const positionText = position ? ` - ${position}` : '';
    if (lockType === 'ad') {
      return `Desbloquear ${sectionName} viendo un anuncio${positionText}`;
    }
    return `Desbloquear ${sectionName} con suscripción Premium${positionText}`;
  };

  const getButtonColors = () => {
    const colors = lockType === 'premium' ? ['#C8A951', '#E6C875', '#C8A951'] : ['#00A3FF', '#0080CC', '#00A3FF'];
    return colors;
  };

  const getButtonIcon = () => {
    const icon = lockType === 'premium' ? 
      <Crown size={18} color="#0D0D0D" strokeWidth={1.5} /> : 
      <Play size={18} color="#FFFFFF" strokeWidth={1.5} />;
    return icon;
  };

  const getButtonText = (position?: string) => {
    let text;
    if (extraCtas.labelOverride) {
      text = extraCtas.labelOverride;
    } else if (lockType === 'premium') {
      text = 'Desbloquear con Premium';
    } else if (isLoading) {
      text = 'Cargando...';
    } else {
      text = 'Ver Anuncio para Desbloquear';
    }
    return text;
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: 'transparent' }
      ]}
    >
      {/* Content - always rendered normally */}
      <View style={styles.contentContainer}>
        {children}
      </View>

      {/* Blur Effects - Platform Specific */}
      {!isUnlocked && (
        <>
          {Platform.OS === 'ios' && (
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  opacity: overlayOpacity,
                  zIndex: 5,
                  borderRadius: 16,
                  overflow: 'hidden',
                }
              ]}
              pointerEvents="none"
            >
              <BlurView
                intensity={20}
                tint="systemMaterialDark"
                style={StyleSheet.absoluteFillObject}
              />
              <View 
                style={[
                  StyleSheet.absoluteFillObject, 
                  { backgroundColor: 'rgba(13,13,13,0.6)' }
                ]} 
              />
            </Animated.View>
          )}

          {Platform.OS === 'android' && (
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  opacity: overlayOpacity,
                  backgroundColor: 'rgba(13,13,13,0.96)',
                  zIndex: 5,
                  borderRadius: 16,
                }
              ]}
              pointerEvents="none"
            />
          )}

          {Platform.OS === 'web' && (
            <>
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    filter: 'blur(22px) brightness(0.15)',
                    zIndex: 5,
                    borderRadius: 16,
                  }
                ]}
                pointerEvents="none"
              />
              <Animated.View
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    opacity: dimOpacity,
                    backgroundColor: 'rgba(13,13,13,0.7)',
                    zIndex: 6,
                    borderRadius: 16,
                  }
                ]}
                pointerEvents="none"
              />
            </>
          )}
        </>
      )}

      {/* iOS Blur Overlay */}
      {!isUnlocked && Platform.OS === 'ios' && (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            { opacity: overlayOpacity }
          ]}
          pointerEvents="none"
        >
          {/* iOS – frosted más translúcido */}
        <BlurView
          intensity={1}                           // más blur (0–100)
          tint={Platform.OS === 'ios' ? 'systemThinMaterialDark' : 'dark'}
          style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
        />
        
        {/* capa sutil para contraste y legibilidad del CTA */}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: 'rgba(14,14,14,0.05)', borderRadius: 16 }
          ]}
        />
        </Animated.View>
      )}

      {/* Android Solid Overlay */}
      {!isUnlocked && Platform.OS === 'android' && (
        <Animated.View
          style={[
            styles.androidSolidOverlay,
            { opacity: overlayOpacity }
          ]}
          pointerEvents="none"
        />
      )}

      {/* Dim Overlay for Web only */}
      {!isUnlocked && Platform.OS === 'web' && (
        <Animated.View
          style={[
            styles.dimOverlay,
            { opacity: dimOpacity }
          ]}
          pointerEvents="none"
        />
      )}

      {/* Unlock Overlay */}
      {!isUnlocked && (
        <Animated.View
          style={[
            styles.unlockOverlayBase,
            {
              opacity: overlayOpacity, 
              paddingTop: Math.max(insets.top + 10, 40),
              paddingBottom: Math.max(insets.bottom + 20, 40),
            }
          ]}
          pointerEvents={!isUnlocked ? "auto" : "none"}
        >
          {lockType === 'premium' ? (
            <>
              {/* TOP */}
              <Animated.View 
                style={[
                  styles.unlockTop,
                  {
                    opacity: topCtaAnim,
                    transform: [{
                      translateY: topCtaAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      })
                    }]
                  }
                ]}
              >
                <View style={[styles.lockIconContainer, styles.premiumLockIcon]}>
                  <Lock size={24} color="#C8A951" strokeWidth={1.5} />
                </View>

                <TouchableOpacity
                  style={styles.unlockButton}
                  onPress={() => handleUnlockPress('top')}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel={getAccessibilityLabel('top')}
                >
                  <LinearGradient
                    colors={getButtonColors()}
                    style={styles.unlockGradient}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#0D0D0D" />
                    ) : (
                      <>
                        {getButtonIcon()}
                        <Text style={styles.premiumButtonText}>
                          {getButtonText('top')}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity> 
              </Animated.View>

              {/* SPACER with conditional MIDDLE CTA */}
              <View style={styles.unlockSpacer}>
                {isLongSection && extraCtas.middle !== false && (
                  <Animated.View 
                    style={[
                      styles.unlockMiddle,
                      {
                        opacity: middleCtaAnim,
                        transform: [{
                          translateY: middleCtaAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0],
                          })
                        }]
                      }
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.unlockButton}
                      onPress={() => handleUnlockPress('middle')}
                      disabled={isLoading}
                      accessibilityRole="button"
                      accessibilityLabel={getAccessibilityLabel('middle')}
                    >
                      <LinearGradient
                        colors={getButtonColors()}
                        style={styles.unlockGradient}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color="#0D0D0D" />
                        ) : (
                          <>
                            {getButtonIcon()}
                            <Text style={styles.premiumButtonText}>
                              {getButtonText('middle')}
                            </Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </View>

              {/* BOTTOM */}
              <Animated.View 
                style={[
                  styles.unlockBottom,
                  {
                    opacity: bottomCtaAnim,
                    transform: [{
                      translateY: bottomCtaAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      })
                    }]
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.unlockButton}
                  onPress={() => handleUnlockPress('bottom')}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel={getAccessibilityLabel('bottom')}
                >
                  <LinearGradient
                    colors={getButtonColors()}
                    style={styles.unlockGradient}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#0D0D0D" />
                    ) : (
                      <>
                        {getButtonIcon()}
                        <Text style={styles.premiumButtonText}>
                          {getButtonText('bottom')}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={[styles.lockTypeIndicator, styles.premiumIndicator]}>
                  <Text style={styles.premiumIndicatorText}>
                    Premium requerido
                  </Text>
                </View>
              </Animated.View>
            </>
          ) : (
            // Single CTA for ad content
            <View style={styles.unlockContent}>
              <View style={styles.lockIconContainer}>
                <Lock size={24} color="#00A3FF" strokeWidth={1.5} />
              </View>

              <TouchableOpacity
                style={styles.unlockButton}
                onPress={() => handleUnlockPress()}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel={getAccessibilityLabel()}
              >
                <LinearGradient
                  colors={getButtonColors()}
                  style={styles.unlockGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      {getButtonIcon()}
                      <Text style={styles.unlockButtonText}>
                        {getButtonText()}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {hasFailed && onRetryPress && (
                <TouchableOpacity style={styles.retryButton} onPress={handleRetryPress}>
                  <RefreshCw size={14} color="#B3B3B3" strokeWidth={1.5} />
                  <Text style={styles.retryButtonText}>Reintentar</Text>
                </TouchableOpacity>
              )}

              {canUseFreeUnlock && onFreeUnlockPress && (
                <TouchableOpacity style={styles.freeUnlockButton} onPress={handleFreeUnlockPress}>
                  <Text style={styles.freeUnlockText}>Desbloquear Gratis (1/día)</Text>
                </TouchableOpacity>
              )}

              <View style={styles.lockTypeIndicator}>
                <Text style={styles.lockTypeText}>
                  Anuncio requerido
                </Text>
              </View>
            </View>
          )}
        </Animated.View>
      )}

      {/* Sticky CTA for Premium */}
      {shouldShowSticky && !isUnlocked && lockType === 'premium' && (
        <Animated.View 
          style={[
            styles.stickyCta,
            {
              opacity: stickyCtaAnim,
              transform: [{
                translateY: stickyCtaAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                })
              }]
            }
          ]}
          pointerEvents="auto"
        >
          <TouchableOpacity
            style={[styles.unlockButton, styles.stickyButton]}
            isUnlocked={subscriptionIsActive}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel={getAccessibilityLabel('sticky')}
          >
            <LinearGradient
              colors={getButtonColors()}
              style={styles.unlockGradient}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#0D0D0D" />
              ) : (
                <>
                  {getButtonIcon()}
                  <Text style={styles.premiumButtonText}>
                    {getButtonText('sticky')}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Unlocked Badge */}
      {isUnlocked && (
        <View style={styles.unlockedBadge}>
          <Text style={styles.unlockedText}>Desbloqueado</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
  },
  contentContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
    padding: 16,
  },
  androidSolidOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(13, 13, 13, 0.96)',
    borderRadius: 16,
    zIndex: 5,
  },
  dimOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(13, 13, 13, 0.7)',
    borderRadius: 16,
    zIndex: 6,
  },
  unlockOverlayBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    borderRadius: 16,
    zIndex: 30,
  },
  unlockContent: {
    alignItems: 'center',
    gap: 20,
  },
  unlockTop: {
    alignItems: 'center',
    gap: 12,
  },
  unlockMiddle: {
    alignItems: 'center',
    gap: 12,
  },
  unlockBottom: {
    alignItems: 'center',
    gap: 12,
  },
  unlockSpacer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 163, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 163, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00A3FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  premiumLockIcon: {
    backgroundColor: 'rgba(200, 169, 81, 0.1)',
    borderColor: 'rgba(200, 169, 81, 0.3)',
    shadowColor: '#C8A951',
  },
  unlockButton: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '80%',
    maxWidth: 380,
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  stickyButton: {
    width: '100%',
  },
  unlockGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 48,
  },
  unlockButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  premiumButtonText: {
    fontSize: 14,
    color: '#0D0D0D',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(179, 179, 179, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(179, 179, 179, 0.3)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
    minWidth: 120,
  },
  retryButtonText: {
    fontSize: 12,
    color: '#B3B3B3',
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.2,
  },
  freeUnlockButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
    minWidth: 160,
    justifyContent: 'center',
  },
  freeUnlockText: {
    fontSize: 11,
    color: '#10B981',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.3,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  lockTypeIndicator: {
    backgroundColor: 'rgba(0, 163, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 163, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  premiumIndicator: {
    backgroundColor: 'rgba(200, 169, 81, 0.1)',
    borderColor: 'rgba(200, 169, 81, 0.3)',
  },
  lockTypeText: {
    fontSize: 10,
    color: '#00A3FF',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  premiumIndicatorText: {
    fontSize: 10,
    color: '#C8A951',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  stickyCta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.select({ ios: 12, android: 16 }),
    backgroundColor: 'rgba(13, 13, 13, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    paddingHorizontal: 24,
    paddingVertical: Platform.select({ ios: 16, android: 20 }),
    paddingBottom: Platform.select({ ios: 14, android: 18 }), 
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 35,
  },
  unlockedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  unlockedText: {
    fontSize: 9,
    color: '#10B981',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});