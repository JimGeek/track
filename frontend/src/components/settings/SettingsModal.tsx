import React, { useState, memo } from 'react';
import Modal from '../ui/Modal';
import { Button } from '../ui/button';
import ThemeToggle from '../ui/ThemeToggle';
import ExportModal from '../export/ExportModal';
import ImportModal from '../export/ImportModal';
import { useNotifications } from '../../hooks/useNotifications';
import { useToast } from '../ui/Toast';
import { todoApiService } from '../../services/todoApi';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = memo(({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'data' | 'about'>('general');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');
  
  const { 
    permission, 
    isConnected, 
    requestPermission, 
    connectWebSocket, 
    disconnectWebSocket 
  } = useNotifications();
  const { showToast } = useToast();

  const handleClearData = async () => {
    if (!password.trim()) {
      showToast({
        type: 'error',
        title: 'Password Required',
        message: 'Please enter your password to confirm data deletion.',
      });
      return;
    }

    setIsClearing(true);
    try {
      const response = await todoApiService.clearUserData(password);
      
      showToast({
        type: 'success',
        title: 'Data Cleared Successfully',
        message: `Deleted ${response.data.deleted_counts.todo_lists} todo lists, ${response.data.deleted_counts.tasks} tasks, and ${response.data.deleted_counts.activities} activities.`,
      });
      
      setShowPasswordPrompt(false);
      setPassword('');
      onClose();
      
      // Optionally reload the page to show empty state
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error: any) {
      console.error('Error clearing data:', error);
      showToast({
        type: 'error',
        title: 'Failed to Clear Data',
        message: error.response?.data?.error || 'An error occurred while clearing your data.',
      });
    } finally {
      setIsClearing(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'data', label: 'Data', icon: '💾' },
    { id: 'about', label: 'About', icon: 'ℹ️' },
  ] as const;

  const handleNotificationToggle = async () => {
    if (permission.granted) {
      // Disconnect if already connected
      if (isConnected) {
        disconnectWebSocket();
        showToast({
          type: 'info',
          title: 'Notifications Disabled',
          message: 'Real-time notifications have been disabled.',
        });
      } else {
        // Reconnect
        // In a real app, you'd get the user ID from auth context
        connectWebSocket('user-123');
        showToast({
          type: 'success',
          title: 'Notifications Enabled',
          message: 'Real-time notifications have been enabled.',
        });
      }
    } else {
      const granted = await requestPermission();
      if (granted) {
        connectWebSocket('user-123');
        showToast({
          type: 'success',
          title: 'Notifications Enabled',
          message: 'Desktop notifications are now enabled.',
        });
      } else {
        showToast({
          type: 'error',
          title: 'Permission Denied',
          message: 'Please enable notifications in your browser settings.',
        });
      }
    }
  };

  const handleImport = (data: any) => {
    console.log('Imported data:', data);
    showToast({
      type: 'success',
      title: 'Data Imported',
      message: 'Your data has been imported successfully.',
    });
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Settings"
        size="lg"
      >
        <div className="flex h-96">
          {/* Sidebar */}
          <div className="w-48 border-r border-gray-200 dark:border-gray-700 pr-4">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${activeTab === tab.id
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                    }
                  `}
                >
                  <span className="mr-3">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 pl-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    General Settings
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Theme
                    </label>
                    <ThemeToggle showLabel={true} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Language
                    </label>
                    <select 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      defaultValue="en"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Timezone
                    </label>
                    <select 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone}
                    >
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Paris">Paris</option>
                      <option value="Asia/Tokyo">Tokyo</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Notification Settings
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Desktop Notifications
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Get notified about important updates
                      </p>
                    </div>
                    <button
                      onClick={handleNotificationToggle}
                      className={`
                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                        ${permission.granted && isConnected
                          ? 'bg-primary-600' 
                          : 'bg-gray-200 dark:bg-gray-700'
                        }
                      `}
                    >
                      <span
                        className={`
                          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                          ${permission.granted && isConnected
                            ? 'translate-x-6' 
                            : 'translate-x-1'
                          }
                        `}
                      />
                    </button>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className={`w-3 h-3 rounded-full ${
                          isConnected ? 'bg-green-400' : 'bg-red-400'
                        }`}
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {isConnected ? 'Connected to notification service' : 'Disconnected'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Notification Types
                    </h4>
                    
                    {[
                      { id: 'project_updates', label: 'Project Updates', enabled: true },
                      { id: 'feature_assignments', label: 'Feature Assignments', enabled: true },
                      { id: 'status_changes', label: 'Status Changes', enabled: true },
                      { id: 'due_dates', label: 'Due Date Reminders', enabled: false },
                      { id: 'mentions', label: 'Mentions & Comments', enabled: true },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {item.label}
                        </span>
                        <input
                          type="checkbox"
                          defaultChecked={item.enabled}
                          className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Data Management
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Export Data
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      Export your projects and features for backup or migration.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setShowExportModal(true)}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l3 3m0 0l3-3m-3 3V9" />
                      </svg>
                      Export Data
                    </Button>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Import Data
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      Import data from a previous export or migration.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setShowImportModal(true)}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Import Data
                    </Button>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                      Danger Zone
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      These actions cannot be undone.
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowPasswordPrompt(true)}
                      disabled={isClearing}
                    >
                      Clear All Data
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    About Track
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Version:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">1.0.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Build:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{process.env.REACT_APP_VERSION || 'dev'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Environment:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{process.env.NODE_ENV}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Features
                    </h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <li>• Project Management</li>
                      <li>• Feature Request Tracking</li>
                      <li>• Workflow Management</li>
                      <li>• Real-time Notifications</li>
                      <li>• Data Export/Import</li>
                      <li>• Dark Mode Support</li>
                      <li>• Responsive Design</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Support
                    </h4>
                    <div className="space-y-2">
                      <a
                        href="mailto:support@track.example.com"
                        className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                      >
                        Contact Support
                      </a>
                      <br />
                      <a
                        href="https://docs.track.example.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                      >
                        Documentation
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="default" onClick={onClose}>
            Close
          </Button>
        </div>
      </Modal>

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />

      {/* Password Confirmation Modal for Data Clearing */}
      <Modal
        isOpen={showPasswordPrompt}
        onClose={() => {
          setShowPasswordPrompt(false);
          setPassword('');
        }}
        title="Confirm Data Deletion"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                This action cannot be undone
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                All your todo lists, tasks, and activity history will be permanently deleted.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Enter your password to confirm:
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleClearData();
                }
              }}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordPrompt(false);
                setPassword('');
              }}
              disabled={isClearing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearData}
              disabled={isClearing || !password.trim()}
              className="flex-1"
            >
              {isClearing ? 'Clearing...' : 'Delete All Data'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
});

SettingsModal.displayName = 'SettingsModal';

export default SettingsModal;