# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-08-21-visual-timeline-chart-system/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Test Coverage

### Model Tests (Django)

#### TimelineItem Model Tests
```python
class TimelineItemModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('testuser', 'test@test.com', 'pass')
        self.project = Project.objects.create(title='Test Project', created_by=self.user)
    
    def test_create_timeline_item(self):
        """Test creating timeline item with valid data"""
        item = TimelineItem.objects.create(
            title='Test Feature',
            item_type='feature',
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=7),
            project=self.project,
            created_by=self.user
        )
        self.assertEqual(item.duration_days, 7)
        self.assertFalse(item.is_milestone)
    
    def test_milestone_creation(self):
        """Test creating milestone timeline item"""
        milestone = TimelineItem.objects.create(
            title='Project Kickoff',
            item_type='milestone',
            start_date=timezone.now(),
            end_date=timezone.now(),
            project=self.project,
            created_by=self.user,
            is_milestone=True
        )
        self.assertTrue(milestone.is_milestone)
        self.assertEqual(milestone.duration_days, 0)
    
    def test_date_validation(self):
        """Test that start_date must be before end_date"""
        with self.assertRaises(ValidationError):
            item = TimelineItem(
                title='Invalid Item',
                item_type='task',
                start_date=timezone.now() + timedelta(days=1),
                end_date=timezone.now(),
                project=self.project,
                created_by=self.user
            )
            item.full_clean()
    
    def test_critical_path_calculation(self):
        """Test critical path identification"""
        # Create items with dependencies
        item1 = TimelineItem.objects.create(
            title='Task 1',
            item_type='task',
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=5),
            project=self.project,
            created_by=self.user
        )
        
        item2 = TimelineItem.objects.create(
            title='Task 2',
            item_type='task',
            start_date=timezone.now() + timedelta(days=5),
            end_date=timezone.now() + timedelta(days=10),
            project=self.project,
            created_by=self.user
        )
        
        # Create dependency
        TimelineItemDependency.objects.create(
            predecessor=item1,
            successor=item2,
            dependency_type='finish_to_start'
        )
        
        # Test critical path detection (would trigger via signals)
        # This would be implemented in the service layer
```

#### TimelineItemDependency Model Tests
```python
class TimelineItemDependencyTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('testuser')
        self.project = Project.objects.create(title='Test Project', created_by=self.user)
        
        self.item1 = TimelineItem.objects.create(
            title='Predecessor Task',
            item_type='task',
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=5),
            project=self.project,
            created_by=self.user
        )
        
        self.item2 = TimelineItem.objects.create(
            title='Successor Task',
            item_type='task',
            start_date=timezone.now() + timedelta(days=6),
            end_date=timezone.now() + timedelta(days=10),
            project=self.project,
            created_by=self.user
        )
    
    def test_create_dependency(self):
        """Test creating valid dependency relationship"""
        dependency = TimelineItemDependency.objects.create(
            predecessor=self.item1,
            successor=self.item2,
            dependency_type='finish_to_start',
            lag_days=1
        )
        
        self.assertEqual(dependency.predecessor, self.item1)
        self.assertEqual(dependency.successor, self.item2)
        self.assertEqual(dependency.lag_days, 1)
    
    def test_prevent_self_dependency(self):
        """Test that items cannot depend on themselves"""
        with self.assertRaises(ValidationError):
            dependency = TimelineItemDependency(
                predecessor=self.item1,
                successor=self.item1,
                dependency_type='finish_to_start'
            )
            dependency.full_clean()
    
    def test_circular_dependency_detection(self):
        """Test detection of circular dependencies"""
        # Create A -> B dependency
        TimelineItemDependency.objects.create(
            predecessor=self.item1,
            successor=self.item2,
            dependency_type='finish_to_start'
        )
        
        # Try to create B -> A (circular)
        with self.assertRaises(ValidationError):
            circular_dep = TimelineItemDependency(
                predecessor=self.item2,
                successor=self.item1,
                dependency_type='finish_to_start'
            )
            # This validation would be implemented in clean() method
            circular_dep.full_clean()
```

