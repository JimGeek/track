# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-21-advanced-ui-ux-enhancements/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Schema Changes

### UserPreferences Model
```sql
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Theme & Appearance
    theme VARCHAR(20) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system', 'high-contrast')),
    layout_density VARCHAR(20) DEFAULT 'comfortable' CHECK (layout_density IN ('compact', 'comfortable', 'spacious')),
    reduce_motion BOOLEAN DEFAULT false,
    high_contrast BOOLEAN DEFAULT false,
    
    -- Interface Preferences
    default_view VARCHAR(20) DEFAULT 'list' CHECK (default_view IN ('list', 'board', 'calendar')),
    sidebar_collapsed BOOLEAN DEFAULT false,
    show_completed_tasks BOOLEAN DEFAULT false,
    task_grouping VARCHAR(20) DEFAULT 'none' CHECK (task_grouping IN ('none', 'priority', 'due_date', 'project')),
    
    -- Notification Preferences
    enable_sound BOOLEAN DEFAULT true,
    enable_haptics BOOLEAN DEFAULT true,
    notification_position VARCHAR(20) DEFAULT 'top-right' CHECK (notification_position IN ('top-left', 'top-right', 'bottom-left', 'bottom-right')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_updated_at ON user_preferences(updated_at);
```

### KeyboardShortcuts Model
```sql
CREATE TABLE keyboard_shortcuts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Shortcut Definition
    action_name VARCHAR(100) NOT NULL,
    key_combination VARCHAR(50) NOT NULL,
    context VARCHAR(50) DEFAULT 'global', -- 'global', 'task-list', 'task-detail', 'modal'
    
    -- Metadata
    is_custom BOOLEAN DEFAULT false,
    is_enabled BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, action_name, context)
);

CREATE INDEX idx_keyboard_shortcuts_user_id ON keyboard_shortcuts(user_id);
CREATE INDEX idx_keyboard_shortcuts_context ON keyboard_shortcuts(context);
CREATE INDEX idx_keyboard_shortcuts_action_name ON keyboard_shortcuts(action_name);
```

### UIState Model (for persistent UI state)
```sql
CREATE TABLE ui_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- State Key-Value Storage
    state_key VARCHAR(100) NOT NULL,
    state_value JSONB NOT NULL,
    context VARCHAR(50) DEFAULT 'global', -- 'global', 'project', 'list'
    context_id UUID NULL, -- Reference to project/list if context-specific
    
    -- Metadata
    expires_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, state_key, context, context_id)
);

CREATE INDEX idx_ui_state_user_id ON ui_state(user_id);
CREATE INDEX idx_ui_state_key ON ui_state(state_key);
CREATE INDEX idx_ui_state_context ON ui_state(context, context_id);
CREATE INDEX idx_ui_state_expires_at ON ui_state(expires_at) WHERE expires_at IS NOT NULL;
```

### Task Order Enhancement
```sql
-- Add position tracking for drag-and-drop ordering
ALTER TABLE tasks ADD COLUMN position_in_list INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN position_in_project INTEGER DEFAULT 0;

CREATE INDEX idx_tasks_position_list ON tasks(list_id, position_in_list);
CREATE INDEX idx_tasks_position_project ON tasks(project_id, position_in_project);
```

### Accessibility Audit Log
```sql
CREATE TABLE accessibility_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    
    -- Audit Information
    audit_type VARCHAR(50) NOT NULL, -- 'keyboard_navigation', 'screen_reader', 'focus_management'
    element_selector VARCHAR(200),
    issue_description TEXT,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Context
    page_url VARCHAR(500),
    user_agent TEXT,
    assistive_technology VARCHAR(100),
    
    -- Resolution
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'ignored')),
    resolution_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX idx_accessibility_audit_status ON accessibility_audit_log(status);
CREATE INDEX idx_accessibility_audit_severity ON accessibility_audit_log(severity);
CREATE INDEX idx_accessibility_audit_type ON accessibility_audit_log(audit_type);
```

## Migrations

### Migration 001: Create User Preferences
```sql
-- Up
CREATE TABLE user_preferences (
    -- [Full table definition as above]
);

-- Migrate existing users to have default preferences
INSERT INTO user_preferences (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM user_preferences);

-- Down
DROP TABLE user_preferences;
```

### Migration 002: Create Keyboard Shortcuts
```sql
-- Up
CREATE TABLE keyboard_shortcuts (
    -- [Full table definition as above]
);

-- Insert default keyboard shortcuts for all users
INSERT INTO keyboard_shortcuts (user_id, action_name, key_combination, context, is_custom)
SELECT 
    u.id,
    shortcut.action_name,
    shortcut.key_combination,
    shortcut.context,
    false
FROM users u
CROSS JOIN (
    VALUES 
        ('navigate_up', 'j', 'global'),
        ('navigate_down', 'k', 'global'),
        ('create_task', 'c', 'task-list'),
        ('edit_task', 'e', 'task-detail'),
        ('delete_task', 'd', 'task-detail'),
        ('search', '/', 'global'),
        ('goto_home', 'g h', 'global'),
        ('goto_projects', 'g p', 'global'),
        ('goto_lists', 'g l', 'global')
) AS shortcut(action_name, key_combination, context);

-- Down
DROP TABLE keyboard_shortcuts;
```

### Migration 003: Add Task Positioning
```sql
-- Up
ALTER TABLE tasks ADD COLUMN position_in_list INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN position_in_project INTEGER DEFAULT 0;

-- Set initial positions based on created_at
WITH ranked_tasks AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (PARTITION BY list_id ORDER BY created_at) - 1 AS list_pos,
        ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at) - 1 AS project_pos
    FROM tasks
)
UPDATE tasks 
SET 
    position_in_list = ranked_tasks.list_pos,
    position_in_project = ranked_tasks.project_pos
FROM ranked_tasks
WHERE tasks.id = ranked_tasks.id;

CREATE INDEX idx_tasks_position_list ON tasks(list_id, position_in_list);
CREATE INDEX idx_tasks_position_project ON tasks(project_id, position_in_project);

-- Down
DROP INDEX idx_tasks_position_list;
DROP INDEX idx_tasks_position_project;
ALTER TABLE tasks DROP COLUMN position_in_list;
ALTER TABLE tasks DROP COLUMN position_in_project;
```