import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { X, Save } from 'lucide-react';
import { TodoListListItem } from '../services/todoApi';

interface TodoListEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  todoList: TodoListListItem;
  onSave: (updatedList: Partial<TodoListListItem>) => Promise<void>;
}

export const TodoListEditModal: React.FC<TodoListEditModalProps> = ({
  isOpen,
  onClose,
  todoList,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    deadline: '',
    color: '#3B82F6',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (todoList) {
      setFormData({
        name: todoList.name || '',
        description: todoList.description || '',
        deadline: todoList.deadline || '',
        color: todoList.color || '#3B82F6',
      });
    }
  }, [todoList]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await onSave(formData);
      onClose();
    } catch (error: any) {
      if (error.response?.data) {
        setErrors(error.response.data);
      } else {
        setErrors({ general: 'Failed to update todo list' });
      }
    } finally {
      setLoading(false);
    }
  };

  const colorOptions = [
    { value: '#3B82F6', label: 'Blue', class: 'bg-blue-500' },
    { value: '#EF4444', label: 'Red', class: 'bg-red-500' },
    { value: '#10B981', label: 'Green', class: 'bg-green-500' },
    { value: '#F59E0B', label: 'Yellow', class: 'bg-yellow-500' },
    { value: '#8B5CF6', label: 'Purple', class: 'bg-purple-500' },
    { value: '#EC4899', label: 'Pink', class: 'bg-pink-500' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Edit Todo List
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="text-red-500 text-sm">{errors.general}</div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter todo list name"
              required
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Optional description"
              rows={3}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium mb-1">Deadline</label>
            <Input
              type="date"
              value={formData.deadline}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, deadline: e.target.value }))
              }
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.deadline && (
              <p className="text-red-500 text-sm mt-1">{errors.deadline}</p>
            )}
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium mb-2">Color</label>
            <div className="flex gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${
                    formData.color === color.value
                      ? 'border-gray-900 ring-2 ring-gray-300'
                      : 'border-gray-300'
                  } ${color.class}`}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, color: color.value }))
                  }
                  title={color.label}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                'Saving...'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TodoListEditModal;