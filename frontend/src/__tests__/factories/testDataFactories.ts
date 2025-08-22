/**
 * Test Data Factories
 * 
 * Provides factory functions to create mock data for testing
 * the critical issues in the feature management system.
 */

import { 
  Project, 
  Feature, 
  FeatureListItem, 
  CreateFeatureRequest, 
  UpdateFeatureRequest, 
  User 
} from '../../services/api';

// Mock User Factory
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  full_name: 'Test User',
  date_joined: '2023-01-01T00:00:00Z',
  is_email_verified: true,
  ...overrides,
});

// Mock Project Factory
export const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'project-1',
  name: 'Test Project',
  description: 'A test project',
  owner: createMockUser(),
  team_members: [createMockUser()],
  priority: 'medium',
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  deadline: '2024-12-31',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  is_archived: false,
  total_features: 5,
  completed_features: 2,
  progress_percentage: 40,
  is_overdue: false,
  can_edit: true,
  ...overrides,
});

// Mock Feature Factory
export const createMockFeature = (overrides: Partial<Feature> = {}): Feature => ({
  id: 'feature-1',
  project: 'project-1',
  parent: null,
  title: 'Test Feature',
  description: 'A test feature',
  status: 'idea',
  priority: 'medium',
  assignee: createMockUser(),
  reporter: createMockUser(),
  estimated_hours: 10,
  actual_hours: null,
  start_date: '2024-02-01',
  end_date: '2024-02-15',
  completed_date: null,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  order: 0,
  dependencies: [],
  is_overdue: false,
  is_completed: false,
  hierarchy_level: 0,
  full_path: 'Test Feature',
  progress_percentage: 0,
  can_edit: true,
  total_estimated_hours: 10,
  total_actual_hours: 0,
  next_status: 'specification',
  previous_status: null,
  comments: [],
  attachments: [],
  sub_features: [],
  dependencies_detail: [],
  ...overrides,
});

// Mock FeatureListItem Factory
export const createMockFeatureListItem = (overrides: Partial<FeatureListItem> = {}): FeatureListItem => ({
  id: 'feature-1',
  title: 'Test Feature',
  description: 'A test feature',
  status: 'idea',
  priority: 'medium',
  assignee: createMockUser(),
  reporter: createMockUser(),
  project_name: 'Test Project',
  parent: null,
  parent_title: null,
  estimated_hours: 10,
  actual_hours: null,
  start_date: '2024-02-01',
  end_date: '2024-02-15',
  completed_date: null,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  order: 0,
  is_overdue: false,
  is_completed: false,
  hierarchy_level: 0,
  full_path: 'Test Feature',
  progress_percentage: 0,
  can_edit: true,
  sub_features_count: 0,
  comments_count: 0,
  attachments_count: 0,
  dependencies_count: 0,
  ...overrides,
});

// Factory for features with date issues
export const createFeatureWithDateIssues = (scenario: 'no-dates' | 'start-only' | 'end-only' | 'invalid-range'): FeatureListItem => {
  const baseFeature = createMockFeatureListItem();
  
  switch (scenario) {
    case 'no-dates':
      return { ...baseFeature, start_date: null, end_date: null };
    case 'start-only':
      return { ...baseFeature, start_date: '2024-02-01', end_date: null };
    case 'end-only':
      return { ...baseFeature, start_date: null, end_date: '2024-02-15' };
    case 'invalid-range':
      return { ...baseFeature, start_date: '2024-02-15', end_date: '2024-02-01' }; // End before start
    default:
      return baseFeature;
  }
};

// Factory for features with dependency issues
export const createFeatureWithDependencyIssues = (scenario: 'circular' | 'parent-child-circular' | 'valid'): {
  parentFeature: FeatureListItem;
  childFeature: FeatureListItem;
  siblingFeature: FeatureListItem;
  externalFeature: FeatureListItem;
} => {
  const parentFeature = createMockFeatureListItem({
    id: 'parent-feature',
    title: 'Parent Feature',
    hierarchy_level: 0,
    sub_features_count: 1,
  });

  const childFeature = createMockFeatureListItem({
    id: 'child-feature',
    title: 'Child Feature',
    parent: 'parent-feature',
    parent_title: 'Parent Feature',
    hierarchy_level: 1,
  });

  const siblingFeature = createMockFeatureListItem({
    id: 'sibling-feature',
    title: 'Sibling Feature',
    // FIX: Sibling should be at same level as parent (root level), not child of parent
    parent: null,
    parent_title: null,
    hierarchy_level: 0,
  });

  const externalFeature = createMockFeatureListItem({
    id: 'external-feature',
    title: 'External Feature',
    project_name: 'Other Project',
    hierarchy_level: 0,
  });

  switch (scenario) {
    case 'circular':
      // Parent depends on child (circular)
      return {
        parentFeature: { ...parentFeature, dependencies_count: 1 },
        childFeature: { ...childFeature, dependencies_count: 1 },
        siblingFeature,
        externalFeature,
      };
    case 'parent-child-circular':
      // Child depends on parent's sibling, parent depends on child
      return {
        parentFeature: { ...parentFeature, dependencies_count: 1 },
        childFeature: { ...childFeature, dependencies_count: 1 },
        siblingFeature: { ...siblingFeature, dependencies_count: 1 },
        externalFeature,
      };
    case 'valid':
      // Valid dependencies: child depends on sibling, no circular deps
      return {
        parentFeature,
        childFeature: { ...childFeature, dependencies_count: 1 },
        siblingFeature,
        externalFeature,
      };
    default:
      return { parentFeature, childFeature, siblingFeature, externalFeature };
  }
};

