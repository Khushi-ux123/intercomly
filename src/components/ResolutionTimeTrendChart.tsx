import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Legend,
  ReferenceLine
} from 'recharts';
import { 
  Clock, 
  Percent, 
  TrendingDown, 
  HelpCircle, 
  ShieldCheck, 
  Calendar,
  AlertTriangle,
  Download
} from 'lucide-react';

interface TrendItem {
  date: string;
  averageResolutionMinutes: number;
  slaThresholdMinutes: number;
  slaMetRatePercent: number;
}

interface ResolutionTimeTrendChartProps {
  data?: TrendItem[];
}

export const ResolutionTimeTrendChart: React.FC<ResolutionTimeTrendChartProps> = ({ data = [] }) => {
  const [selectedMetric, setSelectedMetric] = useState<'both' | 'speed' | 'compliance'>('both');

  // Fallback default mock data if not supplied
  const defaultData: TrendItem[] = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Seeded values to look realistic of a 30 day sequence
    const seed = (d.getDate() + d.getMonth()) % 15;
    const speed = 12.5 + Math.sin(i / 3) * 3 + (seed % 4);
    const compliance = Math.min(100, Math.max(80, 95 + Math.cos(i / 4) * 5 - (seed % 3)));
    
    return {
      date: label,
      averageResolutionMinutes: parseFloat(speed.toFixed(1)),
      slaThresholdMinutes: 15,
      slaMetRatePercent: parseFloat(compliance.toFixed(1))
    };
  });

  const chartData = data.length > 0 ? data : defaultData;

  const handleExportCSV = () => {
    const headers = ['Date', 'Average Resolution Time (Minutes)', 'SLA Target Limit (Minutes)', 'SLA Met Rate (%)'];
    const rows = chartData.map(item => [
      `"${item.date}"`,
      item.averageResolutionMinutes,
      item.slaThresholdMinutes,
      item.slaMetRatePercent
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `sla_performance_report_${today}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Compute stats summary
  const totalPoints = chartData.length;
  const avgSpeed = chartData.reduce((acc, curr) => acc + curr.averageResolutionMinutes, 0) / totalPoints;
  const avgCompliance = chartData.reduce((acc, curr) => acc + curr.slaMetRatePercent, 0) / totalPoints;
  const minCompliance = Math.min(...chartData.map(c => c.slaMetRatePercent));
  const maxSpeed = Math.max(...chartData.map(c => c.averageResolutionMinutes));

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-gray-150/80 bg-white/95 p-3.5 shadow-xl backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/95 text-[11px]">
          <div className="mb-2 flex items-center gap-1.5 border-b border-gray-105 dark:border-slate-800 pb-1.5">
            <Calendar className="h-3 w-3 text-indigo-500" />
            <span className="font-mono font-bold text-gray-500 dark:text-slate-400">{label}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {payload.map((entry: any, index: number) => {
              const isSpeed = entry.dataKey === 'averageResolutionMinutes';
              const name = isSpeed ? 'Average Resolution' : 'SLA Compliance Rate';
              const value = entry.value;
              const unit = isSpeed ? ' mins' : '%';
              const dotColor = isSpeed ? 'bg-indigo-500' : 'bg-emerald-500';

              return (
                <div key={index} className="flex items-center justify-between gap-5">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                    <span className="text-gray-600 dark:text-slate-400 font-medium">{name}</span>
                  </div>
                  <span className="font-mono font-black text-gray-900 dark:text-white">
                    {value}{unit}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-850 dark:bg-[#0f172a] h-full flex flex-col justify-between">
      {/* Header telemetry controller */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-500" />
            <span>Resolution & SLA Trend (Last 30 Days)</span>
          </h3>
          <p className="text-[11px] text-gray-400 dark:text-slate-450 mt-0.5">
            Analyzing service feedback loop velocity and SLA compliance indicators across a 30-day index.
          </p>
        </div>

        {/* Dynamic selectors and actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Dynamic selector buttons */}
          <div className="flex gap-1.5 rounded-xl bg-slate-50 p-1 dark:bg-slate-900 border dark:border-slate-850">
            <button
              onClick={() => setSelectedMetric('both')}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition cursor-pointer ${
                selectedMetric === 'both'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-sky-400'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              Dual View
            </button>
            <button
              onClick={() => setSelectedMetric('speed')}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition cursor-pointer ${
                selectedMetric === 'speed'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-sky-400'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              Resolution Speed
            </button>
            <button
              onClick={() => setSelectedMetric('compliance')}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition cursor-pointer ${
                selectedMetric === 'compliance'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-sky-400'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              Compliance SLA
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/45 dark:hover:bg-indigo-900/40 dark:text-sky-450 border border-indigo-100/20 dark:border-indigo-900/20 text-[10px] font-extrabold transition cursor-pointer active:scale-95 duration-100"
            title="Download full 30-day SLA metrics report as CSV"
          >
            <Download className="h-3.5 w-3.5 text-indigo-500 dark:text-sky-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* SLA Metrics Quick Cards Row */}
      <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/50 p-3.5 rounded-xl dark:bg-slate-900/30 border dark:border-slate-850/60">
        <div>
          <span className="text-[9px] uppercase tracking-wide font-extrabold text-gray-400 block">Avg Resolution Time</span>
          <span className="text-sm font-black text-indigo-600 dark:text-sky-400 font-mono mt-0.5 block">{avgSpeed.toFixed(1)} mins</span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wide font-extrabold text-gray-400 block">Avg Compliance Rate</span>
          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">{avgCompliance.toFixed(1)}%</span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wide font-extrabold text-gray-400 block">SLA Limit Target</span>
          <span className="text-sm font-black text-gray-500 dark:text-gray-450 font-mono mt-0.5 block">15.0 mins</span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wide font-extrabold text-gray-400 block">Lowest Compliance Point</span>
          <span className="text-xs font-black text-rose-500 font-mono mt-1 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 flex-shrink-0 animate-bounce" />
            <span>{minCompliance.toFixed(1)}%</span>
          </span>
        </div>
      </div>

      {/* Responsive chart render */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="trendSpeedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="trendComplianceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            <CartesianGrid 
              strokeDasharray="3 3" 
              className="stroke-gray-150 dark:stroke-slate-800/60"
              vertical={false} 
            />
            
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'monospace' }}
              tickLine={false} 
              axisLine={false}
              dy={8}
            />

            {/* Left Y Axis for Speed (Minutes) */}
            {(selectedMetric === 'both' || selectedMetric === 'speed') && (
              <YAxis 
                yAxisId="left"
                tick={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={false}
                domain={[0, (dataMax: number) => Math.ceil(dataMax + 3)]}
                label={{ 
                  value: 'Speed (Minutes)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fontSize: 8, fill: '#64748b', fontWeight: 'bold' } 
                }}
              />
            )}

            {/* Right Y Axis for SLA percent */}
            {(selectedMetric === 'both' || selectedMetric === 'compliance') && (
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={false}
                domain={[50, 100]}
                label={{ 
                  value: 'SLA Met Rate (%)', 
                  angle: 90, 
                  position: 'insideRight',
                  style: { fontSize: 8, fill: '#64748b', fontWeight: 'bold' } 
                }}
              />
            )}

            <Tooltip content={<CustomTooltip />} />
            
            {/* SLA Target reference limit line on left axis */}
            {(selectedMetric === 'both' || selectedMetric === 'speed') && (
              <ReferenceLine 
                yAxisId="left" 
                y={15} 
                stroke="#f43f5e" 
                strokeDasharray="4 4" 
                label={{
                  value: 'SLA Limit (15m)',
                  position: 'top',
                  fill: '#f43f5e',
                  fontSize: 8,
                  fontWeight: 'bold'
                }} 
              />
            )}

            {/* Render Speed Area */}
            {(selectedMetric === 'both' || selectedMetric === 'speed') && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="averageResolutionMinutes"
                name="Average Resolution Time"
                stroke="#4f46e5"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#trendSpeedGradient)"
              />
            )}

            {/* Render Compliance Line or Area */}
            {(selectedMetric === 'both' || selectedMetric === 'compliance') && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="slaMetRatePercent"
                name="SLA Compliance Rate"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 2, fill: '#10b981', strokeWidth: 1 }}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-slate-850 pt-3 text-[10px] text-gray-400">
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Operational Health: <strong className="text-gray-700 dark:text-slate-350">{avgCompliance >= 90 ? 'Healthy (SLA Met)' : 'Requires Attention'}</strong></span>
        </span>
        <span>Target Interval: Past 30 Days (Rolling)</span>
      </div>
    </div>
  );
};
