# Component Architecture

This is the component architecture plan for the complete interface rewrite detailed in @.agent-os/specs/2025-08-26-django-react-trackflow-transformation/spec.md

## Design System Foundation

### shadcn/ui Component Library Setup
- **Base Configuration**: Install and configure shadcn/ui CLI with custom Vercel/Notion-inspired theme
- **Color Palette**: Neutral grays with subtle accent colors, light/dark mode support
- **Typography**: Inter font family with clear hierarchy (headings, body, captions, labels)
- **Spacing System**: Consistent 4px/8px grid system throughout all components
- **Border Radius**: Subtle rounded corners (4px/8px) for modern, clean appearance

### Core shadcn/ui Components Required
- **Layout**: Card, Container, Separator, Sheet, Dialog, Popover
- **Navigation**: Command, Menu, Breadcrumb, Tabs, Pagination
- **Forms**: Input, Textarea, Select, Checkbox, Radio, Switch, Label
- **Data Display**: Table, Badge, Avatar, Progress, Skeleton
- **Feedback**: Alert, Toast, Tooltip, Loading Spinner
- **Interaction**: Button, Toggle, Dropdown Menu, Context Menu

## Page-Level Architecture

### Authentication Pages (Complete Rebuild)
- **Login Page**: Clean centered form with shadcn/ui Card, Input, Button components
- **Register Page**: Multi-step form using shadcn/ui Form primitives with validation
- **Password Reset**: Minimal interface with clear success/error feedback

### Dashboard Layout (Complete Rebuild)
- **App Shell**: Navigation sidebar using shadcn/ui Sheet component
- **Header**: Clean top bar with user menu, search, and theme toggle
- **Main Content**: Card-based layout for different dashboard sections
- **Sidebar Navigation**: Collapsible menu with todo list quick access

### Todo List Management
- **Todo Lists Overview**: Grid of cards showing todo lists with task counts and progress
- **List Creation/Edit**: Modal forms using shadcn/ui Dialog with form validation
- **List Settings**: Inline editing capabilities with shadcn/ui Popover components

### Task Management Views

#### List View (Rebuild from Scratch)
- **Task Table**: shadcn/ui Table component with sortable columns, filters, and pagination
- **Task Row**: Expandable rows with priority indicators, due dates, status badges
- **Quick Actions**: Inline editing, status updates, priority changes
- **Bulk Operations**: Select multiple tasks with checkbox selection

#### Kanban Board View (Rebuild from Scratch)  
- **Column Layout**: Three columns (Todo, Ongoing, Done) using shadcn/ui Card components
- **Task Cards**: Compact card design with drag-and-drop functionality
- **Column Headers**: Status counts and quick filters
- **Add Task**: Inline task creation in each column

#### Gantt Chart View (Rebuild from Scratch)
- **Timeline Header**: Date range navigation with zoom controls
- **Task Bars**: Visual representation of task duration and dependencies
- **Interactive Elements**: Drag to reschedule, resize to extend/reduce duration
- **Legend**: Priority and status color coding

## Component Hierarchy

### Shared Components
```
src/components/ui/           (shadcn/ui components)
├── button.tsx
├── card.tsx  
├── input.tsx
├── table.tsx
└── ...

src/components/shared/       (Custom business logic components)
├── TaskCard.tsx
├── TodoListCard.tsx
├── PriorityBadge.tsx
├── StatusBadge.tsx
├── DatePicker.tsx
└── ...

src/components/layout/       (Layout components)
├── AppShell.tsx
├── Navigation.tsx
├── Header.tsx
└── Sidebar.tsx
```

### Page Components
```
src/pages/
├── auth/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   └── ResetPasswordPage.tsx
├── dashboard/
│   └── DashboardPage.tsx
├── todos/
│   ├── TodoListsPage.tsx
│   ├── TodoListDetailPage.tsx
│   ├── ListView.tsx
│   ├── KanbanView.tsx
│   └── GanttView.tsx
└── settings/
    └── SettingsPage.tsx
```

## State Management Integration

### React Query Integration
- **Todo Lists**: Queries for fetching, creating, updating, deleting todo lists
- **Tasks**: Optimistic updates for task status changes and priority updates
- **Dashboard Data**: Cached analytics data with automatic refresh
- **Real-time Sync**: Polling-based updates (no WebSocket required)

### Form State Management
- **React Hook Form**: Integration with shadcn/ui form components
- **Zod Validation**: Schema validation for all forms
- **Error Handling**: Consistent error display using shadcn/ui Alert components

## Responsive Design Strategy

### Breakpoint System
- **Mobile**: 320px - 768px (stacked layouts, simplified navigation)
- **Tablet**: 768px - 1024px (adaptive layouts, collapsible sidebar)
- **Desktop**: 1024px+ (full feature layouts, multiple columns)

### Mobile Adaptations
- **Navigation**: Drawer-style navigation using shadcn/ui Sheet
- **Tables**: Horizontal scroll with sticky columns
- **Forms**: Single-column layouts with larger touch targets
- **Kanban**: Horizontal scroll between columns

## Animation and Micro-interactions

### Framer Motion Integration
- **Page Transitions**: Smooth fade-in/slide transitions between routes
- **Task Interactions**: Hover effects, drag animations, status change feedback
- **Loading States**: Skeleton loaders and smooth loading transitions
- **Form Feedback**: Success/error animations for user actions

### Performance Considerations
- **Lazy Loading**: Route-based code splitting for optimal bundle sizes
- **Virtual Scrolling**: For large task lists using @tanstack/react-virtual
- **Optimistic Updates**: Immediate UI feedback with rollback on errors
- **Image Optimization**: Lazy loading and responsive images where applicable

This architecture provides a complete foundation for rebuilding the entire Track application interface using modern shadcn/ui components while maintaining excellent performance and user experience.