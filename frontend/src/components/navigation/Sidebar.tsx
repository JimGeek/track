import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TrackLogo from '../ui/TrackLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Projects', href: '/projects', icon: '📁' },
    { name: 'Features', href: '/features', icon: '⚡' },
  ];

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-600 bg-opacity-75 transition-opacity ease-linear duration-300 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-xl border-r border-gray-200/60 shadow-large transform transition-all ease-in-out duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'lg:translate-x-0 -translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo and close button */}
          <div className="relative flex items-center justify-center h-20 px-6 bg-gradient-to-r from-white to-gray-50/80 border-b border-gray-200/60 backdrop-blur-sm">
            <Link to="/dashboard" className="flex items-center" onClick={onClose}>
              <TrackLogo size="medium" variant="full" />
            </Link>
            
            {/* Close button - only visible on mobile */}
            <button
              onClick={onClose}
              className="lg:hidden absolute right-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105"
              aria-label="Close sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 py-8 space-y-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={`group flex items-center space-x-4 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-medium border border-accent-200 transform scale-[1.02]'
                    : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-800 hover:shadow-soft hover:scale-[1.01] border border-transparent'
                }`}
              >
                <span className={`text-xl transition-transform duration-200 ${
                  isActive(item.href) ? 'scale-110' : 'group-hover:scale-110'
                }`}>{item.icon}</span>
                <span className="font-semibold tracking-wide">{item.name}</span>
                {isActive(item.href) && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse-soft shadow-soft" />
                )}
              </Link>
            ))}
          </nav>

          {/* User info */}
          <div className="p-6 border-t border-gray-200/60">
            <div className="flex items-center space-x-4 px-4 py-4 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100/80 border border-gray-200/60 shadow-soft hover:shadow-medium transition-all duration-200">
              <div className="w-10 h-10 bg-gradient-to-r from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center shadow-medium">
                <span className="text-white text-sm font-bold tracking-wide">
                  {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-800 text-sm font-semibold truncate tracking-wide">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-gray-500 text-xs truncate font-medium">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;