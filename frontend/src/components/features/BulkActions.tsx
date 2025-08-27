import React, { useState } from 'react';
import { FeatureListItem } from '../../services/api';
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';

interface BulkActionsProps {
  selectedFeatures: FeatureListItem[];
  onBulkStatusChange: (featureIds: string[], status: string) => Promise<void>;
  onBulkDelete: (featureIds: string[]) => Promise<void>;
  onBulkPriorityChange: (featureIds: string[], priority: string) => Promise<void>;
  onClearSelection: () => void;
  isLoading?: boolean;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedFeatures,
  onBulkStatusChange,
  onBulkDelete,
  onBulkPriorityChange,
  onClearSelection,
  isLoading = false,
}) => {
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showPriorityDialog, setShowPriorityDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [newPriority, setNewPriority] = useState<string>('');

  if (selectedFeatures.length === 0) {
    return null;
  }

  const handleStatusChange = async () => {
    if (newStatus) {
      await onBulkStatusChange(selectedFeatures.map(f => f.id), newStatus);
      setShowStatusDialog(false);
      setNewStatus('');
      onClearSelection();
    }
  };

  const handlePriorityChange = async () => {
    if (newPriority) {
      await onBulkPriorityChange(selectedFeatures.map(f => f.id), newPriority);
      setShowPriorityDialog(false);
      setNewPriority('');
      onClearSelection();
    }
  };

  const handleDelete = async () => {
    await onBulkDelete(selectedFeatures.map(f => f.id));
    setShowDeleteDialog(false);
    onClearSelection();
  };

  const statusOptions = [
    { value: 'idea', label: 'Idea' },
    { value: 'specification', label: 'Specification' },
    { value: 'development', label: 'Development' },
    { value: 'testing', label: 'Testing' },
    { value: 'live', label: 'Live' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ];

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-blue-800">
            {selectedFeatures.length} feature{selectedFeatures.length !== 1 ? 's' : ''} selected
          </span>
          <Badge variant="secondary">
            Bulk Actions Available
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStatusDialog(true)}
            disabled={isLoading}
          >
            Change Status
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPriorityDialog(true)}
            disabled={isLoading}
          >
            Change Priority
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isLoading}
          >
            Delete All
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isLoading}
          >
            Clear Selection
          </Button>
        </div>
      </div>

      {/* Status Change Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Status for {selectedFeatures.length} Features</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="text-sm text-gray-600">
              This will update the status for all {selectedFeatures.length} selected features.
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusChange} disabled={!newStatus || isLoading}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Priority Change Dialog */}
      <Dialog open={showPriorityDialog} onOpenChange={setShowPriorityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Priority for {selectedFeatures.length} Features</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Priority</label>
              <Select value={newPriority} onValueChange={setNewPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="text-sm text-gray-600">
              This will update the priority for all {selectedFeatures.length} selected features.
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPriorityDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePriorityChange} disabled={!newPriority || isLoading}>
              Update Priority
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedFeatures.length} Features</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Are you sure you want to delete these {selectedFeatures.length} features? This action cannot be undone.
            </div>
            
            <div className="max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
              {selectedFeatures.map(feature => (
                <div key={feature.id} className="text-xs py-1">
                  • {feature.title}
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              Delete All Features
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BulkActions;