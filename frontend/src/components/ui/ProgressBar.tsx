import React, { useState, useEffect, memo } from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  height?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger';
  animated?: boolean;
  striped?: boolean;
  showLabel?: boolean;
  className?: string;
  duration?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = memo(({
  value,
  max = 100,
  height = 'md',
  color = 'primary',
  animated = false,
  striped = false,
  showLabel = false,
  className = '',
  duration = 1000,
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    if (animated) {
      const startTime = Date.now();
      const startValue = animatedValue;
      const targetValue = Math.min((value / max) * 100, 100);
      const difference = targetValue - startValue;

      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const newValue = startValue + difference * easeOutCubic;

        setAnimatedValue(newValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    } else {
      setAnimatedValue(Math.min((value / max) * 100, 100));
    }
  }, [value, max, animated, duration, animatedValue]);

  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const colorClasses = {
    primary: 'bg-primary-600',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
  };

  const percentage = Math.round(animatedValue);

  return (
    <div className={`relative ${className}`}>
      <div className={`w-full bg-gray-200 rounded-full ${heightClasses[height]} overflow-hidden`}>
        <div
          className={`
            ${colorClasses[color]} 
            ${heightClasses[height]} 
            rounded-full transition-all duration-300 ease-out
            ${striped ? 'bg-striped' : ''}
            ${animated && striped ? 'animate-pulse' : ''}
          `.trim().replace(/\s+/g, ' ')}
          style={{
            width: `${animatedValue}%`,
            backgroundImage: striped 
              ? 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)'
              : undefined,
            backgroundSize: striped ? '1rem 1rem' : undefined,
          }}
        />
      </div>
      
      {showLabel && (
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs font-medium text-gray-700">
            {value} / {max}
          </span>
          <span className="text-xs font-medium text-gray-700">
            {percentage}%
          </span>
        </div>
      )}
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';

export default ProgressBar;