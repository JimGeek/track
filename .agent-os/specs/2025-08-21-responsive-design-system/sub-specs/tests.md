# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-08-21-responsive-design-system/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Test Coverage

### Responsive Breakpoint Tests

#### Unit Tests
```typescript
describe('ResponsiveBreakpoints', () => {
  describe('useBreakpoint hook', () => {
    it('should detect mobile breakpoint correctly', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { result } = renderHook(() => useBreakpoint());
      
      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(false);
      expect(result.current.breakpoint).toBe('mobile');
    });

    it('should detect tablet breakpoint correctly', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const { result } = renderHook(() => useBreakpoint());
      
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isDesktop).toBe(false);
      expect(result.current.breakpoint).toBe('tablet');
    });

    it('should update breakpoint on window resize', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { result } = renderHook(() => useBreakpoint());
      expect(result.current.breakpoint).toBe('mobile');

      // Simulate resize to tablet
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      fireEvent(window, new Event('resize'));

      expect(result.current.breakpoint).toBe('tablet');
    });
  });

  describe('ResponsiveContainer', () => {
    it('should render mobile layout for small screens', () => {
      const { container } = render(
        <ResponsiveContainer>
          <div data-testid="mobile-content">Mobile</div>
          <div data-testid="desktop-content">Desktop</div>
        </ResponsiveContainer>
      );

      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      fireEvent(window, new Event('resize'));

      expect(screen.getByTestId('mobile-content')).toBeVisible();
      expect(screen.queryByTestId('desktop-content')).not.toBeInTheDocument();
    });
  });
});
```

#### Integration Tests
```typescript
describe('Responsive Layout Integration', () => {
  const resizeViewport = (width: number, height: number) => {
    Object.defineProperty(window, 'innerWidth', { 
      writable: true, 
      configurable: true, 
      value: width 
    });
    Object.defineProperty(window, 'innerHeight', { 
      writable: true, 
      configurable: true, 
      value: height 
    });
    fireEvent(window, new Event('resize'));
  };

  it('should adapt navigation for different screen sizes', () => {
    render(<App />);

    // Mobile navigation (bottom tabs)
    resizeViewport(375, 667);
    expect(screen.getByTestId('bottom-navigation')).toBeVisible();
    expect(screen.queryByTestId('sidebar-navigation')).not.toBeInTheDocument();

    // Desktop navigation (sidebar)
    resizeViewport(1440, 900);
    expect(screen.getByTestId('sidebar-navigation')).toBeVisible();
    expect(screen.queryByTestId('bottom-navigation')).not.toBeInTheDocument();
  });

  it('should show appropriate task list layout per breakpoint', () => {
    render(<TaskListPage />);

    // Mobile: single column, card layout
    resizeViewport(375, 667);
    const mobileContainer = screen.getByTestId('task-list-container');
    expect(mobileContainer).toHaveClass('grid-cols-1');
    expect(screen.getAllByTestId('task-card')).toHaveLength(5);

    // Desktop: multi-column, table layout
    resizeViewport(1440, 900);
    const desktopContainer = screen.getByTestId('task-list-container');
    expect(desktopContainer).toHaveClass('grid-cols-3');
    expect(screen.getByTestId('task-table')).toBeVisible();
  });
});
```

### Touch Interaction Tests

