import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CheckSquare, LayoutDashboard, List, Calendar, Settings, User, LogOut } from 'lucide-react';
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Todo Lists', href: '/todo-lists', icon: List },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
  ];

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform transition-transform lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo and close button */}
          <div className="flex items-center justify-between h-16 px-6 border-b">
            <Link to="/dashboard" className="flex items-center space-x-2" onClick={onClose}>
              <CheckSquare className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Track</span>
            </Link>
            
            {/* Close button - only visible on mobile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link key={item.name} to={item.href} onClick={onClose}>
                  <Button
                    variant={isActive(item.href) ? "default" : "ghost"}
                    className="w-full justify-start"
                  >
                    <IconComponent className="mr-3 h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-primary-foreground">
                      {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;