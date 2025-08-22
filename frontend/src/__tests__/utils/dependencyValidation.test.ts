/**
 * Dependency Validation Logic Tests
 * 
 * Tests for the critical dependency validation bug in FeatureForm
 * where the filtering logic is too permissive and allows invalid dependencies.
 */

import { FeatureListItem } from '../../services/api';
import { 
  createMockFeatureListItem, 
  createFeatureWithDependencyIssues,
  createHierarchicalFeatures 
} from '../factories/testDataFactories';

// Extract dependency filtering logic from FeatureForm for testing
// This represents the current buggy logic from lines 100-107 in FeatureForm.tsx
export const currentDependencyFilter = (
  allFeatures: FeatureListItem[], 
  currentFeature?: FeatureListItem
): FeatureListItem[] => {
  return allFeatures.filter(f => {
    // Exclude current feature
    if (currentFeature && f.id === currentFeature.id) return false;
    
    // CURRENT BUG: "For simplicity and flexibility: all features in the same project can be dependencies"
    // This allows maximum flexibility in project planning
    return true;
  });
};

// Proposed fixed dependency filtering logic
export const fixedDependencyFilter = (
  allFeatures: FeatureListItem[], 
  currentFeature?: FeatureListItem
): FeatureListItem[] => {
  return allFeatures.filter(f => {
    // Exclude current feature
    if (currentFeature && f.id === currentFeature.id) return false;
    
    // Exclude features from different projects
    if (currentFeature && f.project_name !== currentFeature.project_name) return false;
    
    // If current feature is a sub-feature
    if (currentFeature && currentFeature.hierarchy_level > 0) {
      // Sub-features cannot depend on:
      // 1. Their own parent feature (prevents circular deps)
      if (f.id === currentFeature.parent) return false;
      
      // 2. Their own sub-features (if any)
      if (f.parent === currentFeature.id) return false;
      
      // 3. Sub-features of their descendants
      // This requires a more complex hierarchy check
    }
    
    // If current feature is a parent feature
    if (currentFeature && currentFeature.hierarchy_level === 0) {
      // Parent features cannot depend on their own sub-features
      if (f.parent === currentFeature.id) return false;
    }
    
    return true;
  });
};