#### TimelineConflict Model Tests
```python
class TimelineConflictTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('testuser')
        self.project = Project.objects.create(title='Test Project', created_by=self.user)
        
        self.item1 = TimelineItem.objects.create(
            title='Task 1',
            item_type='task',
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=5),
            project=self.project,
            created_by=self.user
        )
        
        self.item2 = TimelineItem.objects.create(
            title='Task 2',
            item_type='task',
            start_date=timezone.now() + timedelta(days=2),
            end_date=timezone.now() + timedelta(days=7),
            project=self.project,
            created_by=self.user
        )
    
    def test_create_conflict(self):
        """Test creating timeline conflict"""
        conflict = TimelineConflict.objects.create(
            conflict_type='overlap',
            severity='medium',
            primary_item=self.item1,
            secondary_item=self.item2,
            description='Timeline overlap detected',
            suggested_resolution='Adjust schedules'
        )
        
        self.assertEqual(conflict.primary_item, self.item1)
        self.assertEqual(conflict.secondary_item, self.item2)
        self.assertFalse(conflict.is_resolved)
    
    def test_resolve_conflict(self):
        """Test conflict resolution"""
        conflict = TimelineConflict.objects.create(
            conflict_type='resource',
            severity='high',
            primary_item=self.item1,
            secondary_item=self.item2,
            description='Resource conflict'
        )
        
        # Resolve conflict
        conflict.is_resolved = True
        conflict.resolved_by = self.user
        conflict.resolved_at = timezone.now()
        conflict.resolution_notes = 'Reassigned resources'
        conflict.save()
        
        self.assertTrue(conflict.is_resolved)
        self.assertEqual(conflict.resolved_by, self.user)
```

### Service Layer Tests

#### TimelineService Tests
```python
class TimelineServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('testuser')
        self.project = Project.objects.create(title='Test Project', created_by=self.user)
        
        # Create sample timeline items
        self.items = []
        for i in range(5):
            item = TimelineItem.objects.create(
                title=f'Task {i+1}',
                item_type='task',
                start_date=timezone.now() + timedelta(days=i*3),
                end_date=timezone.now() + timedelta(days=i*3 + 2),
                project=self.project,
                created_by=self.user
            )
            self.items.append(item)
    
    def test_get_project_timeline(self):
        """Test getting project timeline data"""
        timeline_data = TimelineService.get_project_timeline(
            project=self.project,
            include_dependencies=True,
            include_conflicts=True
        )
        
        self.assertIn('project', timeline_data)
        self.assertIn('timeline_items', timeline_data)
        self.assertIn('dependencies', timeline_data)
        self.assertIn('conflicts', timeline_data)
        self.assertEqual(len(timeline_data['timeline_items']), 5)
    
    def test_move_item_without_conflicts(self):
        """Test moving timeline item when no conflicts exist"""
        item = self.items[0]
        new_start = timezone.now() + timedelta(days=20)
        new_end = timezone.now() + timedelta(days=25)
        
        result = TimelineService.move_item(
            item=item,
            new_start=new_start,
            new_end=new_end,
            check_conflicts=True,
            user=self.user
        )
        
        self.assertTrue(result['success'])
        self.assertEqual(len(result['conflicts_detected']), 0)
        item.refresh_from_db()
        self.assertEqual(item.start_date.date(), new_start.date())
    
    def test_move_item_with_conflicts(self):
        """Test moving item that creates conflicts"""
        # Create overlapping assignment
        user2 = User.objects.create_user('user2')
        TimelineItemAssignment.objects.create(
            timeline_item=self.items[0],
            user=user2,
            allocation_percentage=100.0
        )
        TimelineItemAssignment.objects.create(
            timeline_item=self.items[1],
            user=user2,
            allocation_percentage=100.0
        )
        
        # Try to move item to overlap with another item with same resource
        new_start = self.items[1].start_date
        new_end = self.items[1].end_date
        
        result = TimelineService.move_item(
            item=self.items[0],
            new_start=new_start,
            new_end=new_end,
            check_conflicts=True,
            auto_resolve=False,
            user=self.user
        )
        
        self.assertFalse(result['success'])
        self.assertGreater(len(result['conflicts_detected']), 0)
```