#### Unit Tests
```typescript
describe('TouchInteractions', () => {
  describe('SwipeGesture component', () => {
    it('should detect swipe left gesture', async () => {
      const onSwipeLeft = jest.fn();
      render(
        <SwipeGesture onSwipeLeft={onSwipeLeft}>
          <div data-testid="swipeable-item">Swipe me</div>
        </SwipeGesture>
      );

      const swipeableItem = screen.getByTestId('swipeable-item');
      
      // Simulate touch start
      fireEvent.touchStart(swipeableItem, {
        touches: [{ clientX: 200, clientY: 100 }]
      });

      // Simulate touch move (swipe left)
      fireEvent.touchMove(swipeableItem, {
        touches: [{ clientX: 50, clientY: 100 }]
      });

      // Simulate touch end
      fireEvent.touchEnd(swipeableItem, {
        changedTouches: [{ clientX: 50, clientY: 100 }]
      });

      await waitFor(() => {
        expect(onSwipeLeft).toHaveBeenCalledWith(expect.objectContaining({
          distance: 150,
          velocity: expect.any(Number)
        }));
      });
    });

    it('should detect long press gesture', async () => {
      const onLongPress = jest.fn();
      render(
        <TouchTarget onLongPress={onLongPress} longPressDelay={500}>
          <div data-testid="long-press-target">Long press me</div>
        </TouchTarget>
      );

      const target = screen.getByTestId('long-press-target');
      
      fireEvent.touchStart(target, {
        touches: [{ clientX: 100, clientY: 100 }]
      });

      // Wait for long press delay
      await waitFor(() => {
        expect(onLongPress).toHaveBeenCalled();
      }, { timeout: 600 });
    });

    it('should provide haptic feedback when supported', async () => {
      const mockVibrate = jest.fn();
      Object.defineProperty(navigator, 'vibrate', {
        value: mockVibrate,
        writable: true
      });

      const onTap = jest.fn();
      render(
        <TouchTarget onTap={onTap} hapticFeedback={true}>
          <div data-testid="haptic-target">Tap me</div>
        </TouchTarget>
      );

      const target = screen.getByTestId('haptic-target');
      fireEvent.touchStart(target);
      fireEvent.touchEnd(target);

      expect(mockVibrate).toHaveBeenCalledWith([10]);
      expect(onTap).toHaveBeenCalled();
    });
  });

  describe('DragAndDrop touch implementation', () => {
    it('should handle touch-based drag and drop', async () => {
      const onDrop = jest.fn();
      render(
        <div>
          <DraggableItem id="item1">
            <div data-testid="draggable-item">Drag me</div>
          </DraggableItem>
          <DropZone onDrop={onDrop}>
            <div data-testid="drop-zone">Drop here</div>
          </DropZone>
        </div>
      );

      const draggableItem = screen.getByTestId('draggable-item');
      const dropZone = screen.getByTestId('drop-zone');

      // Start touch drag
      fireEvent.touchStart(draggableItem, {
        touches: [{ clientX: 100, clientY: 100 }]
      });

      // Move to drop zone
      fireEvent.touchMove(document, {
        touches: [{ clientX: 200, clientY: 150 }]
      });

      // End drag over drop zone
      fireEvent.touchEnd(dropZone, {
        changedTouches: [{ clientX: 200, clientY: 150 }]
      });

      await waitFor(() => {
        expect(onDrop).toHaveBeenCalledWith(expect.objectContaining({
          itemId: 'item1'
        }));
      });
    });
  });
});
```

#### E2E Touch Tests
```typescript
describe('Touch Interactions E2E', () => {
  beforeEach(async () => {
    // Set up mobile viewport
    await page.setViewport({ width: 375, height: 667 });
    await page.goto('/dashboard');
  });

  it('should complete task with swipe gesture', async () => {
    const taskItem = await page.waitForSelector('[data-testid="task-item"]:first-child');
    
    // Perform swipe right gesture
    const box = await taskItem.boundingBox();
    await page.touchscreen.tap(box.x + 10, box.y + box.height / 2);
    await page.touchscreen.tap(box.x + box.width - 10, box.y + box.height / 2);
    
    // Verify task completed
    await page.waitForSelector('[data-testid="task-completed-indicator"]');
    const completedTask = await page.$('[data-testid="task-completed-indicator"]');
    expect(completedTask).toBeTruthy();
  });

  it('should open context menu with long press', async () => {
    const taskItem = await page.waitForSelector('[data-testid="task-item"]:first-child');
    
    // Long press gesture
    const box = await taskItem.boundingBox();
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(600); // Long press duration
    
    // Verify context menu appears
    const contextMenu = await page.waitForSelector('[data-testid="context-menu"]');
    expect(contextMenu).toBeTruthy();
    
    // Verify menu options
    const editOption = await page.$('[data-testid="context-menu-edit"]');
    const deleteOption = await page.$('[data-testid="context-menu-delete"]');
    expect(editOption).toBeTruthy();
    expect(deleteOption).toBeTruthy();
  });

  it('should handle pull-to-refresh', async () => {
    await page.goto('/dashboard');
    
    // Simulate pull-to-refresh gesture
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    
    const startY = 50;
    const endY = 200;
    
    await page.touchscreen.tap(200, startY);
    await page.touchscreen.tap(200, endY);
    
    // Wait for refresh indicator
    await page.waitForSelector('[data-testid="pull-refresh-indicator"]', { timeout: 1000 });
    
    // Wait for refresh completion
    await page.waitForSelector('[data-testid="pull-refresh-indicator"]', { 
      hidden: true, 
      timeout: 3000 
    });
    
    // Verify data refreshed
    const refreshedIndicator = await page.$('[data-testid="data-refreshed-indicator"]');
    expect(refreshedIndicator).toBeTruthy();
  });
});
```

