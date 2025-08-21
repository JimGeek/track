import React, { useState, memo } from 'react';
import { useNotifications, Notification } from '../../hooks/useNotifications';
import FadeTransition from '../ui/FadeTransition';
import Button from '../ui/Button';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationItem: React.FC<{ 
  notification: Notification; 
  onRead: (id: string) => void;
  onRemove: (id: string) => void;
}> = memo(({ notification, onRead, onRemove }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  return (
    <div
      className={`
        p-4 border-l-4 transition-colors cursor-pointer hover:bg-gray-50
        ${notification.read 
          ? 'bg-white border-gray-200' 
          : 'bg-blue-50 border-blue-400'
        }
      `}
      onClick={() => !notification.read && onRead(notification.id)}
    >
      <div className="flex items-start space-x-3">
        {getIcon()}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`text-sm font-medium ${notification.read ? 'text-gray-900' : 'text-gray-900'}`}>
                {notification.title}
              </h4>
              <p className={`mt-1 text-sm ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                {notification.message}
              </p>
              <p className="mt-2 text-xs text-gray-400">
                {formatTime(notification.timestamp)}
              </p>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(notification.id);
              }}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {!notification.read && (
            <div className="mt-2 flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRead(notification.id);
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Mark as read
              </button>
              {notification.actionUrl && (
                <a
                  href={notification.actionUrl}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  onClick={() => onRead(notification.id)}
                >
                  View
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

NotificationItem.displayName = 'NotificationItem';

const NotificationCenter: React.FC<NotificationCenterProps> = memo(({ isOpen, onClose }) => {
  const {
    notifications,
    unreadCount,
    hasUnread,
    permission,
    isConnected,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    requestPermission,
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') {
      return !notification.read;
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <FadeTransition show={isOpen}>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
        
        <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-medium text-gray-900">
                  Notifications
                </h2>
                {hasUnread && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {unreadCount} new
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Connection Status */}
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Permission Request */}
            {permission.prompt && (
              <div className="p-4 bg-blue-50 border-b border-blue-200">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7l5-5v5H9z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-blue-700">
                      Enable desktop notifications to stay updated with real-time alerts.
                    </p>
                    <button
                      onClick={requestPermission}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Enable notifications
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex space-x-4">
                <button
                  onClick={() => setFilter('all')}
                  className={`text-sm font-medium ${
                    filter === 'all' 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`text-sm font-medium ${
                    filter === 'unread' 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>
              
              <div className="flex space-x-2">
                {hasUnread && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={markAllAsRead}
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearAll}
                >
                  Clear all
                </Button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7l5-5v5H9z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {filter === 'unread' 
                      ? 'All caught up! You have no unread notifications.'
                      : 'You\'ll see notifications here when they arrive.'
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={markAsRead}
                      onRemove={removeNotification}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </FadeTransition>
  );
});

NotificationCenter.displayName = 'NotificationCenter';

export default NotificationCenter;