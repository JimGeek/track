import React, { useEffect } from 'react';

// Performance monitoring utilities

export const measurePerformance = (name: string, fn: () => void | Promise<void>) => {
  const startTime = performance.now();
  
  const result = fn();
  
  if (result instanceof Promise) {
    return result.finally(() => {
      const endTime = performance.now();
      console.log(`${name} took ${endTime - startTime} milliseconds`);
    });
  } else {
    const endTime = performance.now();
    console.log(`${name} took ${endTime - startTime} milliseconds`);
    return result;
  }
};

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private timers: Map<string, number> = new Map();
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }
  
  endTimer(name: string): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Timer ${name} not found`);
      return 0;
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`${name}: ${duration.toFixed(2)}ms`);
    this.timers.delete(name);
    
    return duration;
  }
  
  logMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log('Memory usage:', {
        usedJSHeapSize: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        totalJSHeapSize: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        jsHeapSizeLimit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
      });
    }
  }
}

// React performance hooks
export const usePerformanceMonitor = (componentName: string) => {
  const monitor = PerformanceMonitor.getInstance();
  
  useEffect(() => {
    monitor.startTimer(`${componentName} render`);
    return () => {
      monitor.endTimer(`${componentName} render`);
    };
  });
  
  return {
    startTimer: (name: string) => monitor.startTimer(`${componentName}.${name}`),
    endTimer: (name: string) => monitor.endTimer(`${componentName}.${name}`),
    logMemory: () => monitor.logMemoryUsage(),
  };
};

// Image optimization utilities
export const optimizeImageLoading = (src: string, options?: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}): string => {
  // In a real app, you'd integrate with a CDN service like Cloudinary
  // For now, return the original src
  return src;
};

// Bundle size utilities
export const analyzeChunkSizes = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const entries = performance.getEntriesByType('resource');
    const jsChunks = entries.filter(entry => 
      entry.name.includes('.js') && entry.name.includes('chunk')
    );
    
    console.log('JS Chunk Sizes:', jsChunks.map(chunk => ({
      name: chunk.name.split('/').pop(),
      size: `${((chunk as any).transferSize / 1024).toFixed(2)} KB`,
      loadTime: `${chunk.duration.toFixed(2)}ms`
    })));
  }
};

// Detect performance issues
export const detectPerformanceIssues = () => {
  const issues: string[] = [];
  
  // Check for large DOM
  const domNodes = document.querySelectorAll('*').length;
  if (domNodes > 1500) {
    issues.push(`Large DOM detected: ${domNodes} nodes`);
  }
  
  // Check for unused CSS
  const stylesheets = document.styleSheets.length;
  if (stylesheets > 10) {
    issues.push(`Many stylesheets loaded: ${stylesheets}`);
  }
  
  // Check memory usage
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    const usedMB = memory.usedJSHeapSize / 1024 / 1024;
    if (usedMB > 50) {
      issues.push(`High memory usage: ${usedMB.toFixed(2)} MB`);
    }
  }
  
  return issues;
};