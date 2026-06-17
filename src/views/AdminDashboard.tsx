import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useTickets } from '../context/TicketContext';
import { WeeklyVolatilityChart, PriorityRadarChart } from '../components/CustomChart';
import { SlaTelemetryChart } from '../components/SlaTelemetryChart';
import { ResolutionTimeTrendChart } from '../components/ResolutionTimeTrendChart';
import { TicketStatusBadge } from '../components/TicketStatusBadge';
import { 
  Users, 
  Ticket, 
  CheckCircle, 
  Clock, 
  Smile, 
  BarChart3, 
  ShieldAlert, 
  Bot, 
  UserX, 
  TrendingUp, 
  UserCheck, 
  Award,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { ServiceMetrics } from '../types';

export const AdminDashboard: React.FC = () => {
  const { usersList, fetchUsers, fetchMetrics, setView, selectConversation, conversations, onlineUsers } = useApp();
  const { tickets, updateTicketStatus } = useTickets();
  const [metrics, setMetrics] = useState<ServiceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [ticketFilter, setTicketFilter] = useState<'all' | 'active' | 'resolved'>('all');

  const loadData = async () => {
    setLoading(true);
    await fetchUsers();
    const met = await fetchMetrics();
    if (met) setMetrics(met);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [tickets]);

  const handlePromoteToAgent = async (userId: string, currentRole: string) => {
    // Call endpoint or mock change
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('support-token')}`
        },
        body: JSON.stringify({ role: currentRole === 'customer' ? 'agent' : 'customer' })
      });
      if (res.ok) {
        setNotification('User system role promoted/toggled successfully!');
        setTimeout(() => setNotification(null), 3000);
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
        <span className="text-xs text-gray-400 font-medium">Aggregating SaaS Telemetry...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 relative">
      {notification && (
        <div className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-450">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header telemetry info */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>Operations Command Center</span>
            <span className="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800 uppercase dark:bg-sky-950 dark:text-sky-300">
              Admin Suite Mode
            </span>
          </h2>
          <p className="text-xs text-gray-400 dark:text-slate-400">
            Monitor real-time support throughput grids, active SLA response states, satisfaction scores, and agent loads.
          </p>
        </div>
        <button
          onClick={loadData}
          className="rounded-xl border border-gray-150 p-2.5 text-gray-400 hover:bg-white hover:text-gray-600 transition shadow-sm dark:border-slate-800"
          title="Force reload telemetry databases"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Grid of 4 beautiful statistics Bento Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-850 dark:bg-[#0f172a]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-950/20 dark:text-blue-400">
            <Ticket className="h-5 w-5" />
          </div>
          <div className="mt-4">
            <span className="text-xl font-black text-gray-950 dark:text-white font-mono">{metrics.totalTickets}</span>
            <span className="ml-1 text-[10px] font-bold text-emerald-500">+12%</span>
            <p className="text-[10.5px] text-gray-400 font-semibold mt-0.5">Total System Tickets</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-850 dark:bg-[#0f172a]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="mt-4">
            <span className="text-xl font-black text-gray-950 dark:text-white font-mono">{metrics.activeConversations}</span>
            <span className="ml-1 text-[10px] font-bold text-amber-500">Active</span>
            <p className="text-[10.5px] text-gray-400 font-semibold mt-0.5">Active Exchanges</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-850 dark:bg-[#0f172a]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 dark:bg-emerald-950/20 dark:text-emerald-400">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div className="mt-4">
            <span className="text-xl font-black text-gray-950 dark:text-white font-mono">{metrics.resolvedTickets}</span>
            <span className="ml-1 text-[10px] font-bold text-emerald-500">Closed</span>
            <p className="text-[10.5px] text-gray-400 font-semibold mt-0.5">Resolved SLA Targets</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-850 dark:bg-[#0f172a]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-500 dark:bg-pink-950/20 dark:text-pink-400">
            <Smile className="h-5 w-5" />
          </div>
          <div className="mt-4">
            <span className="text-xl font-black text-gray-950 dark:text-white font-mono">{metrics.customerSatisfactionScore}%</span>
            <span className="ml-1 text-[10px] font-bold text-emerald-500">Excellent</span>
            <p className="text-[10.5px] text-gray-400 font-semibold mt-0.5">CSAT Satisfaction Grade</p>
          </div>
        </div>
      </div>

      {/* Charts Dual Columns Layout */}
      <div className="mb-8 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 flex flex-col">
          <SlaTelemetryChart data={metrics.slaHourlyData} />
        </div>
        <div className="lg:col-span-4 flex flex-col">
          <PriorityRadarChart 
            low={metrics.ticketsByPriority.low} 
            medium={metrics.ticketsByPriority.medium} 
            high={metrics.ticketsByPriority.high} 
          />
        </div>
      </div>

      <div className="mb-8 grid gap-6 xl:grid-cols-2">
        <WeeklyVolatilityChart data={metrics.dailyResolutionData} />
        <ResolutionTimeTrendChart data={metrics.resolutionTimeTrend} />
      </div>

      {/* Global SLA Ticket Assignment Directory */}
      <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-[#0f172a]">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-sky-500" />
              <span>Global SLA Ticket Assignment Directory</span>
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Review entire workspace ticket backlogs. Reassign tickets instantly to online support representatives or administration accounts.
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 p-1 dark:bg-slate-900 border dark:border-slate-800">
            <button
              onClick={() => setTicketFilter('all')}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                ticketFilter === 'all'
                  ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-sky-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-350'
              }`}
            >
              All Backlog ({tickets.length})
            </button>
            <button
              onClick={() => setTicketFilter('active')}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                ticketFilter === 'active'
                  ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-sky-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-350'
              }`}
            >
              Active Queue ({tickets.filter(t => t.status !== 'resolved').length})
            </button>
            <button
              onClick={() => setTicketFilter('resolved')}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                ticketFilter === 'resolved'
                  ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-sky-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-350'
              }`}
            >
              Resolved ({tickets.filter(t => t.status === 'resolved').length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto text-[11px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 dark:border-slate-800 pb-2.5">
                <th className="py-3 font-bold">Ticket Details</th>
                <th className="py-3 font-bold">Status</th>
                <th className="py-3 font-bold">Priority</th>
                <th className="py-3 font-bold">Assigned Representative</th>
                <th className="py-3 font-bold">Pipeline Stage</th>
                <th className="py-3 font-bold text-right pr-4">Operations</th>
              </tr>
            </thead>
            <tbody>
              {tickets.filter(t => {
                if (ticketFilter === 'active') return t.status !== 'resolved';
                if (ticketFilter === 'resolved') return t.status === 'resolved';
                return true;
              }).map((t) => {
                const linkedConv = conversations.find(c => c.ticketId === t.id);
                const eligibleAssignees = usersList.filter(u => u.role === 'agent' || u.role === 'admin');

                return (
                  <tr key={t.id} className="border-b border-gray-50/50 dark:border-slate-850/50 hover:bg-slate-50/30 dark:hover:bg-slate-900/10">
                    <td className="py-3 font-medium text-gray-900 dark:text-white pr-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-[9px] text-sky-600 dark:text-sky-400 font-bold">#{t.id}</span>
                        <span className="font-bold line-clamp-1">{t.title}</span>
                        <span className="text-[10px] text-gray-400">Client: {t.customerName} ({t.customerEmail})</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <TicketStatusBadge status={t.status as any} />
                    </td>
                    <td className="py-3">
                      <TicketStatusBadge priority={t.priority as any} />
                    </td>
                    <td className="py-3">
                      <select
                        value={t.agentId || 'unassigned'}
                        onChange={(e) => {
                          const val = e.target.value === 'unassigned' ? null : e.target.value;
                          updateTicketStatus(t.id, t.status, val);
                          setNotification(`Ticket #${t.id} assignment updated successfully!`);
                          setTimeout(() => setNotification(null), 3000);
                        }}
                        className="rounded-lg border border-gray-205 bg-white px-2.5 py-1 text-xs focus:ring-1 focus:ring-sky-500 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-gray-300 font-medium"
                      >
                        <option value="unassigned">🚨 Unassigned Pool</option>
                        {eligibleAssignees.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.role === 'admin' ? 'Admin' : 'Agent'})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3">
                      <select
                        value={t.status}
                        onChange={(e) => {
                          updateTicketStatus(t.id, e.target.value as any, t.agentId);
                          setNotification(`Ticket #${t.id} phase updated to ${e.target.value}!`);
                          setTimeout(() => setNotification(null), 3000);
                        }}
                        className="rounded-lg border border-gray-205 bg-white px-2.5 py-1 text-xs focus:ring-1 focus:ring-sky-500 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-gray-300 font-medium"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                    <td className="py-3 text-right">
                      {linkedConv ? (
                        <button
                          onClick={() => {
                            selectConversation(linkedConv);
                            setView('agent');
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-750 text-[10px] font-bold px-3 py-1.5 transition dark:bg-sky-950/45 dark:text-sky-455 dark:hover:bg-sky-900/40 border border-sky-100/30 dark:border-sky-900/20 shadow-sm"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Respond & Chat</span>
                        </button>
                      ) : (
                        <span className="text-gray-400 italic text-[10px]">No Live Channel</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom management Grid: Users roster + Agent Performance board */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* User Roster Manager Table -- 7 Col */}
        <div className="lg:col-span-7 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-850 dark:bg-[#0f172a]">
          <h3 className="mb-4 font-bold text-sm text-gray-900 dark:text-white">
            System User & Agent Roster Directory ({usersList.length})
          </h3>

          <div className="overflow-x-auto text-[11px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 dark:border-slate-800 pb-2">
                  <th className="py-2.5 font-bold">User</th>
                  <th className="py-2.5 font-bold">Role Privilege</th>
                  <th className="py-2.5 font-bold">Account Status</th>
                  <th className="py-2.5 font-bold text-right-aligned">Action Controls</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50/50 dark:border-slate-850/50">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <img 
                          src={u.avatar} 
                          alt={u.name} 
                          referrerPolicy="no-referrer"
                          className="h-7 w-7 rounded-full object-cover border"
                        />
                        <div>
                          <span className="font-bold text-gray-900 dark:text-white block">{u.name}</span>
                          <span className="text-gray-450 text-[10px] block">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 capitalize">
                      <span className={`inline-block px-2 py-0.5 rounded font-bold text-[9px] ${
                        u.role === 'admin' ? 'bg-red-50 text-red-600 dark:bg-red-950/20' : u.role === 'agent' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20' : 'bg-gray-100 text-gray-600 dark:bg-slate-850 dark:text-slate-400'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3">
                      {(() => {
                        const userStatus = onlineUsers[u.id] || u.status || 'offline';
                        return (
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                              userStatus === 'online' ? 'bg-emerald-500 animate-pulse' :
                              userStatus === 'away' ? 'bg-amber-500' :
                              userStatus === 'busy' ? 'bg-rose-500' :
                              'bg-gray-400'
                            }`} />
                            <span className={`capitalize font-semibold text-[10px] ${
                              userStatus === 'online' ? 'text-emerald-600 dark:text-emerald-400' :
                              userStatus === 'away' ? 'text-amber-600 dark:text-amber-400' :
                              userStatus === 'busy' ? 'text-rose-650 dark:text-rose-400' :
                              'text-gray-400'
                            }`}>
                              {userStatus}
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-3 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handlePromoteToAgent(u.id, u.role)}
                          className="rounded-lg bg-slate-50 border px-3 py-1.5 text-[9px] font-bold text-gray-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
                        >
                          {u.role === 'customer' ? 'Promote Agent' : 'Demote Customer'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Agent performance Leaderboards -- 5 Col */}
        <div className="lg:col-span-5 rounded-2xl border border-gray-150 bg-white p-5 shadow-sm dark:border-slate-850 dark:bg-[#0f172a]">
          <h3 className="mb-4 font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
            <Award className="h-4 w-4 text-indigo-500" />
            <span>Agent Performance Scoreboard</span>
          </h3>

          <div className="flex flex-col gap-4">
            {metrics.agentPerformance.map((a) => (
              <div key={a.agentId} className="flex items-center justify-between rounded-xl bg-slate-50/50 p-3 text-xs dark:bg-slate-900/40">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-bold dark:bg-indigo-950/30 dark:text-indigo-400 text-[10px]">
                    ★
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{a.agentName}</h4>
                    <p className="text-[10px] text-gray-400">Avg Speed: {a.avgResponseMinutes} min</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-indigo-650 block text-[11px] font-mono">{a.resolvedCount} Resolved</span>
                  <span className="text-[10px] text-amber-500 font-bold">Rating: {a.rating}/5.0</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
