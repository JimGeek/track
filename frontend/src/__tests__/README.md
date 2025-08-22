# Test Suite Documentation

This test suite provides comprehensive testing for the critical issues identified in the Track frontend application, specifically focusing on the feature management system bugs.

## Critical Issues Tested

### 1. Date Saving Functionality Bug (FeatureForm.tsx)
**Location:** `__tests__/components/features/FeatureForm.test.tsx`

**Problem:** Date fields are properly captured in formData but the form data conversion logic (lines 217-222) removes empty strings, which might be affecting date persistence.

**Tests Cover:**
- Date field preservation during submission
- Empty date string handling
- Date clearing from existing features
- Date validation against project boundaries
- Cross-field date validation (start vs end date)

### 2. Gantt Chart Date Display Bug (FeatureGanttView.tsx)
**Location:** `__tests__/components/features/FeatureGanttView.test.tsx`

**Problem:** Date calculation logic (lines 342-355) has fallback behavior that places features "near current date" when no dates are set, causing misleading "random date" display.

**Tests Cover:**
- Date calculation for features without dates
- Timeline generation with mixed date scenarios
- Feature positioning and width calculations
- Tooltip display of calculated vs real dates
- Drag and drop functionality with date updates

### 3. Dependency Validation Bug (FeatureForm.tsx)
**Location:** `__tests__/utils/dependencyValidation.test.ts`

**Problem:** Dependency filtering logic (lines 100-107) is too permissive, allowing circular dependencies and violating standard project management practices.

**Tests Cover:**
- Current buggy filtering logic documentation
- Fixed filtering logic implementation
- Circular dependency prevention
- Cross-project dependency prevention
- Hierarchical dependency validation
- Real-world dependency scenarios

## Test Structure

```
src/__tests__/
├── factories/
│   └── testDataFactories.ts          # Mock data generation utilities
├── components/
│   └── features/
│       ├── FeatureForm.test.tsx      # Form validation and submission tests
│       └── FeatureGanttView.test.tsx # Gantt chart logic tests
├── integration/
│   ├── apiDateHandling.test.ts       # API integration tests
│   └── featureWorkflows.test.tsx     # End-to-end workflow tests
├── utils/
│   └── dependencyValidation.test.ts  # Dependency logic tests
└── README.md                         # This documentation
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Specific Test Files
```bash
# Feature Form tests
npm test FeatureForm.test.tsx

# Gantt View tests
npm test FeatureGanttView.test.tsx

# Dependency validation tests
npm test dependencyValidation.test.ts

# API integration tests
npm test apiDateHandling.test.ts

# Workflow integration tests
npm test featureWorkflows.test.tsx
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Tests with Detailed Output
```bash
npm test -- --verbose
```

## Test Categories

### Unit Tests
- **FeatureForm component logic**
- **Gantt chart calculations**
- **Dependency validation functions**
- **API service methods**

### Integration Tests
- **API date handling workflows**
- **Component interaction patterns**
- **Error handling scenarios**

### UI Integration Tests
- **Complete feature creation workflow**
- **Feature editing with date updates**
- **Dependency selection workflow**
- **Gantt chart interactions**

## Critical Test Cases

### Date Handling Tests
1. **Empty Date Preservation**: Ensures empty date strings become `undefined`, not missing properties
2. **Date Boundary Validation**: Validates dates against project start/end dates
3. **Date Field Clearing**: Tests ability to clear existing dates
4. **Gantt Random Date Prevention**: Prevents misleading date displays

### Dependency Validation Tests
1. **Circular Dependency Prevention**: Stops parent-child circular dependencies
2. **Cross-Project Prevention**: Blocks dependencies across different projects
3. **Self-Dependency Prevention**: Prevents features from depending on themselves
4. **Hierarchy Respect**: Maintains proper parent-child relationships

### Error Handling Tests
1. **API Error Display**: Shows meaningful error messages to users
2. **Network Error Recovery**: Handles connection failures gracefully
3. **Validation Error Feedback**: Provides clear validation feedback

## Coverage Requirements

The test suite includes coverage thresholds:
- **Global Coverage**: 70% minimum
- **Critical Components**: 80-85% minimum
- **API Service**: 90% minimum

### Critical Files Coverage Targets
- `FeatureForm.tsx`: 85% (high due to critical bugs)
- `FeatureGanttView.tsx`: 80% (medium-high due to date display bugs)
- `api.ts`: 90% (very high due to data integrity importance)

## Mocking Strategy

### API Service Mocking
- Full axios mocking for API service tests
- Response/error scenario simulation
- Network condition simulation

### Component Mocking
- React Query provider mocking
- Router context mocking
- Date/time mocking for consistent testing

### Data Factory Pattern
- Centralized mock data creation
- Scenario-based data generation
- Realistic data relationships

## Test Data Factories

Located in `factories/testDataFactories.ts`, these provide:

### Mock Generators
- `createMockUser()` - User objects
- `createMockProject()` - Project objects
- `createMockFeature()` - Feature objects
- `createMockFeatureListItem()` - Feature list items

### Scenario Generators
- `createFeatureWithDateIssues()` - Date-related scenarios
- `createFeatureWithDependencyIssues()` - Dependency scenarios
- `createHierarchicalFeatures()` - Hierarchy scenarios
- `createGanttDateScenarios()` - Gantt-specific scenarios

### Response Generators
- `createMockApiResponse()` - Successful API responses
- `createMockErrorResponse()` - Error API responses

## Bug Documentation Pattern

Each test file follows the pattern:
1. **CRITICAL BUG**: Documents current buggy behavior
2. **Test Implementation**: Validates current behavior
3. **Expected Behavior**: Comments on what should happen after fix
4. **Verification**: Ensures fixes work correctly

## Continuous Integration

The test suite is designed for CI/CD integration:
- Fast execution (< 30 seconds for full suite)
- Reliable (no flaky tests)
- Comprehensive coverage of critical paths
- Clear failure reporting

## Adding New Tests

When adding tests:
1. Use the factory pattern for mock data
2. Follow the "Arrange-Act-Assert" pattern
3. Test both success and failure scenarios
4. Document any bugs being tested
5. Maintain coverage thresholds

## Test Maintenance

### Regular Tasks
- Update mock data as API changes
- Adjust coverage thresholds as code evolves
- Review and update test scenarios
- Remove tests for fixed bugs (after verification)

### When Adding Features
- Create corresponding test factories
- Add unit tests for core logic
- Add integration tests for workflows
- Update coverage requirements

## Debugging Failed Tests

### Common Issues
1. **Mock Data Inconsistency**: Check factory functions
2. **Async Timing**: Verify `waitFor` usage
3. **Component State**: Ensure proper cleanup
4. **API Mocking**: Verify mock implementations

### Debugging Commands
```bash
# Run single test with debugging
npm test -- --testNamePattern="specific test name" --verbose

# Run with console output
npm test -- --silent=false

# Run with coverage details
npm test -- --coverage --collectCoverageFrom="src/specific/path/**/*.ts"
```

This test suite provides a solid foundation for identifying, documenting, and validating fixes for the critical bugs in the Track application's feature management system.