### Progressive Web App Tests

#### Unit Tests
```typescript
describe('PWA Functionality', () => {
  describe('Service Worker', () => {
    beforeEach(() => {
      // Mock service worker
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          register: jest.fn().mockResolvedValue({
            installing: null,
            waiting: null,
            active: { postMessage: jest.fn() }
          }),
          ready: Promise.resolve({
            active: { postMessage: jest.fn() }
          })
        },
        writable: true
      });
    });

    it('should register service worker successfully', async () => {
      const { register } = await import('../utils/serviceWorker');
      
      await register();
      
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
    });

    it('should handle service worker updates', async () => {
      const mockRegistration = {
        waiting: { postMessage: jest.fn() },
        addEventListener: jest.fn()
      };
      
      const { handleUpdate } = await import('../utils/serviceWorker');
      const onUpdate = jest.fn();
      
      handleUpdate(mockRegistration as any, onUpdate);
      
      // Simulate update available
      const updateCallback = mockRegistration.addEventListener.mock.calls.find(
        call => call[0] === 'updatefound'
      )[1];
      
      updateCallback();
      
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  describe('Install Prompt', () => {
    it('should show custom install prompt', async () => {
      const mockPromptEvent = {
        preventDefault: jest.fn(),
        prompt: jest.fn().mockResolvedValue({}),
        userChoice: Promise.resolve({ outcome: 'accepted' })
      };

      // Mock beforeinstallprompt event
      window.dispatchEvent(new CustomEvent('beforeinstallprompt', {
        detail: mockPromptEvent
      }));

      render(<PWAInstallPrompt />);
      
      const installButton = screen.getByTestId('pwa-install-button');
      expect(installButton).toBeVisible();
      
      fireEvent.click(installButton);
      
      await waitFor(() => {
        expect(mockPromptEvent.prompt).toHaveBeenCalled();
      });
    });

    it('should track installation metrics', async () => {
      const mockApi = jest.fn().mockResolvedValue({});
      jest.spyOn(require('../api/pwa'), 'trackInstallation').mockImplementation(mockApi);

      const { trackPWAInstall } = await import('../utils/pwaTracking');
      
      await trackPWAInstall({
        source: 'custom_prompt',
        platform: 'android'
      });
      
      expect(mockApi).toHaveBeenCalledWith(expect.objectContaining({
        installation_source: 'custom_prompt',
        platform: 'android'
      }));
    });
  });

  describe('Background Sync', () => {
    it('should queue actions when offline', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      const { queueAction } = await import('../utils/backgroundSync');
      
      await queueAction({
        type: 'CREATE_TASK',
        data: { title: 'Offline task', listId: 'list1' }
      });
      
      // Verify action queued in IndexedDB
      const { db } = await import('../utils/database');
      const queuedActions = await db.syncQueue.toArray();
      
      expect(queuedActions).toHaveLength(1);
      expect(queuedActions[0].type).toBe('CREATE_TASK');
    });

    it('should sync queued actions when online', async () => {
      const mockSync = jest.fn().mockResolvedValue({ success: true });
      jest.spyOn(require('../api/sync'), 'processSync').mockImplementation(mockSync);

      // Add items to sync queue
      const { db } = await import('../utils/database');
      await db.syncQueue.add({
        id: '1',
        type: 'CREATE_TASK',
        data: { title: 'Test task' },
        timestamp: Date.now()
      });

      const { processSyncQueue } = await import('../utils/backgroundSync');
      
      await processSyncQueue();
      
      expect(mockSync).toHaveBeenCalledWith(expect.objectContaining({
        actions: expect.arrayContaining([
          expect.objectContaining({
            type: 'CREATE_TASK',
            data: { title: 'Test task' }
          })
        ])
      }));
    });
  });
});
```

