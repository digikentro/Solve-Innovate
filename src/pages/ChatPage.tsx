import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { FiArrowLeft, FiSend, FiUser, FiMessageCircle } from 'react-icons/fi';
import { ProjectService } from '@/services/projectService';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export const ChatPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!id) {
    return <Navigate to="/projects" replace />;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch chat history when component mounts
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!id || !user?.id) return;
      
      try {
        setIsLoadingHistory(true);
        const chatHistory = await ProjectService.getProjectChatHistory(id, user.id);
        
        // Convert chat history to Message format
        const historyMessages: Message[] = chatHistory.flatMap((chat, index) => [
          {
            id: `user-${index}-${Date.now()}`,
            text: chat.user,
            isUser: true,
            timestamp: new Date(chat.generated_at),
          },
          {
            id: `assistant-${index}-${Date.now()}`,
            text: chat.assistant,
            isUser: false,
            timestamp: new Date(chat.generated_at),
          }
        ]);
        
        setMessages(historyMessages);
      } catch (error) {
        console.error('Error fetching chat history:', error);
        // Don't show error to user, just start with empty messages
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchChatHistory();
  }, [id, user?.id]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    try {
      const requestBody = {
        project_id: id || '',
        user: currentInput
      };

      console.log('Sending chat request:', requestBody);

      const response = await fetch('https://n8n.srv922914.hstgr.cloud/webhook/chatbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Chat response:', data);

      // Handle the response structure: [{"Assistant": "message"}]
      let assistantMessage = "I'm sorry, I couldn't process your message right now.";
      
      if (Array.isArray(data) && data.length > 0 && data[0].Assistant) {
        assistantMessage = data[0].Assistant;
      } else if (data.output) {
        // Fallback to the old structure
        assistantMessage = data.output;
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: assistantMessage,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending chat message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, there was an error processing your message. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 w-full relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-indigo-400/20 to-purple-400/20"></div>
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-to-l from-blue-400/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-gradient-to-r from-purple-400/10 to-transparent rounded-full blur-3xl"></div>
      </div>
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 px-6 py-4 flex-shrink-0 w-full relative z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(`/projects/${id}`)}
              className="p-3 hover:bg-indigo-50 rounded-xl transition-all duration-200 hover:scale-105 group"
            >
              <FiArrowLeft className="w-5 h-5 text-indigo-600 group-hover:text-indigo-700" />
            </button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Project Chat
              </h1>
              <p className="text-sm text-gray-600 font-medium">Collaborate and discuss your project</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 font-medium">Online</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className={`flex-1 p-8 space-y-6 ${messages.length > 0 ? 'overflow-y-auto no-scrollbar' : 'flex items-center justify-center'} relative z-10`} style={{ paddingBottom: messages.length > 0 ? '120px' : '0' }}>
        <div className="max-w-4xl mx-auto w-full">
        {isLoadingHistory ? (
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl mx-auto mb-6 flex items-center justify-center animate-pulse">
                <FiMessageCircle className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Loading chat history...</h3>
            <p className="text-gray-600 font-medium">Fetching your previous conversations.</p>
            <div className="mt-4 flex justify-center space-x-1">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                <FiMessageCircle className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Start a conversation</h3>
            <p className="text-gray-600 font-medium mb-6">Send a message to begin chatting about your project.</p>
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-50 rounded-full">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-indigo-600 font-medium">AI Assistant Ready</span>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              <div
                className={`flex max-w-md lg:max-w-2xl xl:max-w-3xl ${
                  message.isUser ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
                    message.isUser
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white ml-3'
                      : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 mr-3'
                  }`}
                >
                  {message.isUser ? <FiUser className="w-5 h-5" /> : <FiMessageCircle className="w-5 h-5" />}
                </div>
                 <div
                   className={`px-5 py-3 rounded-2xl shadow-lg backdrop-blur-sm ${
                     message.isUser
                       ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                       : 'bg-white/90 text-gray-900 border border-white/20'
                   }`}
                 >
                   <div className="text-sm font-medium whitespace-pre-wrap leading-relaxed">{message.text}</div>
                   <p
                     className={`text-xs mt-2 font-medium ${
                       message.isUser ? 'text-indigo-100' : 'text-gray-500'
                     }`}
                   >
                     {message.timestamp.toLocaleTimeString([], {
                       hour: '2-digit',
                       minute: '2-digit',
                     })}
                   </p>
                 </div>
              </div>
            </div>
          ))
        )}
        
        {isTyping && (
          <div className="flex justify-start animate-fadeIn">
            <div className="flex max-w-md lg:max-w-2xl xl:max-w-3xl">
              <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 mr-3 flex items-center justify-center shadow-lg">
                <FiMessageCircle className="w-5 h-5" />
              </div>
              <div className="bg-white/90 text-gray-900 border border-white/20 px-5 py-3 rounded-2xl shadow-lg backdrop-blur-sm">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="bg-white/90 backdrop-blur-md border-t border-white/20 p-6 flex-shrink-0 shadow-2xl w-full relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="w-full px-6 py-4 bg-white/80 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all duration-200 shadow-lg backdrop-blur-sm text-gray-900 placeholder-gray-500 font-medium"
                disabled={isTyping}
              />
              {inputMessage && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl hover:from-indigo-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100 group"
            >
              <FiSend className="w-5 h-5 group-hover:translate-x-0.5 transition-transform duration-200" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
