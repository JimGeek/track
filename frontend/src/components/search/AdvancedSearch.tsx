import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FeatureListItem, ProjectListItem, User } from '../../services/api';
import apiService from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import { useResponsive } from '../../hooks/useResponsive';

interface SearchFilters {
  query: string;
  project: string;
  status: string;
  priority: string;
  assignee: string;
  reporter: string;
  dateCreatedStart: string;
  dateCreatedEnd: string;
  dueDateStart: string;
  dueDateEnd: string;
  isOverdue: boolean;
  isCompleted: boolean;
  hasSubFeatures: boolean;
  hasComments: boolean;
  hasAttachments: boolean;
  estimatedHoursMin: number | null;
  estimatedHoursMax: number | null;
}

interface AdvancedSearchProps {
  onResultsChange?: (results: FeatureListItem[]) => void;
  defaultFilters?: Partial<SearchFilters>;
  compact?: boolean;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = memo(({
  onResultsChange,
  defaultFilters = {},
  compact = false
}) => {
  const { isMobile, isTablet } = useResponsive();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    project: '',
    status: '',
    priority: '',
    assignee: '',
    reporter: '',
    dateCreatedStart: '',
    dateCreatedEnd: '',
    dueDateStart: '',
    dueDateEnd: '',
    isOverdue: false,
    isCompleted: false,
    hasSubFeatures: false,
    hasComments: false,
    hasAttachments: false,
    estimatedHoursMin: null,
    estimatedHoursMax: null,
    ...defaultFilters
  });

