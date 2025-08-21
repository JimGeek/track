# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-21-animations-micro-interactions/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Schema Changes

### Animation Preferences Table
```sql
CREATE TABLE animation_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255), -- Optional: device-specific preferences
    
    -- Animation Intensity Settings
    animation_level VARCHAR(20) DEFAULT 'normal' CHECK (animation_level IN ('none', 'reduced', 'normal', 'enhanced')),
    reduce_motion BOOLEAN DEFAULT false, -- Follows system preference
    respect_system_preference BOOLEAN DEFAULT true,
    
    -- Specific Animation Controls
    page_transitions BOOLEAN DEFAULT true,
    micro_interactions BOOLEAN DEFAULT true,
    loading_animations BOOLEAN DEFAULT true,
    hover_effects BOOLEAN DEFAULT true,
    focus_animations BOOLEAN DEFAULT true,
    
    -- Performance Settings
    enable_gpu_acceleration BOOLEAN DEFAULT true,
    animation_quality VARCHAR(20) DEFAULT 'auto' CHECK (animation_quality IN ('low', 'medium', 'high', 'auto')),
    frame_rate_limit INTEGER DEFAULT 60 CHECK (frame_rate_limit IN (30, 60, 120)),
    
    -- Timing Preferences
    animation_speed_multiplier DECIMAL(3,2) DEFAULT 1.0 CHECK (animation_speed_multiplier >= 0.5 AND animation_speed_multiplier <= 2.0),
    transition_duration_ms INTEGER DEFAULT 300 CHECK (transition_duration_ms >= 0 AND transition_duration_ms <= 2000),
    
    -- Accessibility Settings
    high_contrast_animations BOOLEAN DEFAULT false,
    focus_ring_animations BOOLEAN DEFAULT true,
    screen_reader_friendly BOOLEAN DEFAULT true,
    
    -- Battery & Performance
    battery_saver_mode BOOLEAN DEFAULT false,
    performance_mode VARCHAR(20) DEFAULT 'balanced' CHECK (performance_mode IN ('performance', 'balanced', 'battery')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, device_id)
);

CREATE INDEX idx_animation_preferences_user_id ON animation_preferences(user_id);
CREATE INDEX idx_animation_preferences_device_id ON animation_preferences(device_id);
CREATE INDEX idx_animation_preferences_updated ON animation_preferences(updated_at);
```

### Animation Performance Metrics
```sql
CREATE TABLE animation_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(100) NOT NULL,
    
    -- Device Information
    device_type VARCHAR(20) NOT NULL,
    device_id VARCHAR(255),
    user_agent TEXT,
    
    -- Animation Details
    animation_type VARCHAR(50) NOT NULL, -- 'page_transition', 'micro_interaction', 'loading', 'list_animation'
    animation_name VARCHAR(100), -- Specific animation identifier
    component_name VARCHAR(100), -- React component triggering animation
    
    -- Performance Metrics
    duration_ms INTEGER NOT NULL,
    frame_rate_avg DECIMAL(5,2),
    frame_rate_min DECIMAL(5,2),
    frame_rate_max DECIMAL(5,2),
    dropped_frames INTEGER DEFAULT 0,
    jank_count INTEGER DEFAULT 0, -- Number of frames >16.67ms
    
    -- Resource Usage
    cpu_usage_percent DECIMAL(5,2),
    memory_usage_mb DECIMAL(8,2),
    gpu_usage_percent DECIMAL(5,2),
    
    -- Animation Configuration
    used_gpu_acceleration BOOLEAN DEFAULT false,
    animation_quality VARCHAR(20) DEFAULT 'unknown',
    reduced_motion_active BOOLEAN DEFAULT false,
    
    -- Context
    viewport_width INTEGER,
    viewport_height INTEGER,
    page_path VARCHAR(500),
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_animation_perf_user_session ON animation_performance_metrics(user_id, session_id);
CREATE INDEX idx_animation_perf_type ON animation_performance_metrics(animation_type, recorded_at);
CREATE INDEX idx_animation_perf_device ON animation_performance_metrics(device_type, recorded_at);
CREATE INDEX idx_animation_perf_frame_rate ON animation_performance_metrics(frame_rate_avg);
```

