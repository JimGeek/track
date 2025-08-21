# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-21-responsive-design-system/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Schema Changes

### Device Preferences Table
```sql
CREATE TABLE device_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Device Information
    device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
    device_id VARCHAR(255) NOT NULL, -- Unique device fingerprint
    user_agent TEXT,
    screen_width INTEGER,
    screen_height INTEGER,
    pixel_ratio DECIMAL(3,2),
    
    -- Device-Specific Preferences
    preferred_orientation VARCHAR(20) DEFAULT 'auto' CHECK (preferred_orientation IN ('auto', 'portrait', 'landscape')),
    touch_sensitivity VARCHAR(20) DEFAULT 'normal' CHECK (touch_sensitivity IN ('low', 'normal', 'high')),
    gesture_navigation BOOLEAN DEFAULT true,
    haptic_feedback BOOLEAN DEFAULT true,
    reduce_motion BOOLEAN DEFAULT false,
    
    -- Layout Preferences
    layout_style VARCHAR(20) DEFAULT 'auto' CHECK (layout_style IN ('auto', 'compact', 'comfortable', 'spacious')),
    navigation_style VARCHAR(20) DEFAULT 'auto' CHECK (navigation_style IN ('auto', 'bottom_tabs', 'drawer', 'sidebar')),
    font_scale DECIMAL(3,2) DEFAULT 1.0 CHECK (font_scale >= 0.8 AND font_scale <= 2.0),
    
    -- Network Preferences
    data_saver_mode BOOLEAN DEFAULT false,
    offline_sync_enabled BOOLEAN DEFAULT true,
    background_sync BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, device_id)
);

CREATE INDEX idx_device_preferences_user_id ON device_preferences(user_id);
CREATE INDEX idx_device_preferences_device_type ON device_preferences(device_type);
CREATE INDEX idx_device_preferences_last_used ON device_preferences(last_used_at);
```

### PWA Installation Tracking
```sql
CREATE TABLE pwa_installations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Installation Details
    device_id VARCHAR(255) NOT NULL,
    installation_source VARCHAR(50) NOT NULL, -- 'browser_prompt', 'custom_prompt', 'share_menu'
    platform VARCHAR(50) NOT NULL, -- 'android', 'ios', 'windows', 'macos', 'linux'
    browser VARCHAR(50) NOT NULL,
    
    -- Installation Context
    page_url VARCHAR(500),
    user_agent TEXT,
    referrer VARCHAR(500),
    
    -- Installation Status
    prompt_shown_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    installation_accepted BOOLEAN,
    installation_completed_at TIMESTAMP WITH TIME ZONE NULL,
    uninstalled_at TIMESTAMP WITH TIME ZONE NULL,
    
    -- Engagement Tracking
    days_to_install INTEGER,
    sessions_before_install INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pwa_installations_user_id ON pwa_installations(user_id);
CREATE INDEX idx_pwa_installations_device_id ON pwa_installations(device_id);
CREATE INDEX idx_pwa_installations_platform ON pwa_installations(platform);
CREATE INDEX idx_pwa_installations_source ON pwa_installations(installation_source);
```

### Offline Sync Queue
```sql
CREATE TABLE offline_sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    
    -- Action Details
    action_type VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'bulk_update'
    entity_type VARCHAR(50) NOT NULL, -- 'task', 'project', 'list', 'user_preference'
    entity_id UUID,
    
    -- Action Data
    action_data JSONB NOT NULL,
    original_data JSONB, -- For rollback purposes
    
    -- Sync Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'conflicted')),
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Timing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE NULL,
    
    -- Error Handling
    error_message TEXT,
    conflict_resolution VARCHAR(20) CHECK (conflict_resolution IN ('manual', 'server_wins', 'client_wins', 'merge')),
    
    -- Metadata
    client_timestamp TIMESTAMP WITH TIME ZONE,
    network_available BOOLEAN DEFAULT false
);

CREATE INDEX idx_offline_sync_queue_user_device ON offline_sync_queue(user_id, device_id);
CREATE INDEX idx_offline_sync_queue_status ON offline_sync_queue(status, scheduled_for);
CREATE INDEX idx_offline_sync_queue_entity ON offline_sync_queue(entity_type, entity_id);
CREATE INDEX idx_offline_sync_queue_created ON offline_sync_queue(created_at);
```

