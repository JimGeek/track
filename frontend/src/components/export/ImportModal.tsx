import React, { useState, useRef, memo } from 'react';
import Modal from '../ui/Modal';
import { Button } from "../ui/button";
import LoadingSpinner from '../ui/LoadingSpinner';
import { useToast } from '../ui/Toast';
import { importFromJSON, importFromCSV, ExportData } from '../../utils/export';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport?: (data: any) => void;
}

const ImportModal: React.FC<ImportModalProps> = memo(({ isOpen, onClose, onImport }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setPreviewData(null);
    
    // Show preview for JSON files
    if (file.type === 'application/json' || file.name.endsWith('.json')) {
      importFromJSON(file)
        .then((data) => {
          setPreviewData({
            type: 'json',
            projects: data.projects?.length || 0,
            features: data.features?.length || 0,
            exportDate: data.exportDate,
            version: data.version,
          });
        })
        .catch((error) => {
          showToast({
            type: 'error',
            title: 'Invalid File',
            message: 'The selected JSON file is not valid.',
          });
          setSelectedFile(null);
        });
    } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      importFromCSV(file)
        .then((data) => {
          setPreviewData({
            type: 'csv',
            records: data.length,
            columns: Object.keys(data[0] || {}),
          });
        })
        .catch((error) => {
          showToast({
            type: 'error',
            title: 'Invalid File',
            message: 'The selected CSV file is not valid.',
          });
          setSelectedFile(null);
        });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/json' || file.name.endsWith('.json') || 
          file.type === 'text/csv' || file.name.endsWith('.csv')) {
        handleFileSelect(file);
      } else {
        showToast({
          type: 'error',
          title: 'Unsupported File',
          message: 'Please select a JSON or CSV file.',
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);

    try {
      let importedData;
      
      if (selectedFile.type === 'application/json' || selectedFile.name.endsWith('.json')) {
        importedData = await importFromJSON(selectedFile);
      } else if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        importedData = await importFromCSV(selectedFile);
      }

      // Call the import callback if provided
      if (onImport && importedData) {
        onImport(importedData);
      }

      showToast({
        type: 'success',
        title: 'Import Successful',
        message: 'Your data has been imported successfully.',
      });

      onClose();
      setSelectedFile(null);
      setPreviewData(null);
    } catch (error) {
      console.error('Import error:', error);
      showToast({
        type: 'error',
        title: 'Import Failed',
        message: 'Failed to import data. Please check your file format.',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const resetModal = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Data"
      size="md"
    >
      <div className="space-y-6">
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Import your projects and features data from a previously exported file.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-700">
              ⚠️ Importing will add new data to your existing projects and features. 
              Make sure to backup your current data first.
            </p>
          </div>
        </div>

        {/* File Upload Area */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragActive 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv"
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-900">
                {dragActive ? 'Drop your file here' : 'Drag and drop your file here'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  browse to upload
                </button>
              </p>
            </div>
            
            <div className="text-xs text-gray-500">
              Supports JSON and CSV files (max 10MB)
            </div>
          </div>
        </div>

        {/* File Preview */}
        {selectedFile && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">Selected File</h4>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewData(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{selectedFile.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Size:</span>
                <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span>{selectedFile.type || 'Unknown'}</span>
              </div>
            </div>

            {/* Data Preview */}
            {previewData && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h5 className="text-xs font-medium text-gray-700 mb-2">Preview:</h5>
                {previewData.type === 'json' && (
                  <div className="space-y-1 text-xs">
                    <div>📁 {previewData.projects} projects</div>
                    <div>📋 {previewData.features} features</div>
                    <div>📅 Exported: {new Date(previewData.exportDate).toLocaleDateString()}</div>
                  </div>
                )}
                {previewData.type === 'csv' && (
                  <div className="space-y-1 text-xs">
                    <div>📊 {previewData.records} records</div>
                    <div>📋 Columns: {previewData.columns?.slice(0, 5).join(', ')}{previewData.columns?.length > 5 ? '...' : ''}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleImport}
            disabled={!selectedFile || isImporting}
          >
            {isImporting && <LoadingSpinner size="sm" color="white" />}
            {isImporting ? 'Importing...' : 'Import'}
          </Button>
        </div>
      </div>
    </Modal>
  );
});

ImportModal.displayName = 'ImportModal';

export default ImportModal;