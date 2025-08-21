import React, { useState, useEffect, memo } from 'react';

interface SlideTransitionProps {
  show: boolean;
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  delay?: number;
  className?: string;
}

const SlideTransition: React.FC<SlideTransitionProps> = memo(({
  show,
  children,
  direction = 'right',
  duration = 300,
  delay = 0,
  className = '',
}) => {
  const [shouldRender, setShouldRender] = useState(show);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      setTimeout(() => {
        setIsVisible(true);
      }, delay + 10); // Small delay to ensure element is rendered
    } else {
      setIsVisible(false);
      setTimeout(() => {
        setShouldRender(false);
      }, duration);
    }
  }, [show, duration, delay]);

  const getTransformClasses = () => {
    const transforms = {
      left: {
        hidden: 'transform -translate-x-full',
        visible: 'transform translate-x-0',
      },
      right: {
        hidden: 'transform translate-x-full',
        visible: 'transform translate-x-0',
      },
      up: {
        hidden: 'transform -translate-y-full',
        visible: 'transform translate-y-0',
      },
      down: {
        hidden: 'transform translate-y-full',
        visible: 'transform translate-y-0',
      },
    };

    const config = transforms[direction];
    return isVisible ? config.visible : config.hidden;
  };

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={`
        transition-transform ease-out overflow-hidden
        ${getTransformClasses()}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      style={{
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
});

SlideTransition.displayName = 'SlideTransition';

export default SlideTransition;