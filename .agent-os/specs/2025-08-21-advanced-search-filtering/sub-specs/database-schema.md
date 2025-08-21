# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-21-advanced-search-filtering/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Schema Changes

### New Tables

#### SearchableContent
```sql
CREATE TABLE searchable_content (
    id SERIAL PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL,
    object_id INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT, -- First 300 characters for previews
    
    -- Search metadata
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    keywords TEXT[], -- Extracted keywords for search boosting
    
    -- Search optimization
    search_vector tsvector,
    popularity_score DECIMAL(10,2) DEFAULT 0.00,
    boost_factor DECIMAL(3,2) DEFAULT 1.00,
    
    -- Access control
    is_public BOOLEAN DEFAULT TRUE,
    accessible_by_users INTEGER[],
    accessible_by_teams INTEGER[],
    
    -- Tracking
    view_count INTEGER DEFAULT 0,
    search_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_content_object UNIQUE (content_type, object_id)
);
```

#### SavedSearch
```sql
CREATE TABLE saved_searches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Search configuration
    query_text TEXT,
    filters JSONB DEFAULT '{}',
    sort_config JSONB DEFAULT '{}',
    facet_config JSONB DEFAULT '{}',
    
    -- Display settings
    results_per_page INTEGER DEFAULT 20,
    display_fields JSONB DEFAULT '[]',
    highlight_enabled BOOLEAN DEFAULT TRUE,
    
    -- Sharing and collaboration
    is_shared BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    share_token VARCHAR(32) UNIQUE,
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMPTZ,
    avg_results_count INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER DEFAULT 0,
    
    -- Notifications
    alert_enabled BOOLEAN DEFAULT FALSE,
    alert_frequency VARCHAR(20) DEFAULT 'never' CHECK (
        alert_frequency IN ('never', 'immediate', 'daily', 'weekly')
    ),
    last_alert_sent TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_search_name UNIQUE (user_id, name)
);
```

#### SavedSearchShare
```sql
CREATE TABLE saved_search_shares (
    id SERIAL PRIMARY KEY,
    saved_search_id INTEGER NOT NULL REFERENCES saved_searches(id) ON DELETE CASCADE,
    shared_with_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    shared_with_team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    permission_level VARCHAR(20) DEFAULT 'view' CHECK (
        permission_level IN ('view', 'edit', 'admin')
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_id INTEGER NOT NULL REFERENCES users(id),
    
    CONSTRAINT check_share_target CHECK (
        (shared_with_user_id IS NOT NULL AND shared_with_team_id IS NULL) OR
        (shared_with_user_id IS NULL AND shared_with_team_id IS NOT NULL)
    )
);
```

#### SearchAnalytics
```sql
CREATE TABLE search_analytics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    
    -- Query details
    query_text TEXT,
    parsed_query JSONB,
    filters_applied JSONB DEFAULT '{}',
    sort_applied VARCHAR(100),
    
    -- Results and performance
    results_count INTEGER DEFAULT 0,
    results_returned INTEGER DEFAULT 0,
    response_time_ms INTEGER DEFAULT 0,
    page_number INTEGER DEFAULT 1,
    
    -- User interaction
    clicked_results JSONB DEFAULT '[]', -- Array of clicked result IDs and positions
    time_spent_seconds INTEGER DEFAULT 0,
    refined_search BOOLEAN DEFAULT FALSE,
    
    -- Context
    search_source VARCHAR(50) DEFAULT 'main_search', -- main_search, quick_search, saved_search
    referrer_page VARCHAR(200),
    user_agent TEXT,
    ip_address INET,
    
    -- Search success metrics
    found_what_looking_for BOOLEAN,
    search_abandoned BOOLEAN DEFAULT FALSE,
    
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_search_analytics_timestamp ON search_analytics(timestamp DESC),
    INDEX idx_search_analytics_user_timestamp ON search_analytics(user_id, timestamp DESC)
);
```

