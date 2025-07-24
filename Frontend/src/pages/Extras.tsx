import React, { useState, useEffect } from 'react';
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
  const [loveNotes, setLoveNotes] = useState<LoveNote[]>([]);
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);

  useEffect(() => {
    fetch('http://localhost:8000/loveconnect/api/extras/', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        const jar = data.loveJar.map((note: any) => ({
          ...note,
          addedAt: new Date(note.addedAt)
        }));
        const todos = data.todoList;

        setLoveNotes(jar);
        setTodoItems(todos);
      });
  }, []);

  
  const handleAddLoveNote = async () => {
    if (!newLoveNote.trim()) return;
    const res = await fetch('http://localhost:8000/loveconnect/api/extras/lovejar/add/', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: newLoveNote })
    });

    if (res.ok) {
      setNewLoveNote('');
      const note = await res.json();
      location.reload(); // OR re-fetch extras
    }
  };

  const handleRevealNote = async (id: string) => {
    await fetch(`http://localhost:8000/loveconnect/api/extras/lovejar/reveal/${id}/`, {
      method: 'PATCH',
      credentials: 'include'
    });

    setLoveNotes(prev =>
      prev.map(note =>
        note.id === id ? { ...note, isRevealed: true } : note
      )
    );
  };

  const handleAddTodo = async () => {
    if (!newTodoItem.trim()) return;

    const res = await fetch('http://localhost:8000/loveconnect/api/extras/todo/add/', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTodoItem })
    });

    if (res.ok) {
      setNewTodoItem('');
      location.reload(); // OR re-fetch extras
    }
  };

  const handleToggleTodo = async (id: string) => {
    await fetch(`http://localhost:8000/loveconnect/api/extras/todo/toggle/${id}/`, {
      method: 'PATCH',
      credentials: 'include'
    });

    setTodoItems(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo
      )
    );
  };

  const handleDeleteTodo = async (id: string) => {
    await fetch(`http://localhost:8000/loveconnect/api/extras/todo/delete/${id}/`, {
      method: 'DELETE',
      credentials: 'include'
    });
    setTodoItems(prev => prev.filter(todo => todo.id !== id));
  };

  const handleDeleteLoveNote = async (id: string) => {
    await fetch(`http://localhost:8000/loveconnect/api/extras/lovejar/delete/${id}/`, {
      method: 'DELETE',
      credentials: 'include'
    });
    setLoveNotes(prev => prev.filter(note => note.id !== id));
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
                  className={`relative bg-white rounded-xl p-6 shadow-sm border-2 transition-all ${
                    note.isRevealed
                      ? 'border-pink-200'
                      : 'border-pink-400 cursor-pointer hover:border-pink-500'
                  }`}
                  onClick={() => !note.isRevealed && handleRevealNote(note.id)}
                >
                  {/* Delete Button (Always visible) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // prevent triggering reveal
                      handleDeleteLoveNote(note.id);
                    }}
                    className="absolute top-2 right-2 text-red-400 hover:text-red-600 text-xl font-bold"
                    title="Delete"
                  >
                    ×
                  </button>

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
                    className={`relative flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                      item.isCompleted
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    {/* Completion Checkbox */}
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

                    {/* Title */}
                    <span
                      className={`flex-1 ${
                        item.isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'
                      }`}
                    >
                      {item.title}
                    </span>

                    {/* Metadata */}
                    <span className="text-sm text-gray-500">by {item.addedBy}</span>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteTodo(item.id)}
                      className="ml-3 text-red-400 hover:text-red-600 text-lg font-semibold"
                      title="Delete"
                    >
                      ×
                    </button>
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