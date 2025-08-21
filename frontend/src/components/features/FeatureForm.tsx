import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreateFeatureRequest, UpdateFeatureRequest, Feature, ProjectListItem } from '../../services/api';
import apiService from '../../services/api';

interface FeatureFormProps {
  feature?: Feature;
  projectId?: string;
  parentId?: string;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const FeatureForm: React.FC<FeatureFormProps> = ({
  feature,
  projectId,
  parentId,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState({
    project: feature?.project || projectId || '',
    parent: feature?.parent || parentId || '',
    title: feature?.title || '',
    description: feature?.description || '',
    priority: feature?.priority || 'medium' as const,
    assignee_email: feature?.assignee?.email || '',
    estimated_hours: feature?.estimated_hours || '',
    due_date: feature?.due_date || '',
    order: feature?.order || 0,
  });
  
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // Fetch projects for selection
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiService.getProjects(),
    enabled: !projectId && !feature,
  });

  // Fetch potential parent features
  const { data: featuresData } = useQuery({
    queryKey: ['features', formData.project],
    queryFn: () => apiService.getFeatures({ project: formData.project }),
    enabled: !!formData.project,
  });

  const projects = projectsData?.data?.results || [];
  const parentFeatures = featuresData?.data?.results || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'estimated_hours' || name === 'order' 
        ? (value === '' ? '' : Number(value))
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const submitData: CreateFeatureRequest | UpdateFeatureRequest = {
        ...formData,
        project: formData.project,
        parent: formData.parent || undefined,
        assignee_email: formData.assignee_email || undefined,
        estimated_hours: formData.estimated_hours ? Number(formData.estimated_hours) : undefined,
        due_date: formData.due_date || undefined,
      };

      // Remove empty strings
      Object.keys(submitData).forEach(key => {
        const value = (submitData as any)[key];
        if (value === '' || value === null) {
          delete (submitData as any)[key];
        }
      });

      await onSubmit(submitData);
    } catch (err: any) {
      if (err.response?.data) {
        setErrors(err.response.data);
      } else {
        setErrors({ general: ['An error occurred. Please try again.'] });
      }
    }
  };

  const getErrorMessage = (field: string) => {
    return errors[field] ? errors[field][0] : '';
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {feature ? 'Edit Feature' : 'Create New Feature'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {errors.general && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{errors.general[0]}</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Project Selection */}
            {!projectId && !feature && (
              <div className="md:col-span-2">
                <label htmlFor="project" className="block text-sm font-medium text-gray-700">
                  Project *
                </label>
                <select
                  name="project"
                  id="project"
                  required
                  className={`mt-1 block w-full px-3 py-2 border ${
                    getErrorMessage('project') ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                  value={formData.project}
                  onChange={handleChange}
                >
                  <option value="">Select Project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                {getErrorMessage('project') && (
                  <p className="mt-1 text-sm text-red-600">{getErrorMessage('project')}</p>
                )}
              </div>
            )}

            {/* Parent Feature Selection */}
            <div className="md:col-span-2">
              <label htmlFor="parent" className="block text-sm font-medium text-gray-700">
                Parent Feature (Optional)
              </label>
              <select
                name="parent"
                id="parent"
                className={`mt-1 block w-full px-3 py-2 border ${
                  getErrorMessage('parent') ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                value={formData.parent}
                onChange={handleChange}
              >
                <option value="">No Parent (Root Feature)</option>
                {parentFeatures
                  .filter(f => !feature || f.id !== feature.id) // Don't allow self as parent
                  .map((parentFeature) => (
                    <option key={parentFeature.id} value={parentFeature.id}>
                      {parentFeature.full_path || parentFeature.title}
                    </option>
                  ))}
              </select>
              {getErrorMessage('parent') && (
                <p className="mt-1 text-sm text-red-600">{getErrorMessage('parent')}</p>
              )}
            </div>

            {/* Title */}
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Feature Title *
              </label>
              <input
                type="text"
                name="title"
                id="title"
                required
                className={`mt-1 block w-full px-3 py-2 border ${
                  getErrorMessage('title') ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter feature title"
              />
              {getErrorMessage('title') && (
                <p className="mt-1 text-sm text-red-600">{getErrorMessage('title')}</p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description *
              </label>
              <textarea
                name="description"
                id="description"
                rows={4}
                required
                className={`mt-1 block w-full px-3 py-2 border ${
                  getErrorMessage('description') ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter detailed feature description"
              />
              {getErrorMessage('description') && (
                <p className="mt-1 text-sm text-red-600">{getErrorMessage('description')}</p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                Priority
              </label>
              <select
                name="priority"
                id="priority"
                className={`mt-1 block w-full px-3 py-2 border ${
                  getErrorMessage('priority') ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              {getErrorMessage('priority') && (
                <p className="mt-1 text-sm text-red-600">{getErrorMessage('priority')}</p>
              )}
            </div>

            {/* Assignee Email */}
            <div>
              <label htmlFor="assignee_email" className="block text-sm font-medium text-gray-700">
                Assignee Email (Optional)
              </label>
              <input
                type="email"
                name="assignee_email"
                id="assignee_email"
                className={`mt-1 block w-full px-3 py-2 border ${
                  getErrorMessage('assignee_email') ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                value={formData.assignee_email}
                onChange={handleChange}
                placeholder="user@example.com"
              />
              {getErrorMessage('assignee_email') && (
                <p className="mt-1 text-sm text-red-600">{getErrorMessage('assignee_email')}</p>
              )}
            </div>

            {/* Estimated Hours */}
            <div>
              <label htmlFor="estimated_hours" className="block text-sm font-medium text-gray-700">
                Estimated Hours (Optional)
              </label>
              <input
                type="number"
                name="estimated_hours"
                id="estimated_hours"
                min="0"
                className={`mt-1 block w-full px-3 py-2 border ${
                  getErrorMessage('estimated_hours') ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                value={formData.estimated_hours}
                onChange={handleChange}
                placeholder="0"
              />
              {getErrorMessage('estimated_hours') && (
                <p className="mt-1 text-sm text-red-600">{getErrorMessage('estimated_hours')}</p>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                Due Date (Optional)
              </label>
              <input
                type="date"
                name="due_date"
                id="due_date"
                className={`mt-1 block w-full px-3 py-2 border ${
                  getErrorMessage('due_date') ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                value={formData.due_date}
                onChange={handleChange}
              />
              {getErrorMessage('due_date') && (
                <p className="mt-1 text-sm text-red-600">{getErrorMessage('due_date')}</p>
              )}
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : feature ? 'Update Feature' : 'Create Feature'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeatureForm;