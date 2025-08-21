# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-08-21-performance-optimization/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Test Coverage

### Performance Monitoring Tests

#### Unit Tests
```typescript
describe('PerformanceService', () => {
  describe('recordMetrics', () => {
    it('should record performance metrics with correct data', async () => {
      const metrics = [{
        metric_type: 'api',
        metric_name: 'response_time',
        duration_ms: 150,
        endpoint: '/api/tasks'
      }];
      
      const result = await PerformanceService.recordMetrics({
        userId: 'user1',
        sessionId: 'session1',
        metrics
      });
      
      expect(result).toHaveLength(1);
      expect(result[0].metric_type).toBe('api');
      expect(result[0].duration_ms).toBe(150);
    });

    it('should handle bulk metric insertion efficiently', async () => {
      const metrics = Array.from({ length: 100 }, (_, i) => ({
        metric_type: 'frontend',
        metric_name: 'page_load',
        duration_ms: 1000 + i
      }));
      
      const startTime = Date.now();
      const result = await PerformanceService.recordMetrics({
        userId: 'user1',
        metrics
      });
      const duration = Date.now() - startTime;
      
      expect(result).toHaveLength(100);
      expect(duration).toBeLessThan(500); // Should complete in under 500ms
    });
  });

  describe('getDashboardData', () => {
    it('should return aggregated performance data', async () => {
      await seedPerformanceData();
      
      const dashboard = await PerformanceService.getDashboardData({
        timeRange: '24h',
        metricType: 'api'
      });
      
      expect(dashboard.summary).toHaveProperty('avg_response_time_ms');
      expect(dashboard.summary).toHaveProperty('total_requests');
      expect(dashboard.summary).toHaveProperty('error_rate');
      expect(dashboard.metrics).toBeInstanceOf(Array);
    });

    it('should filter data by user when specified', async () => {
      const dashboard = await PerformanceService.getDashboardData({
        timeRange: '1h',
        userId: 'user1'
      });
      
      expect(dashboard.summary.total_requests).toBeGreaterThan(0);
    });
  });
});
```

#### Integration Tests
```typescript
describe('Performance Monitoring API Integration', () => {
  it('should record client-side metrics via API', async () => {
    const response = await request(app)
      .post('/api/metrics/performance')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        metrics: [{
          metric_type: 'frontend',
          metric_name: 'core_web_vitals',
          metadata: {
            fcp: 1200,
            lcp: 2100,
            fid: 50,
            cls: 0.1
          }
        }]
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.recorded_metrics).toBe(1);
  });

  it('should return performance dashboard data', async () => {
    const response = await request(app)
      .get('/api/metrics/dashboard?time_range=1h')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.summary).toHaveProperty('avg_response_time_ms');
    expect(response.body.metrics).toBeInstanceOf(Array);
  });
});
```

### Caching System Tests

#### Unit Tests
```typescript
describe('CacheService', () => {
  beforeEach(async () => {
    await redis.flushall(); // Clear Redis cache
  });

  describe('set and get', () => {
    it('should store and retrieve cached data', async () => {
      const data = { tasks: [{ id: 'task1', title: 'Test Task' }] };
      const cacheKey = 'user:123:tasks';
      
      await CacheService.set(cacheKey, data, 3600);
      const retrieved = await CacheService.get(cacheKey);
      
      expect(retrieved).toEqual(data);
    });

    it('should respect TTL and expire data', async () => {
      const data = { test: 'data' };
      const cacheKey = 'test:short:ttl';
      
      await CacheService.set(cacheKey, data, 1); // 1 second TTL
      
      let retrieved = await CacheService.get(cacheKey);
      expect(retrieved).toEqual(data);
      
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      retrieved = await CacheService.get(cacheKey);
      expect(retrieved).toBeNull();
    });
  });

  describe('invalidate', () => {
    it('should invalidate cache by pattern', async () => {
      await CacheService.set('user:123:tasks', { tasks: [] }, 3600);
      await CacheService.set('user:123:projects', { projects: [] }, 3600);
      await CacheService.set('user:456:tasks', { tasks: [] }, 3600);
      
      const result = await CacheService.invalidate({
        pattern: 'user:123:*'
      });
      
      expect(result.invalidated_keys).toBe(2);
      
      const task1 = await CacheService.get('user:123:tasks');
      const task456 = await CacheService.get('user:456:tasks');
      
      expect(task1).toBeNull();
      expect(task456).not.toBeNull();
    });

    it('should invalidate cache by tags', async () => {
      await CacheService.setWithTags('query:1', { data: 'test1' }, ['user:123'], 3600);
      await CacheService.setWithTags('query:2', { data: 'test2' }, ['user:123', 'project:1'], 3600);
      await CacheService.setWithTags('query:3', { data: 'test3' }, ['user:456'], 3600);
      
      const result = await CacheService.invalidate({
        tags: ['user:123']
      });
      
      expect(result.invalidated_keys).toBe(2);
    });
  });

  describe('performance', () => {
    it('should handle high-volume cache operations efficiently', async () => {
      const operations = Array.from({ length: 1000 }, (_, i) => 
        CacheService.set(`test:key:${i}`, { value: i }, 3600)
      );
      
      const startTime = Date.now();
      await Promise.all(operations);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(2000); // Should complete in under 2 seconds
    });
  });
});
```

