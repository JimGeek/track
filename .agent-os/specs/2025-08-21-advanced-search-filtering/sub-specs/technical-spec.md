# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-21-advanced-search-filtering/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Technical Requirements

### Frontend Architecture
- **Search UI**: React components with real-time search and autocomplete
- **Filter Builder**: Dynamic filter interface with drag-and-drop condition building
- **Search Results**: Infinite scroll with highlighting and faceted navigation
- **State Management**: Redux for complex search state and filter persistence
- **Debouncing**: Optimized search input handling to reduce API calls

### Backend Architecture
- **Search Engine**: Elasticsearch integration for full-text search and faceting
- **Query Parser**: Advanced query parsing with natural language support
- **Indexing Service**: Real-time content indexing with background processing
- **Caching Layer**: Redis for search result caching and autocomplete suggestions
- **Analytics Engine**: Search analytics and usage pattern tracking

### Performance Requirements
- **Search Speed**: Sub-200ms response time for search queries
- **Indexing**: Real-time indexing with under 5-second delay
- **Scalability**: Support for 100k+ documents with efficient faceting
- **Autocomplete**: Sub-100ms response for suggestion queries
- **Concurrent Users**: Handle 50+ simultaneous search operations

## Approach

### Search Data Models
```python
class SearchableContent(models.Model):
    """Abstract base model for searchable content"""
    content_type = models.CharField(max_length=50)
    object_id = models.PositiveIntegerField()
    title = models.CharField(max_length=500)
    content = models.TextField()
    tags = models.JSONField(default=list)
    metadata = models.JSONField(default=dict)
    
    # Search optimization fields
    search_vector = SearchVectorField()
    popularity_score = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    last_accessed = models.DateTimeField(auto_now=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True
        indexes = [
            GinIndex(fields=['search_vector']),
            models.Index(fields=['content_type', 'popularity_score']),
        ]

class SavedSearch(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_searches')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Search configuration
    query_text = models.TextField()
    filters = models.JSONField(default=dict)
    sort_config = models.JSONField(default=dict)
    
    # Sharing and collaboration
    is_shared = models.BooleanField(default=False)
    shared_with_users = models.ManyToManyField(User, blank=True, related_name='accessible_searches')
    shared_with_teams = models.ManyToManyField('teams.Team', blank=True)
    
    # Usage tracking
    usage_count = models.PositiveIntegerField(default=0)
    last_used = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class SearchAnalytics(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='search_analytics')
    query_text = models.TextField()
    filters_applied = models.JSONField(default=dict)
    results_count = models.PositiveIntegerField()
    response_time_ms = models.PositiveIntegerField()
    clicked_results = models.JSONField(default=list)
    
    session_id = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)
```

### React Search Components
```javascript
// Main search interface
const AdvancedSearch = () => {
  const [searchState, dispatch] = useReducer(searchReducer, initialSearchState);
  const [searchResults, setSearchResults] = useState([]);
  const [facets, setFacets] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const debouncedSearch = useCallback(
    debounce((query, filters) => {
      performSearch(query, filters);
    }, 300),
    []
  );
  
  const performSearch = async (query, filters) => {
    setIsLoading(true);
    try {
      const response = await searchAPI.search({
        q: query,
        filters: filters,
        facets: ['content_type', 'status', 'assigned_to', 'created_date'],
        page: searchState.currentPage,
        size: 20
      });
      
      setSearchResults(response.results);
      setFacets(response.facets);
      
      // Track search analytics
      searchAPI.trackSearch({
        query,
        filters,
        results_count: response.total,
        response_time: response.took
      });
      
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <SearchContainer>
      <SearchInput
        value={searchState.query}
        onChange={(query) => {
          dispatch({ type: 'UPDATE_QUERY', payload: query });
          debouncedSearch(query, searchState.filters);
        }}
        placeholder="Search features, projects, and more..."
        autoComplete={true}
      />
      
      <FilterBuilder
        filters={searchState.filters}
        facets={facets}
        onChange={(filters) => {
          dispatch({ type: 'UPDATE_FILTERS', payload: filters });
          performSearch(searchState.query, filters);
        }}
      />
      
      <SearchResults
        results={searchResults}
        query={searchState.query}
        isLoading={isLoading}
        onResultClick={handleResultClick}
      />
      
      <SavedSearchPanel
        savedSearches={searchState.savedSearches}
        onSaveSearch={handleSaveSearch}
        onLoadSearch={handleLoadSearch}
      />
    </SearchContainer>
  );
};

// Advanced filter builder component
const FilterBuilder = ({ filters, facets, onChange }) => {
  const [filterGroups, setFilterGroups] = useState([]);
  
  const addFilterGroup = () => {
    const newGroup = {
      id: uuidv4(),
      logic: 'AND',
      conditions: [createEmptyCondition()]
    };
    setFilterGroups([...filterGroups, newGroup]);
  };
  
  const updateFilterGroup = (groupId, updates) => {
    setFilterGroups(groups =>
      groups.map(group =>
        group.id === groupId ? { ...group, ...updates } : group
      )
    );
    
    // Convert filter groups to search format
    const searchFilters = convertToSearchFilters(filterGroups);
    onChange(searchFilters);
  };
  
  return (
    <FilterContainer>
      <FilterToolbar>
        <Button onClick={addFilterGroup}>Add Filter Group</Button>
        <FilterPresets facets={facets} onApplyPreset={handlePresetApply} />
      </FilterToolbar>
      
      {filterGroups.map(group => (
        <FilterGroup
          key={group.id}
          group={group}
          facets={facets}
          onUpdate={(updates) => updateFilterGroup(group.id, updates)}
          onRemove={() => removeFilterGroup(group.id)}
        />
      ))}
      
      <FilterSummary filters={filters} onClearAll={handleClearAll} />
    </FilterContainer>
  );
};
```

