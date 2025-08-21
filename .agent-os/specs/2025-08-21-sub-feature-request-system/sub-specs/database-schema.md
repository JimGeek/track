# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-21-sub-feature-request-system/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Schema Changes

### New Tables

#### SubFeatureRequest
```sql
CREATE TABLE sub_feature_requests (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES sub_feature_requests(id) ON DELETE CASCADE,
    feature_request_id INTEGER NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    priority VARCHAR(10) DEFAULT 'medium',
    order_position INTEGER DEFAULT 0,
    level_depth INTEGER DEFAULT 0,
    materialized_path VARCHAR(500),
    progress_percentage INTEGER DEFAULT 0,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    assigned_to_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by_id INTEGER REFERENCES users(id),
    
    CONSTRAINT valid_progress CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    CONSTRAINT valid_level CHECK (level_depth >= 0),
    CONSTRAINT no_self_parent CHECK (id != parent_id)
);
```

#### SubFeatureDependencies
```sql
CREATE TABLE sub_feature_dependencies (
    id SERIAL PRIMARY KEY,
    dependent_sub_feature_id INTEGER NOT NULL REFERENCES sub_feature_requests(id) ON DELETE CASCADE,
    prerequisite_sub_feature_id INTEGER NOT NULL REFERENCES sub_feature_requests(id) ON DELETE CASCADE,
    dependency_type VARCHAR(20) DEFAULT 'blocks',
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT no_self_dependency CHECK (dependent_sub_feature_id != prerequisite_sub_feature_id),
    CONSTRAINT unique_dependency UNIQUE (dependent_sub_feature_id, prerequisite_sub_feature_id)
);
```

### Indexes
```sql
-- Performance indexes for tree operations
CREATE INDEX idx_sub_feature_parent ON sub_feature_requests(parent_id);
CREATE INDEX idx_sub_feature_feature_request ON sub_feature_requests(feature_request_id);
CREATE INDEX idx_sub_feature_path ON sub_feature_requests(materialized_path);
CREATE INDEX idx_sub_feature_level_order ON sub_feature_requests(level_depth, order_position);
CREATE INDEX idx_sub_feature_assigned ON sub_feature_requests(assigned_to_id);

-- Dependency indexes
CREATE INDEX idx_dependency_dependent ON sub_feature_dependencies(dependent_sub_feature_id);
CREATE INDEX idx_dependency_prerequisite ON sub_feature_dependencies(prerequisite_sub_feature_id);
```

### Views
```sql
-- Hierarchical view with computed values
CREATE VIEW sub_feature_hierarchy AS
WITH RECURSIVE feature_tree AS (
    -- Base case: root sub-features
    SELECT 
        id, parent_id, feature_request_id, title, description,
        level_depth, materialized_path, progress_percentage,
        ARRAY[id] as path_array,
        0 as computed_level
    FROM sub_feature_requests 
    WHERE parent_id IS NULL
    
    UNION ALL
    
    -- Recursive case: child sub-features
    SELECT 
        sf.id, sf.parent_id, sf.feature_request_id, sf.title, sf.description,
        sf.level_depth, sf.materialized_path, sf.progress_percentage,
        ft.path_array || sf.id,
        ft.computed_level + 1
    FROM sub_feature_requests sf
    JOIN feature_tree ft ON sf.parent_id = ft.id
)
SELECT * FROM feature_tree;
```

## Migrations

### Migration 1: Create SubFeatureRequest Table
```python
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [
        ('features', '0004_feature_request_enhancements'),
    ]
    
    operations = [
        migrations.CreateModel(
            name='SubFeatureRequest',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField()),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('in_progress', 'In Progress'), ('completed', 'Completed')], default='pending', max_length=20)),
                ('priority', models.CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')], default='medium', max_length=10)),
                ('order_position', models.PositiveIntegerField(default=0)),
                ('level_depth', models.PositiveIntegerField(default=0)),
                ('materialized_path', models.CharField(max_length=500)),
                ('progress_percentage', models.PositiveIntegerField(default=0)),
                ('estimated_hours', models.DecimalField(decimal_places=2, max_digits=5, null=True, blank=True)),
                ('actual_hours', models.DecimalField(decimal_places=2, max_digits=5, null=True, blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('feature_request', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sub_features', to='features.FeatureRequest')),
                ('parent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='children', to='features.SubFeatureRequest')),
                ('assigned_to', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='auth.User')),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='created_sub_features', to='auth.User')),
            ],
            options={
                'ordering': ['order_position'],
            },
        ),
    ]
```

### Migration 2: Add Dependencies Table
```python
class Migration(migrations.Migration):
    dependencies = [
        ('features', '0005_create_sub_feature_request'),
    ]
    
    operations = [
        migrations.CreateModel(
            name='SubFeatureDependency',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('dependency_type', models.CharField(choices=[('blocks', 'Blocks'), ('depends_on', 'Depends On')], default='blocks', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('dependent_sub_feature', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='dependencies', to='features.SubFeatureRequest')),
                ('prerequisite_sub_feature', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='dependents', to='features.SubFeatureRequest')),
            ],
            options={
                'unique_together': {('dependent_sub_feature', 'prerequisite_sub_feature')},
            },
        ),
    ]
```