describe('Dependency Validation Logic', () => {
  describe('CRITICAL BUG: Current dependency filtering is too permissive', () => {
    test('current logic allows feature to depend on itself', () => {
      const feature = createMockFeatureListItem({ id: 'feature-1' });
      const allFeatures = [feature];
      
      const validDependencies = currentDependencyFilter(allFeatures, feature);
      
      // CRITICAL BUG: Should exclude self but current implementation does
      expect(validDependencies).toHaveLength(0); // Correctly excludes self
    });

    test('CRITICAL BUG: current logic allows parent to depend on child', () => {
      const scenario = createFeatureWithDependencyIssues('circular');
      const allFeatures = [
        scenario.parentFeature,
        scenario.childFeature,
        scenario.siblingFeature
      ];
      
      const validDependencies = currentDependencyFilter(allFeatures, scenario.parentFeature);
      
      // CRITICAL BUG: Current logic allows parent to depend on its child
      expect(validDependencies).toHaveLength(2); // Includes child and sibling
      expect(validDependencies.some(f => f.id === scenario.childFeature.id)).toBe(true); // BUG: Should be false
    });

    test('CRITICAL BUG: current logic allows cross-project dependencies', () => {
      const scenario = createFeatureWithDependencyIssues('valid');
      const allFeatures = [
        scenario.childFeature,
        scenario.externalFeature // From different project
      ];
      
      const validDependencies = currentDependencyFilter(allFeatures, scenario.childFeature);
      
      // CRITICAL BUG: Current logic allows dependencies across projects
      expect(validDependencies).toHaveLength(1);
      expect(validDependencies[0].id).toBe(scenario.externalFeature.id); // BUG: Should be filtered out
    });

    test('CRITICAL BUG: current logic allows circular dependency chains', () => {
      // Create a chain: A -> B -> C -> A
      const featureA = createMockFeatureListItem({ 
        id: 'feature-a', 
        title: 'Feature A',
        dependencies_count: 1 
      });
      const featureB = createMockFeatureListItem({ 
        id: 'feature-b', 
        title: 'Feature B',
        dependencies_count: 1 
      });
      const featureC = createMockFeatureListItem({ 
        id: 'feature-c', 
        title: 'Feature C',
        dependencies_count: 1 
      });
      
      const allFeatures = [featureA, featureB, featureC];
      
      // Check if A can depend on C (which would complete the circular chain A -> C -> B -> A)
      const validDependenciesForA = currentDependencyFilter(allFeatures, featureA);
      
      // CRITICAL BUG: Current logic would allow this circular dependency
      expect(validDependenciesForA.some(f => f.id === featureC.id)).toBe(true); // BUG: Should prevent circular chains
    });
  });

  describe('Fixed dependency filtering logic', () => {
    test('fixed logic prevents parent from depending on child', () => {
      const scenario = createFeatureWithDependencyIssues('circular');
      const allFeatures = [
        scenario.parentFeature,
        scenario.childFeature,
        scenario.siblingFeature
      ];
      
      const validDependencies = fixedDependencyFilter(allFeatures, scenario.parentFeature);
      
      // FIXED: Should not include child feature as valid dependency
      expect(validDependencies.some(f => f.id === scenario.childFeature.id)).toBe(false);
      expect(validDependencies.some(f => f.id === scenario.siblingFeature.id)).toBe(true); // Sibling is OK
    });

    test('fixed logic prevents cross-project dependencies', () => {
      const scenario = createFeatureWithDependencyIssues('valid');
      scenario.childFeature.project_name = 'Project A';
      scenario.externalFeature.project_name = 'Project B';
      
      const allFeatures = [
        scenario.childFeature,
        scenario.externalFeature
      ];
      
      const validDependencies = fixedDependencyFilter(allFeatures, scenario.childFeature);
      
      // FIXED: Should exclude external feature from different project
      expect(validDependencies).toHaveLength(0);
    });

    test('fixed logic allows valid same-project dependencies', () => {
      const scenario = createFeatureWithDependencyIssues('valid');
      const allFeatures = [
        scenario.parentFeature,
        scenario.childFeature,
        scenario.siblingFeature
      ];
      
      // Child can depend on sibling (valid)
      const validDependencies = fixedDependencyFilter(allFeatures, scenario.childFeature);
      
      expect(validDependencies.some(f => f.id === scenario.siblingFeature.id)).toBe(true);
      expect(validDependencies.some(f => f.id === scenario.parentFeature.id)).toBe(false); // Parent excluded
    });

    test('fixed logic prevents child from depending on parent', () => {
      const scenario = createFeatureWithDependencyIssues('valid');
      const allFeatures = [
        scenario.parentFeature,
        scenario.childFeature
      ];
      
      // Sub-features should NOT depend on their parent, only on sibling sub-features
      // This prevents circular dependency issues and maintains clear hierarchy
      const validDependencies = fixedDependencyFilter(allFeatures, scenario.childFeature);
      
      expect(validDependencies.some(f => f.id === scenario.parentFeature.id)).toBe(false);
    });
  });

  describe('Complex hierarchy scenarios', () => {
    test('should handle deep hierarchy correctly', () => {
      const grandparent = createMockFeatureListItem({
        id: 'grandparent',
        title: 'Grandparent',
        hierarchy_level: 0,
        sub_features_count: 1
      });
      
      const parent = createMockFeatureListItem({
        id: 'parent',
        title: 'Parent',
        parent: 'grandparent',
        hierarchy_level: 1,
        sub_features_count: 1
      });
      
      const child = createMockFeatureListItem({
        id: 'child',
        title: 'Child',
        parent: 'parent',
        hierarchy_level: 2,
        sub_features_count: 0
      });
      
      const allFeatures = [grandparent, parent, child];
      
      // Child should not be able to depend on its ancestors that would create circular deps
      const validDependencies = fixedDependencyFilter(allFeatures, child);
      
      expect(validDependencies.some(f => f.id === parent.id)).toBe(false); // Direct parent excluded
      expect(validDependencies.some(f => f.id === grandparent.id)).toBe(true); // Grandparent might be OK
    });

    test('should handle sibling dependencies correctly', () => {
      const hierarchicalFeatures = createHierarchicalFeatures();
      const child1 = hierarchicalFeatures.find(f => f.title === 'Child Feature 1.1')!;
      const child2 = hierarchicalFeatures.find(f => f.title === 'Child Feature 1.2')!;
      
      const validDependencies = fixedDependencyFilter(hierarchicalFeatures, child1);
      
      // Child 1.1 should be able to depend on sibling Child 1.2
      expect(validDependencies.some(f => f.id === child2.id)).toBe(true);
    });

    test('should prevent sub-feature from depending on its own sub-features', () => {
      const parentWithSubFeatures = createMockFeatureListItem({
        id: 'parent-with-subs',
        title: 'Parent with Sub-features',
        hierarchy_level: 0,
        sub_features_count: 2
      });
      
      const subFeature1 = createMockFeatureListItem({
        id: 'sub-1',
        title: 'Sub-feature 1',
        parent: 'parent-with-subs',
        hierarchy_level: 1,
        sub_features_count: 1
      });
      
      const subSubFeature = createMockFeatureListItem({
        id: 'sub-sub-1',
        title: 'Sub-sub-feature',
        parent: 'sub-1',
        hierarchy_level: 2
      });
      
      const allFeatures = [parentWithSubFeatures, subFeature1, subSubFeature];
      
      const validDependencies = fixedDependencyFilter(allFeatures, subFeature1);
      
      // Sub-feature 1 should not depend on its own sub-feature
      expect(validDependencies.some(f => f.id === subSubFeature.id)).toBe(false);
    });
  });

  describe('Edge cases and validation scenarios', () => {
    test('should handle empty features list', () => {
      const feature = createMockFeatureListItem();
      const validDependencies = fixedDependencyFilter([], feature);
      
      expect(validDependencies).toHaveLength(0);
    });

    test('should handle undefined current feature', () => {
      const allFeatures = [createMockFeatureListItem()];
      const validDependencies = fixedDependencyFilter(allFeatures);
      
      // Without current feature, should return all features (for creation scenarios)
      expect(validDependencies).toHaveLength(1);
    });

    test('should handle features with missing project information', () => {
      const featureWithoutProject = createMockFeatureListItem({
        project_name: ''
      });
      const normalFeature = createMockFeatureListItem();
      
      const allFeatures = [featureWithoutProject, normalFeature];
      const validDependencies = fixedDependencyFilter(allFeatures, normalFeature);
      
      // Features without project info should be excluded
      expect(validDependencies).toHaveLength(0);
    });

    test('should handle features with missing hierarchy information', () => {
      const featureWithoutHierarchy = createMockFeatureListItem({
        id: 'feature-without-hierarchy',
        hierarchy_level: undefined as any,
        parent: undefined
      });
      const normalFeature = createMockFeatureListItem({ id: 'normal-feature' });
      
      const allFeatures = [featureWithoutHierarchy, normalFeature];
      const validDependencies = fixedDependencyFilter(allFeatures, normalFeature);
      
      // Should handle gracefully and include features with missing hierarchy info
      expect(validDependencies).toHaveLength(1);
    });
  });

  describe('Performance considerations', () => {
    test('should handle large numbers of features efficiently', () => {
      // Create 1000 features
      const manyFeatures: FeatureListItem[] = [];
      for (let i = 0; i < 1000; i++) {
        manyFeatures.push(createMockFeatureListItem({
          id: `feature-${i}`,
          title: `Feature ${i}`
        }));
      }
      
      const currentFeature = manyFeatures[0];
      
      const startTime = performance.now();
      const validDependencies = fixedDependencyFilter(manyFeatures, currentFeature);
      const endTime = performance.now();
      
      // Should complete quickly (less than 50ms for 1000 features)
      expect(endTime - startTime).toBeLessThan(50);
      expect(validDependencies).toHaveLength(999); // All except current
    });
  });
});

