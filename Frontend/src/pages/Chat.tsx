import React, { useState, useRef, useEffect } from 'react';
import { Send, Image, Mic, Smile } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Chat: React.FC = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{
    id: string;
    senderEmail: string;
    content: string;
    type: string;
    timestamp: Date;
    imageUrl?: string;
  }>>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const socketRef = useRef<WebSocket | null>(null);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages on component mount
  useEffect(() => {
    if (!user?.partnerCode) return;

    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('loveconnect'))?.split('=')[1];

    const socket = new WebSocket(`ws://localhost:8000/ws/chat/${user.partnerCode}/`);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        senderEmail: data.senderEmail,
        content: data.content,
        type: data.type,
        timestamp: new Date(data.timestamp),
        imageUrl: data.type === 'image' ? data.content : null
      }]);
    };

    socket.onclose = () => {
      console.warn("WebSocket closed");
    };

    return () => {
      socket.close();
    };
  }, [user?.partnerCode]);

  // useEffect(() => {
  //   if (user?.partnerId) {
  //     fetchMessages();
  //   }
  // }, [user?.partnerId]);

  const fetchMessages = async () => {
    try {
      const res = await fetch('http://localhost:8000/loveconnect/api/get-messages/', {
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.messages) {
        const mapped = data.messages.map((msg: any) => ({
          id: msg._id,
          senderEmail: msg.senderEmail,
          content: msg.content,
          type: msg.type,
          timestamp: new Date(msg.timestamp),
          imageUrl: msg.type === 'image' ? msg.content : null
        }));
        setMessages(mapped);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessageToBackend = async (content: string, type: string = 'text', imageUrl?: string) => {
    try {
      setIsLoading(true);

      const response = await fetch('http://localhost:8000/loveconnect/api/send-message/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Ensure JWT cookie is included
        body: JSON.stringify({
          type: type,
          content: type === 'image' ? imageUrl : content
        })
      });

      if (response.ok) {
        await fetchMessages(); // Refresh after send
      } else {
        const err = await response.json();
        console.error('Failed to send message:', err.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

    const payload = {
      content: message,
      type: 'text'
    };

    socketRef.current.send(JSON.stringify(payload));
    setMessage('');
  };


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you'd upload to a server and get back a URL
      const imageUrl = URL.createObjectURL(file);
      sendMessageToBackend('', 'image', imageUrl);
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
      <div className="bg-white fixed border-b border-pink-200 p-4 w-full z-10">
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
      <div className="pt-24 pb-24 overflow-y-auto flex-1 px-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderEmail === user?.email ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl ${msg.senderEmail === user?.email
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
      <div className="bg-white border-t border-pink-200 p-4 fixed bottom-14 w-full">
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
              className={`p-2 rounded-full ${isRecording ? 'text-red-600 bg-red-100' : 'text-gray-500 hover:text-pink-600'
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