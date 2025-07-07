import React, { useState } from 'react';
import { Plus, Calendar, Clock, Repeat, Bell, Edit3, Trash2, Check } from 'lucide-react';

interface Reminder {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  isCompleted: boolean;
  isRecurring: boolean;
  recurringType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  createdBy: string;
  priority: 'low' | 'medium' | 'high';
}

const Reminders: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [newReminder, setNewReminder] = useState<Partial<Reminder>>({
    title: '',
    description: '',
    date: new Date(),
    time: '12:00',
    isCompleted: false,
    isRecurring: false,
    priority: 'medium'
  });

  // Mock reminders data
  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: '1',
      title: 'Anniversary Dinner Reservation',
      description: 'Call the restaurant to make reservation for our anniversary',
      date: new Date('2025-01-18'),
      time: '10:00',
      isCompleted: false,
      isRecurring: false,
      createdBy: 'Alex',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Good Morning Text',
      description: 'Send a sweet good morning message',
      date: new Date(),
      time: '07:00',
      isCompleted: true,
      isRecurring: true,
      recurringType: 'daily',
      createdBy: 'Jordan',
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Plan Weekend Activity',
      description: 'Decide what we want to do this weekend',
      date: new Date('2025-01-17'),
      time: '19:00',
      isCompleted: false,
      isRecurring: false,
      createdBy: 'Alex',
      priority: 'low'
    },
    {
      id: '4',
      title: 'Buy Flowers',
      description: 'Pick up flowers for surprise date night',
      date: new Date('2025-01-16'),
      time: '16:00',
      isCompleted: false,
      isRecurring: false,
      createdBy: 'Jordan',
      priority: 'medium'
    }
  ]);

  const handleCreateReminder = () => {
    if (newReminder.title && newReminder.description) {
      const reminder: Reminder = {
        id: Date.now().toString(),
        title: newReminder.title,
        description: newReminder.description,
        date: newReminder.date || new Date(),
        time: newReminder.time || '12:00',
        isCompleted: false,
        isRecurring: newReminder.isRecurring || false,
        recurringType: newReminder.recurringType,
        createdBy: 'You',
        priority: newReminder.priority || 'medium'
      };
      setReminders(prev => [...prev, reminder]);
      setNewReminder({
        title: '',
        description: '',
        date: new Date(),
        time: '12:00',
        isCompleted: false,
        isRecurring: false,
        priority: 'medium'
      });
      setIsCreating(false);
    }
  };

  const toggleComplete = (id: string) => {
    setReminders(prev =>
      prev.map(reminder =>
        reminder.id === id
          ? { ...reminder, isCompleted: !reminder.isCompleted }
          : reminder
      )
    );
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(reminder => reminder.id !== id));
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const sortedReminders = [...reminders].sort((a, b) => {
    // Sort by completion status first, then by date
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }
    return a.date.getTime() - b.date.getTime();
  });

  return (
    <div className="min-h-screen bg-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-pink-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Reminders</h1>
            <p className="text-sm text-gray-600">
              {reminders.filter(r => !r.isCompleted).length} pending reminders
            </p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="p-2 bg-pink-600 text-white rounded-full hover:bg-pink-700"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto">
        {/* Create Form */}
        {isCreating && (
          <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Reminder</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newReminder.title || ''}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="What do you need to remember?"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newReminder.description || ''}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent h-20 resize-none"
                  placeholder="Add some details..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newReminder.date?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, date: new Date(e.target.value) }))}
                    className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={newReminder.time || ''}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={newReminder.priority || 'medium'}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                    className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={newReminder.isRecurring || false}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, isRecurring: e.target.checked }))}
                  className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
                />
                <label htmlFor="isRecurring" className="text-sm text-gray-700">
                  Recurring reminder
                </label>
              </div>
              
              {newReminder.isRecurring && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Repeat
                  </label>
                  <select
                    value={newReminder.recurringType || 'daily'}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, recurringType: e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly' }))}
                    className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              )}
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCreateReminder}
                  className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                >
                  Create Reminder
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewReminder({
                      title: '',
                      description: '',
                      date: new Date(),
                      time: '12:00',
                      isCompleted: false,
                      isRecurring: false,
                      priority: 'medium'
                    });
                  }}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reminders List */}
        <div className="space-y-4">
          {sortedReminders.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No reminders yet</h3>
              <p className="text-gray-600 mb-4">Create your first reminder to stay organized!</p>
              <button
                onClick={() => setIsCreating(true)}
                className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700"
              >
                Create First Reminder
              </button>
            </div>
          ) : (
            sortedReminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`bg-white rounded-xl p-6 shadow-sm border-l-4 ${
                  reminder.isCompleted ? 'border-green-500 opacity-75' : 'border-pink-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <button
                      onClick={() => toggleComplete(reminder.id)}
                      className={`mt-1 p-2 rounded-full ${
                        reminder.isCompleted
                          ? 'bg-green-100 text-green-600'
                          : 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                      }`}
                    >
                      <Check size={16} />
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className={`font-semibold ${
                          reminder.isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'
                        }`}>
                          {reminder.title}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(reminder.priority)}`}>
                          {reminder.priority}
                        </span>
                      </div>
                      
                      <p className={`text-sm mb-3 ${
                        reminder.isCompleted ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {reminder.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar size={14} />
                          <span>{formatDate(reminder.date)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock size={14} />
                          <span>{reminder.time}</span>
                        </div>
                        {reminder.isRecurring && (
                          <div className="flex items-center space-x-1">
                            <Repeat size={14} />
                            <span className="capitalize">{reminder.recurringType}</span>
                          </div>
                        )}
                        <span>• {reminder.createdBy}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-pink-600 rounded-lg">
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => deleteReminder(reminder.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Reminders;