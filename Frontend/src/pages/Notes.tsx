import React, { useState } from 'react';
import { Plus, Search, Edit3, Trash2, Heart, Save, X } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isFavorite: boolean;
  color: string;
}

const Notes: React.FC = () => {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNote, setEditingNote] = useState<Partial<Note>>({});

  const colors = [
    'bg-pink-100', 'bg-purple-100', 'bg-blue-100', 'bg-green-100',
    'bg-yellow-100', 'bg-orange-100', 'bg-red-100', 'bg-indigo-100'
  ];

  // Mock notes data
  const [notes, setNotes] = useState<Note[]>([
    {
      id: '1',
      title: 'Our Anniversary Plans',
      content: 'Ideas for our 2nd anniversary:\n\n• Sunset picnic at the beach\n• Visit the place where we first met\n• Cook dinner together\n• Write letters to each other\n• Take a photo booth session',
      createdBy: 'Jordan',
      createdAt: new Date('2025-01-15'),
      updatedAt: new Date('2025-01-15'),
      isFavorite: true,
      color: 'bg-pink-100'
    },
    {
      id: '2',
      title: 'Weekend Getaway Ideas',
      content: 'Places we want to visit:\n\n• Mountain cabin retreat\n• Beach house rental\n• City break in San Francisco\n• Camping under the stars\n• Wine tasting in Napa Valley',
      createdBy: 'Alex',
      createdAt: new Date('2025-01-14'),
      updatedAt: new Date('2025-01-14'),
      isFavorite: false,
      color: 'bg-blue-100'
    },
    {
      id: '3',
      title: 'Date Night Ideas',
      content: 'Fun things to do together:\n\n• Cooking class\n• Mini golf\n• Board game café\n• Art museum visit\n• Bookstore browsing\n• Farmers market shopping',
      createdBy: 'Jordan',
      createdAt: new Date('2025-01-13'),
      updatedAt: new Date('2025-01-13'),
      isFavorite: true,
      color: 'bg-green-100'
    },
    {
      id: '4',
      title: 'Things We Love About Each Other',
      content: 'Random love notes:\n\n• Your laugh brightens my day\n• The way you hum while cooking\n• How you always remember small details\n• Your kindness to everyone\n• The way you support my dreams',
      createdBy: 'Alex',
      createdAt: new Date('2025-01-12'),
      updatedAt: new Date('2025-01-12'),
      isFavorite: true,
      color: 'bg-purple-100'
    }
  ]);

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'New Note',
      content: 'Start writing...',
      createdBy: 'You',
      createdAt: new Date(),
      updatedAt: new Date(),
      isFavorite: false,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
    setNotes(prev => [newNote, ...prev]);
    setSelectedNote(newNote);
    setIsEditing(true);
    setEditingNote(newNote);
  };

  const handleSaveNote = () => {
    if (editingNote.id) {
      setNotes(prev =>
        prev.map(note =>
          note.id === editingNote.id
            ? { ...note, ...editingNote, updatedAt: new Date() }
            : note
        )
      );
      setSelectedNote({ ...selectedNote!, ...editingNote });
    }
    setIsEditing(false);
    setEditingNote({});
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
  };

  const toggleFavorite = (id: string) => {
    setNotes(prev =>
      prev.map(note =>
        note.id === id ? { ...note, isFavorite: !note.isFavorite } : note
      )
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-screen bg-pink-50 flex">
      {/* Sidebar */}
      <div className="w-full md:w-1/3 bg-white border-r border-pink-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-pink-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-800">Our Notes</h1>
            <button
              onClick={handleCreateNote}
              className="p-2 bg-pink-600 text-white rounded-full hover:bg-pink-700"
            >
              <Plus size={20} />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No notes found</p>
              <button
                onClick={handleCreateNote}
                className="mt-4 text-pink-600 hover:text-pink-700 font-medium"
              >
                Create your first note
              </button>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    note.color
                  } ${
                    selectedNote?.id === note.id ? 'ring-2 ring-pink-500' : 'hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-800 line-clamp-1">{note.title}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(note.id);
                      }}
                      className={`p-1 rounded ${
                        note.isFavorite ? 'text-pink-600' : 'text-gray-400 hover:text-pink-600'
                      }`}
                    >
                      <Heart size={16} fill={note.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{note.content}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{note.createdBy}</span>
                    <span>{formatDate(note.updatedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Note Editor */}
      <div className="hidden md:flex flex-1 flex-col">
        {selectedNote ? (
          <>
            {/* Editor Header */}
            <div className="bg-white border-b border-pink-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${selectedNote.color}`}></div>
                  <span className="text-sm text-gray-600">
                    {selectedNote.createdBy} • {formatDate(selectedNote.updatedAt)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSaveNote}
                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditingNote({});
                        }}
                        className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setEditingNote(selectedNote);
                        }}
                        className="p-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(selectedNote.id)}
                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editingNote.title || ''}
                    onChange={(e) => setEditingNote(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full text-2xl font-bold text-gray-800 border-none outline-none bg-transparent"
                    placeholder="Note title..."
                  />
                  <textarea
                    value={editingNote.content || ''}
                    onChange={(e) => setEditingNote(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full h-96 text-gray-700 border-none outline-none bg-transparent resize-none"
                    placeholder="Start writing your note..."
                  />
                </div>
              ) : (
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-4">{selectedNote.title}</h1>
                  <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedNote.content}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Edit3 className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Select a note to view</h3>
              <p className="text-gray-600">Choose a note from the sidebar to start reading or editing</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;