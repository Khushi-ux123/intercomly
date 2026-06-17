import React, { useState } from 'react';
import { Ticket, TicketActivity } from '../types';
import { useTickets } from '../context/TicketContext';
import { useApp } from '../context/AppContext';
import { 
  Clock, 
  User, 
  ArrowRight, 
  FilePlus, 
  RefreshCw, 
  UserRoundPen, 
  StickyNote, 
  Send,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TicketActivityLogProps {
  ticket: Ticket;
  maxEvents?: number;
}

export const TicketActivityLog: React.FC<TicketActivityLogProps> = ({ 
  ticket, 
  maxEvents = 100 
}) => {
  const { user } = useApp();
  const { addTicketActivityNote } = useTickets();
  const [noteInput, setNoteInput] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activities = ticket.activities || [];
  
  // Sort chronically: newest at the top for real-time trace
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const displayedActivities = sortedActivities.slice(0, maxEvents);

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim() || submittingNote) return;

    setSubmittingNote(true);
    try {
      await addTicketActivityNote(ticket.id, noteInput);
      setNoteInput('');
    } catch (err) {
      console.error('Failed to post timeline note:', err);
    } finally {
      setSubmittingNote(false);
    }
  };

  const getActivityIcon = (type: TicketActivity['type']) => {
    switch (type) {
      case 'creation':
        return <FilePlus className="h-3.5 w-3.5 text-blue-500" />;
      case 'status_change':
        return <RefreshCw className="h-3.5 w-3.5 text-amber-500" />;
      case 'reassignment':
        return <UserRoundPen className="h-3.5 w-3.5 text-purple-500" />;
      case 'note':
        return <StickyNote className="h-3.5 w-3.5 text-emerald-500" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-gray-500" />;
    }
  };

  const formatActivityTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' at ' + 
             d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-slate-50/50 p-4 shadow-sm dark:border-slate-850 dark:bg-slate-900/40">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 dark:border-slate-850">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-indigo-500" />
          <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">
            Audit Activity Log
          </h4>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-gray-500 dark:bg-slate-800 dark:text-gray-400">
            {activities.length}
          </span>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/50 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-350"
        >
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-3"
          >
            {/* Note submission text box */}
            <form onSubmit={handlePostNote} className="mb-4 flex gap-2">
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Write audit log note / diagnostic comment..."
                className="flex-grow rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[11px] text-gray-900 outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
              <button
                type="submit"
                disabled={!noteInput.trim() || submittingNote}
                className="flex items-center justify-center rounded-lg bg-indigo-650 px-2.5 text-white hover:bg-indigo-700 disabled:opacity-40 transition active:scale-95 duration-100 cursor-pointer"
                title="Post comment to log timeline"
              >
                {submittingNote ? (
                  <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
              </button>
            </form>

            {activities.length === 0 ? (
              <div className="py-6 text-center text-[10px] text-gray-400">
                No chronological activities registered yet.
              </div>
            ) : (
              <div className="relative mt-2 pl-4 border-l border-gray-200 dark:border-slate-800 flex flex-col gap-4">
                {displayedActivities.map((act, index) => (
                  <div key={act.id} className="relative group text-left">
                    {/* timeline node icon bullet */}
                    <div className="absolute -left-[25px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-850 shadow-sm z-10">
                      {getActivityIcon(act.type)}
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5">
                        <span className="text-[10px] font-bold text-gray-900 dark:text-slate-100">
                          {act.actorName}
                        </span>
                        <span className={`rounded-md px-1 py-0.2 text-[8px] font-bold uppercase ${
                          act.actorRole === 'admin' 
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/45 dark:text-rose-400' 
                            : act.actorRole === 'agent'
                              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/45 dark:text-indigo-400'
                              : 'bg-slate-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400'
                        }`}>
                          {act.actorRole}
                        </span>
                        <span className="text-[9px] text-gray-400 font-medium">
                          {formatActivityTime(act.createdAt)}
                        </span>
                      </div>

                      <p className="text-[10.5px] leading-relaxed text-gray-500 dark:text-slate-350">
                        {act.message}
                      </p>

                      {/* Diagnostic details for note activity logs */}
                      {act.type === 'note' && act.noteText && (
                        <div className="mt-1 rounded-lg border border-dashed border-emerald-100 bg-emerald-50/20 p-2 text-[10px] leading-relaxed text-slate-600 dark:border-emerald-950/40 dark:bg-emerald-950/10 dark:text-emerald-450">
                          <span className="block font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest text-[8px] mb-0.5">
                            Diagnostic Log:
                          </span>
                          <span className="whitespace-pre-wrap">{act.noteText}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
