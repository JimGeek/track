from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Project

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']
        read_only_fields = ['id', 'email', 'first_name', 'last_name']


class ProjectSerializer(serializers.ModelSerializer):
    owner = UserBasicSerializer(read_only=True)
    team_members = UserBasicSerializer(many=True, read_only=True)
    team_member_emails = serializers.ListField(
        child=serializers.EmailField(),
        write_only=True,
        required=False,
        help_text="List of team member email addresses"
    )
    total_features = serializers.ReadOnlyField()
    completed_features = serializers.ReadOnlyField()
    progress_percentage = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'owner', 'team_members', 'team_member_emails',
            'priority', 'deadline', 'created_at', 'updated_at', 'is_archived',
            'total_features', 'completed_features', 'progress_percentage',
            'is_overdue', 'can_edit'
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def get_can_edit(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.can_user_edit(request.user)

    def validate_name(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Project name must be at least 3 characters long.")
        return value.strip()

    def validate_deadline(self, value):
        if value:
            from django.utils import timezone
            if value < timezone.now().date():
                raise serializers.ValidationError("Deadline cannot be in the past.")
        return value

    def create(self, validated_data):
        team_member_emails = validated_data.pop('team_member_emails', [])
        request = self.context.get('request')
        
        if request and request.user:
            validated_data['owner'] = request.user
        
        project = Project.objects.create(**validated_data)
        
        # Add team members by email
        if team_member_emails:
            team_members = User.objects.filter(email__in=team_member_emails)
            project.team_members.set(team_members)
        
        return project

    def update(self, instance, validated_data):
        team_member_emails = validated_data.pop('team_member_emails', None)
        
        # Update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update team members if provided
        if team_member_emails is not None:
            team_members = User.objects.filter(email__in=team_member_emails)
            instance.team_members.set(team_members)
        
        return instance


class ProjectListSerializer(serializers.ModelSerializer):
    owner = UserBasicSerializer(read_only=True)
    team_members_count = serializers.SerializerMethodField()
    total_features = serializers.ReadOnlyField()
    completed_features = serializers.ReadOnlyField()
    progress_percentage = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'owner', 'team_members_count',
            'priority', 'deadline', 'created_at', 'updated_at', 'is_archived',
            'total_features', 'completed_features', 'progress_percentage',
            'is_overdue', 'can_edit'
        ]

    def get_team_members_count(self, obj):
        return obj.team_members.count()

    def get_can_edit(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.can_user_edit(request.user)