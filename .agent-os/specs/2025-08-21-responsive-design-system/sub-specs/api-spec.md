# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-21-responsive-design-system/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Endpoints

### Device Preferences API

#### GET /api/device/preferences
**Purpose:** Get device-specific preferences for current user
**Response:**
```json
{
  "device_id": "device_123",
  "device_type": "mobile",
  "preferences": {
    "preferred_orientation": "auto",
    "touch_sensitivity": "normal",
    "gesture_navigation": true,
    "haptic_feedback": true,
    "reduce_motion": false,
    "layout_style": "comfortable",
    "navigation_style": "bottom_tabs",
    "font_scale": 1.0,
    "data_saver_mode": false,
    "offline_sync_enabled": true,
    "background_sync": true
  },
  "device_info": {
    "screen_width": 390,
    "screen_height": 844,
    "pixel_ratio": 3.0,
    "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"
  }
}
```

#### PUT /api/device/preferences
**Purpose:** Update device preferences
**Request Body:**
```json
{
  "device_id": "device_123",
  "preferences": {
    "layout_style": "compact",
    "navigation_style": "drawer",
    "haptic_feedback": false,
    "font_scale": 1.2
  },
  "device_info": {
    "screen_width": 390,
    "screen_height": 844,
    "pixel_ratio": 3.0
  }
}
```

#### POST /api/device/register
**Purpose:** Register a new device for the user
**Request Body:**
```json
{
  "device_info": {
    "device_type": "mobile",
    "screen_width": 390,
    "screen_height": 844,
    "pixel_ratio": 3.0,
    "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"
  },
  "default_preferences": {
    "touch_sensitivity": "high",
    "gesture_navigation": true
  }
}
```

### PWA Management API

#### POST /api/pwa/install
**Purpose:** Track PWA installation
**Request Body:**
```json
{
  "installation_source": "custom_prompt",
  "platform": "android",
  "browser": "chrome",
  "page_url": "/dashboard",
  "device_info": {
    "device_id": "device_123",
    "user_agent": "Mozilla/5.0...",
    "screen_width": 412,
    "screen_height": 915
  }
}
```

#### GET /api/pwa/manifest
**Purpose:** Get dynamic PWA manifest
**Response:**
```json
{
  "name": "Track - Task Management",
  "short_name": "Track",
  "description": "Efficient task and project management",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3B82F6",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Offline Sync API

#### GET /api/sync/status
**Purpose:** Get sync status for current device
**Response:**
```json
{
  "device_id": "device_123",
  "last_sync": "2025-08-21T10:30:00Z",
  "pending_actions": 5,
  "sync_conflicts": 1,
  "offline_duration_ms": 120000,
  "queue_status": {
    "pending": 3,
    "processing": 1,
    "failed": 1,
    "conflicted": 1
  }
}
```

#### POST /api/sync/queue
**Purpose:** Add actions to offline sync queue
**Request Body:**
```json
{
  "actions": [
    {
      "action_type": "create",
      "entity_type": "task",
      "action_data": {
        "title": "New offline task",
        "description": "Created while offline",
        "list_id": "list_123",
        "priority": "high"
      },
      "client_timestamp": "2025-08-21T10:25:00Z"
    },
    {
      "action_type": "update",
      "entity_type": "task",
      "entity_id": "task_456",
      "action_data": {
        "status": "completed"
      },
      "original_data": {
        "status": "in_progress"
      },
      "client_timestamp": "2025-08-21T10:26:00Z"
    }
  ]
}
```

#### POST /api/sync/process
**Purpose:** Process pending sync actions
**Request Body:**
```json
{
  "device_id": "device_123",
  "force_sync": false,
  "conflict_resolution": "server_wins"
}
```

**Response:**
```json
{
  "processed": 4,
  "failed": 1,
  "conflicts": 1,
  "sync_results": [
    {
      "queue_id": "sync_123",
      "status": "completed",
      "entity_id": "task_789",
      "synced_at": "2025-08-21T10:30:15Z"
    },
    {
      "queue_id": "sync_124",
      "status": "conflicted",
      "entity_id": "task_456",
      "conflict_data": {
        "server_version": {
          "status": "deleted",
          "updated_at": "2025-08-21T10:28:00Z"
        },
        "client_version": {
          "status": "completed",
          "updated_at": "2025-08-21T10:26:00Z"
        }
      }
    }
  ]
}
```

### Push Notification API

#### POST /api/notifications/subscribe
**Purpose:** Subscribe to push notifications
**Request Body:**
```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "BNbRAYb2...",
      "auth": "tBHItJI5..."
    }
  },
  "device_info": {
    "device_id": "device_123",
    "platform": "android",
    "browser": "chrome"
  },
  "preferences": {
    "notification_types": ["task_due", "task_assigned"],
    "quiet_hours_start": "22:00",
    "quiet_hours_end": "08:00",
    "timezone": "America/New_York"
  }
}
```

#### PUT /api/notifications/preferences
**Purpose:** Update notification preferences
**Request Body:**
```json
{
  "notification_types": ["task_due", "project_update"],
  "quiet_hours_start": "23:00",
  "quiet_hours_end": "07:00"
}
```

#### DELETE /api/notifications/unsubscribe
**Purpose:** Unsubscribe from push notifications
**Request Body:**
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/..."
}
```

