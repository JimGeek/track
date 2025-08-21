import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import apiService, { FeatureListItem, CreateFeatureRequest, UpdateFeatureRequest, Feature } from '../services/api';
import FeatureForm from '../components/features/FeatureForm';
import FeatureCard from '../components/features/FeatureCard';
import FeatureDetailModal from '../components/features/FeatureDetailModal';
import FeatureGanttView from '../components/features/FeatureGanttView';

const Features: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [statusChangingFeature, setStatusChangingFeature] = useState<FeatureListItem | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'gantt'>('list');
  const [selectedFeature, setSelectedFeature] = useState<FeatureListItem | null>(null);
  const [creatingSubFeature, setCreatingSubFeature] = useState<string | null>(null);
  
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
    setSelectedFeature(feature);
  };

  const handleFeatureModalSave = (updatedFeature: Feature) => {
    queryClient.invalidateQueries({ queryKey: ['features'] });
    setSelectedFeature(null);
  };

  const handleFeatureModalDelete = (featureId: string) => {
    queryClient.invalidateQueries({ queryKey: ['features'] });
  };

  const handleCreateSubFeature = (parentId: string) => {
    setCreatingSubFeature(parentId);
    setSelectedFeature(null);
  };

  const handleSubFeatureSubmit = async (data: any) => {
    await createFeatureMutation.mutateAsync(data as CreateFeatureRequest);
    setCreatingSubFeature(null);
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
      <MainLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading features...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Error loading features</h2>
            <p className="text-gray-600">Please try refreshing the page.</p>
          </div>
        </div>
      </MainLayout>
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
    <MainLayout>
      <div className="space-y-4">
        {/* Compact Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Features ⚡</h1>
            <p className="text-gray-600 text-sm">Build and track individual features across your projects</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <span className="mr-2">✨</span>
            Create Feature
          </button>
        </div>

        {/* Compact Filters */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label htmlFor="search" className="block text-xs font-medium text-gray-700 mb-1">
                🔍 Search
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search features..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          
            <div>
              <label htmlFor="project" className="block text-xs font-medium text-gray-700 mb-1">
                📁 Project
              </label>
              <select
                id="project"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
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
              <label htmlFor="status" className="block text-xs font-medium text-gray-700 mb-1">
                🚦 Status
              </label>
              <select
                id="status"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
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
              <label htmlFor="priority" className="block text-xs font-medium text-gray-700 mb-1">
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
              <label htmlFor="parent" className="block text-xs font-medium text-gray-700 mb-1">
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
                className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              >
                🗑️ Clear
              </button>
            </div>
          </div>
        </div>

        {/* Features Content */}
        {features.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No features found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {Object.values(filters).some(v => v)
                ? 'Try adjusting your filters or create a new feature to get started.'
                : 'Start building amazing features. Create your first feature and bring your ideas to life.'}
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <span className="mr-2">🚀</span>
              Create Your First Feature
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="text-sm text-gray-600">
                {features.length} feature{features.length !== 1 ? 's' : ''} found
              </div>
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center px-3 py-1 rounded text-sm font-medium transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <span className="mr-1">📋</span>
                  List
                </button>
                <button
                  onClick={() => setViewMode('gantt')}
                  className={`flex items-center px-3 py-1 rounded text-sm font-medium transition-all duration-200 ${
                    viewMode === 'gantt'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <span className="mr-1">📈</span>
                  Gantt
                </button>
              </div>
            </div>
            <div className="p-4">
              {viewMode === 'list' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {features.map((feature) => (
                    <div key={feature.id} className="feature-card">
                      <FeatureCard
                        feature={feature}
                        onEdit={handleEditFeature}
                        onDelete={handleDeleteFeature}
                        onStatusChange={handleStatusChange}
                        onViewDetails={handleViewDetails}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <FeatureGanttView
                  features={features}
                  onFeatureClick={handleViewDetails}
                />
              )}
            </div>
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

      {/* Create Sub-Feature Form */}
      {creatingSubFeature && (
        <FeatureForm
          parentId={creatingSubFeature}
          onSubmit={handleSubFeatureSubmit}
          onCancel={() => setCreatingSubFeature(null)}
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

      {/* Feature Detail Modal */}
      <FeatureDetailModal
        feature={selectedFeature}
        isOpen={!!selectedFeature}
        onClose={() => setSelectedFeature(null)}
        onSave={handleFeatureModalSave}
        onDelete={handleFeatureModalDelete}
        onCreateSubFeature={handleCreateSubFeature}
      />
    </MainLayout>
  );
};

export default Features;