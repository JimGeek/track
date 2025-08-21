# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-08-21-dashboard-analytics/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Test Coverage

### Model Tests (Django)

#### ProjectMetrics Model Tests
```python
class ProjectMetricsModelTest(TestCase):
    def test_create_project_metrics(self):
        """Test creating project metrics record"""
        
    def test_unique_project_date_constraint(self):
        """Test that duplicate project/date combinations are prevented"""
        
    def test_completion_percentage_validation(self):
        """Test validation of completion percentage range (0-100)"""
        
    def test_velocity_calculation(self):
        """Test velocity field accepts decimal values"""
        
    def test_metrics_update_on_feature_change(self):
        """Test that metrics update when feature status changes"""
```

#### FeatureAnalytics Model Tests
```python
class FeatureAnalyticsModelTest(TestCase):
    def test_track_status_duration(self):
        """Test tracking time spent in each status"""
        
    def test_status_change_tracking(self):
        """Test recording of status transitions"""
        
    def test_complexity_score_calculation(self):
        """Test complexity scoring functionality"""
        
    def test_time_to_completion_tracking(self):
        """Test tracking total time from creation to completion"""
```

#### UserActivityLog Model Tests
```python
class UserActivityLogModelTest(TestCase):
    def test_log_user_action(self):
        """Test logging user actions with metadata"""
        
    def test_activity_filtering(self):
        """Test filtering activities by type and date range"""
        
    def test_bulk_activity_creation(self):
        """Test creating multiple activity records efficiently"""
```

### Service Layer Tests

#### AnalyticsService Tests
```python
class AnalyticsServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('testuser')
        self.project = Project.objects.create(title='Test Project', created_by=self.user)
        self.features = [
            FeatureRequest.objects.create(
                title=f'Feature {i}',
                project=self.project,
                created_by=self.user,
                status='completed' if i <= 3 else 'pending'
            ) for i in range(1, 11)
        ]
    
    def test_calculate_project_metrics(self):
        """Test project metrics calculation"""
        metrics = AnalyticsService.calculate_project_metrics(
            self.project.id, 
            date_range=(timezone.now().date() - timedelta(days=30), timezone.now().date())
        )
        
        self.assertEqual(metrics['total_features'], 10)
        self.assertEqual(metrics['completed_features'], 3)
        self.assertEqual(metrics['completion_rate'], 30.0)
    
    def test_identify_at_risk_features(self):
        """Test identification of at-risk features"""
        # Create features with approaching deadlines
        tomorrow = timezone.now().date() + timedelta(days=1)
        FeatureRequest.objects.create(
            title='Urgent Feature',
            project=self.project,
            created_by=self.user,
            deadline=tomorrow,
            status='in_progress'
        )
        
        at_risk = AnalyticsService.identify_at_risk_features()
        self.assertEqual(at_risk.count(), 1)
    
    def test_calculate_velocity(self):
        """Test velocity calculation across time periods"""
        # Create completed features across different weeks
        velocity = AnalyticsService.calculate_velocity(
            self.project.id,
            weeks_back=4
        )
        
        self.assertIsInstance(velocity, list)
        self.assertTrue(all('week' in item and 'count' in item for item in velocity))
    
    def test_get_overview_metrics(self):
        """Test dashboard overview metrics generation"""
        overview = AnalyticsService.get_overview_metrics(
            user=self.user,
            project_ids=[self.project.id]
        )
        
        self.assertIn('overview', overview)
        self.assertIn('total_projects', overview['overview'])
        self.assertIn('overall_completion_rate', overview['overview'])
```

### API Tests (Django REST Framework)

