import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  FiSend,
  FiMessageCircle,
  FiUserPlus,
  FiUsers,
  FiX,
  FiInfo,
  FiRefreshCw,
  FiMic,
  FiUploadCloud,
} from 'react-icons/fi';
import { ProjectService } from '@/services/projectService';
import { ExtremeUserSelectionModal } from './ExtremeUserSelectionModal';
import { Input } from '@/components/ui/input';
import { buttonVariants } from '@/components/ui/button';
import { postN8nWebhook } from '@/services/n8nWebhook';
import { CheckCheck } from 'lucide-react';

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
  /** Full extreme-user brief; sent to n8n on every message so the model stays in persona */
  persona_summary?: string;
}

type ExtremeUserMap = Record<string, ExtremeUserEntry>;

interface CustomExtremeUser {
  name: string;
  age: string;
  location: string;
  description: string;
}

type ActiveThread = null | { kind: 'extreme'; key: string } | { kind: 'provided' } | { kind: 'audio'; key: string };

interface EmbeddedChatSectionProps {
  projectId: string;
  extremeUserData?: any;
  project?: any;
  userId?: string;
  /** Refetch project after n8n persists chat so `chatbox_extreuser` / `chatbox` stay in sync */
  onRefreshProject?: () => void | Promise<void>;
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

function messagesFromRows(
  rows: Array<{ user: string; assistant: string; generated_at: string }>
): ChatMessage[] {
  return rows.flatMap((m, idx) => [
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

function mergePreferLongerHistory(local: ChatMessage[], fromServer: ChatMessage[]): ChatMessage[] {
  if (fromServer.length >= local.length) return fromServer;
  return local;
}

// ─── Primary button (matches AsIsMapReportViewer) ───────────────────────────

const btnPrimary = buttonVariants({ variant: "default", size: "sm" });

const btnOutline = buttonVariants({ variant: "outline", size: "sm" });

const dotColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-yellow-500',
  'bg-orange-500',
  'bg-cyan-500',
  'bg-teal-500',
  'bg-indigo-500',
];

// ─── Component ───────────────────────────────────────────────────────────────

export const EmbeddedChatSection = ({
  projectId,
  extremeUserData,
  project,
  userId,
  onRefreshProject,
}: EmbeddedChatSectionProps) => {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id || '';

  const extremeUserMap = useMemo<ExtremeUserMap>(
    () => parseExtremeUserMap(project?.chatbox_extreuser),
    [project?.chatbox_extreuser]
  );

  const sortedUserKeys = useMemo(() => {
    return Object.keys(extremeUserMap).sort((a, b) => {
      const ta = new Date(extremeUserMap[a]?.created_at || 0).getTime();
      const tb = new Date(extremeUserMap[b]?.created_at || 0).getTime();
      return tb - ta;
    });
  }, [extremeUserMap]);

  const audioUserMap = useMemo<ExtremeUserMap>(
    () => parseExtremeUserMap(project?.chatbox_audio_users),
    [project?.chatbox_audio_users]
  );

  const sortedAudioKeys = useMemo(() => {
    return Object.keys(audioUserMap).sort((a, b) => {
      const ta = new Date(audioUserMap[a]?.created_at || 0).getTime();
      const tb = new Date(audioUserMap[b]?.created_at || 0).getTime();
      return tb - ta;
    });
  }, [audioUserMap]);

  const researchExtremeMeta = useMemo(() => {
    if (!project?.research_data) return { threadKey: undefined as string | undefined, chatExtremeUser: '' };
    try {
      const rd =
        typeof project.research_data === 'string'
          ? JSON.parse(project.research_data)
          : project.research_data || {};
      return {
        threadKey: typeof rd.chatExtremeUserThreadKey === 'string' ? rd.chatExtremeUserThreadKey : undefined,
        chatExtremeUser: typeof rd.chatExtremeUser === 'string' ? rd.chatExtremeUser : '',
      };
    } catch {
      return { threadKey: undefined, chatExtremeUser: '' };
    }
  }, [project?.research_data]);

  const [savedProvidedUser, setSavedProvidedUser] = useState<CustomExtremeUser | null>(null);
  const [activeThread, setActiveThread] = useState<ActiveThread>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [isCustomUserModalOpen, setIsCustomUserModalOpen] = useState(false);
  const [isSelectUserModalOpen, setIsSelectUserModalOpen] = useState(false);
  const [isPersonaInfoOpen, setIsPersonaInfoOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState<'provided' | null>(null);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const [customUser, setCustomUser] = useState<CustomExtremeUser>({
    name: '',
    age: '',
    location: '',
    description: '',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!project) return;
    let rd: Record<string, any> = {};
    try {
      rd =
        typeof project.research_data === 'string'
          ? JSON.parse(project.research_data)
          : project.research_data || {};
    } catch {
      rd = {};
    }
    if (rd.chatProvidedUser) setSavedProvidedUser(rd.chatProvidedUser);
  }, [project]);

  const loadExtremeThreadMessages = useCallback(
    async (key: string) => {
      try {
        const rows = await ProjectService.getProjectChatboxExtreUserHistory(
          projectId,
          effectiveUserId,
          key
        );
        if (rows.length > 0) {
          setMessages(messagesFromRows(rows));
          return;
        }
        const entry = extremeUserMap[key];
        setMessages(entry ? messagesFromEntry(entry) : []);
      } catch {
        const entry = extremeUserMap[key];
        setMessages(entry ? messagesFromEntry(entry) : []);
      }
    },
    [projectId, effectiveUserId, extremeUserMap]
  );

  const loadAudioThreadMessages = useCallback(
    async (key: string) => {
      try {
        const rows = await ProjectService.getProjectChatboxAudioHistory(
          projectId,
          effectiveUserId,
          key
        );
        if (rows.length > 0) {
          setMessages(messagesFromRows(rows));
          return;
        }
        const entry = audioUserMap[key];
        setMessages(entry ? messagesFromEntry(entry) : []);
      } catch {
        const entry = audioUserMap[key];
        setMessages(entry ? messagesFromEntry(entry) : []);
      }
    },
    [projectId, effectiveUserId, audioUserMap]
  );

  useEffect(() => {
    if (!activeThread) {
      setMessages([]);
      return;
    }
    if (activeThread.kind === 'extreme') {
      void loadExtremeThreadMessages(activeThread.key);
      return;
    }
    if (activeThread.kind === 'audio') {
      void loadAudioThreadMessages(activeThread.key);
      return;
    }
    if (activeThread.kind === 'provided') {
      let cancelled = false;
      (async () => {
        try {
          const history = await ProjectService.getProjectChatHistory(projectId, effectiveUserId);
          if (cancelled) return;
          setMessages(
            history.flatMap((chat, idx) => [
              {
                id: `u-${idx}`,
                text: chat.user,
                isUser: true,
                timestamp: new Date(chat.generated_at),
              },
              {
                id: `a-${idx}`,
                text: chat.assistant,
                isUser: false,
                timestamp: new Date(chat.generated_at),
              },
            ])
          );
        } catch {
          if (!cancelled) setMessages([]);
        }
      })();
      return () => {
        cancelled = true;
      };
    }
  }, [activeThread, projectId, effectiveUserId, loadExtremeThreadMessages]);

  const onRefreshRef = useRef(onRefreshProject);
  onRefreshRef.current = onRefreshProject;
  useEffect(() => {
    void onRefreshRef.current?.();
  }, [projectId, effectiveUserId]);

  const enterExtremeUserChat = (key: string) => {
    setActiveThread({ kind: 'extreme', key });
  };

  const enterProvidedChat = () => {
    if (!savedProvidedUser) {
      setIsCustomUserModalOpen(true);
      return;
    }
    setActiveThread({ kind: 'provided' });
  };

  const enterAudioChat = (key: string) => {
    setActiveThread({ kind: 'audio', key });
  };

  const handleAudioUploadSubmit = async () => {
    if (!audioFile || !effectiveUserId) return;
    setIsUploadingAudio(true);
    try {
      const audioUrl = await ProjectService.uploadAudioFile(audioFile, projectId, effectiveUserId);
      const res = await postN8nWebhook('https://n8n.srv922914.hstgr.cloud/webhook/process_audio_conversation', {
        project_id: projectId,
        audio_url: audioUrl,
        user_id: effectiveUserId
      });
      if (!res.ok) throw new Error(`Audio processing failed: HTTP ${res.status}`);

      const raw = await res.text();
      if (!raw.trim()) {
        throw new Error(
          'Audio workflow returned an empty response. Check that the n8n workflow is active and reaches the Respond to Webhook node.'
        );
      }

      let data: { thread_key?: string; error?: string };
      try {
        data = JSON.parse(raw) as { thread_key?: string; error?: string };
      } catch {
        throw new Error(`Invalid JSON from audio workflow: ${raw.slice(0, 200)}`);
      }

      console.log('Audio workflow response:', data);

      if (data.error) throw new Error(data.error);
      if (!data.thread_key) {
        throw new Error('n8n workflow did not return thread_key. Response: ' + raw);
      }
      
      setIsAudioModalOpen(false);
      setAudioFile(null);

      // n8n directly updated the Supabase row. We just tell the frontend to refresh
      // and immediately open the chat thread that n8n created.
      await Promise.resolve(onRefreshProject?.());
      setActiveThread({ kind: 'audio', key: data.thread_key });
    } catch (e) {
      console.error('Audio upload error:', e);
      alert(`Failed to process audio file: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping || !activeThread) return;

    if (activeThread.kind === 'extreme') {
      const k = activeThread.key;
      if (!k || k === 'undefined' || k.startsWith('temp_')) return;
    }

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
      const threadKey = 'key' in activeThread ? activeThread.key : 'provided';
      const requestBody: Record<string, any> = {
        project_id: projectId,
        user: text,
        user_id: threadKey,
        user_name: threadKey, // Fallback, updated below
      };

      if (activeThread.kind === 'extreme' || activeThread.kind === 'audio') {
        webhookUrl = 'https://n8n.srv922914.hstgr.cloud/webhook/chatbox_extreuser';
        const key = activeThread.key;
        const entry = activeThread.kind === 'audio' ? audioUserMap[key] : extremeUserMap[key] as ExtremeUserEntry | undefined;
        requestBody.extreme_user_key = key;
        requestBody.extremeUserKey = key;
        requestBody.extreme_user_id = key;
        requestBody.user_name = (entry?.name || key).trim();
        requestBody.extreme_user_name = requestBody.user_name;
        const persona =
          (typeof entry?.persona_summary === 'string' ? entry.persona_summary : '').trim() ||
          (researchExtremeMeta.threadKey === key ? researchExtremeMeta.chatExtremeUser : '').trim();
        if (persona) {
          requestBody.extreme_user_data = persona;
          requestBody.extreme_user_persona = persona;
          requestBody.extreme_user_summary = persona;
          requestBody.persona_summary = persona;
          requestBody.extremeUserPersona = persona;
        }
      } else {
        webhookUrl = 'https://n8n.srv922914.hstgr.cloud/webhook/chatbox_userprovideinfo';
        if (savedProvidedUser) {
          requestBody.provided_user_data = `Custom User - Name: ${savedProvidedUser.name}, Age: ${savedProvidedUser.age}, Location: ${savedProvidedUser.location}, Description: ${savedProvidedUser.description}`;
          requestBody.user_name = savedProvidedUser.name;
          requestBody.extreme_user_data = requestBody.provided_user_data;
        }
      }

      const res = await postN8nWebhook(webhookUrl, requestBody);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      let reply = "I'm sorry, I couldn't process your message right now.";
      if (Array.isArray(data) && data[0]?.Assistant) reply = data[0].Assistant;
      else if (data.output) reply = data.output;

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: reply,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);

      await Promise.resolve(onRefreshProject?.());

      if (activeThread.kind === 'extreme') {
        const rows = await ProjectService.getProjectChatboxExtreUserHistory(
          projectId,
          effectiveUserId,
          activeThread.key
        );
        const fromServer = messagesFromRows(rows);
        setMessages(prev => mergePreferLongerHistory(prev, fromServer));
      } else if (activeThread.kind === 'audio') {
        const rows = await ProjectService.getProjectChatboxAudioHistory(
          projectId,
          effectiveUserId,
          activeThread.key
        );
        const fromServer = messagesFromRows(rows);
        setMessages(prev => mergePreferLongerHistory(prev, fromServer));
      } else {
        const history = await ProjectService.getProjectChatHistory(projectId, effectiveUserId);
        const fromServer = messagesFromRows(history);
        setMessages(prev => mergePreferLongerHistory(prev, fromServer));
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: 'Sorry, there was an error. Please try again.',
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const handleCustomUserSubmit = async () => {
    if (
      !customUser.name.trim() ||
      !customUser.age.trim() ||
      !customUser.location.trim() ||
      !customUser.description.trim()
    )
      return;

    try {
      await postN8nWebhook('https://n8n.srv922914.hstgr.cloud/webhook/chatbox_userprovideinfo', {
        project_id: projectId,
        ...customUser,
      });
    } catch {
      /* non-critical */
    }

    if (effectiveUserId) {
      await ProjectService.saveChatProvidedUser(projectId, effectiveUserId, customUser);
      setSavedProvidedUser(customUser);
    }

    setCustomUser({ name: '', age: '', location: '', description: '' });
    setIsCustomUserModalOpen(false);
    setActiveThread({ kind: 'provided' });
    void onRefreshProject?.();
  };

  const handleExtremeUserSelect = async (userSummary: string) => {
    if (!effectiveUserId) return;
    setIsSelectUserModalOpen(false);
    const firstLine = userSummary.split('\n')[0]?.trim() || 'New AI user';
    const threadKey = `eu_${crypto.randomUUID().replace(/-/g, '')}`;

    await ProjectService.mergeExtremeUserChatboxThread(projectId, effectiveUserId, threadKey, {
      name: firstLine,
      persona_summary: userSummary,
    });
    await ProjectService.saveChatExtremeUser(projectId, effectiveUserId, userSummary, threadKey);

    await Promise.resolve(onRefreshProject?.());
    setActiveThread({ kind: 'extreme', key: threadKey });
    void onRefreshProject?.();
  };

  const activeEntry =
    (activeThread?.kind === 'extreme' || activeThread?.kind === 'audio') && activeThread.key
      ? ((activeThread.kind === 'audio' ? audioUserMap[activeThread.key] : extremeUserMap[activeThread.key]) ?? null)
      : null;

  const activeUserLabel =
    activeThread?.kind === 'extreme'
      ? activeEntry?.name || activeThread.key || 'AI user'
      : activeThread?.kind === 'audio'
      ? activeEntry?.name || activeThread.key || 'Audio Persona'
      : activeThread?.kind === 'provided'
        ? savedProvidedUser
          ? savedProvidedUser.name
          : 'Your user'
        : '';

  const chatResearchSnippet = useMemo(() => {
    if (!project?.research_data) return '';
    try {
      const rd =
        typeof project.research_data === 'string'
          ? JSON.parse(project.research_data)
          : project.research_data;
      const s = rd?.chatExtremeUser;
      return typeof s === 'string' ? s.slice(0, 2000) : '';
    } catch {
      return '';
    }
  }, [project?.research_data]);

  const showRightPane = activeThread !== null;

  const extremeThreadBroken =
    activeThread?.kind === 'extreme' &&
    (!activeThread.key || activeThread.key === 'undefined' || activeThread.key.startsWith('temp_'));

  return (
    <div className="flex h-[calc(100vh-100px)] min-h-[600px] flex-col gap-3 overflow-hidden">
      {/* Page header — tighter spacing to chat shell */}
      <div className="flex shrink-0 flex-col gap-3 border-b border-gray-100 pb-3 xl:flex-row xl:items-end xl:justify-between xl:gap-4">
        <div className="min-w-0 text-left">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            Interact with User
          </h1>
          <p className="mt-1 max-w-xl text-base leading-snug text-gray-500">
            Chat with AI users or provide your own
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-start gap-2 xl:justify-end">
          <button
            type="button"
            onClick={() => setIsSelectUserModalOpen(true)}
            className={btnPrimary}
          >
            <span className="inline-flex items-center gap-2">
              <FiUsers className="size-4" />
              New AI user
            </span>
          </button>
          {!savedProvidedUser ? (
            <button
              type="button"
              onClick={() => setIsCustomUserModalOpen(true)}
              className={btnPrimary}
            >
              <span className="inline-flex items-center gap-2">
                <FiUserPlus className="size-4" />
                Provide Your Own User
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear('provided')}
              className={btnPrimary}
            >
              <span className="inline-flex items-center gap-2">
                <FiRefreshCw className="size-4" />
                Replace saved user
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsAudioModalOpen(true)}
            className={btnPrimary}
          >
             <span className="inline-flex items-center gap-2">
              <FiMic className="size-4" />
              Upload Audio Conversation
            </span>
          </button>
        </div>
      </div>

      {/* Master–detail shell */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white lg:flex-row">
        {/* Conversation list */}
        <aside className="flex w-full shrink-0 flex-col overflow-hidden border-b border-gray-100 bg-white lg:w-[280px] lg:border-b-0 lg:border-r">
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            <p className="px-2 pb-2 pl-3 pt-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Conversations
            </p>
            {sortedUserKeys.length === 0 && !savedProvidedUser && (
              <p className="px-2 py-4 text-sm leading-relaxed text-gray-600">
                No AI users yet. Use <span className="font-medium text-gray-900">New AI user</span> to
                create one from your extreme user research.
              </p>
            )}
            <ul className="flex flex-col gap-1.5">
              {sortedUserKeys.map((key, index) => {
                const entry = extremeUserMap[key];
                const isActive = activeThread?.kind === 'extreme' && activeThread.key === key;
                const count = entry?.messages?.length ?? 0;
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => enterExtremeUserChat(key)}
                      className={`w-full rounded-xl border px-3 py-3 text-left text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-gray-900 bg-gray-50 text-gray-900'
                          : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <span className="line-clamp-2 flex items-center gap-2">
                        <span className={`size-2.5 shrink-0 rounded-full ${dotColors[index % dotColors.length]}`} />
                        {entry?.name || `User ${key.slice(0, 8)}`}
                      </span>
                      <span className="ml-[18px] mt-1 block text-xs font-normal text-gray-500">
                        {count === 0 ? 'No messages yet' : `${count} exchange${count !== 1 ? 's' : ''}`}
                      </span>
                    </button>
                  </li>
                );
              })}
              {sortedAudioKeys.map((key, index) => {
                const entry = audioUserMap[key];
                const isActive = activeThread?.kind === 'audio' && activeThread.key === key;
                const count = entry?.messages?.length ?? 0;
                const dotColor = dotColors[(index + sortedUserKeys.length) % dotColors.length];
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => enterAudioChat(key)}
                      className={`w-full rounded-xl border px-3 py-3 text-left text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-gray-900 bg-gray-50 text-gray-900'
                          : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <span className="line-clamp-2 flex items-center gap-2">
                        <span className={`size-2.5 shrink-0 rounded-full ${dotColor}`} />
                        <FiMic className="size-4 shrink-0 text-gray-600" />
                        {entry?.name || `Audio ${key.slice(0, 8)}`}
                      </span>
                      <span className="ml-[18px] mt-1 block text-xs font-normal text-gray-500">
                        {count === 0 ? 'No messages yet' : `${count} exchange${count !== 1 ? 's' : ''}`}
                      </span>
                    </button>
                  </li>
                );
              })}
              {savedProvidedUser && (
                <li>
                  <button
                    type="button"
                    onClick={() => enterProvidedChat()}
                    className={`w-full rounded-xl border px-3 py-3 text-left text-sm font-medium transition-colors ${
                      activeThread?.kind === 'provided'
                        ? 'border-gray-900 bg-gray-50 text-gray-900'
                        : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span className="line-clamp-2 flex items-center gap-2">
                      <span className={`size-2.5 shrink-0 rounded-full ${dotColors[(sortedUserKeys.length + sortedAudioKeys.length) % dotColors.length]}`} />
                      <FiUserPlus className="size-4 shrink-0 text-gray-600" />
                      {savedProvidedUser.name}
                    </span>
                    <span className="ml-[18px] mt-1 block text-xs font-normal text-gray-500">
                      {savedProvidedUser.age} · {savedProvidedUser.location}
                    </span>
                  </button>
                </li>
              )}
            </ul>
          </div>
        </aside>

        {/* Chat pane */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
          {!showRightPane ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-gray-100">
                <FiMessageCircle className="size-7 text-gray-700" />
              </div>
              <p className="max-w-md text-base text-gray-600">
                Choose a conversation on the left, start a{' '}
                <button
                  type="button"
                  onClick={() => setIsSelectUserModalOpen(true)}
                  className="font-medium text-gray-900 underline decoration-gray-300 underline-offset-4 hover:decoration-gray-900"
                >
                  new AI user
                </button>
                , or use{' '}
                <button
                  type="button"
                  onClick={() => setIsCustomUserModalOpen(true)}
                  className="font-medium text-gray-900 underline decoration-gray-300 underline-offset-4 hover:decoration-gray-900"
                >
                  Provide Your Own User
                </button>
                .
              </p>
            </div>
          ) : (
            <>
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 sm:px-6">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900 sm:text-base">
                    {activeUserLabel}
                  </p>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {activeThread?.kind === 'provided' ? 'Your profile' : 'AI persona'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPersonaInfoOpen(true)}
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-700 transition-colors hover:bg-gray-50"
                  aria-label="Persona details"
                >
                  <FiInfo className="size-5" />
                </button>
              </div>

              <div className="relative min-h-0 flex-1 overflow-y-auto bg-gray-50/50">
                <div className="space-y-4 p-4 sm:p-6">
                  {messages.length === 0 && !isTyping ? (
                    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
                      <p className="text-sm text-gray-600">
                        No messages yet. Type below to start the conversation.
                      </p>
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`relative max-w-[min(100%,520px)] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            msg.isUser
                              ? 'bg-gray-200 text-gray-900 rounded-br-sm'
                              : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                          }`}
                        >
                          <div className={msg.isUser ? 'pr-5' : ''}>{msg.text}</div>
                          {msg.isUser && (
                            <div className="absolute bottom-1 right-2 flex items-center justify-end">
                              <CheckCheck className="size-4 text-green-500" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex max-w-[min(100%,520px)] items-center gap-2 rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
                        <div className="flex gap-1">
                          {[0, 0.15, 0.3].map((delay, i) => (
                            <div
                              key={i}
                              className="size-2 animate-bounce rounded-full bg-gray-400"
                              style={{ animationDelay: `${delay}s` }}
                            />
                          ))}
                        </div>
                        <span className="text-xs uppercase tracking-wide text-gray-500">Typing</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="shrink-0 border-t border-gray-100 bg-white p-4 sm:p-6">
                {extremeThreadBroken && (
                  <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                    This thread uses an invalid legacy key, so messages are blocked. Use{' '}
                    <button
                      type="button"
                      className="font-medium underline underline-offset-2"
                      onClick={() => setIsSelectUserModalOpen(true)}
                    >
                      New AI user
                    </button>{' '}
                    to start a thread with a stable id and full persona text.
                  </div>
                )}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <Input
                    type="text"
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Start typing"
                    disabled={isTyping || extremeThreadBroken}
                    className="min-h-11 flex-1 rounded-xl border-gray-200 text-sm focus-visible:ring-black/20"
                  />
                  <button
                    type="button"
                    onClick={() => void handleSendMessage()}
                    disabled={!inputMessage.trim() || isTyping || extremeThreadBroken}
                    className={`${btnPrimary} inline-flex h-11 shrink-0 items-center justify-center px-5 sm:w-auto`}
                  >
                    {isTyping ? (
                      <span className="flex gap-1">
                        {[0, 0.1, 0.2].map((d, i) => (
                          <span
                            key={i}
                            className="size-1.5 animate-bounce rounded-full bg-white"
                            style={{ animationDelay: `${d}s` }}
                          />
                        ))}
                      </span>
                    ) : (
                      <FiSend className="size-4" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <ExtremeUserSelectionModal
        isOpen={isSelectUserModalOpen}
        onClose={() => setIsSelectUserModalOpen(false)}
        onSelectUser={userSummary => void handleExtremeUserSelect(userSummary)}
        extremeUserData={extremeUserData}
      />

      {confirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-2xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Change user?</h3>
            <p className="mb-8 text-sm text-gray-600">This will clear the saved user profile.</p>
            <div className="flex gap-4">
              <button type="button" onClick={() => setConfirmClear(null)} className={`${btnOutline} flex-1`}>
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (effectiveUserId)
                    await ProjectService.saveChatProvidedUser(projectId, effectiveUserId, null);
                  setSavedProvidedUser(null);
                  if (activeThread?.kind === 'provided') setActiveThread(null);
                  setConfirmClear(null);
                  void onRefreshProject?.();
                }}
                className={`${btnPrimary} flex-1`}
              >
                Yes, change
              </button>
            </div>
          </div>
        </div>
      )}

      {isCustomUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Provide your extreme user</h3>
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                    Enter user details below
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomUserModalOpen(false)}
                  className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100"
                  aria-label="Close"
                >
                  <FiX className="size-5" />
                </button>
              </div>
            </div>
            <div className="max-h-[55vh] space-y-4 overflow-y-auto px-6 py-6">
              {(['name', 'age', 'location'] as const).map(field => (
                <div key={field} className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                    {field}
                  </label>
                  <Input
                    type="text"
                    value={customUser[field]}
                    onChange={e => setCustomUser(prev => ({ ...prev, [field]: e.target.value }))}
                    placeholder={
                      field === 'age' ? 'e.g. 25' : field === 'location' ? 'e.g. Mumbai' : 'Name'
                    }
                    className="rounded-xl border-gray-200 text-sm"
                  />
                </div>
              ))}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Description
                </label>
                <textarea
                  value={customUser.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setCustomUser(prev => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Characteristics, behaviors, needs…"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button type="button" onClick={() => setIsCustomUserModalOpen(false)} className={btnOutline}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleCustomUserSubmit()}
                disabled={
                  !customUser.name.trim() ||
                  !customUser.age.trim() ||
                  !customUser.location.trim() ||
                  !customUser.description.trim()
                }
                className={btnPrimary}
              >
                Start chat
              </button>
            </div>
          </div>
        </div>
      )}

      {isPersonaInfoOpen && showRightPane && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-gray-900">Persona details</h3>
                <p className="mt-1 truncate text-sm text-gray-600">{activeUserLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPersonaInfoOpen(false)}
                className="rounded-xl p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                <FiX className="size-5" />
              </button>
            </div>
            <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-6 text-sm leading-relaxed text-gray-700">
              {activeThread?.kind === 'extreme' && activeEntry && (
                <>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Created</p>
                    <p className="mt-1 text-gray-900">
                      {activeEntry.created_at
                        ? new Date(activeEntry.created_at).toLocaleString()
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Exchanges stored</p>
                    <p className="mt-1 text-gray-900">{activeEntry.messages?.length ?? 0}</p>
                  </div>
                  {(activeEntry.persona_summary || chatResearchSnippet) ? (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        {activeEntry.persona_summary ? 'Persona (stored on thread)' : 'Selection context'}
                      </p>
                      <pre className="mt-2 max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl border border-gray-100 bg-gray-50 p-4 font-sans text-xs text-gray-800">
                        {activeEntry.persona_summary || chatResearchSnippet}
                      </pre>
                    </div>
                  ) : null}
                </>
              )}
              {activeThread?.kind === 'extreme' && !activeEntry && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Status</p>
                  <p className="mt-1 text-gray-900">
                    Thread metadata is not in the loaded project yet (refresh if this persists), or the
                    conversation key is invalid.
                  </p>
                  {researchExtremeMeta.threadKey === activeThread.key && researchExtremeMeta.chatExtremeUser ? (
                    <div className="mt-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Latest selection (research_data)
                      </p>
                      <pre className="mt-2 max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl border border-gray-100 bg-gray-50 p-4 font-sans text-xs text-gray-800">
                        {researchExtremeMeta.chatExtremeUser}
                      </pre>
                    </div>
                  ) : chatResearchSnippet ? (
                    <div className="mt-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Selection context
                      </p>
                      <pre className="mt-2 max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl border border-gray-100 bg-gray-50 p-4 font-sans text-xs text-gray-800">
                        {chatResearchSnippet}
                      </pre>
                    </div>
                  ) : null}
                </div>
              )}
              {activeThread?.kind === 'provided' && savedProvidedUser && (
                <>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Age</p>
                    <p className="mt-1 text-gray-900">{savedProvidedUser.age}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Location</p>
                    <p className="mt-1 text-gray-900">{savedProvidedUser.location}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Description</p>
                    <p className="mt-1 text-gray-900">{savedProvidedUser.description}</p>
                  </div>
                </>
              )}
            </div>
            <div className="border-t border-gray-100 px-6 py-4">
              <button type="button" onClick={() => setIsPersonaInfoOpen(false)} className={`${btnOutline} w-full`}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isAudioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Upload Real-World Conversation</h3>
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                    Provide an audio recording of your interview
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAudioModalOpen(false)}
                  className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100"
                  aria-label="Close"
                  disabled={isUploadingAudio}
                >
                  <FiX className="size-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gray-50">
                <FiUploadCloud className="size-8 text-gray-400 mb-3" />
                <input
                  type="file"
                  accept="audio/*"
                  onChange={e => setAudioFile(e.target.files?.[0] || null)}
                  className="mb-2 w-full max-w-xs text-sm"
                  disabled={isUploadingAudio}
                />
                <p className="text-xs text-gray-500 text-center">Supports MP3, WAV, M4A up to 50MB</p>
              </div>
              {isUploadingAudio && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                  <FiRefreshCw className="size-4 animate-spin" />
                  <span>Uploading and analyzing audio — this may take 1–2 minutes...</span>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setIsAudioModalOpen(false)}
                className={btnOutline}
                disabled={isUploadingAudio}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleAudioUploadSubmit()}
                disabled={!audioFile || isUploadingAudio}
                className={btnPrimary}
              >
                {isUploadingAudio ? 'Processing...' : 'Upload & Start Chat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
