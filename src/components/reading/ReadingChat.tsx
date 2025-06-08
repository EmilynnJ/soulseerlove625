import React, { useState, useEffect, useRef } from 'react';
import { getSocket, joinChatRoom, sendMessage, onMessage, offMessage } from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SendIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  isReader: boolean;
  content: string;
  timestamp: string;
  avatarUrl?: string;
}

interface ReadingChatProps {
  sessionId: string;
  userId: string;
  userName: string;
  role: string;
}

const ReadingChat: React.FC<ReadingChatProps> = ({ sessionId, userId, userName, role }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Fetch chat history and set up socket listeners
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    // Stub: Replace with real API call for chat history
    setMessages([
      { id: 'init1', senderId: 'system', senderName: 'System', isReader: false, content: 'Welcome to your reading session!', timestamp: new Date().toISOString() }
    ]);
    setLoading(false);
    // Set up socket connection
    const socket = getSocket(userId);
    joinChatRoom(sessionId);
    const handleNewMessage = (msg: Message) => {
      if (mounted) setMessages(prev => [...prev, msg]);
    };
    onMessage(handleNewMessage);
    return () => {
      mounted = false;
      offMessage(handleNewMessage);
    };
  }, [sessionId, userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const msg: Message = {
      id: Date.now().toString(),
      senderId: userId,
      senderName: userName,
      isReader: role === 'reader',
      content: input,
      timestamp: new Date().toISOString(),
      avatarUrl: user?.profileImage || undefined,
    };
    setMessages(prev => [...prev, msg]); // Optimistic update
    sendMessage(sessionId, input);
    setInput('');
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="border-b border-gray-800 p-3">
        <h3 className="text-lg font-semibold text-accent">Reading Chat</h3>
        <p className="text-xs text-gray-400">Session #{sessionId.substring(0, 8)}</p>
      </div>
      
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-accent">Loading chat...</div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isFromCurrentUser = msg.senderId === userId;
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isFromCurrentUser && (
                  <img
                    src={msg.avatarUrl || '/default-avatar.png'}
                    className="w-8 h-8 rounded-full border border-gray-700 shadow-md bg-gray-900"
                    alt={msg.senderName}
                  />
                )}
                <div
                  className={`max-w-[75%] rounded-lg shadow-md p-3 flex flex-col ${
                    msg.isReader
                      ? 'bg-celestial-900/30 border border-celestial-700/30'
                      : isFromCurrentUser
                        ? 'bg-mystic-900/30 border border-mystic-700/30'
                        : 'bg-gray-800/60 border border-gray-700/30'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-medium ${
                      msg.isReader ? 'text-celestial-400' : isFromCurrentUser ? 'text-mystic-400' : 'text-gray-300'
                    }`}>
                      {msg.senderName}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                </div>
                {isFromCurrentUser && (
                  <img
                    src={user?.profileImage || '/default-avatar.png'}
                    className="w-8 h-8 rounded-full border border-gray-700 shadow-md bg-gray-900"
                    alt={msg.senderName}
                  />
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input */}
      <div className="border-t border-gray-800 p-3">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-black/30 border border-primary/30"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!input.trim()}
            className="bg-accent hover:bg-accent/80"
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ReadingChat;
