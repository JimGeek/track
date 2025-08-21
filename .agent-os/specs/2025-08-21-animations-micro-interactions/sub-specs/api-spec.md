# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-21-animations-micro-interactions/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Endpoints

### Animation Preferences API

#### GET /api/animations/preferences
**Purpose:** Get user's animation preferences
**Response:**
```json
{
  "user_id": "user_123",
  "device_id": "device_abc",
  "preferences": {
    "animation_level": "normal",
    "reduce_motion": false,
    "respect_system_preference": true,
    "page_transitions": true,
    "micro_interactions": true,
    "loading_animations": true,
    "hover_effects": true,
    "focus_animations": true,
    "enable_gpu_acceleration": true,
    "animation_quality": "auto",
    "frame_rate_limit": 60,
    "animation_speed_multiplier": 1.0,
    "transition_duration_ms": 300,
    "high_contrast_animations": false,
    "screen_reader_friendly": true,
    "battery_saver_mode": false,
    "performance_mode": "balanced"
  },
  "system_preferences": {
    "prefers_reduced_motion": false,
    "device_performance_tier": "high"
  }
}
```

#### PUT /api/animations/preferences
**Purpose:** Update animation preferences
**Request Body:**
```json
{
  "preferences": {
    "animation_level": "reduced",
    "animation_speed_multiplier": 0.8,
    "battery_saver_mode": true,
    "performance_mode": "battery"
  }
}
```

#### POST /api/animations/preferences/reset
**Purpose:** Reset preferences to system defaults
**Response:**
```json
{
  "success": true,
  "reset_preferences": {
    "animation_level": "normal",
    "reduce_motion": false,
    "respect_system_preference": true
  }
}
```

### Animation Performance API

#### POST /api/animations/performance/metrics
**Purpose:** Record animation performance metrics
**Request Body:**
```json
{
  "session_id": "session_123",
  "metrics": [
    {
      "animation_type": "page_transition",
      "animation_name": "slide_in_right",
      "component_name": "TaskDetailModal",
      "duration_ms": 350,
      "frame_rate_avg": 58.5,
      "frame_rate_min": 45.2,
      "frame_rate_max": 60.0,
      "dropped_frames": 2,
      "jank_count": 1,
      "used_gpu_acceleration": true,
      "animation_quality": "high",
      "reduced_motion_active": false,
      "viewport_width": 1440,
      "viewport_height": 900,
      "page_path": "/tasks/123"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "recorded_metrics": 1,
  "performance_score": 8.5,
  "recommendations": [
    {
      "type": "optimization",
      "message": "Consider reducing animation complexity for better frame rate",
      "priority": "medium"
    }
  ]
}
```

#### GET /api/animations/performance/dashboard
**Purpose:** Get performance dashboard data
**Query Parameters:**
- `time_range`: `1h`, `24h`, `7d`, `30d`
- `animation_type`: Filter by animation type
- `device_type`: Filter by device type

**Response:**
```json
{
  "summary": {
    "avg_frame_rate": 56.8,
    "total_animations": 15420,
    "jank_rate": 0.023,
    "completion_rate": 0.987,
    "performance_score": 8.2
  },
  "metrics_over_time": [
    {
      "timestamp": "2025-08-21T10:00:00Z",
      "avg_frame_rate": 58.2,
      "animation_count": 245,
      "jank_rate": 0.021
    }
  ],
  "top_performing_animations": [
    {
      "animation_name": "fade_in",
      "avg_frame_rate": 59.8,
      "completion_rate": 0.999,
      "usage_count": 2580
    }
  ],
  "problematic_animations": [
    {
      "animation_name": "complex_list_reorder",
      "avg_frame_rate": 42.1,
      "jank_rate": 0.156,
      "usage_count": 89
    }
  ]
}
```

### Animation Usage Analytics API

#### POST /api/animations/usage/track
**Purpose:** Track animation usage and user interaction
**Request Body:**
```json
{
  "events": [
    {
      "animation_type": "micro_interaction",
      "animation_trigger": "user_interaction",
      "component_path": "TaskCard.CompleteButton",
      "page_path": "/dashboard",
      "user_action": "button_click",
      "completed": true,
      "interrupted": false,
      "user_waited": true,
      "immediate_interaction": false,
      "perceived_smoothness": 4,
      "caused_delay_ms": 0
    }
  ]
}
```

