# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-21-performance-optimization/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Endpoints

### Performance Monitoring API

#### POST /api/metrics/performance
**Purpose:** Record client-side performance metrics
**Request Body:**
```json
{
  "metrics": [
    {
      "metric_type": "frontend",
      "metric_name": "page_load_time",
      "duration_ms": 1250,
      "memory_usage_mb": 45,
      "endpoint": "/dashboard",
      "metadata": {
        "connection_type": "4g",
        "device_type": "mobile",
        "browser": "Chrome 118"
      }
    },
    {
      "metric_type": "frontend",
      "metric_name": "core_web_vitals",
      "metadata": {
        "fcp": 1200,
        "lcp": 2100,
        "fid": 50,
        "cls": 0.1,
        "ttfb": 300
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "recorded_metrics": 2
}
```

#### GET /api/metrics/dashboard
**Purpose:** Get performance dashboard data
**Query Parameters:**
- `time_range`: `1h`, `24h`, `7d`, `30d`
- `metric_type`: `api`, `query`, `frontend`, `cache`
- `user_id`: Filter by specific user (admin only)

**Response:**
```json
{
  "summary": {
    "avg_response_time_ms": 185,
    "total_requests": 15420,
    "error_rate": 0.02,
    "cache_hit_rate": 0.94
  },
  "metrics": [
    {
      "timestamp": "2025-08-21T10:00:00Z",
      "avg_duration_ms": 180,
      "request_count": 245,
      "error_count": 1
    }
  ],
  "slowest_queries": [
    {
      "query_hash": "abc123",
      "avg_duration_ms": 850,
      "execution_count": 45,
      "endpoint": "/api/tasks/search"
    }
  ]
}
```

### Cache Management API

#### GET /api/cache/stats
**Purpose:** Get cache performance statistics
**Response:**
```json
{
  "redis": {
    "hit_rate": 0.94,
    "miss_rate": 0.06,
    "total_keys": 15420,
    "memory_usage_mb": 256,
    "connected_clients": 12
  },
  "query_cache": {
    "total_entries": 1250,
    "hit_rate": 0.89,
    "avg_generation_time_ms": 125,
    "total_size_mb": 45
  },
  "browser_cache": {
    "service_worker_cache_hit_rate": 0.96,
    "static_assets_cached": 145
  }
}
```

#### DELETE /api/cache/invalidate
**Purpose:** Invalidate cache entries
**Request Body:**
```json
{
  "cache_type": "query", // or "all", "redis", "browser"
  "keys": ["user:123:tasks", "user:123:projects"],
  "tags": ["user:123"], // For bulk invalidation
  "pattern": "user:123:*" // For pattern-based invalidation
}
```

**Response:**
```json
{
  "success": true,
  "invalidated_keys": 15,
  "invalidation_time_ms": 25
}
```

### Database Performance API

#### GET /api/database/performance
**Purpose:** Get database performance metrics
**Response:**
```json
{
  "connections": {
    "total": 20,
    "active": 8,
    "idle": 12,
    "waiting": 0
  },
  "query_performance": {
    "avg_query_time_ms": 45,
    "slowest_queries": [
      {
        "query_hash": "def456",
        "avg_duration_ms": 250,
        "calls": 120,
        "total_time_ms": 30000
      }
    ]
  },
  "cache_hit_ratio": 0.98,
  "deadlocks": 0,
  "lock_waits": 2
}
```

#### POST /api/database/analyze
**Purpose:** Trigger database analysis and optimization suggestions
**Response:**
```json
{
  "analysis_id": "analysis-uuid",
  "status": "running",
  "estimated_completion": "2025-08-21T10:05:00Z"
}
```

#### GET /api/database/analyze/:analysis_id
**Purpose:** Get database analysis results
**Response:**
```json
{
  "analysis_id": "analysis-uuid",
  "status": "completed",
  "completed_at": "2025-08-21T10:04:30Z",
  "recommendations": [
    {
      "type": "index_suggestion",
      "table": "tasks",
      "columns": ["user_id", "status", "created_at"],
      "impact": "high",
      "estimated_improvement": "40% faster queries",
      "sql": "CREATE INDEX idx_tasks_user_status_created ON tasks(user_id, status, created_at);"
    },
    {
      "type": "query_optimization",
      "query_hash": "ghi789",
      "current_cost": 1250,
      "optimized_cost": 450,
      "suggestion": "Add WHERE clause filtering before JOIN"
    }
  ]
}
```

### Load Testing API

#### POST /api/load-test/start
**Purpose:** Start a load testing session
**Request Body:**
```json
{
  "test_name": "dashboard_load_test",
  "target_endpoint": "/api/tasks",
  "concurrent_users": 100,
  "duration_minutes": 10,
  "ramp_up_seconds": 30,
  "test_data": {
    "user_ids": ["user1", "user2", "user3"]
  }
}
```

**Response:**
```json
{
  "test_id": "test-uuid",
  "status": "starting",
  "estimated_completion": "2025-08-21T10:15:00Z"
}
```

#### GET /api/load-test/:test_id
**Purpose:** Get load test results
**Response:**
```json
{
  "test_id": "test-uuid",
  "status": "completed",
  "results": {
    "total_requests": 10000,
    "successful_requests": 9985,
    "failed_requests": 15,
    "avg_response_time_ms": 185,
    "min_response_time_ms": 45,
    "max_response_time_ms": 2300,
    "p95_response_time_ms": 450,
    "requests_per_second": 166,
    "error_rate": 0.015
  },
  "performance_over_time": [
    {
      "timestamp": "2025-08-21T10:00:00Z",
      "avg_response_time_ms": 180,
      "requests_per_second": 165,
      "active_users": 100
    }
  ]
}
```

