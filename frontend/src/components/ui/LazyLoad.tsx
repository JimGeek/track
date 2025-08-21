import React, { Suspense, lazy, ComponentType, memo } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LazyLoadProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

const LazyLoad: React.FC<LazyLoadProps> = memo(({ 
  fallback = <LoadingSpinner center text="Loading..." />, 
  children 
}) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
});

LazyLoad.displayName = 'LazyLoad';

// Helper function to create lazy components with better loading states
export const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = lazy(importFn);
  
  const WrappedComponent: React.FC<React.ComponentProps<T>> = memo((props) => (
    <LazyLoad fallback={fallback}>
      <LazyComponent {...props} />
    </LazyLoad>
  ));
  
  WrappedComponent.displayName = 'LazyComponent';
  
  return WrappedComponent;
};

export default LazyLoad;