#### GET /api/animations/usage/insights
**Purpose:** Get animation usage insights and analytics
**Response:**
```json
{
  "usage_summary": {
    "total_animations_triggered": 45230,
    "completion_rate": 0.943,
    "interrupt_rate": 0.057,
    "avg_perceived_smoothness": 4.2,
    "user_satisfaction_score": 8.4
  },
  "most_used_animations": [
    {
      "animation_type": "micro_interaction",
      "component_path": "Button.hover",
      "usage_count": 12580,
      "completion_rate": 0.998
    }
  ],
  "problematic_patterns": [
    {
      "animation_type": "list_animation",
      "component_path": "TaskList.reorder",
      "interrupt_rate": 0.234,
      "avg_perceived_smoothness": 2.8,
      "recommendations": ["reduce_duration", "simplify_motion"]
    }
  ]
}
```

### Animation A/B Testing API

#### GET /api/animations/ab-tests
**Purpose:** Get list of active A/B tests
**Response:**
```json
{
  "active_tests": [
    {
      "test_id": "test_123",
      "test_name": "button_hover_animation",
      "animation_type": "micro_interaction",
      "status": "active",
      "start_date": "2025-08-20T00:00:00Z",
      "end_date": "2025-08-27T23:59:59Z",
      "traffic_split": 0.5
    }
  ]
}
```

#### POST /api/animations/ab-tests/:test_id/assign
**Purpose:** Get A/B test variant assignment for user
**Response:**
```json
{
  "test_id": "test_123",
  "variant": "a",
  "configuration": {
    "duration_ms": 200,
    "easing": "ease-out",
    "transform": "scale(1.05)",
    "additional_properties": {
      "box_shadow": "0 4px 12px rgba(0,0,0,0.15)"
    }
  },
  "assigned_at": "2025-08-21T10:30:00Z"
}
```

#### POST /api/animations/ab-tests/:test_id/results
**Purpose:** Record A/B test results
**Request Body:**
```json
{
  "assignment_id": "assignment_456",
  "results": {
    "animation_views": 15,
    "animation_completions": 14,
    "user_interruptions": 1,
    "avg_frame_rate": 57.2,
    "perceived_performance": 4,
    "task_completion_rate": 0.93,
    "time_on_page_ms": 45200
  }
}
```

### Animation Assets API

#### GET /api/animations/assets
**Purpose:** Get available animation assets
**Query Parameters:**
- `category`: Filter by category
- `device_tier`: Filter by minimum device tier
- `complexity`: Filter by complexity score

**Response:**
```json
{
  "assets": [
    {
      "id": "asset_123",
      "asset_name": "loading_spinner",
      "asset_type": "lottie",
      "file_path": "/animations/loading_spinner.json",
      "file_size_bytes": 15420,
      "duration_ms": 1000,
      "loop_count": -1,
      "complexity_score": 4,
      "performance_impact": "medium",
      "accessible": true,
      "description": "Spinning circle loading indicator",
      "device_support": ["mobile", "tablet", "desktop"],
      "version": "2.1.0"
    }
  ],
  "total_assets": 45,
  "categories": ["loading", "transitions", "micro-interactions", "celebrations"]
}
```

#### GET /api/animations/assets/:asset_id
**Purpose:** Get specific animation asset details
**Response:**
```json
{
  "id": "asset_123",
  "asset_name": "success_checkmark",
  "asset_type": "lottie",
  "file_path": "/animations/success_checkmark.json",
  "file_size_bytes": 8942,
  "duration_ms": 800,
  "frame_rate": 60,
  "complexity_score": 3,
  "performance_impact": "low",
  "component_names": ["SuccessToast", "TaskCompleteButton"],
  "animation_categories": ["micro-interactions", "feedback"],
  "usage_stats": {
    "total_plays": 12580,
    "avg_completion_rate": 0.987,
    "avg_frame_rate": 59.2
  },
  "accessibility": {
    "accessible": true,
    "reduced_motion_alternative_id": "asset_124",
    "description": "Animated checkmark indicating successful completion"
  }
}
```

#### POST /api/animations/assets/:asset_id/usage
**Purpose:** Track animation asset usage
**Request Body:**
```json
{
  "component_name": "TaskCompleteButton",
  "usage_context": {
    "page_path": "/dashboard",
    "user_action": "task_completion",
    "device_type": "mobile"
  },
  "performance_data": {
    "duration_ms": 780,
    "frame_rate_avg": 58.5,
    "completed": true,
    "user_reaction": "positive"
  }
}
```

### Animation Configuration API

