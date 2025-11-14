import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

interface SafeBlurViewProps {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default' | 'systemMaterialLight' | 'systemMaterialDark' | 'systemThinMaterialLight' | 'systemThinMaterialDark';
  experimentalBlurMethod?: 'none' | 'dimezisBlurView';
  blurReductionFactor?: number;
  style?: any;
  children?: React.ReactNode;
  fallbackColor?: string;
  onBlurError?: () => void;
}

interface SafeBlurViewState {
  hasError: boolean;
}

export class SafeBlurView extends React.Component<SafeBlurViewProps, SafeBlurViewState> {
  constructor(props: SafeBlurViewProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): SafeBlurViewState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('[SafeBlurView] Blur rendering failed:', error, errorInfo);
    if (this.props.onBlurError) {
      this.props.onBlurError();
    }
  }

  render() {
    const {
      intensity = 50,
      tint = 'dark',
      experimentalBlurMethod,
      blurReductionFactor,
      style,
      children,
      fallbackColor = 'rgba(13,13,13,0.95)',
    } = this.props;

    // If error occurred or platform doesn't support blur well, use fallback
    if (this.state.hasError) {
      return (
        <View style={[style, { backgroundColor: fallbackColor }]}>
          {children}
        </View>
      );
    }

    // Try to render BlurView
    try {
      return (
        <BlurView
          intensity={intensity}
          tint={tint}
          experimentalBlurMethod={experimentalBlurMethod}
          blurReductionFactor={blurReductionFactor}
          style={style}
        >
          {children}
        </BlurView>
      );
    } catch (error) {
      console.warn('[SafeBlurView] Blur render error:', error);
      // Fallback to solid color
      return (
        <View style={[style, { backgroundColor: fallbackColor }]}>
          {children}
        </View>
      );
    }
  }
}
