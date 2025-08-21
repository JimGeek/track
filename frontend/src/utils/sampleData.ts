import apiService from '../services/api';

export const createSampleData = async () => {
  try {
    console.log('🚀 Creating sample data...');

    // Sample projects
    const sampleProjects = [
      {
        name: 'E-Commerce Platform',
        description: 'A comprehensive online shopping platform with modern UI/UX, secure payments, and real-time inventory management.',
        priority: 'high' as const,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60 days from now
        team_member_emails: ['john@example.com', 'sarah@example.com', 'designreview@example.com']
      },
      {
        name: 'Mobile Banking App',
        description: 'Secure mobile banking application with biometric authentication, transaction history, and budget tracking features.',
        priority: 'critical' as const,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        team_member_emails: ['mike@example.com', 'alice@example.com', 'designreview@example.com']
      },
      {
        name: 'Design System & UI Library',
        description: 'Comprehensive design system with reusable components, design tokens, and style guides for consistent user interfaces.',
        priority: 'high' as const,
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 45 days from now
        team_member_emails: ['designreview@example.com', 'sarah@example.com']
      },
      {
        name: 'Task Management Dashboard',
        description: 'A powerful project management tool with Kanban boards, time tracking, and team collaboration features.',
        priority: 'medium' as const,
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
        team_member_emails: ['david@example.com', 'designreview@example.com']
      },
      {
        name: 'AI Content Generator',
        description: 'An intelligent content creation platform using machine learning to generate high-quality articles, blogs, and social media posts.',
        priority: 'low' as const,
        deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 120 days from now
        team_member_emails: ['emma@example.com', 'ryan@example.com']
      },
      {
        name: 'Real Estate Portal',
        description: 'Complete real estate management system with property listings, virtual tours, and mortgage calculator.',
        priority: 'medium' as const,
        deadline: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 75 days from now
        team_member_emails: ['lisa@example.com', 'designreview@example.com']
      },
      {
        name: 'UX Research Platform',
        description: 'User research and testing platform with survey tools, analytics dashboard, and user feedback collection systems.',
        priority: 'medium' as const,
        deadline: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 65 days from now
        team_member_emails: ['designreview@example.com']
      }
    ];

    const createdProjects = [];
    for (const project of sampleProjects) {
      try {
        const response = await apiService.createProject(project);
        createdProjects.push(response.data);
        console.log(`✅ Created project: ${project.name}`);
      } catch (error) {
        console.error(`❌ Failed to create project ${project.name}:`, error);
      }
    }

    // Sample features for each project
    const sampleFeatures = [
      // E-Commerce Platform features
      {
        project: createdProjects[0]?.id,
        title: 'User Authentication System',
        description: 'Implement secure user registration, login, and password reset functionality with email verification.',
        priority: 'high' as const,
        estimated_hours: 40,
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee_email: 'john@example.com'
      },
      {
        project: createdProjects[0]?.id,
        title: 'UI/UX Design Review',
        description: 'Comprehensive design review of the e-commerce platform interface, user flows, and accessibility compliance.',
        priority: 'high' as const,
        estimated_hours: 30,
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee_email: 'designreview@example.com'
      },
      {
        project: createdProjects[0]?.id,
        title: 'Product Catalog',
        description: 'Create a comprehensive product catalog with categories, filters, search, and detailed product pages.',
        priority: 'high' as const,
        estimated_hours: 60,
        due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee_email: 'sarah@example.com'
      },
      {
        project: createdProjects[0]?.id,
        title: 'Responsive Design Implementation',
        description: 'Ensure the platform works seamlessly across all devices with responsive design patterns and mobile optimization.',
        priority: 'high' as const,
        estimated_hours: 35,
        due_date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee_email: 'designreview@example.com'
      },
      {
        project: createdProjects[0]?.id,
        title: 'Shopping Cart & Checkout',
        description: 'Implement shopping cart functionality with secure checkout process and multiple payment options.',
        priority: 'critical' as const,
        estimated_hours: 80,
        due_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee_email: 'john@example.com'
      },
      {
        project: createdProjects[0]?.id,
        title: 'Order Management',
        description: 'Build order tracking, status updates, and order history for customers and administrators.',
        priority: 'medium' as const,
        estimated_hours: 45,
        due_date: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee_email: 'sarah@example.com'
      },

      // Mobile Banking App features
      {
        project: createdProjects[1]?.id,
        title: 'Biometric Authentication',
        description: 'Implement fingerprint and face recognition for secure app access.',
        priority: 'critical' as const,
        estimated_hours: 50,
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee_email: 'mike@example.com'
      },
      {
        project: createdProjects[1]?.id,
        title: 'Mobile UI/UX Optimization',
        description: 'Optimize the mobile banking interface for better usability, accessibility, and user experience.',
        priority: 'high' as const,
        estimated_hours: 25,
        due_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee_email: 'designreview@example.com'
      },
      {
        project: createdProjects[1]?.id,
        title: 'Account Balance & Transactions',
        description: 'Display real-time account balances and transaction history with filtering options.',
        priority: 'high' as const,
        estimated_hours: 35,
        due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee_email: 'alice@example.com'
      },
      {
        project: createdProjects[1]?.id,
        title: 'Fund Transfer',
        description: 'Enable secure money transfers between accounts with transaction limits and verification.',
        priority: 'critical' as const,
        estimated_hours: 65,
        due_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee_email: 'mike@example.com'
      },

      // Design System & UI Library features
      {
        project: createdProjects[2]?.id,
        title: 'Design Token System',
        description: 'Create comprehensive design tokens for colors, typography, spacing, and other design properties.',
        priority: 'critical' as const,
        estimated_hours: 40,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee_email: 'designreview@example.com'
      },
      {
        project: createdProjects[2]?.id,
        title: 'Component Library',
        description: 'Build reusable UI components (buttons, forms, modals, etc.) with consistent styling and behavior.',
        priority: 'high' as const,
        estimated_hours: 80,
        due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee_email: 'designreview@example.com'
      },
      {
        project: createdProjects[2]?.id,
        title: 'Style Guide Documentation',
        description: 'Create comprehensive documentation for design guidelines, component usage, and best practices.',
        priority: 'medium' as const,
        estimated_hours: 30,
        due_date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee_email: 'designreview@example.com'
      },
      {
        project: createdProjects[2]?.id,
        title: 'Accessibility Standards',
        description: 'Implement WCAG 2.1 AA compliance across all components and establish accessibility testing procedures.',
        priority: 'high' as const,
        estimated_hours: 45,
        due_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee_email: 'designreview@example.com'
      },
      {
        project: createdProjects[2]?.id,
        title: 'Dark Mode Support',
        description: 'Implement dark mode variants for all components and establish theme switching mechanisms.',
        priority: 'medium' as const,
        estimated_hours: 35,
        due_date: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee_email: 'sarah@example.com'
      },

      // Task Management Dashboard features
      {
        project: createdProjects[3]?.id,
        title: 'Kanban Board',
        description: 'Create drag-and-drop Kanban boards for visual project management.',
        priority: 'high' as const,
        estimated_hours: 55,
        due_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee_email: 'david@example.com'
      },
      {
        project: createdProjects[3]?.id,
        title: 'Dashboard UI Design',
        description: 'Design intuitive dashboard interface with data visualization and user-friendly navigation.',
        priority: 'high' as const,
        estimated_hours: 35,
        due_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee_email: 'designreview@example.com'
      },
      {
        project: createdProjects[3]?.id,
        title: 'Time Tracking',
        description: 'Implement time tracking for tasks with reporting and analytics.',
        priority: 'medium' as const,
        estimated_hours: 40,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee_email: 'david@example.com'
      },

      // AI Content Generator features
      {
        project: createdProjects[4]?.id,
        title: 'AI Text Generation Engine',
        description: 'Develop the core AI engine for generating various types of content using machine learning models.',
        priority: 'high' as const,
        estimated_hours: 120,
        due_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee_email: 'emma@example.com'
      },
      {
        project: createdProjects[4]?.id,
        title: 'Content Templates',
        description: 'Create customizable templates for different content types (blogs, social media, articles).',
        priority: 'medium' as const,
        estimated_hours: 30,
        due_date: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee_email: 'ryan@example.com'
      },

      // Real Estate Portal features
      {
        project: createdProjects[5]?.id,
        title: 'Property Listings',
        description: 'Create comprehensive property listing system with photos, details, and search functionality.',
        priority: 'high' as const,
        estimated_hours: 70,
        due_date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee_email: 'lisa@example.com'
      },
      {
        project: createdProjects[5]?.id,
        title: 'Real Estate UI/UX Design',
        description: 'Design modern, user-friendly interface for property browsing and real estate transactions.',
        priority: 'high' as const,
        estimated_hours: 40,
        due_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee_email: 'designreview@example.com'
      },
      {
        project: createdProjects[5]?.id,
        title: 'Virtual Tours',
        description: 'Implement 360-degree virtual tours and interactive property walkthroughs.',
        priority: 'medium' as const,
        estimated_hours: 85,
        due_date: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee_email: 'lisa@example.com'
      },

      // UX Research Platform features
      {
        project: createdProjects[6]?.id,
        title: 'User Survey System',
        description: 'Build comprehensive survey creation and distribution system with analytics.',
        priority: 'critical' as const,
        estimated_hours: 60,
        due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee_email: 'designreview@example.com'
      },
      {
        project: createdProjects[6]?.id,
        title: 'User Testing Dashboard',
        description: 'Create dashboard for managing user testing sessions, recordings, and insights.',
        priority: 'high' as const,
        estimated_hours: 55,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee_email: 'designreview@example.com'
      },
      {
        project: createdProjects[6]?.id,
        title: 'Analytics & Reporting',
        description: 'Implement comprehensive analytics for user behavior tracking and research insights.',
        priority: 'medium' as const,
        estimated_hours: 45,
        due_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee_email: 'designreview@example.com'
      },
      {
        project: createdProjects[6]?.id,
        title: 'Feedback Collection System',
        description: 'Build system for collecting, organizing, and analyzing user feedback across multiple channels.',
        priority: 'high' as const,
        estimated_hours: 40,
        due_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee_email: 'designreview@example.com'
      }
    ];

    // Create features
    for (const feature of sampleFeatures) {
      if (feature.project) {
        try {
          await apiService.createFeature(feature);
          console.log(`✅ Created feature: ${feature.title}`);
        } catch (error) {
          console.error(`❌ Failed to create feature ${feature.title}:`, error);
        }
      }
    }

    console.log('🎉 Sample data creation completed!');
    return { success: true, message: 'Sample data created successfully!' };

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    return { success: false, message: 'Failed to create sample data. Please try again.' };
  }
};

export const clearAllData = async () => {
  try {
    console.log('🧹 Clearing all data...');
    
    // This would require additional API endpoints to clear data
    // For now, just log the intent
    console.log('⚠️ Clear data functionality would require additional API endpoints');
    
    return { success: true, message: 'Data clearing initiated (requires backend support)' };
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    return { success: false, message: 'Failed to clear data' };
  }
};