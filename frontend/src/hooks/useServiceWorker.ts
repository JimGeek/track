import { useEffect, useState } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isOnline: boolean;
  updateAvailable: boolean;
  cacheStatus: Record<string, number>;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isOnline: navigator.onLine,
    updateAvailable: false,
    cacheStatus: {}
  });

  useEffect(() => {
    if (!state.isSupported) return;

    // Register service worker
    registerServiceWorker();

    // Listen for online/offline events
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [state.isSupported]);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      setState(prev => ({ ...prev, isRegistered: true }));

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setState(prev => ({ ...prev, updateAvailable: true }));
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, payload } = event.data;
        
        switch (type) {
          case 'CACHE_STATUS':
            setState(prev => ({ ...prev, cacheStatus: payload }));
            break;
          default:
            console.log('Unknown message from service worker:', type);
        }
      });

      console.log('Service worker registered successfully');
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  };

  const updateServiceWorker = async () => {
    if (!navigator.serviceWorker.controller) return;

    const registration = await navigator.serviceWorker.getRegistration();
    if (registration && registration.waiting) {
      // Send message to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload page after update
      window.location.reload();
    }
  };

  const getCacheStatus = async () => {
    if (!navigator.serviceWorker.controller) return {};

    const messageChannel = new MessageChannel();
    
    return new Promise<Record<string, number>>((resolve) => {
      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_STATUS') {
          resolve(event.data.payload);
        }
      };

      navigator.serviceWorker.controller!.postMessage(
        { type: 'GET_CACHE_STATUS' },
        [messageChannel.port2]
      );
    });
  };

  const clearCache = async () => {
    if (!navigator.serviceWorker.controller) return;

    const messageChannel = new MessageChannel();
    
    return new Promise<void>((resolve) => {
      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_CLEARED') {
          setState(prev => ({ ...prev, cacheStatus: {} }));
          resolve();
        }
      };

      navigator.serviceWorker.controller!.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
    });
  };

  return {
    ...state,
    updateServiceWorker,
    getCacheStatus,
    clearCache
  };
}