import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MainLayout from '../components/layout/MainLayout';
import apiService, { ProjectListItem, CreateProjectRequest, UpdateProjectRequest, Project } from '../services/api';
import ProjectCard from '../components/projects/ProjectCard';
import ProjectForm from '../components/projects/ProjectForm';
import { createSampleData } from '../utils/sampleData';

const Projects: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreatingSampleData, setIsCreatingSampleData] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    priority: '',
    is_archived: false,
  });
  
  const queryClient = useQueryClient();

  // Fetch projects with filters
  const { data: projectsData, isLoading, error } = useQuery({
    queryKey: ['projects', filters],
    queryFn: () => apiService.getProjects(filters),
  });

  const projects = projectsData?.data?.results || [];

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: (data: CreateProjectRequest) => apiService.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowCreateForm(false);
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectRequest }) => 
      apiService.updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setEditingProject(null);
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  // Archive/Unarchive project mutation
  const archiveProjectMutation = useMutation({
    mutationFn: ({ id, archive }: { id: string; archive: boolean }) =>
      archive ? apiService.archiveProject(id) : apiService.unarchiveProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const handleCreateProject = async (data: any) => {
    await createProjectMutation.mutateAsync(data as CreateProjectRequest);
  };

  const handleUpdateProject = async (data: any) => {
    if (editingProject) {
      await updateProjectMutation.mutateAsync({ 
        id: editingProject.id, 
        data: data as UpdateProjectRequest
      });
    }
  };

  const handleEditProject = (project: ProjectListItem) => {
    // Fetch full project details for editing
    apiService.getProject(project.id).then(response => {
      setEditingProject(response.data);
    });
  };

  const handleDeleteProject = async (project: ProjectListItem) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      await deleteProjectMutation.mutateAsync(project.id);
    }
  };

  const handleArchiveProject = async (project: ProjectListItem) => {
    const action = project.is_archived ? 'unarchive' : 'archive';
    if (window.confirm(`Are you sure you want to ${action} this project?`)) {
      await archiveProjectMutation.mutateAsync({ 
        id: project.id, 
        archive: !project.is_archived 
      });
    }
  };

  const handleFilterChange = (key: keyof typeof filters, value: string | boolean) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCreateSampleData = async () => {
    setIsCreatingSampleData(true);
    try {
      const result = await createSampleData();
      if (result.success) {
        // Refresh the projects list
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        console.log('✅ Sample data created successfully!');
      } else {
        console.error('❌ Failed to create sample data:', result.message);
      }
    } catch (error) {
      console.error('❌ Error creating sample data:', error);
    } finally {
      setIsCreatingSampleData(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-accent-600 border-t-transparent mx-auto mb-6 shadow-large"></div>
            <p className="text-gray-600 font-bold text-lg tracking-wide">Loading projects...</p>
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
            <div className="text-8xl mb-8 animate-pulse-soft">⚠️</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Error loading projects</h2>
            <p className="text-gray-600 text-lg font-medium">Please try refreshing the page.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4">
        {/* Compact Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects 📁</h1>
            <p className="text-gray-600 text-sm">Manage and organize your projects efficiently</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <span className="mr-2">✨</span>
            Create Project
          </button>
        </div>

        {/* Compact Filters */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label htmlFor="search" className="block text-xs font-medium text-gray-700 mb-1">
                🔍 Search
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search projects..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-300 text-sm"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="priority" className="block text-xs font-medium text-gray-700 mb-1">
                🎯 Priority
              </label>
              <select
                id="priority"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-300 text-sm"
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
              <label htmlFor="archived" className="block text-xs font-medium text-gray-700 mb-1">
                📊 Status
              </label>
              <select
                id="archived"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-300 text-sm"
                value={filters.is_archived.toString()}
                onChange={(e) => handleFilterChange('is_archived', e.target.value === 'true')}
              >
                <option value="false">Active Projects</option>
                <option value="true">Archived Projects</option>
              </select>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {filters.search || filters.priority || filters.is_archived
                ? 'Try adjusting your filters or create a new project to get started.'
                : 'Transform your ideas into reality. Create your first project and start building something amazing.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <span className="mr-2">🚀</span>
                Create Your First Project
              </button>
              <button
                onClick={handleCreateSampleData}
                disabled={isCreatingSampleData}
                className="inline-flex items-center bg-gradient-to-r from-info-500 to-info-600 hover:from-info-600 hover:to-info-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isCreatingSampleData ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🎭</span>
                    Try Sample Data
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="text-sm text-gray-600">
                {projects.length} project{projects.length !== 1 ? 's' : ''} found
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <div key={project.id} className="project-card">
                    <ProjectCard
                      project={project}
                      onEdit={handleEditProject}
                      onDelete={handleDeleteProject}
                      onArchive={handleArchiveProject}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Project Form */}
      {showCreateForm && (
        <ProjectForm
          onSubmit={handleCreateProject}
          onCancel={() => setShowCreateForm(false)}
          isSubmitting={createProjectMutation.isPending}
        />
      )}

      {/* Edit Project Form */}
      {editingProject && (
        <ProjectForm
          project={editingProject}
          onSubmit={handleUpdateProject}
          onCancel={() => setEditingProject(null)}
          isSubmitting={updateProjectMutation.isPending}
        />
      )}
    </MainLayout>
  );
};

export default Projects;