import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'gray';
  text?: string;
  center?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  text,
  center = false
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const colorClasses = {
    primary: 'border-primary-600',
    white: 'border-white',
    gray: 'border-gray-400'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const spinner = (
    <div className="flex flex-col items-center space-y-3">
      <div 
        className={`animate-spin rounded-full border-4 border-gray-200 ${colorClasses[color]} border-t-transparent ${sizeClasses[size]}`}
      ></div>
      {text && (
        <p className={`text-gray-600 ${textSizeClasses[size]} font-medium`}>
          {text}
        </p>
      )}
    </div>
  );

  if (center) {
    return (
      <div className="flex items-center justify-center min-h-32">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;