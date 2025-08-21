import React, { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ThemeToggle: React.FC<ThemeToggleProps> = memo(({ 
  className = '', 
  showLabel = false,
  size = 'md' 
}) => {
  const { theme, effectiveTheme, setTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value as 'light' | 'dark' | 'system');
  };

  if (showLabel) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Theme:
        </label>
        <select
          value={theme}
          onChange={handleThemeChange}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </div>
    );
  }

  return (
    <button
      onClick={() => setTheme(effectiveTheme === 'light' ? 'dark' : 'light')}
      className={`
        p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
        hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
        ${className}
      `}
      title={`Switch to ${effectiveTheme === 'light' ? 'dark' : 'light'} mode`}
    >
      {effectiveTheme === 'light' ? (
        // Sun icon for light mode (clicking switches to dark)
        <svg className={sizeClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        // Moon icon for dark mode (clicking switches to light)
        <svg className={sizeClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
});

ThemeToggle.displayName = 'ThemeToggle';

export default ThemeToggle;