#### ConflictDetectionService Tests
```python
class ConflictDetectionServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('testuser')
        self.project = Project.objects.create(title='Test Project', created_by=self.user)
    
    def test_detect_schedule_overlaps(self):
        """Test detection of overlapping schedules"""
        # Create overlapping items with shared resource
        user2 = User.objects.create_user('user2')
        
        item1 = TimelineItem.objects.create(
            title='Task 1',
            item_type='task',
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=5),
            project=self.project,
            created_by=self.user
        )
        
        item2 = TimelineItem.objects.create(
            title='Task 2',
            item_type='task',
            start_date=timezone.now() + timedelta(days=2),
            end_date=timezone.now() + timedelta(days=7),
            project=self.project,
            created_by=self.user
        )
        
        # Assign same user to both items
        TimelineItemAssignment.objects.create(timeline_item=item1, user=user2)
        TimelineItemAssignment.objects.create(timeline_item=item2, user=user2)
        
        conflicts = ConflictDetectionService.detect_all_conflicts([self.project.id])
        
        self.assertGreater(len(conflicts), 0)
        self.assertEqual(conflicts[0]['type'], 'overlap')
    
    def test_detect_dependency_violations(self):
        """Test detection of dependency violations"""
        item1 = TimelineItem.objects.create(
            title='Predecessor',
            item_type='task',
            start_date=timezone.now() + timedelta(days=5),  # Starts after successor
            end_date=timezone.now() + timedelta(days=10),
            project=self.project,
            created_by=self.user
        )
        
        item2 = TimelineItem.objects.create(
            title='Successor',
            item_type='task',
            start_date=timezone.now(),  # Starts before predecessor ends
            end_date=timezone.now() + timedelta(days=3),
            project=self.project,
            created_by=self.user
        )
        
        # Create finish-to-start dependency
        TimelineItemDependency.objects.create(
            predecessor=item1,
            successor=item2,
            dependency_type='finish_to_start'
        )
        
        conflicts = ConflictDetectionService.detect_dependency_violations([item1, item2])
        
        self.assertGreater(len(conflicts), 0)
        self.assertEqual(conflicts[0]['type'], 'dependency')
```

### API Tests (Django REST Framework)

#### Timeline API Tests
```python
class TimelineAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user('testuser', 'test@test.com', 'pass')
        self.client.force_authenticate(user=self.user)
        self.project = Project.objects.create(title='Test Project', created_by=self.user)
        
        self.timeline_item = TimelineItem.objects.create(
            title='Test Task',
            item_type='task',
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=5),
            project=self.project,
            created_by=self.user
        )
    
    def test_get_project_timeline(self):
        """Test getting project timeline via API"""
        url = reverse('timeline-project-timeline', kwargs={'project_id': self.project.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('project', response.data)
        self.assertIn('timeline_items', response.data)
        self.assertEqual(len(response.data['timeline_items']), 1)
    
    def test_create_timeline_item(self):
        """Test creating timeline item via API"""
        url = reverse('timeline-items-list')
        data = {
            'title': 'New Task',
            'item_type': 'task',
            'start_date': timezone.now().isoformat(),
            'end_date': (timezone.now() + timedelta(days=3)).isoformat(),
            'project_id': self.project.id
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(TimelineItem.objects.count(), 2)
    
    def test_move_timeline_item(self):
        """Test moving timeline item via API"""
        url = reverse('timeline-items-move-item', kwargs={'pk': self.timeline_item.id})
        new_start = timezone.now() + timedelta(days=10)
        new_end = timezone.now() + timedelta(days=15)
        
        data = {
            'new_start_date': new_start.isoformat(),
            'new_end_date': new_end.isoformat(),
            'check_conflicts': True
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
    
    def test_unauthorized_project_access(self):
        """Test that users cannot access unauthorized project timelines"""
        other_user = User.objects.create_user('otheruser')
        other_project = Project.objects.create(title='Other Project', created_by=other_user)
        
        url = reverse('timeline-project-timeline', kwargs={'project_id': other_project.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
```

#### Conflict Management API Tests
```python
class ConflictManagementAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user('testuser', 'test@test.com', 'pass')
        self.client.force_authenticate(user=self.user)
        self.project = Project.objects.create(title='Test Project', created_by=self.user)
        
        self.item1 = TimelineItem.objects.create(
            title='Task 1',
            item_type='task',
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=5),
            project=self.project,
            created_by=self.user
        )
        
        self.item2 = TimelineItem.objects.create(
            title='Task 2',
            item_type='task',
            start_date=timezone.now() + timedelta(days=2),
            end_date=timezone.now() + timedelta(days=7),
            project=self.project,
            created_by=self.user
        )
        
        self.conflict = TimelineConflict.objects.create(
            conflict_type='overlap',
            severity='medium',
            primary_item=self.item1,
            secondary_item=self.item2,
            description='Test conflict'
        )
    
    def test_get_conflicts_list(self):
        """Test getting conflicts list"""
        url = reverse('conflicts-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('conflicts', response.data)
        self.assertEqual(len(response.data['conflicts']), 1)
    
    def test_resolve_conflict(self):
        """Test resolving a conflict via API"""
        url = reverse('conflicts-resolve', kwargs={'pk': self.conflict.id})
        data = {
            'resolution_type': 'reschedule',
            'resolution_notes': 'Adjusted task 2 schedule',
            'applied_changes': []
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.conflict.refresh_from_db()
        self.assertTrue(self.conflict.is_resolved)
    
    def test_auto_resolve_conflicts(self):
        """Test auto-resolving multiple conflicts"""
        url = reverse('conflicts-auto-resolve')
        data = {
            'conflict_ids': [self.conflict.id],
            'resolution_preferences': {
                'prefer_delay_over_reassign': True,
                'max_delay_days': 3
            }
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('resolved_count', response.data)
```