#### E2E PWA Tests
```typescript
describe('PWA E2E Tests', () => {
  it('should work offline after first visit', async () => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Ensure page is cached
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Go offline
    await page.setOfflineMode(true);
    
    // Reload page - should work from cache
    await page.reload();
    await page.waitForSelector('[data-testid="task-list"]', { timeout: 5000 });
    
    // Verify offline indicator
    const offlineIndicator = await page.$('[data-testid="offline-indicator"]');
    expect(offlineIndicator).toBeTruthy();
  });

  it('should queue actions while offline and sync when online', async () => {
    await page.goto('/dashboard');
    
    // Go offline
    await page.setOfflineMode(true);
    
    // Create task while offline
    await page.click('[data-testid="create-task-button"]');
    await page.fill('[data-testid="task-title-input"]', 'Offline task');
    await page.click('[data-testid="save-task-button"]');
    
    // Verify task appears with offline indicator
    const offlineTask = await page.waitForSelector('[data-testid="task-item"][data-offline="true"]');
    expect(offlineTask).toBeTruthy();
    
    // Go back online
    await page.setOfflineMode(false);
    
    // Wait for sync
    await page.waitForSelector('[data-testid="sync-indicator"]', { timeout: 5000 });
    await page.waitForSelector('[data-testid="sync-indicator"]', { hidden: true, timeout: 10000 });
    
    // Verify task synced (no longer marked as offline)
    const syncedTask = await page.$('[data-testid="task-item"][data-offline="false"]');
    expect(syncedTask).toBeTruthy();
  });

  it('should support PWA installation flow', async () => {
    await page.goto('/dashboard');
    
    // Trigger install prompt
    await page.evaluate(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'));
    });
    
    // Wait for custom install prompt
    const installPrompt = await page.waitForSelector('[data-testid="pwa-install-prompt"]');
    expect(installPrompt).toBeTruthy();
    
    // Click install
    await page.click('[data-testid="pwa-install-button"]');
    
    // Verify installation tracking
    await page.waitForFunction(() => {
      return window.localStorage.getItem('pwa-install-tracked') === 'true';
    });
  });
});
```

### Responsive Image Tests

#### Unit Tests
```typescript
describe('ResponsiveImage', () => {
  it('should render appropriate image sizes for different viewports', () => {
    const { container, rerender } = render(
      <ResponsiveImage
        src="/images/task-image"
        alt="Task image"
        breakpoints={{
          mobile: '300w',
          tablet: '600w',
          desktop: '1200w'
        }}
      />
    );

    const img = container.querySelector('img');
    expect(img).toHaveAttribute('srcset');
    
    const srcset = img.getAttribute('srcset');
    expect(srcset).toContain('/images/task-image?w=300 300w');
    expect(srcset).toContain('/images/task-image?w=600 600w');
    expect(srcset).toContain('/images/task-image?w=1200 1200w');
  });

  it('should lazy load images below the fold', () => {
    const mockIntersectionObserver = jest.fn();
    mockIntersectionObserver.mockReturnValue({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn()
    });
    
    Object.defineProperty(window, 'IntersectionObserver', {
      writable: true,
      configurable: true,
      value: mockIntersectionObserver
    });

    render(
      <ResponsiveImage
        src="/images/below-fold"
        alt="Below fold image"
        lazy={true}
      />
    );

    expect(mockIntersectionObserver).toHaveBeenCalled();
  });

  it('should use WebP format when supported', async () => {
    // Mock WebP support
    Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
      value: jest.fn(() => 'data:image/webp;base64,test')
    });

    const { formatSupport } = await import('../utils/imageFormats');
    const supportsWebP = await formatSupport.webp();
    
    expect(supportsWebP).toBe(true);
    
    render(
      <ResponsiveImage
        src="/images/test"
        alt="Test image"
        preferWebP={true}
      />
    );

    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toContain('.webp');
  });
});
```

