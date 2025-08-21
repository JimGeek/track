# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-08-21-advanced-search-filtering/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Test Coverage

### Model Tests (Django)

#### SearchableContent Model Tests
```python
class SearchableContentModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('testuser', 'test@test.com', 'pass')
        self.project = Project.objects.create(title='Test Project', created_by=self.user)
        
    def test_create_searchable_content(self):
        """Test creating searchable content record"""
        content = SearchableContent.objects.create(
            content_type='feature',
            object_id=1,
            title='Test Feature',
            content='This is a test feature description',
            tags=['authentication', 'security'],
            metadata={'priority': 'high', 'status': 'pending'}
        )
        
        self.assertEqual(content.content_type, 'feature')
        self.assertEqual(content.object_id, 1)
        self.assertIn('authentication', content.tags)
        self.assertEqual(content.metadata['priority'], 'high')
    
    def test_search_vector_generation(self):
        """Test automatic search vector generation"""
        content = SearchableContent.objects.create(
            content_type='feature',
            object_id=1,
            title='User Authentication',
            content='Implement login and logout functionality',
            keywords=['auth', 'login', 'security']
        )
        
        # Search vector should be automatically generated via trigger
        content.refresh_from_db()
        self.assertIsNotNone(content.search_vector)
    
    def test_excerpt_generation(self):
        """Test automatic excerpt generation"""
        long_content = 'A' * 500
        content = SearchableContent.objects.create(
            content_type='feature',
            object_id=1,
            title='Test Feature',
            content=long_content
        )
        
        content.refresh_from_db()
        self.assertEqual(len(content.excerpt), 300)
        self.assertTrue(content.excerpt.startswith('A'))
    
    def test_popularity_score_calculation(self):
        """Test popularity score updates"""
        content = SearchableContent.objects.create(
            content_type='feature',
            object_id=1,
            title='Popular Feature',
            content='This is popular',
            view_count=100,
            click_count=50
        )
        
        # Test popularity score calculation logic
        expected_score = (content.view_count * 0.1) + (content.click_count * 0.5)
        # This would be implemented in model methods or service layer
```

#### SavedSearch Model Tests
```python
class SavedSearchModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('testuser', 'test@test.com', 'pass')
        
    def test_create_saved_search(self):
        """Test creating a saved search"""
        saved_search = SavedSearch.objects.create(
            user=self.user,
            name='My Features',
            description='Features assigned to me',
            query_text='assigned:testuser',
            filters={'assigned_to': ['testuser'], 'status': ['pending']},
            sort_config={'field': 'created_date', 'order': 'desc'}
        )
        
        self.assertEqual(saved_search.user, self.user)
        self.assertEqual(saved_search.name, 'My Features')
        self.assertIn('assigned_to', saved_search.filters)
    
    def test_unique_name_per_user(self):
        """Test that search names are unique per user"""
        SavedSearch.objects.create(
            user=self.user,
            name='My Search',
            query_text='test'
        )
        
        with self.assertRaises(IntegrityError):
            SavedSearch.objects.create(
                user=self.user,
                name='My Search',
                query_text='another test'
            )
    
    def test_usage_tracking(self):
        """Test search usage tracking"""
        saved_search = SavedSearch.objects.create(
            user=self.user,
            name='Test Search',
            query_text='test'
        )
        
        # Simulate usage
        saved_search.usage_count += 1
        saved_search.last_used = timezone.now()
        saved_search.save()
        
        saved_search.refresh_from_db()
        self.assertEqual(saved_search.usage_count, 1)
        self.assertIsNotNone(saved_search.last_used)
    
    def test_sharing_functionality(self):
        """Test search sharing setup"""
        saved_search = SavedSearch.objects.create(
            user=self.user,
            name='Shared Search',
            query_text='shared content',
            is_shared=True
        )
        
        self.assertTrue(saved_search.is_shared)
        self.assertIsNotNone(saved_search.share_token)
```

#### SearchAnalytics Model Tests
```python
class SearchAnalyticsModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('testuser')
        
    def test_create_search_analytics(self):
        """Test creating search analytics record"""
        analytics = SearchAnalytics.objects.create(
            user=self.user,
            session_id='sess_123',
            query_text='test query',
            filters_applied={'status': 'completed'},
            results_count=25,
            response_time_ms=150,
            clicked_results=[{'id': 1, 'position': 0}]
        )
        
        self.assertEqual(analytics.user, self.user)
        self.assertEqual(analytics.query_text, 'test query')
        self.assertEqual(analytics.results_count, 25)
        self.assertEqual(len(analytics.clicked_results), 1)
    
    def test_analytics_aggregation(self):
        """Test analytics data aggregation"""
        # Create multiple analytics records
        for i in range(5):
            SearchAnalytics.objects.create(
                user=self.user,
                session_id=f'sess_{i}',
                query_text='popular query',
                results_count=10 + i,
                response_time_ms=100 + i * 10
            )
        
        # Test aggregation queries
        avg_results = SearchAnalytics.objects.filter(
            query_text='popular query'
        ).aggregate(Avg('results_count'))['results_count__avg']
        
        self.assertEqual(avg_results, 12.0)  # (10+11+12+13+14)/5
```

### Service Layer Tests

#### SearchService Tests
```python
class SearchServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('testuser', 'test@test.com', 'pass')
        self.project = Project.objects.create(title='Test Project', created_by=self.user)
        
        # Create test searchable content
        SearchableContent.objects.create(
            content_type='feature',
            object_id=1,
            title='User Authentication',
            content='Login and logout functionality',
            tags=['auth', 'security'],
            metadata={'status': 'completed', 'priority': 'high'}
        )
        
        SearchableContent.objects.create(
            content_type='feature',
            object_id=2,
            title='Payment Integration',
            content='Payment gateway setup',
            tags=['payment', 'integration'],
            metadata={'status': 'pending', 'priority': 'medium'}
        )
    
    @mock.patch('search.services.ElasticsearchService.search')
    def test_basic_search(self, mock_es_search):
        """Test basic search functionality"""
        # Mock Elasticsearch response
        mock_es_search.return_value = {
            'hits': {
                'total': {'value': 1},
                'hits': [
                    {
                        '_source': {
                            'title': 'User Authentication',
                            'content': 'Login and logout functionality',
                            'content_type': 'feature'
                        },
                        '_score': 0.95,
                        'highlight': {
                            'title': ['<em>User</em> <em>Authentication</em>']
                        }
                    }
                ]
            },
            'aggregations': {}
        }
        
        query_params = {
            'q': 'user authentication',
            'user': self.user,
            'content_types': ['feature'],
            'page': 1,
            'size': 20
        }
        
        results = SearchService.search(query_params)
        
        self.assertIn('results', results)
        self.assertEqual(len(results['results']), 1)
        self.assertEqual(results['results'][0]['title'], 'User Authentication')
        mock_es_search.assert_called_once()
    
    def test_query_parsing(self):
        """Test natural language query parsing"""
        parser = SearchQueryParser()
        
        # Test field-specific queries
        parsed = parser.parse('status:completed priority:high user authentication')
        
        self.assertEqual(parsed['text_query'], 'user authentication')
        self.assertIn('status', parsed['filters'])
        self.assertEqual(parsed['filters']['status'], 'completed')
        self.assertEqual(parsed['filters']['priority'], 'high')
    
    def test_date_expression_parsing(self):
        """Test date expression parsing"""
        parser = SearchQueryParser()
        
        parsed = parser.parse('created:last week updated:today bug fixes')
        
        self.assertEqual(parsed['text_query'], 'bug fixes')
        self.assertIn('created', parsed['date_filters'])
        self.assertIn('updated', parsed['date_filters'])
        
        # Test date range structure
        created_range = parsed['date_filters']['created']
        self.assertIn('gte', created_range)
    
    @mock.patch('search.services.SearchAnalyticsService.track_search')
    def test_analytics_tracking(self, mock_track):
        """Test search analytics tracking"""
        query_params = {
            'q': 'test query',
            'user': self.user,
            'filters': {'status': 'completed'},
            'page': 1,
            'size': 20
        }
        
        with mock.patch('search.services.ElasticsearchService.search') as mock_search:
            mock_search.return_value = {'hits': {'total': {'value': 5}, 'hits': []}}
            SearchService.search(query_params)
        
        # Verify analytics tracking was called
        mock_track.assert_called()
```

#### SearchSuggestionService Tests
```python
class SearchSuggestionServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('testuser')
        
        # Create test suggestions
        SearchSuggestion.objects.create(
            suggestion_text='user authentication',
            suggestion_type='query',
            usage_count=25,
            popularity_score=8.5
        )
        
        SearchSuggestion.objects.create(
            suggestion_text='status:completed',
            suggestion_type='filter',
            usage_count=15,
            popularity_score=7.2
        )
    
    def test_get_query_suggestions(self):
        """Test getting query suggestions"""
        suggestions = SearchSuggestionService.get_query_suggestions(
            query='user auth',
            limit=10,
            user=self.user
        )
        
        self.assertGreater(len(suggestions), 0)
        self.assertEqual(suggestions[0]['type'], 'query')
        self.assertIn('user authentication', [s['text'] for s in suggestions])
    
    def test_suggestion_ranking(self):
        """Test suggestion ranking by popularity"""
        # Create suggestions with different popularity scores
        SearchSuggestion.objects.create(
            suggestion_text='high popularity',
            suggestion_type='query',
            popularity_score=9.0
        )
        
        SearchSuggestion.objects.create(
            suggestion_text='low popularity',
            suggestion_type='query',
            popularity_score=3.0
        )
        
        suggestions = SearchSuggestionService.get_query_suggestions(
            query='popularity',
            limit=10,
            user=self.user
        )
        
        # Should be ordered by popularity (descending)
        self.assertEqual(suggestions[0]['text'], 'high popularity')
    
    def test_contextual_suggestions(self):
        """Test contextual suggestions based on project/content type"""
        SearchSuggestion.objects.create(
            suggestion_text='mobile features',
            suggestion_type='query',
            context_type='project',
            context_id=1,
            usage_count=10
        )
        
        suggestions = SearchSuggestionService.get_query_suggestions(
            query='mobile',
            context={'project_id': 1},
            user=self.user
        )
        
        contextual_suggestions = [s for s in suggestions if 'mobile features' in s['text']]
        self.assertGreater(len(contextual_suggestions), 0)
```

### API Tests (Django REST Framework)

#### Search API Tests
```python
class SearchAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user('testuser', 'test@test.com', 'pass')
        self.client.force_authenticate(user=self.user)
        
        # Create test data
        self.project = Project.objects.create(title='Test Project', created_by=self.user)
        self.feature = FeatureRequest.objects.create(
            title='User Authentication',
            description='Login functionality',
            project=self.project,
            created_by=self.user
        )
    
    @mock.patch('search.services.SearchService.search')
    def test_search_endpoint(self, mock_search):
        """Test main search API endpoint"""
        mock_search.return_value = {
            'results': [
                {
                    'id': 1,
                    'title': 'User Authentication',
                    'content_type': 'feature',
                    'score': 0.95
                }
            ],
            'pagination': {'total': 1, 'page': 1},
            'meta': {'took_ms': 45}
        }
        
        url = reverse('search-list')
        response = self.client.get(url, {
            'q': 'user authentication',
            'content_types[]': ['feature'],
            'page': 1,
            'size': 20
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertEqual(len(response.data['results']), 1)
        mock_search.assert_called_once()
    
    def test_search_with_filters(self):
        """Test search with complex filters"""
        url = reverse('search-list')
        filters = {
            'status': ['completed', 'in_progress'],
            'priority': ['high'],
            'created_date': {'after': '2025-08-01'}
        }
        
        with mock.patch('search.services.SearchService.search') as mock_search:
            mock_search.return_value = {'results': [], 'pagination': {}, 'meta': {}}
            
            response = self.client.get(url, {
                'q': 'test',
                'filters': json.dumps(filters)
            })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify filters were parsed and passed to search service
        call_args = mock_search.call_args[0][0]
        self.assertIn('status', call_args['filters'])
    
    def test_search_suggestions_endpoint(self):
        """Test search suggestions API"""
        url = reverse('search-suggest')
        
        with mock.patch('search.services.SearchService.get_suggestions') as mock_suggest:
            mock_suggest.return_value = {
                'suggestions': [
                    {'text': 'user authentication', 'type': 'query', 'score': 0.9}
                ],
                'popular_searches': ['bug fixes', 'new features']
            }
            
            response = self.client.get(url, {
                'q': 'user auth',
                'types[]': ['query', 'filter'],
                'limit': 10
            })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('suggestions', response.data)
        self.assertIn('popular_searches', response.data)
    
    def test_search_analytics_tracking(self):
        """Test search analytics tracking endpoint"""
        url = reverse('search-analytics')
        analytics_data = {
            'query': 'test query',
            'filters': {'status': 'completed'},
            'results_count': 15,
            'response_time_ms': 120,
            'clicked_results': [{'id': 1, 'position': 0}],
            'session_id': 'sess_test_123'
        }
        
        with mock.patch('search.services.SearchAnalyticsService.track_search') as mock_track:
            response = self.client.post(url, analytics_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        mock_track.assert_called_once()
    
    def test_unauthorized_search_access(self):
        """Test that unauthenticated users cannot search"""
        self.client.force_authenticate(user=None)
        url = reverse('search-list')
        response = self.client.get(url, {'q': 'test'})
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
```

