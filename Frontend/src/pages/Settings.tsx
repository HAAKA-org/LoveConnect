import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Lock, 
  Bell, 
  Moon, 
  Sun, 
  Trash2, 
  Edit3, 
  Save, 
  X,
  LogOut,
  Shield,
  Heart,
  Camera
} from 'lucide-react';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    messages: true,
    reminders: true,
    timeline: false
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSaveProfile = () => {
    // In a real app, this would update the user profile
    setIsEditing(false);
  };

  const settingSections = [
    {
      title: 'Profile',
      items: [
        {
          icon: User,
          label: 'Edit Profile',
          action: () => setIsEditing(true),
          color: 'bg-blue-100 text-blue-600'
        },
        {
          icon: Lock,
          label: 'Change PIN',
          action: () => {},
          color: 'bg-purple-100 text-purple-600'
        }
      ]
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: isDarkMode ? Sun : Moon,
          label: 'Theme',
          action: () => setIsDarkMode(!isDarkMode),
          color: 'bg-yellow-100 text-yellow-600',
          toggle: true,
          checked: isDarkMode
        },
        {
          icon: Bell,
          label: 'Notifications',
          action: () => {},
          color: 'bg-green-100 text-green-600'
        }
      ]
    },
    {
      title: 'Privacy & Security',
      items: [
        {
          icon: Shield,
          label: 'Privacy Settings',
          action: () => {},
          color: 'bg-indigo-100 text-indigo-600'
        },
        {
          icon: Heart,
          label: 'Relationship Status',
          action: () => {},
          color: 'bg-pink-100 text-pink-600'
        }
      ]
    },
    {
      title: 'Account',
      items: [
        {
          icon: LogOut,
          label: 'Sign Out',
          action: handleLogout,
          color: 'bg-red-100 text-red-600'
        },
        {
          icon: Trash2,
          label: 'Delete Account',
          action: () => {},
          color: 'bg-red-100 text-red-600',
          disabled: true
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-pink-200 p-4">
        <h1 className="text-xl font-bold text-gray-800">Settings</h1>
        <p className="text-sm text-gray-600">Manage your account and preferences</p>
      </div>

      <div className="p-4 max-w-4xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Profile</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-600 hover:text-pink-600 rounded-lg"
              >
                <Edit3 size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-20 h-20 bg-pink-600 rounded-full flex items-center justify-center">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <button className="absolute bottom-0 right-0 bg-pink-600 text-white p-1 rounded-full hover:bg-pink-700">
                <Camera size={12} />
              </button>
            </div>

            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 flex items-center space-x-2"
                    >
                      <Save size={16} />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedName(user?.name || '');
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <X size={16} />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{user?.name}</h3>
                  <p className="text-gray-600">{user?.email}</p>
                  {user?.partnerName && (
                    <p className="text-sm text-pink-600 mt-1">
                      Connected with {user.partnerName}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {settingSections.map((section, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{section.title}</h3>
              <div className="space-y-3">
                {section.items.map((item, itemIndex) => (
                  <button
                    key={itemIndex}
                    onClick={item.action}
                    disabled={item.disabled}
                    className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                      item.disabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${item.color}`}>
                        <item.icon size={18} />
                      </div>
                      <span className="text-gray-800 font-medium">{item.label}</span>
                    </div>
                    {item.toggle && (
                      <div className={`w-12 h-6 rounded-full transition-colors ${
                        item.checked ? 'bg-pink-600' : 'bg-gray-300'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                          item.checked ? 'translate-x-6' : 'translate-x-0.5'
                        } mt-0.5`}></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Notifications Settings */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Notification Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-800">Messages</h4>
                <p className="text-sm text-gray-600">Get notified about new messages</p>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, messages: !prev.messages }))}
                className={`w-12 h-6 rounded-full transition-colors ${
                  notifications.messages ? 'bg-pink-600' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                  notifications.messages ? 'translate-x-6' : 'translate-x-0.5'
                } mt-0.5`}></div>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-800">Reminders</h4>
                <p className="text-sm text-gray-600">Get notified about upcoming reminders</p>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, reminders: !prev.reminders }))}
                className={`w-12 h-6 rounded-full transition-colors ${
                  notifications.reminders ? 'bg-pink-600' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                  notifications.reminders ? 'translate-x-6' : 'translate-x-0.5'
                } mt-0.5`}></div>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-800">Timeline Events</h4>
                <p className="text-sm text-gray-600">Get notified about anniversary dates</p>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, timeline: !prev.timeline }))}
                className={`w-12 h-6 rounded-full transition-colors ${
                  notifications.timeline ? 'bg-pink-600' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                  notifications.timeline ? 'translate-x-6' : 'translate-x-0.5'
                } mt-0.5`}></div>
              </button>
            </div>
          </div>
        </div>

        {/* App Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">About</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>LoveConnect v1.0.0</p>
            <p>Made with ❤️ for couples everywhere</p>
            <p className="text-xs text-gray-500 mt-4">
              © 2025 LoveConnect. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;