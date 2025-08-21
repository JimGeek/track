# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-21-advanced-search-filtering/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Endpoints

### Search Operations

#### GET /api/search/
**Description**: Perform advanced search across all content types
**Parameters**:
- `q`: Search query text (supports natural language and field operators)
- `content_types[]`: Filter by content types (feature, project, user, comment)
- `filters`: JSON object with filter conditions
- `facets[]`: Facet fields to include in response
- `sort`: Sort field (relevance, created_date, updated_date, popularity)
- `order`: Sort order (asc, desc)
- `page`: Page number (default: 1)
- `size`: Results per page (default: 20, max: 100)
- `highlight`: Enable search term highlighting (default: true)

**Response**:
```json
{
  "query": {
    "text": "user authentication status:completed",
    "parsed": {
      "text_query": "user authentication",
      "filters": {"status": "completed"},
      "sort": "relevance"
    }
  },
  "results": [
    {
      "id": 1,
      "content_type": "feature",
      "title": "User Authentication System",
      "excerpt": "Implement login and logout functionality with JWT tokens...",
      "url": "/features/1/",
      "score": 0.95,
      "highlights": {
        "title": ["<em>User</em> <em>Authentication</em> System"],
        "content": ["...implement <em>user</em> <em>authentication</em> with..."]
      },
      "metadata": {
        "project": "Mobile App",
        "status": "completed",
        "assigned_to": ["john_doe"],
        "created_date": "2025-08-01T09:00:00Z"
      }
    }
  ],
  "facets": {
    "content_type": {
      "feature": 45,
      "project": 12,
      "comment": 23
    },
    "status": {
      "completed": 30,
      "in_progress": 15,
      "pending": 25
    },
    "assigned_to": {
      "john_doe": 20,
      "jane_smith": 15,
      "bob_wilson": 10
    }
  },
  "pagination": {
    "page": 1,
    "size": 20,
    "total": 80,
    "total_pages": 4,
    "has_next": true,
    "has_previous": false
  },
  "meta": {
    "took_ms": 45,
    "total_results": 80,
    "max_score": 0.95
  }
}
```

#### GET /api/search/suggest/
**Description**: Get search suggestions and autocomplete
**Parameters**:
- `q`: Partial query text
- `types[]`: Suggestion types (query, filter, field_value, tag)
- `context`: Context for suggestions (project_id, content_type)
- `limit`: Maximum suggestions (default: 10)

**Response**:
```json
{
  "suggestions": [
    {
      "text": "user authentication",
      "type": "query",
      "score": 0.9,
      "usage_count": 25,
      "category": "features"
    },
    {
      "text": "status:completed",
      "type": "filter",
      "score": 0.8,
      "description": "Show only completed items"
    },
    {
      "text": "authentication",
      "type": "tag",
      "score": 0.7,
      "usage_count": 15
    }
  ],
  "popular_searches": [
    "bug fixes",
    "high priority features",
    "assigned to me"
  ]
}
```

#### POST /api/search/analytics/
**Description**: Track search analytics
**Body**:
```json
{
  "query": "user authentication",
  "filters": {"status": "completed"},
  "results_count": 15,
  "response_time_ms": 45,
  "clicked_results": [
    {
      "id": 1,
      "position": 0,
      "content_type": "feature"
    }
  ],
  "session_id": "sess_abc123",
  "time_spent_seconds": 30
}
```

### Saved Searches

#### GET /api/search/saved/
**Description**: Get user's saved searches
**Parameters**:
- `shared`: Include shared searches (default: false)
- `public`: Include public searches (default: false)

**Response**:
```json
{
  "saved_searches": [
    {
      "id": 1,
      "name": "High Priority Bugs",
      "description": "Critical and high priority bug reports",
      "query_text": "type:bug priority:high OR priority:critical",
      "filters": {
        "content_type": ["feature"],
        "status": ["pending", "in_progress"]
      },
      "usage_count": 25,
      "last_used": "2025-08-20T14:30:00Z",
      "is_shared": false,
      "created_at": "2025-08-01T09:00:00Z"
    }
  ],
  "shared_with_me": [
    {
      "id": 2,
      "name": "Team Sprint Items",
      "owner": "jane_smith",
      "permission": "view",
      "shared_at": "2025-08-15T10:00:00Z"
    }
  ]
}
```