### Adaptive Loading Tests

#### Unit Tests
```typescript
describe('AdaptiveLoading', () => {
  describe('useNetworkStatus hook', () => {
    it('should detect slow connection and enable data saver', () => {
      // Mock Network Information API
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '2g',
          downlink: 0.5,
          saveData: true
        },
        writable: true
      });

      const { result } = renderHook(() => useNetworkStatus());
      
      expect(result.current.effectiveType).toBe('2g');
      expect(result.current.isSlowConnection).toBe(true);
      expect(result.current.saveData).toBe(true);
    });

    it('should adapt data loading based on connection', async () => {
      Object.defineProperty(navigator, 'connection', {
        value: { effectiveType: '2g', downlink: 0.5 }
      });

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ tasks: [], meta: { limited: true } })
      });
      global.fetch = mockFetch;

      const { result } = renderHook(() => useAdaptiveData('/api/tasks'));
      
      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      // Verify reduced data request
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=10'), // Reduced limit for slow connection
        expect.any(Object)
      );
    });
  });

  describe('AdaptiveImageLoader', () => {
    it('should load lower quality images on slow connections', () => {
      Object.defineProperty(navigator, 'connection', {
        value: { effectiveType: '2g' }
      });

      render(
        <AdaptiveImageLoader
          src="/images/high-res-image.jpg"
          alt="Adaptive image"
        />
      );

      const img = screen.getByRole('img');
      expect(img.getAttribute('src')).toContain('quality=low');
    });
  });
});
```

## Mocking Requirements

### Device and Browser Mocks

#### Touch Event Mocks
```typescript
// Mock touch events for testing
Object.defineProperty(window, 'TouchEvent', {
  value: class TouchEvent extends UIEvent {
    touches: Touch[];
    targetTouches: Touch[];
    changedTouches: Touch[];
    
    constructor(type: string, options: any = {}) {
      super(type, options);
      this.touches = options.touches || [];
      this.targetTouches = options.targetTouches || [];
      this.changedTouches = options.changedTouches || [];
    }
  }
});

// Mock Touch interface
class MockTouch implements Touch {
  identifier: number;
  target: EventTarget;
  screenX: number;
  screenY: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  radiusX: number = 1;
  radiusY: number = 1;
  rotationAngle: number = 0;
  force: number = 1;

  constructor(options: Partial<Touch>) {
    Object.assign(this, options);
  }
}

global.Touch = MockTouch as any;
```

#### Service Worker Mock
```typescript
// Mock Service Worker API
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: jest.fn(() => Promise.resolve({
      installing: null,
      waiting: null,
      active: {
        scriptURL: '/sw.js',
        state: 'activated',
        postMessage: jest.fn()
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      update: jest.fn(() => Promise.resolve()),
      unregister: jest.fn(() => Promise.resolve(true))
    })),
    ready: Promise.resolve({
      installing: null,
      waiting: null,
      active: {
        scriptURL: '/sw.js',
        state: 'activated',
        postMessage: jest.fn()
      }
    }),
    controller: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    getRegistration: jest.fn(() => Promise.resolve(null)),
    getRegistrations: jest.fn(() => Promise.resolve([]))
  }
});
```

#### IndexedDB Mock
```typescript
import FDBFactory from 'fake-indexeddb/lib/FDBFactory';
import FDBKeyRange from 'fake-indexeddb/lib/FDBKeyRange';

// Mock IndexedDB for testing
Object.defineProperty(window, 'indexedDB', { value: new FDBFactory() });
Object.defineProperty(window, 'IDBKeyRange', { value: FDBKeyRange });

// Mock Dexie database
jest.mock('../utils/database', () => ({
  db: {
    syncQueue: {
      add: jest.fn().mockResolvedValue('mock-id'),
      toArray: jest.fn().mockResolvedValue([]),
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          delete: jest.fn().mockResolvedValue(1)
        }))
      })),
      clear: jest.fn().mockResolvedValue(undefined)
    },
    tasks: {
      add: jest.fn().mockResolvedValue('mock-task-id'),
      toArray: jest.fn().mockResolvedValue([]),
      get: jest.fn().mockResolvedValue(null),
      put: jest.fn().mockResolvedValue('mock-task-id'),
      delete: jest.fn().mockResolvedValue(undefined)
    }
  }
}));
```

