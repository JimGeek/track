from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    WorkflowTemplate, WorkflowState, WorkflowTransition, 
    WorkflowHistory, WorkflowRule, WorkflowMetrics
)

User = get_user_model()


class WorkflowStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowState
        fields = [
            'id', 'name', 'slug', 'description', 'color', 'icon',
            'is_initial', 'is_final', 'order', 'auto_assign_to_creator',
            'require_assignee', 'require_comment', 'notify_stakeholders',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class WorkflowTransitionSerializer(serializers.ModelSerializer):
    from_state_name = serializers.CharField(source='from_state.name', read_only=True)
    to_state_name = serializers.CharField(source='to_state.name', read_only=True)
    auto_assign_to_user_email = serializers.EmailField(source='auto_assign_to_user.email', read_only=True)

    class Meta:
        model = WorkflowTransition
        fields = [
            'id', 'from_state', 'to_state', 'from_state_name', 'to_state_name',
            'name', 'description', 'require_permission', 'require_role',
            'require_all_subtasks_complete', 'require_comment',
            'auto_assign_to_user', 'auto_assign_to_user_email', 'auto_set_due_date_days',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'from_state_name', 'to_state_name', 'auto_assign_to_user_email', 'created_at', 'updated_at']


class WorkflowTemplateSerializer(serializers.ModelSerializer):
    states = WorkflowStateSerializer(many=True, read_only=True)
    transitions = WorkflowTransitionSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = WorkflowTemplate
        fields = [
            'id', 'name', 'description', 'entity_type', 'is_active',
            'created_by', 'created_by_name', 'states', 'transitions',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_by_name', 'states', 'transitions', 'created_at', 'updated_at']


class WorkflowTemplateListSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    states_count = serializers.SerializerMethodField()
    transitions_count = serializers.SerializerMethodField()

    class Meta:
        model = WorkflowTemplate
        fields = [
            'id', 'name', 'description', 'entity_type', 'is_active',
            'created_by_name', 'states_count', 'transitions_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by_name', 'states_count', 'transitions_count', 'created_at', 'updated_at']

    def get_states_count(self, obj):
        return obj.states.count()

    def get_transitions_count(self, obj):
        return obj.transitions.count()


class WorkflowHistorySerializer(serializers.ModelSerializer):
    from_state_name = serializers.CharField(source='from_state.name', read_only=True)
    to_state_name = serializers.CharField(source='to_state.name', read_only=True)
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)
    transition_name = serializers.CharField(source='transition.name', read_only=True)

    class Meta:
        model = WorkflowHistory
        fields = [
            'id', 'template', 'entity_type', 'entity_id',
            'from_state', 'to_state', 'from_state_name', 'to_state_name',
            'transition', 'transition_name', 'changed_by', 'changed_by_name',
            'comment', 'metadata', 'created_at'
        ]
        read_only_fields = ['id', 'from_state_name', 'to_state_name', 'changed_by_name', 'transition_name', 'created_at']


class WorkflowRuleSerializer(serializers.ModelSerializer):
    trigger_on_state_name = serializers.CharField(source='trigger_on_state.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = WorkflowRule
        fields = [
            'id', 'name', 'description', 'trigger_on_state', 'trigger_on_state_name',
            'trigger_condition', 'action_type', 'action_config',
            'is_active', 'priority', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'trigger_on_state_name', 'created_by', 'created_by_name', 'created_at', 'updated_at']


class WorkflowMetricsSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source='template.name', read_only=True)
    state_name = serializers.CharField(source='state.name', read_only=True)

    class Meta:
        model = WorkflowMetrics
        fields = [
            'id', 'template', 'template_name', 'state', 'state_name',
            'avg_time_in_state_hours', 'total_entries', 'total_exits',
            'completion_rate', 'period_start', 'period_end',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'template_name', 'state_name', 'created_at', 'updated_at']


class WorkflowTransitionRequestSerializer(serializers.Serializer):
    """Serializer for requesting workflow transitions"""
    transition_id = serializers.UUIDField()
    comment = serializers.CharField(required=False, allow_blank=True)
    metadata = serializers.JSONField(required=False, default=dict)

    def validate_transition_id(self, value):
        try:
            transition = WorkflowTransition.objects.get(id=value)
            return transition
        except WorkflowTransition.DoesNotExist:
            raise serializers.ValidationError("Invalid transition ID.")


class CreateWorkflowTemplateSerializer(serializers.ModelSerializer):
    """Serializer for creating workflow templates with initial states"""
    initial_states = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        help_text="List of initial states to create with the template"
    )

    class Meta:
        model = WorkflowTemplate
        fields = ['name', 'description', 'entity_type', 'initial_states']

    def create(self, validated_data):
        initial_states = validated_data.pop('initial_states', [])
        template = super().create(validated_data)
        
        # Create initial states if provided
        for i, state_data in enumerate(initial_states):
            WorkflowState.objects.create(
                template=template,
                name=state_data.get('name'),
                slug=state_data.get('slug', state_data.get('name').lower().replace(' ', '-')),
                description=state_data.get('description', ''),
                color=state_data.get('color', '#6B7280'),
                icon=state_data.get('icon', ''),
                is_initial=state_data.get('is_initial', i == 0),
                is_final=state_data.get('is_final', False),
                order=state_data.get('order', i * 10),
                auto_assign_to_creator=state_data.get('auto_assign_to_creator', False),
                require_assignee=state_data.get('require_assignee', False),
                require_comment=state_data.get('require_comment', False),
                notify_stakeholders=state_data.get('notify_stakeholders', True)
            )
        
        return template