import React, { useState } from 'react';
import { CreateProjectRequest, UpdateProjectRequest, Project } from '../../services/api';

interface ProjectFormProps {
  project?: Project;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  project,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    priority: project?.priority || 'medium' as const,
    deadline: project?.deadline || '',
    team_member_emails: project?.team_members?.map(member => member.email).join(', ') || '',
  });
  
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const submitData: CreateProjectRequest | UpdateProjectRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        deadline: formData.deadline || undefined,
        team_member_emails: formData.team_member_emails
          .split(',')
          .map(email => email.trim())
          .filter(email => email) || undefined,
      };

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

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden border border-gray-200/60 animate-slide-up">
        {/* Header */}
        <div className="relative px-8 py-6 bg-gradient-to-r from-accent-50 to-accent-100/80 border-b border-accent-200/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center shadow-large">
                <span className="text-white text-2xl">✨</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-accent-800 tracking-tight">
                  {project ? 'Edit Project' : 'Create New Project'}
                </h3>
                <p className="text-accent-600 font-medium">
                  {project ? 'Update your project details' : 'Bring your ideas to life'}
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
        <div className="overflow-y-auto max-h-[60vh]">
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
            {errors.general && (
              <div className="rounded-2xl bg-gradient-to-r from-danger-50 to-danger-100 p-4 border border-danger-200/60 shadow-soft">
                <div className="flex items-center">
                  <span className="text-xl mr-3">⚠️</span>
                  <div className="text-sm font-medium text-danger-700">{errors.general[0]}</div>
                </div>
              </div>
            )}

            {/* Project Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="flex items-center text-sm font-bold text-gray-700 tracking-wide">
                <span className="text-lg mr-2">🎯</span>
                Project Name *
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                className={`w-full px-4 py-4 bg-gray-50/50 backdrop-blur-sm border ${
                  getErrorMessage('name') ? 'border-danger-300 bg-danger-50/30' : 'border-gray-300/60'
                } rounded-2xl shadow-soft focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-300 transition-all duration-200 font-medium text-lg hover:shadow-medium`}
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your amazing project name..."
              />
              {getErrorMessage('name') && (
                <p className="text-sm text-danger-600 font-medium flex items-center">
                  <span className="mr-1">❌</span>
                  {getErrorMessage('name')}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="flex items-center text-sm font-bold text-gray-700 tracking-wide">
                <span className="text-lg mr-2">📝</span>
                Description
              </label>
              <textarea
                name="description"
                id="description"
                rows={4}
                className={`w-full px-4 py-4 bg-gray-50/50 backdrop-blur-sm border ${
                  getErrorMessage('description') ? 'border-danger-300 bg-danger-50/30' : 'border-gray-300/60'
                } rounded-2xl shadow-soft focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-300 transition-all duration-200 font-medium resize-none hover:shadow-medium`}
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what makes this project special..."
              />
              {getErrorMessage('description') && (
                <p className="text-sm text-danger-600 font-medium flex items-center">
                  <span className="mr-1">❌</span>
                  {getErrorMessage('description')}
                </p>
              )}
            </div>

            {/* Priority Selection */}
            <div className="space-y-3">
              <label className="flex items-center text-sm font-bold text-gray-700 tracking-wide">
                <span className="text-lg mr-2">🎯</span>
                Priority Level
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

            {/* Deadline */}
            <div className="space-y-2">
              <label htmlFor="deadline" className="flex items-center text-sm font-bold text-gray-700 tracking-wide">
                <span className="text-lg mr-2">📅</span>
                Deadline (Optional)
              </label>
              <input
                type="date"
                name="deadline"
                id="deadline"
                className={`w-full px-4 py-4 bg-gray-50/50 backdrop-blur-sm border ${
                  getErrorMessage('deadline') ? 'border-danger-300 bg-danger-50/30' : 'border-gray-300/60'
                } rounded-2xl shadow-soft focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-300 transition-all duration-200 font-medium hover:shadow-medium`}
                value={formData.deadline}
                onChange={handleChange}
              />
              {getErrorMessage('deadline') && (
                <p className="text-sm text-danger-600 font-medium flex items-center">
                  <span className="mr-1">❌</span>
                  {getErrorMessage('deadline')}
                </p>
              )}
            </div>

            {/* Team Members */}
            <div className="space-y-2">
              <label htmlFor="team_member_emails" className="flex items-center text-sm font-bold text-gray-700 tracking-wide">
                <span className="text-lg mr-2">👥</span>
                Team Member Emails (Optional)
              </label>
              <input
                type="text"
                name="team_member_emails"
                id="team_member_emails"
                className={`w-full px-4 py-4 bg-gray-50/50 backdrop-blur-sm border ${
                  getErrorMessage('team_member_emails') ? 'border-danger-300 bg-danger-50/30' : 'border-gray-300/60'
                } rounded-2xl shadow-soft focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-300 transition-all duration-200 font-medium hover:shadow-medium`}
                value={formData.team_member_emails}
                onChange={handleChange}
                placeholder="john@example.com, jane@example.com"
              />
              <div className="flex items-center text-sm text-gray-500 font-medium">
                <span className="mr-1">💡</span>
                Separate multiple emails with commas
              </div>
              {getErrorMessage('team_member_emails') && (
                <p className="text-sm text-danger-600 font-medium flex items-center">
                  <span className="mr-1">❌</span>
                  {getErrorMessage('team_member_emails')}
                </p>
              )}
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
                  {project ? '✏️' : '🚀'}
                </span>
                {project ? 'Update Project' : 'Create Project'}
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectForm;