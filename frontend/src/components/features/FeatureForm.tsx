import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreateFeatureRequest, UpdateFeatureRequest, Feature } from '../../services/api';
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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return '🚨';
      case 'high': return '🔥';
      case 'medium': return '⚡';
      case 'low': return '🌱';
      default: return '📌';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'from-danger-500 to-danger-600 text-white';
      case 'high': return 'from-warning-500 to-warning-600 text-white';
      case 'medium': return 'from-yellow-500 to-yellow-600 text-white';
      case 'low': return 'from-success-500 to-success-600 text-white';
      default: return 'from-gray-500 to-gray-600 text-white';
    }
  };

  const getStatusIcon = () => feature ? '✏️' : '⚡';

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden border border-gray-200/60 animate-slide-up">
        {/* Header */}
        <div className="relative px-8 py-6 bg-gradient-to-r from-accent-50 to-accent-100/80 border-b border-accent-200/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center shadow-large">
                <span className="text-white text-2xl">{getStatusIcon()}</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-accent-800 tracking-tight">
                  {feature ? 'Edit Feature' : 'Create New Feature'}
                </h3>
                <p className="text-accent-600 font-medium">
                  {feature ? 'Update your feature details' : 'Build something amazing'}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="w-10 h-10 bg-white/80 hover:bg-white rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-105 shadow-soft hover:shadow-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="overflow-y-auto max-h-[70vh]">
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
            {errors.general && (
              <div className="rounded-2xl bg-gradient-to-r from-danger-50 to-danger-100 p-4 border border-danger-200/60 shadow-soft">
                <div className="flex items-center">
                  <span className="text-xl mr-3">⚠️</span>
                  <div className="text-sm font-medium text-danger-700">{errors.general[0]}</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Project Selection */}
                {!projectId && !feature && (
                  <div className="space-y-2">
                    <label htmlFor="project" className="flex items-center text-sm font-bold text-gray-700 tracking-wide">
                      <span className="text-lg mr-2">📁</span>
                      Project *
                    </label>
                    <select
                      name="project"
                      id="project"
                      required
                      className={`w-full px-4 py-4 bg-gray-50/50 backdrop-blur-sm border ${
                        getErrorMessage('project') ? 'border-danger-300 bg-danger-50/30' : 'border-gray-300/60'
                      } rounded-2xl shadow-soft focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-300 transition-all duration-200 font-medium hover:shadow-medium`}
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
                      <p className="text-sm text-danger-600 font-medium flex items-center">
                        <span className="mr-1">❌</span>
                        {getErrorMessage('project')}
                      </p>
                    )}
                  </div>
                )}

                {/* Feature Title */}
                <div className="space-y-2">
                  <label htmlFor="title" className="flex items-center text-sm font-bold text-gray-700 tracking-wide">
                    <span className="text-lg mr-2">⚡</span>
                    Feature Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    id="title"
                    required
                    className={`w-full px-4 py-4 bg-gray-50/50 backdrop-blur-sm border ${
                      getErrorMessage('title') ? 'border-danger-300 bg-danger-50/30' : 'border-gray-300/60'
                    } rounded-2xl shadow-soft focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-300 transition-all duration-200 font-medium text-lg hover:shadow-medium`}
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter your amazing feature title..."
                  />
                  {getErrorMessage('title') && (
                    <p className="text-sm text-danger-600 font-medium flex items-center">
                      <span className="mr-1">❌</span>
                      {getErrorMessage('title')}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label htmlFor="description" className="flex items-center text-sm font-bold text-gray-700 tracking-wide">
                    <span className="text-lg mr-2">📝</span>
                    Description *
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    rows={5}
                    required
                    className={`w-full px-4 py-4 bg-gray-50/50 backdrop-blur-sm border ${
                      getErrorMessage('description') ? 'border-danger-300 bg-danger-50/30' : 'border-gray-300/60'
                    } rounded-2xl shadow-soft focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-300 transition-all duration-200 font-medium resize-none hover:shadow-medium`}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe what this feature will do and why it matters..."
                  />
                  {getErrorMessage('description') && (
                    <p className="text-sm text-danger-600 font-medium flex items-center">
                      <span className="mr-1">❌</span>
                      {getErrorMessage('description')}
                    </p>
                  )}
                </div>

                {/* Parent Feature */}
                <div className="space-y-2">
                  <label htmlFor="parent" className="flex items-center text-sm font-bold text-gray-700 tracking-wide">
                    <span className="text-lg mr-2">🌳</span>
                    Parent Feature (Optional)
                  </label>
                  <select
                    name="parent"
                    id="parent"
                    className={`w-full px-4 py-4 bg-gray-50/50 backdrop-blur-sm border ${
                      getErrorMessage('parent') ? 'border-danger-300 bg-danger-50/30' : 'border-gray-300/60'
                    } rounded-2xl shadow-soft focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-300 transition-all duration-200 font-medium hover:shadow-medium`}
                    value={formData.parent}
                    onChange={handleChange}
                  >
                    <option value="">🏠 No Parent (Root Feature)</option>
                    {parentFeatures
                      .filter(f => !feature || f.id !== feature.id)
                      .map((parentFeature) => (
                        <option key={parentFeature.id} value={parentFeature.id}>
                          🔗 {parentFeature.full_path || parentFeature.title}
                        </option>
                      ))}
                  </select>
                  {getErrorMessage('parent') && (
                    <p className="text-sm text-danger-600 font-medium flex items-center">
                      <span className="mr-1">❌</span>
                      {getErrorMessage('parent')}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Priority Selection */}
                <div className="space-y-3">
                  <label className="flex items-center text-sm font-bold text-gray-700 tracking-wide">
                    <span className="text-lg mr-2">🎯</span>
                    Priority Level
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['low', 'medium', 'high', 'critical'].map((priority) => (
                      <label
                        key={priority}
                        className={`relative cursor-pointer group ${
                          formData.priority === priority ? 'scale-105' : 'hover:scale-105'
                        } transition-all duration-200`}
                      >
                        <input
                          type="radio"
                          name="priority"
                          value={priority}
                          checked={formData.priority === priority}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div
                          className={`p-4 rounded-2xl border-2 text-center shadow-soft hover:shadow-medium transition-all duration-200 ${
                            formData.priority === priority
                              ? `bg-gradient-to-r ${getPriorityColor(priority)} border-transparent shadow-large`
                              : 'bg-white border-gray-200/60 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-2xl mb-1">{getPriorityIcon(priority)}</div>
                          <div className="font-bold text-sm tracking-wide capitalize">{priority}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {getErrorMessage('priority') && (
                    <p className="text-sm text-danger-600 font-medium flex items-center">
                      <span className="mr-1">❌</span>
                      {getErrorMessage('priority')}
                    </p>
                  )}
                </div>

                {/* Assignee */}
                <div className="space-y-2">
                  <label htmlFor="assignee_email" className="flex items-center text-sm font-bold text-gray-700 tracking-wide">
                    <span className="text-lg mr-2">👤</span>
                    Assignee Email (Optional)
                  </label>
                  <input
                    type="email"
                    name="assignee_email"
                    id="assignee_email"
                    className={`w-full px-4 py-4 bg-gray-50/50 backdrop-blur-sm border ${
                      getErrorMessage('assignee_email') ? 'border-danger-300 bg-danger-50/30' : 'border-gray-300/60'
                    } rounded-2xl shadow-soft focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-300 transition-all duration-200 font-medium hover:shadow-medium`}
                    value={formData.assignee_email}
                    onChange={handleChange}
                    placeholder="developer@example.com"
                  />
                  {getErrorMessage('assignee_email') && (
                    <p className="text-sm text-danger-600 font-medium flex items-center">
                      <span className="mr-1">❌</span>
                      {getErrorMessage('assignee_email')}
                    </p>
                  )}
                </div>

                {/* Time & Date Section */}
                <div className="bg-gradient-to-br from-info-50 to-info-100/80 p-6 rounded-2xl border border-info-200/60 space-y-4">
                  <h4 className="flex items-center text-sm font-bold text-info-800 tracking-wide">
                    <span className="text-lg mr-2">⏰</span>
                    Time & Schedule
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Estimated Hours */}
                    <div className="space-y-2">
                      <label htmlFor="estimated_hours" className="flex items-center text-xs font-bold text-gray-700 tracking-wide">
                        <span className="mr-1">⏱️</span>
                        Estimated Hours
                      </label>
                      <input
                        type="number"
                        name="estimated_hours"
                        id="estimated_hours"
                        min="0"
                        className={`w-full px-3 py-3 bg-white/80 backdrop-blur-sm border ${
                          getErrorMessage('estimated_hours') ? 'border-danger-300' : 'border-info-200/60'
                        } rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-info-500 focus:border-info-300 transition-all duration-200 font-medium text-center hover:shadow-medium`}
                        value={formData.estimated_hours}
                        onChange={handleChange}
                        placeholder="0"
                      />
                      {getErrorMessage('estimated_hours') && (
                        <p className="text-xs text-danger-600 font-medium">
                          {getErrorMessage('estimated_hours')}
                        </p>
                      )}
                    </div>

                    {/* Due Date */}
                    <div className="space-y-2">
                      <label htmlFor="due_date" className="flex items-center text-xs font-bold text-gray-700 tracking-wide">
                        <span className="mr-1">📅</span>
                        Due Date
                      </label>
                      <input
                        type="date"
                        name="due_date"
                        id="due_date"
                        className={`w-full px-3 py-3 bg-white/80 backdrop-blur-sm border ${
                          getErrorMessage('due_date') ? 'border-danger-300' : 'border-info-200/60'
                        } rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-info-500 focus:border-info-300 transition-all duration-200 font-medium hover:shadow-medium`}
                        value={formData.due_date}
                        onChange={handleChange}
                      />
                      {getErrorMessage('due_date') && (
                        <p className="text-xs text-danger-600 font-medium">
                          {getErrorMessage('due_date')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-200/60 flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-sm font-bold text-gray-700 bg-white border border-gray-300/60 rounded-2xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 shadow-soft hover:shadow-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8 py-3 text-sm font-bold text-white bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 border border-accent-400 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-large hover:shadow-xl transform hover:scale-105 disabled:transform-none"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Saving...
              </div>
            ) : (
              <div className="flex items-center">
                <span className="mr-2 text-base">
                  {feature ? '✏️' : '⚡'}
                </span>
                {feature ? 'Update Feature' : 'Create Feature'}
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeatureForm;