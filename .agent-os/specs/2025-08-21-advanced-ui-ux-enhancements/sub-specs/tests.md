# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-08-21-advanced-ui-ux-enhancements/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Test Coverage

### Drag-and-Drop Testing

#### Unit Tests
```typescript
describe('DragDropService', () => {
  describe('reorderTask', () => {
    it('should reorder tasks within the same list', async () => {
      const result = await DragDropService.reorderTask({
        userId: 'user1',
        taskId: 'task1',
        sourceListId: 'list1',
        targetListId: 'list1',
        targetPosition: 2,
        operation: 'reorder'
      });
      
      expect(result.success).toBe(true);
      expect(result.updated_task.position_in_list).toBe(2);
    });

    it('should move task between different lists', async () => {
      const result = await DragDropService.reorderTask({
        userId: 'user1',
        taskId: 'task1',
        sourceListId: 'list1',
        targetListId: 'list2',
        targetPosition: 0,
        operation: 'move'
      });
      
      expect(result.success).toBe(true);
      expect(result.updated_task.list_id).toBe('list2');
      expect(result.updated_task.position_in_list).toBe(0);
    });

    it('should handle invalid positions gracefully', async () => {
      const result = await DragDropService.reorderTask({
        userId: 'user1',
        taskId: 'task1',
        sourceListId: 'list1',
        targetListId: 'list1',
        targetPosition: -1,
        operation: 'reorder'
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid position');
    });
  });
});
```

#### Integration Tests
```typescript
describe('Drag-and-Drop API Integration', () => {
  it('should handle drag-and-drop reordering via API', async () => {
    const response = await request(app)
      .post('/api/tasks/reorder')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        task_id: 'task1',
        source_list_id: 'list1',
        target_list_id: 'list1',
        target_position: 3,
        operation: 'reorder'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('should update positions of affected tasks', async () => {
    const response = await request(app)
      .post('/api/tasks/reorder')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        task_id: 'task1',
        source_list_id: 'list1',
        target_list_id: 'list1',
        target_position: 1,
        operation: 'reorder'
      });

    expect(response.body.affected_tasks).toHaveLength(2);
    expect(response.body.affected_tasks[0].position_in_list).toBe(2);
  });
});
```

### Keyboard Navigation Testing

#### E2E Tests
```typescript
describe('Keyboard Navigation', () => {
  beforeEach(async () => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  it('should navigate tasks with J/K keys', async () => {
    await page.press('body', 'j');
    const firstTask = await page.locator('[data-testid="task-item"]:first-child');
    await expect(firstTask).toBeFocused();

    await page.press('body', 'j');
    const secondTask = await page.locator('[data-testid="task-item"]:nth-child(2)');
    await expect(secondTask).toBeFocused();

    await page.press('body', 'k');
    await expect(firstTask).toBeFocused();
  });

  it('should create task with C shortcut', async () => {
    await page.press('body', 'c');
    const createModal = await page.locator('[data-testid="create-task-modal"]');
    await expect(createModal).toBeVisible();
    
    const titleInput = await page.locator('[data-testid="task-title-input"]');
    await expect(titleInput).toBeFocused();
  });

  it('should open search with / key', async () => {
    await page.press('body', '/');
    const searchInput = await page.locator('[data-testid="search-input"]');
    await expect(searchInput).toBeFocused();
  });

  it('should handle custom shortcuts', async () => {
    // Set custom shortcut for create task
    await page.evaluate(() => {
      localStorage.setItem('keyboard_shortcuts', JSON.stringify({
        'create_task': { key_combination: 'ctrl+n', context: 'global' }
      }));
    });
    
    await page.reload();
    await page.press('body', 'Control+n');
    
    const createModal = await page.locator('[data-testid="create-task-modal"]');
    await expect(createModal).toBeVisible();
  });
});
```

### Accessibility Testing

#### Automated Accessibility Tests
```typescript
describe('Accessibility Compliance', () => {
  let page: Page;

  beforeEach(async () => {
    page = await browser.newPage();
    await injectAxe(page);
  });

  it('should have no accessibility violations on dashboard', async () => {
    await page.goto('/dashboard');
    const results = await checkA11y(page);
    expect(results.violations).toHaveLength(0);
  });

  it('should have proper ARIA labels on interactive elements', async () => {
    await page.goto('/dashboard');
    
    const createButton = await page.locator('[data-testid="create-task-button"]');
    const ariaLabel = await createButton.getAttribute('aria-label');
    expect(ariaLabel).toBe('Create new task');
    
    const deleteButton = await page.locator('[data-testid="delete-task-button"]:first');
    const deleteAriaLabel = await deleteButton.getAttribute('aria-label');
    expect(deleteAriaLabel).toContain('Delete task');
  });

  it('should support high contrast mode', async () => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addStyleTag({
      content: '@media (prefers-contrast: high) { :root { --contrast: high; } }'
    });
    
    await page.goto('/dashboard');
    const results = await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });
    
    expect(results.violations).toHaveLength(0);
  });
});
```

