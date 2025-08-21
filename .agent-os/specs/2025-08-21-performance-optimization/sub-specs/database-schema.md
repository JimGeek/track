# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-21-performance-optimization/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Schema Changes

### Performance Metrics Table
```sql
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Metric Identity
    metric_type VARCHAR(50) NOT NULL, -- 'query', 'api', 'frontend', 'cache'
    metric_name VARCHAR(100) NOT NULL,
    
    -- Performance Data
    duration_ms INTEGER NOT NULL,
    memory_usage_mb INTEGER,
    cpu_usage_percent DECIMAL(5,2),
    
    -- Context Information
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    request_id VARCHAR(100),
    endpoint VARCHAR(200),
    query_hash VARCHAR(64), -- For SQL query identification
    
    -- Metadata
    user_agent TEXT,
    ip_address INET,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional Data
    metadata JSONB,
    
    -- Indexing
    CONSTRAINT valid_duration CHECK (duration_ms >= 0),
    CONSTRAINT valid_memory CHECK (memory_usage_mb >= 0),
    CONSTRAINT valid_cpu CHECK (cpu_usage_percent >= 0 AND cpu_usage_percent <= 100)
);

-- Indexes for performance metrics analysis
CREATE INDEX idx_performance_metrics_type_time ON performance_metrics(metric_type, timestamp);
CREATE INDEX idx_performance_metrics_user_time ON performance_metrics(user_id, timestamp);
CREATE INDEX idx_performance_metrics_duration ON performance_metrics(duration_ms);
CREATE INDEX idx_performance_metrics_endpoint ON performance_metrics(endpoint, timestamp);
CREATE INDEX idx_performance_metrics_query_hash ON performance_metrics(query_hash, timestamp);

-- Partitioning by month for better query performance
CREATE TABLE performance_metrics_y2025m08 PARTITION OF performance_metrics
    FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');
```

### Query Cache Table
```sql
CREATE TABLE query_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Cache Key
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    cache_key_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 hash of cache_key
    
    -- Cache Data
    cached_data JSONB NOT NULL,
    data_size INTEGER NOT NULL, -- Size in bytes
    
    -- Cache Metadata
    query_hash VARCHAR(64),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tags TEXT[], -- For bulk invalidation
    
    -- Timing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    access_count INTEGER DEFAULT 1,
    
    -- Performance tracking
    generation_time_ms INTEGER NOT NULL,
    hit_count INTEGER DEFAULT 0
);

CREATE INDEX idx_query_cache_key_hash ON query_cache(cache_key_hash);
CREATE INDEX idx_query_cache_expires_at ON query_cache(expires_at);
CREATE INDEX idx_query_cache_tags ON query_cache USING GIN(tags);
CREATE INDEX idx_query_cache_user_id ON query_cache(user_id);
CREATE INDEX idx_query_cache_last_accessed ON query_cache(last_accessed);
```

### Database Connection Pool Monitoring
```sql
CREATE TABLE connection_pool_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Pool Information
    pool_name VARCHAR(50) NOT NULL,
    database_name VARCHAR(50) NOT NULL,
    
    -- Connection Statistics
    total_connections INTEGER NOT NULL,
    active_connections INTEGER NOT NULL,
    idle_connections INTEGER NOT NULL,
    waiting_connections INTEGER NOT NULL,
    
    -- Performance Metrics
    avg_connection_time_ms DECIMAL(10,3),
    max_connection_time_ms INTEGER,
    connection_errors INTEGER DEFAULT 0,
    
    -- Timestamp
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_connection_pool_stats_time ON connection_pool_stats(recorded_at);
CREATE INDEX idx_connection_pool_stats_pool ON connection_pool_stats(pool_name, recorded_at);
```

### Materialized Views for Performance

#### User Activity Summary
```sql
CREATE MATERIALIZED VIEW user_activity_summary AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(DISTINCT t.id) as total_tasks,
    COUNT(DISTINCT p.id) as total_projects,
    COUNT(DISTINCT l.id) as total_lists,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as recent_tasks,
    MAX(t.updated_at) as last_activity,
    COALESCE(AVG(pm.duration_ms), 0) as avg_response_time_ms
FROM users u
LEFT JOIN tasks t ON u.id = t.user_id
LEFT JOIN projects p ON u.id = p.user_id
LEFT JOIN lists l ON u.id = l.user_id
LEFT JOIN performance_metrics pm ON u.id = pm.user_id 
    AND pm.metric_type = 'api' 
    AND pm.timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY u.id, u.email;

CREATE UNIQUE INDEX idx_user_activity_summary_user_id ON user_activity_summary(user_id);
```

#### Query Performance Summary
```sql
CREATE MATERIALIZED VIEW query_performance_summary AS
SELECT 
    query_hash,
    COUNT(*) as execution_count,
    AVG(duration_ms) as avg_duration_ms,
    MIN(duration_ms) as min_duration_ms,
    MAX(duration_ms) as max_duration_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration_ms,
    COUNT(DISTINCT user_id) as unique_users,
    MAX(timestamp) as last_execution
FROM performance_metrics
WHERE metric_type = 'query' 
    AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY query_hash
HAVING COUNT(*) > 10;

CREATE INDEX idx_query_performance_summary_hash ON query_performance_summary(query_hash);
CREATE INDEX idx_query_performance_summary_avg_duration ON query_performance_summary(avg_duration_ms);
```

### Optimized Indexes for Existing Tables

