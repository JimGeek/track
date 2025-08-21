# How to Add Sample Data to Database

## Method 1: Using the UI Button
1. Navigate to the Projects page (`/projects`)
2. If no projects exist, you'll see a "Try Sample Data" button
3. Click the button to automatically add all sample data

## Method 2: Using Browser Console
1. Open browser developer tools (F12)
2. Go to the Console tab
3. Type: `addSampleData()`
4. Press Enter
5. The function will add all sample data and show progress

## Method 3: Backend Direct (if backend is accessible)
If you have access to the Django backend:

```bash
# Navigate to backend directory
cd ../backend

# Run Django management command (if exists)
python manage.py loaddata sample_data

# Or create a custom management command
python manage.py shell
```

## What Data Gets Added

### Projects (7 total):
1. **E-Commerce Platform** - High priority, 60-day deadline
2. **Mobile Banking App** - Critical priority, 30-day deadline  
3. **Design System & UI Library** - High priority, 45-day deadline
4. **Task Management Dashboard** - Medium priority, 90-day deadline
5. **AI Content Generator** - Low priority, 120-day deadline
6. **Real Estate Portal** - Medium priority, 75-day deadline
7. **UX Research Platform** - Medium priority, 65-day deadline

### Features (25+ total):
- **12 features** assigned to `designreview@example.com`
- **13+ features** assigned to other team members
- Mix of Critical, High, Medium, and Low priorities
- Due dates ranging from 7 to 50 days
- Estimated hours from 25 to 120 hours per feature

### Team Members Included:
- `designreview@example.com` (primary user)
- `john@example.com`
- `sarah@example.com`
- `mike@example.com`
- `alice@example.com`
- `david@example.com`
- `emma@example.com`
- `ryan@example.com`
- `lisa@example.com`

## Troubleshooting

### If Sample Data Button Doesn't Work:
1. Check browser console for errors
2. Ensure backend API is running
3. Check if authentication is working
4. Verify API endpoints are accessible

### If Console Method Doesn't Work:
1. Refresh the page to ensure script is loaded
2. Check if `addSampleData` function is available: `typeof addSampleData`
3. Look for any JavaScript errors in console

### Backend Not Running:
If the backend isn't running, you'll need to:
1. Start the Django development server
2. Ensure database migrations are applied
3. Verify API endpoints are working
4. Check CORS settings for frontend access

## Expected Results

After adding sample data, you should see:
- **7 projects** on the Projects page
- **Multiple features** when clicking on any project
- **Rich dashboard** with statistics and recent projects
- **Varied priorities** and due dates for testing
- **Realistic team assignments** across all projects

The data is specifically designed to test all features of the Track application with realistic project management scenarios.