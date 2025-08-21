import django_filters
from .models import Feature


class FeatureFilter(django_filters.FilterSet):
    project = django_filters.UUIDFilter(field_name='project__id')
    parent = django_filters.UUIDFilter(field_name='parent__id')
    status = django_filters.ChoiceFilter(choices=Feature.STATUS_CHOICES)
    priority = django_filters.ChoiceFilter(choices=Feature.PRIORITY_CHOICES)
    assignee = django_filters.UUIDFilter(field_name='assignee__id')
    reporter = django_filters.UUIDFilter(field_name='reporter__id')
    
    # Date filters
    due_date_before = django_filters.DateFilter(field_name='due_date', lookup_expr='lte')
    due_date_after = django_filters.DateFilter(field_name='due_date', lookup_expr='gte')
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    
    # Boolean filters
    is_overdue = django_filters.BooleanFilter(method='filter_overdue')
    has_sub_features = django_filters.BooleanFilter(method='filter_has_sub_features')
    is_root_feature = django_filters.BooleanFilter(method='filter_is_root_feature')
    
    # Range filters
    estimated_hours_min = django_filters.NumberFilter(field_name='estimated_hours', lookup_expr='gte')
    estimated_hours_max = django_filters.NumberFilter(field_name='estimated_hours', lookup_expr='lte')

    class Meta:
        model = Feature
        fields = [
            'project', 'parent', 'status', 'priority', 'assignee', 'reporter'
        ]

    def filter_overdue(self, queryset, name, value):
        if value is True:
            from django.utils import timezone
            return queryset.filter(
                due_date__lt=timezone.now().date()
            ).exclude(status='live')
        elif value is False:
            from django.utils import timezone
            return queryset.exclude(
                due_date__lt=timezone.now().date()
            ).exclude(status='live')
        return queryset

    def filter_has_sub_features(self, queryset, name, value):
        if value is True:
            return queryset.filter(sub_features__isnull=False).distinct()
        elif value is False:
            return queryset.filter(sub_features__isnull=True)
        return queryset

    def filter_is_root_feature(self, queryset, name, value):
        if value is True:
            return queryset.filter(parent__isnull=True)
        elif value is False:
            return queryset.filter(parent__isnull=False)
        return queryset