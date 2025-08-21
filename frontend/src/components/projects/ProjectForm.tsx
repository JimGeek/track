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

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {project ? 'Edit Project' : 'Create New Project'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {errors.general && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{errors.general[0]}</div>
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Project Name *
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              className={`mt-1 block w-full px-3 py-2 border ${
                getErrorMessage('name') ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter project name"
            />
            {getErrorMessage('name') && (
              <p className="mt-1 text-sm text-red-600">{getErrorMessage('name')}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              id="description"
              rows={3}
              className={`mt-1 block w-full px-3 py-2 border ${
                getErrorMessage('description') ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter project description"
            />
            {getErrorMessage('description') && (
              <p className="mt-1 text-sm text-red-600">{getErrorMessage('description')}</p>
            )}
          </div>

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

          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
              Deadline
            </label>
            <input
              type="date"
              name="deadline"
              id="deadline"
              className={`mt-1 block w-full px-3 py-2 border ${
                getErrorMessage('deadline') ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              value={formData.deadline}
              onChange={handleChange}
            />
            {getErrorMessage('deadline') && (
              <p className="mt-1 text-sm text-red-600">{getErrorMessage('deadline')}</p>
            )}
          </div>

          <div>
            <label htmlFor="team_member_emails" className="block text-sm font-medium text-gray-700">
              Team Member Emails
            </label>
            <input
              type="text"
              name="team_member_emails"
              id="team_member_emails"
              className={`mt-1 block w-full px-3 py-2 border ${
                getErrorMessage('team_member_emails') ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              value={formData.team_member_emails}
              onChange={handleChange}
              placeholder="user1@example.com, user2@example.com"
            />
            <p className="mt-1 text-sm text-gray-500">
              Separate multiple emails with commas
            </p>
            {getErrorMessage('team_member_emails') && (
              <p className="mt-1 text-sm text-red-600">{getErrorMessage('team_member_emails')}</p>
            )}
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
            {isSubmitting ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectForm;