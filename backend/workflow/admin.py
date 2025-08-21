from django.contrib import admin
from .models import (
    WorkflowTemplate, WorkflowState, WorkflowTransition, 
    WorkflowHistory, WorkflowRule, WorkflowMetrics
)


class WorkflowStateInline(admin.TabularInline):
    model = WorkflowState
    extra = 0
    fields = ['name', 'slug', 'color', 'is_initial', 'is_final', 'order']


class WorkflowTransitionInline(admin.TabularInline):
    model = WorkflowTransition
    extra = 0
    fields = ['name', 'from_state', 'to_state', 'require_role']


class WorkflowRuleInline(admin.TabularInline):
    model = WorkflowRule
    extra = 0
    fields = ['name', 'trigger_on_state', 'action_type', 'is_active', 'priority']


@admin.register(WorkflowTemplate)
class WorkflowTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'entity_type', 'is_active', 'created_by', 'created_at']
    list_filter = ['entity_type', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at']
    inlines = [WorkflowStateInline, WorkflowTransitionInline, WorkflowRuleInline]
    
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'entity_type', 'is_active')
        }),
        ('Metadata', {
            'fields': ('id', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        if not change:  # Creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(WorkflowState)
class WorkflowStateAdmin(admin.ModelAdmin):
    list_display = ['name', 'template', 'slug', 'color', 'is_initial', 'is_final', 'order']
    list_filter = ['template', 'is_initial', 'is_final']
    search_fields = ['name', 'description', 'template__name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        (None, {
            'fields': ('template', 'name', 'slug', 'description', 'color', 'icon')
        }),
        ('State Properties', {
            'fields': ('is_initial', 'is_final', 'order')
        }),
        ('Workflow Rules', {
            'fields': ('auto_assign_to_creator', 'require_assignee', 'require_comment', 'notify_stakeholders')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(WorkflowTransition)
class WorkflowTransitionAdmin(admin.ModelAdmin):
    list_display = ['name', 'template', 'from_state', 'to_state', 'require_role']
    list_filter = ['template', 'require_role']
    search_fields = ['name', 'description', 'template__name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        (None, {
            'fields': ('template', 'name', 'description', 'from_state', 'to_state')
        }),
        ('Transition Rules', {
            'fields': ('require_permission', 'require_role', 'require_all_subtasks_complete', 'require_comment')
        }),
        ('Auto Actions', {
            'fields': ('auto_assign_to_user', 'auto_set_due_date_days')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(WorkflowHistory)
class WorkflowHistoryAdmin(admin.ModelAdmin):
    list_display = ['entity_type', 'entity_id', 'from_state', 'to_state', 'changed_by', 'created_at']
    list_filter = ['template', 'entity_type', 'created_at', 'changed_by']
    search_fields = ['entity_id', 'comment']
    readonly_fields = ['id', 'created_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        (None, {
            'fields': ('template', 'entity_type', 'entity_id')
        }),
        ('Transition', {
            'fields': ('from_state', 'to_state', 'transition', 'changed_by', 'comment')
        }),
        ('Metadata', {
            'fields': ('id', 'metadata', 'created_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(WorkflowRule)
class WorkflowRuleAdmin(admin.ModelAdmin):
    list_display = ['name', 'template', 'trigger_on_state', 'action_type', 'is_active', 'priority']
    list_filter = ['template', 'action_type', 'is_active']
    search_fields = ['name', 'description', 'template__name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        (None, {
            'fields': ('template', 'name', 'description', 'is_active', 'priority')
        }),
        ('Trigger', {
            'fields': ('trigger_on_state', 'trigger_condition')
        }),
        ('Action', {
            'fields': ('action_type', 'action_config')
        }),
        ('Metadata', {
            'fields': ('id', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        if not change:  # Creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(WorkflowMetrics)
class WorkflowMetricsAdmin(admin.ModelAdmin):
    list_display = ['template', 'state', 'avg_time_in_state_hours', 'total_entries', 'completion_rate', 'period_start']
    list_filter = ['template', 'period_start', 'period_end']
    readonly_fields = ['id', 'created_at', 'updated_at']
    date_hierarchy = 'period_start'
    
    fieldsets = (
        (None, {
            'fields': ('template', 'state', 'period_start', 'period_end')
        }),
        ('Metrics', {
            'fields': ('avg_time_in_state_hours', 'total_entries', 'total_exits', 'completion_rate')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )