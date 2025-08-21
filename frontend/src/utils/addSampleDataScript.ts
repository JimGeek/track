import { createSampleData } from './sampleData';

// Simple script to add sample data to the database
// This can be called from the browser console or triggered via UI

export const addSampleDataToDatabase = async () => {
  console.log('🚀 Starting to add sample data to database...');
  
  try {
    const result = await createSampleData();
    
    if (result.success) {
      console.log('✅ Sample data successfully added to database!');
      console.log('🎉 You can now test the application with rich sample data');
      return {
        success: true,
        message: 'Sample data added successfully! Refresh the page to see the data.'
      };
    } else {
      console.error('❌ Failed to add sample data:', result.message);
      return {
        success: false,
        message: result.message
      };
    }
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
    return {
      success: false,
      message: 'Failed to add sample data. Please check the console for details.'
    };
  }
};

// Make it available globally for console access
(window as any).addSampleData = addSampleDataToDatabase;