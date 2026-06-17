import React from 'react';

interface LineChartProps {
  data: Array<{ date: string; resolved: number; created: number }>;
}

export const WeeklyVolatilityChart: React.FC<LineChartProps> = ({ data }) => {
  const maxVal = Math.max(...data.map(d => Math.max(d.resolved, d.created)), 10);
  
  // Chart dimensions
  const width = 500;
  const height = 180;
  const padding = 25;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Calculate coordinates
  const getCoordinates = (key: 'resolved' | 'created') => {
    return data.map((d, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - (d[key] / maxVal) * chartHeight;
      return { x, y };
    });
  };

  const resolvedPoints = getCoordinates('resolved');
  const createdPoints = getCoordinates('created');

  const createPathD = (points: Array<{ x: number; y: number }>) => {
    return points.reduce((acc, p, index) => {
      return index === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');
  };

  const createAreaPathD = (points: Array<{ x: number; y: number }>) => {
    if (points.length === 0) return '';
    const start = points[0];
    const end = points[points.length - 1];
    const linePath = createPathD(points);
    return `${linePath} L ${end.x} ${padding + chartHeight} L ${start.x} ${padding + chartHeight} Z`;
  };

  return (
    <div className="w-full rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#1e293b] dark:bg-[#1e293b]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Ticket Volume & Throughput</h3>
          <p className="text-[11px] text-gray-400">Weekly ticket submission vs. resolution rates</p>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-gray-600 dark:text-slate-350">Resolved</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            <span className="text-gray-600 dark:text-slate-350">Created</span>
          </div>
        </div>
      </div>

      <div className="relative h-48 w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id="resolvedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padding + ratio * chartHeight;
            const value = Math.round(maxVal - ratio * maxVal);
            return (
              <g key={idx} className="opacity-40">
                <line 
                  x1={padding} 
                  y1={y} 
                  x2={width - padding} 
                  y2={y} 
                  stroke="#e2e8f0" 
                  strokeDasharray="4,4" 
                  className="stroke-gray-200 dark:stroke-slate-800"
                />
                <text 
                  x={padding - 8} 
                  y={y + 4} 
                  textAnchor="end" 
                  className="fill-gray-400 text-[9px] font-mono"
                >
                  {value}
                </text>
              </g>
            );
          })}

          {/* Paths and Areas */}
          <path d={createAreaPathD(resolvedPoints)} fill="url(#resolvedGradient)" />
          <path d={createAreaPathD(createdPoints)} fill="url(#createdGradient)" />

          <path 
            d={createPathD(resolvedPoints)} 
            fill="none" 
            stroke="#10b981" 
            strokeWidth="3" 
            strokeLinecap="round"
          />
          <path 
            d={createPathD(createdPoints)} 
            fill="none" 
            stroke="#0ea5e9" 
            strokeWidth="3" 
            strokeLinecap="round"
          />

          {/* Coordinates and Circles of Data Points */}
          {resolvedPoints.map((p, idx) => (
            <circle 
              key={`r-${idx}`} 
              cx={p.x} 
              cy={p.y} 
              r="4" 
              fill="#ffffff" 
              stroke="#10b981" 
              strokeWidth="2.5" 
              className="cursor-pointer transition duration-150 hover:r-6" 
            />
          ))}
          {createdPoints.map((p, idx) => (
            <circle 
              key={`c-${idx}`} 
              cx={p.x} 
              cy={p.y} 
              r="4" 
              fill="#ffffff" 
              stroke="#0ea5e9" 
              strokeWidth="2.5" 
              className="cursor-pointer transition duration-150 hover:r-6" 
            />
          ))}

          {/* Bottom Labels */}
          {data.map((d, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            return (
              <text 
                key={index} 
                x={x} 
                y={height - 2} 
                textAnchor="middle" 
                className="fill-gray-400 text-[10px] font-medium"
              >
                {d.date}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

interface BreakdownProps {
  low: number;
  medium: number;
  high: number;
}

export const PriorityRadarChart: React.FC<BreakdownProps> = ({ low, medium, high }) => {
  const total = low + medium + high || 1;
  const pLow = (low / total) * 100;
  const pMedium = (medium / total) * 100;
  const pHigh = (high / total) * 100;

  return (
    <div className="w-full rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#1e293b] dark:bg-[#1e293b]">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Priority Distribution</h3>
      <p className="mb-4 text-[11px] text-gray-400">Total active unresolved tickes ratio</p>

      <div className="flex flex-col gap-3">
        {/* Progress High Row */}
        <div>
          <div className="mb-1 flex items-center justify-between text-xs font-semibold">
            <span className="text-red-500">Urgent High</span>
            <span className="text-gray-500 dark:text-gray-400">{high} tickets ({Math.round(pHigh)}%)</span>
          </div>
          <div className="h-2 w-full rounded-full bg-red-100 dark:bg-red-950/40">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-600 transition-all duration-500" 
              style={{ width: `${pHigh || 2}%` }} 
            />
          </div>
        </div>

        {/* Progress Medium Row */}
        <div>
          <div className="mb-1 flex items-center justify-between text-xs font-semibold">
            <span className="text-amber-500">Normal Medium</span>
            <span className="text-gray-500 dark:text-gray-400">{medium} tickets ({Math.round(pMedium)}%)</span>
          </div>
          <div className="h-2 w-full rounded-full bg-amber-100 dark:bg-amber-950/40">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 transition-all duration-500" 
              style={{ width: `${pMedium || 2}%` }} 
            />
          </div>
        </div>

        {/* Progress Low Row */}
        <div>
          <div className="mb-1 flex items-center justify-between text-xs font-semibold">
            <span className="text-sky-500">Scheduled Low</span>
            <span className="text-gray-500 dark:text-gray-400">{low} tickets ({Math.round(pLow)}%)</span>
          </div>
          <div className="h-2 w-full rounded-full bg-sky-100 dark:bg-sky-950/40">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500" 
              style={{ width: `${pLow || 2}%` }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};
