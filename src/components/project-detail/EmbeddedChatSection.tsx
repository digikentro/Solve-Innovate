import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FiSend, FiUser, FiMessageCircle } from 'react-icons/fi';
import { ProjectService } from '@/services/projectService';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface EmbeddedChatSectionProps {
  projectId: string;
}

export const EmbeddedChatSection = ({ projectId }: EmbeddedChatSectionProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch chat history when component mounts
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!projectId || !user?.id) return;
      
      try {
        setIsLoadingHistory(true);
        const chatHistory = await ProjectService.getProjectChatHistory(projectId, user.id);
        
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
  }, [projectId, user?.id]);

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
        project_id: projectId,
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
    <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 overflow-hidden h-[75vh] flex flex-col relative">
      {/* Decorative gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/30 via-blue-50/20 to-indigo-50/30 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-l from-cyan-200/20 to-transparent rounded-full blur-2xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-r from-blue-200/20 to-transparent rounded-full blur-xl"></div>
      
      {/* Header */}
      <div className="relative px-4 py-4 bg-gradient-to-r from-cyan-50/80 to-blue-50/80 backdrop-blur-sm border-b border-cyan-100/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FiMessageCircle className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent">
                Chat with Your Project
              </h3>
              <p className="text-sm text-gray-600 font-medium">AI-powered insights and project discussion</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold text-green-700">AI Online</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="relative flex-1 overflow-y-auto">
        <div className="p-4 space-y-4 pb-20">
          {isLoadingHistory ? (
            <div className="text-center py-8">
              <div className="relative mx-auto w-16 h-16 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse">
                  <FiMessageCircle className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-3 border-white shadow-lg">
                  <div className="w-2 h-2 bg-white rounded-full mx-auto mt-2"></div>
                </div>
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-3">Loading conversation history</h4>
              <p className="text-gray-600 mb-6">Retrieving your previous discussions...</p>
              <div className="flex justify-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="relative mx-auto w-20 h-20 mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl">
                  <FiMessageCircle className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <h4 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
                Welcome to Project Chat
              </h4>
              <p className="text-gray-600 mb-6 leading-relaxed max-w-md mx-auto">
                Start an intelligent conversation about your project. Ask questions, get insights, and explore new possibilities.
              </p>
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl border border-cyan-200/50 shadow-sm">
                <div className="relative">
                  <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="text-sm font-semibold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent">
                  AI Assistant is ready to help
                </span>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div
                  className={`flex max-w-[85%] ${
                    message.isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
                      message.isUser
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white ml-3'
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 mr-3 border border-gray-200'
                    }`}
                  >
                    {message.isUser ? <FiUser className="w-5 h-5" /> : <FiMessageCircle className="w-5 h-5" />}
                  </div>
                  <div className="space-y-1">
                    <div
                      className={`px-5 py-4 rounded-2xl shadow-lg backdrop-blur-sm border ${
                        message.isUser
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-300/30'
                          : 'bg-white/80 text-gray-800 border-gray-200/50'
                      }`}
                    >
                      <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{message.text}</div>
                    </div>
                    <p
                      className={`text-xs px-2 ${
                        message.isUser ? 'text-right text-cyan-600' : 'text-left text-gray-500'
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
              <div className="flex max-w-[85%]">
                <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 mr-3 flex items-center justify-center shadow-lg border border-gray-200">
                  <FiMessageCircle className="w-5 h-5" />
                </div>
                <div className="bg-white/80 text-gray-800 px-5 py-4 rounded-2xl shadow-lg backdrop-blur-sm border border-gray-200/50">
                  <div className="flex space-x-2 items-center">
                    <div className="flex space-x-1">
                      <div className="w-2.5 h-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2.5 h-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2.5 h-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">AI is thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="relative border-t border-cyan-100/50 bg-white/60 backdrop-blur-sm p-4 flex-shrink-0">
        <div className="flex items-end space-x-4">
          <div className="flex-1 relative">
            <div className="relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything about your project..."
                className="w-full px-6 py-4 bg-white/80 border-2 border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all duration-300 text-gray-800 placeholder-gray-500 font-medium shadow-lg backdrop-blur-sm hover:shadow-xl disabled:opacity-60"
                disabled={isTyping}
              />
              {inputMessage && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-500 font-medium">Ready to send</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Character count */}
            {inputMessage && (
              <div className="mt-2 flex justify-end">
                <span className="text-xs text-gray-400">{inputMessage.length}/1000</span>
              </div>
            )}
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="relative px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100 group"
          >
            <div className="flex items-center space-x-2">
              <FiSend className={`w-5 h-5 transition-transform duration-200 ${isTyping ? 'animate-pulse' : 'group-hover:translate-x-0.5'}`} />
              <span className="font-semibold">{isTyping ? 'Sending...' : 'Send'}</span>
            </div>
            
            {/* Loading indicator for sending state */}
            {isTyping && (
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-2xl flex items-center justify-center">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};