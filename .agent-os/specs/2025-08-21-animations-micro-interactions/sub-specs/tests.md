# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-08-21-animations-micro-interactions/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Test Coverage

### Animation Component Tests

#### Unit Tests
```typescript
describe('AnimatedButton', () => {
  it('should render with default animation properties', () => {
    render(<AnimatedButton>Click me</AnimatedButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveStyle({
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
    });
  });

  it('should apply hover animations correctly', async () => {
    render(<AnimatedButton>Hover me</AnimatedButton>);
    
    const button = screen.getByRole('button');
    
    // Simulate hover
    fireEvent.mouseEnter(button);
    
    // Check for hover animation classes
    await waitFor(() => {
      expect(button).toHaveClass('animate-hover');
    });
    
    // Check CSS transform
    const computedStyle = window.getComputedStyle(button);
    expect(computedStyle.transform).toBe('scale(1.05)');
  });

  it('should respect reduced motion preferences', () => {
    // Mock reduced motion preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))
    });

    render(<AnimatedButton respectReducedMotion>Accessible button</AnimatedButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('reduce-motion');
    expect(button).toHaveStyle({
      transition: 'none'
    });
  });

  it('should handle click animations with proper timing', async () => {
    const handleClick = jest.fn();
    render(<AnimatedButton onClick={handleClick}>Click me</AnimatedButton>);
    
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    
    // Should apply click animation
    expect(button).toHaveClass('animate-click');
    
    // Should complete animation and trigger callback
    await waitFor(() => {
      expect(handleClick).toHaveBeenCalled();
    }, { timeout: 300 });
    
    // Animation class should be removed after animation
    await waitFor(() => {
      expect(button).not.toHaveClass('animate-click');
    }, { timeout: 500 });
  });
});

describe('PageTransition', () => {
  it('should animate page transitions smoothly', async () => {
    const { rerender } = render(
      <PageTransition>
        <div data-testid="page-1">Page 1</div>
      </PageTransition>
    );

    expect(screen.getByTestId('page-1')).toBeVisible();

    // Trigger page transition
    rerender(
      <PageTransition>
        <div data-testid="page-2">Page 2</div>
      </PageTransition>
    );

    // Both pages should be present during transition
    expect(screen.getByTestId('page-1')).toBeInTheDocument();
    expect(screen.getByTestId('page-2')).toBeInTheDocument();

    // Wait for transition to complete
    await waitFor(() => {
      expect(screen.queryByTestId('page-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('page-2')).toBeVisible();
    }, { timeout: 600 });
  });

  it('should handle interrupted transitions gracefully', async () => {
    const { rerender } = render(
      <PageTransition>
        <div data-testid="page-1">Page 1</div>
      </PageTransition>
    );

    // Start first transition
    rerender(
      <PageTransition>
        <div data-testid="page-2">Page 2</div>
      </PageTransition>
    );

    // Interrupt with another transition before first completes
    await new Promise(resolve => setTimeout(resolve, 100));
    
    rerender(
      <PageTransition>
        <div data-testid="page-3">Page 3</div>
      </PageTransition>
    );

    // Should end up with only page 3 visible
    await waitFor(() => {
      expect(screen.queryByTestId('page-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('page-2')).not.toBeInTheDocument();
      expect(screen.getByTestId('page-3')).toBeVisible();
    }, { timeout: 800 });
  });
});

describe('LoadingAnimation', () => {
  it('should display loading animation during data fetch', async () => {
    const mockFetch = jest.fn(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(<LoadingAnimation isLoading={true} />);
    
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toBeVisible();
    expect(spinner).toHaveClass('animate-spin');
  });

  it('should show skeleton content for content loading', () => {
    render(<LoadingAnimation type="skeleton" />);
    
    const skeleton = screen.getByTestId('loading-skeleton');
    expect(skeleton).toBeVisible();
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('should hide loading animation when data is ready', async () => {
    const { rerender } = render(<LoadingAnimation isLoading={true} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeVisible();
    
    rerender(<LoadingAnimation isLoading={false} />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });
});
```

