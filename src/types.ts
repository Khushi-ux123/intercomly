export type UserRole = 'customer' | 'agent' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen?: string;
  bio?: string;
  phone?: string;
  company?: string;
  createdAt: string;
}

export interface TicketActivity {
  id: string;
  ticketId: string;
  actorId: string;
  actorName: string;
  actorRole: 'customer' | 'agent' | 'admin';
  type: 'status_change' | 'reassignment' | 'note' | 'creation';
  message: string;
  noteText?: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  agentId: string | null;
  agentName?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  activities?: TicketActivity[];
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  ticketId: string;
  customerId: string;
  customerName?: string;
  customerAvatar?: string;
  agentId: string | null;
  agentName?: string;
  status: 'open' | 'resolved' | 'closed';
  lastMessageText?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'file';
  isRead: boolean;
  sentiment?: 'positive' | 'neutral' | 'negative';
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  text: string;
  type: 'message' | 'ticket' | 'alert';
  isRead: boolean;
  conversationId?: string;
  ticketId?: string;
  createdAt: string;
}

export interface ServiceMetrics {
  totalTickets: number;
  activeConversations: number;
  resolvedTickets: number;
  averageResolutionTimeHours: number;
  customerSatisfactionScore: number; // out of 100
  ticketsByPriority: {
    low: number;
    medium: number;
    high: number;
  };
  ticketsByStatus: {
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
  agentPerformance: Array<{
    agentId: string;
    agentName: string;
    resolvedCount: number;
    avgResponseMinutes: number;
    rating: number;
  }>;
  dailyResolutionData: Array<{
    date: string;
    resolved: number;
    created: number;
  }>;
  slaHourlyData?: Array<{
    hour: string;
    avgResponseMinutes: number;
    throughput: number;
    slaMetRate: number;
  }>;
  resolutionTimeTrend?: Array<{
    date: string;
    averageResolutionMinutes: number;
    slaThresholdMinutes: number;
    slaMetRatePercent: number;
  }>;
}