#### Dashboard Analytics API Tests
```python
class DashboardAnalyticsAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user('testuser', 'test@test.com', 'pass')
        self.client.force_authenticate(user=self.user)
        self.project = Project.objects.create(title='Test Project', created_by=self.user)
    
    def test_dashboard_overview_endpoint(self):
        """Test dashboard overview API endpoint"""
        url = reverse('analytics-overview')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('overview', response.data)
        self.assertIn('total_projects', response.data['overview'])
    
    def test_dashboard_overview_with_date_filter(self):
        """Test dashboard overview with date range filtering"""
        url = reverse('analytics-overview')
        params = {
            'date_range': 'last30days',
            'project_ids[]': [self.project.id]
        }
        response = self.client.get(url, params)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_velocity_chart_endpoint(self):
        """Test velocity chart data endpoint"""
        url = reverse('analytics-velocity-chart')
        response = self.client.get(url, {
            'project_ids[]': [self.project.id],
            'period': 'weekly'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('labels', response.data)
        self.assertIn('datasets', response.data)
    
    def test_project_analytics_endpoint(self):
        """Test individual project analytics"""
        url = reverse('project-analytics-detail', kwargs={'pk': self.project.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('metrics', response.data)
    
    def test_at_risk_features_endpoint(self):
        """Test at-risk features endpoint"""
        url = reverse('project-analytics-at-risk-features', kwargs={'pk': self.project.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('at_risk_features', response.data)
    
    def test_unauthorized_access(self):
        """Test that unauthenticated users cannot access analytics"""
        self.client.force_authenticate(user=None)
        url = reverse('analytics-overview')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
```

#### Alert Management API Tests
```python
class AlertManagementAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user('testuser')
        self.client.force_authenticate(user=self.user)
        self.project = Project.objects.create(title='Test Project', created_by=self.user)
        
    def test_get_alerts_endpoint(self):
        """Test retrieving active alerts"""
        url = reverse('analytics-alerts')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('alerts', response.data)
        self.assertIn('summary', response.data)
    
    def test_acknowledge_alert_endpoint(self):
        """Test acknowledging an alert"""
        alert = MetricAlert.objects.create(
            alert_type='deadline_approaching',
            entity_type='feature',
            entity_id=1,
            alert_message='Test alert'
        )
        
        url = reverse('analytics-alert-acknowledge', kwargs={'pk': alert.id})
        response = self.client.post(url, {'notes': 'Taking action'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        alert.refresh_from_db()
        self.assertTrue(alert.is_acknowledged)
```

### Frontend Component Tests (React/Jest)

#### Dashboard Component Tests
```javascript
describe('AnalyticsDashboard Component', () => {
  const mockMetrics = {
    overview: {
      total_projects: 5,
      overall_completion_rate: 67.5,
      at_risk_features: 3
    }
  };

  test('renders dashboard with metrics', () => {
    render(<AnalyticsDashboard />);
    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
  });

  test('displays project overview correctly', () => {
    render(<ProjectOverviewWidget data={mockMetrics.overview} />);
    expect(screen.getByText('67.5%')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('handles date range filtering', () => {
    const mockOnFilterChange = jest.fn();
    render(<DashboardFilters onFilterChange={mockOnFilterChange} />);
    
    const dateFilter = screen.getByLabelText('Date Range');
    fireEvent.change(dateFilter, { target: { value: 'last30days' } });
    
    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ dateRange: 'last30days' })
    );
  });

  test('updates layout on drag', () => {
    const mockOnLayoutChange = jest.fn();
    render(<GridLayout onLayoutChange={mockOnLayoutChange} />);
    
    // Test drag and drop simulation
    const widget = screen.getByTestId('overview-widget');
    fireEvent.dragStart(widget);
    fireEvent.dragEnd(widget);
    
    expect(mockOnLayoutChange).toHaveBeenCalled();
  });
});
```

#### Chart Component Tests
```javascript
describe('Chart Components', () => {
  const mockVelocityData = {
    labels: ['Week 1', 'Week 2', 'Week 3'],
    datasets: [{
      project_id: 1,
      project_name: 'Test Project',
      data: [2, 3, 4]
    }]
  };

  test('VelocityChart renders correctly', () => {
    render(<VelocityChart data={mockVelocityData} />);
    expect(screen.getByTestId('velocity-chart')).toBeInTheDocument();
  });

  test('DonutChart displays status distribution', () => {
    const statusData = {
      pending: 5,
      in_progress: 3,
      completed: 12
    };
    
    render(<DonutChart data={statusData} />);
    expect(screen.getByTestId('donut-chart')).toBeInTheDocument();
  });

  test('handles chart interaction events', () => {
    const mockOnClick = jest.fn();
    render(<VelocityChart data={mockVelocityData} onClick={mockOnClick} />);
    
    const chartCanvas = screen.getByRole('img'); // Chart.js creates canvas with img role
    fireEvent.click(chartCanvas);
    
    // Chart.js click events would be mocked in actual tests
  });
});
```

