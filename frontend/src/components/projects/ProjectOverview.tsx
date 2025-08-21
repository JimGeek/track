import React from 'react';
import { Project } from '../../services/api';

interface ProjectMetrics {
  totalFeatures: number;
  completedFeatures: number;
  inProgressFeatures: number;
  overdueFeatures: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  progressPercentage: number;
}

interface ProjectOverviewProps {
  project: Project;
  metrics: ProjectMetrics;
}

const ProjectOverview: React.FC<ProjectOverviewProps> = ({ project, metrics }) => {
  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'from-success-500 to-success-600';
    if (percentage >= 60) return 'from-info-500 to-info-600';
    if (percentage >= 40) return 'from-warning-500 to-warning-600';
    return 'from-danger-500 to-danger-600';
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Project Overview</h2>
          <span className="text-sm text-gray-500">{metrics.progressPercentage}% Complete</span>
        </div>
        
        {/* Progress Section */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`bg-gradient-to-r ${getProgressColor(metrics.progressPercentage)} h-2 rounded-full transition-all duration-500 ease-out`}
              style={{ width: `${metrics.progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Metrics Grid - Compact */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {/* Total Features */}
          <div className="text-center p-3 bg-primary-50 rounded-xl">
            <div className="text-lg font-bold text-primary-600">{metrics.totalFeatures}</div>
            <div className="text-xs text-primary-500 font-medium">Total</div>
          </div>

          {/* Completed Features */}
          <div className="text-center p-3 bg-success-50 rounded-xl">
            <div className="text-lg font-bold text-success-600">{metrics.completedFeatures}</div>
            <div className="text-xs text-success-500 font-medium">Done</div>
          </div>

          {/* In Progress Features */}
          <div className="text-center p-3 bg-info-50 rounded-xl">
            <div className="text-lg font-bold text-info-600">{metrics.inProgressFeatures}</div>
            <div className="text-xs text-info-500 font-medium">Active</div>
          </div>

          {/* Overdue Features */}
          <div className="text-center p-3 bg-danger-50 rounded-xl">
            <div className="text-lg font-bold text-danger-600">{metrics.overdueFeatures}</div>
            <div className="text-xs text-danger-500 font-medium">Overdue</div>
          </div>
        </div>

        {/* Time Tracking - Simplified */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <span className="text-gray-600">Estimated</span>
            <span className="font-semibold text-gray-900">{metrics.totalEstimatedHours}h</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <span className="text-gray-600">Actual</span>
            <span className="font-semibold text-gray-900">{metrics.totalActualHours}h</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectOverview;