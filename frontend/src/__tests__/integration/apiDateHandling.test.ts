/**
 * API Date Handling Integration Tests
 * 
 * Tests for the critical date saving functionality bug where date fields
 * are properly captured but may be lost during form submission processing.
 */

import apiService from '../../services/api';
import { 
  createMockApiResponse, 
  createMockErrorResponse, 
  createFeatureRequest, 
  createUpdateFeatureRequest, 
  createMockFeature 
} from '../factories/testDataFactories';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Date Handling Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock axios.create to return a mock instance
    mockedAxios.create.mockReturnValue(mockedAxios);
    
    // Mock interceptors
    mockedAxios.interceptors = {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    } as any;
  });

  describe('Feature Creation with Dates', () => {
    test('CRITICAL BUG: Should preserve date fields during feature creation', async () => {
      const featureRequest = createFeatureRequest('valid');
      const expectedResponse = createMockFeature({
        start_date: featureRequest.start_date,
        end_date: featureRequest.end_date
      });

      mockedAxios.post.mockResolvedValue(createMockApiResponse(expectedResponse));

      const response = await apiService.createFeature(featureRequest);

      // Verify the request was made with correct date fields
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/features/', {
        project: 'project-1',
        title: 'New Feature',
        description: 'A new feature request',
        priority: 'medium',
        assignee_email: 'assignee@example.com',
        estimated_hours: 10,
        start_date: '2024-02-01',
        end_date: '2024-02-15',
        order: 0
      });

      // CRITICAL TEST: Response should include the date fields
      expect(response.data.start_date).toBe('2024-02-01');
      expect(response.data.end_date).toBe('2024-02-15');
    });

    test('should handle empty date strings in feature creation', async () => {
      const featureRequest = createFeatureRequest('empty-dates');
      const expectedResponse = createMockFeature({
        start_date: null,
        end_date: null
      });

      mockedAxios.post.mockResolvedValue(createMockApiResponse(expectedResponse));

      const response = await apiService.createFeature(featureRequest);

      // Empty strings should be converted to undefined/null
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/features/', 
        expect.objectContaining({
          start_date: '',
          end_date: ''
        })
      );

      // API should handle empty strings gracefully
      expect(response.data.start_date).toBeNull();
      expect(response.data.end_date).toBeNull();
    });

    test('should handle missing date fields in feature creation', async () => {
      const featureRequest = createFeatureRequest('valid');
      delete (featureRequest as any).start_date;
      delete (featureRequest as any).end_date;

      const expectedResponse = createMockFeature({
        start_date: null,
        end_date: null
      });

      mockedAxios.post.mockResolvedValue(createMockApiResponse(expectedResponse));

      const response = await apiService.createFeature(featureRequest);

      // Should not include date fields when they're not provided
      const requestData = mockedAxios.post.mock.calls[0][1];
      expect(requestData).not.toHaveProperty('start_date');
      expect(requestData).not.toHaveProperty('end_date');

      expect(response.data.start_date).toBeNull();
      expect(response.data.end_date).toBeNull();
    });

    test('should handle invalid date formats in feature creation', async () => {
      const featureRequest = {
        ...createFeatureRequest('valid'),
        start_date: 'invalid-date',
        end_date: '2024-13-45' // Invalid date
      };

      const errorResponse = createMockErrorResponse({
        start_date: ['Enter a valid date format.'],
        end_date: ['Enter a valid date format.']
      });

      mockedAxios.post.mockRejectedValue(errorResponse);

      await expect(apiService.createFeature(featureRequest)).rejects.toMatchObject({
        response: {
          data: {
            start_date: ['Enter a valid date format.'],
            end_date: ['Enter a valid date format.']
          }
        }
      });
    });

    test('should validate date ranges in feature creation', async () => {
      const featureRequest = createFeatureRequest('invalid-dates');

      const errorResponse = createMockErrorResponse({
        non_field_errors: ['End date must be after start date.']
      });

      mockedAxios.post.mockRejectedValue(errorResponse);

      await expect(apiService.createFeature(featureRequest)).rejects.toMatchObject({
        response: {
          data: {
            non_field_errors: ['End date must be after start date.']
          }
        }
      });
    });
  });

  describe('Feature Updates with Dates', () => {
    test('CRITICAL BUG: Should preserve date fields during feature updates', async () => {
      const updateRequest = createUpdateFeatureRequest('update-dates');
      const expectedResponse = createMockFeature({
        start_date: updateRequest.start_date,
        end_date: updateRequest.end_date
      });

      mockedAxios.patch.mockResolvedValue(createMockApiResponse(expectedResponse));

      const response = await apiService.updateFeature('feature-1', updateRequest);

      // Verify the request was made with correct date fields
      expect(mockedAxios.patch).toHaveBeenCalledWith('/api/features/feature-1/', {
        title: 'Updated Feature',
        start_date: '2024-03-01',
        end_date: '2024-03-15'
      });

      // CRITICAL TEST: Response should reflect updated dates
      expect(response.data.start_date).toBe('2024-03-01');
      expect(response.data.end_date).toBe('2024-03-15');
    });

    test('should handle clearing dates in feature updates', async () => {
      const updateRequest = createUpdateFeatureRequest('clear-dates');
      const expectedResponse = createMockFeature({
        title: 'Updated Feature',
        start_date: null,
        end_date: null
      });

      mockedAxios.patch.mockResolvedValue(createMockApiResponse(expectedResponse));

      const response = await apiService.updateFeature('feature-1', updateRequest);

      // Should send undefined for cleared dates
      expect(mockedAxios.patch).toHaveBeenCalledWith('/api/features/feature-1/', {
        title: 'Updated Feature',
        start_date: undefined,
        end_date: undefined
      });

      // API should clear the dates
      expect(response.data.start_date).toBeNull();
      expect(response.data.end_date).toBeNull();
    });

    test('should handle partial date updates', async () => {
      const updateRequest = {
        title: 'Updated Feature',
        start_date: '2024-03-01'
        // end_date not provided
      };

      const expectedResponse = createMockFeature({
        title: 'Updated Feature',
        start_date: '2024-03-01',
        end_date: '2024-02-15' // Original end date preserved
      });

      mockedAxios.patch.mockResolvedValue(createMockApiResponse(expectedResponse));

      const response = await apiService.updateFeature('feature-1', updateRequest);

      // Should only send the fields being updated
      expect(mockedAxios.patch).toHaveBeenCalledWith('/api/features/feature-1/', {
        title: 'Updated Feature',
        start_date: '2024-03-01'
      });

      // API should preserve existing end_date when not provided
      expect(response.data.start_date).toBe('2024-03-01');
      expect(response.data.end_date).toBe('2024-02-15');
    });

    test('should handle date validation errors in updates', async () => {
      const updateRequest = createUpdateFeatureRequest('invalid-dates');

      const errorResponse = createMockErrorResponse({
        non_field_errors: ['End date must be after start date.']
      });

      mockedAxios.patch.mockRejectedValue(errorResponse);

      await expect(apiService.updateFeature('feature-1', updateRequest)).rejects.toMatchObject({
        response: {
          data: {
            non_field_errors: ['End date must be after start date.']
          }
        }
      });
    });

    test('CRITICAL BUG: Gantt drag and drop date updates', async () => {
      // Simulate drag and drop date update from Gantt chart
      const dateUpdate = {
        start_date: '2024-03-05',
        end_date: '2024-03-12'
      };

      const expectedResponse = createMockFeature({
        start_date: dateUpdate.start_date,
        end_date: dateUpdate.end_date
      });

      mockedAxios.patch.mockResolvedValue(createMockApiResponse(expectedResponse));

      const response = await apiService.updateFeature('feature-1', dateUpdate);

      // CRITICAL TEST: Drag and drop updates should preserve exact date values
      expect(mockedAxios.patch).toHaveBeenCalledWith('/api/features/feature-1/', {
        start_date: '2024-03-05',
        end_date: '2024-03-12'
      });

      expect(response.data.start_date).toBe('2024-03-05');
      expect(response.data.end_date).toBe('2024-03-12');
    });
  });

  describe('Feature Retrieval with Dates', () => {
    test('should retrieve features with correct date formatting', async () => {
      const mockFeature = createMockFeature({
        start_date: '2024-02-01',
        end_date: '2024-02-15'
      });

      mockedAxios.get.mockResolvedValue(createMockApiResponse(mockFeature));

      const response = await apiService.getFeature('feature-1');

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/features/feature-1/');
      
      // Dates should be in ISO format (YYYY-MM-DD)
      expect(response.data.start_date).toBe('2024-02-01');
      expect(response.data.end_date).toBe('2024-02-15');
    });

    test('should handle features with null dates', async () => {
      const mockFeature = createMockFeature({
        start_date: null,
        end_date: null
      });

      mockedAxios.get.mockResolvedValue(createMockApiResponse(mockFeature));

      const response = await apiService.getFeature('feature-1');

      expect(response.data.start_date).toBeNull();
      expect(response.data.end_date).toBeNull();
    });

    test('should retrieve feature list with mixed date scenarios', async () => {
      const mockFeatures = [
        createMockFeature({
          id: 'feature-1',
          start_date: '2024-02-01',
          end_date: '2024-02-15'
        }),
        createMockFeature({
          id: 'feature-2',
          start_date: null,
          end_date: null
        }),
        createMockFeature({
          id: 'feature-3',
          start_date: '2024-02-10',
          end_date: null
        })
      ];

      mockedAxios.get.mockResolvedValue(createMockApiResponse({
        results: mockFeatures,
        count: 3,
        next: null,
        previous: null
      }));

      const response = await apiService.getFeatures({ project: 'project-1' });

      expect(response.data.results).toHaveLength(3);
      expect(response.data.results[0].start_date).toBe('2024-02-01');
      expect(response.data.results[1].start_date).toBeNull();
      expect(response.data.results[2].end_date).toBeNull();
    });
  });

  describe('Date Field Edge Cases', () => {
    test('should handle timezone considerations', async () => {
      const featureRequest = createFeatureRequest('valid');
      featureRequest.start_date = '2024-02-01'; // Date only, no time
      featureRequest.end_date = '2024-02-15';

      const expectedResponse = createMockFeature({
        start_date: '2024-02-01',
        end_date: '2024-02-15'
      });

      mockedAxios.post.mockResolvedValue(createMockApiResponse(expectedResponse));

      const response = await apiService.createFeature(featureRequest);

      // Dates should be handled as date-only (no time component)
      expect(response.data.start_date).toBe('2024-02-01');
      expect(response.data.end_date).toBe('2024-02-15');
    });

    test('should handle leap year dates correctly', async () => {
      const featureRequest = createFeatureRequest('valid');
      featureRequest.start_date = '2024-02-29'; // Leap year
      featureRequest.end_date = '2024-03-01';

      const expectedResponse = createMockFeature({
        start_date: '2024-02-29',
        end_date: '2024-03-01'
      });

      mockedAxios.post.mockResolvedValue(createMockApiResponse(expectedResponse));

      const response = await apiService.createFeature(featureRequest);

      expect(response.data.start_date).toBe('2024-02-29');
      expect(response.data.end_date).toBe('2024-03-01');
    });

    test('should handle year boundary dates', async () => {
      const featureRequest = createFeatureRequest('valid');
      featureRequest.start_date = '2023-12-31';
      featureRequest.end_date = '2024-01-02';

      const expectedResponse = createMockFeature({
        start_date: '2023-12-31',
        end_date: '2024-01-02'
      });

      mockedAxios.post.mockResolvedValue(createMockApiResponse(expectedResponse));

      const response = await apiService.createFeature(featureRequest);

      expect(response.data.start_date).toBe('2023-12-31');
      expect(response.data.end_date).toBe('2024-01-02');
    });
  });

  describe('Project Date Validation Integration', () => {
    test('should validate feature dates against project boundaries', async () => {
      const featureRequest = createFeatureRequest('valid');
      featureRequest.start_date = '2023-01-01'; // Before project start

      const errorResponse = createMockErrorResponse({
        start_date: ['Feature start date cannot be before project start date.']
      });

      mockedAxios.post.mockRejectedValue(errorResponse);

      await expect(apiService.createFeature(featureRequest)).rejects.toMatchObject({
        response: {
          data: {
            start_date: ['Feature start date cannot be before project start date.']
          }
        }
      });
    });

    test('should validate feature end date against project deadline', async () => {
      const featureRequest = createFeatureRequest('valid');
      featureRequest.end_date = '2025-12-31'; // After project deadline

      const errorResponse = createMockErrorResponse({
        end_date: ['Feature end date cannot be after project deadline.']
      });

      mockedAxios.post.mockRejectedValue(errorResponse);

      await expect(apiService.createFeature(featureRequest)).rejects.toMatchObject({
        response: {
          data: {
            end_date: ['Feature end date cannot be after project deadline.']
          }
        }
      });
    });
  });

  describe('Network and Error Handling', () => {
    test('should handle network timeouts during date operations', async () => {
      const featureRequest = createFeatureRequest('valid');

      const networkError = {
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
        isAxiosError: true
      };

      mockedAxios.post.mockRejectedValue(networkError);

      await expect(apiService.createFeature(featureRequest)).rejects.toMatchObject({
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded'
      });
    });

    test('should handle server errors during date operations', async () => {
      const featureRequest = createFeatureRequest('valid');

      const serverError = {
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { detail: 'Database connection failed' }
        },
        isAxiosError: true
      };

      mockedAxios.post.mockRejectedValue(serverError);

      await expect(apiService.createFeature(featureRequest)).rejects.toMatchObject({
        response: {
          status: 500,
          data: { detail: 'Database connection failed' }
        }
      });
    });

    test('should handle malformed response data', async () => {
      const featureRequest = createFeatureRequest('valid');

      // Response with malformed date format
      const malformedResponse = createMockApiResponse({
        ...createMockFeature(),
        start_date: 'invalid-date-format',
        end_date: '2024-02-30' // Invalid date
      });

      mockedAxios.post.mockResolvedValue(malformedResponse);

      const response = await apiService.createFeature(featureRequest);

      // Should receive the malformed data (client should handle validation)
      expect(response.data.start_date).toBe('invalid-date-format');
      expect(response.data.end_date).toBe('2024-02-30');
    });
  });

  describe('Concurrent Date Operations', () => {
    test('should handle concurrent date updates to same feature', async () => {
      const update1 = { start_date: '2024-03-01' };
      const update2 = { end_date: '2024-03-15' };

      const response1 = createMockApiResponse(createMockFeature({
        start_date: '2024-03-01',
        updated_at: '2024-01-01T10:00:00Z'
      }));

      const response2 = createMockApiResponse(createMockFeature({
        end_date: '2024-03-15',
        updated_at: '2024-01-01T10:01:00Z'
      }));

      mockedAxios.patch
        .mockResolvedValueOnce(response1)
        .mockResolvedValueOnce(response2);

      const [result1, result2] = await Promise.all([
        apiService.updateFeature('feature-1', update1),
        apiService.updateFeature('feature-1', update2)
      ]);

      expect(result1.data.start_date).toBe('2024-03-01');
      expect(result2.data.end_date).toBe('2024-03-15');
    });

    test('should handle optimistic concurrency conflicts', async () => {
      const updateRequest = { start_date: '2024-03-01' };

      const conflictError = {
        response: {
          status: 409,
          statusText: 'Conflict',
          data: { 
            detail: 'The feature was updated by another user. Please refresh and try again.',
            version_conflict: true 
          }
        },
        isAxiosError: true
      };

      mockedAxios.patch.mockRejectedValue(conflictError);

      await expect(apiService.updateFeature('feature-1', updateRequest)).rejects.toMatchObject({
        response: {
          status: 409,
          data: expect.objectContaining({
            version_conflict: true
          })
        }
      });
    });
  });
});