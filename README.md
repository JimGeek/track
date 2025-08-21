# Track - Project Management Platform

A comprehensive project and feature request management platform built with Django REST Framework and React.

## Features

Track transforms how development teams organize, visualize, and deliver complex projects with:

- **Hierarchical Project Management**: Multi-level project/feature/sub-feature organization
- **Visual Timeline Analytics**: Gantt charts with overlap detection and conflict resolution
- **Intelligent Workflow**: 5-stage development pipeline (Idea → Specification → Development → Testing → Live)
- **Real-time Dashboard**: Comprehensive analytics and progress tracking
- **Advanced Search**: Full-text search with intelligent filtering
- **Responsive Design**: Mobile-first with PWA capabilities

## Tech Stack

### Backend
- **Framework**: Django 4.2+ with Django REST Framework
- **Authentication**: JWT tokens with email-based auth
- **Database**: PostgreSQL 17+
- **Cache**: Redis for sessions and performance
- **Task Queue**: Celery for background processing

### Frontend
- **Framework**: React (latest stable)
- **Styling**: TailwindCSS 4.0+ with daisyUI components
- **State Management**: React Query for server state
- **Icons**: Lucide React
- **Charts**: Chart.js/D3.js for visualizations

### Deployment
- **API**: track-api.marvelhomes.pro (VPS deployment)
- **Frontend**: Vercel hosting
- **CI/CD**: GitHub Actions

## Getting Started

### Backend Setup

1. Clone the repository:
```bash
git clone git@github.com:JimGeek/track.git
cd track/backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run migrations:
```bash
python manage.py migrate
```

5. Create superuser:
```bash
python manage.py createsuperuser
```

6. Start development server:
```bash
python manage.py runserver
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

## Development

### Running Tests

Backend:
```bash
cd backend
pytest
```

Frontend:
```bash
cd frontend
npm test
```

### Code Quality

The project follows strict code quality standards:
- **Backend**: Django best practices with comprehensive testing
- **Frontend**: React best practices with TypeScript
- **Security**: OWASP compliance and security headers
- **Performance**: Optimized queries and caching strategies

## API Documentation

Once the backend is running, API documentation is available at:
- Development: http://localhost:8000/api/docs/
- Production: https://track-api.marvelhomes.pro/api/docs/

## Deployment

### Production Backend (VPS)

The backend is deployed to `track-api.marvelhomes.pro` using:
- **Server**: Ubuntu VPS with Nginx
- **Database**: PostgreSQL
- **Process Manager**: systemd
- **SSL**: Let's Encrypt certificates

### Frontend (Vercel)

The frontend is automatically deployed to Vercel on pushes to the main branch.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Submit a pull request

## License

This project is proprietary software. All rights reserved.

## Support

For support and questions, please open an issue on GitHub or contact the development team.