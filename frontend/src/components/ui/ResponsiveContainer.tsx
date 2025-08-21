import React, { memo } from 'react';
import { useResponsive } from '../../hooks/useResponsive';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
  centered?: boolean;
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = memo(({
  children,
  className = '',
  maxWidth = 'xl',
  padding = true,
  centered = true,
}) => {
  const { isMobile, isTablet } = useResponsive();

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-4xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  const paddingClasses = padding 
    ? isMobile 
      ? 'px-4 py-4' 
      : 'px-6 py-6'
    : '';

  const centerClasses = centered ? 'mx-auto' : '';

  return (
    <div 
      className={`
        w-full 
        ${maxWidthClasses[maxWidth]} 
        ${paddingClasses} 
        ${centerClasses} 
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </div>
  );
});

ResponsiveContainer.displayName = 'ResponsiveContainer';

export default ResponsiveContainer;