import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreateFeatureRequest, UpdateFeatureRequest, Feature } from '../../services/api';
import apiService from '../../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import Button from '../ui/Button';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';

interface FeatureFormProps {
  feature?: Feature;
  projectId?: string;
  projectName?: string;
  parentId?: string;
  parentName?: string;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const FeatureForm: React.FC<FeatureFormProps> = ({
  feature,
  projectId,
  projectName,
  parentId,
  parentName,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  // Fetch projects for selection
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiService.getProjects(),
    enabled: !projectId && !feature,
  });

  // Fetch parent feature details to get project info if needed
  const { data: parentFeatureData } = useQuery({
    queryKey: ['feature', parentId],
    queryFn: () => apiService.getFeature(parentId!),
    enabled: !!parentId && !projectId,
  });

  const [formData, setFormData] = useState({
    project: feature?.project || projectId || '',
    parent: feature?.parent || parentId || '',
    title: feature?.title || '',
    description: feature?.description || '',
    priority: feature?.priority || 'medium' as const,
    assignee_email: feature?.assignee?.email || '',
    estimated_hours: feature?.estimated_hours || '',
    start_date: feature?.start_date || '',
    end_date: feature?.end_date || feature?.due_date || '', // due_date maps to end_date
    order: feature?.order || 0,
  });

  // Update project when parent feature data is loaded
  React.useEffect(() => {
    if (parentFeatureData?.data?.project && !projectId && !feature) {
      setFormData(prev => ({
        ...prev,
        project: parentFeatureData.data.project,
      }));
    }
  }, [parentFeatureData, projectId, feature]);
  
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // Fetch selected project details for date validation
  const { data: selectedProjectData } = useQuery({
    queryKey: ['project', formData.project],
    queryFn: () => apiService.getProject(formData.project),
    enabled: !!formData.project,
  });

  // Fetch potential parent features
  const { data: featuresData } = useQuery({
    queryKey: ['features', formData.project],
    queryFn: () => apiService.getFeatures({ project: formData.project }),
    enabled: !!formData.project,
  });


  const projects = projectsData?.data?.results || [];
  const parentFeatures = featuresData?.data?.results || [];
  
  
  // Find the selected project name for display
  const selectedProject = projects.find(p => p.id === formData.project);
  const selectedProjectName = projectName || selectedProject?.name || 'Loading...';
  
