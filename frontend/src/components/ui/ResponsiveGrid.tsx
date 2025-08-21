import React, { memo } from 'react';
import { useResponsive } from '../../hooks/useResponsive';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: number;
  autoFit?: boolean;
  minItemWidth?: string;
}

const ResponsiveGrid: React.FC<ResponsiveGridProps> = memo(({
  children,
  className = '',
  cols = { default: 1, sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 4,
  autoFit = false,
  minItemWidth = '250px',
}) => {
  const responsive = useResponsive();

  const getCurrentCols = () => {
    if (responsive['2xl'] && cols['2xl']) return cols['2xl'];
    if (responsive.xl && cols.xl) return cols.xl;
    if (responsive.lg && cols.lg) return cols.lg;
    if (responsive.md && cols.md) return cols.md;
    if (responsive.sm && cols.sm) return cols.sm;
    return cols.default || 1;
  };

  const currentCols = getCurrentCols();
  
  const gapClasses = {
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    5: 'gap-5',
    6: 'gap-6',
    8: 'gap-8',
  };

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  if (autoFit) {
    return (
      <div 
        className={`grid ${gapClasses[gap as keyof typeof gapClasses] || 'gap-4'} ${className}`}
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`,
        }}
      >
        {children}
      </div>
    );
  }

  const responsiveClasses = [
    cols.default ? gridCols[cols.default as keyof typeof gridCols] : 'grid-cols-1',
    cols.sm ? `sm:${gridCols[cols.sm as keyof typeof gridCols]}` : '',
    cols.md ? `md:${gridCols[cols.md as keyof typeof gridCols]}` : '',
    cols.lg ? `lg:${gridCols[cols.lg as keyof typeof gridCols]}` : '',
    cols.xl ? `xl:${gridCols[cols.xl as keyof typeof gridCols]}` : '',
    cols['2xl'] ? `2xl:${gridCols[cols['2xl'] as keyof typeof gridCols]}` : '',
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={`
        grid 
        ${responsiveClasses} 
        ${gapClasses[gap as keyof typeof gapClasses] || 'gap-4'} 
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </div>
  );
});

ResponsiveGrid.displayName = 'ResponsiveGrid';

export default ResponsiveGrid;