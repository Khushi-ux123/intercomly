import React, { createContext, useContext, useState, useEffect } from 'react';
import { Ticket } from '../types';
import { useApp } from './AppContext';

interface TicketContextType {
  tickets: Ticket[];
  isLoadingTickets: boolean;
  fetchTickets: () => Promise<void>;
  createTicket: (title: string, desc: string, priority: 'low' | 'medium' | 'high') => Promise<void>;
  updateTicketStatus: (id: string, status: Ticket['status'], agentId?: string | null) => Promise<void>;
  addTicketActivityNote: (ticketId: string, noteText: string) => Promise<void>;
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export const TicketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user, fetchConversations, socket } = useApp();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState<boolean>(false);

  const fetchTickets = async () => {
    if (!token) return;
    setIsLoadingTickets(true);
    try {
      const res = await fetch('/api/tickets', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setTickets(data.tickets);
      }
    } catch (error) {
      console.error('Error fetching tickets', error);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const createTicket = async (title: string, desc: string, priority: 'low' | 'medium' | 'high') => {
    if (!token) return;
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description: desc, priority }),
      });
      const data = await res.json();
      if (res.ok) {
        // Re-sync locally
        await fetchTickets();
        await fetchConversations();

        // Broadcast to socket
        if (socket) {
          socket.emit('ticket:alert', { ticketId: data.ticket.id, title, customerId: user!.id });
        }
      } else {
        throw new Error(data.error || 'Failed to create ticket');
      }
    } catch (e) {
      console.error('Error creating ticket:', e);
      throw e;
    }
  };

  const updateTicketStatus = async (id: string, status: Ticket['status'], agentId?: string | null) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status, ...(agentId !== undefined ? { agentId } : {}) }),
      });
      if (res.ok) {
        await fetchTickets();
        await fetchConversations();

        // Broadcast real-time ticket sync
        if (socket) {
          socket.emit('ticket:alert', { ticketId: id, title: 'Status updated', customerId: user!.id });
        }
      }
    } catch (e) {
      console.error('Error updating ticket status:', e);
    }
  };

  const addTicketActivityNote = async (ticketId: string, noteText: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/tickets/${ticketId}/activities/note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ noteText }),
      });
      if (res.ok) {
        await fetchTickets();
        if (socket) {
          socket.emit('ticket:alert', { ticketId, title: 'Audit Note Added', customerId: user!.id });
        }
      }
    } catch (e) {
      console.error('Error adding ticket activity note:', e);
    }
  };

  // Sync tickets automatically on Authentication changes
  useEffect(() => {
    if (token && user) {
      fetchTickets();
    } else {
      setTickets([]);
    }
  }, [token, user]);

  // Listen to WebSocket events for ticket notifications
  useEffect(() => {
    if (!socket) return;

    const handleTicketNotification = () => {
      if (user && (user.role === 'agent' || user.role === 'admin')) {
        fetchTickets();
      }
    };

    socket.on('ticket:notified', handleTicketNotification);

    return () => {
      socket.off('ticket:notified', handleTicketNotification);
    };
  }, [socket, user]);

  return (
    <TicketContext.Provider
      value={{
        tickets,
        isLoadingTickets,
        fetchTickets,
        createTicket,
        updateTicketStatus,
        addTicketActivityNote,
      }}
    >
      {children}
    </TicketContext.Provider>
  );
};

export const useTickets = () => {
  const context = useContext(TicketContext);
  if (context === undefined) {
    throw new Error('useTickets must be used within a TicketProvider');
  }
  return context;
};
