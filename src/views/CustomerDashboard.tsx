import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useTickets } from '../context/TicketContext';
import { TicketActivityLog } from '../components/TicketActivityLog';
import { TicketStatusBadge } from '../components/TicketStatusBadge';
import { 
  Plus, 
  MessageCircle, 
  Clock, 
  Send, 
  Image as ImageIcon, 
  FileText, 
  ChevronRight, 
  AlertCircle, 
  Sparkles,
  Paperclip,
  Check,
  CheckCheck,
  CheckCircle,
  HelpCircle,
  X,
  FileSpreadsheet,
  Trash,
  Smile,
  Meh,
  Frown
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

export const CustomerDashboard: React.FC = () => {
  const { 
    user, 
    conversations, 
    messages, 
    fetchConversations, 
    activeConversation, 
    selectConversation, 
    sendMessage,
    triggerAIChatbotReply,
    typingUsers,
    sendTypingStatus
  } = useApp();

  const {
    tickets,
    createTicket,
    fetchTickets
  } = useTickets();

  // Create ticket states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketPriority, setTicketPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Chat message submission states
  const [messageInput, setMessageInput] = useState('');
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Attachment states
  const [attachment, setAttachment] = useState<{ name: string; url: string; type: 'image' | 'file' } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Sync tickers on load
  useEffect(() => {
    fetchTickets();
    fetchConversations();
  }, []);

  // Scroll to bottom of chat thread when messages append
  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typingUsers]);

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle.trim() || !ticketDesc.trim()) return;

    try {
      await createTicket(ticketTitle, ticketDesc, ticketPriority);
      setTicketTitle('');
      setTicketDesc('');
      setTicketPriority('medium');
      setShowCreateForm(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() && !attachment) return;

    // Call state sendMessage
    const payloadText = messageInput;
    const mediaUrl = attachment?.url;
    const mediaType = attachment?.type;

    setMessageInput('');
    setAttachment(null);
    sendTypingStatus(false);

    await sendMessage(payloadText, mediaUrl, mediaType);
    
    // Auto-respond with InterBot if they write something pointing out AI assistance
    if (payloadText.toLowerCase().includes('bot') || payloadText.toLowerCase().includes('ai')) {
      setTimeout(() => {
        triggerAIChatbotReply();
      }, 1500);
    }
  };

  // Keyboard Typing Event Broadcaster
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    sendTypingStatus(true);

    if (typingTimeout) clearTimeout(typingTimeout);

    const timeout = setTimeout(() => {
      sendTypingStatus(false);
    }, 1500);

    setTypingTimeout(timeout);
  };

  // Drag and Drop File Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePickedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handlePickedFile(e.target.files[0]);
    }
  };

  const handlePickedFile = (file: File) => {
    const isImage = file.type.startsWith('image/');
    
    // Mock upload URL preview
    const dummyUrl = isImage 
      ? URL.createObjectURL(file) 
      : 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

    setAttachment({
      name: file.name,
      url: dummyUrl,
      type: isImage ? 'image' : 'file'
    });
  };

  const getPriorityBadge = (p: string) => {
    if (p === 'high') return 'text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-400 border border-red-250';
    if (p === 'medium') return 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-250';
    return 'text-sky-700 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-250';
  };

  const getStatusBadge = (s: string) => {
    if (s === 'open') return 'text-blue-700 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400';
    if (s === 'in_progress') return 'text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 animate-pulse';
    return 'text-gray-500 bg-gray-50 dark:bg-slate-900 dark:text-slate-400';
  };

  const activeTicket = activeConversation 
    ? tickets.find(t => t.id === activeConversation.ticketId) 
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      {/* Upper Welcomers Banner */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div id="tour-customer-title">
          <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
            Customer Care Center
          </h2>
          <p className="text-xs text-gray-400 dark:text-slate-400">
            Submit queries, manage tickets, and connect instantly with active desk agents.
          </p>
        </div>
        <button
          id="tour-submit-ticket-btn"
          onClick={() => setShowCreateForm(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-lg hover:opacity-95 transition"
        >
          <Plus className="h-4 w-4" /> Submit Support Ticket
        </button>
      </div>

      {/* Grid Layout containing lists of tickets and active conversation feeds */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Tickets and Creation form -- 5 Col */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Create ticket Form overlays */}
          <AnimatePresence>
            {showCreateForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden rounded-2xl border border-sky-100 bg-white p-5 shadow-lg dark:border-[#1e293b] dark:bg-[#1f2937]"
              >
                <div className="mb-4 flex items-center justify-between border-b pb-2">
                  <h3 className="font-bold text-sm text-gray-950 dark:text-white flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-sky-500" /> Specify Ticket Attributes
                  </h3>
                  <button 
                    onClick={() => setShowCreateForm(false)}
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateTicketSubmit} className="flex flex-col gap-3.5">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-slate-300">
                      Subject / Topic Title
                    </label>
                    <input
                      type="text"
                      required
                      value={ticketTitle}
                      onChange={(e) => setTicketTitle(e.target.value)}
                      placeholder="e.g. Broken connection during stripe invoice setup"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-slate-300">
                      Describe your problem in-depth
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={ticketDesc}
                      onChange={(e) => setTicketDesc(e.target.value)}
                      placeholder="e.g. Please provide details like browser client, API logs, error codes..."
                      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-slate-300">
                      Issue Severity Priority
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['low', 'medium', 'high'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setRole => setTicketPriority(p)}
                          className={`rounded-lg py-2.5 text-xs font-bold capitalize transition border ${
                            ticketPriority === p 
                              ? 'bg-sky-50 border-sky-400 text-sky-700 dark:bg-sky-950/40 dark:border-sky-450 dark:text-sky-300' 
                              : 'border-gray-200 hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-900 text-gray-400'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="mt-2 text-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 py-3 text-xs font-extrabold text-white shadow hover:opacity-90"
                  >
                    Submit Support Ticket
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tickets list card panel */}
          <div id="tour-tickets-list" className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-850 dark:bg-[#0f172a]">
            <h3 className="mb-4 font-bold text-sm text-gray-900 dark:text-white">
              My Support Pipelines ({tickets.length})
            </h3>

            {tickets.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
                <HelpCircle className="h-8 w-8 text-slate-350" />
                <span>You don't have any support tickets yet.</span>
                <span className="text-[10px] font-medium text-indigo-500">Submit one using the button above.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {tickets.map((t) => {
                  const linkedConv = conversations.find(c => c.ticketId === t.id);
                  const isViewing = activeConversation?.ticketId === t.id;

                  return (
                    <div
                      key={t.id}
                      onClick={() => linkedConv && selectConversation(linkedConv)}
                      className={`flex flex-col gap-2 rounded-xl p-4 transition-all duration-150 cursor-pointer border ${
                        isViewing 
                          ? 'border-indigo-400 bg-indigo-50/20 dark:border-indigo-500 dark:bg-indigo-950/20' 
                          : 'border-gray-100 hover:border-gray-200 dark:border-slate-850 dark:hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-xs text-gray-900 dark:text-white truncate">
                          {t.title}
                        </h4>
                        <TicketStatusBadge priority={t.priority as any} />
                      </div>
                      
                      <p className="truncate text-[11px] text-gray-400 leading-normal">
                        {t.description}
                      </p>

                      <div className="mt-2 flex items-center justify-between border-t pt-2 border-gray-50 dark:border-slate-850 text-[10px]">
                        <TicketStatusBadge status={t.status as any} />
                        
                        {linkedConv && (
                          <div className="flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">
                            <span>Open chat</span>
                            <ChevronRight className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

         {/* Right Column: Real-time Live support chat -- 7 Col */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {activeConversation ? (
            <>
              <div id="tour-chat-window-container" className="flex flex-col h-[520px] rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-850 dark:bg-[#0f172a] overflow-hidden">
              {/* Chat Header */}
              <div className="bg-slate-50 px-5 py-4 border-b dark:bg-slate-900 border-gray-100 dark:border-slate-850 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    <h3 className="font-bold text-xs text-gray-900 dark:text-white">
                      Desk Assistant: {activeConversation.agentName || 'On-Call Agent (Wait)'}
                    </h3>
                  </div>
                  <p className="text-[10px] text-gray-400 truncate mt-0.5 max-w-[280px]">
                    Ticket Ref: #{activeConversation.ticketId}
                  </p>
                </div>

                {/* Gemini AI Bot Trigger button */}
                <button
                  id="tour-ai-copilot-btn"
                  onClick={triggerAIChatbotReply}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 border border-sky-400/30 px-3.5 py-2 text-[10px] font-bold text-indigo-700 hover:opacity-95 dark:text-sky-300"
                  title="Ask InterBot AI to instantly resolve parameters of this chat"
                >
                  <Sparkles className="h-3.5 w-3.5 animate-pulse text-amber-500" />
                  <span>Ask AI Co-Pilot</span>
                </button>
              </div>

              {/* Chat Thread history */}
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3 bg-slate-50/30 dark:bg-transparent">
                {messages.length === 0 ? (
                  <div className="my-auto text-center text-xs text-gray-450 flex flex-col items-center gap-2">
                    <MessageCircle className="h-8 w-8 text-indigo-200 animate-spin" />
                    <span>Establishing live connection...</span>
                    <span className="text-[10px] text-gray-400">Say hi to get started!</span>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === user.id;
                    const isBot = m.senderId === 'ai_chatbot';

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col max-w-[75%] ${isMe ? 'self-end' : 'self-start'}`}
                      >
                        <div className={`p-3 text-xs leading-normal ${
                          isMe 
                            ? 'bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white rounded-2xl rounded-br-none shadow-sm' 
                            : isBot
                              ? 'bg-[#e0f2fe] dark:bg-[#0369a1]/30 border border-sky-200 dark:border-sky-850 text-gray-900 dark:text-slate-100 rounded-2xl rounded-bl-none'
                              : 'bg-slate-100 text-gray-800 dark:bg-[#1e293b] dark:text-slate-100 rounded-2xl rounded-bl-none border border-gray-100 dark:border-slate-850'
                        }`}>
                          {/* Sender label for other agents */}
                          {!isMe && (
                            <span className="block text-[8px] font-extrabold uppercase tracking-widest text-[#0e7490] dark:text-sky-400 mb-1">
                              {m.senderName}
                            </span>
                          )}

                          {m.senderRole === 'customer' && m.sentiment && (
                            <div className={`flex justify-between items-center gap-2 mb-1.5 pb-1 border-b ${
                              isMe 
                                ? 'border-white/10 text-white/60' 
                                : 'border-gray-200/50 dark:border-slate-800/50 text-gray-400 dark:text-gray-500'
                            }`}>
                              <span className="text-[8px] font-bold tracking-wide uppercase">Tone Analysis</span>
                              {renderSentimentIcon(m.sentiment)}
                            </div>
                          )}

                          {/* Message Content */}
                          <div className="whitespace-pre-wrap">{m.text}</div>

                          {/* Render Image Attachments */}
                          {m.mediaUrl && m.mediaType === 'image' && (
                            <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-750 bg-white">
                              <img 
                                src={m.mediaUrl} 
                                alt="Attachment" 
                                className="max-h-48 w-full object-cover" 
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}

                          {/* Render File/PDF Attachments */}
                          {m.mediaUrl && m.mediaType === 'file' && (
                            <div className="mt-2 flex items-center gap-2 rounded-lg bg-white/20 p-2 text-[10px] font-semibold text-inherit">
                              <FileText className="h-4 w-4" />
                              <span className="truncate max-w-[140px]">SupportDocAttachment.pdf</span>
                            </div>
                          )}
                        </div>

                        <div className={`flex items-center gap-1 text-[8px] text-gray-400 mt-1 ${isMe ? 'self-end' : 'self-start'}`}>
                          <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMe && (
                            <span>
                              {m.isRead ? <CheckCheck className="h-3 w-3 text-emerald-500" /> : <Check className="h-3 w-3 text-gray-300" />}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Real-time agent typing indicators */}
                {Object.values(typingUsers).map((typed: any, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 self-start bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2 text-xs text-gray-400">
                    <span className="font-bold">{typed.userName} is typing</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-450 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-450 animate-bounce" style={{ animationDelay: '150ms' }} />
                  </div>
                ))}

                <div ref={chatMessagesEndRef} />
              </div>

              {/* Chat Input form and drag-drop container */}
              <div
                id="tour-chat-input-area"
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-t p-4 dark:border-slate-850 bg-white dark:bg-[#0f172a] relative transition ${
                  dragActive ? 'bg-sky-50/50 dark:bg-sky-950/20 border-dashed border-sky-400' : ''
                }`}
              >
                {/* Upload attachment thumbnail info if loaded */}
                {attachment && (
                  <div className="mb-2 flex items-center justify-between rounded-xl bg-gray-50/80 p-2.5 text-xs text-gray-700 border dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      {attachment.type === 'image' ? <ImageIcon className="h-4 w-4 text-sky-500" /> : <FileText className="h-4 w-4 text-indigo-500" />}
                      <span className="truncate max-w-[200px]">{attachment.name}</span>
                    </div>
                    <button 
                      onClick={() => setAttachment(null)}
                      className="rounded hover:bg-slate-200 p-0.5 text-red-500"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex gap-2.5 items-center">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl p-2.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-slate-400 dark:hover:bg-slate-900"
                      title="Attach documents or photos"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileInput} 
                      className="hidden" 
                      accept="image/*,.pdf,.doc,.docx"
                    />
                  </div>

                  <input
                    type="text"
                    value={messageInput}
                    onChange={handleInputChange}
                    placeholder={dragActive ? "Drop file to attach..." : "Send a message to agent..."}
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />

                  <button
                    type="submit"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow hover:opacity-95"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>

                {/* Info Tip banner */}
                <div className="mt-2 text-center text-[9px] text-gray-400 font-medium">
                  Tip: Type "bot" or "ai" or click "Ask AI Co-Pilot" for real-time Gemini solutions.
                </div>
              </div> {/* Closes tour-chat-input-area */}
            </div> {/* Closes tour-chat-window-container */}

            {activeTicket && <TicketActivityLog ticket={activeTicket} />}
          </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[520px] rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#0f172a]">
              <MessageCircle className="h-12 w-12 text-slate-350 mb-3 animate-bounce" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Select Conversation Channel</h3>
              <p className="mt-1 text-xs text-gray-400 max-w-sm leading-normal">
                Click on one of your submit tickets on the left panel to establish a secure, real-time desk chat thread with Michael Chen or Emma Watson immediately.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default CustomerDashboard;
