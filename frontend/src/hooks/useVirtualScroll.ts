import { useState, useEffect, useRef, useCallback } from 'react';

interface UseVirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  shrinkRatio?: number;
}

interface VirtualScrollResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  getItemProps: (index: number) => {
    style: React.CSSProperties;
    className: string;
  };
  scrollTop: number;
  visibleRange: { start: number; end: number };
}

export const useVirtualScroll = (
  itemCount: number,
  options: UseVirtualScrollOptions
): VirtualScrollResult => {
  const {
    itemHeight,
    containerHeight,
    overscan = 5,
    shrinkRatio = 0.3
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleRange = { start: startIndex, end: endIndex };

  const getItemProps = useCallback((index: number) => {
    const itemTop = index * itemHeight;
    const itemBottom = itemTop + itemHeight;
    const viewportTop = scrollTop;
    const viewportBottom = scrollTop + containerHeight;

    // Determine if item should be shrunk
    const isAboveViewport = itemBottom < viewportTop;
    const isBelowViewport = itemTop > viewportBottom;
    const isPartiallyVisible = itemTop < viewportTop && itemBottom > viewportTop;

    let scale = 1;
    let opacity = 1;
    let transform = '';

    if (isAboveViewport) {
      // Shrink items that are completely above viewport
      scale = shrinkRatio;
      opacity = 0.6;
      transform = `translateY(${itemTop}px) scale(${scale})`;
    } else if (isPartiallyVisible) {
      // Gradually shrink items that are partially visible at the top
      const visibleHeight = itemBottom - viewportTop;
      const shrinkProgress = 1 - (visibleHeight / itemHeight);
      scale = 1 - (shrinkProgress * (1 - shrinkRatio));
      opacity = 1 - (shrinkProgress * 0.4);
      transform = `translateY(${itemTop}px) scale(${scale})`;
    } else {
      // Normal positioning for visible items
      transform = `translateY(${itemTop}px)`;
    }

    return {
      style: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        height: itemHeight,
        transform,
        opacity,
        transformOrigin: 'center top',
        transition: 'transform 0.2s ease-out, opacity 0.2s ease-out',
        zIndex: isAboveViewport ? 1 : 2,
      },
      className: `virtual-scroll-item ${isAboveViewport ? 'shrunk' : 'normal'}`
    };
  }, [scrollTop, containerHeight, itemHeight, shrinkRatio]);

  return {
    containerRef,
    getItemProps,
    scrollTop,
    visibleRange
  };
};