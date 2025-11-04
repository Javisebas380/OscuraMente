import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

interface ResponsiveLayout {
  isTablet: boolean;
  isLandscape: boolean;
  screenWidth: number;
  screenHeight: number;
  contentMaxWidth: number;
  horizontalPadding: number;
  verticalSpacing: number;
}

const TABLET_BREAKPOINT = 768;
const MAX_CONTENT_WIDTH_PHONE = 480;
const MAX_CONTENT_WIDTH_TABLET = 640;

export const useResponsiveLayout = (): ResponsiveLayout => {
  const [dimensions, setDimensions] = useState(() => {
    const window = Dimensions.get('window');
    return {
      width: window.width,
      height: window.height,
    };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }: { window: ScaledSize }) => {
      setDimensions({
        width: window.width,
        height: window.height,
      });
    });

    return () => subscription?.remove();
  }, []);

  const isTablet = dimensions.width >= TABLET_BREAKPOINT;
  const isLandscape = dimensions.width > dimensions.height;

  const contentMaxWidth = isTablet ? MAX_CONTENT_WIDTH_TABLET : MAX_CONTENT_WIDTH_PHONE;
  const horizontalPadding = isTablet ? 48 : 24;
  const verticalSpacing = isTablet ? 24 : 16;

  return {
    isTablet,
    isLandscape,
    screenWidth: dimensions.width,
    screenHeight: dimensions.height,
    contentMaxWidth,
    horizontalPadding,
    verticalSpacing,
  };
};
