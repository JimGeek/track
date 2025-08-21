import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService, { ProjectListItem, CreateProjectRequest, UpdateProjectRequest, Project } from '../services/api';
import ProjectCard from '../components/projects/ProjectCard';
import ProjectForm from '../components/projects/ProjectForm';

const Projects: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
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
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Error loading projects</h2>
          <p className="text-gray-600">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium"
            >
              Create Project
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search projects..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                id="priority"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
              <label htmlFor="archived" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="archived"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600 mb-6">
              {filters.search || filters.priority || filters.is_archived
                ? 'Try adjusting your filters or create a new project.'
                : 'Get started by creating your first project.'}
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md font-medium"
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
                onArchive={handleArchiveProject}
              />
            ))}
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
    </div>
  );
};

export default Projects;