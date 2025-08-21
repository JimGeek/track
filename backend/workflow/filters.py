import django_filters
from .models import WorkflowTemplate, WorkflowHistory


class WorkflowTemplateFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(lookup_expr='icontains')
    entity_type = django_filters.ChoiceFilter(
        choices=[
            ('feature', 'Feature'),
            ('project', 'Project'),
        ]
    )
    is_active = django_filters.BooleanFilter()
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    created_by = django_filters.UUIDFilter()

    class Meta:
        model = WorkflowTemplate
        fields = ['name', 'entity_type', 'is_active', 'created_by', 'created_after', 'created_before']


class WorkflowHistoryFilter(django_filters.FilterSet):
    entity_type = django_filters.CharFilter()
    entity_id = django_filters.UUIDFilter()
    template = django_filters.UUIDFilter()
    from_state = django_filters.UUIDFilter()
    to_state = django_filters.UUIDFilter()
    changed_by = django_filters.UUIDFilter()
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    has_comment = django_filters.BooleanFilter(field_name='comment', lookup_expr='isnull', exclude=True)

    class Meta:
        model = WorkflowHistory
        fields = [
            'entity_type', 'entity_id', 'template', 'from_state', 'to_state', 
            'changed_by', 'created_after', 'created_before', 'has_comment'
        ]