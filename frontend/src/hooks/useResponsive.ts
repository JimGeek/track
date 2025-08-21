import { useState, useEffect } from 'react';

export interface BreakpointValues {
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
  '2xl': boolean;
}

export interface ResponsiveState extends BreakpointValues {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export const useResponsive = (): ResponsiveState => {
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        sm: false,
        md: false,
        lg: false,
        xl: false,
        '2xl': false,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        width: 1920,
        height: 1080,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    return {
      sm: width >= breakpoints.sm,
      md: width >= breakpoints.md,
      lg: width >= breakpoints.lg,
      xl: width >= breakpoints.xl,
      '2xl': width >= breakpoints['2xl'],
      isMobile: width < breakpoints.md,
      isTablet: width >= breakpoints.md && width < breakpoints.lg,
      isDesktop: width >= breakpoints.lg,
      width,
      height,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setState({
        sm: width >= breakpoints.sm,
        md: width >= breakpoints.md,
        lg: width >= breakpoints.lg,
        xl: width >= breakpoints.xl,
        '2xl': width >= breakpoints['2xl'],
        isMobile: width < breakpoints.md,
        isTablet: width >= breakpoints.md && width < breakpoints.lg,
        isDesktop: width >= breakpoints.lg,
        width,
        height,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return state;
};

export const useBreakpoint = (breakpoint: keyof typeof breakpoints): boolean => {
  const responsive = useResponsive();
  return responsive[breakpoint];
};

export const useMobileFirst = () => {
  const responsive = useResponsive();
  return {
    ...responsive,
    // Mobile-first helper functions
    showOnMobile: responsive.isMobile,
    showOnTablet: responsive.isTablet,
    showOnDesktop: responsive.isDesktop,
    hideOnMobile: !responsive.isMobile,
    hideOnTablet: !responsive.isTablet,
    hideOnDesktop: !responsive.isDesktop,
  };
};