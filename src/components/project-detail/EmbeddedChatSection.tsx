import React, { useState, useRef, useEffect, useMemo } from 'react';
import { relaxedJsonParse } from '@/utils/jsonUtils';
import { useAuth } from '@/contexts/AuthContext';
import {
  FiSend, FiUser, FiMessageCircle, FiUserPlus, FiUsers, FiX,
  FiArrowLeft, FiRefreshCw, FiChevronDown, FiClock, FiPlus,
} from 'react-icons/fi';
import { ProjectService } from '@/services/projectService';
import { ExtremeUserSelectionModal } from './ExtremeUserSelectionModal';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ExtremeUserEntry {
  name: string;
  created_at: string;
  messages: Array<{ user: string; assistant: string; generated_at: string }>;
}

// Map of userKey → ExtremeUserEntry
type ExtremeUserMap = Record<string, ExtremeUserEntry>;

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseExtremeUserMap(raw: any): ExtremeUserMap {
  if (!raw) return {};
  try {
    const parsed = typeof raw === 'string' ? relaxedJsonParse(raw) : raw;
    if (typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as ExtremeUserMap;
  } catch {
    return {};
  }
}

function messagesFromEntry(entry: ExtremeUserEntry): ChatMessage[] {
  return (entry.messages ?? []).flatMap((m, idx) => [
    {
      id: `u-${idx}`,
      text: m.user,
      isUser: true,
      timestamp: new Date(m.generated_at),
    },
    {
      id: `a-${idx}`,
      text: m.assistant,
      isUser: false,
      timestamp: new Date(m.generated_at),
    },
  ]);
}

const BACKEND_URL = (import.meta as any).env?.VITE_PPT_API_URL || 'http://localhost:8000';

// ─── Component ────────────────────────────────────────────────────────────────

export const EmbeddedChatSection = ({
  projectId,
  extremeUserData,
  project,
  userId,
}: EmbeddedChatSectionProps) => {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id || '';

  // ── Parsed extreme users from Supabase ──
  const extremeUserMap = useMemo<ExtremeUserMap>(
    () => parseExtremeUserMap(project?.chatbox_extreuser),
    [project?.chatbox_extreuser]
  );
  const userKeys = useMemo(() => Object.keys(extremeUserMap), [extremeUserMap]);

  // ── Provided-user (custom) saved state ──
  const [savedProvidedUser, setSavedProvidedUser] = useState<CustomExtremeUser | null>(null);

  // ── Chat mode ──
  // 'none'      → selection screen
  // 'selected'  → chatting with an extreme user (multi-user)
  // 'provided'  → chatting with the custom provided user
  const [chatMode, setChatMode] = useState<'none' | 'selected' | 'provided'>('none');

  // ── Active extreme user key ──
  const [activeUserKey, setActiveUserKey] = useState<string | null>(null);

  // ── Messages in current view ──
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // ── Modals ──
  const [isCustomUserModalOpen, setIsCustomUserModalOpen] = useState(false);
  const [isSelectUserModalOpen, setIsSelectUserModalOpen] = useState(false);
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState<'provided' | null>(null);

  const [customUser, setCustomUser] = useState<CustomExtremeUser>({
    name: '', age: '', location: '', description: '',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const switcherRef = useRef<HTMLDivElement>(null);

  // ── Scroll to bottom ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Close switcher on outside click ──
  useEffect(() => {
    if (!isUserSwitcherOpen) return;
    const handler = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setIsUserSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isUserSwitcherOpen]);

  // ── Restore provided user from research_data ──
  useEffect(() => {
    if (!project) return;
    let rd: Record<string, any> = {};
    try {
      rd = typeof project.research_data === 'string'
        ? relaxedJsonParse(project.research_data)
        : (project.research_data || {});
    } catch { rd = {}; }
    if (rd.chatProvidedUser) setSavedProvidedUser(rd.chatProvidedUser);
  }, [project]);

  // ── Load messages when switching active extreme user ──
  useEffect(() => {
    if (chatMode !== 'selected' || !activeUserKey) return;
    const entry = extremeUserMap[activeUserKey];
    setMessages(entry ? messagesFromEntry(entry) : []);
  }, [activeUserKey, chatMode, extremeUserMap]);

  // ── Load provided-user history ──
  useEffect(() => {
    if (chatMode !== 'provided') return;
    (async () => {
      try {
        const history = await ProjectService.getProjectChatHistory(projectId, effectiveUserId);
        setMessages(
          history.flatMap((chat, idx) => [
            { id: `u-${idx}`, text: chat.user, isUser: true, timestamp: new Date(chat.generated_at) },
            { id: `a-${idx}`, text: chat.assistant, isUser: false, timestamp: new Date(chat.generated_at) },
          ])
        );
      } catch { setMessages([]); }
    })();
  }, [chatMode, projectId, effectiveUserId]);

  // ── Enter chat with a specific extreme user ──
  const enterExtremeUserChat = (key: string) => {
    setActiveUserKey(key);
    setChatMode('selected');
    setIsUserSwitcherOpen(false);
  };

  // ── Switch user inside chat ──
  const switchUser = (key: string) => {
    if (key === activeUserKey) { setIsUserSwitcherOpen(false); return; }
    setActiveUserKey(key);
    setIsUserSwitcherOpen(false);
  };

  // ── Exit chat ──
  const exitChat = () => {
    setChatMode('none');
    setActiveUserKey(null);
    setMessages([]);
    setInputMessage('');
    setIsUserSwitcherOpen(false);
  };

  // ── Send message ──
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;

    const text = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      let webhookUrl: string;
      let requestBody: Record<string, any> = {
        project_id: projectId,
        user: text,
      };

      if (chatMode === 'selected' && activeUserKey) {
        webhookUrl = 'https://n8n.srv922914.hstgr.cloud/webhook/chatbox_extreuser';
        requestBody.extreme_user_key = activeUserKey;
        // Also pass user context for the AI
        const entry = extremeUserMap[activeUserKey];
        if (entry) requestBody.extreme_user_name = entry.name;
      } else {
        webhookUrl = 'https://n8n.srv922914.hstgr.cloud/webhook/chatbox_userprovideinfo';
        if (savedProvidedUser) {
          requestBody.provided_user_data = `Custom User - Name: ${savedProvidedUser.name}, Age: ${savedProvidedUser.age}, Location: ${savedProvidedUser.location}, Description: ${savedProvidedUser.description}`;
        }
      }

      const res = await fetch(`${BACKEND_URL}/api/v1/webhook/proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_url: webhookUrl, payload: requestBody }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      let reply = "I'm sorry, I couldn't process your message right now.";
      if (Array.isArray(data) && data[0]?.Assistant) reply = data[0].Assistant;
      else if (data.output) reply = data.output;

      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), text: reply, isUser: false, timestamp: new Date() },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), text: "Sorry, there was an error. Please try again.", isUser: false, timestamp: new Date() },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  // ── Provided-user submit ──
  const handleCustomUserSubmit = async () => {
    if (!customUser.name.trim() || !customUser.age.trim() || !customUser.location.trim() || !customUser.description.trim()) return;

    try {
      await fetch(`${BACKEND_URL}/api/v1/webhook/proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_url: 'https://n8n.srv922914.hstgr.cloud/webhook/chatbox_userprovideinfo',
          payload: { project_id: projectId, ...customUser },
        }),
      });
    } catch { /* non-critical */ }

    if (effectiveUserId) {
      await ProjectService.saveChatProvidedUser(projectId, effectiveUserId, customUser);
      setSavedProvidedUser(customUser);
    }

    setCustomUser({ name: '', age: '', location: '', description: '' });
    setIsCustomUserModalOpen(false);
    setChatMode('provided');
  };

  // ── Handle new extreme user selection from modal ──
  const handleExtremeUserSelect = async (userSummary: string) => {
    setIsSelectUserModalOpen(false);
    // The n8n modal flow creates the user entry; after saving we enter the chat.
    // For now, trigger n8n to create the user slot and then enter chat.
    // The new user key will be assigned by n8n; we need to trigger a project refresh
    // and then find the new key. For immediate UX, treat this as "selected" mode temporarily.
    if (effectiveUserId) {
      await ProjectService.saveChatExtremeUser(projectId, effectiveUserId, userSummary);
    }
    // Find if n8n already assigned a key for this user by name
    const matchKey = Object.keys(extremeUserMap).find(k =>
      extremeUserMap[k].name?.toLowerCase().includes(userSummary.split('\n')[0]?.toLowerCase().slice(0, 20))
    );
    if (matchKey) {
      enterExtremeUserChat(matchKey);
    } else {
      // Fall back: open chat with a temporary key; n8n will create it
      const tempKey = `temp_${Date.now()}`;
      setActiveUserKey(tempKey);
      setChatMode('selected');
    }
  };

  // ── Active user label ──
  const activeEntry = activeUserKey ? extremeUserMap[activeUserKey] : null;
  const activeUserLabel = chatMode === 'selected'
    ? (activeEntry?.name || activeUserKey || 'Unknown User')
    : chatMode === 'provided'
    ? (savedProvidedUser ? `Custom: ${savedProvidedUser.name}` : 'Provided User')
    : '';

  // ─────────────────────────────────────────────────────────────────────────────
  // SELECTION SCREEN
  // ─────────────────────────────────────────────────────────────────────────────
  if (chatMode === 'none') {
    return (
      <div className="space-y-5">
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
              <p className="text-gray-500 text-sm">Select an AI user to chat with, or provide your own</p>
            </div>
          </div>

          {/* ── Extreme Users Grid ── */}
          {userKeys.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AI Users</p>
                <button
                  onClick={() => setIsSelectUserModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-cyan-600 hover:text-cyan-700 bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <FiPlus className="w-3.5 h-3.5" /> Add User
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {userKeys.map(key => {
                  const entry = extremeUserMap[key];
                  const msgCount = entry.messages?.length ?? 0;
                  return (
                    <button
                      key={key}
                      onClick={() => enterExtremeUserChat(key)}
                      className="flex items-center gap-3 px-4 py-4 bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-100 hover:border-cyan-300 rounded-2xl text-left transition-all duration-200 hover:shadow-md group"
                    >
                      <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                        <FiUser className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-gray-900 truncate">{entry.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <FiClock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {msgCount === 0 ? 'No messages yet' : `${msgCount} message${msgCount > 1 ? 's' : ''}`}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-xs font-semibold text-cyan-600 bg-cyan-100 px-2.5 py-1 rounded-full">
                        Chat →
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Divider / empty state ── */}
          {userKeys.length === 0 && (
            <div className="mb-4">
              <button
                onClick={() => setIsSelectUserModalOpen(true)}
                className="w-full flex items-center gap-3 px-5 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all duration-200 group"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <FiUsers className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-lg block">Select an AI User</span>
                  <span className="text-sm text-white/80">Choose from generated extreme users</span>
                </div>
              </button>
            </div>
          )}

          {/* ── Divider ── */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400 font-medium">or</span></div>
          </div>

          {/* ── Provided User Card ── */}
          {savedProvidedUser ? (
            <div className="flex flex-col gap-3 px-5 py-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FiUserPlus className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-sm text-purple-800 block">{savedProvidedUser.name}</span>
                    <span className="text-xs text-purple-500">{savedProvidedUser.age} · {savedProvidedUser.location}</span>
                  </div>
                </div>
                <button
                  onClick={() => setConfirmClear('provided')}
                  title="Change user"
                  className="p-1.5 text-purple-400 hover:text-purple-600 hover:bg-purple-100 rounded-lg transition-colors flex-shrink-0"
                >
                  <FiRefreshCw className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => setChatMode('provided')}
                className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:scale-[1.01] transition-all duration-200"
              >
                Continue Chat
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsCustomUserModalOpen(true)}
              className="w-full flex items-center gap-3 px-5 py-4 bg-white border-2 border-purple-100 hover:border-purple-300 rounded-2xl text-left transition-all duration-200 hover:shadow-md group"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiUserPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-sm text-gray-800 block">Provide Your Own User</span>
                <span className="text-xs text-gray-500">Enter custom user details to chat</span>
              </div>
            </button>
          )}
        </div>

        {/* ── Confirmation Dialog ── */}
        {confirmClear && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                    <FiRefreshCw className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Change user?</h3>
                    <p className="text-sm text-gray-500">This will clear the saved user.</p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 flex justify-end gap-3">
                <button onClick={() => setConfirmClear(null)} className="px-5 py-2.5 text-gray-600 font-medium">Cancel</button>
                <button
                  onClick={async () => {
                    if (effectiveUserId) await ProjectService.saveChatProvidedUser(projectId, effectiveUserId, null);
                    setSavedProvidedUser(null);
                    setConfirmClear(null);
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                >
                  Yes, Change
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Custom User Modal ── */}
        {isCustomUserModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
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
                  <button onClick={() => setIsCustomUserModalOpen(false)} className="p-2 hover:bg-white/50 rounded-xl transition-colors">
                    <FiX className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {['name', 'age', 'location'].map(field => (
                  <div key={field}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 capitalize">{field} *</label>
                    <input
                      type="text"
                      value={customUser[field as keyof CustomExtremeUser]}
                      onChange={e => setCustomUser(prev => ({ ...prev, [field]: e.target.value }))}
                      placeholder={field === 'age' ? 'e.g. 25' : field === 'location' ? 'e.g. Mumbai' : `Enter user ${field}`}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-colors"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={customUser.description}
                    onChange={e => setCustomUser(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe characteristics, behaviors, needs..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-colors resize-none"
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                <button onClick={() => setIsCustomUserModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-medium">Cancel</button>
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

        {/* ── Extreme User Selection Modal ── */}
        <ExtremeUserSelectionModal
          isOpen={isSelectUserModalOpen}
          onClose={() => setIsSelectUserModalOpen(false)}
          onSelectUser={handleExtremeUserSelect}
          extremeUserData={extremeUserData}
        />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CHAT MODE
  // ─────────────────────────────────────────────────────────────────────────────
  const isExtreme = chatMode === 'selected';
  const gradFrom = isExtreme ? 'from-cyan-500' : 'from-purple-500';
  const gradTo = isExtreme ? 'to-blue-600' : 'to-pink-600';

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 overflow-hidden h-[75vh] flex flex-col relative">
      {/* декоративный фон */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/30 via-blue-50/20 to-indigo-50/30 pointer-events-none" />

      {/* ── HEADER ── */}
      <div className="relative px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-gray-100/80 flex-shrink-0">
        <div className="flex items-center justify-between gap-3">

          {/* Back + avatar */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={exitChat}
              className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
            >
              <FiArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <div className={`relative w-10 h-10 bg-gradient-to-r ${gradFrom} ${gradTo} rounded-2xl flex items-center justify-center shadow-md flex-shrink-0`}>
              <FiMessageCircle className="w-5 h-5 text-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
            </div>

            {/* User switcher (only for extreme users) */}
            {isExtreme && userKeys.length > 1 ? (
              <div className="relative min-w-0" ref={switcherRef}>
                <button
                  onClick={() => setIsUserSwitcherOpen(v => !v)}
                  className="flex items-center gap-1.5 min-w-0 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors"
                >
                  <span className="truncate max-w-[140px] text-sm font-bold text-gray-900">{activeUserLabel}</span>
                  <FiChevronDown className={`w-3.5 h-3.5 text-gray-500 flex-shrink-0 transition-transform ${isUserSwitcherOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {isUserSwitcherOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                    <div className="px-3 py-2 border-b border-gray-50">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Switch User</p>
                    </div>
                    <div className="max-h-52 overflow-y-auto py-1">
                      {userKeys.map(key => {
                        const entry = extremeUserMap[key];
                        const isActive = key === activeUserKey;
                        return (
                          <button
                            key={key}
                            onClick={() => switchUser(key)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${isActive ? 'bg-cyan-50' : 'hover:bg-gray-50'}`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-gradient-to-r from-cyan-500 to-blue-600' : 'bg-gray-100'}`}>
                              <FiUser className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-semibold truncate ${isActive ? 'text-cyan-700' : 'text-gray-800'}`}>{entry.name}</p>
                              <p className="text-xs text-gray-400">{entry.messages?.length ?? 0} msg{(entry.messages?.length ?? 0) !== 1 ? 's' : ''}</p>
                            </div>
                            {isActive && <div className="w-2 h-2 bg-cyan-500 rounded-full flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                    <div className="px-3 py-2 border-t border-gray-50">
                      <button
                        onClick={() => { setIsUserSwitcherOpen(false); setIsSelectUserModalOpen(true); }}
                        className="w-full flex items-center gap-2 text-xs font-semibold text-cyan-600 hover:text-cyan-700 py-1"
                      >
                        <FiPlus className="w-3.5 h-3.5" /> Add another user
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate max-w-[180px]">{activeUserLabel}</p>
                <p className="text-xs text-gray-400">AI User</p>
              </div>
            )}
          </div>

          {/* Online badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-full border border-green-200 flex-shrink-0">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-green-700">Online</span>
          </div>
        </div>
      </div>

      {/* ── MESSAGES ── */}
      <div className="relative flex-1 overflow-y-auto">
        <div className="p-4 space-y-4 pb-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className={`mx-auto w-16 h-16 bg-gradient-to-r ${gradFrom} ${gradTo} rounded-3xl flex items-center justify-center shadow-xl mb-4`}>
                <FiMessageCircle className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">Start Your Conversation</h4>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">
                Chat with <span className="font-semibold">{activeUserLabel}</span> from their perspective.
              </p>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] ${msg.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-md ${
                    msg.isUser
                      ? `bg-gradient-to-r ${gradFrom} ${gradTo} text-white ml-2.5`
                      : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 mr-2.5 border border-gray-200'
                  }`}>
                    {msg.isUser ? <FiUser className="w-4 h-4" /> : <FiMessageCircle className="w-4 h-4" />}
                  </div>
                  <div className="space-y-1">
                    <div className={`px-4 py-3 rounded-2xl shadow-md border text-sm leading-relaxed font-medium whitespace-pre-wrap ${
                      msg.isUser
                        ? `bg-gradient-to-r ${gradFrom} ${gradTo} text-white border-transparent`
                        : 'bg-white/90 text-gray-800 border-gray-200/50'
                    }`}>
                      {msg.text}
                    </div>
                    <p className={`text-xs px-1 ${msg.isUser ? 'text-right text-gray-400' : 'text-gray-400'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}

          {isTyping && (
            <div className="flex justify-start">
              <div className="flex max-w-[85%]">
                <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 mr-2.5 flex items-center justify-center border border-gray-200 shadow-sm">
                  <FiMessageCircle className="w-4 h-4" />
                </div>
                <div className="bg-white/90 px-4 py-3 rounded-2xl shadow-md border border-gray-200/50">
                  <div className="flex space-x-1 items-center">
                    {[0, 0.2, 0.4].map((delay, i) => (
                      <div key={i} className={`w-2 h-2 bg-gradient-to-r ${gradFrom} ${gradTo} rounded-full animate-bounce`} style={{ animationDelay: `${delay}s`}} />
                    ))}
                    <span className="text-xs text-gray-400 ml-2">typing…</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── INPUT ── */}
      <div className="relative border-t border-gray-100 bg-white/80 backdrop-blur-sm p-3 flex-shrink-0">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${activeUserLabel}…`}
              disabled={isTyping}
              className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-cyan-500/15 focus:border-cyan-400 transition-all text-gray-800 placeholder-gray-400 font-medium shadow-sm disabled:opacity-60"
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className={`relative px-5 py-3.5 bg-gradient-to-r ${gradFrom} ${gradTo} text-white rounded-2xl hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 shadow-md`}
          >
            {isTyping ? (
              <div className="flex space-x-1">
                {[0, 0.1, 0.2].map((d, i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
                ))}
              </div>
            ) : (
              <FiSend className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* ── Select User Modal (from inside chat) ── */}
      <ExtremeUserSelectionModal
        isOpen={isSelectUserModalOpen}
        onClose={() => setIsSelectUserModalOpen(false)}
        onSelectUser={handleExtremeUserSelect}
        extremeUserData={extremeUserData}
      />
    </div>
  );
};