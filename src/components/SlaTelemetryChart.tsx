import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Clock, BarChart3, ShieldCheck, Activity, ChevronDown } from 'lucide-react';

interface SlaTelemetryChartProps {
  data?: Array<{
    hour: string;
    avgResponseMinutes: number;
    throughput: number;
    slaMetRate: number;
  }>;
}

type ViewMode = 'response_time' | 'throughput' | 'sla_rate';
type TimeRange = '24h' | '7d' | '30d';

export const SlaTelemetryChart: React.FC<SlaTelemetryChartProps> = ({ data = [] }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('response_time');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');

  // 1. Last 24 Hours Data
  const last24hData = data.length > 0 ? data : [
    { hour: '12 AM', avgResponseMinutes: 12.5, throughput: 3, slaMetRate: 94 },
    { hour: '02 AM', avgResponseMinutes: 14.1, throughput: 1, slaMetRate: 91 },
    { hour: '04 AM', avgResponseMinutes: 15.0, throughput: 2, slaMetRate: 90 },
    { hour: '06 AM', avgResponseMinutes: 11.2, throughput: 4, slaMetRate: 96 },
    { hour: '08 AM', avgResponseMinutes: 9.5, throughput: 8, slaMetRate: 98 },
    { hour: '10 AM', avgResponseMinutes: 8.2, throughput: 12, slaMetRate: 99 },
    { hour: '12 PM', avgResponseMinutes: 10.4, throughput: 15, slaMetRate: 95 },
    { hour: '02 PM', avgResponseMinutes: 11.0, throughput: 14, slaMetRate: 94 },
    { hour: '04 PM', avgResponseMinutes: 9.1, throughput: 18, slaMetRate: 97 },
    { hour: '06 PM', avgResponseMinutes: 8.5, throughput: 11, slaMetRate: 98 },
    { hour: '08 PM', avgResponseMinutes: 10.2, throughput: 7, slaMetRate: 95 },
    { hour: '10 PM', avgResponseMinutes: 12.0, throughput: 5, slaMetRate: 93 },
  ];

  // 2. Last 7 Days Data (Daily)
  const last7dData = [
    { hour: 'Mon', avgResponseMinutes: 10.2, throughput: 64, slaMetRate: 96 },
    { hour: 'Tue', avgResponseMinutes: 9.5, throughput: 78, slaMetRate: 98 },
    { hour: 'Wed', avgResponseMinutes: 11.1, throughput: 85, slaMetRate: 94 },
    { hour: 'Thu', avgResponseMinutes: 8.8, throughput: 92, slaMetRate: 99 },
    { hour: 'Fri', avgResponseMinutes: 12.4, throughput: 110, slaMetRate: 91 },
    { hour: 'Sat', avgResponseMinutes: 14.0, throughput: 42, slaMetRate: 90 },
    { hour: 'Sun', avgResponseMinutes: 10.5, throughput: 35, slaMetRate: 95 },
  ];

  // 3. Last 30 Days Data (15 double-day snapshot points for optimal layout rendering smoothness)
  const last30dData = Array.from({ length: 15 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (14 - i) * 2);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const responseArr = [11.2, 10.5, 9.8, 12.1, 13.0, 10.2, 8.9, 9.1, 10.4, 11.5, 9.0, 8.2, 9.5, 11.0, 10.1];
    const throughputArr = [180, 220, 250, 190, 150, 240, 320, 280, 210, 170, 350, 410, 300, 240, 280];
    const slaArr = [94.5, 96.0, 98.2, 93.4, 91.0, 95.5, 99.1, 98.0, 95.2, 93.8, 97.4, 99.2, 96.5, 94.1, 95.8];
    return {
      hour: label,
      avgResponseMinutes: responseArr[i % responseArr.length],
      throughput: throughputArr[i % throughputArr.length],
      slaMetRate: slaArr[i % slaArr.length]
    };
  });

  // Assign appropriate dataset based on selection
  const chartData = timeRange === '24h' 
    ? last24hData 
    : timeRange === '7d' 
      ? last7dData 
      : last30dData;

  // Calculate current summary metrics for display cards helper
  const avgResponse = chartData.reduce((acc, curr) => acc + curr.avgResponseMinutes, 0) / chartData.length;
  const totalThroughput = chartData.reduce((acc, curr) => acc + curr.throughput, 0);
  const avgSlaRate = chartData.reduce((acc, curr) => acc + curr.slaMetRate, 0) / chartData.length;

  // Custom tooltip styling helper
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      let labelText = '';
      let unit = '';
      let badgeColor = '';

      if (viewMode === 'response_time') {
        labelText = 'Avg Response:';
        unit = ' min';
        badgeColor = 'bg-rose-500';
      } else if (viewMode === 'throughput') {
        labelText = 'Tickets Handled:';
        unit = ' tickets';
        badgeColor = 'bg-indigo-500';
      } else {
        labelText = 'SLA Met Rate:';
        unit = '%';
        badgeColor = 'bg-emerald-500';
      }

      // Determine appropriate range tag prefix
      const rangeTag = timeRange === '24h' ? 'Hour' : timeRange === '7d' ? 'Day' : 'Date';

      return (
        <div className="rounded-xl border border-gray-150/80 bg-white/95 p-3.5 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex items-center gap-2 mb-1.5 border-b border-gray-100 dark:border-slate-800 pb-1">
            <span className={`h-2 w-2 rounded-full ${badgeColor}`} />
            <p className="text-[10px] font-mono font-bold text-gray-400 dark:text-slate-500 uppercase">{rangeTag}: {label}</p>
          </div>
          <p className="text-xs font-bold text-gray-950 dark:text-white flex items-baseline gap-1">
            <span className="text-gray-550 dark:text-slate-400 font-medium">{labelText}</span>
            <span className="text-sm font-black font-mono">{val}</span>
            <span className="text-[10px] font-medium">{unit}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="sla-telemetry-container" className="w-full rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-850 dark:bg-[#0f172a] h-full flex flex-col justify-between">
      {/* Header section with toggle controls */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
            <span>SLA Resolution Telemetry ({timeRange === '24h' ? 'Last 24h' : timeRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'})</span>
          </h3>
          <p className="text-[11px] text-gray-400 dark:text-slate-450 mt-0.5">
            Real-time tracking of operational target completions, speed-to-solution matrices, and workloads.
          </p>
        </div>

        {/* Filters and Metric Switches */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
          {/* Dropdown Range Filter */}
          <div className="relative">
            <select
              id="sla-time-range-select"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="appearance-none rounded-xl border border-gray-200 bg-slate-50 py-1.5 pl-3 pr-8 text-[11px] font-bold text-gray-700 outline-none transition-all duration-205 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-850 cursor-pointer pr-9"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400 dark:text-slate-550">
              <ChevronDown className="h-3 w-3" />
            </div>
          </div>

          {/* Dynamic interactive metric buttons */}
          <div id="sla-metric-toggle-group" className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900/60">
            <button
              id="toggle-btn-response-time"
              onClick={() => setViewMode('response_time')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-all duration-200 ${
                viewMode === 'response_time'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-slate-800 dark:text-white'
                  : 'text-gray-400 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="h-3 w-3" />
              <span>Response Speed</span>
            </button>
            
            <button
              id="toggle-btn-throughput"
              onClick={() => setViewMode('throughput')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-all duration-200 ${
                viewMode === 'throughput'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-slate-800 dark:text-white'
                  : 'text-gray-400 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <BarChart3 className="h-3 w-3" />
              <span>Throughput</span>
            </button>

            <button
              id="toggle-btn-sla-rate"
              onClick={() => setViewMode('sla_rate')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-all duration-200 ${
                viewMode === 'sla_rate'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-slate-800 dark:text-white'
                  : 'text-gray-400 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="h-3 w-3" />
              <span>SLA Met %</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats overview row */}
      <div className="grid grid-cols-3 gap-3 mb-5 border-b border-gray-100/50 pb-4 dark:border-slate-850/50">
        <div className="rounded-xl bg-slate-50/50 p-2 text-center dark:bg-slate-900/20">
          <span className="block text-[10px] font-semibold text-gray-400 dark:text-slate-450">Avg Speed</span>
          <span className="block text-sm font-black text-rose-550 dark:text-rose-455 font-mono mt-0.5">
            {avgResponse.toFixed(1)}m
          </span>
        </div>
        <div className="rounded-xl bg-slate-50/50 p-2 text-center dark:bg-slate-900/20">
          <span className="block text-[10px] font-semibold text-gray-400 dark:text-slate-450">Total Vol Handled</span>
          <span className="block text-sm font-black text-indigo-550 dark:text-indigo-455 font-mono mt-0.5">
            {totalThroughput}
          </span>
        </div>
        <div className="rounded-xl bg-slate-50/50 p-2 text-center dark:bg-[#0f172a]/20">
          <span className="block text-[10px] font-semibold text-gray-400 dark:text-slate-450">SLA Achievement</span>
          <span className="block text-sm font-black text-emerald-555 dark:text-emerald-455 font-mono mt-0.5">
            {avgSlaRate.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* The main Recharts canvas rendering */}
      <div className="h-56 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'throughput' ? (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
              <XAxis 
                dataKey="hour" 
                tick={{ fontSize: 9, fill: '#64748b' }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} />
              <Bar 
                dataKey="throughput" 
                fill="#6366f1" 
                radius={[4, 4, 0, 0]}
                maxBarSize={timeRange === '30d' ? 14 : 24}
              />
            </BarChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
              <defs>
                <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorSla" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
              <XAxis 
                dataKey="hour" 
                tick={{ fontSize: 8.5, fill: '#64748b' }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} 
                axisLine={false}
                tickLine={false}
                domain={viewMode === 'sla_rate' ? [80, 100] : [0, 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              {viewMode === 'response_time' ? (
                <Area 
                  type="monotone" 
                  dataKey="avgResponseMinutes" 
                  stroke="#f43f5e" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorResponse)" 
                />
              ) : (
                <Area 
                  type="monotone" 
                  dataKey="slaMetRate" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorSla)" 
                />
              )}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
export default SlaTelemetryChart;
