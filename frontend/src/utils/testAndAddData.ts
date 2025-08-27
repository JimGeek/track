import apiService from '../services/api';

// Test API connection and add sample data
export const testApiAndAddSampleData = async () => {
  console.log('🔍 Testing API connection...');
  
  try {
    // Test if user is authenticated
    console.log('📋 Checking authentication status...');
    
    // First try to get dashboard summary to test auth
    try {
      const dashboardTest = await apiService.getDashboardSummary();
      console.log('✅ User is authenticated and API is working');
      console.log('📊 Dashboard data:', dashboardTest.data);
    } catch (authError: any) {
      console.warn('⚠️ Authentication test failed:', authError.message);
      console.log('💡 You may need to log in first before adding sample data');
      return {
        success: false,
        message: 'Please log in to the application first, then try adding sample data'
      };
    }

    // Test getting existing projects
    console.log('📁 Checking existing projects...');
    const existingProjects = await apiService.getProjects();
    console.log(`📊 Found ${existingProjects.data.results?.length || 0} existing projects`);

    if (existingProjects.data.results && existingProjects.data.results.length > 0) {
      console.log('⚠️ Projects already exist. Sample data may have been added already.');
      console.log('📋 Existing projects:', existingProjects.data.results.map((p: any) => p.name));
      
      // Ask user if they want to continue
      if (!window.confirm('Projects already exist. Do you want to add more sample data anyway?')) {
        return {
          success: false,
          message: 'Sample data creation cancelled by user'
        };
      }
    }

    // Add sample data
    console.log('🚀 Adding sample data...');
    
    // Import and run the sample data creation
    const { createSampleData } = await import('./sampleData');
    const result = await createSampleData();
    
    return result;

  } catch (error: any) {
    console.error('❌ Error testing API or adding data:', error);
    return {
      success: false,
      message: `Error: ${error.message || 'Unknown error occurred'}`
    };
  }
};

// Make available globally
(window as any).testAndAddSampleData = testApiAndAddSampleData;

// Auto-run instructions
console.log(`
🎯 Sample Data Helper Loaded!

To test the API and add sample data, run:
testAndAddSampleData()

Or use the "Try Sample Data" button on the Projects page.

📋 Prerequisites:
1. Backend must be running on http://localhost:8001 ✅
2. User must be logged in to the application
3. Frontend must be running on http://localhost:3001 ✅

🔧 If you encounter issues:
1. Make sure you're logged in to the app
2. Check browser console for detailed error messages
3. Verify backend is running: http://localhost:8001/admin/
`);