#### SearchSuggestions
```sql
CREATE TABLE search_suggestions (
    id SERIAL PRIMARY KEY,
    suggestion_text VARCHAR(200) NOT NULL,
    suggestion_type VARCHAR(50) DEFAULT 'query' CHECK (
        suggestion_type IN ('query', 'filter', 'field_value', 'tag')
    ),
    
    -- Suggestion metadata
    context_type VARCHAR(50), -- project, feature, user, etc.
    context_id INTEGER,
    category VARCHAR(50),
    
    -- Ranking and popularity
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00, -- % of times this suggestion led to clicks
    popularity_score DECIMAL(10,2) DEFAULT 0.00,
    
    -- Suggestion source
    source VARCHAR(50) DEFAULT 'user_generated' CHECK (
        source IN ('user_generated', 'auto_extracted', 'admin_curated')
    ),
    
    -- Status and validation
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by_id INTEGER REFERENCES users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_suggestion_text UNIQUE (suggestion_text, suggestion_type)
);
```

#### SearchFilters
```sql
CREATE TABLE search_filters (
    id SERIAL PRIMARY KEY,
    field_name VARCHAR(100) NOT NULL,
    field_type VARCHAR(50) NOT NULL CHECK (
        field_type IN ('text', 'number', 'date', 'boolean', 'select', 'multi_select', 'range')
    ),
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Filter configuration
    filter_config JSONB DEFAULT '{}', -- Options, validation rules, etc.
    default_operator VARCHAR(20) DEFAULT 'equals',
    available_operators JSONB DEFAULT '["equals", "contains", "starts_with"]',
    
    -- UI configuration
    input_type VARCHAR(50) DEFAULT 'text',
    placeholder_text VARCHAR(200),
    help_text TEXT,
    
    -- Data source for select filters
    data_source VARCHAR(100), -- table name or API endpoint
    value_field VARCHAR(50),
    label_field VARCHAR(50),
    
    -- Permissions and visibility
    is_public BOOLEAN DEFAULT TRUE,
    required_permissions JSONB DEFAULT '[]',
    visible_to_roles JSONB DEFAULT '["all"]',
    
    -- Usage and popularity
    usage_count INTEGER DEFAULT 0,
    is_popular BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_deprecated BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_filter_field UNIQUE (field_name)
);
```

#### SearchIndexQueue
```sql
CREATE TABLE search_index_queue (
    id SERIAL PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL,
    object_id INTEGER NOT NULL,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('index', 'update', 'delete')),
    
    -- Queue management
    priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)
    max_attempts INTEGER DEFAULT 3,
    attempt_count INTEGER DEFAULT 0,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')
    ),
    
    -- Error handling
    error_message TEXT,
    last_error_at TIMESTAMPTZ,
    
    -- Timing
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_search_queue_status_priority ON search_index_queue(status, priority, scheduled_at)
);
```

### Indexes for Performance

```sql
-- Full-text search indexes
CREATE INDEX idx_searchable_content_search_vector ON searchable_content USING gin(search_vector);
CREATE INDEX idx_searchable_content_keywords ON searchable_content USING gin(keywords);
CREATE INDEX idx_searchable_content_tags ON searchable_content USING gin(tags);

-- Content type and popularity
CREATE INDEX idx_searchable_content_type_popularity ON searchable_content(content_type, popularity_score DESC);
CREATE INDEX idx_searchable_content_public_popular ON searchable_content(is_public, popularity_score DESC) WHERE is_public = TRUE;
CREATE INDEX idx_searchable_content_updated ON searchable_content(updated_at DESC);

-- Access control indexes
CREATE INDEX idx_searchable_content_accessible_users ON searchable_content USING gin(accessible_by_users);
CREATE INDEX idx_searchable_content_accessible_teams ON searchable_content USING gin(accessible_by_teams);

-- Saved search indexes
CREATE INDEX idx_saved_searches_user_updated ON saved_searches(user_id, updated_at DESC);
CREATE INDEX idx_saved_searches_public ON saved_searches(is_public, usage_count DESC) WHERE is_public = TRUE;
CREATE INDEX idx_saved_searches_shared ON saved_searches(is_shared) WHERE is_shared = TRUE;

-- Analytics indexes for reporting
CREATE INDEX idx_search_analytics_date_range ON search_analytics(timestamp) WHERE timestamp >= NOW() - INTERVAL '90 days';
CREATE INDEX idx_search_analytics_user_date ON search_analytics(user_id, timestamp DESC);
CREATE INDEX idx_search_analytics_query_hash ON search_analytics(md5(query_text));

-- Suggestion indexes
CREATE INDEX idx_search_suggestions_active_popular ON search_suggestions(is_active, popularity_score DESC) WHERE is_active = TRUE;
CREATE INDEX idx_search_suggestions_type_context ON search_suggestions(suggestion_type, context_type, usage_count DESC);

-- Filter configuration indexes
CREATE INDEX idx_search_filters_active_order ON search_filters(is_active, display_order) WHERE is_active = TRUE;
CREATE INDEX idx_search_filters_popular ON search_filters(is_popular, usage_count DESC) WHERE is_popular = TRUE;
```

