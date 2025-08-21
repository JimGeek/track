import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import apiService, { FeatureListItem, CreateFeatureRequest, UpdateFeatureRequest, Feature } from '../services/api';
import FeatureCard from '../components/features/FeatureCard';
import FeatureForm from '../components/features/FeatureForm';

const Features: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [statusChangingFeature, setStatusChangingFeature] = useState<FeatureListItem | null>(null);
  
  const [filters, setFilters] = useState({
    project: searchParams.get('project') || '',
    parent: searchParams.get('parent') || '',
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    search: searchParams.get('search') || '',
    assignee: searchParams.get('assignee') || '',
  });
  
  const queryClient = useQueryClient();

  // Fetch features with filters
  const { data: featuresData, isLoading, error } = useQuery({
    queryKey: ['features', filters],
    queryFn: () => apiService.getFeatures(filters),
  });

  // Fetch projects for filter dropdown
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiService.getProjects(),
  });

  const features = featuresData?.data?.results || [];
  const projects = projectsData?.data?.results || [];

  // Create feature mutation
  const createFeatureMutation = useMutation({
    mutationFn: (data: CreateFeatureRequest) => apiService.createFeature(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      setShowCreateForm(false);
    },
  });

  // Update feature mutation
  const updateFeatureMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFeatureRequest }) => 
      apiService.updateFeature(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      setEditingFeature(null);
    },
  });

  // Delete feature mutation
  const deleteFeatureMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteFeature(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
    },
  });

  // Status change mutations
  const advanceStatusMutation = useMutation({
    mutationFn: (id: string) => apiService.advanceFeatureStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      setStatusChangingFeature(null);
    },
  });

  const revertStatusMutation = useMutation({
    mutationFn: (id: string) => apiService.revertFeatureStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      setStatusChangingFeature(null);
    },
  });

  const setStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      apiService.setFeatureStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      setStatusChangingFeature(null);
    },
  });

  const handleCreateFeature = async (data: any) => {
    await createFeatureMutation.mutateAsync(data as CreateFeatureRequest);
  };

  const handleUpdateFeature = async (data: any) => {
    if (editingFeature) {
      await updateFeatureMutation.mutateAsync({ 
        id: editingFeature.id, 
        data: data as UpdateFeatureRequest
      });
    }
  };

  const handleEditFeature = (feature: FeatureListItem) => {
    // Fetch full feature details for editing
    apiService.getFeature(feature.id).then(response => {
      setEditingFeature(response.data);
    });
  };

  const handleDeleteFeature = async (feature: FeatureListItem) => {
    if (window.confirm('Are you sure you want to delete this feature? This action cannot be undone.')) {
      await deleteFeatureMutation.mutateAsync(feature.id);
    }
  };

  const handleStatusChange = (feature: FeatureListItem) => {
    setStatusChangingFeature(feature);
  };

  const handleAdvanceStatus = async () => {
    if (statusChangingFeature) {
      await advanceStatusMutation.mutateAsync(statusChangingFeature.id);
    }
  };

  const handleRevertStatus = async () => {
    if (statusChangingFeature) {
      await revertStatusMutation.mutateAsync(statusChangingFeature.id);
    }
  };

  const handleSetStatus = async (status: string) => {
    if (statusChangingFeature) {
      await setStatusMutation.mutateAsync({ id: statusChangingFeature.id, status });
    }
  };

  const handleViewDetails = (feature: FeatureListItem) => {
    // Navigate to feature details page (to be implemented)
    console.log('View details for feature:', feature.id);
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL search params
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  };

  const clearFilters = () => {
    const newFilters = {
      project: '',
      parent: '',
      status: '',
      priority: '',
      search: '',
      assignee: '',
    };
    setFilters(newFilters);
    setSearchParams(new URLSearchParams());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Error loading features</h2>
          <p className="text-gray-600">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const statusOptions = [
    { value: 'idea', label: 'Idea' },
    { value: 'specification', label: 'Specification' },
    { value: 'development', label: 'Development' },
    { value: 'testing', label: 'Testing' },
    { value: 'live', label: 'Live' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Features</h1>
              <nav className="flex space-x-4 mt-2">
                <Link
                  to="/dashboard"
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/projects"
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                  Projects
                </Link>
                <span className="text-gray-900 text-sm font-medium">Features</span>
              </nav>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium"
            >
              Create Feature
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search features..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">
                Project
              </label>
              <select
                id="project"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                value={filters.project}
                onChange={(e) => handleFilterChange('project', e.target.value)}
              >
                <option value="">All Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                id="priority"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label htmlFor="parent" className="block text-sm font-medium text-gray-700 mb-1">
                Level
              </label>
              <select
                id="parent"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                value={filters.parent}
                onChange={(e) => handleFilterChange('parent', e.target.value)}
              >
                <option value="">All Levels</option>
                <option value="null">Root Features Only</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Features List */}
        {features.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No features found</h3>
            <p className="text-gray-600 mb-6">
              {Object.values(filters).some(v => v)
                ? 'Try adjusting your filters or create a new feature.'
                : 'Get started by creating your first feature.'}
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md font-medium"
            >
              Create Your First Feature
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {features.map((feature) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                onEdit={handleEditFeature}
                onDelete={handleDeleteFeature}
                onStatusChange={handleStatusChange}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Feature Form */}
      {showCreateForm && (
        <FeatureForm
          projectId={filters.project}
          onSubmit={handleCreateFeature}
          onCancel={() => setShowCreateForm(false)}
          isSubmitting={createFeatureMutation.isPending}
        />
      )}

      {/* Edit Feature Form */}
      {editingFeature && (
        <FeatureForm
          feature={editingFeature}
          onSubmit={handleUpdateFeature}
          onCancel={() => setEditingFeature(null)}
          isSubmitting={updateFeatureMutation.isPending}
        />
      )}

      {/* Status Change Modal */}
      {statusChangingFeature && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Change Status</h3>
              <p className="text-sm text-gray-600 mt-1">{statusChangingFeature.title}</p>
            </div>

            <div className="px-6 py-4">
              <div className="mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  Current Status: <span className="font-medium capitalize">{statusChangingFeature.status}</span>
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={handleRevertStatus}
                    disabled={revertStatusMutation.isPending}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={handleAdvanceStatus}
                    disabled={advanceStatusMutation.isPending}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    Next →
                  </button>
                </div>

                <div className="border-t pt-3">
                  <p className="text-sm text-gray-700 mb-2">Or set specific status:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {statusOptions.map((status) => (
                      <button
                        key={status.value}
                        onClick={() => handleSetStatus(status.value)}
                        disabled={setStatusMutation.isPending || status.value === statusChangingFeature.status}
                        className={`px-3 py-2 text-xs font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 ${
                          status.value === statusChangingFeature.status
                            ? 'bg-primary-100 text-primary-800 border-primary-300 cursor-not-allowed'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setStatusChangingFeature(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Features;