#### GET /api/animations/config
**Purpose:** Get global animation configuration
**Response:**
```json
{
  "global_settings": {
    "default_duration_ms": 300,
    "default_easing": "cubic-bezier(0.4, 0, 0.2, 1)",
    "performance_budget_ms": 16.67,
    "max_concurrent_animations": 3
  },
  "device_adaptations": {
    "mobile": {
      "duration_multiplier": 0.8,
      "complexity_limit": 6,
      "battery_saver_duration_multiplier": 0.5
    },
    "tablet": {
      "duration_multiplier": 0.9,
      "complexity_limit": 8
    },
    "desktop": {
      "duration_multiplier": 1.0,
      "complexity_limit": 10
    }
  },
  "accessibility_overrides": {
    "reduced_motion": {
      "duration_multiplier": 0.2,
      "disable_complex_animations": true,
      "focus_only_animations": true
    },
    "high_contrast": {
      "simplified_transitions": true,
      "enhanced_focus_indicators": true
    }
  }
}
```

#### PUT /api/animations/config
**Purpose:** Update global animation configuration (admin only)
**Request Body:**
```json
{
  "global_settings": {
    "default_duration_ms": 250,
    "max_concurrent_animations": 2
  },
  "device_adaptations": {
    "mobile": {
      "duration_multiplier": 0.7,
      "complexity_limit": 5
    }
  }
}
```

## Controllers

### AnimationPreferencesController
```typescript
class AnimationPreferencesController {
  // GET /api/animations/preferences
  async getPreferences(req: AuthRequest, res: Response) {
    const deviceId = req.headers['x-device-id'] as string;
    const preferences = await AnimationPreferenceService.getUserPreferences({
      userId: req.user.id,
      deviceId
    });

    // Include system preferences
    const systemPrefs = await AnimationPreferenceService.detectSystemPreferences(req);
    
    res.json({
      user_id: req.user.id,
      device_id: deviceId,
      preferences,
      system_preferences: systemPrefs
    });
  }

  // PUT /api/animations/preferences
  async updatePreferences(req: AuthRequest, res: Response) {
    const deviceId = req.headers['x-device-id'] as string;
    const { preferences } = req.body;

    const updated = await AnimationPreferenceService.updatePreferences({
      userId: req.user.id,
      deviceId,
      preferences
    });

    res.json({ success: true, preferences: updated });
  }

  // POST /api/animations/preferences/reset
  async resetPreferences(req: AuthRequest, res: Response) {
    const deviceId = req.headers['x-device-id'] as string;
    
    const resetPrefs = await AnimationPreferenceService.resetToDefaults({
      userId: req.user.id,
      deviceId
    });

    res.json({ 
      success: true, 
      reset_preferences: resetPrefs 
    });
  }
}
```

### AnimationPerformanceController
```typescript
class AnimationPerformanceController {
  // POST /api/animations/performance/metrics
  async recordMetrics(req: AuthRequest, res: Response) {
    const { session_id, metrics } = req.body;
    
    const results = await AnimationPerformanceService.recordMetrics({
      userId: req.user?.id,
      sessionId: session_id,
      deviceInfo: {
        type: (req as any).deviceInfo?.type,
        id: req.headers['x-device-id'] as string,
        userAgent: req.get('User-Agent')
      },
      metrics
    });

    // Analyze performance and provide recommendations
    const recommendations = await AnimationPerformanceService.analyzePerformance(results);
    const performanceScore = await AnimationPerformanceService.calculateScore(results);

    res.json({
      success: true,
      recorded_metrics: results.length,
      performance_score: performanceScore,
      recommendations
    });
  }

  // GET /api/animations/performance/dashboard
  async getDashboard(req: AuthRequest, res: Response) {
    const { time_range = '24h', animation_type, device_type } = req.query;
    
    const dashboard = await AnimationPerformanceService.getDashboardData({
      timeRange: time_range as string,
      animationType: animation_type as string,
      deviceType: device_type as string,
      userId: req.user?.id // Include for user-specific data if needed
    });

    res.json(dashboard);
  }
}
```

### AnimationUsageController
```typescript
class AnimationUsageController {
  // POST /api/animations/usage/track
  async trackUsage(req: AuthRequest, res: Response) {
    const { events } = req.body;
    const sessionId = req.sessionID;
    const deviceType = (req as any).deviceInfo?.type;

    const results = await AnimationUsageService.trackEvents({
      userId: req.user?.id,
      sessionId,
      deviceType,
      events
    });

    res.json({ 
      success: true, 
      tracked_events: results.length 
    });
  }

  // GET /api/animations/usage/insights
  async getInsights(req: AuthRequest, res: Response) {
    const { time_range = '7d' } = req.query;
    
    const insights = await AnimationUsageService.getInsights({
      timeRange: time_range as string,
      userId: req.user?.id
    });

    res.json(insights);
  }
}
```

