import { useState, useEffect, useRef, useCallback } from 'react';

interface UseStickyHeaderOptions {
  threshold?: number;
  shrinkPoint?: number;
}

interface StickyHeaderResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isScrolled: boolean;
  isCompact: boolean;
  scrollY: number;
}

export const useStickyHeader = (options: UseStickyHeaderOptions = {}): StickyHeaderResult => {
  const { threshold = 50, shrinkPoint = 100 } = options;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    setScrollY(currentScrollY);
    setIsScrolled(currentScrollY > threshold);
    setIsCompact(currentScrollY > shrinkPoint);
  }, [threshold, shrinkPoint]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return {
    containerRef,
    isScrolled,
    isCompact,
    scrollY
  };
};