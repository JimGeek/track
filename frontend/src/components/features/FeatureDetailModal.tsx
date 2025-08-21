import React, { useState, useEffect } from 'react';
import { FeatureListItem, Feature } from '../../services/api';
import { apiService } from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';

interface FeatureDetailModalProps {
  feature: FeatureListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedFeature: Feature) => void;
  onDelete: (featureId: string) => void;
  onCreateSubFeature?: (parentId: string) => void;
}

const FeatureDetailModal: React.FC<FeatureDetailModalProps> = ({
  feature,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onCreateSubFeature,
}) => {
  const [fullFeature, setFullFeature] = useState<Feature | null>(null);
  const [subFeatures, setSubFeatures] = useState<FeatureListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'subfeatures'>('details');
  const [editMode, setEditMode] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    status: 'idea' as 'idea' | 'specification' | 'development' | 'testing' | 'live',
    estimated_hours: 0,
    due_date: '',
  });

  useEffect(() => {
    if (isOpen && feature) {
      fetchFeatureDetails();
    }
  }, [isOpen, feature]);

  const fetchFeatureDetails = async () => {
    if (!feature) return;
    
    setLoading(true);
    try {
      const [featureResponse, subFeaturesResponse] = await Promise.all([
        apiService.getFeature(feature.id),
        apiService.getFeatures({ parent: feature.id })
      ]);
      
      setFullFeature(featureResponse.data);
      setSubFeatures(subFeaturesResponse.data.results);
      
      // Initialize form data
      const featureData = featureResponse.data;
      setFormData({
        title: featureData.title,
        description: featureData.description || '',
        priority: featureData.priority as 'low' | 'medium' | 'high' | 'critical',
        status: featureData.status as 'idea' | 'specification' | 'development' | 'testing' | 'live',
        estimated_hours: featureData.estimated_hours || 0,
        due_date: featureData.due_date ? featureData.due_date.split('T')[0] : '',
      });
    } catch (error) {
      console.error('Error fetching feature details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!fullFeature) return;
    
    try {
      const updatedFeature = await apiService.updateFeature(fullFeature.id, {
        ...formData,
        due_date: formData.due_date || undefined,
      });
      onSave(updatedFeature.data);
      setEditMode(false);
    } catch (error) {
      console.error('Error updating feature:', error);
      alert('Failed to update feature');
    }
  };

  const handleDelete = () => {
    if (!fullFeature) return;
    
    if (window.confirm(`Are you sure you want to delete "${fullFeature.title}"?`)) {
      onDelete(fullFeature.id);
      onClose();
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'idea':
        return { bg: 'bg-gray-500', label: 'Idea', icon: '💡' };
      case 'specification':
        return { bg: 'bg-info-500', label: 'Specification', icon: '📋' };
      case 'development':
        return { bg: 'bg-warning-500', label: 'Development', icon: '⚡' };
      case 'testing':
        return { bg: 'bg-orange-500', label: 'Testing', icon: '🧪' };
      case 'live':
        return { bg: 'bg-success-500', label: 'Live', icon: '🚀' };
      default:
        return { bg: 'bg-gray-400', label: 'Unknown', icon: '📌' };
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'critical':
        return { bg: 'bg-danger-500', label: 'Critical', icon: '🚨' };
      case 'high':
        return { bg: 'bg-warning-500', label: 'High', icon: '🔥' };
      case 'medium':
        return { bg: 'bg-yellow-500', label: 'Medium', icon: '⚡' };
      case 'low':
        return { bg: 'bg-success-500', label: 'Low', icon: '🌱' };
      default:
        return { bg: 'bg-gray-400', label: 'Unknown', icon: '📌' };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="inline-block w-full max-w-5xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <LoadingSpinner />
            </div>
          ) : fullFeature ? (
            <>
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full bg-white bg-opacity-80 shadow-lg`}></div>
                    <div>
                      <h1 className="text-2xl font-bold">
                        {editMode ? 'Edit Feature' : fullFeature.title}
                      </h1>
                      <div className="flex items-center gap-3 mt-1">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white bg-opacity-20 backdrop-blur-sm`}>
                          <span className="mr-1">{getStatusConfig(fullFeature.status).icon}</span>
                          {getStatusConfig(fullFeature.status).label}
                        </div>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white bg-opacity-20 backdrop-blur-sm`}>
                          <span className="mr-1">{getPriorityConfig(fullFeature.priority).icon}</span>
                          {getPriorityConfig(fullFeature.priority).label}
                        </div>
                        {fullFeature.project && (
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white bg-opacity-20 backdrop-blur-sm">
                            <span className="mr-1">📁</span>
                            Project
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {fullFeature.can_edit && (
                      <>
                        {editMode ? (
                          <>
                            <button
                              onClick={handleSave}
                              className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors"
                            >
                              <span className="mr-2">✓</span>
                              Save Changes
                            </button>
                            <button
                              onClick={() => setEditMode(false)}
                              className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 font-medium transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditMode(true)}
                              className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 font-medium transition-colors"
                            >
                              <span className="mr-2">✏️</span>
                              Edit
                            </button>
                            <button
                              onClick={handleDelete}
                              className="inline-flex items-center px-4 py-2 bg-red-500 bg-opacity-80 text-white rounded-lg hover:bg-red-600 font-medium transition-colors"
                            >
                              <span className="mr-2">🗑️</span>
                              Delete
                            </button>
                          </>
                        )}
                      </>
                    )}
                    <button
                      onClick={onClose}
                      className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 bg-gray-50">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-all ${
                    activeTab === 'details'
                      ? 'border-blue-500 text-blue-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white'
                  }`}
                >
                  <span className="mr-2">📄</span>
                  Feature Details
                </button>
                <button
                  onClick={() => setActiveTab('subfeatures')}
                  className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-all ${
                    activeTab === 'subfeatures'
                      ? 'border-blue-500 text-blue-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white'
                  }`}
                >
                  <span className="mr-2">🌳</span>
                  Sub-Features
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
                    {subFeatures.length}
                  </span>
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    {editMode ? (
                      // Edit Form
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title
                          </label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Priority
                          </label>
                          <select
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' | 'critical' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                          </label>
                          <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'idea' | 'specification' | 'development' | 'testing' | 'live' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="idea">Idea</option>
                            <option value="specification">Specification</option>
                            <option value="development">Development</option>
                            <option value="testing">Testing</option>
                            <option value="live">Live</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estimated Hours
                          </label>
                          <input
                            type="number"
                            value={formData.estimated_hours}
                            onChange={(e) => setFormData({ ...formData, estimated_hours: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Due Date
                          </label>
                          <input
                            type="date"
                            value={formData.due_date}
                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                          </label>
                          <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="space-y-8">
                        {/* Description */}
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                            <span className="mr-2">📝</span>
                            Description
                          </h3>
                          <div className="text-gray-700 leading-relaxed">
                            {fullFeature.description ? (
                              <p className="whitespace-pre-wrap">{fullFeature.description}</p>
                            ) : (
                              <p className="text-gray-500 italic">No description provided.</p>
                            )}
                          </div>
                        </div>

                        {/* Progress Visualization */}
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="mr-2">📊</span>
                            Progress & Metrics
                          </h3>
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                              <span className="text-sm font-bold text-gray-900">{fullFeature.progress_percentage || 0}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${fullFeature.progress_percentage || 0}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{fullFeature.estimated_hours || 0}h</div>
                              <div className="text-sm text-gray-600 font-medium">⏱️ Estimated</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">{fullFeature.actual_hours || 0}h</div>
                              <div className="text-sm text-gray-600 font-medium">✅ Actual</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">{fullFeature.progress_percentage || 0}%</div>
                              <div className="text-sm text-gray-600 font-medium">🎯 Complete</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-orange-600">
                                {fullFeature.due_date ? (
                                  new Date(fullFeature.due_date) > new Date() ? 
                                    Math.ceil((new Date(fullFeature.due_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) + 'd'
                                    : 'Overdue'
                                ) : '∞'}
                              </div>
                              <div className="text-sm text-gray-600 font-medium">📅 Due in</div>
                            </div>
                          </div>
                        </div>

                        {/* Metadata */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white border-2 border-gray-100 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <span className="mr-2">📅</span>
                              Timeline
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Created:</span>
                                <span className="text-sm font-medium">{new Date(fullFeature.created_at).toLocaleDateString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Last Updated:</span>
                                <span className="text-sm font-medium">{new Date(fullFeature.updated_at).toLocaleDateString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Due Date:</span>
                                <span className="text-sm font-medium">
                                  {fullFeature.due_date ? new Date(fullFeature.due_date).toLocaleDateString() : 'Not set'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-white border-2 border-gray-100 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <span className="mr-2">👥</span>
                              Assignment
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Assignee:</span>
                                <span className="text-sm font-medium">{fullFeature.assignee?.email || 'Unassigned'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Order:</span>
                                <span className="text-sm font-medium">#{fullFeature.order || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'subfeatures' && (
                  <div className="space-y-4">
                    {subFeatures.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-4">🌳</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Sub-Features</h3>
                        <p className="text-gray-600 mb-4">This feature doesn't have any sub-features yet.</p>
                        <button 
                          onClick={() => onCreateSubFeature?.(fullFeature.id)}
                          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          <span className="mr-2">➕</span>
                          Add Sub-Feature
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium text-gray-900">Sub-Features ({subFeatures.length})</h3>
                          <button 
                            onClick={() => onCreateSubFeature?.(fullFeature.id)}
                            className="inline-flex items-center px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                          >
                            <span className="mr-2">➕</span>
                            Add Sub-Feature
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {subFeatures.map((subFeature) => (
                            <div key={subFeature.id} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className={`w-3 h-3 rounded-full ${getStatusConfig(subFeature.status).bg}`}></div>
                                    <h4 className="font-semibold text-gray-900">{subFeature.title}</h4>
                                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getPriorityConfig(subFeature.priority).bg}`}>
                                      <span className="mr-1">{getPriorityConfig(subFeature.priority).icon}</span>
                                      {getPriorityConfig(subFeature.priority).label}
                                    </div>
                                  </div>
                                  {subFeature.description && (
                                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{subFeature.description}</p>
                                  )}
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span>📅 {subFeature.due_date ? new Date(subFeature.due_date).toLocaleDateString() : 'No due date'}</span>
                                    <span>⏱️ {subFeature.estimated_hours || 0}h estimated</span>
                                    <span>📊 {subFeature.progress_percentage || 0}% complete</span>
                                  </div>
                                </div>
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusConfig(subFeature.status).bg}`}>
                                  <span className="mr-1">{getStatusConfig(subFeature.status).icon}</span>
                                  {getStatusConfig(subFeature.status).label}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">
              Feature not found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeatureDetailModal;