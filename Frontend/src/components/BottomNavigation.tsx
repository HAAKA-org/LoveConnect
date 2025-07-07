import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  MessageCircle, 
  Images, 
  FileText, 
  Clock, 
  Bell, 
  Heart, 
  Settings 
} from 'lucide-react';

const BottomNavigation: React.FC = () => {
  const navItems = [
    { to: '/dashboard/chat', icon: MessageCircle, label: 'Chat' },
    { to: '/dashboard/gallery', icon: Images, label: 'Gallery' },
    { to: '/dashboard/notes', icon: FileText, label: 'Notes' },
    { to: '/dashboard/timeline', icon: Clock, label: 'Timeline' },
    { to: '/dashboard/reminders', icon: Bell, label: 'Reminders' },
    { to: '/dashboard/extras', icon: Heart, label: 'Extras' },
    { to: '/dashboard/settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-pink-200 px-2 py-1">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center py-2 px-1 rounded-lg transition-colors ${
                isActive
                  ? 'text-pink-600 bg-pink-100'
                  : 'text-gray-600 hover:text-pink-600'
              }`
            }
          >
            <item.icon size={20} />
            <span className="text-xs mt-1 font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;