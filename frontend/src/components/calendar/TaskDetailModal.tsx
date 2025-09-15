import React, { useState } from 'react';
import { Task, UpdateTaskRequest } from '../../services/todoApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select } from '../ui/select';
import { X, Edit2, Save, Trash2, Calendar, Clock, Flag, User } from 'lucide-react';
import { getTaskPriorityColor, getTaskStatusColor, formatDate } from '../../utils/calendar';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onUpdateTask?: (taskId: string, updates: UpdateTaskRequest) => Promise<void>;
  onDeleteTask?: (taskId: string) => Promise<void>;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  task,
  onUpdateTask,
  onDeleteTask
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UpdateTaskRequest>({});
  const [isLoading, setIsLoading] = useState(false);

  if (!task) return null;

  const handleEdit = () => {
    setEditForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      start_date: task.start_date,
      end_date: task.end_date
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!onUpdateTask) return;
    
    setIsLoading(true);
    try {
      await onUpdateTask(task.id, editForm);
      setIsEditing(false);
      onClose();
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDeleteTask) return;
    
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    setIsLoading(true);
    try {
      await onDeleteTask(task.id);
      onClose();
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const priorityColors = {
    urgent: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  };

  const statusColors = {
    todo: 'bg-blue-100 text-blue-800',
    ongoing: 'bg-purple-100 text-purple-800',
    done: 'bg-green-100 text-green-800'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-xl font-semibold pr-8">
              {isEditing ? 'Edit Task' : 'Task Details'}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1 h-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium">Title</Label>
            {isEditing ? (
              <Input
                id="title"
                value={editForm.title || ''}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="mt-1"
              />
            ) : (
              <h2 className="text-lg font-semibold mt-1">{task.title}</h2>
            )}
          </div>

          {/* Status and Priority Badges */}
          <div className="flex items-center space-x-3">
            {isEditing ? (
              <>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <select
                    value={editForm.status || task.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Task['status'] })}
                    className="mt-1 block w-32 px-3 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="todo">Todo</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <select
                    value={editForm.priority || task.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as Task['priority'] })}
                    className="mt-1 block w-32 px-3 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <Badge className={statusColors[task.status]}>
                  {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </Badge>
                <Badge className={priorityColors[task.priority]}>
                  <Flag className="w-3 h-3 mr-1" />
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </Badge>
                {task.is_overdue && (
                  <Badge className="bg-red-100 text-red-800">
                    <Clock className="w-3 h-3 mr-1" />
                    Overdue
                  </Badge>
                )}
              </>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            {isEditing ? (
              <Textarea
                id="description"
                value={editForm.description || ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={4}
                className="mt-1"
                placeholder="Add a description..."
              />
            ) : (
              <p className="mt-1 text-gray-700 whitespace-pre-wrap">
                {task.description || 'No description provided.'}
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date" className="text-sm font-medium flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Start Date
              </Label>
              {isEditing ? (
                <Input
                  id="start_date"
                  type="date"
                  value={editForm.start_date || ''}
                  onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 text-gray-700">
                  {task.start_date ? new Date(task.start_date).toLocaleDateString() : 'Not set'}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="end_date" className="text-sm font-medium flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Due Date
              </Label>
              {isEditing ? (
                <Input
                  id="end_date"
                  type="date"
                  value={editForm.end_date || ''}
                  onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 text-gray-700">
                  {task.end_date ? new Date(task.end_date).toLocaleDateString() : 'Not set'}
                </p>
              )}
            </div>
          </div>

          {/* Metadata */}
          {!isEditing && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <Label className="text-sm font-medium text-gray-500">Created</Label>
                <p className="mt-1 text-sm text-gray-700">
                  {new Date(task.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                <p className="mt-1 text-sm text-gray-700">
                  {new Date(task.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t border-gray-200">
            {isEditing ? (
              <div className="flex space-x-2">
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isLoading ? 'Saving...' : 'Save'}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Button
                  onClick={handleEdit}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit</span>
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="outline"
                  className="flex items-center space-x-2 text-red-600 hover:bg-red-50"
                  disabled={isLoading}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isLoading ? 'Deleting...' : 'Delete'}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailModal;