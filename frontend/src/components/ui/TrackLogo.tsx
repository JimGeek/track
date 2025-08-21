import React from 'react';

interface TrackLogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'full' | 'icon-only';
  className?: string;
  isDark?: boolean; // New prop to indicate dark background
}

const TrackLogo: React.FC<TrackLogoProps> = ({ 
  size = 'medium', 
  variant = 'full',
  className = '',
  isDark = false
}) => {
  const sizeClasses = {
    small: { 
      height: 'h-8',
      width: variant === 'full' ? 'w-24' : 'w-8'
    },
    medium: { 
      height: 'h-10',
      width: variant === 'full' ? 'w-32' : 'w-10'
    },
    large: { 
      height: 'h-16',
      width: variant === 'full' ? 'w-48' : 'w-16'
    }
  };

  const currentSize = sizeClasses[size];

  // Custom SVG for dark backgrounds with white text
  const DarkLogoSVG = () => (
    <svg width="251" height="75" viewBox="0 0 188.25 56.25" className={`${currentSize.height} w-auto`}>
      <g>
        <circle cx="28.5" cy="28" r="20" fill="#EAB308" stroke="#CA8A04" strokeWidth="2"/>
        <path d="M20 28l6 6 12-12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      {variant === 'full' && (
        <g>
          <text x="60" y="20" fontSize="24" fontWeight="bold" fill="white" fontFamily="Arial, sans-serif">Track</text>
          <text x="60" y="40" fontSize="12" fill="white" fontFamily="Arial, sans-serif">Project Management</text>
        </g>
      )}
    </svg>
  );

  if (variant === 'icon-only') {
    return (
      <div className={`${currentSize.height} ${currentSize.width} ${className}`}>
        {isDark ? (
          <svg width="32" height="32" viewBox="0 0 32 32" className="h-full w-auto">
            <circle cx="16" cy="16" r="14" fill="#EAB308" stroke="#CA8A04" strokeWidth="2"/>
            <path d="M10 16l4 4 8-8" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <img 
            src="/track-logo.svg" 
            alt="Track"
            className="h-full w-auto object-contain"
          />
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center ${currentSize.height} ${className}`}>
      {isDark ? (
        <DarkLogoSVG />
      ) : (
        <img 
          src="/track-logo.svg" 
          alt="Track - Project Management Platform"
          className={`${currentSize.height} w-auto object-contain`}
        />
      )}
    </div>
  );
};

export default TrackLogo;