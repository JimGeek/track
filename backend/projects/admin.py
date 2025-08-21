from django.contrib import admin
from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'owner', 'priority', 'deadline', 'progress_percentage',
        'is_archived', 'created_at'
    ]
    list_filter = ['priority', 'is_archived', 'created_at', 'deadline']
    search_fields = ['name', 'description', 'owner__email']
    readonly_fields = ['id', 'created_at', 'updated_at', 'progress_percentage']
    filter_horizontal = ['team_members']
    
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'owner')
        }),
        ('Project Details', {
            'fields': ('priority', 'deadline', 'is_archived')
        }),
        ('Team', {
            'fields': ('team_members',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('owner').prefetch_related('team_members')