#### POST /api/search/saved/
**Description**: Create new saved search
**Body**:
```json
{
  "name": "My Critical Features",
  "description": "Features assigned to me with high priority",
  "query_text": "assigned:john_doe priority:high",
  "filters": {
    "content_type": ["feature"],
    "assigned_to": ["john_doe"],
    "priority": ["high", "critical"]
  },
  "sort_config": {
    "field": "created_date",
    "order": "desc"
  },
  "is_shared": false,
  "alert_enabled": true,
  "alert_frequency": "daily"
}
```

#### PUT /api/search/saved/{id}/
**Description**: Update saved search
**Body**:
```json
{
  "name": "Updated Search Name",
  "filters": {...},
  "alert_frequency": "weekly"
}
```

#### POST /api/search/saved/{id}/share/
**Description**: Share saved search with users or teams
**Body**:
```json
{
  "share_with_users": [5, 10, 15],
  "share_with_teams": [2, 3],
  "permission_level": "view",
  "message": "Sharing useful search for sprint planning"
}
```

#### POST /api/search/saved/{id}/execute/
**Description**: Execute a saved search
**Parameters**:
- `page`: Page number
- `size`: Results per page
- `override_filters`: JSON object to override saved filters

**Response**: Same format as main search endpoint

### Filter Management

#### GET /api/search/filters/
**Description**: Get available search filters and their configurations
**Response**:
```json
{
  "filters": [
    {
      "field_name": "status",
      "display_name": "Status",
      "field_type": "select",
      "description": "Filter by item status",
      "options": [
        {"value": "pending", "label": "Pending", "count": 25},
        {"value": "in_progress", "label": "In Progress", "count": 15},
        {"value": "completed", "label": "Completed", "count": 45}
      ],
      "default_operator": "equals",
      "available_operators": ["equals", "not_equals", "in", "not_in"]
    },
    {
      "field_name": "created_date",
      "display_name": "Created Date",
      "field_type": "date",
      "description": "Filter by creation date",
      "available_operators": ["equals", "before", "after", "between"],
      "input_type": "date_range"
    },
    {
      "field_name": "assigned_to",
      "display_name": "Assigned To",
      "field_type": "multi_select",
      "data_source": "users",
      "value_field": "id",
      "label_field": "display_name"
    }
  ],
  "popular_filters": ["status", "assigned_to", "priority"],
  "recent_filters": ["created_date", "project"]
}
```

#### GET /api/search/filters/{field}/values/
**Description**: Get possible values for a filter field
**Parameters**:
- `q`: Search within values
- `limit`: Maximum values to return

**Response**:
```json
{
  "values": [
    {
      "value": "john_doe",
      "label": "John Doe",
      "count": 15,
      "metadata": {
        "avatar_url": "/avatars/john_doe.jpg",
        "department": "Engineering"
      }
    }
  ],
  "total": 25
}
```

### Search Analytics & Insights

#### GET /api/search/analytics/popular/
**Description**: Get popular search queries and trends
**Parameters**:
- `period`: Time period (day, week, month)
- `limit`: Number of results

**Response**:
```json
{
  "popular_queries": [
    {
      "query": "bug fixes",
      "search_count": 45,
      "unique_users": 12,
      "avg_results": 8.5,
      "click_through_rate": 75.5
    }
  ],
  "trending_queries": [
    {
      "query": "mobile app features",
      "growth_rate": 150.0,
      "search_count": 25
    }
  ],
  "zero_result_queries": [
    {
      "query": "payment gateway integration",
      "search_count": 5,
      "suggestions": ["payment integration", "gateway setup"]
    }
  ]
}
```

#### GET /api/search/analytics/performance/
**Description**: Get search performance metrics
**Response**:
```json
{
  "metrics": {
    "avg_response_time_ms": 85,
    "p95_response_time_ms": 150,
    "total_searches": 1250,
    "unique_searchers": 45,
    "zero_result_rate": 8.5,
    "click_through_rate": 72.3
  },
  "trends": [
    {
      "date": "2025-08-20",
      "searches": 150,
      "avg_response_time": 90,
      "zero_results": 12
    }
  ]
}
```

### Search Index Management