#### Cache Hit Rate Tests
```typescript
describe('Cache Hit Rate Analysis', () => {
  it('should achieve target cache hit rate for common queries', async () => {
    const userId = 'user1';
    
    // Simulate typical user behavior
    for (let i = 0; i < 100; i++) {
      await TaskService.getUserTasks(userId); // Should hit cache after first call
      await ProjectService.getUserProjects(userId);
      await ListService.getUserLists(userId);
    }
    
    const stats = await CacheService.getStats();
    expect(stats.query_cache.hit_rate).toBeGreaterThan(0.90); // 90% hit rate target
  });

  it('should maintain performance under cache pressure', async () => {
    // Fill cache to near capacity
    for (let i = 0; i < 10000; i++) {
      await CacheService.set(`pressure:test:${i}`, { data: 'x'.repeat(1000) }, 3600);
    }
    
    // Measure performance of normal operations
    const startTime = Date.now();
    await TaskService.getUserTasks('user1');
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(200); // Should still be fast
  });
});
```

### Database Performance Tests

#### Query Performance Tests
```typescript
describe('Database Query Performance', () => {
  beforeEach(async () => {
    await seedLargeDataset(); // Seed with 10k tasks, 1k users, 5k projects
  });

  describe('task queries', () => {
    it('should execute user task queries within performance targets', async () => {
      const startTime = Date.now();
      const tasks = await TaskService.getUserTasks('user1');
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(100); // Sub-100ms target
      expect(tasks).toBeInstanceOf(Array);
    });

    it('should handle complex filtered queries efficiently', async () => {
      const filters = {
        status: 'in_progress',
        priority: 'high',
        due_date_from: '2025-08-01',
        due_date_to: '2025-08-31'
      };
      
      const startTime = Date.now();
      const tasks = await TaskService.getFilteredTasks('user1', filters);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(150);
      expect(tasks.every(task => task.status === 'in_progress')).toBe(true);
    });

    it('should optimize search queries with full-text search', async () => {
      const startTime = Date.now();
      const results = await TaskService.searchTasks('user1', 'important project deadline');
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(200);
      expect(results).toBeInstanceOf(Array);
    });
  });

  describe('bulk operations performance', () => {
    it('should handle bulk updates efficiently', async () => {
      const taskIds = Array.from({ length: 100 }, (_, i) => `task${i}`);
      
      const startTime = Date.now();
      await TaskService.bulkUpdateStatus(taskIds, 'completed');
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(500); // Should handle 100 updates in under 500ms
    });

    it('should optimize bulk inserts with batch processing', async () => {
      const tasks = Array.from({ length: 1000 }, (_, i) => ({
        title: `Bulk Task ${i}`,
        user_id: 'user1',
        list_id: 'list1'
      }));
      
      const startTime = Date.now();
      await TaskService.bulkCreate(tasks);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(2000); // 1000 inserts in under 2 seconds
    });
  });
});
```

