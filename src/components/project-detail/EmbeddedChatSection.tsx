import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  FiSend, FiUser, FiMessageCircle, FiUserPlus, FiUsers, FiX,
  FiArrowLeft, FiRefreshCw, FiChevronDown, FiClock, FiPlus,
} from 'react-icons/fi';
import { ProjectService } from '@/services/projectService';
import { ExtremeUserSelectionModal } from './ExtremeUserSelectionModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
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
        ? JSON.parse(project.research_data)
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
      <div className="space-y-6">
        {/* Header Card */}
        <Card className="bg-white border border-gray-200 shadow-none rounded-xl overflow-hidden">
          <CardHeader className="px-8 py-6 border-b border-gray-100 flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 border border-gray-100 flex items-center justify-center">
                <FiMessageCircle className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-medium text-gray-900">Interact with User</CardTitle>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Chat with AI users or provide your own</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            <div className="space-y-8">
              {/* ── Extreme Users Grid ── */}
              {userKeys.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">AI Users</h3>
                    <Button
                      onClick={() => setIsSelectUserModalOpen(true)}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      <FiPlus className="w-3.5 h-3.5 mr-1.5" /> Add User
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {userKeys.map(key => {
                      const entry = extremeUserMap[key];
                      const msgCount = entry.messages?.length ?? 0;
                      return (
                        <button
                          key={key}
                          onClick={() => enterExtremeUserChat(key)}
                          className="flex items-center gap-3 px-4 py-4 bg-white border border-gray-200 hover:border-gray-300 rounded-lg text-left transition-all duration-200 hover:shadow-sm group"
                        >
                          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                            <FiUser className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-gray-900 truncate">{entry.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <FiClock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {msgCount === 0 ? 'No messages' : `${msgCount} msg${msgCount > 1 ? 's' : ''}`}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Divider ── */}
              {userKeys.length > 0 && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                  <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-muted-foreground font-medium">or</span></div>
                </div>
              )}

              {/* ── Empty state or Add User ── */}
              {userKeys.length === 0 && (
                <div className="space-y-3">
                  <Button
                    onClick={() => setIsSelectUserModalOpen(true)}
                    className="w-full bg-primary text-white hover:bg-primary/90"
                    size="lg"
                  >
                    <FiUsers className="w-5 h-5 mr-2" />
                    Select an AI User
                  </Button>
                </div>
              )}

              {/* ── Provided User Card ── */}
              {savedProvidedUser ? (
                <Card className="bg-white border border-gray-200 shadow-none">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                          <FiUserPlus className="w-4 h-4 text-secondary-foreground" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-sm text-gray-900 block">{savedProvidedUser.name}</span>
                          <span className="text-xs text-muted-foreground">{savedProvidedUser.age} · {savedProvidedUser.location}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => setConfirmClear('provided')}
                        variant="ghost"
                        size="sm"
                      >
                        <FiRefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button
                      onClick={() => setChatMode('provided')}
                      className="w-full"
                      size="sm"
                    >
                      Continue Chat
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Button
                  onClick={() => setIsCustomUserModalOpen(true)}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <FiUserPlus className="w-4 h-4 mr-2" />
                  Provide Your Own User
                </Button>
              )}
            </div>

            {/* ── Extreme User Selection Modal ── */}
            <ExtremeUserSelectionModal
              isOpen={isSelectUserModalOpen}
              onClose={() => setIsSelectUserModalOpen(false)}
              onSelectUser={handleExtremeUserSelect}
              extremeUserData={extremeUserData}
            />
          </CardContent>
        </Card>

        {/* ── Confirmation Dialog ── */}
        {confirmClear && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-sm bg-white border border-gray-200 shadow-lg rounded-lg">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-gray-900">Change user?</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">This will clear the saved user.</p>
              </CardHeader>
              <CardContent className="pt-6 flex justify-end gap-3">
                <Button onClick={() => setConfirmClear(null)} variant="outline">
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (effectiveUserId) await ProjectService.saveChatProvidedUser(projectId, effectiveUserId, null);
                    setSavedProvidedUser(null);
                    setConfirmClear(null);
                  }}
                  variant="default"
                >
                  Yes, Change
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Custom User Modal ── */}
        {isCustomUserModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-white border border-gray-200 shadow-lg rounded-lg">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gray-900">Provide Your Extreme User</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">Enter user details below</p>
                  </div>
                  <Button
                    onClick={() => setIsCustomUserModalOpen(false)}
                    variant="ghost"
                    size="sm"
                  >
                    <FiX className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {['name', 'age', 'location'].map(field => (
                  <div key={field} className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900 capitalize">{field}</label>
                    <Input
                      type="text"
                      value={customUser[field as keyof CustomExtremeUser]}
                      onChange={e => setCustomUser(prev => ({ ...prev, [field]: e.target.value }))}
                      placeholder={field === 'age' ? 'e.g. 25' : field === 'location' ? 'e.g. Mumbai' : `Enter user ${field}`}
                    />
                  </div>
                ))}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900">Description</label>
                  <textarea
                    value={customUser.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomUser(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe characteristics, behaviors, needs..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none"
                  />
                </div>
              </CardContent>
              <div className="border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
                <Button onClick={() => setIsCustomUserModalOpen(false)} variant="outline">
                  Cancel
                </Button>
                <Button
                  onClick={handleCustomUserSubmit}
                  disabled={!customUser.name.trim() || !customUser.age.trim() || !customUser.location.trim() || !customUser.description.trim()}
                >
                  Start Chat
                </Button>
              </div>
            </Card>
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

  return (
    <Card className="bg-white border border-gray-200 shadow-none rounded-lg overflow-hidden h-[75vh] flex flex-col">
      {/* ── HEADER ── */}
      <div className="relative px-6 py-4 bg-white border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              onClick={exitChat}
              variant="ghost"
              size="sm"
            >
              <FiArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <FiMessageCircle className="w-4 h-4 text-white" />
            </div>

            {isExtreme && userKeys.length > 1 ? (
              <div className="relative min-w-0" ref={switcherRef}>
                <Button
                  onClick={() => setIsUserSwitcherOpen(v => !v)}
                  variant="outline"
                  size="sm"
                  className="text-sm"
                >
                  <span className="truncate max-w-[140px]">{activeUserLabel}</span>
                  <FiChevronDown className={`w-3.5 h-3.5 ml-1.5 transition-transform ${isUserSwitcherOpen ? 'rotate-180' : ''}`} />
                </Button>

                {isUserSwitcherOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Switch User</p>
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                      {userKeys.map(key => {
                        const entry = extremeUserMap[key];
                        const isActive = key === activeUserKey;
                        return (
                          <button
                            key={key}
                            onClick={() => switchUser(key)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors text-sm border-b border-gray-50 last:border-b-0 ${isActive ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-primary' : 'bg-gray-100'}`}>
                              <FiUser className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-semibold truncate ${isActive ? 'text-primary' : 'text-gray-900'}`}>{entry.name}</p>
                              <p className="text-xs text-muted-foreground">{entry.messages?.length ?? 0} msg{(entry.messages?.length ?? 0) !== 1 ? 's' : ''}</p>
                            </div>
                            {isActive && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                    <div className="px-3 py-2 border-t border-gray-100">
                      <Button
                        onClick={() => { setIsUserSwitcherOpen(false); setIsSelectUserModalOpen(true); }}
                        variant="ghost"
                        size="sm"
                        className="text-xs w-full justify-start"
                      >
                        <FiPlus className="w-3.5 h-3.5 mr-1.5" /> Add another user
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate max-w-[180px]">{activeUserLabel}</p>
                <p className="text-xs text-muted-foreground">AI User</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-200 flex-shrink-0">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-green-700">Online</span>
          </div>
        </div>
      </div>

      {/* ── MESSAGES ── */}
      <div className="relative flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <FiMessageCircle className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Start Your Conversation</h4>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Chat with <span className="font-semibold">{activeUserLabel}</span> from their perspective.
              </p>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[80%] ${msg.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${
                    msg.isUser
                      ? 'bg-primary text-white ml-2'
                      : 'bg-gray-100 text-gray-600 mr-2 border border-gray-200'
                  }`}>
                    {msg.isUser ? <FiUser className="w-4 h-4" /> : <FiMessageCircle className="w-4 h-4" />}
                  </div>
                  <div className="space-y-1">
                    <div className={`px-4 py-2 rounded-lg text-sm leading-relaxed font-medium ${
                      msg.isUser
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-900 border border-gray-200'
                    }`}>
                      {msg.text}
                    </div>
                    <p className={`text-xs px-1 ${msg.isUser ? 'text-right text-muted-foreground' : 'text-muted-foreground'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}

          {isTyping && (
            <div className="flex justify-start">
              <div className="flex max-w-[80%]">
                <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 mr-2 flex items-center justify-center border border-gray-200">
                  <FiMessageCircle className="w-4 h-4" />
                </div>
                <div className="bg-gray-100 px-4 py-2 rounded-lg border border-gray-200">
                  <div className="flex space-x-1 items-center">
                    {[0, 0.2, 0.4].map((delay, i) => (
                      <div key={i} className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${delay}s`}} />
                    ))}
                    <span className="text-xs text-muted-foreground ml-2">typing…</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── INPUT ── */}
      <div className="relative border-t border-gray-100 bg-white p-4 flex-shrink-0">
        <div className="flex items-end gap-3">
          <Input
            type="text"
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${activeUserLabel}…`}
            disabled={isTyping}
            className="text-sm"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="bg-primary text-white hover:bg-primary/90 flex-shrink-0"
            size="sm"
          >
            {isTyping ? (
              <div className="flex space-x-1">
                {[0, 0.1, 0.2].map((d, i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
                ))}
              </div>
            ) : (
              <FiSend className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* ── Select User Modal ── */}
      <ExtremeUserSelectionModal
        isOpen={isSelectUserModalOpen}
        onClose={() => setIsSelectUserModalOpen(false)}
        onSelectUser={handleExtremeUserSelect}
        extremeUserData={extremeUserData}
      />
    </Card>
  );
};