#### POST /api/search/index/rebuild/
**Description**: Rebuild search index (admin only)
**Body**:
```json
{
  "content_types": ["feature", "project"],
  "force": false,
  "background": true
}
```

#### GET /api/search/index/status/
**Description**: Get search index status
**Response**:
```json
{
  "index_status": {
    "total_documents": 5432,
    "last_updated": "2025-08-21T10:30:00Z",
    "index_size_mb": 125.5,
    "health": "green"
  },
  "queue_status": {
    "pending_items": 15,
    "processing_items": 2,
    "failed_items": 0
  },
  "by_content_type": {
    "feature": {"count": 1200, "last_updated": "2025-08-21T10:25:00Z"},
    "project": {"count": 150, "last_updated": "2025-08-21T10:20:00Z"}
  }
}
```

## Controllers

### SearchViewSet
```python
class SearchViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """Main search endpoint"""
        query_params = {
            'q': request.query_params.get('q', ''),
            'content_types': request.query_params.getlist('content_types[]'),
            'filters': self._parse_filters(request.query_params.get('filters', '{}')),
            'facets': request.query_params.getlist('facets[]'),
            'sort': request.query_params.get('sort', 'relevance'),
            'order': request.query_params.get('order', 'desc'),
            'page': int(request.query_params.get('page', 1)),
            'size': min(int(request.query_params.get('size', 20)), 100),
            'highlight': request.query_params.get('highlight', 'true').lower() == 'true'
        }
        
        # Apply user permissions and access control
        query_params['user'] = request.user
        
        # Perform search
        search_results = SearchService.search(query_params)
        
        # Track analytics
        self._track_search_analytics(request, query_params, search_results)
        
        return Response(search_results)
    
    @action(detail=False, methods=['get'])
    def suggest(self, request):
        """Get search suggestions"""
        query = request.query_params.get('q', '')
        types = request.query_params.getlist('types[]')
        context = request.query_params.get('context', '')
        limit = int(request.query_params.get('limit', 10))
        
        suggestions = SearchService.get_suggestions(
            query=query,
            types=types,
            context=context,
            limit=limit,
            user=request.user
        )
        
        return Response(suggestions)
    
    @action(detail=False, methods=['post'])
    def analytics(self, request):
        """Track search analytics"""
        analytics_data = request.data.copy()
        analytics_data['user'] = request.user
        analytics_data['ip_address'] = self._get_client_ip(request)
        analytics_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')
        
        SearchAnalyticsService.track_search(analytics_data)
        
        return Response({'status': 'recorded'}, status=201)
    
    def _parse_filters(self, filters_json):
        """Parse and validate filter JSON"""
        try:
            filters = json.loads(filters_json)
            return SearchFilterValidator.validate_filters(filters)
        except (json.JSONDecodeError, ValidationError) as e:
            raise ValidationError(f"Invalid filters: {str(e)}")
    
    def _track_search_analytics(self, request, query_params, results):
        """Track search analytics asynchronously"""
        analytics_data = {
            'user': request.user,
            'query_text': query_params['q'],
            'filters_applied': query_params['filters'],
            'results_count': results.get('pagination', {}).get('total', 0),
            'response_time_ms': results.get('meta', {}).get('took_ms', 0),
            'session_id': request.session.session_key,
        }
        
        # Queue for background processing
        search_analytics_task.delay(analytics_data)
```

### SavedSearchViewSet
```python
class SavedSearchViewSet(viewsets.ModelViewSet):
    serializer_class = SavedSearchSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get user's saved searches plus shared ones"""
        user_searches = SavedSearch.objects.filter(user=self.request.user)
        
        if self.request.query_params.get('shared') == 'true':
            shared_searches = SavedSearch.objects.filter(
                savedsearchshare__shared_with_user=self.request.user
            )
            return user_searches.union(shared_searches)
        
        if self.request.query_params.get('public') == 'true':
            public_searches = SavedSearch.objects.filter(is_public=True)
            return user_searches.union(public_searches)
        
        return user_searches
    
    def perform_create(self, serializer):
        """Create saved search for current user"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """Share saved search with users or teams"""
        saved_search = self.get_object()
        
        # Check permissions
        if saved_search.user != request.user:
            raise PermissionDenied("Can only share your own searches")
        
        share_data = request.data
        shares_created = SavedSearchService.share_search(
            saved_search=saved_search,
            share_with_users=share_data.get('share_with_users', []),
            share_with_teams=share_data.get('share_with_teams', []),
            permission_level=share_data.get('permission_level', 'view'),
            shared_by=request.user,
            message=share_data.get('message', '')
        )
        
        return Response({
            'shares_created': shares_created,
            'message': 'Search shared successfully'
        })
    
    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        """Execute a saved search"""
        saved_search = self.get_object()
        
        # Build query parameters from saved search
        query_params = {
            'q': saved_search.query_text,
            'filters': saved_search.filters,
            'sort': saved_search.sort_config.get('field', 'relevance'),
            'order': saved_search.sort_config.get('order', 'desc'),
            'page': int(request.query_params.get('page', 1)),
            'size': int(request.query_params.get('size', saved_search.results_per_page)),
            'user': request.user
        }
        
        # Apply any override filters
        override_filters = request.query_params.get('override_filters')
        if override_filters:
            query_params['filters'].update(json.loads(override_filters))
        
        # Execute search
        search_results = SearchService.search(query_params)
        
        # Update usage statistics
        saved_search.usage_count += 1
        saved_search.last_used = timezone.now()
        saved_search.save(update_fields=['usage_count', 'last_used'])
        
        return Response(search_results)
```

### Search Service Layer
```python
class SearchService:
    @staticmethod
    def search(query_params):
        """Perform comprehensive search across all content"""
        start_time = time.time()
        
        # Parse query
        parsed_query = SearchQueryParser().parse(query_params['q'])
        
        # Get accessible content for user
        accessible_content = SearchService._get_accessible_content(query_params['user'])
        
        # Build Elasticsearch query
        es_query = SearchQueryBuilder.build_query(
            text_query=parsed_query['text_query'],
            filters={**parsed_query['filters'], **query_params['filters']},
            content_types=query_params.get('content_types', []),
            accessible_content=accessible_content,
            facets=query_params.get('facets', []),
            sort=query_params.get('sort', 'relevance'),
            order=query_params.get('order', 'desc')
        )
        
        # Execute search
        es_results = ElasticsearchService.search(es_query)
        
        # Format results
        formatted_results = SearchResultFormatter.format_results(
            es_results=es_results,
            highlight=query_params.get('highlight', True),
            user=query_params['user']
        )
        
        # Add performance metrics
        response_time = int((time.time() - start_time) * 1000)
        formatted_results['meta']['took_ms'] = response_time
        
        return formatted_results
    
    @staticmethod
    def get_suggestions(query, types=None, context=None, limit=10, user=None):
        """Get search suggestions and autocomplete"""
        suggestions = []
        
        # Get query suggestions
        if not types or 'query' in types:
            query_suggestions = SearchSuggestionService.get_query_suggestions(
                query, limit=limit//2, user=user
            )
            suggestions.extend(query_suggestions)
        
        # Get filter suggestions
        if not types or 'filter' in types:
            filter_suggestions = SearchSuggestionService.get_filter_suggestions(
                query, context=context, limit=limit//2
            )
            suggestions.extend(filter_suggestions)
        
        # Get popular searches
        popular_searches = SearchAnalyticsService.get_popular_searches(
            user=user, limit=5
        )
        
        return {
            'suggestions': suggestions[:limit],
            'popular_searches': popular_searches
        }
    
    @staticmethod
    def _get_accessible_content(user):
        """Get content IDs accessible by user"""
        # This would implement proper access control
        # based on user permissions and team membership
        accessible_projects = Project.objects.filter_for_user(user).values_list('id', flat=True)
        return {
            'project_ids': list(accessible_projects),
            'team_ids': list(user.teams.values_list('id', flat=True))
        }
```

### Real-time Search Updates
```python
# WebSocket consumer for real-time search updates
class SearchConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.search_group = f"search_user_{self.user.id}"
        
        await self.channel_layer.group_add(
            self.search_group,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.search_group,
            self.channel_name
        )
    
    async def search_update(self, event):
        """Send search-related updates to user"""
        await self.send(text_data=json.dumps({
            'type': 'search_update',
            'data': event['data']
        }))
```