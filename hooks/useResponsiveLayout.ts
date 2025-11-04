import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

interface ResponsiveLayout {
  isTablet: boolean;
  isLandscape: boolean;
  isWideScreen: boolean;
  screenWidth: number;
  screenHeight: number;
  contentMaxWidth: number;
  slideWidth: number;
  horizontalPadding: number;
  verticalSpacing: number;
}

const TABLET_BREAKPOINT = 768;
const WIDE_SCREEN_BREAKPOINT = 1024;
const MAX_CONTENT_WIDTH_PHONE = 480;
const MAX_CONTENT_WIDTH_TABLET = 600;
const MAX_CONTENT_WIDTH_WIDE = 720;
const MAX_SLIDE_WIDTH = 800;

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
  const isWideScreen = dimensions.width >= WIDE_SCREEN_BREAKPOINT;
  const isLandscape = dimensions.width > dimensions.height;

  let contentMaxWidth = MAX_CONTENT_WIDTH_PHONE;
  if (isWideScreen) {
    contentMaxWidth = MAX_CONTENT_WIDTH_WIDE;
  } else if (isTablet) {
    contentMaxWidth = MAX_CONTENT_WIDTH_TABLET;
  }

  const slideWidth = Math.min(dimensions.width, MAX_SLIDE_WIDTH);
  const horizontalPadding = isWideScreen ? 64 : isTablet ? 48 : 24;
  const verticalSpacing = isWideScreen ? 32 : isTablet ? 24 : 16;

  return {
    isTablet,
    isLandscape,
    isWideScreen,
    screenWidth: dimensions.width,
    screenHeight: dimensions.height,
    contentMaxWidth,
    slideWidth,
    horizontalPadding,
    verticalSpacing,
  };
};
