import React, { useState } from 'react';
import { Heart, Gift, Gamepad2 as GamePad2, Coffee, Plus, Star, BookOpen } from 'lucide-react';

interface LoveNote {
  id: string;
  message: string;
  addedBy: string;
  isRevealed: boolean;
  addedAt: Date;
}

interface TodoItem {
  id: string;
  title: string;
  isCompleted: boolean;
  addedBy: string;
}

const Extras: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'love-jar' | 'todo' | 'games'>('love-jar');
  const [newLoveNote, setNewLoveNote] = useState('');
  const [newTodoItem, setNewTodoItem] = useState('');

  // Mock love jar data
  const [loveNotes, setLoveNotes] = useState<LoveNote[]>([
    {
      id: '1',
      message: 'I love how you always make me laugh, even on my worst days ❤️',
      addedBy: 'Jordan',
      isRevealed: false,
      addedAt: new Date('2025-01-15')
    },
    {
      id: '2',
      message: 'Your smile is the first thing I think about in the morning 😊',
      addedBy: 'Alex',
      isRevealed: true,
      addedAt: new Date('2025-01-14')
    },
    {
      id: '3',
      message: 'Thank you for being my best friend and my greatest love 💕',
      addedBy: 'Jordan',
      isRevealed: false,
      addedAt: new Date('2025-01-13')
    }
  ]);

  // Mock todo data
  const [todoItems, setTodoItems] = useState<TodoItem[]>([
    {
      id: '1',
      title: 'Plan our weekend getaway',
      isCompleted: false,
      addedBy: 'Alex'
    },
    {
      id: '2',
      title: 'Try that new restaurant downtown',
      isCompleted: true,
      addedBy: 'Jordan'
    },
    {
      id: '3',
      title: 'Watch the sunset together',
      isCompleted: false,
      addedBy: 'Alex'
    },
    {
      id: '4',
      title: 'Learn to cook pasta from scratch',
      isCompleted: false,
      addedBy: 'Jordan'
    }
  ]);

  const handleAddLoveNote = () => {
    if (newLoveNote.trim()) {
      const note: LoveNote = {
        id: Date.now().toString(),
        message: newLoveNote,
        addedBy: 'You',
        isRevealed: false,
        addedAt: new Date()
      };
      setLoveNotes(prev => [...prev, note]);
      setNewLoveNote('');
    }
  };

  const handleRevealNote = (id: string) => {
    setLoveNotes(prev =>
      prev.map(note =>
        note.id === id ? { ...note, isRevealed: true } : note
      )
    );
  };

  const handleAddTodo = () => {
    if (newTodoItem.trim()) {
      const todo: TodoItem = {
        id: Date.now().toString(),
        title: newTodoItem,
        isCompleted: false,
        addedBy: 'You'
      };
      setTodoItems(prev => [...prev, todo]);
      setNewTodoItem('');
    }
  };

  const handleToggleTodo = (id: string) => {
    setTodoItems(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo
      )
    );
  };

  const tabs = [
    { id: 'love-jar', label: 'Love Jar', icon: Heart },
    { id: 'todo', label: 'To-Do List', icon: BookOpen },
    { id: 'games', label: 'Games', icon: GamePad2 }
  ];

  return (
    <div className="min-h-screen bg-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-pink-200 p-4">
        <h1 className="text-xl font-bold text-gray-800">Extras</h1>
        <p className="text-sm text-gray-600">Fun activities and surprises for you both</p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-pink-200">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-3 border-b-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-pink-600 text-pink-600'
                  : 'border-transparent text-gray-600 hover:text-pink-600'
              }`}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto">
        {/* Love Jar */}
        {activeTab === 'love-jar' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-pink-100 p-3 rounded-full">
                  <Heart className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Love Jar</h2>
                  <p className="text-sm text-gray-600">
                    Add sweet messages for each other to discover
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <textarea
                    value={newLoveNote}
                    onChange={(e) => setNewLoveNote(e.target.value)}
                    placeholder="Write a sweet message for your partner..."
                    className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent h-24 resize-none"
                  />
                  <button
                    onClick={handleAddLoveNote}
                    disabled={!newLoveNote.trim()}
                    className="mt-3 px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Plus size={16} />
                    <span>Add to Love Jar</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loveNotes.map((note) => (
                <div
                  key={note.id}
                  className={`bg-white rounded-xl p-6 shadow-sm border-2 ${
                    note.isRevealed ? 'border-pink-200' : 'border-pink-400 cursor-pointer hover:border-pink-500'
                  }`}
                  onClick={() => !note.isRevealed && handleRevealNote(note.id)}
                >
                  {note.isRevealed ? (
                    <div>
                      <p className="text-gray-800 mb-3">{note.message}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>From {note.addedBy}</span>
                        <span>{note.addedAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Gift className="w-8 h-8 text-pink-600 mx-auto mb-3" />
                      <p className="text-gray-600">Surprise from {note.addedBy}</p>
                      <p className="text-sm text-gray-500 mt-2">Tap to reveal</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* To-Do List */}
        {activeTab === 'todo' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Shared To-Do List</h2>
                  <p className="text-sm text-gray-600">
                    Goals and activities to do together
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTodoItem}
                  onChange={(e) => setNewTodoItem(e.target.value)}
                  placeholder="Add something to do together..."
                  className="flex-1 px-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
                />
                <button
                  onClick={handleAddTodo}
                  disabled={!newTodoItem.trim()}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="space-y-3">
                {todoItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border ${
                      item.isCompleted ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <button
                      onClick={() => handleToggleTodo(item.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        item.isCompleted
                          ? 'bg-green-600 border-green-600 text-white'
                          : 'border-gray-300 hover:border-purple-600'
                      }`}
                    >
                      {item.isCompleted && <span className="text-xs">✓</span>}
                    </button>
                    <span className={`flex-1 ${
                      item.isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'
                    }`}>
                      {item.title}
                    </span>
                    <span className="text-sm text-gray-500">by {item.addedBy}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Games */}
        {activeTab === 'games' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="bg-blue-100 p-4 rounded-full w-fit mx-auto mb-4">
                <GamePad2 className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Fun Games</h2>
              <p className="text-gray-600 mb-6">
                Interactive games and activities coming soon!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="bg-yellow-100 p-3 rounded-full w-fit mb-4">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Question Game</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Daily questions to get to know each other better
                </p>
                <button className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                  Coming Soon
                </button>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="bg-green-100 p-3 rounded-full w-fit mb-4">
                  <Coffee className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Date Ideas</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Random date idea generator for when you're stuck
                </p>
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Coming Soon
                </button>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="bg-purple-100 p-3 rounded-full w-fit mb-4">
                  <Heart className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Love Quiz</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Test how well you know each other
                </p>
                <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  Coming Soon
                </button>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="bg-red-100 p-3 rounded-full w-fit mb-4">
                  <Gift className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Surprise Me</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Random sweet gestures and surprises
                </p>
                <button className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Extras;