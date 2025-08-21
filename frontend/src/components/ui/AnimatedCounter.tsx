import React, { useState, useEffect, memo } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  decimals?: number;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = memo(({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
  className = '',
  decimals = 0,
}) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = current;
    const difference = value - startValue;

    const updateCounter = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const newValue = startValue + difference * easeOutCubic;

      setCurrent(newValue);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        setCurrent(value);
      }
    };

    requestAnimationFrame(updateCounter);
  }, [value, duration, current]);

  const displayValue = current.toFixed(decimals);

  return (
    <span className={className}>
      {prefix}{displayValue}{suffix}
    </span>
  );
});

AnimatedCounter.displayName = 'AnimatedCounter';

export default AnimatedCounter;