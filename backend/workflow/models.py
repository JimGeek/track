import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.exceptions import ValidationError

User = get_user_model()


class WorkflowTemplate(models.Model):
    """Defines a workflow template that can be applied to different entities"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    entity_type = models.CharField(max_length=50, choices=[
        ('feature', 'Feature'),
        ('project', 'Project'),
    ])
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_workflows')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'workflow_templates'
        unique_together = ['name', 'entity_type']

    def __str__(self):
        return f"{self.name} ({self.entity_type})"


class WorkflowState(models.Model):
    """Defines possible states within a workflow"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(WorkflowTemplate, on_delete=models.CASCADE, related_name='states')
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#6B7280')  # Hex color
    icon = models.CharField(max_length=50, blank=True)
    is_initial = models.BooleanField(default=False)
    is_final = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    
    # Workflow rules
    auto_assign_to_creator = models.BooleanField(default=False)
    require_assignee = models.BooleanField(default=False)
    require_comment = models.BooleanField(default=False)
    notify_stakeholders = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'workflow_states'
        unique_together = [['template', 'name'], ['template', 'slug']]
        ordering = ['order', 'name']

    def __str__(self):
        return f"{self.template.name}: {self.name}"

    def clean(self):
        # Ensure only one initial state per template
        if self.is_initial:
            existing_initial = WorkflowState.objects.filter(
                template=self.template, 
                is_initial=True
            ).exclude(pk=self.pk)
            if existing_initial.exists():
                raise ValidationError('Only one initial state allowed per workflow template.')


class WorkflowTransition(models.Model):
    """Defines valid transitions between workflow states"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(WorkflowTemplate, on_delete=models.CASCADE, related_name='transitions')
    from_state = models.ForeignKey(WorkflowState, on_delete=models.CASCADE, related_name='outgoing_transitions')
    to_state = models.ForeignKey(WorkflowState, on_delete=models.CASCADE, related_name='incoming_transitions')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # Transition rules
    require_permission = models.CharField(max_length=100, blank=True)
    require_role = models.CharField(max_length=50, blank=True, choices=[
        ('owner', 'Owner'),
        ('assignee', 'Assignee'),
        ('admin', 'Admin'),
        ('any', 'Any User'),
    ], default='any')
    require_all_subtasks_complete = models.BooleanField(default=False)
    require_comment = models.BooleanField(default=False)
    
    # Auto-actions on transition
    auto_assign_to_user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='auto_assigned_transitions'
    )
    auto_set_due_date_days = models.IntegerField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'workflow_transitions'
        unique_together = ['template', 'from_state', 'to_state']

    def __str__(self):
        return f"{self.from_state.name} → {self.to_state.name}"

    def clean(self):
        if self.from_state.template != self.template or self.to_state.template != self.template:
            raise ValidationError('States must belong to the same workflow template.')


class WorkflowHistory(models.Model):
    """Tracks workflow state changes for auditing"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(WorkflowTemplate, on_delete=models.CASCADE, related_name='history')
    entity_type = models.CharField(max_length=50)
    entity_id = models.UUIDField()
    
    from_state = models.ForeignKey(
        WorkflowState, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='history_from'
    )
    to_state = models.ForeignKey(WorkflowState, on_delete=models.CASCADE, related_name='history_to')
    transition = models.ForeignKey(
        WorkflowTransition, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='history'
    )
    
    changed_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workflow_changes')
    comment = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'workflow_history'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.entity_type}:{self.entity_id} - {self.to_state.name}"


class WorkflowRule(models.Model):
    """Custom business rules for workflow automation"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(WorkflowTemplate, on_delete=models.CASCADE, related_name='rules')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Trigger conditions
    trigger_on_state = models.ForeignKey(
        WorkflowState, 
        on_delete=models.CASCADE, 
        related_name='trigger_rules'
    )
    trigger_condition = models.JSONField(default=dict, blank=True)  # Custom conditions
    
    # Actions to perform
    action_type = models.CharField(max_length=50, choices=[
        ('auto_transition', 'Auto Transition'),
        ('send_notification', 'Send Notification'),
        ('assign_user', 'Assign User'),
        ('set_due_date', 'Set Due Date'),
        ('add_comment', 'Add Comment'),
        ('webhook', 'Webhook'),
    ])
    action_config = models.JSONField(default=dict, blank=True)
    
    is_active = models.BooleanField(default=True)
    priority = models.IntegerField(default=0)
    
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_workflow_rules')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'workflow_rules'
        ordering = ['priority', 'name']

    def __str__(self):
        return f"{self.template.name}: {self.name}"


class WorkflowMetrics(models.Model):
    """Stores workflow performance metrics"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(WorkflowTemplate, on_delete=models.CASCADE, related_name='metrics')
    state = models.ForeignKey(WorkflowState, on_delete=models.CASCADE, related_name='metrics')
    
    # Metrics
    avg_time_in_state_hours = models.FloatField(default=0)
    total_entries = models.IntegerField(default=0)
    total_exits = models.IntegerField(default=0)
    completion_rate = models.FloatField(default=0)  # Percentage
    
    # Time period for metrics
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'workflow_metrics'
        unique_together = ['template', 'state', 'period_start', 'period_end']

    def __str__(self):
        return f"{self.template.name} - {self.state.name} metrics"