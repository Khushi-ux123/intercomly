import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bell, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  LogOut,
  ChevronDown,
  User, 
  HelpCircle,
  FileText,
  MessageCircle,
  FolderSync
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const SaaSHeader: React.FC = () => {
  const { 
    user, 
    activeView, 
    setView, 
    theme, 
    setTheme, 
    notifications, 
    markNotificationRead,
    logout,
    conversations,
    selectConversation,
    startTour,
    updatePresenceStatus
  } = useApp();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const unreadNotifs = notifications.filter(n => !n.isRead);

  const handleNotifClick = async (n: any) => {
    await markNotificationRead(n.id);
    setNotifOpen(false);
    
    if (n.conversationId) {
      const conv = conversations.find(c => c.id === n.conversationId);
      if (conv) {
        selectConversation(conv);
        setView('agent');
      }
    } else if (n.ticketId) {
      if (user.role === 'customer') {
        setView('customer');
      } else {
        setView('agent');
      }
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const getRoleColor = (role: string) => {
    if (role === 'admin') return 'text-red-500 bg-red-100 dark:bg-red-950 dark:text-red-400';
    if (role === 'agent') return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950 dark:text-indigo-400';
    return 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400';
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#e2e8f0] bg-white px-6 text-gray-800 shadow-sm dark:border-[#1e293b] dark:bg-[#0f172a] dark:text-white">
      {/* Mobile Menu Button + Title */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-slate-850 md:hidden"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <span className="text-sm font-semibold capitalize font-mono text-gray-500 dark:text-slate-400 md:block hidden">
          Dashboards / {activeView.replace('_', ' ')}
        </span>
      </div>

      {/* Action Buttons */}
      <div id="tour-header-actions" className="flex items-center gap-4">
        {/* Guided Tour Launcher */}
        <button
          onClick={startTour}
          className="rounded-xl p-2 md:p-2.5 text-indigo-600 hover:bg-indigo-50/50 dark:text-sky-400 dark:hover:bg-slate-900 transition-all duration-200 flex items-center gap-1 text-xs font-bold"
          title="Launch Guided Onboarding Walkthrough"
        >
          <HelpCircle className="h-5 w-5 animate-pulse text-indigo-500 dark:text-sky-400" />
          <span className="hidden leading-none sm:inline">Walkthrough</span>
        </button>

        {/* Toggle Theme button */}
        <button
          onClick={toggleTheme}
          className="rounded-xl p-2.5 text-gray-400 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-900 transition-all duration-200"
          title="Toggle UI colors"
        >
          {theme === 'light' ? <Moon className="h-5 w-5 text-indigo-600" /> : <Sun className="h-5 w-5 text-amber-400 animate-pulse" />}
        </button>

        {/* Real-time notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen(!notifOpen);
              setProfileOpen(false);
            }}
            className="relative rounded-xl p-2.5 text-gray-400 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-900 transition-all duration-200"
          >
            <Bell className="h-5 w-5" />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-450 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
            )}
          </button>

          {/* Unread Alerts Dropdown board */}
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-3 w-80 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl dark:border-[#1e293b] dark:bg-[#1e293b]"
              >
                <div className="mb-3 flex items-center justify-between border-b pb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Notifications</h3>
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600 font-bold dark:bg-red-950/40 dark:text-red-400">
                    {unreadNotifs.length} New
                  </span>
                </div>
                <div className="flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        className={`flex flex-col gap-1 rounded-xl p-2 text-left text-xs transition duration-150 ${
                          n.isRead 
                            ? 'hover:bg-gray-50 dark:hover:bg-slate-900 text-gray-500' 
                            : 'bg-sky-50/55 dark:bg-sky-950/20 text-gray-900 dark:text-slate-200 font-medium border-l-2 border-sky-500'
                        }`}
                      >
                        <span className="truncate leading-normal">{n.text}</span>
                        <span className="text-[9px] text-gray-400">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Avatar Trigger dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 rounded-xl p-1 hover:bg-gray-100 dark:hover:bg-[#1e293b] transition duration-200"
          >
            <img 
              src={user.avatar} 
              alt={user.name} 
              referrerPolicy="no-referrer"
              className="h-8 w-8 rounded-full object-cover border border-indigo-200"
            />
            <ChevronDown className="h-4 w-4 text-gray-400 md:block hidden" />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-3 w-56 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl dark:border-[#1e293b] dark:bg-[#1e293b]"
              >
                <div className="border-b px-4 py-3">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                </div>
                {/* Real-time Presence Selector (Only for agent or admin) */}
                {(user.role === 'agent' || user.role === 'admin') && (
                  <div className="border-b px-4 py-2.5 flex flex-col gap-1.5 bg-slate-50/50 dark:bg-slate-900/20">
                    <span className="text-[9px] font-black tracking-wider uppercase text-gray-400">My Presence State</span>
                    <div className="grid grid-cols-3 gap-1">
                      {(['online', 'away', 'busy'] as const).map(p => (
                        <button
                          key={p}
                          onClick={() => updatePresenceStatus(p)}
                          className={`rounded-lg py-1 text-[10px] font-black capitalize border transition duration-150 cursor-pointer ${
                            user.status === p
                              ? p === 'online' 
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                                : p === 'away'
                                  ? 'bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                                  : 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                              : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-white dark:hover:bg-slate-900'
                          }`}
                        >
                          <span className={user.status === p ? 'underline' : ''}>{p}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="p-1 flex flex-col gap-0.5">
                  <button
                    onClick={() => {
                      setView('settings');
                      setProfileOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs text-gray-600 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-900"
                  >
                    <User className="h-4 w-4 text-gray-400" />
                    My Account Settings
                  </button>
                  <button
                    onClick={() => {
                      setView('landing');
                      setProfileOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs text-gray-600 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-900"
                  >
                    <HelpCircle className="h-4 w-4 text-gray-400" />
                    Help & Docs Portal
                  </button>
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 border-t mt-1 rounded-lg px-3 py-2 text-left text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Navigation overlay drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute left-0 top-16 right-0 z-20 overflow-hidden border-b bg-white p-4 shadow-lg dark:bg-[#0f172a] block md:hidden"
          >
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { setView('landing'); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 rounded-xl p-3 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                <FolderSync className="h-4 w-4" /> Support Portal Home
              </button>
              
              {user.role === 'customer' && (
                <button
                  onClick={() => { setView('customer'); setMobileMenuOpen(false); }}
                  className="flex items-center gap-3 rounded-xl p-3 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  <FileText className="h-4 w-4" /> Submit & Manage Tickets
                </button>
              )}

              {user.role === 'agent' && (
                <button
                  onClick={() => { setView('agent'); setMobileMenuOpen(false); }}
                  className="flex items-center gap-3 rounded-xl p-3 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  <MessageCircle className="h-4 w-4" /> Agent Inbox Workspace
                </button>
              )}

              {user.role === 'admin' && (
                <>
                  <button
                    onClick={() => { setView('admin'); setMobileMenuOpen(false); }}
                    className="flex items-center gap-3 rounded-xl p-3 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    <FolderSync className="h-4 w-4" /> Operations Dashboard
                  </button>
                  <button
                    onClick={() => { setView('agent'); setMobileMenuOpen(false); }}
                    className="flex items-center gap-3 rounded-xl p-3 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    <MessageCircle className="h-4 w-4" /> Live Chats Inbox
                  </button>
                </>
              )}

              <button
                onClick={() => { setView('settings'); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 rounded-xl p-3 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                <ChevronDown className="h-4 w-4" /> My Profile Account
              </button>

              <button
                onClick={logout}
                className="flex items-center gap-3 rounded-xl p-3 text-sm font-semibold text-red-500 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" /> Sign Out of Platform
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
export default SaaSHeader;
