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
      <div className="bg-white border-b border-pink-200 px-4 py-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Extras</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Fun activities and surprises for you both</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-pink-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 border-b-2 font-medium transition-all duration-200 whitespace-nowrap min-w-0 flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'border-pink-600 text-pink-600 bg-pink-50'
                    : 'border-transparent text-gray-600 hover:text-pink-600 hover:bg-pink-25'
                }`}
              >
                <tab.icon size={18} className="sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 max-w-6xl mx-auto">
        {/* Love Jar */}
        {activeTab === 'love-jar' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-pink-100">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 mb-4 sm:mb-6">
                <div className="bg-pink-100 p-3 rounded-full w-fit">
                  <Heart className="w-6 h-6 text-pink-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Love Jar</h2>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">
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
                    className="w-full px-4 py-3 sm:px-5 sm:py-4 border border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent h-20 sm:h-24 resize-none text-sm sm:text-base transition-all duration-200"
                  />
                  <button
                    onClick={handleAddLoveNote}
                    disabled={!newLoveNote.trim()}
                    className="mt-3 sm:mt-4 px-6 py-3 sm:px-8 sm:py-3 bg-pink-600 text-white rounded-xl hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium transition-all duration-200 w-full sm:w-auto min-h-[44px]"
                  >
                    <Plus size={16} />
                    <span className="text-sm sm:text-base">Add to Love Jar</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {loveNotes.map((note) => (
                <div
                  key={note.id}
                  className={`relative bg-white rounded-xl p-4 sm:p-6 shadow-sm border-2 transition-all duration-200 ${
                    note.isRevealed
                      ? 'border-pink-200 hover:shadow-md'
                      : 'border-pink-400 cursor-pointer hover:border-pink-500 hover:shadow-md transform hover:scale-[1.02]'
                  }`}
                  onClick={() => !note.isRevealed && handleRevealNote(note.id)}
                >
                  {/* Delete Button (Always visible) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // prevent triggering reveal
                      handleDeleteLoveNote(note.id);
                    }}
                    className="absolute top-2 right-2 sm:top-3 sm:right-3 text-red-400 hover:text-red-600 text-xl sm:text-2xl font-bold w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-red-50 transition-all duration-200"
                    title="Delete"
                  >
                    ×
                  </button>

                  {note.isRevealed ? (
                    <div className="pr-8 sm:pr-10">
                      <p className="text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base leading-relaxed">{note.message}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0 text-xs sm:text-sm text-gray-500">
                        <span className="font-medium">From {note.addedBy}</span>
                        <span>{note.addedAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 sm:py-6">
                      <Gift className="w-8 h-8 sm:w-10 sm:h-10 text-pink-600 mx-auto mb-3 sm:mb-4" />
                      <p className="text-gray-600 font-medium text-sm sm:text-base">Surprise from {note.addedBy}</p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-2">Tap to reveal</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* To-Do List */}
        {activeTab === 'todo' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-pink-100">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 mb-4 sm:mb-6">
                <div className="bg-purple-100 p-3 rounded-full w-fit">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Shared To-Do List</h2>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">
                    Goals and activities to do together
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <input
                  type="text"
                  value={newTodoItem}
                  onChange={(e) => setNewTodoItem(e.target.value)}
                  placeholder="Add something to do together..."
                  className="flex-1 px-4 py-3 sm:px-5 sm:py-3 border border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm sm:text-base transition-all duration-200"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
                />
                <button
                  onClick={handleAddTodo}
                  disabled={!newTodoItem.trim()}
                  className="px-6 py-3 sm:px-8 sm:py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 w-full sm:w-auto min-h-[44px]"
                >
                  <Plus size={16} />
                  <span className="ml-2 sm:hidden">Add Item</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-pink-100">
              <div className="space-y-3 sm:space-y-4">
                {todoItems.map((item) => (
                  <div
                    key={item.id}
                    className={`relative flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-xl border transition-all duration-200 ${
                      item.isCompleted
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200 hover:border-purple-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Completion Checkbox */}
                    <button
                      onClick={() => handleToggleTodo(item.id)}
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                        item.isCompleted
                          ? 'bg-green-600 border-green-600 text-white'
                          : 'border-gray-300 hover:border-purple-600'
                      }`}
                    >
                      {item.isCompleted && <span className="text-xs sm:text-sm">✓</span>}
                    </button>

                    {/* Title */}
                    <span
                      className={`flex-1 text-sm sm:text-base transition-all duration-200 ${
                        item.isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'
                      }`}
                    >
                      {item.title}
                    </span>

                    {/* Metadata */}
                    <span className="text-xs sm:text-sm text-gray-500 hidden sm:inline">by {item.addedBy}</span>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteTodo(item.id)}
                      className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-red-400 hover:text-red-600 text-lg sm:text-xl font-semibold rounded-full hover:bg-red-50 transition-all duration-200 flex-shrink-0"
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
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm text-center border border-pink-100">
              <div className="bg-blue-100 p-4 sm:p-5 rounded-full w-fit mx-auto mb-4 sm:mb-6">
                <GamePad2 className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
              </div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 mb-2">Fun Games</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto">
                Interactive games and activities coming soon!
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-pink-100 hover:shadow-md transition-all duration-200">
                <div className="bg-yellow-100 p-3 rounded-full w-fit mb-4">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Question Game</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
                  Daily questions to get to know each other better
                </p>
                <button className="w-full px-4 py-3 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-all duration-200 text-sm font-medium min-h-[44px]">
                  Coming Soon
                </button>
              </div>

              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-pink-100 hover:shadow-md transition-all duration-200">
                <div className="bg-green-100 p-3 rounded-full w-fit mb-4">
                  <Coffee className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Date Ideas</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
                  Random date idea generator for when you're stuck
                </p>
                <button className="w-full px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 text-sm font-medium min-h-[44px]">
                  Coming Soon
                </button>
              </div>

              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-pink-100 hover:shadow-md transition-all duration-200">
                <div className="bg-purple-100 p-3 rounded-full w-fit mb-4">
                  <Heart className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Love Quiz</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
                  Test how well you know each other
                </p>
                <button className="w-full px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-200 text-sm font-medium min-h-[44px]">
                  Coming Soon
                </button>
              </div>

              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-pink-100 hover:shadow-md transition-all duration-200">
                <div className="bg-red-100 p-3 rounded-full w-fit mb-4">
                  <Gift className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Surprise Me</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
                  Random sweet gestures and surprises
                </p>
                <button className="w-full px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 text-sm font-medium min-h-[44px]">
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