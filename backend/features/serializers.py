from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Feature, FeatureComment, FeatureAttachment
from projects.models import Project

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']
        read_only_fields = ['id', 'email', 'first_name', 'last_name']


class FeatureAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by = UserBasicSerializer(read_only=True)
    file_size_display = serializers.ReadOnlyField()

    class Meta:
        model = FeatureAttachment
        fields = [
            'id', 'file', 'filename', 'file_size', 'file_size_display',
            'content_type', 'uploaded_by', 'uploaded_at'
        ]
        read_only_fields = ['id', 'uploaded_at', 'file_size', 'content_type', 'filename']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user:
            validated_data['uploaded_by'] = request.user
        
        # Set filename and file info
        file_obj = validated_data.get('file')
        if file_obj:
            validated_data['filename'] = file_obj.name
            validated_data['file_size'] = file_obj.size
            validated_data['content_type'] = file_obj.content_type or 'application/octet-stream'
        
        return super().create(validated_data)


class FeatureCommentSerializer(serializers.ModelSerializer):
    author = UserBasicSerializer(read_only=True)

    class Meta:
        model = FeatureComment
        fields = ['id', 'content', 'author', 'created_at', 'updated_at']
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user:
            validated_data['author'] = request.user
        return super().create(validated_data)


class FeatureListSerializer(serializers.ModelSerializer):
    assignee = UserBasicSerializer(read_only=True)
    reporter = UserBasicSerializer(read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    parent_title = serializers.CharField(source='parent.title', read_only=True)
    
    is_overdue = serializers.ReadOnlyField()
    is_completed = serializers.ReadOnlyField()
    hierarchy_level = serializers.ReadOnlyField()
    progress_percentage = serializers.ReadOnlyField()
    can_edit = serializers.SerializerMethodField()
    
    sub_features_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    attachments_count = serializers.SerializerMethodField()

    class Meta:
        model = Feature
        fields = [
            'id', 'title', 'description', 'status', 'priority',
            'assignee', 'reporter', 'project_name', 'parent_title',
            'estimated_hours', 'actual_hours', 'due_date', 'completed_date',
            'created_at', 'updated_at', 'order',
            'is_overdue', 'is_completed', 'hierarchy_level', 'progress_percentage',
            'can_edit', 'sub_features_count', 'comments_count', 'attachments_count'
        ]

    def get_can_edit(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.can_user_edit(request.user)

    def get_sub_features_count(self, obj):
        return obj.sub_features.count()

    def get_comments_count(self, obj):
        return obj.comments.count()

    def get_attachments_count(self, obj):
        return obj.attachments.count()


class FeatureSerializer(serializers.ModelSerializer):
    assignee = UserBasicSerializer(read_only=True)
    reporter = UserBasicSerializer(read_only=True)
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all())
    parent = serializers.PrimaryKeyRelatedField(queryset=Feature.objects.all(), allow_null=True, required=False)
    
    assignee_email = serializers.EmailField(write_only=True, required=False, allow_null=True)
    
    is_overdue = serializers.ReadOnlyField()
    is_completed = serializers.ReadOnlyField()
    hierarchy_level = serializers.ReadOnlyField()
    full_path = serializers.ReadOnlyField()
    progress_percentage = serializers.ReadOnlyField()
    can_edit = serializers.SerializerMethodField()
    
    total_estimated_hours = serializers.SerializerMethodField()
    total_actual_hours = serializers.SerializerMethodField()
    next_status = serializers.SerializerMethodField()
    previous_status = serializers.SerializerMethodField()
    
    comments = FeatureCommentSerializer(many=True, read_only=True)
    attachments = FeatureAttachmentSerializer(many=True, read_only=True)
    sub_features = serializers.SerializerMethodField()

    class Meta:
        model = Feature
        fields = [
            'id', 'project', 'parent', 'title', 'description',
            'status', 'priority', 'assignee', 'reporter',
            'assignee_email', 'estimated_hours', 'actual_hours',
            'due_date', 'completed_date', 'created_at', 'updated_at', 'order',
            'is_overdue', 'is_completed', 'hierarchy_level', 'full_path',
            'progress_percentage', 'can_edit', 'total_estimated_hours',
            'total_actual_hours', 'next_status', 'previous_status',
            'comments', 'attachments', 'sub_features'
        ]
        read_only_fields = ['id', 'reporter', 'created_at', 'updated_at', 'completed_date']

    def get_can_edit(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.can_user_edit(request.user)

    def get_total_estimated_hours(self, obj):
        return obj.get_total_estimated_hours()

    def get_total_actual_hours(self, obj):
        return obj.get_total_actual_hours()

    def get_next_status(self, obj):
        return obj.get_next_status()

    def get_previous_status(self, obj):
        return obj.get_previous_status()

    def get_sub_features(self, obj):
        sub_features = obj.sub_features.all()
        return FeatureListSerializer(sub_features, many=True, context=self.context).data

    def validate(self, data):
        # Validate that parent belongs to the same project
        if data.get('parent') and data.get('project'):
            if data['parent'].project != data['project']:
                raise serializers.ValidationError(
                    "Parent feature must belong to the same project."
                )
        
        # Validate due date
        due_date = data.get('due_date')
        if due_date:
            from django.utils import timezone
            if due_date < timezone.now().date():
                raise serializers.ValidationError(
                    {"due_date": "Due date cannot be in the past."}
                )
        
        return data

    def validate_title(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Title must be at least 3 characters long.")
        return value.strip()

    def validate_description(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Description must be at least 10 characters long.")
        return value.strip()

    def create(self, validated_data):
        assignee_email = validated_data.pop('assignee_email', None)
        request = self.context.get('request')
        
        if request and request.user:
            validated_data['reporter'] = request.user
        
        # Handle assignee by email
        if assignee_email:
            try:
                assignee = User.objects.get(email=assignee_email)
                validated_data['assignee'] = assignee
            except User.DoesNotExist:
                raise serializers.ValidationError(
                    {"assignee_email": f"User with email '{assignee_email}' not found."}
                )
        
        return super().create(validated_data)

    def update(self, instance, validated_data):
        assignee_email = validated_data.pop('assignee_email', None)
        
        # Handle assignee by email
        if assignee_email is not None:
            if assignee_email == '':
                validated_data['assignee'] = None
            else:
                try:
                    assignee = User.objects.get(email=assignee_email)
                    validated_data['assignee'] = assignee
                except User.DoesNotExist:
                    raise serializers.ValidationError(
                        {"assignee_email": f"User with email '{assignee_email}' not found."}
                    )
        
        return super().update(instance, validated_data)


class CreateFeatureSerializer(serializers.ModelSerializer):
    assignee_email = serializers.EmailField(required=False, allow_null=True)

    class Meta:
        model = Feature
        fields = [
            'project', 'parent', 'title', 'description',
            'priority', 'assignee_email', 'estimated_hours',
            'due_date', 'order'
        ]

    def validate_title(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Title must be at least 3 characters long.")
        return value.strip()

    def validate_description(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Description must be at least 10 characters long.")
        return value.strip()

    def create(self, validated_data):
        assignee_email = validated_data.pop('assignee_email', None)
        request = self.context.get('request')
        
        if request and request.user:
            validated_data['reporter'] = request.user
        
        # Handle assignee by email
        if assignee_email:
            try:
                assignee = User.objects.get(email=assignee_email)
                validated_data['assignee'] = assignee
            except User.DoesNotExist:
                raise serializers.ValidationError(
                    {"assignee_email": f"User with email '{assignee_email}' not found."}
                )
        
        feature = Feature.objects.create(**validated_data)
        return feature

    def to_representation(self, instance):
        # Use the full FeatureSerializer for the response
        serializer = FeatureSerializer(instance, context=self.context)
        return serializer.data