### Animation Usage Analytics
```sql
CREATE TABLE animation_usage_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Animation Identification
    animation_type VARCHAR(50) NOT NULL,
    animation_trigger VARCHAR(50) NOT NULL, -- 'user_interaction', 'page_load', 'auto_trigger'
    component_path VARCHAR(200), -- Component hierarchy path
    
    -- Usage Context
    page_path VARCHAR(500),
    user_action VARCHAR(100), -- What user action triggered the animation
    
    -- Animation Completion
    completed BOOLEAN DEFAULT false,
    interrupted BOOLEAN DEFAULT false,
    skip_reason VARCHAR(100), -- If animation was skipped
    
    -- User Engagement
    user_waited BOOLEAN DEFAULT true, -- Did user wait for animation to complete
    immediate_interaction BOOLEAN DEFAULT false, -- User interacted during animation
    
    -- Performance Impact
    perceived_smoothness INTEGER CHECK (perceived_smoothness >= 1 AND perceived_smoothness <= 5), -- User rating if available
    caused_delay_ms INTEGER DEFAULT 0,
    
    -- Timestamps
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Session Info
    session_id VARCHAR(100) NOT NULL,
    device_type VARCHAR(20) NOT NULL
);

CREATE INDEX idx_animation_usage_user ON animation_usage_analytics(user_id, triggered_at);
CREATE INDEX idx_animation_usage_type ON animation_usage_analytics(animation_type, triggered_at);
CREATE INDEX idx_animation_usage_completion ON animation_usage_analytics(completed, interrupted);
```

### Animation A/B Tests
```sql
CREATE TABLE animation_ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Test Configuration
    test_name VARCHAR(100) NOT NULL,
    test_description TEXT,
    animation_type VARCHAR(50) NOT NULL,
    
    -- Variants
    variant_a_config JSONB NOT NULL, -- Animation configuration A
    variant_b_config JSONB NOT NULL, -- Animation configuration B
    
    -- Test Parameters
    traffic_split DECIMAL(3,2) DEFAULT 0.50, -- Percentage for variant A
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    
    -- Target Criteria
    target_device_types TEXT[], -- ['mobile', 'desktop', 'tablet']
    target_user_segments TEXT[], -- User segments to include
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_animation_ab_tests_status ON animation_ab_tests(status, start_date);
CREATE INDEX idx_animation_ab_tests_type ON animation_ab_tests(animation_type);
```

### Animation A/B Test Assignments
```sql
CREATE TABLE animation_ab_test_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES animation_ab_tests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(100),
    
    -- Assignment Details
    variant VARCHAR(10) NOT NULL CHECK (variant IN ('a', 'b')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Context
    device_type VARCHAR(20),
    user_agent TEXT,
    
    UNIQUE(test_id, user_id),
    UNIQUE(test_id, session_id)
);

CREATE INDEX idx_ab_test_assignments_test ON animation_ab_test_assignments(test_id, variant);
CREATE INDEX idx_ab_test_assignments_user ON animation_ab_test_assignments(user_id, assigned_at);
```

### Animation A/B Test Results
```sql
CREATE TABLE animation_ab_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES animation_ab_tests(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES animation_ab_test_assignments(id) ON DELETE CASCADE,
    
    -- Performance Results
    avg_frame_rate DECIMAL(5,2),
    animation_completion_rate DECIMAL(5,4),
    user_engagement_score DECIMAL(5,2),
    perceived_performance INTEGER CHECK (perceived_performance >= 1 AND perceived_performance <= 5),
    
    -- Usage Results
    animation_views INTEGER DEFAULT 1,
    animation_completions INTEGER DEFAULT 0,
    user_interruptions INTEGER DEFAULT 0,
    
    -- Conversion Metrics
    task_completion_rate DECIMAL(5,4),
    time_on_page_ms INTEGER,
    bounce_rate_impact DECIMAL(5,4),
    
    -- Timestamps
    first_view_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ab_test_results_test ON animation_ab_test_results(test_id);
CREATE INDEX idx_ab_test_results_assignment ON animation_ab_test_results(assignment_id);
```

