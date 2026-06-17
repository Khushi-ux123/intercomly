import React from 'react';
import { useApp } from '../context/AppContext';
import { useTickets } from '../context/TicketContext';
import { 
  MessageSquare, 
  Ticket, 
  BarChart3, 
  Users, 
  Settings, 
  LogOut, 
  Compass, 
  HelpCircle,
  Sparkles,
  Layers,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';

export const Sidebar: React.FC = () => {
  const { user, activeView, setView, logout, conversations } = useApp();
  const { tickets } = useTickets();

  if (!user) return null;

  const unreadMessagesCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const openTicketsCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;

  const getMenuItems = () => {
    switch (user.role) {
      case 'customer':
        return [
          { id: 'landing', label: 'Home Portal', icon: Compass, view: 'landing' as const },
          { id: 'customer_dashboard', label: 'My Tickets', icon: Ticket, view: 'customer' as const, badge: openTicketsCount > 0 ? openTicketsCount : undefined },
          { id: 'settings', label: 'My Profile', icon: Settings, view: 'settings' as const },
        ];
      case 'agent':
        return [
          { id: 'landing', label: 'Home Portal', icon: Compass, view: 'landing' as const },
          { id: 'agent_dashboard', label: 'Inbox Queue', icon: MessageSquare, view: 'agent' as const, badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
          { id: 'settings', label: 'Agent Workspace', icon: Settings, view: 'settings' as const },
        ];
      case 'admin':
        return [
          { id: 'landing', label: 'Home Portal', icon: Compass, view: 'landing' as const },
          { id: 'admin_dashboard', label: 'Analytics Hub', icon: BarChart3, view: 'admin' as const },
          { id: 'agent_dashboard', label: 'Agent View', icon: MessageSquare, view: 'agent' as const, badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
          { id: 'settings', label: 'System Settings', icon: Settings, view: 'settings' as const },
        ];
      default:
        return [];
    }
  };

  const navItems = getMenuItems();

  return (
    <div className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-[#e2e8f0] bg-white text-gray-800 flex-col justify-between dark:border-[#1e293b] dark:bg-[#0f172a] dark:text-gray-100 md:flex">
      {/* Upper Section */}
      <div className="mt-4 flex flex-col gap-6 px-4">
        {/* Brand Header */}
        <div id="tour-brand" className="flex items-center gap-2 px-3 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-200 dark:shadow-none">
            <Layers className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
              Intercomly
            </h1>
            <p className="text-[10px] font-semibold text-sky-600 tracking-wider uppercase font-mono">
              Support Cloud
            </p>
          </div>
        </div>

        {/* User Mini Card */}
        <div id="tour-user-card" className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 dark:border-[#1e293b] dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={user.avatar} 
                alt={user.name} 
                referrerPolicy="no-referrer"
                className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm dark:border-slate-800"
              />
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-slate-800" />
            </div>
            <div className="flex-1 overflow-hidden">
              <h2 className="truncate text-xs font-semibold text-gray-900 dark:text-white">
                {user.name}
              </h2>
              <div className="flex items-center gap-1">
                <span className="inline-block rounded-full bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700 capitalize tracking-wide dark:bg-indigo-950/40 dark:text-indigo-400">
                  {user.role}
                </span>
                <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-slate-700" />
                <span className="text-[9px] font-mono text-gray-400">Suite</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Navigation */}
        <nav className="flex flex-col gap-1.5 font-sans">
          {navItems.map((item) => {
            const isSelected = activeView === item.view;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                id={`tour-nav-${item.id}`}
                onClick={() => setView(item.view)}
                className={`group relative flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isSelected 
                    ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
                }`}
              >
                {/* Active Highlight Bar */}
                {isSelected && (
                  <motion.div 
                    layoutId="activeSideBarMarker"
                    className="absolute left-0 top-1/4 h-1/2 w-1 rounded-r-full bg-sky-600 dark:bg-sky-400"
                  />
                )}

                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 transition-transform duration-200 group-hover:scale-110 ${
                    isSelected ? 'text-sky-600 dark:text-sky-400' : 'text-gray-400 group-hover:text-gray-700 dark:text-slate-500 dark:group-hover:text-slate-300'
                  }`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-200 px-1 text-[10px] font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Downer Section */}
      <div className="flex flex-col gap-3 p-4">
        {/* Log Out Option */}
        <button
          onClick={logout}
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-950/20"
        >
          <LogOut className="h-4 w-4" />
          <span>Exit Workspace</span>
        </button>
      </div>
    </div>
  );
};
export default Sidebar;