### Responsive Analytics API

#### POST /api/analytics/responsive
**Purpose:** Record responsive design usage analytics
**Request Body:**
```json
{
  "session_data": {
    "session_id": "session_123",
    "device_type": "mobile",
    "screen_width": 390,
    "screen_height": 844,
    "viewport_width": 390,
    "viewport_height": 664,
    "pixel_ratio": 3.0,
    "orientation": "portrait"
  },
  "interactions": [
    {
      "page_path": "/dashboard",
      "layout_breakpoint": "mobile",
      "navigation_type": "bottom_tabs",
      "interaction_type": "tap",
      "load_time_ms": 850,
      "time_to_interactive_ms": 1200
    },
    {
      "page_path": "/tasks/123",
      "layout_breakpoint": "mobile",
      "interaction_type": "swipe",
      "gestures_used": ["swipe_left", "tap", "long_press"]
    }
  ]
}
```

### Adaptive Loading API

#### GET /api/data/adaptive
**Purpose:** Get data optimized for current device and network
**Query Parameters:**
- `device_type`: mobile, tablet, desktop
- `connection`: slow-2g, 2g, 3g, 4g, wifi
- `data_saver`: true/false
- `limit`: number of items to return

**Response:**
```json
{
  "data_optimized_for": {
    "device_type": "mobile",
    "connection": "3g",
    "data_saver": true
  },
  "tasks": [
    {
      "id": "task_123",
      "title": "Important task",
      "status": "pending",
      "priority": "high",
      "due_date": "2025-08-22",
      "thumbnail_url": "/api/images/task_123/thumb_small.webp"
    }
  ],
  "meta": {
    "total": 150,
    "returned": 20,
    "next_page": "/api/data/adaptive?page=2",
    "estimated_size_kb": 15
  }
}
```

## Controllers

### DeviceController
```typescript
class DeviceController {
  // GET /api/device/preferences
  async getPreferences(req: AuthRequest, res: Response) {
    const deviceId = req.headers['x-device-id'] as string;
    const userAgent = req.get('User-Agent');
    
    const preferences = await DeviceService.getPreferences({
      userId: req.user.id,
      deviceId,
      userAgent
    });
    
    res.json(preferences);
  }

  // PUT /api/device/preferences
  async updatePreferences(req: AuthRequest, res: Response) {
    const { device_id, preferences, device_info } = req.body;
    
    const updated = await DeviceService.updatePreferences({
      userId: req.user.id,
      deviceId: device_id,
      preferences,
      deviceInfo: device_info
    });
    
    res.json(updated);
  }

  // POST /api/device/register
  async registerDevice(req: AuthRequest, res: Response) {
    const { device_info, default_preferences } = req.body;
    const deviceId = req.headers['x-device-id'] as string;
    
    const registration = await DeviceService.registerDevice({
      userId: req.user.id,
      deviceId,
      deviceInfo: device_info,
      defaultPreferences: default_preferences
    });
    
    res.json(registration);
  }
}
```

### PWAController
```typescript
class PWAController {
  // POST /api/pwa/install
  async trackInstallation(req: AuthRequest, res: Response) {
    const installation = await PWAService.trackInstallation({
      userId: req.user?.id,
      deviceId: req.headers['x-device-id'] as string,
      installationData: req.body
    });
    
    res.json({ success: true, installation_id: installation.id });
  }

  // GET /api/pwa/manifest
  async getManifest(req: Request, res: Response) {
    const manifest = await PWAService.generateManifest({
      userAgent: req.get('User-Agent'),
      theme: req.query.theme as string
    });
    
    res.json(manifest);
  }
}
```

