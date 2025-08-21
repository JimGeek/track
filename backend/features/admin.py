from django.contrib import admin
from .models import Feature, FeatureComment, FeatureAttachment


class FeatureCommentInline(admin.TabularInline):
    model = FeatureComment
    extra = 0
    readonly_fields = ['created_at', 'updated_at']


class FeatureAttachmentInline(admin.TabularInline):
    model = FeatureAttachment
    extra = 0
    readonly_fields = ['uploaded_at', 'file_size', 'content_type']


@admin.register(Feature)
class FeatureAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'project', 'parent', 'status', 'priority',
        'assignee', 'reporter', 'due_date', 'progress_percentage', 'created_at'
    ]
    list_filter = [
        'status', 'priority', 'project', 'assignee',
        'due_date', 'created_at'
    ]
    search_fields = [
        'title', 'description', 'project__name',
        'assignee__email', 'reporter__email'
    ]
    readonly_fields = [
        'id', 'created_at', 'updated_at', 'completed_date',
        'progress_percentage', 'hierarchy_level', 'full_path',
        'is_overdue', 'is_completed'
    ]
    
    fieldsets = (
        (None, {
            'fields': ('project', 'parent', 'title', 'description')
        }),
        ('Assignment & Status', {
            'fields': ('status', 'priority', 'assignee', 'reporter')
        }),
        ('Time Tracking', {
            'fields': ('estimated_hours', 'actual_hours', 'due_date', 'completed_date')
        }),
        ('Hierarchy & Progress', {
            'fields': ('order', 'hierarchy_level', 'full_path', 'progress_percentage'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at', 'is_overdue', 'is_completed'),
            'classes': ('collapse',)
        })
    )
    
    inlines = [FeatureCommentInline, FeatureAttachmentInline]
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'project', 'parent', 'assignee', 'reporter'
        ).prefetch_related('comments', 'attachments')


@admin.register(FeatureComment)
class FeatureCommentAdmin(admin.ModelAdmin):
    list_display = ['feature', 'author', 'content_preview', 'created_at']
    list_filter = ['created_at', 'feature__project']
    search_fields = ['content', 'feature__title', 'author__email']
    readonly_fields = ['created_at', 'updated_at']
    
    def content_preview(self, obj):
        return obj.content[:100] + '...' if len(obj.content) > 100 else obj.content
    content_preview.short_description = 'Content Preview'


@admin.register(FeatureAttachment)
class FeatureAttachmentAdmin(admin.ModelAdmin):
    list_display = [
        'filename', 'feature', 'uploaded_by', 'file_size_display', 'uploaded_at'
    ]
    list_filter = ['content_type', 'uploaded_at', 'feature__project']
    search_fields = ['filename', 'feature__title', 'uploaded_by__email']
    readonly_fields = ['uploaded_at', 'file_size', 'content_type', 'file_size_display']