  const [searchResults, setSearchResults] = useState<FeatureListItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch data for filter options
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiService.getProjects(),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiService.getUsers(),
  });

  const projects = projectsData?.data?.results || [];
  const users = usersData?.data?.results || [];

  // Debounced filters
  const debouncedFilters = useDebounce(filters, 300);

  // Debounced search
  useEffect(() => {
    performSearch();
  }, [debouncedFilters]);

  const performSearch = async () => {
    setIsSearching(true);
    
    try {
      // Build search parameters
      const searchParams: any = {};
      
      if (debouncedFilters.query) searchParams.search = debouncedFilters.query;
      if (debouncedFilters.project) searchParams.project = debouncedFilters.project;
      if (debouncedFilters.status) searchParams.status = debouncedFilters.status;
      if (debouncedFilters.priority) searchParams.priority = debouncedFilters.priority;
      if (debouncedFilters.assignee) searchParams.assignee = debouncedFilters.assignee;
      if (debouncedFilters.reporter) searchParams.reporter = debouncedFilters.reporter;
      
      // Add ordering for better relevance
      if (debouncedFilters.query) {
        searchParams.ordering = '-created_at'; // Most recent first when searching
      }

      const response = await apiService.getFeatures(searchParams);
      let results = response.data.results;

      // Apply client-side filters that can't be handled by the API
      results = results.filter(feature => {
        // Date filters
        if (debouncedFilters.dateCreatedStart) {
          const createdDate = new Date(feature.created_at);
          const startDate = new Date(debouncedFilters.dateCreatedStart);
          if (createdDate < startDate) return false;
        }
        
        if (debouncedFilters.dateCreatedEnd) {
          const createdDate = new Date(feature.created_at);
          const endDate = new Date(debouncedFilters.dateCreatedEnd);
          endDate.setHours(23, 59, 59); // End of day
          if (createdDate > endDate) return false;
        }
        
        if (debouncedFilters.dueDateStart && feature.due_date) {
          const dueDate = new Date(feature.due_date);
          const startDate = new Date(debouncedFilters.dueDateStart);
          if (dueDate < startDate) return false;
        }
        
        if (debouncedFilters.dueDateEnd && feature.due_date) {
          const dueDate = new Date(feature.due_date);
          const endDate = new Date(debouncedFilters.dueDateEnd);
          if (dueDate > endDate) return false;
        }

        // Boolean filters
        if (debouncedFilters.isOverdue && !feature.is_overdue) return false;
        if (debouncedFilters.isCompleted && !feature.is_completed) return false;
        if (debouncedFilters.hasSubFeatures && feature.sub_features_count === 0) return false;
        if (debouncedFilters.hasComments && feature.comments_count === 0) return false;
        if (debouncedFilters.hasAttachments && feature.attachments_count === 0) return false;

        // Estimated hours range
        if (debouncedFilters.estimatedHoursMin !== null && (feature.estimated_hours || 0) < debouncedFilters.estimatedHoursMin) return false;
        if (debouncedFilters.estimatedHoursMax !== null && (feature.estimated_hours || 0) > debouncedFilters.estimatedHoursMax) return false;

        return true;
      });

      setSearchResults(results);
      onResultsChange?.(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      onResultsChange?.([]);
    } finally {
      setIsSearching(false);
    }
  };

  const updateFilter = useCallback((key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      query: '',
      project: '',
      status: '',
      priority: '',
      assignee: '',
      reporter: '',
      dateCreatedStart: '',
      dateCreatedEnd: '',
      dueDateStart: '',
      dueDateEnd: '',
      isOverdue: false,
      isCompleted: false,
      hasSubFeatures: false,
      hasComments: false,
      hasAttachments: false,
      estimatedHoursMin: null,
      estimatedHoursMax: null,
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'query') return false; // Query is not considered an "active filter"
      return value !== '' && value !== false && value !== null;
    });
  }, [filters]);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search features..."
            className={`block w-full pl-10 pr-12 ${isMobile ? 'py-2 text-sm' : 'py-3'} border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500`}
            value={filters.query}
            onChange={(e) => updateFilter('query', e.target.value)}
          />
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
            </div>
          )}
        </div>
        
        <div className={`mt-2 ${isMobile ? 'space-y-2' : 'flex items-center justify-between'}`}>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1"
          >
            <svg 
              className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Advanced Search
          </button>
          
          <div className={`flex items-center ${isMobile ? 'justify-between' : 'gap-4'} text-sm text-gray-500`}>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-primary-600 hover:text-primary-800"
              >
                Clear filters
              </button>
            )}
            <span>{searchResults.length} results</span>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className={`bg-gray-50 rounded-lg ${isMobile ? 'p-3' : 'p-4'} space-y-4`}>
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
            {/* Project Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
              <select
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                value={filters.project}
                onChange={(e) => updateFilter('project', e.target.value)}
              >
                <option value="">All Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="idea">Idea</option>
                <option value="specification">Specification</option>
                <option value="development">Development</option>
                <option value="testing">Testing</option>
                <option value="live">Live</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                value={filters.priority}
                onChange={(e) => updateFilter('priority', e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Assignee Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
              <select
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                value={filters.assignee}
                onChange={(e) => updateFilter('assignee', e.target.value)}
              >
                <option value="">All Assignees</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.first_name} {user.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reporter Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reporter</label>
              <select
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                value={filters.reporter}
                onChange={(e) => updateFilter('reporter', e.target.value)}
              >
                <option value="">All Reporters</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.first_name} {user.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Estimated Hours Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                  value={filters.estimatedHoursMin || ''}
                  onChange={(e) => updateFilter('estimatedHoursMin', e.target.value ? parseInt(e.target.value) : null)}
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                  value={filters.estimatedHoursMax || ''}
                  onChange={(e) => updateFilter('estimatedHoursMax', e.target.value ? parseInt(e.target.value) : null)}
                />
              </div>
            </div>
          </div>

          {/* Date Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Created Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                  value={filters.dateCreatedStart}
                  onChange={(e) => updateFilter('dateCreatedStart', e.target.value)}
                />
                <span className="flex items-center text-gray-500">to</span>
                <input
                  type="date"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                  value={filters.dateCreatedEnd}
                  onChange={(e) => updateFilter('dateCreatedEnd', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                  value={filters.dueDateStart}
                  onChange={(e) => updateFilter('dueDateStart', e.target.value)}
                />
                <span className="flex items-center text-gray-500">to</span>
                <input
                  type="date"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                  value={filters.dueDateEnd}
                  onChange={(e) => updateFilter('dueDateEnd', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Boolean Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Filters</label>
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'} gap-3`}>
              {[
                { key: 'isOverdue', label: 'Overdue' },
                { key: 'isCompleted', label: 'Completed' },
                { key: 'hasSubFeatures', label: 'Has Sub-features' },
                { key: 'hasComments', label: 'Has Comments' },
                { key: 'hasAttachments', label: 'Has Attachments' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={(filters as any)[key]}
                    onChange={(e) => updateFilter(key as keyof SearchFilters, e.target.checked)}
                  />
                  <span className="ml-2 text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

AdvancedSearch.displayName = 'AdvancedSearch';

export default AdvancedSearch;