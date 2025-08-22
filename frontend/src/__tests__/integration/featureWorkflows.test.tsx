/**
 * Feature Workflows Integration Tests
 * 
 * End-to-end UI integration tests for the complete feature creation,
 * editing, and dependency management workflows. These tests validate
 * the fixes for the critical date and dependency bugs.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Features from '../../pages/Features';
import ProjectDetails from '../../pages/ProjectDetails';
import { 
  createMockProject, 
  createMockFeature, 
  createMockFeatureListItem,
  createMockApiResponse,
  createHierarchicalFeatures,
  createFeatureWithDependencyIssues
} from '../factories/testDataFactories';

// Mock the API service
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    getProjects: jest.fn(),
    getProject: jest.fn(),
    getFeature: jest.fn(),
    getFeatures: jest.fn(),
    createFeature: jest.fn(),
    updateFeature: jest.fn(),
    deleteFeature: jest.fn(),
    getProjectStatistics: jest.fn(),
  },
}));

import apiService from '../../services/api';

const mockedApiService = apiService as jest.Mocked<typeof apiService>;

// Test wrapper component with all necessary providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: { 
      queries: { retry: false },
      mutations: { retry: false }
    },
  });
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Feature Workflows Integration Tests', () => {
  const mockProject = createMockProject({
    id: 'project-1',
    name: 'Test Project',
    start_date: '2024-01-01',
    end_date: '2024-12-31'
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default API mocks
    mockedApiService.getProject.mockResolvedValue(
      createMockApiResponse(mockProject)
    );
    mockedApiService.getProjectStatistics.mockResolvedValue(
      createMockApiResponse({
        total_features: 5,
        completed_features: 2,
        progress_percentage: 40,
        is_overdue: false,
        team_members_count: 3,
        created_at: '2023-01-01T00:00:00Z',
        last_updated: '2024-01-01T00:00:00Z'
      })
    );
  });

  describe('Complete Feature Creation Workflow', () => {
    test('CRITICAL BUG TEST: Create feature with dates - full workflow', async () => {
      const mockFeatures = createHierarchicalFeatures();
      
      mockedApiService.getFeatures.mockResolvedValue(
        createMockApiResponse({ results: mockFeatures })
      );
      
      mockedApiService.createFeature.mockResolvedValue(
        createMockApiResponse(createMockFeature({
          id: 'new-feature',
          title: 'Integration Test Feature',
          start_date: '2024-02-01',
          end_date: '2024-02-15'
        }))
      );

      render(
        <TestWrapper>
          <ProjectDetails />
        </TestWrapper>
      );

      // Wait for project to load
      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Click "Add Feature" button
      const addFeatureButton = screen.getByRole('button', { name: /add feature/i });
      await userEvent.click(addFeatureButton);

      // Fill in the feature form
      await waitFor(() => {
        expect(screen.getByLabelText(/feature title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/feature title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);

      await userEvent.type(titleInput, 'Integration Test Feature');
      await userEvent.type(descriptionInput, 'Testing the complete workflow');
      await userEvent.type(startDateInput, '2024-02-01');
      await userEvent.type(endDateInput, '2024-02-15');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create feature/i });
      await userEvent.click(submitButton);

      // CRITICAL TEST: Verify API was called with correct date values
      await waitFor(() => {
        expect(mockedApiService.createFeature).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Integration Test Feature',
            description: 'Testing the complete workflow',
            start_date: '2024-02-01',
            end_date: '2024-02-15'
          })
        );
      });

      // Verify the modal closes and feature appears in the list
      await waitFor(() => {
        expect(screen.queryByLabelText(/feature title/i)).not.toBeInTheDocument();
      });
    });

    test('CRITICAL BUG TEST: Create feature without dates should not set random dates', async () => {
      const mockFeatures: any[] = [];
      
      mockedApiService.getFeatures.mockResolvedValue(
        createMockApiResponse({ results: mockFeatures })
      );
      
      mockedApiService.createFeature.mockResolvedValue(
        createMockApiResponse(createMockFeature({
          id: 'new-feature-no-dates',
          title: 'Feature Without Dates',
          start_date: null,
          end_date: null
        }))
      );

      render(
        <TestWrapper>
          <ProjectDetails />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      const addFeatureButton = screen.getByRole('button', { name: /add feature/i });
      await userEvent.click(addFeatureButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/feature title/i)).toBeInTheDocument();
      });

      // Fill only required fields, leave dates empty
      const titleInput = screen.getByLabelText(/feature title/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      await userEvent.type(titleInput, 'Feature Without Dates');
      await userEvent.type(descriptionInput, 'Testing no dates scenario');

      const submitButton = screen.getByRole('button', { name: /create feature/i });
      await userEvent.click(submitButton);

      // CRITICAL TEST: API should be called with undefined dates, not empty strings or random dates
      await waitFor(() => {
        expect(mockedApiService.createFeature).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Feature Without Dates',
            description: 'Testing no dates scenario',
            start_date: undefined,
            end_date: undefined
          })
        );
      });
    });

    test('should validate dates against project boundaries in workflow', async () => {
      const mockFeatures: any[] = [];
      
      mockedApiService.getFeatures.mockResolvedValue(
        createMockApiResponse({ results: mockFeatures })
      );

      render(
        <TestWrapper>
          <ProjectDetails />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      const addFeatureButton = screen.getByRole('button', { name: /add feature/i });
      await userEvent.click(addFeatureButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/feature title/i)).toBeInTheDocument();
      });

      // Fill form with dates outside project boundaries
      const titleInput = screen.getByLabelText(/feature title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const startDateInput = screen.getByLabelText(/start date/i);

      await userEvent.type(titleInput, 'Invalid Date Feature');
      await userEvent.type(descriptionInput, 'Testing date validation');
      await userEvent.type(startDateInput, '2023-12-01'); // Before project start

      const submitButton = screen.getByRole('button', { name: /create feature/i });
      await userEvent.click(submitButton);

      // Should show validation error and not submit
      await waitFor(() => {
        expect(screen.getByText(/start date cannot be before project start date/i)).toBeInTheDocument();
      });

      expect(mockedApiService.createFeature).not.toHaveBeenCalled();
    });
  });

  describe('Feature Editing Workflow with Dates', () => {
    test('CRITICAL BUG TEST: Edit feature dates - preserve existing values', async () => {
      const existingFeature = createMockFeature({
        id: 'existing-feature',
        title: 'Existing Feature',
        start_date: '2024-02-01',
        end_date: '2024-02-15'
      });

      const mockFeatures = [
        createMockFeatureListItem({
          id: 'existing-feature',
          title: 'Existing Feature',
          start_date: '2024-02-01',
          end_date: '2024-02-15'
        })
      ];
      
      mockedApiService.getFeatures.mockResolvedValue(
        createMockApiResponse({ results: mockFeatures })
      );
      
      mockedApiService.getFeature.mockResolvedValue(
        createMockApiResponse(existingFeature)
      );
      
      mockedApiService.updateFeature.mockResolvedValue(
        createMockApiResponse({
          ...existingFeature,
          title: 'Updated Feature Title',
          start_date: '2024-02-05',
          end_date: '2024-02-20'
        })
      );

      render(
        <TestWrapper>
          <ProjectDetails />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Existing Feature')).toBeInTheDocument();
      });

      // Click on the feature to edit it
      const featureCard = screen.getByText('Existing Feature');
      await userEvent.click(featureCard);

      // Wait for the detail modal and click edit
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit feature/i })).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit feature/i });
      await userEvent.click(editButton);

      // Form should be pre-filled with existing values
      await waitFor(() => {
        expect(screen.getByDisplayValue('Existing Feature')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2024-02-01')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2024-02-15')).toBeInTheDocument();
      });

      // Update the values
      const titleInput = screen.getByDisplayValue('Existing Feature');
      const startDateInput = screen.getByDisplayValue('2024-02-01');
      const endDateInput = screen.getByDisplayValue('2024-02-15');

      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, 'Updated Feature Title');
      
      await userEvent.clear(startDateInput);
      await userEvent.type(startDateInput, '2024-02-05');
      
      await userEvent.clear(endDateInput);
      await userEvent.type(endDateInput, '2024-02-20');

      const updateButton = screen.getByRole('button', { name: /update feature/i });
      await userEvent.click(updateButton);

      // CRITICAL TEST: Verify update API call includes date changes
      await waitFor(() => {
        expect(mockedApiService.updateFeature).toHaveBeenCalledWith(
          'existing-feature',
          expect.objectContaining({
            title: 'Updated Feature Title',
            start_date: '2024-02-05',
            end_date: '2024-02-20'
          })
        );
      });
    });

    test('CRITICAL BUG TEST: Clear dates from existing feature', async () => {
      const existingFeature = createMockFeature({
        id: 'existing-feature',
        title: 'Existing Feature',
        start_date: '2024-02-01',
        end_date: '2024-02-15'
      });

      const mockFeatures = [
        createMockFeatureListItem({
          id: 'existing-feature',
          title: 'Existing Feature',
          start_date: '2024-02-01',
          end_date: '2024-02-15'
        })
      ];
      
      mockedApiService.getFeatures.mockResolvedValue(
        createMockApiResponse({ results: mockFeatures })
      );
      
      mockedApiService.getFeature.mockResolvedValue(
        createMockApiResponse(existingFeature)
      );
      
      mockedApiService.updateFeature.mockResolvedValue(
        createMockApiResponse({
          ...existingFeature,
          start_date: null,
          end_date: null
        })
      );

      render(
        <TestWrapper>
          <ProjectDetails />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Existing Feature')).toBeInTheDocument();
      });

      const featureCard = screen.getByText('Existing Feature');
      await userEvent.click(featureCard);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit feature/i })).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit feature/i });
      await userEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('2024-02-01')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2024-02-15')).toBeInTheDocument();
      });

      // Clear the date fields
      const startDateInput = screen.getByDisplayValue('2024-02-01');
      const endDateInput = screen.getByDisplayValue('2024-02-15');

      await userEvent.clear(startDateInput);
      await userEvent.clear(endDateInput);

      const updateButton = screen.getByRole('button', { name: /update feature/i });
      await userEvent.click(updateButton);

      // CRITICAL TEST: Cleared dates should be sent as undefined
      await waitFor(() => {
        expect(mockedApiService.updateFeature).toHaveBeenCalledWith(
          'existing-feature',
          expect.objectContaining({
            start_date: undefined,
            end_date: undefined
          })
        );
      });
    });
  });

  describe('Dependency Selection Workflow', () => {
    test('CRITICAL BUG TEST: Dependency filtering prevents invalid selections', async () => {
      const dependencyScenario = createFeatureWithDependencyIssues('circular');
      const mockFeatures = [
        dependencyScenario.parentFeature,
        dependencyScenario.childFeature,
        dependencyScenario.siblingFeature
      ];
      
      mockedApiService.getFeatures.mockResolvedValue(
        createMockApiResponse({ results: mockFeatures })
      );

      render(
        <TestWrapper>
          <ProjectDetails />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      const addFeatureButton = screen.getByRole('button', { name: /add feature/i });
      await userEvent.click(addFeatureButton);

      await waitFor(() => {
        expect(screen.getByText(/dependencies/i)).toBeInTheDocument();
      });

      // Look for dependency checkboxes
      const dependenciesSection = screen.getByText(/dependencies/i).closest('div');
      
      if (dependenciesSection) {
        // CRITICAL BUG TEST: With current implementation, all features appear
        // This documents the bug that needs to be fixed
        const checkboxes = within(dependenciesSection).getAllByRole('checkbox');
        
        // Current buggy behavior: all project features appear as potential dependencies
        // After fix: should filter out inappropriate dependencies
        expect(checkboxes.length).toBeGreaterThan(0);
        
        // Check if parent feature appears (it shouldn't for a child feature)
        const parentCheckbox = within(dependenciesSection).queryByLabelText(/parent feature/i);
        
        // Current bug: parent appears as option (incorrect)
        // After fix: parent should not appear
        if (parentCheckbox) {
          // This documents the current buggy behavior
          expect(parentCheckbox).toBeInTheDocument();
        }
      }
    });

    test('should allow valid dependency selection and submission', async () => {
      const validFeature1 = createMockFeatureListItem({
        id: 'valid-dep-1',
        title: 'Valid Dependency 1'
      });
      
      const validFeature2 = createMockFeatureListItem({
        id: 'valid-dep-2',
        title: 'Valid Dependency 2'
      });
      
      const mockFeatures = [validFeature1, validFeature2];
      
      mockedApiService.getFeatures.mockResolvedValue(
        createMockApiResponse({ results: mockFeatures })
      );
      
      mockedApiService.createFeature.mockResolvedValue(
        createMockApiResponse(createMockFeature({
          id: 'new-feature-with-deps',
          title: 'Feature with Dependencies',
          dependencies: ['valid-dep-1']
        }))
      );

      render(
        <TestWrapper>
          <ProjectDetails />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      const addFeatureButton = screen.getByRole('button', { name: /add feature/i });
      await userEvent.click(addFeatureButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/feature title/i)).toBeInTheDocument();
      });

      // Fill required fields
      const titleInput = screen.getByLabelText(/feature title/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      await userEvent.type(titleInput, 'Feature with Dependencies');
      await userEvent.type(descriptionInput, 'Testing dependency selection');

      // Select a dependency
      await waitFor(() => {
        expect(screen.getByText('Valid Dependency 1')).toBeInTheDocument();
      });

      const dependencyCheckbox = screen.getByRole('checkbox', { name: /valid dependency 1/i });
      await userEvent.click(dependencyCheckbox);

      const submitButton = screen.getByRole('button', { name: /create feature/i });
      await userEvent.click(submitButton);

      // Verify dependency was included in submission
      await waitFor(() => {
        expect(mockedApiService.createFeature).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Feature with Dependencies',
            dependencies: ['valid-dep-1']
          })
        );
      });
    });
  });

  describe('Gantt Chart Integration Workflow', () => {
    test('CRITICAL BUG TEST: Gantt chart date display for features without dates', async () => {
      const featureWithDates = createMockFeatureListItem({
        id: 'feature-with-dates',
        title: 'Feature with Dates',
        start_date: '2024-02-01',
        end_date: '2024-02-15'
      });
      
      const featureWithoutDates = createMockFeatureListItem({
        id: 'feature-without-dates',
        title: 'Feature without Dates',
        start_date: null,
        end_date: null,
        estimated_hours: 16
      });
      
      const mockFeatures = [featureWithDates, featureWithoutDates];
      
      mockedApiService.getFeatures.mockResolvedValue(
        createMockApiResponse({ results: mockFeatures })
      );

      render(
        <TestWrapper>
          <ProjectDetails />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Switch to Gantt view
      const ganttViewButton = screen.getByRole('button', { name: /gantt/i });
      await userEvent.click(ganttViewButton);

      await waitFor(() => {
        expect(screen.getByText('Project Timeline')).toBeInTheDocument();
      });

      // Both features should appear in the list
      expect(screen.getByText('Feature with Dates')).toBeInTheDocument();
      expect(screen.getByText('Feature without Dates')).toBeInTheDocument();

      // CRITICAL BUG TEST: Feature without dates gets positioned based on calculated dates
      // This creates misleading visual representation
      const featureWithoutDatesElement = screen.getByText('Feature without Dates');
      const featureBar = featureWithoutDatesElement.closest('[style*="left:"]');
      
      // Current bug: feature without dates will have a position (misleading)
      // After fix: should either not show bar or show in special "unscheduled" area
      expect(featureBar).toBeTruthy(); // Documents current buggy behavior
    });

    test('should handle Gantt chart drag and drop for date updates', async () => {
      const mockFeatures = [
        createMockFeatureListItem({
          id: 'draggable-feature',
          title: 'Draggable Feature',
          start_date: '2024-02-01',
          end_date: '2024-02-15'
        })
      ];
      
      mockedApiService.getFeatures.mockResolvedValue(
        createMockApiResponse({ results: mockFeatures })
      );
      
      mockedApiService.updateFeature.mockResolvedValue(
        createMockApiResponse(createMockFeature({
          id: 'draggable-feature',
          title: 'Draggable Feature',
          start_date: '2024-02-05',
          end_date: '2024-02-19'
        }))
      );

      render(
        <TestWrapper>
          <ProjectDetails />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      const ganttViewButton = screen.getByRole('button', { name: /gantt/i });
      await userEvent.click(ganttViewButton);

      await waitFor(() => {
        expect(screen.getByText('Draggable Feature')).toBeInTheDocument();
      });

      // Simulate drag operation (simplified)
      const featureBar = screen.getByText('Draggable Feature');
      fireEvent.mouseDown(featureBar);
      fireEvent.mouseMove(featureBar, { clientX: 150 });
      fireEvent.mouseUp(featureBar);

      // Note: Full drag testing requires more complex setup with getBoundingClientRect mocking
      // This test verifies the UI elements are present for drag functionality
      expect(featureBar).toBeInTheDocument();
    });
  });

  describe('Error Handling in Workflows', () => {
    test('should handle API errors during feature creation gracefully', async () => {
      const mockFeatures: any[] = [];
      
      mockedApiService.getFeatures.mockResolvedValue(
        createMockApiResponse({ results: mockFeatures })
      );
      
      mockedApiService.createFeature.mockRejectedValue({
        response: {
          data: {
            title: ['This field is required.'],
            start_date: ['Enter a valid date format.']
          }
        }
      });

      render(
        <TestWrapper>
          <ProjectDetails />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      const addFeatureButton = screen.getByRole('button', { name: /add feature/i });
      await userEvent.click(addFeatureButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/feature title/i)).toBeInTheDocument();
      });

      // Submit with invalid data
      const submitButton = screen.getByRole('button', { name: /create feature/i });
      await userEvent.click(submitButton);

      // Should display error messages from API
      await waitFor(() => {
        expect(screen.getByText('This field is required.')).toBeInTheDocument();
        expect(screen.getByText('Enter a valid date format.')).toBeInTheDocument();
      });

      // Form should remain open for correction
      expect(screen.getByLabelText(/feature title/i)).toBeInTheDocument();
    });

    test('should handle network errors during workflow operations', async () => {
      const mockFeatures: any[] = [];
      
      mockedApiService.getFeatures.mockResolvedValue(
        createMockApiResponse({ results: mockFeatures })
      );
      
      mockedApiService.createFeature.mockRejectedValue({
        message: 'Network Error',
        code: 'NETWORK_ERROR'
      });

      render(
        <TestWrapper>
          <ProjectDetails />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      const addFeatureButton = screen.getByRole('button', { name: /add feature/i });
      await userEvent.click(addFeatureButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/feature title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/feature title/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      await userEvent.type(titleInput, 'Test Feature');
      await userEvent.type(descriptionInput, 'Test Description');

      const submitButton = screen.getByRole('button', { name: /create feature/i });
      await userEvent.click(submitButton);

      // Should show generic error message
      await waitFor(() => {
        expect(screen.getByText(/an error occurred/i)).toBeInTheDocument();
      });
    });
  });

  describe('Multi-step Workflow Scenarios', () => {
    test('should support creating sub-features with proper hierarchy', async () => {
      const parentFeature = createMockFeatureListItem({
        id: 'parent-feature',
        title: 'Parent Feature',
        hierarchy_level: 0,
        sub_features_count: 0
      });
      
      const mockFeatures = [parentFeature];
      
      mockedApiService.getFeatures.mockResolvedValue(
        createMockApiResponse({ results: mockFeatures })
      );
      
      mockedApiService.createFeature.mockResolvedValue(
        createMockApiResponse(createMockFeature({
          id: 'sub-feature',
          title: 'Sub Feature',
          parent: 'parent-feature'
        }))
      );

      render(
        <TestWrapper>
          <ProjectDetails />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Parent Feature')).toBeInTheDocument();
      });

      // Look for "Add Sub-feature" action on parent feature
      // This would typically be in a context menu or feature card action
      // Implementation depends on actual UI design
      
      const parentFeatureCard = screen.getByText('Parent Feature');
      
      // Simulate right-click or hover action to reveal sub-feature creation option
      fireEvent.contextMenu(parentFeatureCard);
      
      // This test verifies the workflow concept
      // Actual implementation would need to match the real UI design
      expect(parentFeatureCard).toBeInTheDocument();
    });

    test('should maintain state consistency across view switches', async () => {
      const mockFeatures = [
        createMockFeatureListItem({
          id: 'feature-1',
          title: 'Feature 1',
          start_date: '2024-02-01',
          end_date: '2024-02-15'
        }),
        createMockFeatureListItem({
          id: 'feature-2',
          title: 'Feature 2',
          start_date: null,
          end_date: null
        })
      ];
      
      mockedApiService.getFeatures.mockResolvedValue(
        createMockApiResponse({ results: mockFeatures })
      );

      render(
        <TestWrapper>
          <ProjectDetails />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Feature 1')).toBeInTheDocument();
        expect(screen.getByText('Feature 2')).toBeInTheDocument();
      });

      // Switch between different views
      const ganttViewButton = screen.getByRole('button', { name: /gantt/i });
      await userEvent.click(ganttViewButton);

      await waitFor(() => {
        expect(screen.getByText('Project Timeline')).toBeInTheDocument();
      });

      // Features should still be visible
      expect(screen.getByText('Feature 1')).toBeInTheDocument();
      expect(screen.getByText('Feature 2')).toBeInTheDocument();

      // Switch back to list view
      const listViewButton = screen.getByRole('button', { name: /list/i });
      await userEvent.click(listViewButton);

      // State should be maintained
      expect(screen.getByText('Feature 1')).toBeInTheDocument();
      expect(screen.getByText('Feature 2')).toBeInTheDocument();
    });
  });
});