### Animation Library Assets
```sql
CREATE TABLE animation_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Asset Information
    asset_name VARCHAR(100) NOT NULL UNIQUE,
    asset_type VARCHAR(20) NOT NULL CHECK (asset_type IN ('lottie', 'css', 'svg', 'video')),
    file_path VARCHAR(500) NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    
    -- Animation Metadata
    duration_ms INTEGER,
    loop_count INTEGER DEFAULT 1, -- -1 for infinite
    frame_rate INTEGER DEFAULT 60,
    
    -- Usage Context
    component_names TEXT[], -- Components that use this asset
    animation_categories TEXT[], -- Categories this asset belongs to
    device_support TEXT[] DEFAULT ARRAY['mobile', 'tablet', 'desktop'],
    
    -- Performance Characteristics
    complexity_score INTEGER CHECK (complexity_score >= 1 AND complexity_score <= 10),
    performance_impact VARCHAR(20) DEFAULT 'medium' CHECK (performance_impact IN ('low', 'medium', 'high')),
    min_device_tier VARCHAR(20) DEFAULT 'mid' CHECK (min_device_tier IN ('low', 'mid', 'high')),
    
    -- Accessibility
    accessible BOOLEAN DEFAULT true,
    reduced_motion_alternative_id UUID REFERENCES animation_assets(id),
    description TEXT, -- For screen readers
    
    -- Versioning
    version VARCHAR(20) DEFAULT '1.0.0',
    deprecated BOOLEAN DEFAULT false,
    replacement_asset_id UUID REFERENCES animation_assets(id),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_animation_assets_name ON animation_assets(asset_name);
CREATE INDEX idx_animation_assets_type ON animation_assets(asset_type);
CREATE INDEX idx_animation_assets_complexity ON animation_assets(complexity_score);
CREATE INDEX idx_animation_assets_deprecated ON animation_assets(deprecated);
```

## Migrations

### Migration 001: Create Animation Preferences System
```sql
-- Up
CREATE TABLE animation_preferences (
    -- [Full table definition as above]
);

-- Create function to detect user's reduced motion preference
CREATE OR REPLACE FUNCTION detect_reduced_motion_preference()
RETURNS TRIGGER AS $$
BEGIN
    -- Set default based on accessibility needs detection
    IF NEW.user_id IN (
        SELECT user_id FROM user_preferences 
        WHERE high_contrast = true 
        OR accessibility_mode = true
    ) THEN
        NEW.animation_level := 'reduced';
        NEW.reduce_motion := true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_detect_reduced_motion
    BEFORE INSERT ON animation_preferences
    FOR EACH ROW
    EXECUTE FUNCTION detect_reduced_motion_preference();

-- Down
DROP TRIGGER trigger_detect_reduced_motion ON animation_preferences;
DROP FUNCTION detect_reduced_motion_preference();
DROP TABLE animation_preferences;
```

### Migration 002: Create Animation Analytics Tables
```sql
-- Up
CREATE TABLE animation_performance_metrics (
    -- [Full table definition as above]
);

CREATE TABLE animation_usage_analytics (
    -- [Full table definition as above]
);

-- Partition performance metrics by month for better query performance
CREATE TABLE animation_performance_metrics_y2025m08 PARTITION OF animation_performance_metrics
    FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

-- Function to clean up old metrics
CREATE OR REPLACE FUNCTION cleanup_old_animation_metrics()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete metrics older than 90 days
    DELETE FROM animation_performance_metrics 
    WHERE recorded_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete usage analytics older than 180 days
    DELETE FROM animation_usage_analytics 
    WHERE triggered_at < CURRENT_TIMESTAMP - INTERVAL '180 days';
    
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup weekly
SELECT cron.schedule('animation-metrics-cleanup', '0 2 * * 0', 'SELECT cleanup_old_animation_metrics();');

-- Down
SELECT cron.unschedule('animation-metrics-cleanup');
DROP FUNCTION cleanup_old_animation_metrics();
DROP TABLE animation_usage_analytics;
DROP TABLE animation_performance_metrics;
```

