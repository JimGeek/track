import { useState, useEffect, useRef } from 'react';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  data?: any;
}

export interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>({
    granted: false,
    denied: false,
    prompt: true,
  });
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      setPermission({
        granted: currentPermission === 'granted',
        denied: currentPermission === 'denied',
        prompt: currentPermission === 'default',
      });
    }
  }, []);

  // Request notification permission
  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    const result = await Notification.requestPermission();
    const newPermission = {
      granted: result === 'granted',
      denied: result === 'denied',
      prompt: result === 'default',
    };
    
    setPermission(newPermission);
    return newPermission.granted;
  };

  // Show browser notification
  const showBrowserNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    if (!permission.granted) return;

    const browserNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.type,
      requireInteraction: notification.type === 'error',
    });

    browserNotification.onclick = () => {
      window.focus();
      if (notification.actionUrl) {
        window.location.href = notification.actionUrl;
      }
      browserNotification.close();
    };

    // Auto close after 5 seconds for non-error notifications
    if (notification.type !== 'error') {
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }
  };

  // Add notification to the list
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep max 50 notifications
    
    // Show browser notification if permission granted
    showBrowserNotification(notification);
    
    return newNotification.id;
  };

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  // Remove notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
  };

  // WebSocket connection for real-time notifications
  const connectWebSocket = (userId?: string) => {
    if (!userId) return;

    const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:8000'}/ws/notifications/${userId}/`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('Notifications WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'notification') {
            addNotification({
              type: data.notification.type || 'info',
              title: data.notification.title,
              message: data.notification.message,
              actionUrl: data.notification.action_url,
              data: data.notification.data,
            });
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('Notifications WebSocket disconnected', event.code);
        setIsConnected(false);
        
        // Attempt to reconnect if it wasn't a deliberate close
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connectWebSocket(userId);
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Notifications WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  };

  // Disconnect WebSocket
  const disconnectWebSocket = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    reconnectAttempts.current = 0;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, []);

  // Computed values
  const unreadCount = notifications.filter(n => !n.read).length;
  const hasUnread = unreadCount > 0;

  return {
    notifications,
    unreadCount,
    hasUnread,
    permission,
    isConnected,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    requestPermission,
    connectWebSocket,
    disconnectWebSocket,
  };
};