### Frontend Component Tests (React/Jest)

#### Timeline Chart Component Tests
```javascript
describe('TimelineChart Component', () => {
  const mockTimelineData = {
    project: { id: 1, title: 'Test Project' },
    timeline_items: [
      {
        id: 1,
        title: 'Task 1',
        start_date: '2025-08-01T09:00:00Z',
        end_date: '2025-08-05T17:00:00Z',
        progress_percentage: 50
      }
    ],
    dependencies: [],
    conflicts: []
  };

  test('renders timeline with items', () => {
    const mockLoadData = jest.fn().mockResolvedValue(mockTimelineData);
    
    render(
      <TimelineChart 
        projectIds={[1]} 
        dateRange={{ start: '2025-08-01', end: '2025-08-31' }}
        loadTimelineData={mockLoadData}
      />
    );
    
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  test('handles item drag and drop', async () => {
    const mockMoveItem = jest.fn().mockResolvedValue({ success: true });
    
    render(
      <TimelineChart 
        projectIds={[1]}
        timelineData={mockTimelineData}
        onItemMove={mockMoveItem}
      />
    );
    
    // Simulate drag and drop
    const timelineItem = screen.getByTestId('timeline-item-1');
    
    fireEvent.dragStart(timelineItem);
    fireEvent.dragEnd(timelineItem);
    
    await waitFor(() => {
      expect(mockMoveItem).toHaveBeenCalled();
    });
  });

  test('displays conflicts correctly', () => {
    const dataWithConflicts = {
      ...mockTimelineData,
      conflicts: [
        {
          id: 1,
          conflict_type: 'overlap',
          severity: 'high',
          description: 'Resource conflict detected'
        }
      ]
    };
    
    render(<TimelineChart timelineData={dataWithConflicts} />);
    
    expect(screen.getByText('Resource conflict detected')).toBeInTheDocument();
    expect(screen.getByTestId('conflict-indicator')).toHaveClass('severity-high');
  });
});
```

#### Gantt Chart Component Tests
```javascript
describe('GanttChart Component', () => {
  const mockItems = [
    {
      id: 1,
      title: 'Task 1',
      start_date: '2025-08-01T09:00:00Z',
      end_date: '2025-08-05T17:00:00Z',
      row_position: 0,
      color_code: '#3498db'
    }
  ];

  test('renders gantt bars correctly', () => {
    render(
      <GanttChart 
        items={mockItems}
        viewConfig={{ zoomLevel: 'week', showDependencies: true }}
      />
    );
    
    const ganttBar = screen.getByTestId('gantt-bar-1');
    expect(ganttBar).toBeInTheDocument();
    expect(ganttBar).toHaveStyle({ fill: '#3498db' });
  });

  test('handles zoom controls', () => {
    const mockOnZoom = jest.fn();
    
    render(
      <GanttChart 
        items={mockItems}
        onZoom={mockOnZoom}
        viewConfig={{ zoomLevel: 'week' }}
      />
    );
    
    const zoomInButton = screen.getByTestId('zoom-in-button');
    fireEvent.click(zoomInButton);
    
    expect(mockOnZoom).toHaveBeenCalledWith('in');
  });

  test('renders progress overlays', () => {
    const itemsWithProgress = mockItems.map(item => ({
      ...item,
      progress_percentage: 75
    }));
    
    render(<GanttChart items={itemsWithProgress} />);
    
    const progressOverlay = screen.getByTestId('progress-overlay-1');
    expect(progressOverlay).toBeInTheDocument();
  });
});
```

### Performance Tests

#### Timeline Rendering Performance Tests
```python
class TimelinePerformanceTest(TestCase):
    def test_large_timeline_rendering(self):
        """Test timeline performance with large number of items"""
        user = User.objects.create_user('testuser')
        project = Project.objects.create(title='Large Project', created_by=user)
        
        # Create 1000 timeline items
        items = []
        for i in range(1000):
            items.append(TimelineItem(
                title=f'Task {i}',
                item_type='task',
                start_date=timezone.now() + timedelta(days=i),
                end_date=timezone.now() + timedelta(days=i+1),
                project=project,
                created_by=user
            ))
        
        TimelineItem.objects.bulk_create(items)
        
        # Test timeline data retrieval performance
        start_time = time.time()
        timeline_data = TimelineService.get_project_timeline(project)
        end_time = time.time()
        
        self.assertLess(end_time - start_time, 3.0)  # Should complete within 3 seconds
        self.assertEqual(len(timeline_data['timeline_items']), 1000)
    
    def test_conflict_detection_performance(self):
        """Test conflict detection performance with many items"""
        user = User.objects.create_user('testuser')
        project = Project.objects.create(title='Test Project', created_by=user)
        
        # Create overlapping items
        for i in range(100):
            TimelineItem.objects.create(
                title=f'Task {i}',
                item_type='task',
                start_date=timezone.now() + timedelta(days=i%10),  # Create overlaps
                end_date=timezone.now() + timedelta(days=(i%10)+2),
                project=project,
                created_by=user
            )
        
        start_time = time.time()
        conflicts = ConflictDetectionService.detect_all_conflicts([project.id])
        end_time = time.time()
        
        self.assertLess(end_time - start_time, 5.0)  # Should complete within 5 seconds
```

## Mocking Requirements

### Timeline Data Mocks
```javascript
// Mock timeline API responses
const mockTimelineResponse = {
  project: {
    id: 1,
    title: 'Test Project',
    start_date: '2025-08-01T00:00:00Z',
    end_date: '2025-12-31T23:59:59Z'
  },
  timeline_items: [
    {
      id: 1,
      title: 'Database Setup',
      item_type: 'task',
      start_date: '2025-08-01T09:00:00Z',
      end_date: '2025-08-05T17:00:00Z',
      progress_percentage: 100,
      color_code: '#2ecc71',
      is_critical_path: true,
      assigned_users: [
        { id: 1, username: 'john_doe', allocation_percentage: 100 }
      ]
    },
    {
      id: 2,
      title: 'API Development',
      item_type: 'feature',
      start_date: '2025-08-06T09:00:00Z',
      end_date: '2025-08-15T17:00:00Z',
      progress_percentage: 45,
      color_code: '#3498db',
      is_critical_path: true
    }
  ],
  dependencies: [
    {
      id: 1,
      predecessor_id: 1,
      successor_id: 2,
      dependency_type: 'finish_to_start',
      lag_days: 1
    }
  ],
  conflicts: [
    {
      id: 1,
      conflict_type: 'resource',
      severity: 'medium',
      primary_item_id: 1,
      secondary_item_id: 2,
      description: 'Resource allocation conflict'
    }
  ]
};

// Mock D3.js timeline renderer
class MockTimelineRenderer {
  constructor(svgElement, options) {
    this.svg = svgElement;
    this.options = options;
  }
  
  render(data) {
    // Mock rendering implementation
    return Promise.resolve();
  }
  
  updateItem(itemId, newData) {
    // Mock item update
    return Promise.resolve();
  }
}

// Mock WebSocket for real-time updates
class MockTimelineWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 1; // OPEN
    this.eventListeners = {};
  }
  
  addEventListener(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }
  
  send(data) {
    // Mock send implementation
    console.log('Mock WebSocket send:', data);
  }
  
  simulateMessage(event, data) {
    const listeners = this.eventListeners[event] || [];
    listeners.forEach(callback => callback({ data: JSON.stringify(data) }));
  }
}
```

### Service Layer Mocks
```python
class MockTimelineService:
    @staticmethod
    def get_project_timeline(project, **options):
        return {
            'project': {
                'id': project.id,
                'title': project.title
            },
            'timeline_items': [
                {
                    'id': 1,
                    'title': 'Mock Task',
                    'start_date': timezone.now(),
                    'end_date': timezone.now() + timedelta(days=5),
                    'progress_percentage': 50
                }
            ],
            'dependencies': [],
            'conflicts': []
        }
    
    @staticmethod
    def move_item(item, new_start, new_end, **options):
        return {
            'success': True,
            'conflicts_detected': [],
            'auto_resolved': []
        }

class MockConflictDetectionService:
    @staticmethod
    def detect_all_conflicts(project_ids):
        return []
    
    @staticmethod
    def detect_item_conflicts(item):
        return []
```