#### Tasks Table Optimization
```sql
-- Compound index for common task queries
CREATE INDEX idx_tasks_user_status_updated ON tasks(user_id, status, updated_at);
CREATE INDEX idx_tasks_list_position ON tasks(list_id, position_in_list) WHERE position_in_list IS NOT NULL;
CREATE INDEX idx_tasks_project_priority ON tasks(project_id, priority, created_at);
CREATE INDEX idx_tasks_due_date_status ON tasks(due_date, status) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_search_text ON tasks USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Partial indexes for better performance
CREATE INDEX idx_tasks_active ON tasks(user_id, updated_at) WHERE status != 'completed';
CREATE INDEX idx_tasks_overdue ON tasks(user_id, due_date) WHERE due_date < CURRENT_DATE AND status != 'completed';
```

#### Users Table Optimization
```sql
-- Index for authentication and session management
CREATE INDEX idx_users_email_active ON users(email, is_active) WHERE is_active = true;
CREATE INDEX idx_users_last_login ON users(last_login_at) WHERE last_login_at IS NOT NULL;
```

#### Projects and Lists Optimization
```sql
-- Compound indexes for common project/list queries
CREATE INDEX idx_projects_user_updated ON projects(user_id, updated_at);
CREATE INDEX idx_lists_user_project ON lists(user_id, project_id, created_at);
CREATE INDEX idx_lists_project_order ON lists(project_id, list_order) WHERE list_order IS NOT NULL;
```

## Migrations

### Migration 001: Create Performance Monitoring Tables
```sql
-- Up
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create performance metrics table with partitioning
CREATE TABLE performance_metrics (
    -- [Full table definition as above]
);

-- Create monthly partitions for the next 6 months
DO $$
DECLARE
    start_date DATE;
    end_date DATE;
    table_name TEXT;
BEGIN
    FOR i IN 0..5 LOOP
        start_date := DATE_TRUNC('month', CURRENT_DATE + (i || ' months')::INTERVAL);
        end_date := start_date + INTERVAL '1 month';
        table_name := 'performance_metrics_y' || EXTRACT(YEAR FROM start_date) || 
                     'm' || LPAD(EXTRACT(MONTH FROM start_date)::TEXT, 2, '0');
        
        EXECUTE format('CREATE TABLE %I PARTITION OF performance_metrics
                       FOR VALUES FROM (%L) TO (%L)',
                       table_name, start_date, end_date);
    END LOOP;
END $$;

-- Down
DROP TABLE performance_metrics;
```

### Migration 002: Create Query Cache Infrastructure
```sql
-- Up
CREATE TABLE query_cache (
    -- [Full table definition as above]
);

-- Create function for cache cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM query_cache WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule cache cleanup every hour
SELECT cron.schedule('cache-cleanup', '0 * * * *', 'SELECT cleanup_expired_cache();');

-- Down
SELECT cron.unschedule('cache-cleanup');
DROP FUNCTION cleanup_expired_cache();
DROP TABLE query_cache;
```

### Migration 003: Create Materialized Views
```sql
-- Up
CREATE MATERIALIZED VIEW user_activity_summary AS
    -- [Full view definition as above]

CREATE MATERIALIZED VIEW query_performance_summary AS
    -- [Full view definition as above]

-- Schedule materialized view refresh
CREATE OR REPLACE FUNCTION refresh_performance_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_activity_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY query_performance_summary;
END;
$$ LANGUAGE plpgsql;

-- Refresh views every 15 minutes
SELECT cron.schedule('refresh-views', '*/15 * * * *', 'SELECT refresh_performance_views();');

-- Down
SELECT cron.unschedule('refresh-views');
DROP FUNCTION refresh_performance_views();
DROP MATERIALIZED VIEW query_performance_summary;
DROP MATERIALIZED VIEW user_activity_summary;
```

### Migration 004: Add Performance Indexes
```sql
-- Up
-- Tasks table optimization
CREATE INDEX CONCURRENTLY idx_tasks_user_status_updated ON tasks(user_id, status, updated_at);
CREATE INDEX CONCURRENTLY idx_tasks_list_position ON tasks(list_id, position_in_list) 
    WHERE position_in_list IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_tasks_project_priority ON tasks(project_id, priority, created_at);
CREATE INDEX CONCURRENTLY idx_tasks_search_text ON tasks 
    USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Partial indexes for active tasks
CREATE INDEX CONCURRENTLY idx_tasks_active ON tasks(user_id, updated_at) 
    WHERE status != 'completed';
CREATE INDEX CONCURRENTLY idx_tasks_overdue ON tasks(user_id, due_date) 
    WHERE due_date < CURRENT_DATE AND status != 'completed';

-- Users table optimization
CREATE INDEX CONCURRENTLY idx_users_email_active ON users(email, is_active) 
    WHERE is_active = true;

-- Projects and lists optimization
CREATE INDEX CONCURRENTLY idx_projects_user_updated ON projects(user_id, updated_at);
CREATE INDEX CONCURRENTLY idx_lists_user_project ON lists(user_id, project_id, created_at);

-- Down
DROP INDEX CONCURRENTLY idx_tasks_user_status_updated;
DROP INDEX CONCURRENTLY idx_tasks_list_position;
DROP INDEX CONCURRENTLY idx_tasks_project_priority;
DROP INDEX CONCURRENTLY idx_tasks_search_text;
DROP INDEX CONCURRENTLY idx_tasks_active;
DROP INDEX CONCURRENTLY idx_tasks_overdue;
DROP INDEX CONCURRENTLY idx_users_email_active;
DROP INDEX CONCURRENTLY idx_projects_user_updated;
DROP INDEX CONCURRENTLY idx_lists_user_project;
```