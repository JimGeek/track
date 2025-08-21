import React, { memo, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  position?: 'left' | 'right';
}

const MobileDrawer: React.FC<MobileDrawerProps> = memo(({
  isOpen,
  onClose,
  children,
  title,
  position = 'left',
}) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const positionClasses = {
    left: {
      drawer: 'left-0',
      transform: isOpen ? 'translate-x-0' : '-translate-x-full',
    },
    right: {
      drawer: 'right-0',
      transform: isOpen ? 'translate-x-0' : 'translate-x-full',
    },
  };

  const drawer = (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={`
          relative flex flex-col w-64 max-w-xs bg-white shadow-xl
          ${positionClasses[position].drawer}
          transform transition-transform duration-300 ease-in-out
          ${positionClasses[position].transform}
        `.trim().replace(/\s+/g, ' ')}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 py-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 px-4 py-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(drawer, document.body);
});

MobileDrawer.displayName = 'MobileDrawer';

export default MobileDrawer;