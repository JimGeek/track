# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-21-advanced-ui-ux-enhancements/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Endpoints

### User Preferences API

#### GET /api/preferences
**Purpose:** Retrieve user preferences
```json
{
  "theme": "dark",
  "layout_density": "comfortable",
  "reduce_motion": false,
  "high_contrast": false,
  "default_view": "list",
  "sidebar_collapsed": false,
  "show_completed_tasks": true,
  "task_grouping": "priority",
  "enable_sound": true,
  "enable_haptics": true,
  "notification_position": "top-right"
}
```

#### PUT /api/preferences
**Purpose:** Update user preferences
**Request Body:**
```json
{
  "theme": "dark",
  "reduce_motion": true,
  "layout_density": "compact"
}
```

#### PATCH /api/preferences
**Purpose:** Partial preference updates
**Request Body:**
```json
{
  "sidebar_collapsed": true
}
```

### Keyboard Shortcuts API

#### GET /api/keyboard-shortcuts
**Purpose:** Get user's keyboard shortcuts
```json
{
  "shortcuts": [
    {
      "action_name": "navigate_up",
      "key_combination": "j",
      "context": "global",
      "is_custom": false,
      "is_enabled": true
    },
    {
      "action_name": "create_task",
      "key_combination": "ctrl+n",
      "context": "task-list",
      "is_custom": true,
      "is_enabled": true
    }
  ]
}
```

#### PUT /api/keyboard-shortcuts
**Purpose:** Update keyboard shortcut configuration
**Request Body:**
```json
{
  "shortcuts": [
    {
      "action_name": "create_task",
      "key_combination": "ctrl+shift+n",
      "context": "global",
      "is_enabled": true
    }
  ]
}
```

#### POST /api/keyboard-shortcuts/reset
**Purpose:** Reset shortcuts to defaults

### Bulk Operations API

#### POST /api/tasks/bulk-action
**Purpose:** Perform bulk operations on multiple tasks
**Request Body:**
```json
{
  "action": "update_status",
  "task_ids": ["uuid1", "uuid2", "uuid3"],
  "data": {
    "status": "completed"
  }
}
```

**Supported Actions:**
- `update_status`: Change status of multiple tasks
- `move_to_list`: Move tasks to different list
- `assign_to_project`: Assign tasks to project
- `delete`: Delete multiple tasks
- `set_priority`: Set priority for multiple tasks

**Response:**
```json
{
  "success": true,
  "processed": 3,
  "failed": 0,
  "errors": [],
  "updated_tasks": [
    {
      "id": "uuid1",
      "status": "completed",
      "updated_at": "2025-08-21T10:30:00Z"
    }
  ]
}
```

### Drag-and-Drop API

#### POST /api/tasks/reorder
**Purpose:** Handle drag-and-drop reordering
**Request Body:**
```json
{
  "task_id": "uuid1",
  "source_list_id": "list1",
  "target_list_id": "list2",
  "target_position": 3,
  "operation": "move" // or "reorder"
}
```

**Response:**
```json
{
  "success": true,
  "updated_task": {
    "id": "uuid1",
    "list_id": "list2",
    "position_in_list": 3,
    "updated_at": "2025-08-21T10:30:00Z"
  },
  "affected_tasks": [
    {
      "id": "uuid2",
      "position_in_list": 4
    }
  ]
}
```

### UI State API

#### GET /api/ui-state/:key
**Purpose:** Retrieve persistent UI state
**Response:**
```json
{
  "state_key": "sidebar_width",
  "state_value": {"width": 280},
  "context": "global"
}
```

#### PUT /api/ui-state/:key
**Purpose:** Store UI state
**Request Body:**
```json
{
  "state_value": {"width": 320, "collapsed": false},
  "context": "global",
  "expires_at": "2025-09-21T10:30:00Z"
}
```

### Accessibility API

#### POST /api/accessibility/audit
**Purpose:** Report accessibility issues
**Request Body:**
```json
{
  "audit_type": "keyboard_navigation",
  "element_selector": ".task-item:nth-child(5)",
  "issue_description": "Element not focusable with tab navigation",
  "severity": "high",
  "page_url": "/dashboard",
  "assistive_technology": "NVDA"
}
```

#### GET /api/accessibility/preferences
**Purpose:** Get accessibility-specific preferences
```json
{
  "screen_reader_optimized": true,
  "keyboard_navigation_enabled": true,
  "high_contrast_mode": false,
  "reduce_motion": true,
  "focus_indicators": "enhanced",
  "announcement_verbosity": "detailed"
}
```

## Controllers

### PreferencesController
```typescript
class PreferencesController {
  // GET /api/preferences
  async getPreferences(req: AuthRequest, res: Response) {
    const preferences = await PreferenceService.getUserPreferences(req.user.id);
    res.json(preferences);
  }

  // PUT /api/preferences
  async updatePreferences(req: AuthRequest, res: Response) {
    const updatedPreferences = await PreferenceService.updateUserPreferences(
      req.user.id,
      req.body
    );
    res.json(updatedPreferences);
  }

  // PATCH /api/preferences
  async patchPreferences(req: AuthRequest, res: Response) {
    const preferences = await PreferenceService.patchUserPreferences(
      req.user.id,
      req.body
    );
    res.json(preferences);
  }
}
```

### KeyboardShortcutsController
```typescript
class KeyboardShortcutsController {
  // GET /api/keyboard-shortcuts
  async getShortcuts(req: AuthRequest, res: Response) {
    const shortcuts = await KeyboardShortcutService.getUserShortcuts(req.user.id);
    res.json({ shortcuts });
  }

  // PUT /api/keyboard-shortcuts
  async updateShortcuts(req: AuthRequest, res: Response) {
    const shortcuts = await KeyboardShortcutService.updateUserShortcuts(
      req.user.id,
      req.body.shortcuts
    );
    res.json({ shortcuts });
  }

  // POST /api/keyboard-shortcuts/reset
  async resetShortcuts(req: AuthRequest, res: Response) {
    const shortcuts = await KeyboardShortcutService.resetToDefaults(req.user.id);
    res.json({ shortcuts });
  }
}
```

### BulkOperationsController
```typescript
class BulkOperationsController {
  // POST /api/tasks/bulk-action
  async performBulkAction(req: AuthRequest, res: Response) {
    const { action, task_ids, data } = req.body;
    
    const result = await BulkOperationService.performBulkAction({
      userId: req.user.id,
      action,
      taskIds: task_ids,
      data
    });

    res.json(result);
  }
}
```

### DragDropController
```typescript
class DragDropController {
  // POST /api/tasks/reorder
  async reorderTasks(req: AuthRequest, res: Response) {
    const reorderResult = await DragDropService.reorderTask({
      userId: req.user.id,
      taskId: req.body.task_id,
      sourceListId: req.body.source_list_id,
      targetListId: req.body.target_list_id,
      targetPosition: req.body.target_position,
      operation: req.body.operation
    });

    res.json(reorderResult);
  }
}
```

### UIStateController
```typescript
class UIStateController {
  // GET /api/ui-state/:key
  async getUIState(req: AuthRequest, res: Response) {
    const { key } = req.params;
    const state = await UIStateService.getUIState(req.user.id, key);
    res.json(state);
  }

  // PUT /api/ui-state/:key
  async setUIState(req: AuthRequest, res: Response) {
    const { key } = req.params;
    const { state_value, context, expires_at } = req.body;
    
    const state = await UIStateService.setUIState(req.user.id, {
      key,
      value: state_value,
      context,
      expiresAt: expires_at
    });
    
    res.json(state);
  }
}
```