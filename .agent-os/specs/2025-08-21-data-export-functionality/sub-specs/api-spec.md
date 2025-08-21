# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-21-data-export-functionality/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Endpoints

### Export Request Management

#### POST /api/exports/
Create a new export request with filtering and formatting options.

**Request Body:**
```json
{
  "title": "Weekly Project Report",
  "description": "Export of project data for the current week",
  "format": "pdf",
  "template_id": "uuid-of-template",
  "filters": {
    "date_range": {
      "start": "2025-08-14",
      "end": "2025-08-21"
    },
    "projects": ["project-uuid-1", "project-uuid-2"],
    "tags": ["urgent", "client-work"],
    "search": "meeting"
  },
  "selected_fields": ["date", "project", "task", "duration", "tags"],
  "schedule": {
    "enabled": false,
    "cron_pattern": "0 9 * * 1",
    "email_recipients": ["user@example.com"]
  }
}
```

**Response:**
```json
{
  "id": "export-request-uuid",
  "status": "pending",
  "title": "Weekly Project Report",
  "format": "pdf",
  "progress_percentage": 0,
  "estimated_completion": "2025-08-21T10:05:00Z",
  "created_at": "2025-08-21T10:00:00Z",
  "download_url": null
}
```

#### GET /api/exports/
List user's export requests with filtering and pagination.

**Query Parameters:**
- `status`: Filter by status (pending, processing, completed, failed, expired)
- `format`: Filter by export format
- `page`: Page number for pagination
- `limit`: Items per page (max 100)
- `search`: Search in title and description

**Response:**
```json
{
  "count": 25,
  "next": "/api/exports/?page=2",
  "previous": null,
  "results": [
    {
      "id": "export-request-uuid",
      "title": "Weekly Project Report",
      "format": "pdf",
      "status": "completed",
      "progress_percentage": 100,
      "file_size": 2048576,
      "download_count": 3,
      "created_at": "2025-08-21T10:00:00Z",
      "completed_at": "2025-08-21T10:03:24Z",
      "expires_at": "2025-09-20T10:03:24Z",
      "download_url": "https://secure.example.com/download/token"
    }
  ]
}
```

#### GET /api/exports/{id}/
Retrieve details of a specific export request.

**Response:**
```json
{
  "id": "export-request-uuid",
  "title": "Weekly Project Report",
  "description": "Export of project data for the current week",
  "format": "pdf",
  "status": "completed",
  "progress_percentage": 100,
  "filters": {
    "date_range": {
      "start": "2025-08-14",
      "end": "2025-08-21"
    },
    "projects": ["project-uuid-1"],
    "tags": ["urgent"]
  },
  "selected_fields": ["date", "project", "task", "duration"],
  "file_size": 2048576,
  "download_count": 3,
  "download_url": "https://secure.example.com/download/token",
  "created_at": "2025-08-21T10:00:00Z",
  "started_at": "2025-08-21T10:00:15Z",
  "completed_at": "2025-08-21T10:03:24Z",
  "expires_at": "2025-09-20T10:03:24Z"
}
```

#### DELETE /api/exports/{id}/
Cancel a pending export or delete a completed export.

**Response:**
```json
{
  "message": "Export request deleted successfully"
}
```

### Export Templates

#### GET /api/export-templates/
List available export templates.

**Query Parameters:**
- `format`: Filter by export format
- `public`: Show only public templates (true/false)
- `shared`: Include templates shared with user (true/false)

