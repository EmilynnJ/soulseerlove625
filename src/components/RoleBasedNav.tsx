import { Link, useLocation } from 'react-router-dom';
import { 
  Layout, 
  Users, 
  Calendar, 
  MessageSquare, 
  Star, 
  Plus,
  Settings,
  BarChart3,
  Video,
  User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface RoleBasedNavProps {
}

const RoleBasedNav = () => {
  const location = useLocation();
  const { user, logout, userRole } = useAuth();

  const adminNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Layout },
    { name: 'Users', href: '/dashboard/users', icon: Users },
    { name: 'Readers', href: '/dashboard/readers', icon: Star },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const readerNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Layout },
    { name: 'Schedule', href: '/dashboard/schedule', icon: Calendar },
    { name: 'Sessions', href: '/dashboard/sessions', icon: Video },
    { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
    { name: 'Earnings', href: '/dashboard/earnings', icon: Plus },
  ];

  const clientNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Layout },
    { name: 'Book Reading', href: '/dashboard/book', icon: Calendar },
    { name: 'My Sessions', href: '/dashboard/sessions', icon: Video },
    { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
    { name: 'Shop', href: '/dashboard/shop', icon: Plus },
  ];

  const getNavigation = () => {
    switch (userRole) {
      case 'admin':
        return adminNavigation;
      case 'reader':
        return readerNavigation;
      case 'client':
        return clientNavigation;
      default:
        return clientNavigation;
    }
  };

  const navigation = getNavigation();

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-2 mb-4 bg-black/20 rounded-lg border border-mystic-800/30">
        <User className="h-6 w-6 text-mystic-400" />
        <div className="flex flex-col">
          <span className="text-mystic-400 font-semibold text-sm">{user?.firstName || user?.email}</span>
          <span className="text-xs text-gray-400 capitalize">{userRole}</span>
        </div>
      </div>
      <nav className="space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href || 
            (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-mystic-900/30 text-mystic-400 glow-mystic border border-mystic-800/50'
                  : 'text-gray-300 hover:text-mystic-400 hover:bg-mystic-900/20'
              }`}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <button
        className="mt-8 w-full px-4 py-2 rounded-lg bg-gradient-to-r from-mystic-700 to-celestial-800 text-white font-semibold hover:from-mystic-800 hover:to-celestial-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-mystic-400"
        onClick={logout}
      >
        Log Out
      </button>
    </div>
  );
};

export default RoleBasedNav;