#### Network Information Mock
```typescript
// Mock Network Information API
Object.defineProperty(navigator, 'connection', {
  value: {
    effectiveType: '4g',
    downlink: 10,
    downlinkMax: Infinity,
    rtt: 100,
    saveData: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  },
  writable: true
});

// Utility to change network conditions in tests
export const setNetworkConditions = (conditions: Partial<NetworkInformation>) => {
  Object.assign(navigator.connection, conditions);
};
```

### Testing Utilities

#### Responsive Testing Helper
```typescript
export const createResponsiveTest = (breakpoints: Record<string, number>) => {
  return (testName: string, testFn: (breakpoint: string, width: number) => void) => {
    Object.entries(breakpoints).forEach(([breakpoint, width]) => {
      test(`${testName} - ${breakpoint}`, () => {
        // Set viewport size
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width
        });
        
        // Trigger resize event
        fireEvent(window, new Event('resize'));
        
        testFn(breakpoint, width);
      });
    });
  };
};

// Usage example
const responsiveTest = createResponsiveTest({
  mobile: 375,
  tablet: 768,
  desktop: 1440
});

responsiveTest('should adapt layout correctly', (breakpoint, width) => {
  render(<ResponsiveComponent />);
  
  if (breakpoint === 'mobile') {
    expect(screen.getByTestId('mobile-layout')).toBeVisible();
  } else if (breakpoint === 'desktop') {
    expect(screen.getByTestId('desktop-layout')).toBeVisible();
  }
});
```

#### Touch Simulation Utilities
```typescript
export const simulateTouch = {
  tap: (element: HTMLElement, coordinates = { x: 0, y: 0 }) => {
    const touch = new MockTouch({
      identifier: 1,
      target: element,
      clientX: coordinates.x,
      clientY: coordinates.y,
      pageX: coordinates.x,
      pageY: coordinates.y
    });

    fireEvent.touchStart(element, { touches: [touch] });
    fireEvent.touchEnd(element, { changedTouches: [touch] });
  },

  swipe: (element: HTMLElement, start: { x: number, y: number }, end: { x: number, y: number }) => {
    const startTouch = new MockTouch({
      identifier: 1,
      target: element,
      clientX: start.x,
      clientY: start.y
    });

    const endTouch = new MockTouch({
      identifier: 1,
      target: element,
      clientX: end.x,
      clientY: end.y
    });

    fireEvent.touchStart(element, { touches: [startTouch] });
    fireEvent.touchMove(element, { touches: [endTouch] });
    fireEvent.touchEnd(element, { changedTouches: [endTouch] });
  },

  longPress: async (element: HTMLElement, duration = 600) => {
    const touch = new MockTouch({
      identifier: 1,
      target: element,
      clientX: 0,
      clientY: 0
    });

    fireEvent.touchStart(element, { touches: [touch] });
    
    await new Promise(resolve => setTimeout(resolve, duration));
    
    fireEvent.touchEnd(element, { changedTouches: [touch] });
  }
};
```

#### PWA Testing Utilities
```typescript
export const PWATestUtils = {
  mockInstallPrompt: () => {
    const mockPrompt = {
      preventDefault: jest.fn(),
      prompt: jest.fn().mockResolvedValue({}),
      userChoice: Promise.resolve({ outcome: 'accepted' })
    };

    window.dispatchEvent(new CustomEvent('beforeinstallprompt', {
      detail: mockPrompt
    } as any));

    return mockPrompt;
  },

  mockOfflineMode: () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    window.dispatchEvent(new Event('offline'));
  },

  mockOnlineMode: () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });

    window.dispatchEvent(new Event('online'));
  },

  waitForSyncComplete: () => {
    return new Promise((resolve) => {
      const handler = (event: CustomEvent) => {
        if (event.detail.status === 'completed') {
          window.removeEventListener('sync-status-change', handler);
          resolve(event.detail);
        }
      };
      window.addEventListener('sync-status-change', handler);
    });
  }
};
```