**Response:**
```json
{
  "results": [
    {
      "id": "template-uuid",
      "name": "Project Summary Report",
      "description": "Comprehensive project overview with charts",
      "format": "pdf",
      "is_public": true,
      "usage_count": 127,
      "created_by": "admin@example.com",
      "created_at": "2025-08-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/export-templates/
Create a new export template.

**Request Body:**
```json
{
  "name": "Custom Project Report",
  "description": "My custom template for project exports",
  "format": "pdf",
  "field_configuration": {
    "fields": ["date", "project", "task", "duration"],
    "headers": ["Date", "Project", "Task", "Hours"],
    "formatting": {
      "date_format": "MM/DD/YYYY",
      "duration_format": "decimal"
    }
  },
  "default_filters": {
    "date_range": "last_month"
  },
  "layout_settings": {
    "orientation": "landscape",
    "include_charts": true,
    "group_by": "project"
  },
  "is_public": false
}
```

#### PUT /api/export-templates/{id}/
Update an existing export template.

#### DELETE /api/export-templates/{id}/
Delete an export template (only if user is owner).

### Export Schedules

#### POST /api/export-schedules/
Create a scheduled export.

**Request Body:**
```json
{
  "name": "Weekly Team Report",
  "template_id": "template-uuid",
  "cron_pattern": "0 9 * * 1",
  "timezone": "America/New_York",
  "email_recipients": ["manager@example.com", "team@example.com"],
  "include_download_link": true,
  "attach_file": false
}
```

#### GET /api/export-schedules/
List user's scheduled exports.

#### PUT /api/export-schedules/{id}/
Update a scheduled export.

#### DELETE /api/export-schedules/{id}/
Delete a scheduled export.

### Download Management

#### GET /api/exports/{id}/download/
Generate a secure download URL for a completed export.

**Response:**
```json
{
  "download_url": "https://secure.example.com/download/signed-token",
  "expires_at": "2025-08-21T11:00:00Z",
  "file_size": 2048576,
  "filename": "weekly-project-report-2025-08-21.pdf"
}
```

#### POST /api/exports/{id}/share/
Share an export with other users.

**Request Body:**
```json
{
  "email_addresses": ["colleague@example.com"],
  "message": "Here's the report you requested",
  "expires_in_days": 7
}
```

### Analytics & Monitoring

#### GET /api/exports/analytics/
Get export usage analytics for the current user.

**Response:**
```json
{
  "current_month": {
    "total_exports": 15,
    "by_format": {
      "csv": 8,
      "pdf": 5,
      "json": 2
    },
    "total_file_size": 52428800,
    "avg_processing_time": "00:02:34"
  },
  "trends": {
    "daily_exports": [
      {"date": "2025-08-21", "count": 3},
      {"date": "2025-08-20", "count": 1}
    ]
  }
}
```

## Controllers

### ExportRequestController
Handles CRUD operations for export requests and manages the async processing workflow.

```python
class ExportRequestController:
    def create_export_request(self, user, export_data):
        """
        Create and queue a new export request
        """
        # Validate request data
        self.validate_export_request(export_data)
        
        # Check user limits
        self.check_user_export_limits(user)
        
        # Create export request
        export_request = ExportRequest.objects.create(
            user=user,
            **export_data
        )
        
        # Queue async processing
        process_export.delay(export_request.id)
        
        # Log creation
        ExportAuditLog.objects.create(
            export_request=export_request,
            user=user,
            action='created',
            ip_address=self.get_client_ip(),
            user_agent=self.get_user_agent()
        )
        
        return export_request
    
    def get_export_status(self, export_id, user):
        """
        Get real-time status of an export request
        """
        export_request = self.get_user_export(export_id, user)
        
        # Check if processing is complete
        if export_request.status == 'processing':
            self.update_processing_status(export_request)
        
        return {
            'id': export_request.id,
            'status': export_request.status,
            'progress_percentage': export_request.progress_percentage,
            'download_url': export_request.download_url,
            'error_message': export_request.error_message
        }
```

### ExportTemplateController
Manages export templates including creation, sharing, and usage tracking.

```python
class ExportTemplateController:
    def create_template(self, user, template_data):
        """
        Create a new export template with validation
        """
        # Validate template configuration
        self.validate_template_config(template_data)
        
        # Create template
        template = ExportTemplate.objects.create(
            user=user,
            **template_data
        )
        
        return template
    
    def get_available_templates(self, user, filters=None):
        """
        Get templates available to user (owned, public, shared)
        """
        queryset = ExportTemplate.objects.filter(
            Q(user=user) | 
            Q(is_public=True) | 
            Q(shared_with=user)
        ).distinct()
        
        if filters:
            queryset = self.apply_template_filters(queryset, filters)
        
        return queryset.order_by('-usage_count', '-created_at')
```

### ExportProcessingController
Handles the async export processing pipeline.

```python
class ExportProcessingController:
    def process_export_request(self, export_request_id):
        """
        Main export processing pipeline
        """
        export_request = ExportRequest.objects.get(id=export_request_id)
        
        try:
            # Update status
            export_request.status = 'processing'
            export_request.started_at = timezone.now()
            export_request.save()
            
            # Collect data
            data = self.collect_export_data(export_request)
            
            # Generate file
            file_path = self.generate_export_file(export_request, data)
            
            # Upload to secure storage
            download_url = self.upload_to_secure_storage(file_path)
            
            # Update completion status
            export_request.status = 'completed'
            export_request.completed_at = timezone.now()
            export_request.download_url = download_url
            export_request.file_size = os.path.getsize(file_path)
            export_request.save()
            
            # Send notification
            self.send_completion_notification(export_request)
            
        except Exception as e:
            self.handle_export_error(export_request, e)
```

### Security & Access Control

#### Authentication & Authorization
- JWT token validation for all API endpoints
- User ownership verification for export requests and templates
- Role-based access control for administrative functions
- Rate limiting to prevent abuse (100 requests per hour per user)

#### Data Protection
- Encryption of sensitive data in export files
- Secure file storage with signed URLs and expiration
- Audit logging of all export and download activities
- GDPR compliance with data anonymization options

#### Error Handling
- Comprehensive error responses with appropriate HTTP status codes
- Detailed logging for debugging without exposing sensitive information
- Graceful degradation for partial data access scenarios
- Clear user-facing error messages with resolution guidance