### SyncController
```typescript
class SyncController {
  // GET /api/sync/status
  async getSyncStatus(req: AuthRequest, res: Response) {
    const deviceId = req.headers['x-device-id'] as string;
    
    const status = await SyncService.getSyncStatus({
      userId: req.user.id,
      deviceId
    });
    
    res.json(status);
  }

  // POST /api/sync/queue
  async queueActions(req: AuthRequest, res: Response) {
    const { actions } = req.body;
    const deviceId = req.headers['x-device-id'] as string;
    
    const queueResult = await SyncService.queueActions({
      userId: req.user.id,
      deviceId,
      actions
    });
    
    res.json(queueResult);
  }

  // POST /api/sync/process
  async processSync(req: AuthRequest, res: Response) {
    const { device_id, force_sync, conflict_resolution } = req.body;
    
    const results = await SyncService.processSync({
      userId: req.user.id,
      deviceId: device_id,
      forceSync: force_sync,
      conflictResolution: conflict_resolution
    });
    
    res.json(results);
  }
}
```

### NotificationController
```typescript
class NotificationController {
  // POST /api/notifications/subscribe
  async subscribe(req: AuthRequest, res: Response) {
    const { subscription, device_info, preferences } = req.body;
    
    const sub = await NotificationService.subscribe({
      userId: req.user.id,
      subscription,
      deviceInfo: device_info,
      preferences
    });
    
    res.json({ success: true, subscription_id: sub.id });
  }

  // PUT /api/notifications/preferences
  async updatePreferences(req: AuthRequest, res: Response) {
    const deviceId = req.headers['x-device-id'] as string;
    
    const updated = await NotificationService.updatePreferences({
      userId: req.user.id,
      deviceId,
      preferences: req.body
    });
    
    res.json(updated);
  }

  // DELETE /api/notifications/unsubscribe
  async unsubscribe(req: AuthRequest, res: Response) {
    const { endpoint } = req.body;
    
    await NotificationService.unsubscribe({
      userId: req.user.id,
      endpoint
    });
    
    res.json({ success: true });
  }
}
```

### AdaptiveLoadingController
```typescript
class AdaptiveLoadingController {
  // GET /api/data/adaptive
  async getAdaptiveData(req: AuthRequest, res: Response) {
    const {
      device_type,
      connection,
      data_saver,
      limit = 20,
      page = 1
    } = req.query;
    
    const adaptiveData = await AdaptiveLoadingService.getData({
      userId: req.user.id,
      deviceType: device_type as string,
      connectionType: connection as string,
      dataSaverMode: data_saver === 'true',
      limit: parseInt(limit as string),
      page: parseInt(page as string)
    });
    
    // Set appropriate cache headers based on connection
    if (connection === 'wifi' || connection === '4g') {
      res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    } else {
      res.set('Cache-Control', 'public, max-age=600'); // 10 minutes for slower connections
    }
    
    res.json(adaptiveData);
  }
}
```

### Middleware for Responsive Features

#### Device Detection Middleware
```typescript
export const deviceDetectionMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userAgent = req.get('User-Agent') || '';
  const deviceId = req.headers['x-device-id'] as string;
  
  // Detect device type
  let deviceType = 'desktop';
  if (/iPhone|iPod|Android.*Mobile|Windows Phone/i.test(userAgent)) {
    deviceType = 'mobile';
  } else if (/iPad|Android(?!.*Mobile)|Tablet/i.test(userAgent)) {
    deviceType = 'tablet';
  }
  
  // Add device info to request
  (req as any).deviceInfo = {
    type: deviceType,
    id: deviceId,
    userAgent,
    // Parse additional device characteristics
    isTouchDevice: /Mobi|Android|iPad|iPhone/i.test(userAgent),
    supportsServiceWorker: true, // Modern browsers assumption
    prefersDarkMode: req.headers['sec-ch-prefers-color-scheme'] === 'dark'
  };
  
  next();
};
```

#### Network-Aware Middleware
```typescript
export const networkAwareMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const saveData = req.headers['save-data'] === 'on';
  const connectionHeader = req.headers['downlink'] as string;
  
  let connectionType = 'unknown';
  if (connectionHeader) {
    const downlink = parseFloat(connectionHeader);
    if (downlink < 0.5) connectionType = 'slow-2g';
    else if (downlink < 1.5) connectionType = '2g';
    else if (downlink < 10) connectionType = '3g';
    else connectionType = '4g';
  }
  
  (req as any).networkInfo = {
    saveData,
    connectionType,
    downlink: connectionHeader ? parseFloat(connectionHeader) : null
  };
  
  next();
};
```