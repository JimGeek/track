import React, { useState, useEffect } from 'react';
import { Button } from "../ui/button";
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Loader2, Palette } from 'lucide-react';

interface TodoList {
  id?: string;
  name: string;
  description: string;
  color: string;
}

interface TodoListFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (todoList: TodoList) => void;
  todoList?: TodoList | null;
  isLoading?: boolean;
}

const TodoListFormModal: React.FC<TodoListFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  todoList,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<TodoList>({
    name: '',
    description: '',
    color: '#3B82F6'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Predefined color options
  const colorOptions = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Orange', value: '#F59E0B' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Cyan', value: '#06B6D4' },
    { name: 'Emerald', value: '#059669' },
    { name: 'Violet', value: '#7C3AED' },
    { name: 'Rose', value: '#F43F5E' },
    { name: 'Amber', value: '#D97706' },
  ];

  // Initialize form data when todoList changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (todoList) {
        // Edit mode - populate with existing todoList data
        setFormData({
          name: todoList.name || '',
          description: todoList.description || '',
          color: todoList.color || '#3B82F6'
        });
      } else {
        // Create mode - reset to defaults
        setFormData({
          name: '',
          description: '',
          color: '#3B82F6'
        });
      }
      setErrors({});
    }
  }, [isOpen, todoList]);

  const handleInputChange = (field: keyof TodoList, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.color) {
      newErrors.color = 'Color is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const todoListData: TodoList = {
      ...formData,
      // Include ID if editing existing todoList
      ...(todoList?.id && { id: todoList.id })
    };

    onSave(todoListData);
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const isEditMode = !!todoList?.id;
  const title = isEditMode ? 'Edit Todo List' : 'Create New Todo List';
  const description = isEditMode 
    ? 'Update the todo list details below.' 
    : 'Create a new todo list to organize your tasks.';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter todo list name..."
              className={errors.name ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter description (optional)..."
              className="min-h-[80px]"
              disabled={isLoading}
            />
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label>
              <Palette className="inline h-4 w-4 mr-1" />
              Color <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-6 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => handleInputChange('color', color.value)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-105 ${
                    formData.color === color.value 
                      ? 'border-foreground ring-2 ring-ring ring-offset-2' 
                      : 'border-border hover:border-foreground/50'
                  }`}
                  style={{ backgroundColor: color.value }}
                  disabled={isLoading}
                  title={color.name}
                />
              ))}
            </div>
            
            {/* Preview */}
            <div className="flex items-center space-x-2 p-3 border rounded-lg bg-muted/50">
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: formData.color }}
              />
              <span className="text-sm text-muted-foreground">
                Preview: {formData.name || 'Todo List Name'}
              </span>
            </div>
            
            {errors.color && (
              <p className="text-sm text-red-600">{errors.color}</p>
            )}
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Update List' : 'Create List'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TodoListFormModal;