#### Integration Tests
```typescript
describe('Animation Integration', () => {
  it('should coordinate multiple animations in sequence', async () => {
    render(
      <AnimationSequence>
        <FadeIn delay={0}>
          <div data-testid="item-1">Item 1</div>
        </FadeIn>
        <FadeIn delay={200}>
          <div data-testid="item-2">Item 2</div>
        </FadeIn>
        <FadeIn delay={400}>
          <div data-testid="item-3">Item 3</div>
        </FadeIn>
      </AnimationSequence>
    );

    // Initially all items should be hidden
    expect(screen.getByTestId('item-1')).toHaveStyle({ opacity: '0' });
    expect(screen.getByTestId('item-2')).toHaveStyle({ opacity: '0' });
    expect(screen.getByTestId('item-3')).toHaveStyle({ opacity: '0' });

    // First item should fade in immediately
    await waitFor(() => {
      expect(screen.getByTestId('item-1')).toHaveStyle({ opacity: '1' });
    }, { timeout: 300 });

    // Second item should fade in after delay
    await waitFor(() => {
      expect(screen.getByTestId('item-2')).toHaveStyle({ opacity: '1' });
    }, { timeout: 500 });

    // Third item should fade in last
    await waitFor(() => {
      expect(screen.getByTestId('item-3')).toHaveStyle({ opacity: '1' });
    }, { timeout: 700 });
  });

  it('should handle animation preferences from context', () => {
    const mockPreferences = {
      animationLevel: 'reduced',
      reducedMotion: true,
      speedMultiplier: 0.5
    };

    render(
      <AnimationPreferencesProvider preferences={mockPreferences}>
        <AnimatedButton>Test Button</AnimatedButton>
      </AnimationPreferencesProvider>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('reduced-motion');
    
    // Animation duration should be halved
    const computedStyle = window.getComputedStyle(button);
    expect(computedStyle.transitionDuration).toBe('0.1s'); // 0.2s * 0.5
  });
});
```

### Performance Testing

#### Animation Performance Tests
```typescript
describe('Animation Performance', () => {
  let performanceObserver: PerformanceObserver;
  let performanceEntries: PerformanceEntry[];

  beforeEach(() => {
    performanceEntries = [];
    
    // Mock Performance Observer
    performanceObserver = {
      observe: jest.fn(),
      disconnect: jest.fn(),
      takeRecords: jest.fn(() => performanceEntries)
    } as any;

    global.PerformanceObserver = jest.fn(() => performanceObserver);
  });

  it('should maintain 60fps during button hover animation', async () => {
    const frameRates: number[] = [];
    let lastTime = performance.now();

    const measureFrameRate = () => {
      const currentTime = performance.now();
      const frameTime = currentTime - lastTime;
      frameRates.push(1000 / frameTime);
      lastTime = currentTime;
    };

    render(<AnimatedButton onAnimationFrame={measureFrameRate}>Hover Test</AnimatedButton>);

    const button = screen.getByRole('button');
    
    // Trigger hover animation
    fireEvent.mouseEnter(button);

    // Wait for animation to complete
    await new Promise(resolve => setTimeout(resolve, 300));

    // Calculate average frame rate
    const avgFrameRate = frameRates.reduce((a, b) => a + b, 0) / frameRates.length;
    expect(avgFrameRate).toBeGreaterThan(55); // Allow some tolerance for test environment
  });

  it('should complete page transitions within performance budget', async () => {
    const startTime = performance.now();
    
    const { rerender } = render(
      <PageTransition>
        <div data-testid="page-1">Page 1</div>
      </PageTransition>
    );

    rerender(
      <PageTransition>
        <div data-testid="page-2">Page 2</div>
      </PageTransition>
    );

    await waitFor(() => {
      expect(screen.getByTestId('page-2')).toBeVisible();
    });

    const endTime = performance.now();
    const transitionDuration = endTime - startTime;

    // Should complete within 600ms budget
    expect(transitionDuration).toBeLessThan(600);
  });

  it('should not cause memory leaks with repeated animations', async () => {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    // Render and unmount animated components repeatedly
    for (let i = 0; i < 100; i++) {
      const { unmount } = render(
        <div>
          <AnimatedButton key={i}>Button {i}</AnimatedButton>
          <FadeIn>
            <div>Content {i}</div>
          </FadeIn>
        </div>
      );
      
      // Trigger animations
      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);
      fireEvent.mouseLeave(button);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      unmount();
    }

    // Force garbage collection if available
    if ((global as any).gc) {
      (global as any).gc();
    }

    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be minimal (less than 1MB)
    expect(memoryIncrease).toBeLessThan(1024 * 1024);
  });

  it('should adapt performance based on device capabilities', () => {
    // Mock low-end device
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      value: 2,
      writable: true
    });
    
    Object.defineProperty(navigator, 'deviceMemory', {
      value: 2,
      writable: true
    });

    render(
      <DeviceAwareAnimation>
        <div data-testid="animated-content">Content</div>
      </DeviceAwareAnimation>
    );

    const content = screen.getByTestId('animated-content');
    
    // Should apply low-performance animation settings
    expect(content).toHaveClass('low-performance');
    expect(content).toHaveStyle({
      animationDuration: '0.15s' // Reduced from default 0.3s
    });
  });
});
```

### Accessibility Testing

#### Reduced Motion Tests
```typescript
describe('Reduced Motion Accessibility', () => {
  beforeEach(() => {
    // Reset matchMedia mock
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))
    });
  });

  it('should disable animations when prefers-reduced-motion is set', () => {
    // Mock reduced motion preference
    (window.matchMedia as jest.Mock).mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    render(<AnimatedButton>Accessible Button</AnimatedButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('no-animation');
    expect(button).toHaveStyle({
      transition: 'none'
    });
  });

  it('should provide alternative feedback for disabled animations', () => {
    (window.matchMedia as jest.Mock).mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    render(<AnimatedButton>Success Button</AnimatedButton>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Should show static visual feedback instead of animation
    expect(button).toHaveClass('success-static');
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('completed'));
  });

  it('should respect user animation preferences override', () => {
    const userPreferences = {
      animationLevel: 'none',
      reducedMotion: true
    };

    render(
      <AnimationPreferencesProvider preferences={userPreferences}>
        <PageTransition>
          <div data-testid="page-content">Content</div>
        </PageTransition>
      </AnimationPreferencesProvider>
    );

    // Page should appear immediately without transition
    expect(screen.getByTestId('page-content')).toBeVisible();
    expect(screen.getByTestId('page-content')).not.toHaveClass('transitioning');
  });
});

describe('Focus Management During Animations', () => {
  it('should maintain focus during page transitions', async () => {
    render(
      <div>
        <button data-testid="trigger-button">Go to Page 2</button>
        <PageTransition>
          <div data-testid="page-1">
            <input data-testid="input-1" />
          </div>
        </PageTransition>
      </div>
    );

    const input = screen.getByTestId('input-1');
    input.focus();
    expect(input).toHaveFocus();

    const triggerButton = screen.getByTestId('trigger-button');
    fireEvent.click(triggerButton);

    // Focus should be managed during transition
    await waitFor(() => {
      const focusedElement = document.activeElement;
      expect(focusedElement).not.toBe(input); // Focus moved from old page
      expect(focusedElement?.getAttribute('data-testid')).toBeTruthy(); // Focus on new page element
    });
  });

  it('should announce animation state changes to screen readers', async () => {
    const announcements: string[] = [];
    
    // Mock screen reader announcements
    const mockAnnounce = jest.fn((message: string) => {
      announcements.push(message);
    });

    render(
      <div>
        <div aria-live="polite" data-testid="announcements"></div>
        <LoadingAnimation 
          isLoading={true} 
          onStatusChange={mockAnnounce}
        />
      </div>
    );

    expect(mockAnnounce).toHaveBeenCalledWith('Loading started');

    // Complete loading
    const { rerender } = render(
      <LoadingAnimation 
        isLoading={false} 
        onStatusChange={mockAnnounce}
      />
    );

    await waitFor(() => {
      expect(mockAnnounce).toHaveBeenCalledWith('Loading completed');
    });
  });
});
```

### E2E Animation Tests

#### Visual Regression Tests
```typescript
describe('Animation Visual Regression', () => {
  let page: Page;

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
  });

  afterEach(async () => {
    await page.close();
  });

  it('should match button hover animation snapshots', async () => {
    await page.goto('/components/buttons');
    
    const button = await page.waitForSelector('[data-testid="animated-button"]');
    
    // Take screenshot of initial state
    const initialScreenshot = await button.screenshot();
    expect(initialScreenshot).toMatchImageSnapshot({
      identifier: 'button-initial-state'
    });

    // Hover and take screenshot
    await page.hover('[data-testid="animated-button"]');
    await page.waitForTimeout(100); // Wait for hover animation
    
    const hoverScreenshot = await button.screenshot();
    expect(hoverScreenshot).toMatchImageSnapshot({
      identifier: 'button-hover-state'
    });
  });

  it('should smoothly transition between pages', async () => {
    await page.goto('/dashboard');
    
    // Record page transition
    await page.click('[data-testid="tasks-nav-link"]');
    
    // Wait for transition to complete
    await page.waitForSelector('[data-testid="tasks-page"]', { visible: true });
    
    // Take screenshot of final state
    const finalScreenshot = await page.screenshot();
    expect(finalScreenshot).toMatchImageSnapshot({
      identifier: 'page-transition-complete'
    });
  });

  it('should display loading animations correctly', async () => {
    await page.goto('/dashboard');
    
    // Trigger loading state
    await page.evaluate(() => {
      // Simulate slow network
      return new Promise(resolve => setTimeout(resolve, 2000));
    });

    // Wait for loading animation
    await page.waitForSelector('[data-testid="loading-spinner"]', { visible: true });
    
    const loadingScreenshot = await page.screenshot();
    expect(loadingScreenshot).toMatchImageSnapshot({
      identifier: 'loading-animation'
    });
  });
});

describe('Cross-Browser Animation Tests', () => {
  const browsers = ['chromium', 'firefox', 'webkit'];

  browsers.forEach(browserName => {
    describe(`${browserName} animations`, () => {
      let browserInstance: Browser;
      let page: Page;

      beforeAll(async () => {
        browserInstance = await playwright[browserName].launch();
      });

      afterAll(async () => {
        await browserInstance.close();
      });

      beforeEach(async () => {
        page = await browserInstance.newPage();
      });

      afterEach(async () => {
        await page.close();
      });

      it('should render animations consistently', async () => {
        await page.goto('/components/animations');
        
        // Wait for animations to settle
        await page.waitForTimeout(1000);
        
        const screenshot = await page.screenshot();
        expect(screenshot).toMatchImageSnapshot({
          identifier: `animations-${browserName}`
        });
      });

      it('should handle animation performance consistently', async () => {
        await page.goto('/dashboard');
        
        // Measure animation performance
        const metrics = await page.evaluate(() => {
          return new Promise((resolve) => {
            const observer = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const animationEntries = entries.filter(entry => 
                entry.name.includes('animation')
              );
              
              if (animationEntries.length > 0) {
                resolve({
                  count: animationEntries.length,
                  avgDuration: animationEntries.reduce((sum, entry) => 
                    sum + entry.duration, 0) / animationEntries.length
                });
              }
            });
            
            observer.observe({ entryTypes: ['measure'] });
            
            // Trigger some animations
            document.querySelector('[data-testid="animated-button"]')?.dispatchEvent(
              new Event('mouseenter')
            );
            
            setTimeout(() => resolve({ count: 0, avgDuration: 0 }), 2000);
          });
        });

        expect(metrics.avgDuration).toBeLessThan(100); // Animations under 100ms
      });
    });
  });
});
```

## Mocking Requirements

### Animation Library Mocks

#### Framer Motion Mock
```typescript
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => children,
  useAnimation: () => ({
    start: jest.fn().mockResolvedValue({}),
    stop: jest.fn(),
    set: jest.fn(),
  }),
  useMotionValue: (initialValue: any) => ({
    get: () => initialValue,
    set: jest.fn(),
    on: jest.fn(),
  }),
  useSpring: (value: any) => ({ get: () => value, set: jest.fn() }),
  useTransform: (input: any, output: any) => ({ get: () => output[0] }),
}));
```

#### React Spring Mock
```typescript
jest.mock('@react-spring/web', () => ({
  useSpring: (config: any) => [
    config.to || config.config?.to || {},
    jest.fn(),
  ],
  useTransition: (items: any, config: any) => 
    items.map((item: any) => ({
      item,
      key: item.key || Math.random(),
      props: config.to || {},
    })),
  animated: {
    div: 'div',
    button: 'button',
    span: 'span',
  },
  config: {
    default: { tension: 170, friction: 26 },
    wobbly: { tension: 180, friction: 12 },
    stiff: { tension: 210, friction: 20 },
  },
}));
```

#### Performance Observer Mock
```typescript
class MockPerformanceObserver {
  private callback: PerformanceObserverCallback;
  private entries: PerformanceEntry[] = [];

  constructor(callback: PerformanceObserverCallback) {
    this.callback = callback;
  }

  observe(options: PerformanceObserverInit) {
    // Mock implementation
  }

  disconnect() {
    // Mock implementation
  }

  takeRecords(): PerformanceEntry[] {
    return this.entries;
  }

  // Test helper to add mock entries
  addMockEntry(entry: PerformanceEntry) {
    this.entries.push(entry);
    this.callback(new MockPerformanceObserverEntryList([entry]), this);
  }
}

class MockPerformanceObserverEntryList implements PerformanceObserverEntryList {
  constructor(private entries: PerformanceEntry[]) {}

  getEntries(): PerformanceEntry[] {
    return this.entries;
  }

  getEntriesByName(name: string): PerformanceEntry[] {
    return this.entries.filter(entry => entry.name === name);
  }

  getEntriesByType(type: string): PerformanceEntry[] {
    return this.entries.filter(entry => entry.entryType === type);
  }
}

global.PerformanceObserver = MockPerformanceObserver as any;
```

### Testing Utilities

#### Animation Testing Helpers
```typescript
export const AnimationTestUtils = {
  // Wait for animation to complete
  waitForAnimation: async (element: HTMLElement, timeout = 1000) => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkAnimation = () => {
        const computedStyle = window.getComputedStyle(element);
        const isAnimating = computedStyle.animationName !== 'none' ||
                           computedStyle.transitionProperty !== 'none';
        
        if (!isAnimating || Date.now() - startTime > timeout) {
          resolve(void 0);
        } else {
          requestAnimationFrame(checkAnimation);
        }
      };
      
      checkAnimation();
    });
  },

  // Mock animation frame timing
  mockAnimationFrame: (callback: (time: number) => void, duration = 1000) => {
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      callback(elapsed / duration);
      
      if (elapsed < duration) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  },

  // Check if element has active animations
  hasActiveAnimations: (element: HTMLElement): boolean => {
    const computedStyle = window.getComputedStyle(element);
    return computedStyle.animationName !== 'none' ||
           computedStyle.transitionProperty !== 'none';
  },

  // Get animation duration from computed style
  getAnimationDuration: (element: HTMLElement): number => {
    const computedStyle = window.getComputedStyle(element);
    const duration = parseFloat(computedStyle.animationDuration) * 1000;
    const transitionDuration = parseFloat(computedStyle.transitionDuration) * 1000;
    return Math.max(duration || 0, transitionDuration || 0);
  }
};

export const createAnimationTestComponent = (
  animationType: 'fade' | 'slide' | 'scale',
  duration = 300
) => {
  return ({ children, ...props }: any) => (
    <div
      data-testid="animated-component"
      data-animation-type={animationType}
      style={{
        transition: `all ${duration}ms ease`,
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  );
};
```

#### Performance Testing Helpers
```typescript
export const PerformanceTestUtils = {
  // Measure frame rate during animation
  measureFrameRate: async (
    triggerAnimation: () => void,
    duration = 1000
  ): Promise<number[]> => {
    const frameRates: number[] = [];
    let lastTime = performance.now();
    let animationFrame: number;

    const measureFrame = () => {
      const currentTime = performance.now();
      const frameTime = currentTime - lastTime;
      frameRates.push(1000 / frameTime);
      lastTime = currentTime;
      
      if (currentTime - (performance.now() - duration) < duration) {
        animationFrame = requestAnimationFrame(measureFrame);
      }
    };

    triggerAnimation();
    animationFrame = requestAnimationFrame(measureFrame);

    return new Promise((resolve) => {
      setTimeout(() => {
        cancelAnimationFrame(animationFrame);
        resolve(frameRates);
      }, duration);
    });
  },

  // Check memory usage during animations
  measureMemoryUsage: async (
    animationCount = 100
  ): Promise<{ before: number; after: number; delta: number }> => {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    // Force garbage collection if available
    if ((global as any).gc) {
      (global as any).gc();
    }
    
    const beforeMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    // Trigger multiple animations
    for (let i = 0; i < animationCount; i++) {
      const element = document.createElement('div');
      element.style.transition = 'all 0.3s ease';
      element.style.transform = 'translateX(100px)';
      document.body.appendChild(element);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      element.remove();
    }
    
    // Force garbage collection again
    if ((global as any).gc) {
      (global as any).gc();
    }
    
    const afterMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    return {
      before: beforeMemory,
      after: afterMemory,
      delta: afterMemory - beforeMemory
    };
  },

  // Simulate device performance constraints
  simulateSlowDevice: () => {
    // Mock low-end device characteristics
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      value: 2,
      writable: true
    });
    
    Object.defineProperty(navigator, 'deviceMemory', {
      value: 2,
      writable: true
    });
    
    // Artificially slow down animations
    const originalRequestAnimationFrame = requestAnimationFrame;
    global.requestAnimationFrame = (callback: FrameRequestCallback) => {
      return originalRequestAnimationFrame(() => {
        // Add delay to simulate slower device
        setTimeout(callback, 5);
      });
    };
  }
};
```