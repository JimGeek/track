# Technical Stack

> Last Updated: 2025-08-21
> Version: 1.0.0

## Application Framework

- **Framework:** Django 5.0+
- **API Framework:** Django REST Framework (DRF)
- **Version:** Latest stable release

## Database

- **Primary Database:** PostgreSQL 17+

## JavaScript

- **Framework:** React (latest stable)
- **Import Strategy:** Node.js modules

## CSS Framework

- **Framework:** TailwindCSS 4.0+

## UI Component Library

- **Library:** daisyUI
- **Integration:** Built on TailwindCSS foundation

## Typography & Icons

- **Fonts Provider:** Google Fonts (self-hosted)
- **Icon Library:** Lucide React

## Hosting & Infrastructure

- **Application Hosting:** VPN
- **Database Hosting:** PostgreSQL hosting service
- **Asset Hosting:** Vercel

## Deployment & DevOps

- **Deployment Solution:** GitHub Actions
- **Code Repository:** To be determined

## Architecture Overview

### Backend Stack
- **Web Framework:** Django 5.0+ for robust backend development
- **API Framework:** Django REST Framework (DRF) for RESTful API development
- **Authentication:** DRF Token Authentication & JWT for secure API access
- **Database:** PostgreSQL 17+ for reliable data persistence
- **ORM:** Django ORM for database interactions
- **API Documentation:** DRF Spectacular for OpenAPI/Swagger documentation

### Frontend Stack
- **UI Framework:** React (latest stable) for component-based frontend
- **API Client:** Axios for HTTP requests to Django REST API
- **State Management:** React Query for server state management
- **Styling:** TailwindCSS 4.0+ for utility-first CSS framework
- **Components:** daisyUI for pre-built accessible components
- **Icons:** Lucide React for consistent iconography
- **Typography:** Google Fonts (self-hosted) for performance optimization

### Development Workflow
- **Version Control:** Git with GitHub repository
- **CI/CD:** GitHub Actions for automated testing and deployment
- **Module System:** Node.js modules for JavaScript dependency management

### Hosting Strategy
- **Application:** VPN hosting for secure backend deployment
- **Static Assets:** Vercel for optimized frontend asset delivery
- **Database:** Dedicated PostgreSQL hosting for data layer

### API-First Architecture

The Track project follows an API-first approach using Django REST Framework:

- **RESTful APIs:** All business logic exposed through consistent REST endpoints
- **Authentication:** Token-based authentication for secure API access
- **Serialization:** DRF serializers for data validation and transformation
- **Mobile Ready:** API design supports future mobile app development
- **Documentation:** Automated API documentation with DRF Spectacular

This technology stack provides a modern, scalable foundation for the Track project with emphasis on API-first design, performance, developer experience, and maintainability. The separation of backend APIs and frontend client enables future expansion to mobile platforms.