#### Saved Search API Tests
```python
class SavedSearchAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user('testuser', 'test@test.com', 'pass')
        self.client.force_authenticate(user=self.user)
        
        self.saved_search = SavedSearch.objects.create(
            user=self.user,
            name='My Features',
            query_text='assigned:testuser',
            filters={'status': ['pending']}
        )
    
    def test_list_saved_searches(self):
        """Test listing user's saved searches"""
        url = reverse('saved-search-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('saved_searches', response.data)
        self.assertEqual(len(response.data['saved_searches']), 1)
    
    def test_create_saved_search(self):
        """Test creating a new saved search"""
        url = reverse('saved-search-list')
        data = {
            'name': 'High Priority Bugs',
            'description': 'All high priority bugs',
            'query_text': 'type:bug priority:high',
            'filters': {'content_type': ['feature'], 'priority': ['high']},
            'sort_config': {'field': 'created_date', 'order': 'desc'}
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(SavedSearch.objects.count(), 2)
        
        new_search = SavedSearch.objects.get(name='High Priority Bugs')
        self.assertEqual(new_search.user, self.user)
    
    def test_execute_saved_search(self):
        """Test executing a saved search"""
        url = reverse('saved-search-execute', kwargs={'pk': self.saved_search.id})
        
        with mock.patch('search.services.SearchService.search') as mock_search:
            mock_search.return_value = {
                'results': [{'id': 1, 'title': 'Test Feature'}],
                'pagination': {'total': 1}
            }
            
            response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        
        # Check that usage count was updated
        self.saved_search.refresh_from_db()
        self.assertEqual(self.saved_search.usage_count, 1)
    
    def test_share_saved_search(self):
        """Test sharing a saved search"""
        other_user = User.objects.create_user('otheruser', 'other@test.com', 'pass')
        url = reverse('saved-search-share', kwargs={'pk': self.saved_search.id})
        
        data = {
            'share_with_users': [other_user.id],
            'permission_level': 'view',
            'message': 'Sharing useful search'
        }
        
        with mock.patch('search.services.SavedSearchService.share_search') as mock_share:
            mock_share.return_value = 1
            response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('shares_created', response.data)
    
    def test_cannot_share_others_search(self):
        """Test that users cannot share searches they don't own"""
        other_user = User.objects.create_user('otheruser')
        other_search = SavedSearch.objects.create(
            user=other_user,
            name='Other Search',
            query_text='test'
        )
        
        url = reverse('saved-search-share', kwargs={'pk': other_search.id})
        response = self.client.post(url, {'share_with_users': [self.user.id]})
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
```

### Frontend Component Tests (React/Jest)

#### Search Component Tests
```javascript
describe('AdvancedSearch Component', () => {
  const mockSearchResults = {
    results: [
      {
        id: 1,
        title: 'User Authentication',
        content_type: 'feature',
        excerpt: 'Login and logout functionality...',
        highlights: {
          title: ['<em>User</em> <em>Authentication</em>']
        }
      }
    ],
    pagination: { total: 1, page: 1 },
    meta: { took_ms: 45 }
  };

  test('renders search interface correctly', () => {
    render(<AdvancedSearch />);
    
    expect(screen.getByPlaceholderText('Search features, projects, and more...')).toBeInTheDocument();
    expect(screen.getByTestId('filter-builder')).toBeInTheDocument();
  });

  test('performs search on input change', async () => {
    const mockSearch = jest.fn().mockResolvedValue(mockSearchResults);
    
    render(<AdvancedSearch searchAPI={{ search: mockSearch }} />);
    
    const searchInput = screen.getByPlaceholderText('Search features, projects, and more...');
    fireEvent.change(searchInput, { target: { value: 'user auth' } });
    
    // Wait for debounced search
    await waitFor(() => {
      expect(mockSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          q: 'user auth'
        })
      );
    }, { timeout: 500 });
  });

  test('displays search results correctly', () => {
    render(<AdvancedSearch initialResults={mockSearchResults} />);
    
    expect(screen.getByText('User Authentication')).toBeInTheDocument();
    expect(screen.getByText('feature')).toBeInTheDocument();
    expect(screen.getByText('45ms')).toBeInTheDocument();
  });

  test('handles search result clicks', () => {
    const mockTrackClick = jest.fn();
    
    render(
      <AdvancedSearch 
        initialResults={mockSearchResults}
        onResultClick={mockTrackClick}
      />
    );
    
    const resultLink = screen.getByText('User Authentication');
    fireEvent.click(resultLink);
    
    expect(mockTrackClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        position: 0
      })
    );
  });
});
```