// Factory for CreateFeatureRequest with various scenarios
export const createFeatureRequest = (scenario: 'valid' | 'empty-dates' | 'invalid-dates' | 'with-dependencies'): CreateFeatureRequest => {
  const baseRequest: CreateFeatureRequest = {
    project: 'project-1',
    title: 'New Feature',
    description: 'A new feature request',
    priority: 'medium',
    assignee_email: 'assignee@example.com',
    estimated_hours: 10,
    order: 0,
  };

  switch (scenario) {
    case 'valid':
      return {
        ...baseRequest,
        start_date: '2024-02-01',
        end_date: '2024-02-15',
      };
    case 'empty-dates':
      return {
        ...baseRequest,
        start_date: '',
        end_date: '',
      };
    case 'invalid-dates':
      return {
        ...baseRequest,
        start_date: '2024-02-15',
        end_date: '2024-02-01', // End before start
      };
    case 'with-dependencies':
      return {
        ...baseRequest,
        start_date: '2024-02-01',
        end_date: '2024-02-15',
        dependencies: ['dep-feature-1', 'dep-feature-2'],
      };
    default:
      return baseRequest;
  }
};

// Factory for UpdateFeatureRequest with date scenarios
export const createUpdateFeatureRequest = (scenario: 'clear-dates' | 'update-dates' | 'invalid-dates'): UpdateFeatureRequest => {
  switch (scenario) {
    case 'clear-dates':
      return {
        title: 'Updated Feature',
        start_date: undefined,
        end_date: undefined,
      };
    case 'update-dates':
      return {
        title: 'Updated Feature',
        start_date: '2024-03-01',
        end_date: '2024-03-15',
      };
    case 'invalid-dates':
      return {
        title: 'Updated Feature',
        start_date: '2024-03-15',
        end_date: '2024-03-01', // End before start
      };
    default:
      return { title: 'Updated Feature' };
  }
};

// Mock API Response Factory
export const createMockApiResponse = <T>(data: T, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {} as any,
});

// Mock Error Response Factory
export const createMockErrorResponse = (errors: Record<string, string[]>, status = 400) => ({
  response: {
    data: errors,
    status,
    statusText: 'Bad Request',
    headers: {},
    config: {} as any,
  },
  config: {} as any,
  isAxiosError: true,
  name: 'AxiosError',
  message: 'Request failed',
  toJSON: () => ({}),
});

// Date scenarios for Gantt chart testing
export const createGanttDateScenarios = () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return {
    today,
    yesterday,
    tomorrow,
    nextWeek,
    formatDate: (date: Date) => date.toISOString().split('T')[0],
  };
};

// Features for hierarchy testing
export const createHierarchicalFeatures = (): FeatureListItem[] => {
  return [
    // Root feature with sub-features
    createMockFeatureListItem({
      id: 'root-1',
      title: 'Root Feature 1',
      hierarchy_level: 0,
      sub_features_count: 2,
      order: 0,
    }),
    
    // Child features
    createMockFeatureListItem({
      id: 'child-1-1',
      title: 'Child Feature 1.1',
      parent: 'root-1',
      parent_title: 'Root Feature 1',
      hierarchy_level: 1,
      order: 0,
    }),
    createMockFeatureListItem({
      id: 'child-1-2',
      title: 'Child Feature 1.2',
      parent: 'root-1',
      parent_title: 'Root Feature 1',
      hierarchy_level: 1,
      order: 1,
    }),
    
    // Another root feature
    createMockFeatureListItem({
      id: 'root-2',
      title: 'Root Feature 2',
      hierarchy_level: 0,
      sub_features_count: 0,
      order: 1,
    }),
  ];
};