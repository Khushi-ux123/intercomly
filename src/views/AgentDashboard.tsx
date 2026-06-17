import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useTickets } from '../context/TicketContext';
import { TicketActivityLog } from '../components/TicketActivityLog';
import { TicketStatusBadge } from '../components/TicketStatusBadge';
import { 
  Search, 
  MessageSquare, 
  User, 
  Check, 
  Clock, 
  CornerDownRight, 
  Send, 
  Sparkles, 
  Paperclip, 
  UserCheck, 
  UserMinus,
  CheckCircle,
  HelpCircle,
  X,
  FileText,
  NotebookPen,
  Smile,
  Meh,
  Frown,
  Mic,
  MicOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const renderSentimentIcon = (sentiment?: 'positive' | 'neutral' | 'negative') => {
  if (!sentiment) return null;
  
  switch (sentiment) {
    case 'positive':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700 border border-emerald-150 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30" title="Customer sentiment: Positive">
          <Smile className="h-3 w-3" />
          <span>Positive</span>
        </span>
      );
    case 'negative':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-1.5 py-0.5 text-[9px] font-medium text-rose-700 border border-rose-150 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/30" title="Customer sentiment: Critical or Negative">
          <Frown className="h-3 w-3" />
          <span>Urgent/Frustrated</span>
        </span>
      );
    case 'neutral':
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 border border-slate-150 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/30" title="Customer sentiment: Neutral">
          <Meh className="h-3 w-3" />
          <span>Neutral</span>
        </span>
      );
  }
};