  // Find the selected parent feature name for display
  const selectedParentFeature = parentFeatures.find(f => f.id === formData.parent);
  const selectedParentFeatureName = parentName || selectedParentFeature?.title || parentFeatureData?.data?.title || 'Loading...';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'estimated_hours' || name === 'order' 
        ? (value === '' ? '' : Number(value))
        : value,
    }));
    
    // Clear any existing errors for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };


  // Validate dates against project boundaries
  const validateDates = () => {
    const validationErrors: Record<string, string[]> = {};
    const project = selectedProjectData?.data;
    
    if (project) {
      // Get project date boundaries
      const projectStart = project.start_date || new Date(project.created_at).toISOString().split('T')[0];
      const projectEnd = project.end_date || project.deadline;
      
      // Validate start_date
      if (formData.start_date) {
        if (formData.start_date < projectStart) {
          validationErrors.start_date = [`Start date cannot be before project start date (${projectStart})`];
        }
        if (projectEnd && formData.start_date > projectEnd) {
          validationErrors.start_date = [`Start date cannot be after project end date (${projectEnd})`];
        }
      }
      
      // Validate end_date
      if (formData.end_date) {
        if (formData.end_date < projectStart) {
          validationErrors.end_date = [`End date cannot be before project start date (${projectStart})`];
        }
        if (projectEnd && formData.end_date > projectEnd) {
          validationErrors.end_date = [`End date cannot be after project end date (${projectEnd})`];
        }
      }
      
      // Validate start_date vs end_date
      if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
        validationErrors.end_date = ['End date cannot be earlier than start date'];
      }
    }
    
    return validationErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Run client-side validation first
    const validationErrors = validateDates();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const submitData: CreateFeatureRequest | UpdateFeatureRequest = {
        ...formData,
        project: formData.project,
        parent: formData.parent || undefined,
        assignee_email: formData.assignee_email || undefined,
        estimated_hours: formData.estimated_hours ? Number(formData.estimated_hours) : undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
      };

      // Remove empty strings
      Object.keys(submitData).forEach(key => {
        const value = (submitData as any)[key];
        if (value === '' || value === null) {
          delete (submitData as any)[key];
        }
      });

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
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="w-full max-w-4xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {feature ? 'Edit Feature' : parentId ? 'Create Sub-Feature' : 'Create New Feature'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {feature ? 'Update your feature details' : parentId ? 'Add a sub-feature to break down the work' : 'Build something amazing'}
          </p>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[70vh]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-md p-3">
                <div className="text-sm font-medium">{errors.general[0]}</div>
              </div>
            )}

            {/* Sub-feature context information */}
            {parentId && !feature && (
              <Card className="bg-primary/10 border-primary/20">
                <CardContent className="p-3">
                  <div className="text-sm font-medium mb-1 text-primary">Creating Sub-Feature</div>
                  <div className="text-sm text-muted-foreground">
                    This feature will be created as a sub-feature under the selected parent.
                    {projectId && (
                      <span className="block text-xs mt-1">
                        Project and parent are pre-selected for you.
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Project Selection */}
                {!feature && (
                  <div className="space-y-2">
                    <Label htmlFor="project">
                      Project * {projectId && <span className="text-xs text-muted-foreground ml-2">(Pre-selected)</span>}
                    </Label>
                    {projectId ? (
                      <div className="w-full px-3 py-2 bg-muted border border-border text-muted-foreground rounded-md">
                        {selectedProjectName}
                      </div>
                    ) : (
                      <Select 
                        value={formData.project} 
                        onValueChange={(value) => {
                          setFormData(prev => ({ ...prev, project: value }));
                          if (errors.project) {
                            const newErrors = { ...errors };
                            delete newErrors.project;
                            setErrors(newErrors);
                          }
                        }}
                      >
                        <SelectTrigger className={getErrorMessage('project') ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select Project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {getErrorMessage('project') && (
                      <p className="text-sm text-destructive">
                        {getErrorMessage('project')}
                      </p>
                    )}
                  </div>
                )}

                {/* Feature Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Feature Title *
                  </Label>
                  <Input
                    type="text"
                    name="title"
                    id="title"
                    required
                    className={getErrorMessage('title') ? 'border-destructive' : ''}
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter your feature title..."
                  />
                  {getErrorMessage('title') && (
                    <p className="text-sm text-destructive">
                      {getErrorMessage('title')}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description *
                  </Label>
                  <textarea
                    name="description"
                    id="description"
                    rows={4}
                    required
                    className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none ${
                      getErrorMessage('description') ? 'border-destructive' : ''
                    }`}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe what this feature will do..."
                  />
                  {getErrorMessage('description') && (
                    <p className="text-sm text-destructive">
                      {getErrorMessage('description')}
                    </p>
                  )}
                </div>

                {/* Parent Feature */}
                <div className="space-y-2">
                  <Label htmlFor="parent">
                    Parent Feature (Optional) {parentId && <span className="text-xs text-muted-foreground ml-2">(Pre-selected)</span>}
                  </Label>
                  {parentId ? (
                    <div className="w-full px-3 py-2 bg-muted border border-border text-muted-foreground rounded-md">
                      {selectedParentFeatureName}
                    </div>
                  ) : (
                    <Select 
                      value={formData.parent || 'none'} 
                      onValueChange={(value) => {
                        // Convert "none" back to empty string
                        const parentValue = value === 'none' ? '' : value;
                        setFormData(prev => ({ ...prev, parent: parentValue }));
                        if (errors.parent) {
                          const newErrors = { ...errors };
                          delete newErrors.parent;
                          setErrors(newErrors);
                        }
                      }}
                    >
                      <SelectTrigger className={getErrorMessage('parent') ? 'border-destructive' : ''}>
                        <SelectValue placeholder="No Parent (Root Feature)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Parent (Root Feature)</SelectItem>
                        {parentFeatures
                          .filter(f => !feature || f.id !== feature.id)
                          .map((parentFeature) => (
                            <SelectItem key={parentFeature.id} value={parentFeature.id}>
                              {parentFeature.full_path || parentFeature.title}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                  {getErrorMessage('parent') && (
                    <p className="text-sm text-destructive">
                      {getErrorMessage('parent')}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Priority Selection */}
                <div className="space-y-3">
                  <Label>
                    Priority Level
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['low', 'medium', 'high', 'critical'].map((priority) => (
                      <label
                        key={priority}
                        className="relative cursor-pointer"
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
                          className={`p-3 border rounded-md text-center transition-colors ${
                            formData.priority === priority
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background border-input hover:bg-muted'
                          }`}
                        >
                          <div className="text-sm font-medium capitalize">{priority}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {getErrorMessage('priority') && (
                    <p className="text-sm text-destructive">
                      {getErrorMessage('priority')}
                    </p>
                  )}
                </div>

                {/* Assignee */}
                <div className="space-y-2">
                  <Label htmlFor="assignee_email">
                    Assignee Email (Optional)
                  </Label>
                  <Input
                    type="email"
                    name="assignee_email"
                    id="assignee_email"
                    className={getErrorMessage('assignee_email') ? 'border-destructive' : ''}
                    value={formData.assignee_email}
                    onChange={handleChange}
                    placeholder="developer@example.com"
                  />
                  {getErrorMessage('assignee_email') && (
                    <p className="text-sm text-destructive">
                      {getErrorMessage('assignee_email')}
                    </p>
                  )}
                </div>

                {/* Time & Date Section */}
                <Card className="bg-muted/50">
                  <CardContent className="p-4 space-y-4">
                    <h4 className="text-sm font-medium text-foreground">
                      Time & Schedule
                    </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Estimated Hours */}
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="estimated_hours" className="text-xs">
                        Estimated Hours
                      </Label>
                      <Input
                        type="number"
                        name="estimated_hours"
                        id="estimated_hours"
                        min="0"
                        className={getErrorMessage('estimated_hours') ? 'border-destructive' : ''}
                        value={formData.estimated_hours}
                        onChange={handleChange}
                        placeholder="0"
                      />
                      {getErrorMessage('estimated_hours') && (
                        <p className="text-xs text-destructive">
                          {getErrorMessage('estimated_hours')}
                        </p>
                      )}
                    </div>

                    {/* Start Date */}
                    <div className="space-y-2">
                      <Label htmlFor="start_date" className="text-xs">
                        Start Date
                      </Label>
                      <Input
                        type="date"
                        name="start_date"
                        id="start_date"
                        className={getErrorMessage('start_date') ? 'border-destructive' : ''}
                        value={formData.start_date}
                        onChange={handleChange}
                      />
                      {getErrorMessage('start_date') && (
                        <p className="text-xs text-destructive">
                          {getErrorMessage('start_date')}
                        </p>
                      )}
                    </div>

                    {/* End Date */}
                    <div className="space-y-2">
                      <Label htmlFor="end_date" className="text-xs">
                        End Date
                      </Label>
                      <Input
                        type="date"
                        name="end_date"
                        id="end_date"
                        className={getErrorMessage('end_date') ? 'border-destructive' : ''}
                        value={formData.end_date}
                        onChange={handleChange}
                      />
                      {getErrorMessage('end_date') && (
                        <p className="text-xs text-destructive">
                          {getErrorMessage('end_date')}
                        </p>
                      )}
                    </div>

                  </div>
                  </CardContent>
                </Card>
              </div>
            </div>

          </form>
        </div>

        <DialogFooter className="bg-muted/50">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Saving...
              </div>
            ) : (
              feature ? 'Update Feature' : 'Create Feature'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FeatureForm;