#### Filter Builder Tests
```javascript
describe('FilterBuilder Component', () => {
  const mockFacets = {
    status: {
      pending: 15,
      completed: 25,
      in_progress: 10
    },
    priority: {
      high: 12,
      medium: 20,
      low: 8
    }
  };

  test('renders filter interface', () => {
    render(<FilterBuilder facets={mockFacets} />);
    
    expect(screen.getByText('Add Filter Group')).toBeInTheDocument();
    expect(screen.getByTestId('filter-toolbar')).toBeInTheDocument();
  });

  test('adds filter group on button click', () => {
    const mockOnChange = jest.fn();
    
    render(<FilterBuilder facets={mockFacets} onChange={mockOnChange} />);
    
    const addButton = screen.getByText('Add Filter Group');
    fireEvent.click(addButton);
    
    expect(screen.getByTestId('filter-group')).toBeInTheDocument();
  });

  test('applies preset filters', () => {
    const mockOnChange = jest.fn();
    
    render(<FilterBuilder facets={mockFacets} onChange={mockOnChange} />);
    
    const statusFilter = screen.getByText('Status');
    fireEvent.click(statusFilter);
    
    const completedOption = screen.getByText('completed (25)');
    fireEvent.click(completedOption);
    
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ['completed']
      })
    );
  });

  test('removes filters correctly', () => {
    const initialFilters = { status: ['completed'] };
    const mockOnChange = jest.fn();
    
    render(
      <FilterBuilder 
        filters={initialFilters}
        facets={mockFacets}
        onChange={mockOnChange}
      />
    );
    
    const removeButton = screen.getByTestId('remove-filter-status');
    fireEvent.click(removeButton);
    
    expect(mockOnChange).toHaveBeenCalledWith({});
  });
});
```

### Performance Tests

#### Search Performance Tests
```python
class SearchPerformanceTest(TransactionTestCase):
    def setUp(self):
        self.user = User.objects.create_user('testuser')
        
        # Create large dataset
        for i in range(1000):
            SearchableContent.objects.create(
                content_type='feature',
                object_id=i,
                title=f'Feature {i}',
                content=f'This is feature number {i} with description',
                tags=[f'tag{i%10}', f'category{i%5}'],
                metadata={'priority': ['low', 'medium', 'high'][i%3]}
            )
    
    def test_search_performance_large_dataset(self):
        """Test search performance with large dataset"""
        start_time = time.time()
        
        with mock.patch('search.services.ElasticsearchService.search') as mock_search:
            mock_search.return_value = {
                'hits': {'total': {'value': 100}, 'hits': []},
                'aggregations': {}
            }
            
            SearchService.search({
                'q': 'feature description',
                'user': self.user,
                'page': 1,
                'size': 20
            })
        
        end_time = time.time()
        response_time = (end_time - start_time) * 1000
        
        self.assertLess(response_time, 200)  # Should be under 200ms
    
    def test_facet_calculation_performance(self):
        """Test facet calculation performance"""
        start_time = time.time()
        
        # Test database-level facet calculation
        facet_counts = SearchableContent.objects.values('metadata__priority').annotate(
            count=Count('id')
        )
        
        end_time = time.time()
        response_time = (end_time - start_time) * 1000
        
        self.assertLess(response_time, 100)  # Should be under 100ms
        self.assertEqual(len(list(facet_counts)), 3)  # Three priority levels
    
    def test_suggestion_performance(self):
        """Test suggestion query performance"""
        # Create many suggestions
        for i in range(100):
            SearchSuggestion.objects.create(
                suggestion_text=f'query {i}',
                suggestion_type='query',
                usage_count=i,
                popularity_score=i / 10.0
            )
        
        start_time = time.time()
        
        suggestions = SearchSuggestionService.get_query_suggestions(
            query='query',
            limit=10,
            user=self.user
        )
        
        end_time = time.time()
        response_time = (end_time - start_time) * 1000
        
        self.assertLess(response_time, 50)  # Should be under 50ms
        self.assertLessEqual(len(suggestions), 10)
```

## Mocking Requirements

### Search API Mocks
```javascript
// Mock search API responses
const mockSearchResponse = {
  results: [
    {
      id: 1,
      content_type: 'feature',
      title: 'User Authentication System',
      excerpt: 'Comprehensive login and logout functionality...',
      url: '/features/1/',
      score: 0.95,
      highlights: {
        title: ['<em>User</em> <em>Authentication</em> System'],
        content: ['...implement <em>user</em> login...']
      },
      metadata: {
        project: 'Mobile App',
        status: 'completed',
        assigned_to: ['john_doe'],
        priority: 'high'
      }
    }
  ],
  facets: {
    content_type: { feature: 45, project: 12 },
    status: { completed: 30, pending: 15 }
  },
  pagination: {
    page: 1, size: 20, total: 45, total_pages: 3
  },
  meta: { took_ms: 85, total_results: 45 }
};

// Mock Elasticsearch service
class MockElasticsearchService {
  static search(query) {
    return Promise.resolve({
      hits: {
        total: { value: mockSearchResponse.pagination.total },
        hits: mockSearchResponse.results.map(result => ({
          _source: result,
          _score: result.score,
          highlight: result.highlights
        }))
      },
      aggregations: Object.entries(mockSearchResponse.facets).reduce((acc, [key, values]) => {
        acc[key] = {
          buckets: Object.entries(values).map(([value, count]) => ({
            key: value,
            doc_count: count
          }))
        };
        return acc;
      }, {})
    });
  }
}

// Mock saved search data
const mockSavedSearches = [
  {
    id: 1,
    name: 'High Priority Features',
    description: 'Features with high or critical priority',
    query_text: 'priority:high OR priority:critical',
    filters: { priority: ['high', 'critical'] },
    usage_count: 15,
    is_shared: false,
    created_at: '2025-08-01T09:00:00Z'
  }
];
```

### Service Layer Mocks
```python
class MockSearchService:
    @staticmethod
    def search(query_params):
        return {
            'results': [
                {
                    'id': 1,
                    'title': 'Mock Search Result',
                    'content_type': 'feature',
                    'score': 0.85,
                    'excerpt': 'Mock search result content...',
                    'highlights': {}
                }
            ],
            'facets': {},
            'pagination': {'total': 1, 'page': 1},
            'meta': {'took_ms': 50}
        }
    
    @staticmethod
    def get_suggestions(query, **kwargs):
        return {
            'suggestions': [
                {
                    'text': f'{query} suggestion',
                    'type': 'query',
                    'score': 0.8
                }
            ],
            'popular_searches': ['test query', 'another query']
        }

class MockElasticsearchService:
    @staticmethod
    def search(query):
        return {
            'hits': {
                'total': {'value': 1},
                'hits': []
            },
            'aggregations': {}
        }
    
    @staticmethod
    def index_document(doc):
        return {'result': 'created'}
```

### Database Mocks for Tests
```python
# Fixture for search test data
@pytest.fixture
def search_test_data():
    user = User.objects.create_user('testuser')
    project = Project.objects.create(title='Test Project', created_by=user)
    
    # Create searchable content
    content_items = []
    for i in range(10):
        content = SearchableContent.objects.create(
            content_type='feature',
            object_id=i,
            title=f'Test Feature {i}',
            content=f'This is test content for feature {i}',
            tags=[f'tag{i%3}'],
            metadata={'priority': ['low', 'medium', 'high'][i%3]}
        )
        content_items.append(content)
    
    return {
        'user': user,
        'project': project,
        'content_items': content_items
    }

# Mock search analytics
@pytest.fixture
def mock_search_analytics():
    return {
        'total_searches': 150,
        'avg_response_time': 85,
        'popular_queries': [
            {'query': 'bug fixes', 'count': 25},
            {'query': 'new features', 'count': 20}
        ]
    }
```