import React from 'react';
import { useStickyHeader } from '../../hooks/useStickyHeader';

interface StickyHeaderProps {
  children: React.ReactNode;
  compactChildren?: React.ReactNode;
  className?: string;
  threshold?: number;
  shrinkPoint?: number;
}

const StickyHeader: React.FC<StickyHeaderProps> = ({
  children,
  compactChildren,
  className = '',
  threshold = 50,
  shrinkPoint = 100
}) => {
  const { isScrolled, isCompact } = useStickyHeader({ threshold, shrinkPoint });

  return (
    <>
      {/* Normal Header */}
      <div 
        className={`transition-all duration-300 ${
          isScrolled ? 'transform -translate-y-full opacity-0' : 'transform translate-y-0 opacity-100'
        } ${className}`}
      >
        {children}
      </div>

      {/* Sticky Compact Header */}
      {compactChildren && (
        <div 
          className={`fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm transition-all duration-300 ${
            isCompact ? 'transform translate-y-0 opacity-100' : 'transform -translate-y-full opacity-0'
          }`}
        >
          {compactChildren}
        </div>
      )}
      
      {/* Spacer for when header becomes sticky */}
      {isCompact && compactChildren && (
        <div className="h-16"></div>
      )}
    </>
  );
};

export default StickyHeader;