### Materialized Views

#### PopularSearches
```sql
CREATE MATERIALIZED VIEW popular_searches AS
SELECT 
    query_text,
    COUNT(*) as search_count,
    COUNT(DISTINCT user_id) as unique_users,
    AVG(results_count) as avg_results,
    AVG(response_time_ms) as avg_response_time,
    COUNT(CASE WHEN clicked_results != '[]' THEN 1 END) as searches_with_clicks,
    ROUND(
        COUNT(CASE WHEN clicked_results != '[]' THEN 1 END)::decimal / COUNT(*) * 100, 2
    ) as click_through_rate
FROM search_analytics 
WHERE timestamp >= NOW() - INTERVAL '30 days'
    AND query_text IS NOT NULL
    AND TRIM(query_text) != ''
GROUP BY query_text
HAVING COUNT(*) >= 5 -- Only include queries used at least 5 times
ORDER BY search_count DESC;

CREATE INDEX idx_popular_searches_count ON popular_searches(search_count DESC);
```

#### SearchPerformanceMetrics
```sql
CREATE MATERIALIZED VIEW search_performance_metrics AS
SELECT 
    DATE_TRUNC('day', timestamp) as date,
    COUNT(*) as total_searches,
    COUNT(DISTINCT user_id) as unique_searchers,
    COUNT(DISTINCT session_id) as unique_sessions,
    
    -- Performance metrics
    AVG(response_time_ms) as avg_response_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) as p95_response_time,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time_ms) as p99_response_time,
    
    -- Result metrics
    AVG(results_count) as avg_results_count,
    COUNT(CASE WHEN results_count = 0 THEN 1 END) as zero_result_searches,
    ROUND(
        COUNT(CASE WHEN results_count = 0 THEN 1 END)::decimal / COUNT(*) * 100, 2
    ) as zero_result_rate,
    
    -- Engagement metrics
    COUNT(CASE WHEN clicked_results != '[]' THEN 1 END) as searches_with_clicks,
    ROUND(
        COUNT(CASE WHEN clicked_results != '[]' THEN 1 END)::decimal / COUNT(*) * 100, 2
    ) as click_through_rate,
    
    AVG(time_spent_seconds) as avg_time_spent
FROM search_analytics 
WHERE timestamp >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', timestamp)
ORDER BY date DESC;

CREATE UNIQUE INDEX idx_search_performance_date ON search_performance_metrics(date DESC);
```

### Triggers and Functions

#### Update Search Vector Trigger
```sql
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
                        setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B') ||
                        setweight(to_tsvector('english', array_to_string(NEW.keywords, ' ')), 'C');
    
    -- Update excerpt
    NEW.excerpt := LEFT(NEW.content, 300);
    
    -- Update search count for analytics
    IF TG_OP = 'UPDATE' THEN
        NEW.search_count := OLD.search_count;
        NEW.view_count := OLD.view_count;
        NEW.click_count := OLD.click_count;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_search_vector
    BEFORE INSERT OR UPDATE ON searchable_content
    FOR EACH ROW EXECUTE FUNCTION update_search_vector();
```

#### Auto-Index Content Trigger
```sql
CREATE OR REPLACE FUNCTION queue_content_indexing()
RETURNS TRIGGER AS $$
BEGIN
    -- Queue content for Elasticsearch indexing
    INSERT INTO search_index_queue (content_type, object_id, operation, priority)
    VALUES (
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'index'
            WHEN TG_OP = 'UPDATE' THEN 'update'
            WHEN TG_OP = 'DELETE' THEN 'delete'
        END,
        2 -- High priority for real-time updates
    );
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- Apply to searchable content tables
CREATE TRIGGER trigger_queue_feature_indexing
    AFTER INSERT OR UPDATE OR DELETE ON feature_requests
    FOR EACH ROW EXECUTE FUNCTION queue_content_indexing();

CREATE TRIGGER trigger_queue_project_indexing
    AFTER INSERT OR UPDATE OR DELETE ON projects
    FOR EACH ROW EXECUTE FUNCTION queue_content_indexing();
```

