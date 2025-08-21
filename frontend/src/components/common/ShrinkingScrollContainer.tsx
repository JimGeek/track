import React, { useState, useEffect, useRef, useCallback } from 'react';

interface ShrinkingScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  itemSelector?: string;
  shrinkRatio?: number;
  shrinkThreshold?: number;
}

const ShrinkingScrollContainer: React.FC<ShrinkingScrollContainerProps> = ({
  children,
  className = '',
  itemSelector = '.shrink-item',
  shrinkRatio = 0.4,
  shrinkThreshold = 100
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const updateItemStates = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const items = container.querySelectorAll(itemSelector);
    const scrollTop = container.scrollTop;
    const containerTop = container.getBoundingClientRect().top;

    items.forEach((item, index) => {
      const element = item as HTMLElement;
      const itemRect = element.getBoundingClientRect();
      const itemTop = itemRect.top - containerTop + scrollTop;
      const itemHeight = itemRect.height;
      
      // Calculate how much of the item is above the visible area
      const hiddenAmount = Math.max(0, scrollTop - itemTop);
      const shrinkProgress = Math.min(1, hiddenAmount / shrinkThreshold);
      
      if (shrinkProgress > 0) {
        // Item should be shrunk
        const scale = 1 - (shrinkProgress * (1 - shrinkRatio));
        const opacity = 1 - (shrinkProgress * 0.3);
        
        element.style.transform = `scale(${scale})`;
        element.style.opacity = `${opacity}`;
        element.style.transformOrigin = 'center top';
        element.style.transition = isScrolling ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out';
        element.style.marginBottom = `${-itemHeight * (1 - scale) * 0.5}px`;
        element.classList.add('shrunk');
      } else {
        // Item should be normal
        element.style.transform = 'scale(1)';
        element.style.opacity = '1';
        element.style.marginBottom = '0px';
        element.classList.remove('shrunk');
      }
    });
  }, [itemSelector, shrinkRatio, shrinkThreshold, isScrolling]);

  const handleScroll = useCallback(() => {
    setIsScrolling(true);
    updateItemStates();
    
    // Debounce scroll end detection
    const timeoutId = setTimeout(() => {
      setIsScrolling(false);
      updateItemStates();
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [updateItemStates]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initial update
    updateItemStates();

    // Add scroll listener
    container.addEventListener('scroll', handleScroll, { passive: true });
    
    // Add resize observer to handle dynamic content
    const resizeObserver = new ResizeObserver(() => {
      updateItemStates();
    });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [handleScroll, updateItemStates]);

  // Update when children change
  useEffect(() => {
    const timeoutId = setTimeout(updateItemStates, 100);
    return () => clearTimeout(timeoutId);
  }, [children, updateItemStates]);

  return (
    <div
      ref={containerRef}
      className={`shrinking-scroll-container ${className}`}
      style={{
        position: 'relative',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}
    >
      {children}
    </div>
  );
};

export default ShrinkingScrollContainer;