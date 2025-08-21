import React, { useState, useEffect, memo } from 'react';

interface FadeTransitionProps {
  show: boolean;
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  className?: string;
  appear?: boolean;
  enter?: string;
  enterFrom?: string;
  enterTo?: string;
  leave?: string;
  leaveFrom?: string;
  leaveTo?: string;
}

const FadeTransition: React.FC<FadeTransitionProps> = memo(({
  show,
  children,
  duration = 300,
  delay = 0,
  className = '',
  appear = true,
  enter = 'transition-opacity ease-out',
  enterFrom = 'opacity-0',
  enterTo = 'opacity-100',
  leave = 'transition-opacity ease-in',
  leaveFrom = 'opacity-100',
  leaveTo = 'opacity-0',
}) => {
  const [shouldRender, setShouldRender] = useState(show);
  const [stage, setStage] = useState<'enter' | 'entered' | 'leave' | 'left'>('left');

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      setTimeout(() => {
        setStage('enter');
        setTimeout(() => {
          setStage('entered');
        }, duration);
      }, delay);
    } else {
      setStage('leave');
      setTimeout(() => {
        setStage('left');
        setShouldRender(false);
      }, duration);
    }
  }, [show, duration, delay]);

  const getTransitionClasses = () => {
    switch (stage) {
      case 'enter':
        return `${enter} ${enterFrom}`;
      case 'entered':
        return `${enter} ${enterTo}`;
      case 'leave':
        return `${leave} ${leaveFrom}`;
      case 'left':
        return `${leave} ${leaveTo}`;
      default:
        return '';
    }
  };

  if (!shouldRender && !show) {
    return null;
  }

  return (
    <div
      className={`${getTransitionClasses()} ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
});

FadeTransition.displayName = 'FadeTransition';

export default FadeTransition;