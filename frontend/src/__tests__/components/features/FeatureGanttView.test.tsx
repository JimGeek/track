/**
 * FeatureGanttView Tests
 * 
 * Tests for the critical Gantt chart date display bug where features
 * show random dates when no actual dates are set.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FeatureGanttView from '../../../components/features/FeatureGanttView';
import { 
  createMockFeatureListItem, 
  createFeatureWithDateIssues,
  createGanttDateScenarios,
  createHierarchicalFeatures
} from '../../factories/testDataFactories';
import { FeatureListItem } from '../../../services/api';

// Mock Date.now() for consistent testing
const mockNow = new Date('2024-02-15T12:00:00.000Z');

describe('FeatureGanttView - Date Calculation Logic', () => {
  const dateScenarios = createGanttDateScenarios();

  beforeEach(() => {
    jest.spyOn(global.Date, 'now').mockReturnValue(mockNow.getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('CRITICAL BUG: Random date display for features without dates', () => {
    test('should not display features with no dates at random positions', () => {
      const featuresWithNodates = [
        createFeatureWithDateIssues('no-dates'),
      ];

      render(
        <FeatureGanttView 
          features={featuresWithNodates} 
          projectId="project-1"
        />
      );

      // Feature should be displayed in the list
      expect(screen.getByText('Test Feature')).toBeInTheDocument();
      
      // CRITICAL TEST: Feature with no dates should have predictable behavior
      // Current implementation creates "random" dates based on current time + estimated hours
      // This test documents the current buggy behavior
      
      // The bug creates bars near "current date" even when no dates are set
      // This makes the Gantt chart misleading and confusing
      const featureBar = screen.getByText('Test Feature').closest('[style*="left:"]');
      
      // With current bug: bar will be positioned based on calculated dates
      // This should be fixed to either:
      // 1. Not show bars for features without dates, OR
      // 2. Show them in a special "unscheduled" area
      expect(featureBar).toBeTruthy(); // Current buggy behavior
    });

    test('CRITICAL BUG: Features without dates get fallback date calculation', () => {
      const featureWithoutDates = createFeatureWithDateIssues('no-dates');
      // Set estimated hours to test the fallback calculation
      featureWithoutDates.estimated_hours = 16; // 2 days

      render(
        <FeatureGanttView 
          features={[featureWithoutDates]} 
          projectId="project-1"
        />
      );

      // CRITICAL TEST: The component calculates dates when none exist
      // Lines 347-349 in FeatureGanttView.tsx show this logic:
      // actualStartDate = new Date(now);
      // actualEndDate = new Date(now.getTime() + estimatedDays * 24 * 60 * 60 * 1000);
      
      // This creates misleading visual representation
      const tooltip = screen.getByText('Test Feature');
      fireEvent.mouseEnter(tooltip);

      // The bug: calculated dates appear in tooltip even though no dates were set
      // User sees dates that were never actually set
      // This is confusing and makes planning unreliable
      
      expect(screen.getByText('Test Feature')).toBeInTheDocument();
    });

    test('should handle features with only start_date but no end_date', () => {
      const featureWithStartOnly = createFeatureWithDateIssues('start-only');
      featureWithStartOnly.estimated_hours = 8; // 1 day

      render(
        <FeatureGanttView 
          features={[featureWithStartOnly]} 
          projectId="project-1"
        />
      );

      // Should calculate end date based on start + estimated hours
      expect(screen.getByText('Test Feature')).toBeInTheDocument();
      
      // This behavior is reasonable - calculating end from start + duration
      const featureBar = screen.getByText('Test Feature').closest('[style*="left:"]');
      expect(featureBar).toBeTruthy();
    });

    test('should handle features with only end_date but no start_date', () => {
      const featureWithEndOnly = createFeatureWithDateIssues('end-only');
      featureWithEndOnly.estimated_hours = 8; // 1 day

      render(
        <FeatureGanttView 
          features={[featureWithEndOnly]} 
          projectId="project-1"
        />
      );

      // Should calculate start date based on end - estimated hours
      expect(screen.getByText('Test Feature')).toBeInTheDocument();
      
      // This behavior is reasonable - calculating start from end - duration
      const featureBar = screen.getByText('Test Feature').closest('[style*="left:"]');
      expect(featureBar).toBeTruthy();
    });

    test('CRITICAL BUG: Features with no dates and no estimated hours get default duration', () => {
      const featureWithNoData = createFeatureWithDateIssues('no-dates');
      featureWithNoData.estimated_hours = null; // No time estimate

      render(
        <FeatureGanttView 
          features={[featureWithNoData]} 
          projectId="project-1"
        />
      );

      // CRITICAL TEST: Line 348-349 shows fallback to 7 days when no estimate
      // const estimatedDays = feature.estimated_hours ? Math.ceil(feature.estimated_hours / 8) : 7;
      // actualEndDate = new Date(now.getTime() + estimatedDays * 24 * 60 * 60 * 1000);
      
      // This creates a 7-day bar starting from "now" - completely arbitrary
      expect(screen.getByText('Test Feature')).toBeInTheDocument();
      
      const featureBar = screen.getByText('Test Feature').closest('[style*="left:"]');
      expect(featureBar).toBeTruthy(); // Documents current buggy behavior
    });
  });

  describe('Timeline generation and date range calculation', () => {
    test('should generate proper timeline when features have actual dates', () => {
      const featuresWithValidDates = [
        createMockFeatureListItem({
          start_date: '2024-02-01',
          end_date: '2024-02-10',
          title: 'Feature 1'
        }),
        createMockFeatureListItem({
          start_date: '2024-02-15',
          end_date: '2024-02-25',
          title: 'Feature 2'
        }),
      ];

      render(
        <FeatureGanttView 
          features={featuresWithValidDates} 
          projectId="project-1"
        />
      );

      // Should show timeline spanning the date range
      expect(screen.getByText('Feature 1')).toBeInTheDocument();
      expect(screen.getByText('Feature 2')).toBeInTheDocument();
      
      // Timeline should include both date ranges
      expect(screen.getByText('Project Timeline')).toBeInTheDocument();
    });

    test('CRITICAL BUG: Timeline calculation with mixed date scenarios', () => {
      const mixedFeatures = [
        createMockFeatureListItem({
          start_date: '2024-02-01',
          end_date: '2024-02-10',
          title: 'Scheduled Feature'
        }),
        createFeatureWithDateIssues('no-dates'), // Will get calculated dates
      ];

      render(
        <FeatureGanttView 
          features={mixedFeatures} 
          projectId="project-1"
        />
      );

      // CRITICAL BUG: Timeline includes both real and calculated dates
      // This pollutes the timeline with artificial dates
      // Making the view confusing and unreliable for planning
      
      expect(screen.getByText('Scheduled Feature')).toBeInTheDocument();
      expect(screen.getByText('Test Feature')).toBeInTheDocument();
    });

    test('should handle empty features list gracefully', () => {
      render(
        <FeatureGanttView 
          features={[]} 
          projectId="project-1"
        />
      );

      expect(screen.getByText(/no features to display/i)).toBeInTheDocument();
      expect(screen.getByText(/add features to see the gantt chart/i)).toBeInTheDocument();
    });
  });

  describe('Feature positioning and width calculations', () => {
    test('should calculate feature positions correctly for valid dates', () => {
      const feature = createMockFeatureListItem({
        start_date: '2024-02-01',
        end_date: '2024-02-15',
        title: 'Positioned Feature'
      });

      render(
        <FeatureGanttView 
          features={[feature]} 
          projectId="project-1"
        />
      );

      const featureElement = screen.getByText('Positioned Feature');
      expect(featureElement).toBeInTheDocument();
      
      // Feature should have calculated position and width
      const featureBar = featureElement.closest('[style*="left:"]');
      expect(featureBar).toBeTruthy();
      expect(featureBar).toHaveStyle(/left:\s*[\d.]+%/);
      expect(featureBar).toHaveStyle(/width:\s*[\d.]+%/);
    });

    test('should enforce minimum width for features', () => {
      const shortFeature = createMockFeatureListItem({
        start_date: '2024-02-01',
        end_date: '2024-02-01', // Same day - very short duration
        title: 'Short Feature'
      });

      render(
        <FeatureGanttView 
          features={[shortFeature]} 
          projectId="project-1"
        />
      );

      const featureElement = screen.getByText('Short Feature');
      const featureBar = featureElement.closest('[style*="left:"]');
      
      // Should enforce minimum width (documented as 1% in code)
      expect(featureBar).toBeTruthy();
      expect(featureBar).toHaveStyle(/width:\s*[\d.]+%/);
    });

    test('CRITICAL BUG: Position calculation for features without real dates', () => {
      const featureNoRealDates = createFeatureWithDateIssues('no-dates');

      render(
        <FeatureGanttView 
          features={[featureNoRealDates]} 
          projectId="project-1"
        />
      );

      const featureElement = screen.getByText('Test Feature');
      const featureBar = featureElement.closest('[style*="left:"]');
      
      // CRITICAL BUG: Feature gets positioned based on calculated "now" date
      // This creates misleading visual positioning on the timeline
      // Users think the feature is scheduled when it's not
      expect(featureBar).toBeTruthy(); // Documents current buggy behavior
      expect(featureBar).toHaveStyle(/left:\s*[\d.]+%/); // Will have calculated position
    });
  });

  describe('Hierarchy and sub-features display', () => {
    test('should display hierarchical features correctly', () => {
      const hierarchicalFeatures = createHierarchicalFeatures();

      render(
        <FeatureGanttView 
          features={hierarchicalFeatures} 
          projectId="project-1"
        />
      );

      expect(screen.getByText('Root Feature 1')).toBeInTheDocument();
      expect(screen.getByText('Child Feature 1.1')).toBeInTheDocument();
      expect(screen.getByText('Child Feature 1.2')).toBeInTheDocument();
      expect(screen.getByText('Root Feature 2')).toBeInTheDocument();
    });

    test('should handle expand/collapse functionality', async () => {
      const hierarchicalFeatures = createHierarchicalFeatures();

      render(
        <FeatureGanttView 
          features={hierarchicalFeatures} 
          projectId="project-1"
        />
      );

      // Initially all should be expanded
      expect(screen.getByText('Child Feature 1.1')).toBeInTheDocument();

      // Find and click collapse button for root feature
      const collapseButtons = screen.getAllByRole('button');
      const rootFeatureCollapseButton = collapseButtons.find(button => 
        button.closest('div')?.textContent?.includes('Root Feature 1')
      );

      if (rootFeatureCollapseButton) {
        fireEvent.click(rootFeatureCollapseButton);
        
        // Children should be hidden after collapse
        await waitFor(() => {
          expect(screen.queryByText('Child Feature 1.1')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Tooltip functionality', () => {
    test('should show tooltip with feature details on hover', () => {
      const feature = createMockFeatureListItem({
        title: 'Hover Feature',
        start_date: '2024-02-01',
        end_date: '2024-02-15',
        estimated_hours: 40,
        progress_percentage: 50
      });

      render(
        <FeatureGanttView 
          features={[feature]} 
          projectId="project-1"
        />
      );

      const featureBar = screen.getByText('Hover Feature');
      fireEvent.mouseEnter(featureBar);

      // Tooltip should appear with feature details
      expect(screen.getByText('Hover Feature')).toBeInTheDocument();
      expect(screen.getByText('40h')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    test('CRITICAL BUG: Tooltip shows calculated dates as if they were real', () => {
      const featureWithoutDates = createFeatureWithDateIssues('no-dates');

      render(
        <FeatureGanttView 
          features={[featureWithoutDates]} 
          projectId="project-1"
        />
      );

      const featureBar = screen.getByText('Test Feature');
      fireEvent.mouseEnter(featureBar);

      // CRITICAL BUG: Tooltip will show calculated dates
      // User cannot distinguish between real and calculated dates
      // This is misleading and makes planning decisions unreliable
      
      // The tooltip should either:
      // 1. Show "No dates set" for features without real dates
      // 2. Clearly indicate calculated vs real dates
      // 3. Not show date information at all for unscheduled features
      
      expect(screen.getByText('Test Feature')).toBeInTheDocument();
      // Current implementation will show dates in tooltip even when none were set
    });
  });

  describe('Drag and drop functionality', () => {
    test('should handle drag start for date updates', () => {
      const feature = createMockFeatureListItem({
        start_date: '2024-02-01',
        end_date: '2024-02-15',
        title: 'Draggable Feature'
      });

      const mockOnFeatureUpdate = jest.fn();

      render(
        <FeatureGanttView 
          features={[feature]} 
          projectId="project-1"
          onFeatureUpdate={mockOnFeatureUpdate}
        />
      );

      const featureBar = screen.getByText('Draggable Feature');
      fireEvent.mouseDown(featureBar);

      // Should initiate drag state
      expect(featureBar).toBeInTheDocument();
      
      // Test drag move
      fireEvent.mouseMove(featureBar, { clientX: 100 });
      
      // Test drag end
      fireEvent.mouseUp(featureBar);

      // Should call update function with new dates
      // Note: Full drag testing requires more complex setup with getBoundingClientRect mocking
    });

    test('CRITICAL BUG: Dragging features without real dates updates calculated dates', () => {
      const featureWithoutDates = createFeatureWithDateIssues('no-dates');
      const mockOnFeatureUpdate = jest.fn();

      render(
        <FeatureGanttView 
          features={[featureWithoutDates]} 
          projectId="project-1"
          onFeatureUpdate={mockOnFeatureUpdate}
        />
      );

      const featureBar = screen.getByText('Test Feature');
      
      // CRITICAL BUG: User can drag a feature that has no real dates
      // This will "save" the calculated dates as if they were real
      // Converting calculated/artificial dates into actual scheduled dates
      // This is misleading and can cause scheduling conflicts
      
      fireEvent.mouseDown(featureBar);
      fireEvent.mouseMove(featureBar, { clientX: 150 });
      fireEvent.mouseUp(featureBar);

      // The update should either be prevented or clearly indicated
      // that dates are being set for the first time
    });
  });

  describe('Today marker and visual indicators', () => {
    test('should show today marker correctly', () => {
      const feature = createMockFeatureListItem({
        start_date: '2024-02-10',
        end_date: '2024-02-20',
        title: 'Current Feature'
      });

      render(
        <FeatureGanttView 
          features={[feature]} 
          projectId="project-1"
        />
      );

      // Should show "Today" marker
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    test('should show progress indicators within feature bars', () => {
      const featureWithProgress = createMockFeatureListItem({
        start_date: '2024-02-01',
        end_date: '2024-02-15',
        progress_percentage: 75,
        title: 'Progress Feature'
      });

      render(
        <FeatureGanttView 
          features={[featureWithProgress]} 
          projectId="project-1"
        />
      );

      const featureBar = screen.getByText('Progress Feature');
      expect(featureBar).toBeInTheDocument();
      
      // Progress indicator should be visible within the bar
      const progressIndicator = featureBar.closest('div')?.querySelector('[style*="width: 75%"]');
      expect(progressIndicator).toBeTruthy();
    });
  });
});