#### Update Suggestion Popularity
```sql
CREATE OR REPLACE FUNCTION update_suggestion_popularity()
RETURNS TRIGGER AS $$
BEGIN
    -- Update suggestion usage count when analytics record is created
    UPDATE search_suggestions 
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE suggestion_text = NEW.query_text
      AND suggestion_type = 'query';
    
    -- Create new suggestion if it doesn't exist and query was successful
    IF NOT FOUND AND NEW.clicked_results != '[]' THEN
        INSERT INTO search_suggestions (suggestion_text, suggestion_type, usage_count, source)
        VALUES (NEW.query_text, 'query', 1, 'user_generated')
        ON CONFLICT (suggestion_text, suggestion_type) DO UPDATE SET
            usage_count = search_suggestions.usage_count + 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_suggestion_popularity
    AFTER INSERT ON search_analytics
    FOR EACH ROW EXECUTE FUNCTION update_suggestion_popularity();
```

## Migrations

### Migration 1: Create Search Tables
```python
from django.db import migrations, models
import django.contrib.postgres.fields
import django.contrib.postgres.indexes

class Migration(migrations.Migration):
    dependencies = [
        ('search', '0001_initial'),
        ('auth', '0012_alter_user_first_name_max_length'),
    ]
    
    operations = [
        migrations.CreateModel(
            name='SearchableContent',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content_type', models.CharField(max_length=50)),
                ('object_id', models.PositiveIntegerField()),
                ('title', models.CharField(max_length=500)),
                ('content', models.TextField()),
                ('excerpt', models.TextField(blank=True)),
                ('tags', models.JSONField(default=list)),
                ('metadata', models.JSONField(default=dict)),
                ('keywords', django.contrib.postgres.fields.ArrayField(
                    base_field=models.CharField(max_length=100),
                    default=list,
                    size=None
                )),
                ('popularity_score', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('boost_factor', models.DecimalField(decimal_places=2, default=1, max_digits=3)),
                ('is_public', models.BooleanField(default=True)),
                ('view_count', models.PositiveIntegerField(default=0)),
                ('search_count', models.PositiveIntegerField(default=0)),
                ('click_count', models.PositiveIntegerField(default=0)),
                ('last_accessed', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'unique_together': {('content_type', 'object_id')},
            },
        ),
        
        migrations.CreateModel(
            name='SavedSearch',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('query_text', models.TextField(blank=True)),
                ('filters', models.JSONField(default=dict)),
                ('sort_config', models.JSONField(default=dict)),
                ('is_shared', models.BooleanField(default=False)),
                ('is_public', models.BooleanField(default=False)),
                ('usage_count', models.PositiveIntegerField(default=0)),
                ('last_used', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='saved_searches', to='auth.User')),
            ],
            options={
                'unique_together': {('user', 'name')},
            },
        ),
    ]
```

### Migration 2: Add Search Analytics
```python
class Migration(migrations.Migration):
    dependencies = [
        ('search', '0002_create_search_tables'),
    ]
    
    operations = [
        migrations.CreateModel(
            name='SearchAnalytics',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('session_id', models.CharField(max_length=100)),
                ('query_text', models.TextField(blank=True)),
                ('filters_applied', models.JSONField(default=dict)),
                ('results_count', models.PositiveIntegerField(default=0)),
                ('response_time_ms', models.PositiveIntegerField(default=0)),
                ('clicked_results', models.JSONField(default=list)),
                ('time_spent_seconds', models.PositiveIntegerField(default=0)),
                ('search_source', models.CharField(default='main_search', max_length=50)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='auth.User')),
            ],
        ),
        
        migrations.RunSQL(
            """
            CREATE INDEX idx_search_analytics_timestamp ON search_searchanalytics(timestamp DESC);
            CREATE INDEX idx_search_analytics_user_timestamp ON search_searchanalytics(user_id, timestamp DESC);
            """,
            reverse_sql="""
            DROP INDEX IF EXISTS idx_search_analytics_timestamp;
            DROP INDEX IF EXISTS idx_search_analytics_user_timestamp;
            """
        ),
    ]
```