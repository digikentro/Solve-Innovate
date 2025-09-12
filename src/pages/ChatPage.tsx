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
    <div className="h-screen flex flex-col bg-gray-50" style={{ width: '70vw', margin: '0 auto' }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(`/projects/${id}`)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Project Chat</h1>
              <p className="text-sm text-gray-500">Chat about your project</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className={`flex-1 p-4 space-y-4 ${messages.length > 0 ? 'overflow-y-auto no-scrollbar' : 'flex items-center justify-center'}`} style={{ paddingBottom: messages.length > 0 ? '80px' : '0' }}>
        {isLoadingHistory ? (
          <div className="text-center">
            <FiMessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading chat history...</h3>
            <p className="text-gray-500">Fetching your previous conversations.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center">
            <FiMessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
            <p className="text-gray-500">Send a message to begin chatting about your project.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex max-w-xs lg:max-w-md ${
                  message.isUser ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.isUser
                      ? 'bg-indigo-600 text-white ml-2'
                      : 'bg-gray-200 text-gray-600 mr-2'
                  }`}
                >
                  {message.isUser ? <FiUser className="w-4 h-4" /> : <FiMessageCircle className="w-4 h-4" />}
                </div>
                 <div
                   className={`px-4 py-2 rounded-lg ${
                     message.isUser
                       ? 'bg-indigo-600 text-white'
                       : 'bg-white text-gray-900 border border-gray-200'
                   }`}
                 >
                   <div className="text-sm whitespace-pre-wrap">{message.text}</div>
                   <p
                     className={`text-xs mt-1 ${
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
          <div className="flex justify-start">
            <div className="flex max-w-xs lg:max-w-md">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 mr-2 flex items-center justify-center">
                <FiMessageCircle className="w-4 h-4" />
              </div>
              <div className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0" style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '70vw', zIndex: 10 }}>
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FiSend className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