### Migration 003: Create A/B Testing Infrastructure
```sql
-- Up
CREATE TABLE animation_ab_tests (
    -- [Full table definition as above]
);

CREATE TABLE animation_ab_test_assignments (
    -- [Full table definition as above]
);

CREATE TABLE animation_ab_test_results (
    -- [Full table definition as above]
);

-- Function to assign users to A/B test variants
CREATE OR REPLACE FUNCTION assign_ab_test_variant(test_uuid UUID, user_uuid UUID, session_uuid VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    test_record animation_ab_tests%ROWTYPE;
    assignment_exists BOOLEAN;
    variant VARCHAR(10);
    random_value DECIMAL(3,2);
BEGIN
    -- Get test configuration
    SELECT * INTO test_record FROM animation_ab_tests WHERE id = test_uuid AND status = 'active';
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Check if assignment already exists
    SELECT EXISTS(
        SELECT 1 FROM animation_ab_test_assignments 
        WHERE test_id = test_uuid AND (user_id = user_uuid OR session_id = session_uuid)
    ) INTO assignment_exists;
    
    IF assignment_exists THEN
        -- Return existing assignment
        SELECT variant INTO variant FROM animation_ab_test_assignments 
        WHERE test_id = test_uuid AND (user_id = user_uuid OR session_id = session_uuid);
        RETURN variant;
    END IF;
    
    -- Create new assignment
    random_value := RANDOM();
    variant := CASE WHEN random_value < test_record.traffic_split THEN 'a' ELSE 'b' END;
    
    INSERT INTO animation_ab_test_assignments (test_id, user_id, session_id, variant)
    VALUES (test_uuid, user_uuid, session_uuid, variant);
    
    RETURN variant;
END;
$$ LANGUAGE plpgsql;

-- Down
DROP FUNCTION assign_ab_test_variant(UUID, UUID, VARCHAR);
DROP TABLE animation_ab_test_results;
DROP TABLE animation_ab_test_assignments;
DROP TABLE animation_ab_tests;
```

### Migration 004: Create Animation Assets Management
```sql
-- Up
CREATE TABLE animation_assets (
    -- [Full table definition as above]
);

-- Function to calculate asset complexity score
CREATE OR REPLACE FUNCTION calculate_animation_complexity(
    asset_type_param VARCHAR,
    duration_param INTEGER,
    file_size_param INTEGER
) RETURNS INTEGER AS $$
DECLARE
    complexity INTEGER := 1;
BEGIN
    -- Base complexity by type
    CASE asset_type_param
        WHEN 'lottie' THEN complexity := complexity + 3;
        WHEN 'video' THEN complexity := complexity + 4;
        WHEN 'svg' THEN complexity := complexity + 2;
        WHEN 'css' THEN complexity := complexity + 1;
    END CASE;
    
    -- Add complexity based on duration
    IF duration_param > 2000 THEN
        complexity := complexity + 2;
    ELSIF duration_param > 1000 THEN
        complexity := complexity + 1;
    END IF;
    
    -- Add complexity based on file size
    IF file_size_param > 500000 THEN  -- > 500KB
        complexity := complexity + 3;
    ELSIF file_size_param > 100000 THEN  -- > 100KB
        complexity := complexity + 2;
    ELSIF file_size_param > 50000 THEN   -- > 50KB
        complexity := complexity + 1;
    END IF;
    
    -- Cap at 10
    RETURN LEAST(complexity, 10);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to automatically calculate complexity
CREATE OR REPLACE FUNCTION auto_calculate_complexity()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.complexity_score IS NULL THEN
        NEW.complexity_score := calculate_animation_complexity(
            NEW.asset_type,
            NEW.duration_ms,
            NEW.file_size_bytes
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_calculate_complexity
    BEFORE INSERT OR UPDATE ON animation_assets
    FOR EACH ROW
    EXECUTE FUNCTION auto_calculate_complexity();

-- Down
DROP TRIGGER trigger_auto_calculate_complexity ON animation_assets;
DROP FUNCTION auto_calculate_complexity();
DROP FUNCTION calculate_animation_complexity(VARCHAR, INTEGER, INTEGER);
DROP TABLE animation_assets;
```