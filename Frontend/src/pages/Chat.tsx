import React, { useState, useRef, useEffect } from 'react';
import { Send, Image, Mic, Smile, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

const Chat: React.FC = () => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { messages, sendMessage } = useChat();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message);
      setMessage('');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you'd upload to a server and get back a URL
      const imageUrl = URL.createObjectURL(file);
      sendMessage(imageUrl, 'image');
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  return (
    <div className="h-screen flex flex-col bg-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-pink-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {user?.partnerName?.charAt(0) || 'P'}
              </span>
            </div>
            <div>
              <h1 className="font-semibold text-gray-800">
                {user?.partnerName || 'Partner'}
              </h1>
              <p className="text-sm text-green-600">Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl ${
                msg.senderId === user?.id
                  ? 'bg-pink-600 text-white'
                  : 'bg-white text-gray-800 border border-pink-200'
              }`}
            >
              {msg.type === 'image' ? (
                <div className="space-y-2">
                  <img
                    src={msg.imageUrl}
                    alt="Shared image"
                    className="rounded-lg max-w-full h-auto"
                  />
                  <p className="text-xs opacity-75">{formatTime(msg.timestamp)}</p>
                </div>
              ) : (
                <div>
                  <p className="break-words">{msg.content}</p>
                  <p className="text-xs opacity-75 mt-1">{formatTime(msg.timestamp)}</p>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-pink-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <div className="flex space-x-2">
            <label htmlFor="image-upload" className="p-2 text-gray-500 hover:text-pink-600 cursor-pointer">
              <Image size={20} />
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            <button
              type="button"
              onClick={() => setIsRecording(!isRecording)}
              className={`p-2 rounded-full ${
                isRecording ? 'text-red-600 bg-red-100' : 'text-gray-500 hover:text-pink-600'
              }`}
            >
              <Mic size={20} />
            </button>
          </div>

          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full px-4 py-2 pr-12 rounded-full border border-pink-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
            <button
              type="button"
              className="absolute right-3 top-2 text-gray-500 hover:text-pink-600"
            >
              <Smile size={20} />
            </button>
          </div>

          <button
            type="submit"
            disabled={!message.trim()}
            className="p-2 bg-pink-600 text-white rounded-full hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;