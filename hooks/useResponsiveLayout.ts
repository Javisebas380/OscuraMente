import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

interface ResponsiveLayout {
  isTablet: boolean;
  isLandscape: boolean;
  isWideScreen: boolean;
  isTabletLandscape: boolean;
  screenWidth: number;
  screenHeight: number;
  contentMaxWidth: number;
  slideWidth: number;
  horizontalPadding: number;
  verticalSpacing: number;
  titleFontSize: number;
  subtitleFontSize: number;
}

const TABLET_BREAKPOINT = 768;
const WIDE_SCREEN_BREAKPOINT = 1024;
const MAX_CONTENT_WIDTH_PHONE = 480;
const MAX_CONTENT_WIDTH_TABLET = 600;
const MAX_CONTENT_WIDTH_TABLET_LANDSCAPE = 440;
const MAX_CONTENT_WIDTH_WIDE = 720;
const MAX_SLIDE_WIDTH = 800;
const SAFE_HORIZONTAL_MARGIN = 48;

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
  const isTabletLandscape = isTablet && isLandscape;

  let contentMaxWidth = MAX_CONTENT_WIDTH_PHONE;
  if (isWideScreen) {
    contentMaxWidth = MAX_CONTENT_WIDTH_WIDE;
  } else if (isTabletLandscape) {
    contentMaxWidth = MAX_CONTENT_WIDTH_TABLET_LANDSCAPE;
  } else if (isTablet) {
    contentMaxWidth = MAX_CONTENT_WIDTH_TABLET;
  }

  let slideWidth: number;
  if (isTabletLandscape) {
    const safeScreenWidth = dimensions.width - (SAFE_HORIZONTAL_MARGIN * 2);
    slideWidth = Math.min(safeScreenWidth, dimensions.width * 0.85);
  } else if (isTablet) {
    const safeScreenWidth = dimensions.width - (SAFE_HORIZONTAL_MARGIN * 2);
    slideWidth = Math.min(safeScreenWidth, MAX_SLIDE_WIDTH);
  } else {
    // Mobile: use exact screen width to prevent overflow
    slideWidth = dimensions.width;
  }

  const horizontalPadding = isWideScreen ? 64 : isTablet ? 48 : 24;
  const verticalSpacing = isWideScreen ? 32 : isTabletLandscape ? 12 : isTablet ? 24 : 16;

  const titleFontSize = isTabletLandscape ? 26 : 32;
  const subtitleFontSize = isTabletLandscape ? 15 : 17;

  return {
    isTablet,
    isLandscape,
    isWideScreen,
    isTabletLandscape,
    screenWidth: dimensions.width,
    screenHeight: dimensions.height,
    contentMaxWidth,
    slideWidth,
    horizontalPadding,
    verticalSpacing,
    titleFontSize,
    subtitleFontSize,
  };
};