### AnimationABTestController
```typescript
class AnimationABTestController {
  // GET /api/animations/ab-tests
  async getActiveTests(req: AuthRequest, res: Response) {
    const tests = await AnimationABTestService.getActiveTests({
      userId: req.user?.id,
      deviceType: (req as any).deviceInfo?.type
    });

    res.json({ active_tests: tests });
  }

  // POST /api/animations/ab-tests/:test_id/assign
  async assignVariant(req: AuthRequest, res: Response) {
    const { test_id } = req.params;
    const sessionId = req.sessionID;

    const assignment = await AnimationABTestService.assignVariant({
      testId: test_id,
      userId: req.user?.id,
      sessionId,
      deviceType: (req as any).deviceInfo?.type,
      userAgent: req.get('User-Agent')
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Test not found or not active' });
    }

    res.json(assignment);
  }

  // POST /api/animations/ab-tests/:test_id/results
  async recordResults(req: AuthRequest, res: Response) {
    const { test_id } = req.params;
    const { assignment_id, results } = req.body;

    await AnimationABTestService.recordResults({
      testId: test_id,
      assignmentId: assignment_id,
      results
    });

    res.json({ success: true });
  }
}
```

### AnimationAssetsController
```typescript
class AnimationAssetsController {
  // GET /api/animations/assets
  async getAssets(req: AuthRequest, res: Response) {
    const { category, device_tier, complexity } = req.query;
    const deviceType = (req as any).deviceInfo?.type;

    const assets = await AnimationAssetService.getAssets({
      category: category as string,
      deviceTier: device_tier as string,
      maxComplexity: complexity ? parseInt(complexity as string) : undefined,
      deviceType
    });

    const categories = await AnimationAssetService.getCategories();

    res.json({
      assets,
      total_assets: assets.length,
      categories
    });
  }

  // GET /api/animations/assets/:asset_id
  async getAsset(req: AuthRequest, res: Response) {
    const { asset_id } = req.params;
    
    const asset = await AnimationAssetService.getAssetById(asset_id);
    if (!asset) {
      return res.status(404).json({ error: 'Animation asset not found' });
    }

    const usageStats = await AnimationAssetService.getUsageStats(asset_id);
    
    res.json({
      ...asset,
      usage_stats: usageStats
    });
  }

  // POST /api/animations/assets/:asset_id/usage
  async trackAssetUsage(req: AuthRequest, res: Response) {
    const { asset_id } = req.params;
    const { component_name, usage_context, performance_data } = req.body;

    await AnimationAssetService.trackUsage({
      assetId: asset_id,
      userId: req.user?.id,
      componentName: component_name,
      usageContext: usage_context,
      performanceData: performance_data
    });

    res.json({ success: true });
  }
}
```

### Middleware for Animation Features

#### Animation Performance Tracking Middleware
```typescript
export const animationPerformanceMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Add animation performance tracking context
  (req as any).animationContext = {
    startTime: Date.now(),
    sessionId: req.sessionID,
    deviceInfo: (req as any).deviceInfo,
    route: req.path
  };

  // Track page transition performance
  res.on('finish', () => {
    const duration = Date.now() - (req as any).animationContext.startTime;
    
    // Record page transition metrics if this was a navigation
    if (req.get('X-Page-Transition') === 'true') {
      AnimationPerformanceService.recordPageTransition({
        route: req.path,
        duration,
        deviceInfo: (req as any).deviceInfo,
        sessionId: req.sessionID
      });
    }
  });

  next();
};
```

#### A/B Test Assignment Middleware
```typescript
export const animationABTestMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = (req as AuthRequest).user?.id;
  const sessionId = req.sessionID;
  
  if (userId || sessionId) {
    // Get active animation A/B tests for this user
    const activeTests = await AnimationABTestService.getActiveTests({
      userId,
      deviceType: (req as any).deviceInfo?.type
    });

    // Assign variants for all active tests
    const assignments = await Promise.all(
      activeTests.map(test => 
        AnimationABTestService.assignVariant({
          testId: test.id,
          userId,
          sessionId,
          deviceType: (req as any).deviceInfo?.type,
          userAgent: req.get('User-Agent')
        })
      )
    );

    // Add assignments to response headers for client-side use
    res.set('X-Animation-AB-Tests', JSON.stringify(
      assignments.filter(a => a !== null)
    ));
  }

  next();
};
```