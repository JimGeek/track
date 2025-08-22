import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Project, FeatureListItem, CreateFeatureRequest } from '../services/api';
import { apiService } from '../services/api';
import { enhanceFeaturesWithAggregatedProgress } from '../utils/featureProgress';
import MainLayout from '../components/layout/MainLayout';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ProjectOverview from '../components/projects/ProjectOverview';
import FeatureCard from '../components/features/FeatureCard';
import FeatureDetailModal from '../components/features/FeatureDetailModal';
import FeatureForm from '../components/features/FeatureForm';
import FeatureKanbanView from '../components/features/FeatureKanbanView';
import FeatureGanttView from '../components/features/FeatureGanttView';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader } from '../components/ui/card';

type ViewMode = 'list' | 'kanban' | 'gantt';

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  
  const [project, setProject] = useState<Project | null>(null);
  const [features, setFeatures] = useState<FeatureListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [detailModalFeature, setDetailModalFeature] = useState<FeatureListItem | null>(null);
  const [activeTab, setActiveTab] = useState<'features' | 'overview' | 'team' | 'settings'>('features');
  const [creatingSubFeature, setCreatingSubFeature] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    const fetchProjectData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const [projectResponse, featuresResponse] = await Promise.all([
          apiService.getProject(id),
          apiService.getFeatures({ project: id }) // Fetch all features for hierarchy support
        ]);
        
        setProject(projectResponse.data);
        setFeatures(featuresResponse.data.results);
      } catch (err: any) {
        console.error('Error fetching project data:', err);
        setError(err.message || 'Failed to load project data');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [id]);

  const projectMetrics = useMemo(() => {
    if (!features.length) return null;

    // Only count root features for project metrics, not sub-features
    const rootFeatures = features.filter(f => !f.parent);
    const totalFeatures = rootFeatures.length;
    const completedFeatures = rootFeatures.filter(f => f.status === 'live').length;
    const inProgressFeatures = rootFeatures.filter(f => ['development', 'testing'].includes(f.status)).length;
    const overdueFeatures = rootFeatures.filter(f => f.is_overdue).length;
    
    const totalEstimatedHours = rootFeatures.reduce((sum, f) => sum + (f.estimated_hours || 0), 0);
    const totalActualHours = rootFeatures.reduce((sum, f) => sum + (f.actual_hours || 0), 0);
    
    const progressPercentage = totalFeatures > 0 ? Math.round((completedFeatures / totalFeatures) * 100) : 0;

    return {
      totalFeatures,
      completedFeatures,
      inProgressFeatures,
      overdueFeatures,
      totalEstimatedHours,
      totalActualHours,
      progressPercentage
    };
  }, [features]);

  // Enhance features with aggregated progress for parent features
  const featuresWithAggregatedProgress = useMemo(() => {
    return enhanceFeaturesWithAggregatedProgress(features);
  }, [features]);

  // Filter to show only root features (no parent) for list/kanban views
  const rootFeaturesWithAggregatedProgress = useMemo(() => {
    // Exclude sub-features - only show features without a parent (hierarchy_level 0)
    const rootFeatures = featuresWithAggregatedProgress.filter(feature => {
      const hasNoParent = !feature.parent || feature.parent === null || feature.parent === "" || feature.parent === "undefined";
      const isRootLevel = feature.hierarchy_level === 0;
      return hasNoParent && isRootLevel;
    });
    
    return rootFeatures;
  }, [featuresWithAggregatedProgress]);

  // Create feature mutation for sub-features
  const createFeatureMutation = useMutation({
    mutationFn: (data: CreateFeatureRequest) => apiService.createFeature(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
      // Refetch project data to update features list
      if (id) {
        apiService.getFeatures({ project: id }).then((response) => {
          setFeatures(response.data.results);
        });
      }
      setShowCreateForm(false);
      setCreatingSubFeature(null);
    },
  });

  const handleCreateSubFeatureFromModal = (parentId: string) => {
    setCreatingSubFeature(parentId);
    setDetailModalFeature(null);
  };

  const handleCreateFeature = async (data: any) => {
    await createFeatureMutation.mutateAsync(data as CreateFeatureRequest);
  };

  const handleSubFeatureSubmit = async (data: any) => {
    await createFeatureMutation.mutateAsync(data as CreateFeatureRequest);
    setCreatingSubFeature(null);
  };

  const handleFeatureEdit = (feature: FeatureListItem) => {
    setDetailModalFeature(feature);
  };

  const handleFeatureDelete = async (feature: FeatureListItem) => {
    if (window.confirm(`Are you sure you want to delete "${feature.title}"?`)) {
      try {
        await apiService.deleteFeature(feature.id);
        setFeatures(features.filter(f => f.id !== feature.id));
      } catch (err: any) {
        console.error('Error deleting feature:', err);
        alert('Failed to delete feature');
      }
    }
  };

  const handleFeatureStatusChange = async (feature: FeatureListItem) => {
    try {
      await apiService.updateFeature(feature.id, {
        status: feature.status === 'live' ? 'idea' : 'live'
      });
      // Refetch features to get updated data
      const updatedFeatures = await apiService.getFeatures({ project: id });
      setFeatures(updatedFeatures.data.results);
    } catch (err: any) {
      console.error('Error updating feature status:', err);
      alert('Failed to update feature status');
    }
  };

  const handleFeatureViewDetails = (feature: FeatureListItem) => {
    setDetailModalFeature(feature);
  };

  const handleFeatureModalSave = (updatedFeature: any) => {
    // Refetch features to get updated data
    apiService.getFeatures({ project: id }).then((response) => {
      setFeatures(response.data.results);
    });
    setDetailModalFeature(null);
  };

  const handleFeatureModalDelete = async (featureId: string) => {
    try {
      await apiService.deleteFeature(featureId);
      setFeatures(features.filter(f => f.id !== featureId));
    } catch (err: any) {
      console.error('Error deleting feature:', err);
      alert('Failed to delete feature');
    }
  };

  const getViewModeIcon = (mode: ViewMode) => {
    switch (mode) {
      case 'list':
        return '📋';
      case 'kanban':
        return '📊';
      case 'gantt':
        return '📈';
      default:
        return '📋';
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  if (error || !project) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">😞</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Project Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The project you\'re looking for doesn\'t exist.'}</p>
            <Button asChild>
              <Link to="/projects">
                ← Back to Projects
              </Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Compact Project Header */}
        <Card>
          <CardHeader className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Breadcrumb */}
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Link to="/projects" className="hover:text-accent-600 transition-colors duration-200">
                    Projects
                  </Link>
                  <span>›</span>
                  <span className="text-gray-800 font-medium">{project.name}</span>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowCreateForm(true)}>
                  <span className="mr-1">✨</span>
                  Add Feature
                </Button>
                <Button variant="outline" size="sm">
                  <span className="mr-1">✏️</span>
                  Edit
                </Button>
              </div>
            </div>
            
            {/* Project Title & Status */}
            <div className="mt-4">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                {projectMetrics && (
                  <Badge variant="secondary" className="bg-success-100 text-success-800">
                    {projectMetrics.progressPercentage}% Complete
                  </Badge>
                )}
              </div>
              
              {/* Quick Stats */}
              {projectMetrics && (
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>⚡</span>
                    <span>{projectMetrics.totalFeatures} features</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>✅</span>
                    <span>{projectMetrics.completedFeatures} done</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🔥</span>
                    <span>{projectMetrics.inProgressFeatures} active</span>
                  </div>
                  {projectMetrics.overdueFeatures > 0 && (
                    <div className="flex items-center gap-2 text-danger-600">
                      <span>⏰</span>
                      <span>{projectMetrics.overdueFeatures} overdue</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardHeader>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            {[
              { key: 'features', label: 'Features', icon: '⚡', count: features.filter(f => !f.parent).length },
              { key: 'overview', label: 'Overview', icon: '📊' },
              { key: 'team', label: 'Team', icon: '👥' },
              { key: 'settings', label: 'Settings', icon: '⚙️' }
            ].map((tab) => (
              <Button
                key={tab.key}
                variant="ghost"
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 rounded-none transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'border-primary-500 text-primary-600 bg-primary-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                {tab.count !== undefined && (
                  <Badge 
                    variant="secondary" 
                    className={`ml-2 ${
                      activeTab === tab.key ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tab.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </Card>

        {/* Tab Content */}
        <Card>
          {activeTab === 'features' && (
            <>
              <CardHeader className="p-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Features & Tasks</h2>
                    <p className="text-gray-600 text-sm">Manage and track project features across different views</p>
                  </div>
                  
                  {/* View Mode Switcher */}
                  <div className="flex items-center space-x-1 bg-gray-100 rounded-xl p-1">
                    {(['list', 'kanban', 'gantt'] as ViewMode[]).map((mode) => (
                      <Button
                        key={mode}
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode(mode)}
                        className={`flex items-center px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                          viewMode === mode
                            ? 'bg-white text-primary-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-white/60'
                        }`}
                      >
                        <span className="mr-1">{getViewModeIcon(mode)}</span>
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4">
                {features.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">🎯</div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">No Features Yet</h3>
                    <p className="text-gray-600 mb-6 text-sm">Start by creating your first feature for this project.</p>
                    <Button onClick={() => setShowCreateForm(true)}>
                      <span className="mr-2">✨</span>
                      Create Feature
                    </Button>
                  </div>
                ) : (
                  <>
                    {viewMode === 'list' && (
                      <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                          {rootFeaturesWithAggregatedProgress.map((feature) => (
                            <div key={feature.id} className="feature-card">
                              <FeatureCard
                                feature={feature}
                                onEdit={handleFeatureEdit}
                                onDelete={handleFeatureDelete}
                                onStatusChange={handleFeatureStatusChange}
                                onViewDetails={handleFeatureViewDetails}
                                showHierarchy={false}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    
                    {viewMode === 'kanban' && (
                      <div className="max-h-[60vh] overflow-x-auto overflow-y-hidden">
                        <FeatureKanbanView
                          features={rootFeaturesWithAggregatedProgress}
                          onEdit={handleFeatureEdit}
                          onDelete={handleFeatureDelete}
                          onStatusChange={handleFeatureStatusChange}
                          onViewDetails={handleFeatureViewDetails}
                        />
                      </div>
                    )}
                    
                    {viewMode === 'gantt' && (
                      <div className="max-h-[60vh] overflow-auto">
                        <FeatureGanttView
                          features={featuresWithAggregatedProgress}
                          projectId={project.id}
                          onFeatureClick={handleFeatureViewDetails}
                        />
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </>
          )}

          {activeTab === 'overview' && projectMetrics && (
            <CardContent className="p-6">
              <ProjectOverview project={project} metrics={projectMetrics} />
            </CardContent>
          )}

          {activeTab === 'team' && (
            <CardContent className="p-6">
              <div className="text-center py-12">
                <div className="text-5xl mb-4">👥</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Team Management</h3>
                <p className="text-gray-600 text-sm">Team management features coming soon.</p>
              </div>
            </CardContent>
          )}

          {activeTab === 'settings' && (
            <CardContent className="p-6">
              <div className="text-center py-12">
                <div className="text-5xl mb-4">⚙️</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Project Settings</h3>
                <p className="text-gray-600 text-sm">Project settings and configuration options coming soon.</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Feature Detail Modal */}
      <FeatureDetailModal
        feature={detailModalFeature}
        isOpen={!!detailModalFeature}
        onClose={() => setDetailModalFeature(null)}
        onSave={handleFeatureModalSave}
        onDelete={handleFeatureModalDelete}
        onCreateSubFeature={handleCreateSubFeatureFromModal}
      />

      {/* Create Feature Form */}
      {showCreateForm && (
        <FeatureForm
          projectId={id}
          projectName={project?.name}
          onSubmit={handleCreateFeature}
          onCancel={() => setShowCreateForm(false)}
          isSubmitting={createFeatureMutation.isPending}
        />
      )}

      {/* Create Sub-Feature Form */}
      {creatingSubFeature && (() => {
        const parentFeature = features.find(f => f.id === creatingSubFeature);
        return (
          <FeatureForm
            projectId={id}
            projectName={project?.name}
            parentId={creatingSubFeature}
            parentName={parentFeature?.title}
            onSubmit={handleSubFeatureSubmit}
            onCancel={() => setCreatingSubFeature(null)}
            isSubmitting={createFeatureMutation.isPending}
          />
        );
      })()}
    </MainLayout>
  );
};

export default ProjectDetails;