### Integration Tests

#### Dashboard Workflow Tests
```python
class DashboardIntegrationTest(TransactionTestCase):
    def test_complete_analytics_workflow(self):
        """Test full analytics dashboard workflow"""
        # Create test data
        user = User.objects.create_user('testuser')
        project = Project.objects.create(title='Test Project', created_by=user)
        
        # Create features with different statuses and dates
        features = []
        for i in range(10):
            feature = FeatureRequest.objects.create(
                title=f'Feature {i}',
                project=project,
                created_by=user,
                status='completed' if i < 5 else 'pending'
            )
            features.append(feature)
        
        # Test metrics calculation
        metrics = AnalyticsService.get_overview_metrics(user=user)
        self.assertIsNotNone(metrics)
        
        # Test API response
        client = APIClient()
        client.force_authenticate(user=user)
        response = client.get('/api/analytics/dashboard/')
        self.assertEqual(response.status_code, 200)
    
    def test_real_time_updates_workflow(self):
        """Test real-time dashboard updates"""
        # Test WebSocket connection and updates
        pass
```

### Performance Tests

#### Analytics Performance Tests
```python
class AnalyticsPerformanceTest(TestCase):
    def test_large_dataset_performance(self):
        """Test analytics performance with large datasets"""
        # Create 1000 features across 50 projects
        projects = [
            Project.objects.create(title=f'Project {i}')
            for i in range(50)
        ]
        
        features = []
        for i in range(1000):
            features.append(FeatureRequest(
                title=f'Feature {i}',
                project=projects[i % 50],
                created_by_id=1
            ))
        
        FeatureRequest.objects.bulk_create(features)
        
        # Test metrics calculation performance
        start_time = time.time()
        metrics = AnalyticsService.get_overview_metrics(user=User.objects.first())
        end_time = time.time()
        
        self.assertLess(end_time - start_time, 2.0)  # Should complete within 2 seconds
    
    def test_materialized_view_refresh_performance(self):
        """Test performance of materialized view refreshes"""
        start_time = time.time()
        
        with connection.cursor() as cursor:
            cursor.execute("REFRESH MATERIALIZED VIEW project_summary_view;")
        
        end_time = time.time()
        self.assertLess(end_time - start_time, 5.0)  # Should refresh within 5 seconds
```

## Mocking Requirements

### Analytics API Mocks
```javascript
// Mock dashboard metrics response
const mockDashboardMetrics = {
  overview: {
    total_projects: 5,
    active_features: 25,
    completed_features: 15,
    overall_completion_rate: 67.5,
    avg_velocity: 3.2,
    at_risk_features: 2
  },
  project_metrics: [
    {
      project_id: 1,
      project_title: 'Mobile App',
      completion_percentage: 75.0,
      velocity: 2.5
    }
  ]
};

// Mock chart data
const mockVelocityChart = {
  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
  datasets: [{
    project_id: 1,
    project_name: 'Test Project',
    data: [2, 3, 4, 2],
    color: '#3498db'
  }],
  avg_velocity: 2.75,
  trend: 'increasing'
};
```

### Service Layer Mocks
```python
class MockAnalyticsService:
    @staticmethod
    def get_overview_metrics(user, date_range=None, project_ids=None):
        return {
            'overview': {
                'total_projects': 5,
                'overall_completion_rate': 75.0,
                'at_risk_features': 2
            }
        }
    
    @staticmethod
    def calculate_project_metrics(project_id, date_range):
        return {
            'completion_rate': 67.5,
            'velocity': 3.2,
            'total_features': 20
        }
```

### WebSocket Mocks
```javascript
// Mock WebSocket for real-time updates
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 1; // OPEN
  }
  
  send(data) {
    // Mock send implementation
  }
  
  addEventListener(event, callback) {
    // Mock event listener
  }
  
  close() {
    this.readyState = 3; // CLOSED
  }
}
```