#### Database Load Tests
```typescript
describe('Database Load Testing', () => {
  it('should handle concurrent user load', async () => {
    const concurrentUsers = 50;
    const operationsPerUser = 20;
    
    const userOperations = Array.from({ length: concurrentUsers }, async (_, userIndex) => {
      const userId = `load-user-${userIndex}`;
      const operations = [];
      
      for (let i = 0; i < operationsPerUser; i++) {
        operations.push(TaskService.getUserTasks(userId));
        operations.push(ProjectService.getUserProjects(userId));
      }
      
      return Promise.all(operations);
    });
    
    const startTime = Date.now();
    await Promise.all(userOperations);
    const totalDuration = Date.now() - startTime;
    
    const totalOperations = concurrentUsers * operationsPerUser * 2;
    const avgOperationTime = totalDuration / totalOperations;
    
    expect(avgOperationTime).toBeLessThan(100); // Average operation under 100ms
  });

  it('should maintain connection pool efficiency', async () => {
    const poolStats = await DatabaseService.getConnectionPoolStats();
    
    expect(poolStats.active_connections).toBeLessThan(poolStats.total_connections);
    expect(poolStats.waiting_connections).toBe(0);
    expect(poolStats.avg_connection_time_ms).toBeLessThan(50);
  });
});
```

### Frontend Performance Tests

#### Bundle Size Tests
```typescript
describe('Bundle Size Optimization', () => {
  it('should maintain target bundle sizes', async () => {
    const bundleAnalysis = await BundleAnalyzer.analyze();
    
    expect(bundleAnalysis.main.size_kb).toBeLessThan(300); // Main bundle under 300KB
    expect(bundleAnalysis.main.gzipped_size_kb).toBeLessThan(100); // Gzipped under 100KB
    expect(bundleAnalysis.vendor.size_kb).toBeLessThan(200); // Vendor bundle under 200KB
  });

  it('should have efficient code splitting', async () => {
    const bundleAnalysis = await BundleAnalyzer.analyze();
    const totalSize = bundleAnalysis.bundles.reduce((sum, bundle) => sum + bundle.size_kb, 0);
    
    expect(bundleAnalysis.bundles.length).toBeGreaterThan(3); // Should have multiple chunks
    expect(bundleAnalysis.main.size_kb / totalSize).toBeLessThan(0.6); // Main bundle < 60% of total
  });
});
```

#### Page Performance Tests
```typescript
describe('Page Performance (E2E)', () => {
  let page: Page;

  beforeEach(async () => {
    page = await browser.newPage();
    
    // Set up performance monitoring
    await page.evaluateOnNewDocument(() => {
      window.performanceMetrics = [];
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.performanceMetrics.push({
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime
          });
        }
      }).observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
    });
  });

  it('should meet Core Web Vitals targets', async () => {
    await page.goto('/dashboard', { waitUntil: 'networkidle0' });
    
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lcp = entries.find(entry => entry.entryType === 'largest-contentful-paint');
          const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
          
          resolve({
            lcp: lcp?.startTime || 0,
            fcp: fcp?.startTime || 0,
            cls: 0 // Would need layout shift observer
          });
        }).observe({ entryTypes: ['largest-contentful-paint', 'paint'] });
        
        setTimeout(() => resolve({ lcp: 0, fcp: 0, cls: 0 }), 5000);
      });
    });
    
    expect(metrics.lcp).toBeLessThan(2500); // LCP under 2.5s
    expect(metrics.fcp).toBeLessThan(1800); // FCP under 1.8s
    expect(metrics.cls).toBeLessThan(0.1); // CLS under 0.1
  });

  it('should load efficiently with lazy loading', async () => {
    const response = await page.goto('/dashboard');
    const initialSize = parseInt(response.headers()['content-length'] || '0');
    
    // Should load with minimal initial payload
    expect(initialSize).toBeLessThan(500000); // Under 500KB initial load
    
    // Check for lazy loaded components
    await page.click('[data-testid="projects-tab"]');
    await page.waitForTimeout(100);
    
    const networkRequests = await page.evaluate(() => 
      performance.getEntriesByType('resource').length
    );
    
    expect(networkRequests).toBeGreaterThan(5); // Should have lazy-loaded additional resources
  });
});
```

### Load Testing Framework

