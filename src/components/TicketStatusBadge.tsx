import React from 'react';
import { 
  ArrowDown, 
  ArrowUp, 
  AlertTriangle, 
  Activity,
  FolderOpen,
  Clock,
  CheckCircle2,
  Lock,
  RefreshCw
} from 'lucide-react';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed';

interface TicketStatusBadgeProps {
  priority?: TicketPriority;
  status?: TicketStatus;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  id?: string;
}

export const TicketStatusBadge: React.FC<TicketStatusBadgeProps> = ({
  priority,
  status,
  size = 'xs',
  className = '',
  id
}) => {
  // Common sizes
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[9px] gap-1',
    sm: 'px-2.5 py-1 text-[10px] gap-1.2',
    md: 'px-3 py-1.5 text-[11px] gap-1.5',
  };

  const currentSize = sizeClasses[size];

  // Render Priority pill
  if (priority) {
    const normPriority = priority.toLowerCase() as TicketPriority;

    let styles = '';
    let Icon: React.ComponentType<any> = Activity;

    switch (normPriority) {
      case 'low':
        styles = 'text-sky-700 bg-sky-50 border-sky-100 hover:bg-sky-100 dark:border-sky-950/50 dark:bg-sky-950/20 dark:text-sky-400 dark:hover:bg-sky-950/30';
        Icon = ArrowDown;
        break;
      case 'medium':
        styles = 'text-amber-700 bg-amber-50 border-amber-100 hover:bg-amber-100 dark:border-amber-950/50 dark:bg-amber-950/20 dark:text-amber-400 dark:hover:bg-amber-950/30';
        Icon = Activity;
        break;
      case 'high':
        styles = 'text-red-700 bg-red-50 border-red-100 hover:bg-red-100 dark:border-red-950/50 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/30';
        Icon = ArrowUp;
        break;
      case 'urgent':
        styles = 'text-rose-700 bg-rose-50 border-rose-200 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 font-extrabold uppercase tracking-wider animate-pulse';
        Icon = AlertTriangle;
        break;
      default:
        styles = 'text-gray-600 bg-gray-50 border-gray-100 dark:bg-slate-850 dark:text-slate-400 dark:border-slate-800';
        Icon = Activity;
    }

    return (
      <span
        id={id || `priority-badge-${normPriority}`}
        className={`inline-flex items-center font-bold rounded-full border transition-colors cursor-default ${currentSize} ${styles} ${className}`}
      >
        <Icon className="h-3 w-3 shrink-0" />
        <span className="capitalize">{normPriority}</span>
      </span>
    );
  }

  // Render Status pill
  if (status) {
    const normStatus = status.toLowerCase() as TicketStatus;

    let styles = '';
    let Icon: React.ComponentType<any> = FolderOpen;

    switch (normStatus) {
      case 'open':
        styles = 'text-blue-700 bg-blue-50 border-blue-100 hover:bg-blue-100 dark:border-blue-950/50 dark:bg-blue-950/20 dark:text-blue-400';
        Icon = FolderOpen;
        break;
      case 'pending':
        styles = 'text-orange-700 bg-orange-50 border-orange-100 hover:bg-orange-100 dark:border-orange-950/50 dark:bg-orange-950/20 dark:text-orange-450';
        Icon = Clock;
        break;
      case 'in_progress':
        styles = 'text-indigo-700 bg-indigo-50 border-indigo-100 hover:bg-indigo-100 dark:border-indigo-950/50 dark:bg-indigo-950/20 dark:text-indigo-400';
        Icon = RefreshCw;
        break;
      case 'resolved':
        styles = 'text-emerald-700 bg-emerald-50 border-emerald-100 hover:bg-emerald-100 dark:border-emerald-950/50 dark:bg-emerald-950/20 dark:text-emerald-400';
        Icon = CheckCircle2;
        break;
      case 'closed':
        styles = 'text-slate-600 bg-slate-50 border-slate-100 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400';
        Icon = Lock;
        break;
      default:
        styles = 'text-gray-600 bg-gray-50 border-gray-100 dark:bg-slate-850 dark:text-slate-400';
        Icon = FolderOpen;
    }

    return (
      <span
        id={id || `status-badge-${normStatus}`}
        className={`inline-flex items-center font-bold rounded-full border transition-colors cursor-default ${currentSize} ${styles} ${className}`}
      >
        <Icon className={`h-3 w-3 shrink-0 ${normStatus === 'in_progress' ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
        <span className="capitalize">{normStatus.replace('_', ' ')}</span>
      </span>
    );
  }

  return null;
};

export default TicketStatusBadge;
