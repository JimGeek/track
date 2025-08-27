# Technical Stack

> Last Updated: 2025-08-26
> Version: 2.0.0

## Application Framework

- **Framework:** Next.js 15+ (App Router)
- **Runtime:** Node.js 20+
- **Version:** Latest stable release

## Database

- **Primary Database:** SQLite (development) / PostgreSQL (production)
- **ORM:** Prisma 5+

## JavaScript

- **Framework:** React 18+ with TypeScript
- **Import Strategy:** ES Modules

## CSS Framework

- **Framework:** TailwindCSS 3.4+
- **Design System:** Custom utility classes following Vercel/Notion aesthetic

## UI Component Library

- **Library:** shadcn/ui
- **Integration:** Built on Radix UI primitives with TailwindCSS

## Typography & Icons

- **Fonts Provider:** Inter/Geist (following Vercel design)
- **Icon Library:** Lucide React
- **Typography:** System fonts with Vercel/Notion-inspired hierarchy

## Hosting & Infrastructure

- **Application Hosting:** Vercel
- **Database Hosting:** PlanetScale / Railway
- **Asset Hosting:** Vercel Edge Network

## Deployment & DevOps

- **Deployment Solution:** Vercel GitHub Integration
- **Code Repository:** GitHub

## Architecture Overview

### Full-Stack Next.js
- **Framework:** Next.js 15+ with App Router for server-side rendering and optimal performance
- **API Routes:** Built-in API routes for serverless backend functionality
- **Database:** Prisma ORM with SQLite (dev) / PostgreSQL (prod) for type-safe data access
- **Authentication:** Next-Auth.js for flexible authentication strategies
- **State Management:** Zustand for lightweight client-side state management

### Frontend Stack
- **UI Framework:** React 18+ with TypeScript for type-safe component development
- **Components:** shadcn/ui for accessible, customizable components
- **Styling:** TailwindCSS with custom design tokens inspired by Vercel/Notion
- **Views:** Multiple visualization components (List, Kanban, Gantt chart)
- **Icons:** Lucide React for consistent, minimal iconography
- **Animations:** Framer Motion for smooth, performant micro-interactions

### Performance Optimization
- **Bundle Size:** Tree-shaking and code splitting for minimal JavaScript payload
- **Caching:** Next.js ISR and SWR for optimal data fetching
- **Image Optimization:** Next.js Image component for automatic optimization
- **Font Loading:** Self-hosted fonts with preload optimization

### Development Experience
- **TypeScript:** Full type safety across frontend and backend
- **ESLint/Prettier:** Consistent code formatting and quality
- **Testing:** Jest and React Testing Library for component testing
- **Development:** Hot reloading and fast refresh for rapid iteration

### Data Architecture

### Three-View System
- **List View:** Traditional todo list with sorting, filtering, and priority indicators
- **Kanban View:** Card-based workflow with drag-and-drop status management
- **Gantt Chart View:** Timeline visualization with date ranges and dependencies

### Task Schema
```typescript
Task {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'todo' | 'ongoing' | 'done'
  startDate: Date
  endDate: Date
  listId: string
  createdAt: Date
  updatedAt: Date
}
```

### Minimalistic Design System
- **Color Palette:** Neutral grays with accent colors for priority/status
- **Typography:** Inter/Geist font stack with clear hierarchy
- **Spacing:** Consistent 4px/8px grid system
- **Components:** Clean, accessible components with focus states
- **Dark Mode:** System preference detection with manual toggle

This modern, performance-focused stack delivers the lightweight, fast experience requested while maintaining scalability and developer experience. The single-framework approach reduces complexity while the shadcn/ui components ensure consistent, accessible design.