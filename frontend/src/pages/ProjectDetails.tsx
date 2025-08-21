import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Project, FeatureListItem } from '../services/api';
import { apiService } from '../services/api';
import { useResponsive } from '../hooks/useResponsive';
import MainLayout from '../components/layout/MainLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ProjectHeader from '../components/projects/ProjectHeader';
import ProjectOverview from '../components/projects/ProjectOverview';
import FeatureCard from '../components/features/FeatureCard';
import FeatureDetailModal from '../components/features/FeatureDetailModal';
import ShrinkingScrollContainer from '../components/common/ShrinkingScrollContainer';
import FeatureKanbanView from '../components/features/FeatureKanbanView';
import FeatureGanttView from '../components/features/FeatureGanttView';

type ViewMode = 'list' | 'kanban' | 'gantt';

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  
  const [project, setProject] = useState<Project | null>(null);
  const [features, setFeatures] = useState<FeatureListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedFeature, setSelectedFeature] = useState<FeatureListItem | null>(null);
  const [detailModalFeature, setDetailModalFeature] = useState<FeatureListItem | null>(null);
  const [activeTab, setActiveTab] = useState<'features' | 'overview' | 'team' | 'settings'>('features');

  useEffect(() => {
    const fetchProjectData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const [projectResponse, featuresResponse] = await Promise.all([
          apiService.getProject(id),
          apiService.getFeatures({ project: id })
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

    const totalFeatures = features.length;
    const completedFeatures = features.filter(f => f.status === 'live').length;
    const inProgressFeatures = features.filter(f => ['development', 'testing'].includes(f.status)).length;
    const overdueFeatures = features.filter(f => f.is_overdue).length;
    
    const totalEstimatedHours = features.reduce((sum, f) => sum + (f.estimated_hours || 0), 0);
    const totalActualHours = features.reduce((sum, f) => sum + (f.actual_hours || 0), 0);
    
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

  const handleFeatureEdit = (feature: FeatureListItem) => {
    setSelectedFeature(feature);
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
            <Link
              to="/projects"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-2xl hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-medium hover:shadow-large"
            >
              ← Back to Projects
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Compact Project Header */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
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
                <button className="inline-flex items-center px-3 py-2 bg-accent-50 text-accent-600 hover:bg-accent-100 font-medium rounded-lg transition-all duration-200 text-sm">
                  <span className="mr-1">✨</span>
                  Add Feature
                </button>
                <button className="inline-flex items-center px-3 py-2 bg-primary-50 text-primary-600 hover:bg-primary-100 font-medium rounded-lg transition-all duration-200 text-sm">
                  <span className="mr-1">✏️</span>
                  Edit
                </button>
              </div>
            </div>
            
            {/* Project Title & Status */}
            <div className="mt-4">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                {projectMetrics && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-success-100 text-success-800">
                    {projectMetrics.progressPercentage}% Complete
                  </span>
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
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            {[
              { key: 'features', label: 'Features', icon: '⚡', count: features.length },
              { key: 'overview', label: 'Overview', icon: '📊' },
              { key: 'team', label: 'Team', icon: '👥' },
              { key: 'settings', label: 'Settings', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'border-primary-500 text-primary-600 bg-primary-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    activeTab === tab.key ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          {activeTab === 'features' && (
            <>
              <div className="p-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Features & Tasks</h2>
                    <p className="text-gray-600 text-sm">Manage and track project features across different views</p>
                  </div>
                  
                  {/* View Mode Switcher */}
                  <div className="flex items-center space-x-1 bg-gray-100 rounded-xl p-1">
                    {(['list', 'kanban', 'gantt'] as ViewMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`flex items-center px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                          viewMode === mode
                            ? 'bg-white text-primary-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-white/60'
                        }`}
                      >
                        <span className="mr-1">{getViewModeIcon(mode)}</span>
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4">
                {features.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">🎯</div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">No Features Yet</h3>
                    <p className="text-gray-600 mb-6 text-sm">Start by creating your first feature for this project.</p>
                    <button className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-medium rounded-xl hover:from-accent-600 hover:to-accent-700 transition-all duration-200">
                      <span className="mr-2">✨</span>
                      Create Feature
                    </button>
                  </div>
                ) : (
                  <>
                    {viewMode === 'list' && (
                      <ShrinkingScrollContainer
                        className="max-h-[60vh] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 p-6"
                        itemSelector=".feature-card"
                        shrinkRatio={0.5}
                        shrinkThreshold={120}
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                          {features.map((feature) => (
                            <div key={feature.id} className="feature-card shrink-item">
                              <FeatureCard
                                feature={feature}
                                onEdit={handleFeatureEdit}
                                onDelete={handleFeatureDelete}
                                onStatusChange={handleFeatureStatusChange}
                                onViewDetails={handleFeatureViewDetails}
                              />
                            </div>
                          ))}
                        </div>
                      </ShrinkingScrollContainer>
                    )}
                    
                    {viewMode === 'kanban' && (
                      <div className="max-h-[60vh] overflow-x-auto overflow-y-hidden">
                        <FeatureKanbanView
                          features={features}
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
                          features={features}
                          projectId={project.id}
                          onFeatureClick={handleFeatureViewDetails}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {activeTab === 'overview' && projectMetrics && (
            <div className="p-6">
              <ProjectOverview project={project} metrics={projectMetrics} />
            </div>
          )}

          {activeTab === 'team' && (
            <div className="p-6">
              <div className="text-center py-12">
                <div className="text-5xl mb-4">👥</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Team Management</h3>
                <p className="text-gray-600 text-sm">Team management features coming soon.</p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-6">
              <div className="text-center py-12">
                <div className="text-5xl mb-4">⚙️</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Project Settings</h3>
                <p className="text-gray-600 text-sm">Project settings and configuration options coming soon.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feature Detail Modal */}
      <FeatureDetailModal
        feature={detailModalFeature}
        isOpen={!!detailModalFeature}
        onClose={() => setDetailModalFeature(null)}
        onSave={handleFeatureModalSave}
        onDelete={handleFeatureModalDelete}
      />
    </MainLayout>
  );
};

export default ProjectDetails;