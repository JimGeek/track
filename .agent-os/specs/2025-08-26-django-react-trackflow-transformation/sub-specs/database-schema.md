# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-26-django-react-trackflow-transformation/spec.md

> Created: 2025-08-26
> Version: 1.0.0

## New Models

### TodoList Model
```python
class TodoList(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='todo_lists')
    color = models.CharField(max_length=7, default='#3B82F6')  # Hex color for UI
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'todo_lists'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
        ]
```

### Task Model  
```python
class TaskPriority(models.TextChoices):
    LOW = 'low', 'Low'
    MEDIUM = 'medium', 'Medium'
    HIGH = 'high', 'High'
    URGENT = 'urgent', 'Urgent'

class TaskStatus(models.TextChoices):
    TODO = 'todo', 'Todo'
    ONGOING = 'ongoing', 'Ongoing'
    DONE = 'done', 'Done'

class Task(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True, null=True)
    priority = models.CharField(max_length=10, choices=TaskPriority.choices, default=TaskPriority.MEDIUM)
    status = models.CharField(max_length=10, choices=TaskStatus.choices, default=TaskStatus.TODO)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    todo_list = models.ForeignKey(TodoList, on_delete=models.CASCADE, related_name='tasks')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tasks'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['todo_list', 'status']),
            models.Index(fields=['user', 'end_date']),
            models.Index(fields=['priority', 'status']),
            models.Index(fields=['end_date', 'status']),
        ]
```

## Migration Strategy

### Phase 1: Create New Models
```python
# Migration 0001_initial_todo_models.py
from django.db import migrations, models
import django.db.models.deletion
import uuid

class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0001_initial'),
    ]
    
    operations = [
        migrations.CreateModel(
            name='TodoList',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True, null=True)),
                ('color', models.CharField(default='#3B82F6', max_length=7)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='todo_lists', to='accounts.user')),
            ],
            options={
                'db_table': 'todo_lists',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Task',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ('title', models.CharField(max_length=300)),
                ('description', models.TextField(blank=True, null=True)),
                ('priority', models.CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('urgent', 'Urgent')], default='medium', max_length=10)),
                ('status', models.CharField(choices=[('todo', 'Todo'), ('ongoing', 'Ongoing'), ('done', 'Done')], default='todo', max_length=10)),
                ('start_date', models.DateField(blank=True, null=True)),
                ('end_date', models.DateField(blank=True, null=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('todo_list', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tasks', to='todos.todolist')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tasks', to='accounts.user')),
            ],
            options={
                'db_table': 'tasks',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='todolist',
            index=models.Index(fields=['user', '-created_at'], name='todo_lists_user_id_created_at_idx'),
        ),
        migrations.AddIndex(
            model_name='task',
            index=models.Index(fields=['todo_list', 'status'], name='tasks_todo_list_status_idx'),
        ),
        migrations.AddIndex(
            model_name='task',
            index=models.Index(fields=['user', 'end_date'], name='tasks_user_end_date_idx'),
        ),
        migrations.AddIndex(
            model_name='task',
            index=models.Index(fields=['priority', 'status'], name='tasks_priority_status_idx'),
        ),
        migrations.AddIndex(
            model_name='task',
            index=models.Index(fields=['end_date', 'status'], name='tasks_end_date_status_idx'),
        ),
    ]
```

### Phase 2: Data Migration Script
```python
# Migration 0002_migrate_projects_to_todos.py
def migrate_projects_to_todos(apps, schema_editor):
    Project = apps.get_model('projects', 'Project')
    Feature = apps.get_model('features', 'Feature')
    TodoList = apps.get_model('todos', 'TodoList')
    Task = apps.get_model('todos', 'Task')
    
    # Convert Projects to TodoLists
    for project in Project.objects.all():
        todo_list = TodoList.objects.create(
            name=project.name,
            description=project.description,
            user=project.owner,
            created_at=project.created_at,
            updated_at=project.updated_at,
        )
        
        # Convert Features to Tasks
        for feature in project.features.all():
            status_mapping = {
                'idea': 'todo',
                'specification': 'todo',
                'development': 'ongoing',
                'testing': 'ongoing',
                'live': 'done'
            }
            
            Task.objects.create(
                title=feature.title,
                description=feature.description,
                priority='medium',  # Default priority
                status=status_mapping.get(feature.current_state, 'todo'),
                start_date=feature.created_at.date(),
                end_date=feature.deadline,
                todo_list=todo_list,
                user=project.owner,
                completed_at=feature.completed_at if feature.current_state == 'live' else None,
                created_at=feature.created_at,
                updated_at=feature.updated_at,
            )
```

## Performance Considerations

### Database Indexes
- **User-based queries**: Index on (user, created_at) for user's todo lists
- **Status filtering**: Index on (todo_list, status) for Kanban view performance
- **Due date queries**: Index on (end_date, status) for dashboard due date filtering
- **Priority sorting**: Index on (priority, status) for task prioritization

### Query Optimization
- Use `select_related('user', 'todo_list')` for task queries to reduce database hits
- Implement `prefetch_related('tasks')` for todo list queries with task counts
- Add database-level constraints for data integrity (non-null user, valid date ranges)

### Data Integrity Rules
- Tasks must belong to a todo list owned by the same user
- End date must be greater than or equal to start date when both are provided
- Completed tasks should have completed_at timestamp when status is 'done'
- Cascading deletes ensure orphaned tasks are removed when todo lists are deleted