### Bundle Analysis API

#### GET /api/bundle/analysis
**Purpose:** Get frontend bundle analysis data
**Response:**
```json
{
  "bundles": [
    {
      "name": "main.js",
      "size_kb": 245,
      "gzipped_size_kb": 78,
      "chunks": [
        {
          "name": "vendor",
          "size_kb": 180,
          "modules": ["react", "react-dom", "lodash"]
        },
        {
          "name": "app",
          "size_kb": 65,
          "modules": ["./src/components", "./src/utils"]
        }
      ]
    }
  ],
  "optimization_suggestions": [
    {
      "type": "code_splitting",
      "current_size_kb": 245,
      "potential_savings_kb": 80,
      "suggestion": "Split vendor libraries into separate chunk"
    },
    {
      "type": "tree_shaking",
      "unused_exports": ["lodash.debounce", "moment.locale"],
      "potential_savings_kb": 25
    }
  ]
}
```

## Controllers

### PerformanceController
```typescript
class PerformanceController {
  // POST /api/metrics/performance
  async recordMetrics(req: AuthRequest, res: Response) {
    const metrics = await PerformanceService.recordMetrics({
      userId: req.user?.id,
      sessionId: req.sessionID,
      metrics: req.body.metrics
    });
    
    res.json({ success: true, recorded_metrics: metrics.length });
  }

  // GET /api/metrics/dashboard
  async getDashboard(req: AuthRequest, res: Response) {
    const timeRange = req.query.time_range as string || '24h';
    const metricType = req.query.metric_type as string;
    
    const dashboard = await PerformanceService.getDashboardData({
      timeRange,
      metricType,
      userId: req.query.user_id as string
    });
    
    res.json(dashboard);
  }
}
```

### CacheController
```typescript
class CacheController {
  // GET /api/cache/stats
  async getCacheStats(req: AuthRequest, res: Response) {
    const stats = await CacheService.getStats();
    res.json(stats);
  }

  // DELETE /api/cache/invalidate
  async invalidateCache(req: AuthRequest, res: Response) {
    const { cache_type, keys, tags, pattern } = req.body;
    
    const result = await CacheService.invalidate({
      cacheType: cache_type,
      keys,
      tags,
      pattern
    });
    
    res.json(result);
  }
}
```

### DatabasePerformanceController
```typescript
class DatabasePerformanceController {
  // GET /api/database/performance
  async getPerformanceMetrics(req: AuthRequest, res: Response) {
    const metrics = await DatabaseService.getPerformanceMetrics();
    res.json(metrics);
  }

  // POST /api/database/analyze
  async startAnalysis(req: AuthRequest, res: Response) {
    const analysisId = await DatabaseService.startAnalysis();
    
    res.json({
      analysis_id: analysisId,
      status: 'running',
      estimated_completion: new Date(Date.now() + 5 * 60 * 1000)
    });
  }

  // GET /api/database/analyze/:analysis_id
  async getAnalysisResults(req: AuthRequest, res: Response) {
    const { analysis_id } = req.params;
    const analysis = await DatabaseService.getAnalysisResults(analysis_id);
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    res.json(analysis);
  }
}
```

### LoadTestController
```typescript
class LoadTestController {
  // POST /api/load-test/start
  async startLoadTest(req: AuthRequest, res: Response) {
    const testConfig = req.body;
    const testId = await LoadTestService.startTest(testConfig);
    
    res.json({
      test_id: testId,
      status: 'starting',
      estimated_completion: new Date(
        Date.now() + testConfig.duration_minutes * 60 * 1000
      )
    });
  }

  // GET /api/load-test/:test_id
  async getLoadTestResults(req: AuthRequest, res: Response) {
    const { test_id } = req.params;
    const results = await LoadTestService.getResults(test_id);
    
    if (!results) {
      return res.status(404).json({ error: 'Load test not found' });
    }
    
    res.json(results);
  }
}
```

### Middleware for Performance Tracking

#### Response Time Middleware
```typescript
export const responseTimeMiddleware = (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    PerformanceService.recordMetrics({
      userId: (req as AuthRequest).user?.id,
      sessionId: req.sessionID,
      metrics: [{
        metric_type: 'api',
        metric_name: 'response_time',
        duration_ms: duration,
        endpoint: req.path,
        metadata: {
          method: req.method,
          status_code: res.statusCode,
          user_agent: req.get('User-Agent')
        }
      }]
    });
  });
  
  next();
};
```

#### Query Performance Middleware
```typescript
export const queryPerformanceMiddleware = (
  originalQuery: Function
) => {
  return async function (this: any, ...args: any[]) {
    const startTime = Date.now();
    const queryString = this.toString();
    const queryHash = createHash('sha256').update(queryString).digest('hex');
    
    try {
      const result = await originalQuery.apply(this, args);
      const duration = Date.now() - startTime;
      
      await PerformanceService.recordMetrics({
        metrics: [{
          metric_type: 'query',
          metric_name: 'database_query',
          duration_ms: duration,
          query_hash: queryHash,
          metadata: {
            query_type: this.constructor.name,
            row_count: Array.isArray(result) ? result.length : 1
          }
        }]
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      await PerformanceService.recordMetrics({
        metrics: [{
          metric_type: 'query',
          metric_name: 'database_query_error',
          duration_ms: duration,
          query_hash: queryHash,
          metadata: {
            error: error.message,
            query_type: this.constructor.name
          }
        }]
      });
      
      throw error;
    }
  };
};
```