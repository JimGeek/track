import React, { useState, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Modal from '../ui/Modal';
import { Button } from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useToast } from '../ui/Toast';
import apiService from '../../services/api';
import { 
  exportToJSON, 
  exportToCSV, 
  exportToExcel, 
  prepareProjectsForExport, 
  prepareFeaturesForExport,
  ExportData 
} from '../../utils/export';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExportFormat = 'json' | 'csv' | 'excel';
type ExportType = 'all' | 'projects' | 'features';

const ExportModal: React.FC<ExportModalProps> = memo(({ isOpen, onClose }) => {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [exportType, setExportType] = useState<ExportType>('all');
  const [isExporting, setIsExporting] = useState(false);
  const { showToast } = useToast();

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiService.getProjects(),
    enabled: isOpen,
  });

  const { data: featuresData } = useQuery({
    queryKey: ['features'],
    queryFn: () => apiService.getFeatures({}),
    enabled: isOpen,
  });

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const projects = projectsData?.data?.results || [];
      const features = featuresData?.data?.results || [];

      if (exportFormat === 'json') {
        const exportData: ExportData = {
          projects: exportType === 'features' ? [] : prepareProjectsForExport(projects),
          features: exportType === 'projects' ? [] : prepareFeaturesForExport(features),
          exportDate: new Date().toISOString(),
          version: '1.0.0',
        };

        exportToJSON(exportData);
      } else {
        // CSV/Excel export
        if (exportType === 'all') {
          // Export both as separate files
          if (projects.length > 0) {
            const projectsForExport = prepareProjectsForExport(projects);
            if (exportFormat === 'csv') {
              exportToCSV(projectsForExport, 'projects');
            } else {
              await exportToExcel(projectsForExport, 'projects');
            }
          }

          if (features.length > 0) {
            const featuresForExport = prepareFeaturesForExport(features);
            if (exportFormat === 'csv') {
              exportToCSV(featuresForExport, 'features');
            } else {
              await exportToExcel(featuresForExport, 'features');
            }
          }
        } else if (exportType === 'projects' && projects.length > 0) {
          const projectsForExport = prepareProjectsForExport(projects);
          if (exportFormat === 'csv') {
            exportToCSV(projectsForExport, 'projects');
          } else {
            await exportToExcel(projectsForExport, 'projects');
          }
        } else if (exportType === 'features' && features.length > 0) {
          const featuresForExport = prepareFeaturesForExport(features);
          if (exportFormat === 'csv') {
            exportToCSV(featuresForExport, 'features');
          } else {
            await exportToExcel(featuresForExport, 'features');
          }
        }
      }

      showToast({
        type: 'success',
        title: 'Export Successful',
        message: 'Your data has been exported successfully.',
      });

      onClose();
    } catch (error) {
      console.error('Export error:', error);
      showToast({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export data. Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getExportDescription = () => {
    const counts = {
      projects: projectsData?.data?.results?.length || 0,
      features: featuresData?.data?.results?.length || 0,
    };

    switch (exportType) {
      case 'all':
        return `Export ${counts.projects} projects and ${counts.features} features`;
      case 'projects':
        return `Export ${counts.projects} projects`;
      case 'features':
        return `Export ${counts.features} features`;
      default:
        return '';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Data"
      size="md"
    >
      <div className="space-y-6">
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Export your projects and features data for backup or analysis.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">{getExportDescription()}</p>
          </div>
        </div>

        {/* Export Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What to export
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="exportType"
                value="all"
                checked={exportType === 'all'}
                onChange={(e) => setExportType(e.target.value as ExportType)}
                className="mr-3"
              />
              <span className="text-sm">Everything (Projects & Features)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="exportType"
                value="projects"
                checked={exportType === 'projects'}
                onChange={(e) => setExportType(e.target.value as ExportType)}
                className="mr-3"
              />
              <span className="text-sm">Projects only</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="exportType"
                value="features"
                checked={exportType === 'features'}
                onChange={(e) => setExportType(e.target.value as ExportType)}
                className="mr-3"
              />
              <span className="text-sm">Features only</span>
            </label>
          </div>
        </div>

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export format
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="exportFormat"
                value="json"
                checked={exportFormat === 'json'}
                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                className="mr-3"
              />
              <div>
                <span className="text-sm font-medium">JSON</span>
                <p className="text-xs text-gray-500">
                  Complete data with relationships (recommended for backup)
                </p>
              </div>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="exportFormat"
                value="csv"
                checked={exportFormat === 'csv'}
                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                className="mr-3"
              />
              <div>
                <span className="text-sm font-medium">CSV</span>
                <p className="text-xs text-gray-500">
                  Spreadsheet-compatible format for analysis
                </p>
              </div>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="exportFormat"
                value="excel"
                checked={exportFormat === 'excel'}
                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                className="mr-3"
              />
              <div>
                <span className="text-sm font-medium">Excel</span>
                <p className="text-xs text-gray-500">
                  Excel-compatible format (.xls)
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting && <LoadingSpinner size="sm" color="white" />}
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </div>
    </Modal>
  );
});

ExportModal.displayName = 'ExportModal';

export default ExportModal;