import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FiSend, FiUser, FiMessageCircle, FiUserPlus, FiUsers, FiX, FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import { ProjectService } from '@/services/projectService';
import { ExtremeUserSelectionModal } from './ExtremeUserSelectionModal';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface CustomExtremeUser {
  name: string;
  age: string;
  location: string;
  description: string;
}

interface EmbeddedChatSectionProps {
  projectId: string;
  extremeUserData?: any;
  project?: any;
  userId?: string;
}

export const EmbeddedChatSection = ({ projectId, extremeUserData, project, userId }: EmbeddedChatSectionProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // User interaction states
  const [isCustomUserModalOpen, setIsCustomUserModalOpen] = useState(false);
  const [isSelectUserModalOpen, setIsSelectUserModalOpen] = useState(false);
  const [customUser, setCustomUser] = useState<CustomExtremeUser>({
    name: '',
    age: '',
    location: '',
    description: ''
  });

  // Chat mode state - only show chat after user selection
  const [isChatMode, setIsChatMode] = useState(false);
  const [selectedUserData, setSelectedUserData] = useState<string | null>(null);
  const [userContextData, setUserContextData] = useState<string | null>(null);
  const [userType, setUserType] = useState<'provided' | 'selected' | null>(null);
  const [isFirstMessage, setIsFirstMessage] = useState(true);

  // Saved state from Supabase (to show saved card instead of form button)
  const [savedProvidedUser, setSavedProvidedUser] = useState<CustomExtremeUser | null>(null);
  const [savedExtremeUser, setSavedExtremeUser] = useState<string | null>(null);

  // Confirmation dialog for clearing a saved selection
  const [confirmClear, setConfirmClear] = useState<'provided' | 'selected' | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // On mount: restore saved selections from research_data column
  useEffect(() => {
    if (!project) return;

    let researchData: Record<string, any> = {};
    try {
      researchData = typeof project.research_data === 'string'
        ? JSON.parse(project.research_data)
        : (project.research_data || {});
    } catch { researchData = {}; }

    if (researchData.chatProvidedUser) {
      setSavedProvidedUser(researchData.chatProvidedUser);
    }
    if (researchData.chatExtremeUser) {
      setSavedExtremeUser(researchData.chatExtremeUser);
    }
  }, [project]);

  // Fetch chat history when entering chat mode
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!projectId || !user?.id || !isChatMode) return;

      try {
        setIsLoadingHistory(true);

        // Use the correct column based on which flow opened the chat
        const chatHistory = userType === 'selected'
          ? await ProjectService.getProjectChatboxExtreUserHistory(projectId, user.id)
          : await ProjectService.getProjectChatHistory(projectId, user.id);

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
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchChatHistory();
  }, [projectId, user?.id, isChatMode, userType]);

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
      // Choose webhook URL and body based on user type
      let webhookUrl: string;
      const requestBody: Record<string, any> = {
        project_id: projectId,
        user: currentInput,
      };

      if (userType === 'selected' && userContextData) {
        // "Select the User" flow → chatbox_extreuser webhook
        webhookUrl = 'https://n8n.srv922914.hstgr.cloud/webhook/chatbox_extreuser';
        requestBody.extreme_user_data = userContextData;
      } else {
        // "Provide Your Extreme User" flow → chatbox_userprovideinfo webhook
        webhookUrl = 'https://n8n.srv922914.hstgr.cloud/webhook/chatbox_userprovideinfo';
        if (userContextData) {
          requestBody.provided_user_data = userContextData;
        }
      }

      console.log('Sending chat request to:', webhookUrl, requestBody);

      const response = await fetch(webhookUrl, {
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

      let assistantMessage = "I'm sorry, I couldn't process your message right now.";

      if (Array.isArray(data) && data.length > 0 && data[0].Assistant) {
        assistantMessage = data[0].Assistant;
      } else if (data.output) {
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

  // Handle custom user form submission - POST to chatbox_userprovideinfo webhook, save to Supabase, then open chat
  const handleCustomUserSubmit = async () => {
    if (!customUser.name.trim() || !customUser.age.trim() || !customUser.location.trim() || !customUser.description.trim()) return;

    const userContext = `Custom User - Name: ${customUser.name}, Age: ${customUser.age}, Location: ${customUser.location}, Description: ${customUser.description}`;
    const effectiveUserId = userId || user?.id;

    try {
      // Send the provided user info to the dedicated webhook
      const response = await fetch('https://n8n.srv922914.hstgr.cloud/webhook/chatbox_userprovideinfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          name: customUser.name,
          age: customUser.age,
          location: customUser.location,
          description: customUser.description,
        })
      });
      if (!response.ok) console.warn('chatbox_userprovideinfo webhook responded with:', response.status);
    } catch (error) {
      console.error('Error sending user info to webhook:', error);
    }

    // Persist to Supabase so it survives page reload
    if (effectiveUserId) {
      await ProjectService.saveChatProvidedUser(projectId, effectiveUserId, customUser);
      setSavedProvidedUser(customUser);
    }

    // Open chat mode
    setUserContextData(userContext);
    setUserType('provided');
    setSelectedUserData(`Custom User: ${customUser.name}`);
    setIsCustomUserModalOpen(false);
    setCustomUser({ name: '', age: '', location: '', description: '' });
    setIsFirstMessage(true);
    setIsChatMode(true);
  };

  // Resume chat with the already-saved provided user
  const handleResumeSavedProvidedUser = () => {
    if (!savedProvidedUser) return;
    const userContext = `Custom User - Name: ${savedProvidedUser.name}, Age: ${savedProvidedUser.age}, Location: ${savedProvidedUser.location}, Description: ${savedProvidedUser.description}`;
    setUserContextData(userContext);
    setUserType('provided');
    setSelectedUserData(`Custom User: ${savedProvidedUser.name}`);
    setIsFirstMessage(false);
    setIsChatMode(true);
  };

  // Clear saved provided user — show confirmation first
  const handleClearSavedProvidedUser = () => {
    setConfirmClear('provided');
  };

  // Resume chat with the already-saved extreme user
  const handleResumeSavedExtremeUser = () => {
    if (!savedExtremeUser) return;
    const userLabel = savedExtremeUser.split('\n')[0] || 'Selected Extreme User';
    setUserContextData(savedExtremeUser);
    setUserType('selected');
    setSelectedUserData(userLabel);
    setIsFirstMessage(false);
    setIsChatMode(true);
  };

  // Clear saved extreme user — show confirmation first
  const handleClearSavedExtremeUser = () => {
    setConfirmClear('selected');
  };

  // Confirmed: actually clear the saved selection from Supabase
  const handleConfirmClear = async () => {
    const effectiveUserId = userId || user?.id;
    if (confirmClear === 'provided') {
      if (effectiveUserId) await ProjectService.saveChatProvidedUser(projectId, effectiveUserId, null);
      setSavedProvidedUser(null);
    } else if (confirmClear === 'selected') {
      if (effectiveUserId) await ProjectService.saveChatExtremeUser(projectId, effectiveUserId, null);
      setSavedExtremeUser(null);
    }
    setConfirmClear(null);
  };

  // Handle extreme user selection from modal - save to Supabase, then open chat
  const handleExtremeUserSelect = async (userSummary: string) => {
    setIsSelectUserModalOpen(false);
    const effectiveUserId = userId || user?.id;

    // Persist to Supabase
    if (effectiveUserId) {
      await ProjectService.saveChatExtremeUser(projectId, effectiveUserId, userSummary);
      setSavedExtremeUser(userSummary);
    }

    setUserContextData(userSummary);
    setUserType('selected');
    const userLabel = userSummary.split('\n')[0] || 'Selected Extreme User';
    setSelectedUserData(userLabel);
    setIsFirstMessage(true);
    setIsChatMode(true);
  };

  // Exit chat mode and return to button selection
  const handleExitChat = () => {
    setIsChatMode(false);
    setSelectedUserData(null);
    setUserContextData(null);
    setUserType(null);
    setMessages([]);
    setIsFirstMessage(true);
  };

  // Button selection view (before chat mode)
  if (!isChatMode) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl border border-white/30 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FiMessageCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent">
                Interact with User
              </h3>
              <p className="text-gray-600">Select or provide an extreme user to start chatting</p>
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Card 1: Provide Your Extreme User */}
            {savedProvidedUser ? (
              <div className="flex flex-col gap-3 px-5 py-5 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FiUserPlus className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-base text-purple-800 block truncate">Provide Your Extreme User</span>
                    <span className="text-xs text-purple-600 font-medium">Saved ✓</span>
                  </div>
                </div>
                <div className="bg-white/70 rounded-xl px-4 py-3 text-sm text-gray-700 space-y-1">
                  <p><span className="font-semibold text-gray-800">Name:</span> {savedProvidedUser.name}</p>
                  <p><span className="font-semibold text-gray-800">Age:</span> {savedProvidedUser.age} &nbsp;|&nbsp; <span className="font-semibold text-gray-800">Location:</span> {savedProvidedUser.location}</p>
                  <p className="line-clamp-2 text-gray-600">{savedProvidedUser.description}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleResumeSavedProvidedUser}
                    className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
                  >
                    Continue Chat
                  </button>
                  <button
                    onClick={handleClearSavedProvidedUser}
                    title="Enter new user details"
                    className="px-3 py-2.5 bg-white border-2 border-purple-200 text-purple-600 rounded-xl hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
                  >
                    <FiRefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsCustomUserModalOpen(true)}
                className="flex items-center gap-3 px-5 py-5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 group"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <FiUserPlus className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-lg block">Provide Your Extreme User</span>
                  <span className="text-sm text-white/80">Add custom user details</span>
                </div>
              </button>
            )}

            {/* Card 2: Select the User */}
            {savedExtremeUser ? (
              <div className="flex flex-col gap-3 px-5 py-5 bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-2xl shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FiUsers className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-base text-cyan-800 block truncate">Select the User</span>
                    <span className="text-xs text-cyan-600 font-medium">Saved ✓</span>
                  </div>
                </div>
                <div className="bg-white/70 rounded-xl px-4 py-3 text-sm text-gray-700">
                  <p className="font-semibold text-gray-800 truncate">{savedExtremeUser.split('\n')[0]}</p>
                  <p className="text-gray-500 text-xs mt-1 line-clamp-2">{savedExtremeUser.split('\n').slice(1).join(' ').trim()}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleResumeSavedExtremeUser}
                    className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
                  >
                    Continue Chat
                  </button>
                  <button
                    onClick={handleClearSavedExtremeUser}
                    title="Select a different user"
                    className="px-3 py-2.5 bg-white border-2 border-cyan-200 text-cyan-600 rounded-xl hover:bg-cyan-50 hover:border-cyan-300 transition-all duration-200"
                  >
                    <FiRefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsSelectUserModalOpen(true)}
                className="flex items-center gap-3 px-5 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 group"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <FiUsers className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-lg block">Select the User</span>
                  <span className="text-sm text-white/80">Choose from generated users</span>
                </div>
              </button>
            )}
          </div>

        </div>

        {/* Confirmation Dialog — shown when user clicks Change */}
        {confirmClear && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden">
              {/* Header */}
              <div className={`px-6 py-5 border-b border-gray-100 ${confirmClear === 'provided' ? 'bg-gradient-to-r from-purple-50 to-pink-50' : 'bg-gradient-to-r from-cyan-50 to-blue-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${confirmClear === 'provided' ? 'bg-gradient-to-r from-purple-500 to-pink-600' : 'bg-gradient-to-r from-cyan-500 to-blue-600'}`}>
                    <FiRefreshCw className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Change User?</h3>
                    <p className="text-sm text-gray-500">
                      {confirmClear === 'provided' ? 'Provided Extreme User' : 'Selected Extreme User'}
                    </p>
                  </div>
                </div>
              </div>
              {/* Body */}
              <div className="px-6 py-5">
                <p className="text-gray-700 text-sm leading-relaxed">
                  This will remove your currently saved user and let you{' '}
                  {confirmClear === 'provided' ? 'enter new details.' : 'select a different user.'}
                  {' '}Are you sure?
                </p>
              </div>
              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => setConfirmClear(null)}
                  className="px-5 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmClear}
                  className={`px-6 py-2.5 text-white font-semibold rounded-xl hover:shadow-lg transition-all ${confirmClear === 'provided' ? 'bg-gradient-to-r from-purple-500 to-pink-600' : 'bg-gradient-to-r from-cyan-500 to-blue-600'}`}
                >
                  Yes, Change
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Extreme User Modal */}
        {isCustomUserModalOpen && (

          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="px-6 py-5 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                      <FiUserPlus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Provide Your Extreme User</h3>
                      <p className="text-sm text-gray-600">Enter user details below</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsCustomUserModalOpen(false)}
                    className="p-2 hover:bg-white/50 rounded-xl transition-colors"
                  >
                    <FiX className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={customUser.name}
                    onChange={(e) => setCustomUser(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter user name"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Age *</label>
                    <input
                      type="text"
                      value={customUser.age}
                      onChange={(e) => setCustomUser(prev => ({ ...prev, age: e.target.value }))}
                      placeholder="e.g., 25"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Location *</label>
                    <input
                      type="text"
                      value={customUser.location}
                      onChange={(e) => setCustomUser(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g., Mumbai"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={customUser.description}
                    onChange={(e) => setCustomUser(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the user's characteristics, behaviors, needs..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setIsCustomUserModalOpen(false)}
                  className="px-5 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCustomUserSubmit}
                  disabled={!customUser.name.trim() || !customUser.age.trim() || !customUser.location.trim() || !customUser.description.trim()}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Start Chat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Extreme User Selection Modal */}
        <ExtremeUserSelectionModal
          isOpen={isSelectUserModalOpen}
          onClose={() => setIsSelectUserModalOpen(false)}
          onSelectUser={handleExtremeUserSelect}
          extremeUserData={extremeUserData}
        />
      </div>
    );
  }

  // Chat Mode View
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
            <button
              onClick={handleExitChat}
              className="w-10 h-10 bg-white/80 hover:bg-white rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all text-gray-600 hover:text-gray-800"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FiMessageCircle className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent">
                Chat with Your Project
              </h3>
              <p className="text-sm text-gray-600 font-medium">{selectedUserData}</p>
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
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-3">Loading conversation...</h4>
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
              </div>
              <h4 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
                Start Your Conversation
              </h4>
              <p className="text-gray-600 mb-6 leading-relaxed max-w-md mx-auto">
                Ask questions about your project from the selected user's perspective.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div
                  className={`flex max-w-[85%] ${message.isUser ? 'flex-row-reverse' : 'flex-row'
                    }`}
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${message.isUser
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white ml-3'
                      : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 mr-3 border border-gray-200'
                      }`}
                  >
                    {message.isUser ? <FiUser className="w-5 h-5" /> : <FiMessageCircle className="w-5 h-5" />}
                  </div>
                  <div className="space-y-1">
                    <div
                      className={`px-5 py-4 rounded-2xl shadow-lg backdrop-blur-sm border ${message.isUser
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-300/30'
                        : 'bg-white/80 text-gray-800 border-gray-200/50'
                        }`}
                    >
                      <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{message.text}</div>
                    </div>
                    <p
                      className={`text-xs px-2 ${message.isUser ? 'text-right text-cyan-600' : 'text-left text-gray-500'
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