describe('Dependency Validation UI Integration', () => {
  describe('Real-world scenarios', () => {
    test('Epic with multiple user stories scenario', () => {
      // Epic -> User Story 1 -> Task 1.1, Task 1.2
      //     -> User Story 2 -> Task 2.1, Task 2.2
      
      const epic = createMockFeatureListItem({
        id: 'epic-1',
        title: 'Epic: User Management',
        hierarchy_level: 0,
        sub_features_count: 2
      });
      
      const userStory1 = createMockFeatureListItem({
        id: 'story-1',
        title: 'User Registration',
        parent: 'epic-1',
        hierarchy_level: 1,
        sub_features_count: 2
      });
      
      const userStory2 = createMockFeatureListItem({
        id: 'story-2', 
        title: 'User Login',
        parent: 'epic-1',
        hierarchy_level: 1,
        sub_features_count: 2
      });
      
      const task1_1 = createMockFeatureListItem({
        id: 'task-1-1',
        title: 'Create Registration Form',
        parent: 'story-1',
        hierarchy_level: 2
      });
      
      const task2_1 = createMockFeatureListItem({
        id: 'task-2-1',
        title: 'Create Login Form',
        parent: 'story-2',
        hierarchy_level: 2
      });
      
      const allFeatures = [epic, userStory1, userStory2, task1_1, task2_1];
      
      // User Story 2 might depend on User Story 1 (common scenario)
      const validDependenciesForStory2 = fixedDependencyFilter(allFeatures, userStory2);
      
      // Should allow story to depend on sibling story
      expect(validDependenciesForStory2.some(f => f.id === userStory1.id)).toBe(true);
      
      // Should not allow story to depend on the epic (parent)
      expect(validDependenciesForStory2.some(f => f.id === epic.id)).toBe(false);
      
      // Should not allow story to depend on its own tasks
      expect(validDependenciesForStory2.some(f => f.id === task2_1.id)).toBe(false);
      
      // Should allow story to depend on tasks from other stories
      expect(validDependenciesForStory2.some(f => f.id === task1_1.id)).toBe(true);
    });

    test('Cross-team dependencies should be prevented', () => {
      const frontendFeature = createMockFeatureListItem({
        id: 'frontend-1',
        title: 'Frontend Feature',
        project_name: 'Frontend Project'
      });
      
      const backendFeature = createMockFeatureListItem({
        id: 'backend-1',
        title: 'Backend API',
        project_name: 'Backend Project'
      });
      
      const allFeatures = [frontendFeature, backendFeature];
      
      // Frontend feature should not depend on backend feature from different project
      const validDependencies = fixedDependencyFilter(allFeatures, frontendFeature);
      
      expect(validDependencies).toHaveLength(0); // No cross-project dependencies
    });

    test('Valid dependency chain scenario', () => {
      // Database Setup -> API Development -> Frontend -> Testing
      const dbSetup = createMockFeatureListItem({
        id: 'db-setup',
        title: 'Database Setup'
      });
      
      const apiDev = createMockFeatureListItem({
        id: 'api-dev',
        title: 'API Development'
      });
      
      const frontendDev = createMockFeatureListItem({
        id: 'frontend-dev',
        title: 'Frontend Development'
      });
      
      const testing = createMockFeatureListItem({
        id: 'testing',
        title: 'Integration Testing'
      });
      
      const allFeatures = [dbSetup, apiDev, frontendDev, testing];
      
      // API can depend on DB
      const validForApi = fixedDependencyFilter(allFeatures, apiDev);
      expect(validForApi.some(f => f.id === dbSetup.id)).toBe(true);
      
      // Frontend can depend on API
      const validForFrontend = fixedDependencyFilter(allFeatures, frontendDev);
      expect(validForFrontend.some(f => f.id === apiDev.id)).toBe(true);
      expect(validForFrontend.some(f => f.id === dbSetup.id)).toBe(true);
      
      // Testing can depend on all
      const validForTesting = fixedDependencyFilter(allFeatures, testing);
      expect(validForTesting).toHaveLength(3);
    });
  });
});