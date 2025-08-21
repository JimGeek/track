import React, { memo } from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave' | 'none';
  lines?: number;
}

const Skeleton: React.FC<SkeletonProps> = memo(({
  className = '',
  width,
  height,
  variant = 'text',
  animation = 'pulse',
  lines = 1,
}) => {
  const baseClasses = 'bg-gray-200';
  
  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-md',
    circular: 'rounded-full',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: '',
  };

  const getDefaultDimensions = () => {
    switch (variant) {
      case 'text':
        return { width: '100%', height: '1rem' };
      case 'rectangular':
        return { width: '100%', height: '8rem' };
      case 'circular':
        return { width: '3rem', height: '3rem' };
      default:
        return { width: '100%', height: '1rem' };
    }
  };

  const defaults = getDefaultDimensions();
  const finalWidth = width || defaults.width;
  const finalHeight = height || defaults.height;

  const skeletonStyle = {
    width: typeof finalWidth === 'number' ? `${finalWidth}px` : finalWidth,
    height: typeof finalHeight === 'number' ? `${finalHeight}px` : finalHeight,
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`
              ${baseClasses}
              ${variantClasses[variant]}
              ${animationClasses[animation]}
            `.trim().replace(/\s+/g, ' ')}
            style={{
              ...skeletonStyle,
              width: index === lines - 1 ? '75%' : skeletonStyle.width, // Last line is shorter
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${animationClasses[animation]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      style={skeletonStyle}
    />
  );
});

Skeleton.displayName = 'Skeleton';

// Convenience components
export const SkeletonText: React.FC<Omit<SkeletonProps, 'variant'>> = memo((props) => (
  <Skeleton {...props} variant="text" />
));

export const SkeletonCard: React.FC<{ className?: string }> = memo(({ className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    <Skeleton variant="rectangular" height="12rem" />
    <Skeleton variant="text" lines={2} />
    <div className="flex justify-between">
      <Skeleton variant="text" width="30%" />
      <Skeleton variant="text" width="20%" />
    </div>
  </div>
));

export const SkeletonAvatar: React.FC<{ size?: number; className?: string }> = memo(({ 
  size = 40, 
  className = '' 
}) => (
  <Skeleton 
    variant="circular" 
    width={size} 
    height={size} 
    className={className}
  />
));

export const SkeletonTable: React.FC<{ 
  rows?: number; 
  columns?: number; 
  className?: string 
}> = memo(({ rows = 5, columns = 4, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex gap-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton 
            key={colIndex} 
            variant="text" 
            width={`${100 / columns}%`} 
            height="2rem"
          />
        ))}
      </div>
    ))}
  </div>
));

export default Skeleton;