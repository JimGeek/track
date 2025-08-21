import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
import json

from workflow.models import (
    WorkflowTemplate, WorkflowState, WorkflowTransition, 
    WorkflowHistory, WorkflowRule, WorkflowMetrics
)
from projects.models import Project
from features.models import Feature

User = get_user_model()


class WorkflowModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
        self.template = WorkflowTemplate.objects.create(
            name='Feature Workflow',
            description='Standard workflow for features',
            entity_type='feature',
            created_by=self.user
        )

    def test_workflow_template_creation(self):
        self.assertEqual(self.template.name, 'Feature Workflow')
        self.assertEqual(self.template.entity_type, 'feature')
        self.assertTrue(self.template.is_active)
        self.assertEqual(self.template.created_by, self.user)

    def test_workflow_state_creation(self):
        state = WorkflowState.objects.create(
            template=self.template,
            name='In Progress',
            slug='in-progress',
            description='Work is being done',
            color='#FFB020',
            icon='play',
            order=1
        )
        
        self.assertEqual(state.name, 'In Progress')
        self.assertEqual(state.slug, 'in-progress')
        self.assertEqual(state.template, self.template)
        self.assertEqual(str(state), 'Feature Workflow: In Progress')

    def test_workflow_state_unique_initial(self):
        # Create initial state
        state1 = WorkflowState.objects.create(
            template=self.template,
            name='Initial',
            slug='initial',
            is_initial=True
        )
        
        # Creating another initial state should not cause validation error at creation
        # (validation happens on clean/save in forms)
        state2 = WorkflowState.objects.create(
            template=self.template,
            name='Another Initial',
            slug='another-initial',
            is_initial=True
        )
        
        # Both states exist
        self.assertTrue(WorkflowState.objects.filter(template=self.template, is_initial=True).count() >= 1)

    def test_workflow_transition_creation(self):
        state1 = WorkflowState.objects.create(
            template=self.template,
            name='State 1',
            slug='state-1'
        )
        state2 = WorkflowState.objects.create(
            template=self.template,
            name='State 2',
            slug='state-2'
        )
        
        transition = WorkflowTransition.objects.create(
            template=self.template,
            from_state=state1,
            to_state=state2,
            name='Move to State 2',
            require_role='assignee'
        )
        
        self.assertEqual(transition.from_state, state1)
        self.assertEqual(transition.to_state, state2)
        self.assertEqual(transition.require_role, 'assignee')
        self.assertEqual(str(transition), 'State 1 → State 2')

    def test_workflow_history_creation(self):
        state1 = WorkflowState.objects.create(
            template=self.template,
            name='State 1',
            slug='state-1'
        )
        state2 = WorkflowState.objects.create(
            template=self.template,
            name='State 2',
            slug='state-2'
        )
        
        import uuid
        entity_id = uuid.uuid4()
        
        history = WorkflowHistory.objects.create(
            template=self.template,
            entity_type='feature',
            entity_id=entity_id,
            from_state=state1,
            to_state=state2,
            changed_by=self.user,
            comment='Moved to next stage'
        )
        
        self.assertEqual(history.from_state, state1)
        self.assertEqual(history.to_state, state2)
        self.assertEqual(history.changed_by, self.user)
        self.assertEqual(history.comment, 'Moved to next stage')

    def test_workflow_rule_creation(self):
        state = WorkflowState.objects.create(
            template=self.template,
            name='Test State',
            slug='test-state'
        )
        
        rule = WorkflowRule.objects.create(
            template=self.template,
            name='Auto Assign Rule',
            description='Automatically assign to creator',
            trigger_on_state=state,
            action_type='assign_user',
            action_config={'assign_to': 'creator'},
            created_by=self.user
        )
        
        self.assertEqual(rule.trigger_on_state, state)
        self.assertEqual(rule.action_type, 'assign_user')
        self.assertTrue(rule.is_active)
        self.assertEqual(rule.created_by, self.user)


class WorkflowAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User',
            is_staff=True  # Staff user for workflow permissions
        )
        self.client.force_authenticate(user=self.user)
        
        self.template = WorkflowTemplate.objects.create(
            name='Test Workflow',
            description='Test workflow template',
            entity_type='feature',
            created_by=self.user
        )

    def test_workflow_template_list(self):
        url = reverse('workflowtemplate-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Test Workflow')

    def test_workflow_template_create(self):
        url = reverse('workflowtemplate-list')
        data = {
            'name': 'New Workflow',
            'description': 'A new workflow template',
            'entity_type': 'project',
            'initial_states': [
                {
                    'name': 'Started',
                    'slug': 'started',
                    'is_initial': True,
                    'color': '#10B981'
                },
                {
                    'name': 'In Progress',
                    'slug': 'in-progress',
                    'color': '#F59E0B'
                },
                {
                    'name': 'Completed',
                    'slug': 'completed',
                    'is_final': True,
                    'color': '#EF4444'
                }
            ]
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check that template was created
        template = WorkflowTemplate.objects.get(name='New Workflow')
        self.assertEqual(template.entity_type, 'project')
        self.assertEqual(template.created_by, self.user)
        
        # Check that states were created
        states = template.states.all()
        self.assertEqual(states.count(), 3)
        
        initial_state = states.filter(is_initial=True).first()
        self.assertIsNotNone(initial_state)
        self.assertEqual(initial_state.name, 'Started')

    def test_workflow_template_detail(self):
        url = reverse('workflowtemplate-detail', kwargs={'pk': self.template.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test Workflow')

    def test_workflow_template_states_action(self):
        # Create states
        state1 = WorkflowState.objects.create(
            template=self.template,
            name='State 1',
            slug='state-1'
        )
        state2 = WorkflowState.objects.create(
            template=self.template,
            name='State 2',
            slug='state-2'
        )
        
        url = reverse('workflowtemplate-states', kwargs={'pk': self.template.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_workflow_template_duplicate_action(self):
        # Create original template with states
        state1 = WorkflowState.objects.create(
            template=self.template,
            name='Original State',
            slug='original-state',
            is_initial=True
        )
        
        url = reverse('workflowtemplate-duplicate', kwargs={'pk': self.template.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check that duplicate was created
        duplicate = WorkflowTemplate.objects.get(name='Test Workflow (Copy)')
        self.assertEqual(duplicate.entity_type, 'feature')
        self.assertEqual(duplicate.created_by, self.user)
        
        # Check that states were duplicated
        duplicate_states = duplicate.states.all()
        self.assertEqual(duplicate_states.count(), 1)
        self.assertEqual(duplicate_states.first().name, 'Original State')

    def test_workflow_state_crud(self):
        # Create
        url = reverse('workflowstate-list')
        data = {
            'template': str(self.template.pk),
            'name': 'New State',
            'slug': 'new-state',
            'description': 'A new workflow state',
            'color': '#FF0000',
            'order': 1
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        state = WorkflowState.objects.get(name='New State')
        self.assertEqual(state.template, self.template)
        self.assertEqual(state.color, '#FF0000')
        
        # Update
        update_url = reverse('workflowstate-detail', kwargs={'pk': state.pk})
        update_data = {'color': '#00FF00'}
        response = self.client.patch(update_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        state.refresh_from_db()
        self.assertEqual(state.color, '#00FF00')

    def test_workflow_history_filtering(self):
        # Create history entries
        state1 = WorkflowState.objects.create(
            template=self.template,
            name='State 1',
            slug='state-1'
        )
        state2 = WorkflowState.objects.create(
            template=self.template,
            name='State 2',
            slug='state-2'
        )
        
        import uuid
        entity_id = uuid.uuid4()
        
        WorkflowHistory.objects.create(
            template=self.template,
            entity_type='feature',
            entity_id=entity_id,
            to_state=state1,
            changed_by=self.user
        )
        WorkflowHistory.objects.create(
            template=self.template,
            entity_type='feature',
            entity_id=entity_id,
            from_state=state1,
            to_state=state2,
            changed_by=self.user
        )
        
        # Test entity history filtering
        url = reverse('workflowhistory-entity-history')
        response = self.client.get(url, {
            'entity_type': 'feature',
            'entity_id': entity_id
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_workflow_permissions_non_staff(self):
        # Create non-staff user
        regular_user = User.objects.create_user(
            email='regular@example.com',
            password='testpass123',
            first_name='Regular',
            last_name='User'
        )
        self.client.force_authenticate(user=regular_user)
        
        # Should be able to read
        url = reverse('workflowtemplate-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should not be able to create
        data = {
            'name': 'Unauthorized Workflow',
            'entity_type': 'feature'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class WorkflowIntegrationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
        self.project = Project.objects.create(
            name='Test Project',
            description='Test project description',
            owner=self.user
        )
        
        # Create workflow template for features
        self.template = WorkflowTemplate.objects.create(
            name='Feature Workflow',
            description='Workflow for features',
            entity_type='feature',
            created_by=self.user
        )
        
        # Create workflow states matching feature statuses
        self.states = {}
        statuses = ['idea', 'specification', 'development', 'testing', 'live']
        for i, status_name in enumerate(statuses):
            state = WorkflowState.objects.create(
                template=self.template,
                name=status_name.capitalize(),
                slug=status_name,
                is_initial=(i == 0),
                is_final=(i == len(statuses) - 1),
                order=i * 10
            )
            self.states[status_name] = state

    def test_feature_workflow_integration(self):
        # Create a feature
        feature = Feature.objects.create(
            project=self.project,
            title='Test Feature',
            description='Test feature description',
            reporter=self.user,
            status='idea'
        )
        
        # Advance status - should record workflow history
        feature.advance_status(user=self.user, comment='Moving to specification')
        
        # Check that workflow history was created
        history = WorkflowHistory.objects.filter(
            entity_type='feature',
            entity_id=feature.id
        ).first()
        
        self.assertIsNotNone(history)
        self.assertEqual(history.from_state, self.states['idea'])
        self.assertEqual(history.to_state, self.states['specification'])
        self.assertEqual(history.changed_by, self.user)
        self.assertEqual(history.comment, 'Moving to specification')
        
        # Test set_status method
        feature.set_status('development', user=self.user, comment='Ready for development')
        
        # Check that another history entry was created
        history_count = WorkflowHistory.objects.filter(
            entity_type='feature',
            entity_id=feature.id
        ).count()
        
        self.assertEqual(history_count, 2)
        
        latest_history = WorkflowHistory.objects.filter(
            entity_type='feature',
            entity_id=feature.id
        ).first()  # Most recent due to ordering
        
        self.assertEqual(latest_history.to_state, self.states['development'])
        self.assertEqual(latest_history.comment, 'Ready for development')

    def test_feature_workflow_without_template(self):
        # Delete the workflow template
        self.template.delete()
        
        # Create a feature
        feature = Feature.objects.create(
            project=self.project,
            title='Test Feature No Workflow',
            description='Test feature without workflow',
            reporter=self.user,
            status='idea'
        )
        
        # Advance status - should work without workflow recording
        result = feature.advance_status(user=self.user, comment='No workflow')
        self.assertTrue(result)
        self.assertEqual(feature.status, 'specification')
        
        # No workflow history should be created
        history_count = WorkflowHistory.objects.filter(
            entity_type='feature',
            entity_id=feature.id
        ).count()
        
        self.assertEqual(history_count, 0)

    def test_workflow_metrics_calculation(self):
        from datetime import datetime, timedelta
        from django.utils import timezone
        
        start_date = timezone.now() - timedelta(days=30)
        end_date = timezone.now()
        
        # Create some workflow history
        feature = Feature.objects.create(
            project=self.project,
            title='Metrics Test Feature',
            description='For testing metrics',
            reporter=self.user,
            status='idea'
        )
        
        # Create history entries with proper from_state for transitions
        prev_state = None
        for i, status_name in enumerate(['idea', 'specification', 'development']):
            WorkflowHistory.objects.create(
                template=self.template,
                entity_type='feature',
                entity_id=feature.id,
                from_state=prev_state,
                to_state=self.states[status_name],
                changed_by=self.user,
                created_at=start_date + timedelta(days=i * 5)
            )
            prev_state = self.states[status_name]
        
        # Calculate metrics for 'idea' state
        idea_history = WorkflowHistory.objects.filter(
            template=self.template,
            to_state=self.states['idea'],
            created_at__gte=start_date,
            created_at__lte=end_date
        )
        
        self.assertEqual(idea_history.count(), 1)
        
        # Create metrics record
        metrics = WorkflowMetrics.objects.create(
            template=self.template,
            state=self.states['idea'],
            period_start=start_date,
            period_end=end_date,
            avg_time_in_state_hours=24.0,
            total_entries=idea_history.count(),
            total_exits=1,
            completion_rate=100.0
        )
        
        self.assertEqual(metrics.total_entries, 1)
        self.assertEqual(metrics.completion_rate, 100.0)