### Responsive Layout Analytics
```sql
CREATE TABLE responsive_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(100) NOT NULL,
    
    -- Device Information
    device_type VARCHAR(20) NOT NULL,
    screen_width INTEGER NOT NULL,
    screen_height INTEGER NOT NULL,
    viewport_width INTEGER NOT NULL,
    viewport_height INTEGER NOT NULL,
    pixel_ratio DECIMAL(3,2) NOT NULL,
    orientation VARCHAR(20) NOT NULL,
    
    -- Interaction Data
    page_path VARCHAR(500) NOT NULL,
    layout_breakpoint VARCHAR(20) NOT NULL, -- 'mobile', 'tablet', 'desktop'
    navigation_type VARCHAR(20), -- 'bottom_tabs', 'drawer', 'sidebar'
    interaction_type VARCHAR(50), -- 'tap', 'swipe', 'long_press', 'drag'
    
    -- Performance Metrics
    load_time_ms INTEGER,
    time_to_interactive_ms INTEGER,
    largest_contentful_paint_ms INTEGER,
    cumulative_layout_shift DECIMAL(5,4),
    
    -- User Behavior
    session_duration_ms INTEGER,
    scroll_depth_percent INTEGER,
    gestures_used TEXT[], -- Array of gestures used in session
    
    -- Timestamp
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_responsive_analytics_user_session ON responsive_analytics(user_id, session_id);
CREATE INDEX idx_responsive_analytics_device ON responsive_analytics(device_type, recorded_at);
CREATE INDEX idx_responsive_analytics_breakpoint ON responsive_analytics(layout_breakpoint, recorded_at);
CREATE INDEX idx_responsive_analytics_page ON responsive_analytics(page_path, recorded_at);
```

### Push Notification Subscriptions
```sql
CREATE TABLE push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    
    -- Subscription Details
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    
    -- Device Information
    user_agent TEXT,
    platform VARCHAR(50),
    browser VARCHAR(50),
    
    -- Subscription Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Notification Preferences
    notification_types TEXT[] DEFAULT ARRAY['task_due', 'task_assigned', 'project_update'],
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(50),
    
    UNIQUE(user_id, endpoint)
);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_device_id ON push_subscriptions(device_id);
CREATE INDEX idx_push_subscriptions_active ON push_subscriptions(is_active, expires_at);
```

### Service Worker Cache Management
```sql
CREATE TABLE service_worker_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Cache Details
    cache_name VARCHAR(100) NOT NULL,
    cache_key VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    
    -- Cache Metadata
    content_type VARCHAR(100),
    content_length INTEGER,
    etag VARCHAR(255),
    last_modified TIMESTAMP WITH TIME ZONE,
    
    -- Cache Strategy
    strategy VARCHAR(20) NOT NULL, -- 'cache_first', 'network_first', 'stale_while_revalidate'
    max_age_seconds INTEGER,
    
    -- Usage Tracking
    hit_count INTEGER DEFAULT 0,
    miss_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(cache_name, cache_key)
);

CREATE INDEX idx_service_worker_cache_name ON service_worker_cache(cache_name);
CREATE INDEX idx_service_worker_cache_url ON service_worker_cache(url);
CREATE INDEX idx_service_worker_cache_expires ON service_worker_cache(expires_at);
CREATE INDEX idx_service_worker_cache_accessed ON service_worker_cache(last_accessed);
```

### Enhanced User Sessions for Multi-Device
```sql
-- Add columns to existing users table or create user_sessions table
ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_device_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_device VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS sync_preferences JSONB DEFAULT '{}';

-- User Sessions Table for Multi-Device Management
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    
    -- Session Details
    session_token VARCHAR(255) UNIQUE NOT NULL,
    device_type VARCHAR(20) NOT NULL,
    platform VARCHAR(50),
    browser VARCHAR(50),
    
    -- Session State
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Sync State
    last_sync_at TIMESTAMP WITH TIME ZONE,
    pending_sync_actions INTEGER DEFAULT 0,
    offline_duration_ms INTEGER DEFAULT 0,
    
    UNIQUE(user_id, device_id)
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active, last_activity);
```

## Migrations

