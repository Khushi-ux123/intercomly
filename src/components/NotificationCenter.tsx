import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useTickets } from '../context/TicketContext';
import { 
  Bell, 
  X, 
  MessageSquare, 
  UserPlus, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Volume2,
  VolumeX,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Message, Ticket } from '../types';

interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'ticket' | 'message' | 'alert';
  actionText?: string;
  onAction?: () => void;
  duration?: number;
}

export const NotificationCenter: React.FC = () => {
  const { 
    user, 
    socket, 
    conversations, 
    selectConversation, 
    setView,
    notifications,
    markNotificationRead,
    fetchNotifications
  } = useApp();

  const { tickets, fetchTickets } = useTickets();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Keep a ref of previously known assigned ticket IDs so we only alert on transition to us
  const knownAssignedTicketIds = useRef<Set<string>>(new Set());
  const initialSyncDone = useRef(false);

  // Initialize the known list when tickets load for the first time
  useEffect(() => {
    if (user && tickets.length > 0 && !initialSyncDone.current) {
      tickets.forEach(t => {
        if (t.agentId === user.id) {
          knownAssignedTicketIds.current.add(t.id);
        }
      });
      initialSyncDone.current = true;
    }
  }, [user, tickets, tickets.length]);

  // Audio notifier function (pleasant soft chimes)
  const playChime = (type: 'message' | 'ticket') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === 'message') {
        // Double soft synth blip
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);

        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain2.gain.setValueAtTime(0.08, audioCtx.currentTime + 0.1);
        osc2.start(audioCtx.currentTime + 0.1);
        osc2.stop(audioCtx.currentTime + 0.25);
      } else {
        // High ascending warm chime
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);

        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        gain2.gain.setValueAtTime(0.08, audioCtx.currentTime + 0.1);
        osc2.start(audioCtx.currentTime + 0.1);
        osc2.stop(audioCtx.currentTime + 0.2);

        const osc3 = audioCtx.createOscillator();
        const gain3 = audioCtx.createGain();
        osc3.connect(gain3);
        gain3.connect(audioCtx.destination);
        osc3.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
        gain3.gain.setValueAtTime(0.08, audioCtx.currentTime + 0.2);
        osc3.start(audioCtx.currentTime + 0.2);
        osc3.stop(audioCtx.currentTime + 0.4);
      }
    } catch (e) {
      // Browsers might block audio autoplay until active gesture, ignore
    }
  };

  const triggerToast = (toast: Omit<ToastItem, 'id'>) => {
    const id = 'toast_' + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
    
    // Auto clear after duration (default 5000ms)
    const duration = toast.duration || 5000;
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);

    // Play pleasant sound
    playChime(toast.type === 'message' ? 'message' : 'ticket');
  };

  // Watch for ticket changes to detect new assignments to the active logged-in user
  useEffect(() => {
    if (!user || user.role === 'customer' || tickets.length === 0) return;

    tickets.forEach(t => {
      if (t.agentId === user.id) {
        if (initialSyncDone.current && !knownAssignedTicketIds.current.has(t.id)) {
          // Toast reassignment alerts in real-time
          triggerToast({
            title: 'Ticket Assigned to You',
            message: `"${t.title.substring(0, 35)}${t.title.length > 35 ? '...' : ''}" is assigned to your queue.`,
            type: 'ticket',
            actionText: 'Open Workspace',
            onAction: () => {
              setView('agent');
            }
          });
        }
        knownAssignedTicketIds.current.add(t.id);
      } else {
        // If it was reassigned away, remove from our local reference
        knownAssignedTicketIds.current.delete(t.id);
      }
    });
  }, [tickets, user, setView]);

  // Listen for direct WebSocket messaging events in real-time
  useEffect(() => {
    if (!socket || !user || user.role === 'customer') return;

    const handleRealTimeMessage = (msg: Message) => {
      // Notify only when a customer sends a message to avoid notifying about agent comments
      if (msg.senderRole === 'customer') {
        const activeConvId = localStorage.getItem('intercomly-active-conv-id');
        
        if (activeConvId !== msg.conversationId) {
          triggerToast({
            title: `New Message from ${msg.senderName}`,
            message: msg.text.substring(0, 45) + (msg.text.length > 45 ? '...' : ''),
            type: 'message',
            actionText: 'Reply Now',
            onAction: () => {
              const conv = conversations.find(c => c.id === msg.conversationId);
              if (conv) {
                selectConversation(conv);
                setView('agent');
              }
            }
          });
        }
      }
    };

    socket.on('message:receive', handleRealTimeMessage);

    // Also trigger fetch list on any ticket alert
    const handleTicketNotified = () => {
      fetchTickets();
      fetchNotifications();
    };
    socket.on('ticket:notified', handleTicketNotified);

    return () => {
      socket.off('message:receive', handleRealTimeMessage);
      socket.off('ticket:notified', handleTicketNotified);
    };
  }, [socket, user, conversations, selectConversation, setView, fetchTickets, fetchNotifications]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Only display toaster if logged-in user is agent or admin
  if (!user || user.role === 'customer') return null;

  return (
    <>
      {/* Sound Preference Controller & Toast alerts queue overlay */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none min-w-[280px] max-w-sm">
        {/* Toast queue */}
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.92, transition: { duration: 0.2 } }}
              layout
              className="w-full pointer-events-auto rounded-xl border border-gray-100 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-[#0f172a] shadow-indigo-100/40 dark:shadow-none flex items-start gap-3 overflow-hidden group"
            >
              {/* Toast Left Accent Bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                t.type === 'message' ? 'bg-emerald-500' : 'bg-indigo-600'
              }`} />

              <div className="flex-1 pl-1 flex flex-col gap-1.5 text-left">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-black text-gray-950 dark:text-white uppercase tracking-wider">
                    {t.type === 'message' ? (
                      <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <UserPlus className="h-3.5 w-3.5 text-indigo-500" />
                    )}
                    <span>{t.title}</span>
                  </span>
                  
                  {/* Close icon */}
                  <button 
                    onClick={() => removeToast(t.id)}
                    className="rounded-lg p-0.5 text-gray-400 hover:bg-slate-50 hover:text-gray-6050 dark:hover:bg-slate-900 transition-all cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <p className="text-[11px] leading-relaxed text-gray-500 dark:text-slate-400">
                  {t.message}
                </p>

                {t.onAction && t.actionText && (
                  <button 
                    onClick={() => {
                      t.onAction?.();
                      removeToast(t.id);
                    }}
                    className="self-start text-[10px] font-black tracking-wider uppercase text-indigo-600 dark:text-sky-400 hover:underline transition-all mt-0.5 cursor-pointer"
                  >
                    {t.actionText} →
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Sound Toggle controls (pointer-events-auto is needed to let user click it) */}
        {toasts.length > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pointer-events-auto flex items-center justify-center gap-1 hover:bg-white bg-slate-50 border shadow-sm dark:bg-slate-900 dark:border-slate-800 text-[9px] font-black text-gray-500 dark:text-gray-400 px-2 py-1 rounded-full cursor-pointer uppercase tracking-wider"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute notification sounds" : "Unmute notification sounds"}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="h-3 w-3 text-indigo-500" />
                <span>Mute</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3 w-3 text-red-500" />
                <span>Muted</span>
              </>
            )}
          </motion.button>
        )}
      </div>
    </>
  );
};