#### Screen Reader Testing
```typescript
describe('Screen Reader Support', () => {
  it('should announce dynamic content changes', async () => {
    await page.goto('/dashboard');
    
    // Set up screen reader simulation
    await page.evaluate(() => {
      window.announcements = [];
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.target.getAttribute('aria-live')) {
            window.announcements.push(mutation.target.textContent);
          }
        });
      });
      observer.observe(document.body, { 
        childList: true, 
        subtree: true, 
        characterData: true 
      });
    });

    // Create a task
    await page.click('[data-testid="create-task-button"]');
    await page.fill('[data-testid="task-title-input"]', 'Test Task');
    await page.click('[data-testid="save-task-button"]');

    // Check announcements
    const announcements = await page.evaluate(() => window.announcements);
    expect(announcements).toContain('Task created successfully');
  });

  it('should provide meaningful focus indicators', async () => {
    await page.goto('/dashboard');
    await page.press('body', 'Tab');
    
    const focusedElement = await page.locator(':focus');
    const outlineStyle = await focusedElement.evaluate(el => 
      window.getComputedStyle(el).outline
    );
    
    expect(outlineStyle).not.toBe('none');
    expect(outlineStyle).toMatch(/2px solid/);
  });
});
```

### Bulk Operations Testing

#### Unit Tests
```typescript
describe('BulkOperationService', () => {
  describe('performBulkAction', () => {
    it('should update status for multiple tasks', async () => {
      const result = await BulkOperationService.performBulkAction({
        userId: 'user1',
        action: 'update_status',
        taskIds: ['task1', 'task2', 'task3'],
        data: { status: 'completed' }
      });

      expect(result.success).toBe(true);
      expect(result.processed).toBe(3);
      expect(result.failed).toBe(0);
    });

    it('should handle partial failures gracefully', async () => {
      jest.spyOn(TaskService, 'updateTask')
        .mockResolvedValueOnce(mockTask)
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce(mockTask);

      const result = await BulkOperationService.performBulkAction({
        userId: 'user1',
        action: 'update_status',
        taskIds: ['task1', 'task2', 'task3'],
        data: { status: 'completed' }
      });

      expect(result.processed).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });
});
```

### User Preferences Testing

#### Unit Tests
```typescript
describe('PreferenceService', () => {
  it('should create default preferences for new users', async () => {
    const preferences = await PreferenceService.getUserPreferences('new-user');
    
    expect(preferences.theme).toBe('system');
    expect(preferences.layout_density).toBe('comfortable');
    expect(preferences.reduce_motion).toBe(false);
  });

  it('should update preferences partially', async () => {
    await PreferenceService.patchUserPreferences('user1', {
      theme: 'dark',
      reduce_motion: true
    });

    const preferences = await PreferenceService.getUserPreferences('user1');
    expect(preferences.theme).toBe('dark');
    expect(preferences.reduce_motion).toBe(true);
    expect(preferences.layout_density).toBe('comfortable'); // unchanged
  });
});
```

## Mocking Requirements

### External Service Mocks

#### Drag-and-Drop Mock
```typescript
jest.mock('react-dnd', () => ({
  useDrag: jest.fn(() => [{}, jest.fn(), jest.fn()]),
  useDrop: jest.fn(() => [{ isOver: false }, jest.fn()]),
  DndProvider: ({ children }) => children
}));

jest.mock('react-dnd-html5-backend', () => ({
  HTML5Backend: jest.fn()
}));
```

#### Keyboard Shortcut Mock
```typescript
jest.mock('react-hotkeys-hook', () => ({
  useHotkeys: jest.fn((keys, callback) => {
    // Mock implementation for testing shortcuts
    global.mockShortcuts = global.mockShortcuts || {};
    global.mockShortcuts[keys] = callback;
  })
}));
```

#### Accessibility Testing Mock
```typescript
jest.mock('@axe-core/react', () => ({
  default: jest.fn(),
  configureAxe: jest.fn()
}));

// Custom accessibility testing utilities
export const mockA11yResults = {
  violations: [],
  passes: [],
  incomplete: [],
  inapplicable: []
};

export const checkA11y = jest.fn().mockResolvedValue(mockA11yResults);
```

### Database Mocks

#### Preference Model Mock
```typescript
const mockUserPreferences = {
  id: 'pref-1',
  user_id: 'user-1',
  theme: 'dark',
  layout_density: 'comfortable',
  reduce_motion: false,
  // ... other fields
};

jest.mock('../models/UserPreferences', () => ({
  findOne: jest.fn().mockResolvedValue(mockUserPreferences),
  create: jest.fn().mockResolvedValue(mockUserPreferences),
  update: jest.fn().mockResolvedValue([1, [mockUserPreferences]])
}));
```

### Testing Utilities

#### Custom Render with Accessibility
```typescript
export const renderWithA11y = (component: React.ReactElement) => {
  const { container, ...rest } = render(component);
  
  // Add accessibility testing utilities
  const checkAccessibility = async () => {
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  };

  return {
    container,
    checkAccessibility,
    ...rest
  };
};
```

#### Keyboard Testing Utilities
```typescript
export const simulateKeyboardNavigation = async (
  page: Page,
  sequence: string[]
) => {
  for (const key of sequence) {
    await page.press('body', key);
    await page.waitForTimeout(100); // Allow for animations
  }
};

export const expectFocusedElement = async (
  page: Page,
  selector: string
) => {
  const focusedElement = await page.locator(':focus');
  await expect(focusedElement).toHaveAttribute('data-testid', selector);
};
```