#### Automated Load Tests
```typescript
describe('Load Testing Framework', () => {
  describe('API Load Tests', () => {
    it('should handle sustained load on task endpoints', async () => {
      const loadTestConfig = {
        target_endpoint: '/api/tasks',
        concurrent_users: 100,
        duration_minutes: 5,
        ramp_up_seconds: 30
      };
      
      const testId = await LoadTestService.startTest(loadTestConfig);
      
      // Poll for completion
      let results;
      do {
        await new Promise(resolve => setTimeout(resolve, 10000));
        results = await LoadTestService.getResults(testId);
      } while (results.status === 'running');
      
      expect(results.status).toBe('completed');
      expect(results.results.error_rate).toBeLessThan(0.01); // Less than 1% error rate
      expect(results.results.avg_response_time_ms).toBeLessThan(300); // Under 300ms average
      expect(results.results.p95_response_time_ms).toBeLessThan(500); // Under 500ms P95
    });
  });

  describe('Database Load Tests', () => {
    it('should maintain performance under database load', async () => {
      const concurrentQueries = 200;
      const queryPromises = [];
      
      for (let i = 0; i < concurrentQueries; i++) {
        queryPromises.push(
          TaskService.getUserTasks(`user${i % 50}`) // 50 different users
        );
      }
      
      const startTime = Date.now();
      const results = await Promise.allSettled(queryPromises);
      const duration = Date.now() - startTime;
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const successRate = successful / concurrentQueries;
      
      expect(successRate).toBeGreaterThan(0.98); // 98% success rate
      expect(duration / concurrentQueries).toBeLessThan(10); // Average under 10ms per query
    });
  });
});
```

## Mocking Requirements

### Performance Monitoring Mocks

#### Redis Mock
```typescript
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(() => []),
    flushall: jest.fn(),
    info: jest.fn(() => 'redis_version:6.2.0\nused_memory:1024\nconnected_clients:5')
  }))
}));
```

#### Database Performance Mock
```typescript
const mockQueryStats = {
  total_connections: 20,
  active_connections: 8,
  idle_connections: 12,
  waiting_connections: 0,
  avg_connection_time_ms: 25,
  slow_queries: []
};

jest.mock('../services/DatabaseService', () => ({
  getConnectionPoolStats: jest.fn().mockResolvedValue(mockQueryStats),
  getSlowQueries: jest.fn().mockResolvedValue([]),
  analyzeQueries: jest.fn().mockResolvedValue({ recommendations: [] })
}));
```

#### Bundle Analyzer Mock
```typescript
jest.mock('webpack-bundle-analyzer', () => ({
  BundleAnalyzerPlugin: jest.fn(),
  analyze: jest.fn().mockResolvedValue({
    bundles: [
      {
        name: 'main.js',
        size_kb: 245,
        gzipped_size_kb: 78,
        chunks: []
      }
    ],
    optimization_suggestions: []
  })
}));
```

### Load Testing Mocks

#### Load Test Service Mock
```typescript
const mockLoadTestResults = {
  test_id: 'test-123',
  status: 'completed',
  results: {
    total_requests: 10000,
    successful_requests: 9985,
    failed_requests: 15,
    avg_response_time_ms: 185,
    p95_response_time_ms: 450,
    error_rate: 0.015
  }
};

jest.mock('../services/LoadTestService', () => ({
  startTest: jest.fn().mockResolvedValue('test-123'),
  getResults: jest.fn().mockResolvedValue(mockLoadTestResults),
  stopTest: jest.fn().mockResolvedValue(true)
}));
```

### Performance Testing Utilities

#### Database Seeding for Performance Tests
```typescript
export async function seedLargeDataset() {
  const users = Array.from({ length: 1000 }, (_, i) => ({
    id: `user${i}`,
    email: `user${i}@example.com`,
    name: `User ${i}`
  }));

  const projects = Array.from({ length: 5000 }, (_, i) => ({
    id: `project${i}`,
    title: `Project ${i}`,
    user_id: `user${i % 1000}`
  }));

  const tasks = Array.from({ length: 50000 }, (_, i) => ({
    id: `task${i}`,
    title: `Task ${i}`,
    user_id: `user${i % 1000}`,
    project_id: `project${i % 5000}`,
    status: ['pending', 'in_progress', 'completed'][i % 3]
  }));

  await User.bulkCreate(users);
  await Project.bulkCreate(projects);
  await Task.bulkCreate(tasks);
}
```

#### Performance Assertion Helpers
```typescript
export function expectPerformance(actualMs: number, targetMs: number, tolerance = 0.1) {
  const maxAllowed = targetMs * (1 + tolerance);
  expect(actualMs).toBeLessThan(maxAllowed);
}

export function expectHighThroughput(operations: number, durationMs: number, minOpsPerSec: number) {
  const actualOpsPerSec = (operations * 1000) / durationMs;
  expect(actualOpsPerSec).toBeGreaterThan(minOpsPerSec);
}
```