### Elasticsearch Integration
```python
from elasticsearch_dsl import Document, Text, Keyword, Date, Integer, analyzer

# Elasticsearch document definitions
custom_analyzer = analyzer('custom_analyzer',
    tokenizer='standard',
    filter=['lowercase', 'stop', 'snowball']
)

class FeatureDocument(Document):
    title = Text(analyzer=custom_analyzer, fields={'raw': Keyword()})
    description = Text(analyzer=custom_analyzer)
    content = Text(analyzer=custom_analyzer)
    status = Keyword()
    priority = Keyword()
    tags = Keyword(multi=True)
    
    project_id = Integer()
    project_title = Text(analyzer=custom_analyzer)
    assigned_to = Keyword(multi=True)
    created_by = Keyword()
    
    created_at = Date()
    updated_at = Date()
    deadline = Date()
    
    # Computed fields for ranking
    popularity_score = Integer()
    interaction_count = Integer()
    
    class Index:
        name = 'features'
        settings = {
            'number_of_shards': 2,
            'number_of_replicas': 1
        }

class SearchService:
    def __init__(self):
        self.es = Elasticsearch([settings.ELASTICSEARCH_URL])
    
    def index_feature(self, feature):
        """Index a feature for search"""
        doc = FeatureDocument(
            meta={'id': feature.id},
            title=feature.title,
            description=feature.description,
            content=self._extract_searchable_content(feature),
            status=feature.status,
            priority=feature.priority,
            tags=list(feature.tags.values_list('name', flat=True)),
            project_id=feature.project.id,
            project_title=feature.project.title,
            assigned_to=[u.username for u in feature.assigned_to.all()],
            created_by=feature.created_by.username,
            created_at=feature.created_at,
            updated_at=feature.updated_at,
            deadline=feature.deadline,
            popularity_score=self._calculate_popularity_score(feature),
            interaction_count=feature.comments.count()
        )
        
        return doc.save()
    
    def search(self, query_params):
        """Perform advanced search with filters and facets"""
        search = FeatureDocument.search()
        
        # Apply text query
        if query_params.get('q'):
            search = search.query('multi_match', 
                query=query_params['q'],
                fields=['title^3', 'description^2', 'content'],
                type='best_fields',
                fuzziness='AUTO'
            )
        
        # Apply filters
        filters = query_params.get('filters', {})
        for field, value in filters.items():
            if isinstance(value, list):
                search = search.filter('terms', **{field: value})
            elif isinstance(value, dict) and 'range' in value:
                search = search.filter('range', **{field: value['range']})
            else:
                search = search.filter('term', **{field: value})
        
        # Add facets
        facets = query_params.get('facets', [])
        for facet in facets:
            search.aggs.bucket(facet, 'terms', field=facet, size=50)
        
        # Apply sorting
        sort_field = query_params.get('sort', '_score')
        sort_order = query_params.get('order', 'desc')
        search = search.sort({sort_field: {'order': sort_order}})
        
        # Pagination
        page = query_params.get('page', 1)
        size = query_params.get('size', 20)
        search = search[(page-1)*size:page*size]
        
        # Add highlighting
        search = search.highlight('title', 'description', 'content')
        
        return search.execute()
    
    def suggest(self, query, size=10):
        """Get search suggestions"""
        search = FeatureDocument.search()
        
        # Use completion suggester
        search = search.suggest(
            'title_suggest', query,
            completion={'field': 'title.suggest', 'size': size}
        )
        
        return search.execute()
    
    def _calculate_popularity_score(self, feature):
        """Calculate popularity score for ranking"""
        score = 0
        score += feature.comments.count() * 2
        score += feature.interactions.count()
        score += min(feature.views, 1000) / 100  # Cap views impact
        
        # Boost recent activity
        days_since_update = (timezone.now() - feature.updated_at).days
        if days_since_update < 7:
            score *= 1.5
        elif days_since_update < 30:
            score *= 1.2
        
        return score
```

### Search Query Parser
```python
class SearchQueryParser:
    """Parse natural language search queries into structured filters"""
    
    FIELD_MAPPINGS = {
        'status': ['status', 'state'],
        'priority': ['priority', 'importance'],
        'assignee': ['assigned', 'assignee', 'owner'],
        'project': ['project', 'in'],
        'created': ['created', 'added'],
        'updated': ['updated', 'modified'],
        'tag': ['tag', 'tagged', 'label']
    }
    
    def parse(self, query_text):
        """Parse query text into structured search parameters"""
        parsed = {
            'text_query': '',
            'filters': {},
            'date_filters': {}
        }
        
        # Extract field-specific queries (e.g., "status:completed")
        field_pattern = r'(\w+):([^\s]+)'
        field_matches = re.findall(field_pattern, query_text)
        
        for field, value in field_matches:
            mapped_field = self._map_field(field)
            if mapped_field:
                parsed['filters'][mapped_field] = self._parse_value(value)
                # Remove from main query
                query_text = re.sub(f'{field}:{value}', '', query_text)
        
        # Extract date ranges (e.g., "created:last week")
        date_pattern = r'(\w+):(last\s+\w+|this\s+\w+|\d{4}-\d{2}-\d{2})'
        date_matches = re.findall(date_pattern, query_text)
        
        for field, date_expr in date_matches:
            mapped_field = self._map_field(field)
            if mapped_field:
                date_range = self._parse_date_expression(date_expr)
                if date_range:
                    parsed['date_filters'][mapped_field] = date_range
                    # Remove from main query
                    query_text = re.sub(f'{field}:{date_expr}', '', query_text)
        
        # Remaining text becomes the main search query
        parsed['text_query'] = query_text.strip()
        
        return parsed
    
    def _map_field(self, field):
        """Map user-friendly field names to database fields"""
        field_lower = field.lower()
        for db_field, aliases in self.FIELD_MAPPINGS.items():
            if field_lower in aliases:
                return db_field
        return None
    
    def _parse_date_expression(self, expr):
        """Parse natural language date expressions"""
        now = timezone.now()
        
        if expr == 'today':
            return {'gte': now.replace(hour=0, minute=0, second=0)}
        elif expr == 'yesterday':
            yesterday = now - timedelta(days=1)
            return {
                'gte': yesterday.replace(hour=0, minute=0, second=0),
                'lt': now.replace(hour=0, minute=0, second=0)
            }
        elif 'last week' in expr:
            week_ago = now - timedelta(days=7)
            return {'gte': week_ago}
        elif 'last month' in expr:
            month_ago = now - timedelta(days=30)
            return {'gte': month_ago}
        
        # Try to parse explicit dates
        try:
            parsed_date = datetime.strptime(expr, '%Y-%m-%d')
            return {'gte': parsed_date, 'lt': parsed_date + timedelta(days=1)}
        except ValueError:
            pass
        
        return None
```

## External Dependencies

- **Elasticsearch**: Full-text search engine with advanced querying capabilities
- **Redis**: Caching for search results and autocomplete suggestions
- **React Virtualized**: Efficient rendering of large search result sets
- **Fuse.js**: Client-side fuzzy search for autocomplete fallbacks
- **React Hook Form**: Form handling for complex filter interfaces
- **Lodash**: Utility functions for debouncing and data manipulation