export const AgentDashboard: React.FC = () => {
  const { 
    user, 
    conversations, 
    messages, 
    fetchConversations, 
    activeConversation, 
    selectConversation, 
    sendMessage,
    triggerAIChatbotReply,
    usersList,
    fetchUsers,
    typingUsers,
    sendTypingStatus
  } = useApp();

  const {
    tickets,
    fetchTickets,
    updateTicketStatus
  } = useTickets();

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [filterAssignee, setFilterAssignee] = useState<'all' | 'me' | 'unassigned' | 'others'>('all');

  // Input states
  const [msgText, setMsgText] = useState('');
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Voice-to-Text State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Web Speech API is not supported in this browser. Please try another browser like Google Chrome.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
    } else {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setMsgText(prev => prev ? prev + ' ' + transcript : transcript);
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        setIsListening(false);
      }
    }
  };

  // Agent internal notes
  const [customerNote, setCustomerNote] = useState('');
  const [draftPlaceholder, setDraftPlaceholder] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Smart Canned Replies states
  const [smartReplies, setSmartReplies] = useState<Array<{ title: string, text: string }>>([]);
  const [fetchingReplies, setFetchingReplies] = useState(false);

  const fetchSmartReplies = async () => {
    if (!activeConversation) return;
    setFetchingReplies(true);
    try {
      const res = await fetch(`/api/conversations/${activeConversation.id}/smart-replies`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('support-token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSmartReplies(data.replies || []);
      }
    } catch (err) {
      console.error('Failed to fetch smart canned replies', err);
    } finally {
      setFetchingReplies(false);
    }
  };

  useEffect(() => {
    if (activeConversation) {
      fetchSmartReplies();
    } else {
      setSmartReplies([]);
    }
  }, [activeConversation]);

  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTickets();
    fetchConversations();
    fetchUsers();
    
    // Load local storage notes for testing
    const saved = localStorage.getItem('agent-persisted-customer-notes');
    if (saved) setCustomerNote(saved);
  }, []);

  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typingUsers]);

  // Handle Note Save
  const handleSaveNote = () => {
    localStorage.setItem('agent-persisted-customer-notes', customerNote);
    setToastMsg('Customer session file notes saved successfully!');
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleClaimTicket = async (ticketId: string) => {
    await updateTicketStatus(ticketId, 'in_progress', user!.id);
  };

  const handleReleaseTicket = async (ticketId: string) => {
    await updateTicketStatus(ticketId, 'open', null);
  };

  const handleResolveTicket = async (ticketId: string) => {
    await updateTicketStatus(ticketId, 'resolved');
  };

  const handleSendMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim()) return;

    const textPayload = msgText;
    setMsgText('');
    sendTypingStatus(false);

    await sendMessage(textPayload);
  };

  // Keyboard Typing states
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMsgText(e.target.value);
    sendTypingStatus(true);

    if (typingTimeout) clearTimeout(typingTimeout);

    const timeout = setTimeout(() => {
      sendTypingStatus(false);
    }, 1500);

    setTypingTimeout(timeout);
  };

  // Agent AI Smart Draft helper button!
  const handleAISuggestion = async () => {
    if (!activeConversation) return;
    setDraftPlaceholder('AI is drafting a responsive support reply...');
    
    try {
      // Fetch response
      const ticket = tickets.find(t => t.id === activeConversation.ticketId);
      const prevMsgs = messages.slice(-5).map(m => `${m.senderName}: ${m.text}`);
      
      const res = await fetch(`/api/conversations/${activeConversation.id}/ai-reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('support-token')}`
        }
      });
      const data = await res.json();
      if (res.ok && data.message) {
        // Set suggestion straight in the textarea so agent can review & send!
        setMsgText(data.message.text);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDraftPlaceholder('');
    }
  };

  // FILTER LOGICS
  const filteredTickets = tickets.filter(t => {
    // Search filter
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.customerName && t.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Status Filter
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;

    // Assignee filter
    let matchesAssignee = true;
    if (filterAssignee === 'me') {
      matchesAssignee = t.agentId === user!.id;
    } else if (filterAssignee === 'unassigned') {
      matchesAssignee = t.agentId === null;
    } else if (filterAssignee === 'others') {
      matchesAssignee = t.agentId !== null && t.agentId !== user!.id;
    }

    return matchesSearch && matchesStatus && matchesAssignee;
  });

  // Get current active customer details
  const getCustomerDetails = () => {
    if (!activeConversation) return null;
    return usersList.find(u => u.id === activeConversation.customerId);
  };

  const activeCustomer = getCustomerDetails();
  const activeTicket = activeConversation ? tickets.find(t => t.id === activeConversation.ticketId) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 relative">
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-24 right-8 z-50 flex items-center gap-2.5 rounded-xl bg-indigo-950 border border-indigo-500/30 p-3.5 text-xs font-bold text-white shadow-xl"
          >
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Header layout */}
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div id="tour-agent-title">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>Agent Inbox Workspace</span>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs text-indigo-700 font-bold dark:bg-indigo-950/40 dark:text-indigo-400">
              Live Queue
            </span>
          </h2>
          <p className="text-xs text-gray-400 dark:text-slate-400">
            Real-time chat channels with clients. Claim open tickets and coordinate resolutions.
          </p>
        </div>

        {/* Filters */}
        <div id="tour-agent-filters" className="flex flex-wrap items-center gap-2">
          {/* Status selector */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs focus:ring-1 focus:ring-sky-500 outline-none dark:border-slate-800 dark:bg-slate-900"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          {/* Assignee filter selector */}
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value as any)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs focus:ring-1 focus:ring-sky-500 outline-none dark:border-slate-800 dark:bg-slate-900 font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Assignments</option>
            {user?.role !== 'admin' && (
              <>
                <option value="me">Assigned to Me</option>
                <option value="others">Assigned to Others</option>
              </>
            )}
            <option value="unassigned">Unassigned Pool</option>
          </select>
        </div>
      </div>

      {/* Main 3-column Workspace Layout */}
      <div className="grid gap-6 xl:grid-cols-12 h-[600px] overflow-visible">
        {/* Left Column: Tickets Queue Panel (4 Col) */}
        <div id="tour-agent-queue" className="xl:col-span-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-850 dark:bg-[#0f172a] flex flex-col">
          <div className="relative mb-3.5">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversation text, clients..."
              className="w-full rounded-xl border border-gray-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs text-gray-900 outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 scrollbar-thin">
            {filteredTickets.length === 0 ? (
              <div className="my-auto py-12 text-center text-xs text-gray-400">
                No tickets match these queues.
              </div>
            ) : (
              filteredTickets.map((t) => {
                const linkedConv = conversations.find(c => c.ticketId === t.id);
                const isViewing = activeConversation?.ticketId === t.id;

                return (
                  <div
                    key={t.id}
                    onClick={() => linkedConv && selectConversation(linkedConv)}
                    className={`rounded-xl p-3.5 transition cursor-pointer border text-left ${
                      isViewing 
                        ? 'border-indigo-400 bg-indigo-50/25 dark:border-indigo-500 dark:bg-indigo-950/20' 
                        : 'border-gray-50 bg-slate-50/20 hover:border-gray-200 dark:border-slate-850 dark:bg-transparent dark:hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-600 dark:text-indigo-400 font-bold">
                        #{t.id}
                      </span>
                      <TicketStatusBadge priority={t.priority as any} />
                    </div>

                    <h4 className="font-bold text-xs text-gray-900 dark:text-white truncate">
                      {t.title}
                    </h4>
                    
                    <p className="text-[10px] text-gray-400 truncate mt-1">
                      From: {t.customerName}
                    </p>

                    <div className="mt-3 flex items-center justify-between border-t border-gray-100/50 pt-2 text-[9px] gap-2">
                      <TicketStatusBadge status={t.status as any} />
                      {t.agentId ? (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold ${
                          t.agentId === user!.id 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-400 border border-emerald-200/30' 
                            : 'bg-indigo-50 text-indigo-700 dark:bg-slate-800/80 dark:text-ky-400 border border-indigo-100/30'
                        }`}>
                          <span className={`h-1 w-1 rounded-full ${t.agentId === user!.id ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                          <span className="truncate max-w-[85px]" title={t.agentName || 'Assigned'}>
                            {t.agentId === user!.id ? 'Me' : (t.agentName || 'Agent')}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-black text-amber-700 dark:bg-amber-950/45 dark:text-amber-400 border border-amber-250/30">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <span>Unassigned</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center Column: Direct Message Interface (5 Col) */}
        <div id="tour-agent-chat-window" className="xl:col-span-5 rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-850 dark:bg-[#0f172a] overflow-hidden flex flex-col h-full">
          {activeConversation ? (
            <div className="flex-1 flex flex-col h-full">
              {/* Header card with claim selectors */}
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-850 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Active conversation chat</h3>
                  <p className="text-[9px] text-gray-400">Ref: #{activeConversation.id}</p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {activeTicket?.agentId !== user!.id ? (
                    <button
                      onClick={() => handleClaimTicket(activeConversation.ticketId)}
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[10px] font-bold text-white shadow"
                    >
                      Claim Ticket
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleReleaseTicket(activeConversation.ticketId)}
                        className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[10px] text-gray-600 dark:bg-slate-800 dark:border-slate-750 dark:text-slate-300"
                      >
                        Unclaim
                      </button>
                      <button
                        onClick={() => handleResolveTicket(activeConversation.ticketId)}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10px] font-bold text-white shadow"
                      >
                        Resolve
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5 bg-slate-50/10 dark:bg-transparent">
                {messages.map((m) => {
                  const isAgent = m.senderRole === 'agent' || m.senderId === 'ai_chatbot';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col max-w-[80%] ${isAgent ? 'self-end' : 'self-start'}`}
                    >
                      <div className={`p-2.5 text-xs rounded-xl ${
                        isAgent 
                          ? m.senderId === 'ai_chatbot'
                            ? 'bg-sky-50 dark:bg-sky-950/20 text-sky-850 dark:text-sky-300 border border-sky-400/20 rounded-br-none'
                            : 'bg-indigo-600 text-white rounded-br-none shadow' 
                          : 'bg-slate-100 text-gray-800 dark:bg-slate-800 dark:text-slate-200 rounded-bl-none border dark:border-slate-750'
                      }`}>
                        {m.senderRole === 'customer' && m.sentiment ? (
                          <div className="flex justify-between items-center gap-2 mb-1.5 pb-1 border-b border-gray-200/50 dark:border-slate-700/50 text-gray-400 dark:text-gray-500">
                            <span className="text-[8px] font-extrabold uppercase tracking-wide opacity-75">
                              {m.senderName}
                            </span>
                            {renderSentimentIcon(m.sentiment)}
                          </div>
                        ) : (
                          <div className="block text-[8px] font-extrabold uppercase tracking-wide opacity-75 mb-0.5">
                            {m.senderName}
                          </div>
                        )}
                        <div className="whitespace-pre-wrap">{m.text}</div>
                      </div>
                      <span className={`text-[8px] text-gray-400 mt-1 ${isAgent ? 'self-end' : 'self-start'}`}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}

                {Object.values(typingUsers).map((typed: any, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 self-start bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2 text-xs text-gray-400">
                    <span className="font-bold">{typed.userName} is typing</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" />
                  </div>
                ))}
                
                <div ref={chatMessagesEndRef} />
              </div>

              {/* Input section with AI drafting assist! */}
              <div className="p-3 border-t dark:border-slate-850 bg-white dark:bg-transparent flex flex-col gap-2">
                
                {/* Smart Canned Replies container */}
                <div className="rounded-xl border border-dashed border-indigo-150 bg-indigo-50/10 p-2.5 dark:border-slate-800 dark:bg-slate-900/20 flex flex-col gap-1.5 shadow-sm">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-indigo-700 dark:text-sky-400 flex items-center gap-1 uppercase tracking-wider font-sans">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      Smart Canned Replies Suggestions
                    </span>
                    <button 
                      type="button"
                      onClick={fetchSmartReplies}
                      disabled={fetchingReplies}
                      className="text-gray-400 hover:text-indigo-650 dark:hover:text-sky-400 flex items-center gap-1 disabled:opacity-50 font-bold cursor-pointer active:scale-95 transition"
                      title="Regenerate context-aware smart templates"
                    >
                      {fetchingReplies ? (
                        <span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border border-current border-t-transparent" />
                      ) : 'Refresh Suggestion'}
                    </button>
                  </div>
                  {smartReplies.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {smartReplies.map((reply, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setMsgText(reply.text);
                            setToastMsg(`Applied reply: "${reply.title}"`);
                            setTimeout(() => setToastMsg(null), 2500);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-white hover:bg-slate-50 text-[10.5px] px-2.5 py-1.5 font-medium text-slate-700 transition shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-850 cursor-pointer active:scale-95"
                          title={`Click to fill: "${reply.text}"`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="font-extrabold text-indigo-600 dark:text-sky-400">{reply.title}</span>
                          <span className="truncate max-w-[180px] text-gray-500 dark:text-slate-400 font-normal">{reply.text}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-gray-400 dark:text-slate-500 italic pb-0.5">
                      {fetchingReplies ? 'Analyzing conversation state and drafting templates...' : 'No current replies suggested. Click Refresh Suggestion above to load.'}
                    </div>
                  )}
                </div>

                {draftPlaceholder && (
                  <div className="text-[10px] text-indigo-600 animate-pulse font-mono">
                    {draftPlaceholder}
                  </div>
                )}

                <form onSubmit={handleSendMessageSubmit} className="flex gap-2 items-center">
                  <button
                    id="tour-agent-ai-draft-btn"
                    type="button"
                    onClick={handleAISuggestion}
                    className="rounded-xl p-2.5 text-indigo-600 hover:bg-slate-100 dark:text-sky-400 dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-800"
                    title="Generate professional response from conversation details using Gemini"
                  >
                    <Sparkles className="h-4 w-4 text-amber-500 animate-spin" />
                  </button>

                  {/* Browser Web Speech Dictation Feature */}
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`rounded-xl p-2.5 border transition duration-200 ${
                      isListening
                        ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse dark:bg-rose-950/30 dark:border-rose-940 dark:text-rose-450'
                        : 'text-gray-500 hover:bg-slate-100 border-gray-150 dark:border-slate-800 dark:hover:bg-slate-900 dark:text-slate-400'
                    }`}
                    title={isListening ? "Listening... click to stop recording" : "Dictate response (Voice-to-Text)"}
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4 text-rose-500" />
                    ) : (
                      <Mic className="h-4 w-4 text-indigo-500 dark:text-sky-400" />
                    )}
                  </button>

                  <input
                    type="text"
                    value={msgText}
                    onChange={handleInputChange}
                    placeholder="Draft message or trigger AI template suggest..."
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />

                  <button
                    type="submit"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow hover:opacity-95"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-400">
              <MessageSquare className="h-12 w-12 text-slate-300 mb-3" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">No Thread Selected</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                Select an active customer ticket queue on the left panel to begin corresponding.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Customer Card Metadata & Persistent internal notes (3 Col) */}
        <div id="tour-agent-metadata-card" className="xl:col-span-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-850 dark:bg-[#0f172a] flex flex-col h-full overflow-y-auto">
          {activeCustomer ? (
            <div className="flex flex-col gap-4 text-xs">
              <div className="text-center border-b pb-3">
                <img 
                  src={activeCustomer.avatar} 
                  alt={activeCustomer.name} 
                  referrerPolicy="no-referrer"
                  className="mx-auto h-16 w-16 rounded-full border-2 border-indigo-200 object-cover shadow"
                />
                <h4 className="font-black text-gray-900 dark:text-white mt-2 text-sm">{activeCustomer.name}</h4>
                <p className="text-[10px] text-gray-400 truncate">{activeCustomer.email}</p>
                <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  activeCustomer.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  Status: {activeCustomer.status}
                </span>
              </div>

              {/* Profile Fields */}
              <div className="flex flex-col gap-2 border-b pb-3">
                <div className="flex justify-between">
                  <span className="text-gray-400 block font-semibold text-[10px] uppercase">Corporate Account</span>
                  <span className="font-semibold text-gray-800 dark:text-slate-300">{activeCustomer.company || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 block font-semibold text-[10px] uppercase">Phone Line</span>
                  <span className="font-mono text-gray-800 dark:text-slate-300">{activeCustomer.phone || 'N/A'}</span>
                </div>
              </div>

              {/* Bios */}
              <div>
                <span className="text-gray-400 block font-semibold text-[10px] uppercase mb-1">Customer Biography</span>
                <p className="text-[11px] leading-relaxed text-gray-505 dark:text-slate-350">
                  {activeCustomer.bio || 'This user has not declared a biography file yet.'}
                </p>
              </div>

              {/* Custom Persisted Chronological Ticket Activity Log Widget */}
              {activeTicket && (
                <div className="mt-2 border-t pt-3">
                  <TicketActivityLog ticket={activeTicket} />
                </div>
              )}

              {/* Note Taking Widget */}
              <div className="mt-2 border-t pt-3 flex flex-col gap-2">
                <span className="text-gray-400 block font-semibold text-[10px] uppercase mb-1 flex items-center gap-1">
                  <NotebookPen className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Internal Agent Notes</span>
                </span>
                <textarea
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="Record credentials, account health, follow ups..."
                  rows={4}
                  className="w-full rounded-lg border border-gray-150 p-2 text-xs focus:ring-1 focus:ring-sky-500 opacity-90 dark:border-slate-800 dark:bg-slate-900 outline-none"
                />
                <button
                  onClick={handleSaveNote}
                  className="rounded-lg bg-gray-900 py-2.5 font-bold text-white hover:opacity-90 transition dark:bg-slate-800"
                >
                  Save Workspace Notes
                </button>
              </div>
            </div>
          ) : (
            <div className="my-auto text-center text-gray-400 text-xs py-12">
              Select a customer chat to display their profile metadata and internal agent notebook sheets.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default AgentDashboard;
