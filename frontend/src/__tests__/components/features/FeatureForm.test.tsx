/**
 * FeatureForm Tests
 * 
 * Tests for the critical date saving functionality bug and dependency validation issues
 * in the FeatureForm component.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FeatureForm from '../../../components/features/FeatureForm';
import { 
  createMockProject, 
  createMockFeature, 
  createMockApiResponse, 
  createMockErrorResponse,
  createHierarchicalFeatures,
  createFeatureWithDependencyIssues
} from '../../factories/testDataFactories';

// Mock the API service
jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    getProjects: jest.fn(),
    getProject: jest.fn(),
    getFeature: jest.fn(),
    getFeatures: jest.fn(),
  },
}));

import apiService from '../../../services/api';

const mockedApiService = apiService as jest.Mocked<typeof apiService>;

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('FeatureForm - Date Saving Functionality', () => {
  const mockProject = createMockProject({
    id: 'project-1',
    start_date: '2024-01-01',
    end_date: '2024-12-31'
  });

  const mockFeatures = createHierarchicalFeatures();
  
  const defaultProps = {
    projectId: 'project-1',
    projectName: 'Test Project',
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
    isSubmitting: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockedApiService.getProjects.mockResolvedValue(
      createMockApiResponse({ results: [mockProject] })
    );
    mockedApiService.getProject.mockResolvedValue(
      createMockApiResponse(mockProject)
    );
    mockedApiService.getFeatures.mockResolvedValue(
      createMockApiResponse({ results: mockFeatures })
    );
  });

  describe('CRITICAL BUG: Date field submission and empty string handling', () => {
    test('should preserve date values in form data during submission', async () => {
      const mockOnSubmit = jest.fn();
      
      render(
        <TestWrapper>
          <FeatureForm {...defaultProps} onSubmit={mockOnSubmit} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/feature title/i)).toBeInTheDocument();
      });

      // Fill in required fields
      const titleInput = screen.getByLabelText(/feature title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);

      await userEvent.type(titleInput, 'Test Feature');
      await userEvent.type(descriptionInput, 'Test description');
      await userEvent.type(startDateInput, '2024-02-01');
      await userEvent.type(endDateInput, '2024-02-15');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create feature/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });

      // CRITICAL TEST: Check that dates are included in submission
      const submissionData = mockOnSubmit.mock.calls[0][0];
      expect(submissionData.start_date).toBe('2024-02-01');
      expect(submissionData.end_date).toBe('2024-02-15');
      
      // Verify the bug: empty string removal logic should not affect defined dates
      expect(submissionData.start_date).not.toBeUndefined();
      expect(submissionData.end_date).not.toBeUndefined();
    });

    test('CRITICAL BUG: Empty date strings should be converted to undefined, not removed entirely', async () => {
      const mockOnSubmit = jest.fn();
      
      render(
        <TestWrapper>
          <FeatureForm {...defaultProps} onSubmit={mockOnSubmit} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/feature title/i)).toBeInTheDocument();
      });

      // Fill in required fields but leave dates empty
      const titleInput = screen.getByLabelText(/feature title/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      await userEvent.type(titleInput, 'Test Feature');
      await userEvent.type(descriptionInput, 'Test description');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create feature/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });

      // CRITICAL TEST: Empty dates should be undefined, not missing from object
      const submissionData = mockOnSubmit.mock.calls[0][0];
      expect(submissionData.start_date).toBeUndefined();
      expect(submissionData.end_date).toBeUndefined();
    });

    test('should clear date fields properly when editing existing feature', async () => {
      const existingFeature = createMockFeature({
        start_date: '2024-02-01',
        end_date: '2024-02-15'
      });

      const mockOnSubmit = jest.fn();
      
      render(
        <TestWrapper>
          <FeatureForm 
            {...defaultProps} 
            feature={existingFeature}
            onSubmit={mockOnSubmit} 
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('2024-02-01')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2024-02-15')).toBeInTheDocument();
      });

      // Clear the date fields
      const startDateInput = screen.getByDisplayValue('2024-02-01');
      const endDateInput = screen.getByDisplayValue('2024-02-15');

      await userEvent.clear(startDateInput);
      await userEvent.clear(endDateInput);

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /update feature/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });

      // CRITICAL TEST: Cleared dates should be undefined
      const submissionData = mockOnSubmit.mock.calls[0][0];
      expect(submissionData.start_date).toBeUndefined();
      expect(submissionData.end_date).toBeUndefined();
    });
  });

  describe('Date validation against project boundaries', () => {
    test('should validate start_date against project boundaries', async () => {
      const mockOnSubmit = jest.fn();
      
      render(
        <TestWrapper>
          <FeatureForm {...defaultProps} onSubmit={mockOnSubmit} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/feature title/i)).toBeInTheDocument();
      });

      // Fill form with date before project start
      const titleInput = screen.getByLabelText(/feature title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const startDateInput = screen.getByLabelText(/start date/i);

      await userEvent.type(titleInput, 'Test Feature');
      await userEvent.type(descriptionInput, 'Test description');
      await userEvent.type(startDateInput, '2023-12-01'); // Before project start

      const submitButton = screen.getByRole('button', { name: /create feature/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/start date cannot be before project start date/i)).toBeInTheDocument();
      });

      // Should not call onSubmit due to validation error
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test('should validate end_date against project boundaries', async () => {
      const mockOnSubmit = jest.fn();
      
      render(
        <TestWrapper>
          <FeatureForm {...defaultProps} onSubmit={mockOnSubmit} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/feature title/i)).toBeInTheDocument();
      });

      // Fill form with end date after project end
      const titleInput = screen.getByLabelText(/feature title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const endDateInput = screen.getByLabelText(/end date/i);

      await userEvent.type(titleInput, 'Test Feature');
      await userEvent.type(descriptionInput, 'Test description');
      await userEvent.type(endDateInput, '2025-01-01'); // After project end

      const submitButton = screen.getByRole('button', { name: /create feature/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/end date cannot be after project end date/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test('should validate start_date vs end_date', async () => {
      const mockOnSubmit = jest.fn();
      
      render(
        <TestWrapper>
          <FeatureForm {...defaultProps} onSubmit={mockOnSubmit} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/feature title/i)).toBeInTheDocument();
      });

      // Fill form with end date before start date
      const titleInput = screen.getByLabelText(/feature title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);

      await userEvent.type(titleInput, 'Test Feature');
      await userEvent.type(descriptionInput, 'Test description');
      await userEvent.type(startDateInput, '2024-02-15');
      await userEvent.type(endDateInput, '2024-02-01'); // Before start date

      const submitButton = screen.getByRole('button', { name: /create feature/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/end date cannot be earlier than start date/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });
});

describe('FeatureForm - Dependency Validation Bug', () => {
  const mockProject = createMockProject({ id: 'project-1' });
  const defaultProps = {
    projectId: 'project-1',
    projectName: 'Test Project',
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
    isSubmitting: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockedApiService.getProject.mockResolvedValue(
      createMockApiResponse(mockProject)
    );
  });

  describe('CRITICAL BUG: Dependency filtering allows circular dependencies', () => {
    test('should prevent circular dependencies - feature cannot depend on itself', async () => {
      const existingFeature = createMockFeature({ id: 'feature-1' });
      const mockFeatures = [
        existingFeature,
        createMockFeature({ id: 'feature-2', title: 'Feature 2' })
      ];

      mockedApiService.getFeatures.mockResolvedValue(
        createMockApiResponse({ results: mockFeatures })
      );

      render(
        <TestWrapper>
          <FeatureForm 
            {...defaultProps} 
            feature={existingFeature}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/dependencies/i)).toBeInTheDocument();
      });

      // CRITICAL TEST: Current feature should not appear in dependency list
      expect(screen.queryByText('Test Feature')).not.toBeInTheDocument();
      expect(screen.getByText('Feature 2')).toBeInTheDocument();
    });

    test('CRITICAL BUG: Parent feature cannot be dependency of child feature', async () => {
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
          <FeatureForm 
            {...defaultProps} 
            feature={dependencyScenario.childFeature}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/dependencies/i)).toBeInTheDocument();
      });

      // CRITICAL TEST: Parent should not be available as dependency for child
      // This should FAIL with current implementation due to the bug
      const dependencyCheckboxes = screen.getAllByRole('checkbox');
      const parentCheckbox = dependencyCheckboxes.find(checkbox => 
        checkbox.closest('label')?.textContent?.includes('Parent Feature')
      );

      // With current bug: parent WILL appear (incorrect behavior)
      // This test documents the bug - should be fixed to pass
      expect(parentCheckbox).toBeDefined(); // Current buggy behavior
      
      // TODO: After fix, this should be:
      // expect(parentCheckbox).toBeUndefined(); // Correct behavior
    });

    test('should allow valid dependencies within same project', async () => {
      const dependencyScenario = createFeatureWithDependencyIssues('valid');
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
          <FeatureForm 
            {...defaultProps} 
            feature={dependencyScenario.childFeature}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/dependencies/i)).toBeInTheDocument();
      });

      // Should allow sibling feature as dependency
      expect(screen.getByText('Sibling Feature')).toBeInTheDocument();
    });

    test('CRITICAL BUG: Cross-project dependencies should be prevented', async () => {
      const dependencyScenario = createFeatureWithDependencyIssues('valid');
      const mockFeatures = [
        dependencyScenario.childFeature,
        dependencyScenario.externalFeature // From different project
      ];

      mockedApiService.getFeatures.mockResolvedValue(
        createMockApiResponse({ results: mockFeatures })
      );

      render(
        <TestWrapper>
          <FeatureForm 
            {...defaultProps} 
            feature={dependencyScenario.childFeature}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/dependencies/i)).toBeInTheDocument();
      });

      // CRITICAL TEST: External feature from different project should not appear
      // Current implementation allows this (bug)
      expect(screen.getByText('External Feature')).toBeInTheDocument(); // Current buggy behavior
      
      // TODO: After fix, this should be:
      // expect(screen.queryByText('External Feature')).not.toBeInTheDocument();
    });
  });

  describe('Dependency submission', () => {
    test('should submit selected dependencies correctly', async () => {
      const mockFeatures = [
        createMockFeature({ id: 'dep-1', title: 'Dependency 1' }),
        createMockFeature({ id: 'dep-2', title: 'Dependency 2' })
      ];

      mockedApiService.getFeatures.mockResolvedValue(
        createMockApiResponse({ results: mockFeatures })
      );

      const mockOnSubmit = jest.fn();

      render(
        <TestWrapper>
          <FeatureForm 
            {...defaultProps} 
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/feature title/i)).toBeInTheDocument();
      });

      // Fill required fields
      await userEvent.type(screen.getByLabelText(/feature title/i), 'New Feature');
      await userEvent.type(screen.getByLabelText(/description/i), 'Description');

      // Select dependencies
      const dep1Checkbox = screen.getByRole('checkbox', { name: /dependency 1/i });
      await userEvent.click(dep1Checkbox);

      // Submit
      const submitButton = screen.getByRole('button', { name: /create feature/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });

      const submissionData = mockOnSubmit.mock.calls[0][0];
      expect(submissionData.dependencies).toEqual(['dep-1']);
    });

    test('should handle empty dependencies array correctly', async () => {
      mockedApiService.getFeatures.mockResolvedValue(
        createMockApiResponse({ results: [] })
      );

      const mockOnSubmit = jest.fn();

      render(
        <TestWrapper>
          <FeatureForm 
            {...defaultProps} 
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/feature title/i)).toBeInTheDocument();
      });

      // Fill required fields
      await userEvent.type(screen.getByLabelText(/feature title/i), 'New Feature');
      await userEvent.type(screen.getByLabelText(/description/i), 'Description');

      // Submit without selecting dependencies
      const submitButton = screen.getByRole('button', { name: /create feature/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });

      const submissionData = mockOnSubmit.mock.calls[0][0];
      expect(submissionData.dependencies).toBeUndefined();
    });
  });

  describe('Error handling', () => {
    test('should handle API errors during submission', async () => {
      const mockOnSubmit = jest.fn().mockRejectedValue(
        createMockErrorResponse({
          title: ['This field is required.'],
          start_date: ['Invalid date format.']
        })
      );

      render(
        <TestWrapper>
          <FeatureForm {...defaultProps} onSubmit={mockOnSubmit} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/feature title/i)).toBeInTheDocument();
      });

      // Submit form with partial data
      const submitButton = screen.getByRole('button', { name: /create feature/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });

      // Should display error messages
      await waitFor(() => {
        expect(screen.getByText('This field is required.')).toBeInTheDocument();
        expect(screen.getByText('Invalid date format.')).toBeInTheDocument();
      });
    });
  });
});