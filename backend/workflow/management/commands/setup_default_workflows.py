from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from workflow.models import WorkflowTemplate, WorkflowState, WorkflowTransition

User = get_user_model()


class Command(BaseCommand):
    help = 'Set up default workflow templates for the application'

    def add_arguments(self, parser):
        parser.add_argument(
            '--admin-email',
            type=str,
            default='admin@example.com',
            help='Email of admin user to create workflows for'
        )
        parser.add_argument(
            '--overwrite',
            action='store_true',
            help='Overwrite existing default workflows'
        )

    def handle(self, *args, **options):
        admin_email = options['admin_email']
        overwrite = options['overwrite']
        
        try:
            admin_user = User.objects.get(email=admin_email)
        except User.DoesNotExist:
            # Create admin user if doesn't exist
            self.stdout.write(
                self.style.WARNING(f'Admin user with email {admin_email} not found. Creating...')
            )
            admin_user = User.objects.create_user(
                email=admin_email,
                password='changeme123',
                first_name='Admin',
                last_name='User',
                is_staff=True,
                is_superuser=True
            )
            self.stdout.write(
                self.style.SUCCESS(f'Created admin user: {admin_email}')
            )

        # Create Feature Workflow Template
        self.create_feature_workflow(admin_user, overwrite)
        
        # Create Project Workflow Template
        self.create_project_workflow(admin_user, overwrite)
        
        self.stdout.write(
            self.style.SUCCESS('Successfully set up default workflow templates!')
        )

    def create_feature_workflow(self, admin_user, overwrite):
        template_name = 'Default Feature Workflow'
        
        # Check if template exists
        existing_template = WorkflowTemplate.objects.filter(
            name=template_name,
            entity_type='feature'
        ).first()
        
        if existing_template and not overwrite:
            self.stdout.write(
                self.style.WARNING(f'Feature workflow template already exists. Use --overwrite to replace.')
            )
            return
        
        if existing_template and overwrite:
            existing_template.delete()
            self.stdout.write(
                self.style.WARNING(f'Deleted existing feature workflow template.')
            )
        
        # Create template
        template = WorkflowTemplate.objects.create(
            name=template_name,
            description='Standard workflow for feature development lifecycle',
            entity_type='feature',
            is_active=True,
            created_by=admin_user
        )
        
        # Define states
        states_data = [
            {
                'name': 'Idea',
                'slug': 'idea',
                'description': 'Initial feature concept',
                'color': '#9CA3AF',
                'icon': 'lightbulb',
                'is_initial': True,
                'order': 10
            },
            {
                'name': 'Specification',
                'slug': 'specification',
                'description': 'Feature requirements and design',
                'color': '#3B82F6',
                'icon': 'document-text',
                'order': 20
            },
            {
                'name': 'Development',
                'slug': 'development',
                'description': 'Active development work',
                'color': '#F59E0B',
                'icon': 'code',
                'require_assignee': True,
                'order': 30
            },
            {
                'name': 'Testing',
                'slug': 'testing',
                'description': 'Quality assurance and testing',
                'color': '#8B5CF6',
                'icon': 'beaker',
                'require_comment': True,
                'order': 40
            },
            {
                'name': 'Live',
                'slug': 'live',
                'description': 'Feature deployed and active',
                'color': '#10B981',
                'icon': 'check-circle',
                'is_final': True,
                'notify_stakeholders': True,
                'order': 50
            }
        ]
        
        # Create states
        states = {}
        for state_data in states_data:
            state = WorkflowState.objects.create(
                template=template,
                **state_data
            )
            states[state_data['slug']] = state
        
        # Define transitions
        transitions_data = [
            {
                'from_slug': 'idea',
                'to_slug': 'specification',
                'name': 'Start Specification',
                'description': 'Move to specification phase',
                'require_role': 'any'
            },
            {
                'from_slug': 'specification',
                'to_slug': 'development',
                'name': 'Start Development',
                'description': 'Begin development work',
                'require_role': 'any',
                'require_comment': True
            },
            {
                'from_slug': 'development',
                'to_slug': 'testing',
                'name': 'Ready for Testing',
                'description': 'Development complete, ready for QA',
                'require_role': 'assignee',
                'require_comment': True
            },
            {
                'from_slug': 'testing',
                'to_slug': 'live',
                'name': 'Deploy to Live',
                'description': 'Testing passed, deploy to production',
                'require_role': 'assignee'
            },
            {
                'from_slug': 'testing',
                'to_slug': 'development',
                'name': 'Back to Development',
                'description': 'Issues found, return to development',
                'require_role': 'any',
                'require_comment': True
            },
            {
                'from_slug': 'specification',
                'to_slug': 'idea',
                'name': 'Back to Idea',
                'description': 'Needs more planning',
                'require_role': 'any'
            }
        ]
        
        # Create transitions
        for transition_data in transitions_data:
            from_slug = transition_data.pop('from_slug')
            to_slug = transition_data.pop('to_slug')
            
            WorkflowTransition.objects.create(
                template=template,
                from_state=states[from_slug],
                to_state=states[to_slug],
                **transition_data
            )
        
        self.stdout.write(
            self.style.SUCCESS(f'Created feature workflow template with {len(states)} states and {len(transitions_data)} transitions')
        )

    def create_project_workflow(self, admin_user, overwrite):
        template_name = 'Default Project Workflow'
        
        # Check if template exists
        existing_template = WorkflowTemplate.objects.filter(
            name=template_name,
            entity_type='project'
        ).first()
        
        if existing_template and not overwrite:
            self.stdout.write(
                self.style.WARNING(f'Project workflow template already exists. Use --overwrite to replace.')
            )
            return
        
        if existing_template and overwrite:
            existing_template.delete()
            self.stdout.write(
                self.style.WARNING(f'Deleted existing project workflow template.')
            )
        
        # Create template
        template = WorkflowTemplate.objects.create(
            name=template_name,
            description='Standard workflow for project lifecycle management',
            entity_type='project',
            is_active=True,
            created_by=admin_user
        )
        
        # Define states
        states_data = [
            {
                'name': 'Planning',
                'slug': 'planning',
                'description': 'Project planning and setup phase',
                'color': '#6B7280',
                'icon': 'clipboard-list',
                'is_initial': True,
                'order': 10
            },
            {
                'name': 'Active',
                'slug': 'active',
                'description': 'Project is actively being worked on',
                'color': '#F59E0B',
                'icon': 'play',
                'require_assignee': True,
                'order': 20
            },
            {
                'name': 'On Hold',
                'slug': 'on-hold',
                'description': 'Project temporarily paused',
                'color': '#EF4444',
                'icon': 'pause',
                'require_comment': True,
                'order': 25
            },
            {
                'name': 'Review',
                'slug': 'review',
                'description': 'Project under review or testing',
                'color': '#8B5CF6',
                'icon': 'eye',
                'order': 30
            },
            {
                'name': 'Completed',
                'slug': 'completed',
                'description': 'Project successfully completed',
                'color': '#10B981',
                'icon': 'check-circle',
                'is_final': True,
                'notify_stakeholders': True,
                'order': 40
            },
            {
                'name': 'Cancelled',
                'slug': 'cancelled',
                'description': 'Project cancelled or discontinued',
                'color': '#DC2626',
                'icon': 'x-circle',
                'is_final': True,
                'require_comment': True,
                'order': 50
            }
        ]
        
        # Create states
        states = {}
        for state_data in states_data:
            state = WorkflowState.objects.create(
                template=template,
                **state_data
            )
            states[state_data['slug']] = state
        
        # Define transitions (simplified for projects)
        transitions_data = [
            {
                'from_slug': 'planning',
                'to_slug': 'active',
                'name': 'Start Project',
                'description': 'Begin active work on project',
                'require_role': 'owner'
            },
            {
                'from_slug': 'active',
                'to_slug': 'on-hold',
                'name': 'Put On Hold',
                'description': 'Temporarily pause project',
                'require_role': 'owner',
                'require_comment': True
            },
            {
                'from_slug': 'on-hold',
                'to_slug': 'active',
                'name': 'Resume Project',
                'description': 'Resume active work',
                'require_role': 'owner'
            },
            {
                'from_slug': 'active',
                'to_slug': 'review',
                'name': 'Submit for Review',
                'description': 'Project ready for review',
                'require_role': 'assignee'
            },
            {
                'from_slug': 'review',
                'to_slug': 'completed',
                'name': 'Mark Complete',
                'description': 'Project successfully completed',
                'require_role': 'owner'
            },
            {
                'from_slug': 'review',
                'to_slug': 'active',
                'name': 'Return to Active',
                'description': 'More work needed',
                'require_role': 'owner'
            },
            {
                'from_slug': 'planning',
                'to_slug': 'cancelled',
                'name': 'Cancel Project',
                'description': 'Cancel before starting',
                'require_role': 'owner',
                'require_comment': True
            },
            {
                'from_slug': 'active',
                'to_slug': 'cancelled',
                'name': 'Cancel Project',
                'description': 'Cancel active project',
                'require_role': 'owner',
                'require_comment': True
            }
        ]
        
        # Create transitions
        for transition_data in transitions_data:
            from_slug = transition_data.pop('from_slug')
            to_slug = transition_data.pop('to_slug')
            
            WorkflowTransition.objects.create(
                template=template,
                from_state=states[from_slug],
                to_state=states[to_slug],
                **transition_data
            )
        
        self.stdout.write(
            self.style.SUCCESS(f'Created project workflow template with {len(states)} states and {len(transitions_data)} transitions')
        )