### Migration 001: Create Device Preferences
```sql
-- Up
CREATE TABLE device_preferences (
    -- [Full table definition as above]
);

-- Create function to detect device type from user agent
CREATE OR REPLACE FUNCTION detect_device_type(user_agent_string TEXT)
RETURNS VARCHAR(20) AS $$
BEGIN
    IF user_agent_string ~* '(iPhone|iPod|Android.*Mobile|Windows Phone)' THEN
        RETURN 'mobile';
    ELSIF user_agent_string ~* '(iPad|Android(?!.*Mobile)|Tablet)' THEN
        RETURN 'tablet';
    ELSE
        RETURN 'desktop';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Down
DROP FUNCTION detect_device_type(TEXT);
DROP TABLE device_preferences;
```

### Migration 002: Create PWA and Offline Infrastructure
```sql
-- Up
CREATE TABLE pwa_installations (
    -- [Full table definition as above]
);

CREATE TABLE offline_sync_queue (
    -- [Full table definition as above]
);

CREATE TABLE push_subscriptions (
    -- [Full table definition as above]
);

-- Create function to clean up old sync queue entries
CREATE OR REPLACE FUNCTION cleanup_sync_queue()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete completed entries older than 7 days
    DELETE FROM offline_sync_queue 
    WHERE status = 'completed' 
    AND processed_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete failed entries older than 30 days
    DELETE FROM offline_sync_queue 
    WHERE status = 'failed' 
    AND created_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup every day at 2 AM
SELECT cron.schedule('sync-queue-cleanup', '0 2 * * *', 'SELECT cleanup_sync_queue();');

-- Down
SELECT cron.unschedule('sync-queue-cleanup');
DROP FUNCTION cleanup_sync_queue();
DROP TABLE push_subscriptions;
DROP TABLE offline_sync_queue;
DROP TABLE pwa_installations;
```

### Migration 003: Create Analytics and Caching
```sql
-- Up
CREATE TABLE responsive_analytics (
    -- [Full table definition as above]
);

CREATE TABLE service_worker_cache (
    -- [Full table definition as above]
);

-- Partition responsive_analytics by month
CREATE TABLE responsive_analytics_y2025m08 PARTITION OF responsive_analytics
    FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

CREATE TABLE responsive_analytics_y2025m09 PARTITION OF responsive_analytics
    FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');

-- Function to auto-create monthly partitions
CREATE OR REPLACE FUNCTION create_responsive_analytics_partition(target_date DATE)
RETURNS TEXT AS $$
DECLARE
    table_name TEXT;
    start_date DATE;
    end_date DATE;
BEGIN
    start_date := DATE_TRUNC('month', target_date);
    end_date := start_date + INTERVAL '1 month';
    table_name := 'responsive_analytics_y' || EXTRACT(YEAR FROM start_date) || 
                 'm' || LPAD(EXTRACT(MONTH FROM start_date)::TEXT, 2, '0');
    
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF responsive_analytics
                   FOR VALUES FROM (%L) TO (%L)',
                   table_name, start_date, end_date);
    
    RETURN table_name;
END;
$$ LANGUAGE plpgsql;

-- Down
DROP FUNCTION create_responsive_analytics_partition(DATE);
DROP TABLE service_worker_cache;
DROP TABLE responsive_analytics;
```

### Migration 004: Enhance User Sessions
```sql
-- Up
-- Add device tracking to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS primary_device_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_active_device VARCHAR(255),
ADD COLUMN IF NOT EXISTS sync_preferences JSONB DEFAULT '{}';

-- Create user sessions table
CREATE TABLE user_sessions (
    -- [Full table definition as above]
);

-- Create function to update user activity
CREATE OR REPLACE FUNCTION update_user_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last activity for user sessions
    UPDATE user_sessions 
    SET 
        last_activity = CURRENT_TIMESTAMP,
        pending_sync_actions = CASE 
            WHEN NEW.updated_at > OLD.updated_at THEN pending_sync_actions + 1
            ELSE pending_sync_actions
        END
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic activity tracking
CREATE TRIGGER trigger_update_user_activity_tasks
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_user_activity();

CREATE TRIGGER trigger_update_user_activity_projects
    AFTER UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_user_activity();

-- Down
DROP TRIGGER trigger_update_user_activity_projects ON projects;
DROP TRIGGER trigger_update_user_activity_tasks ON tasks;
DROP FUNCTION update_user_activity();
DROP TABLE user_sessions;
ALTER TABLE users 
DROP COLUMN IF EXISTS sync_preferences,
DROP COLUMN IF EXISTS last_active_device,
DROP COLUMN IF EXISTS primary_device_id;
```