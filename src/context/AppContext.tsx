import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { User, Ticket, Conversation, Message, Notification, ServiceMetrics } from '../types';

interface AppContextType {
  user: User | null;
  token: string | null;
  activeView: 'landing' | 'login' | 'register' | 'customer' | 'agent' | 'admin' | 'settings';
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  usersList: User[];
  conversations: Conversation[];
  messages: Message[];
  notifications: Notification[];
  activeConversation: Conversation | null;
  onlineUsers: Record<string, 'online' | 'away' | 'busy' | 'offline'>;
  typingUsers: Record<string, { userName: string; isTyping: boolean }>;
  socket: Socket | null;
  tourRun: boolean;
  startTour: () => void;
  stopTour: () => void;
  
  // APIs
  register: (name: string, email: string, pass: string, role: 'customer' | 'agent' | 'admin') => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name: string; bio?: string; phone?: string; company?: string }) => Promise<void>;
  updatePresenceStatus: (presence: 'online' | 'away' | 'busy' | 'offline') => Promise<void>;
  
  setWithToken: (token: string, user: User) => void;
  setView: (view: 'landing' | 'login' | 'register' | 'customer' | 'agent' | 'admin' | 'settings') => void;
  
  fetchConversations: () => Promise<void>;
  selectConversation: (conv: Conversation | null) => void;
  sendMessage: (text: string, mediaUrl?: string, mediaType?: 'image' | 'file') => Promise<void>;
  triggerAIChatbotReply: () => Promise<void>;
  
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchMetrics: () => Promise<ServiceMetrics | null>;
  sendTypingStatus: (isTyping: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<AppContextType['activeView']>('landing');
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeConversation, setActiveConversationState] = useState<Conversation | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, 'online' | 'away' | 'busy' | 'offline'>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, { userName: string; isTyping: boolean }>>({});

  const [tourRun, setTourRun] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);
  const activeConversationRef = useRef<Conversation | null>(null);

  useEffect(() => {
    if (user && activeView !== 'landing' && activeView !== 'login' && activeView !== 'register') {
      const completed = localStorage.getItem('intercomly-tour-completed');
      if (completed !== 'true') {
        const timer = setTimeout(() => {
          setTourRun(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [user, activeView]);

  const startTour = () => setTourRun(true);
  const stopTour = () => setTourRun(false);

  // Initialize Theme
  useEffect(() => {
    const saved = localStorage.getItem('support-theme');
    if (saved === 'dark' || saved === 'light') {
      setThemeState(saved);
      document.documentElement.classList.toggle('dark', saved === 'dark');
    }
  }, []);

  const setTheme = (t: 'light' | 'dark') => {
    setThemeState(t);
    localStorage.setItem('support-theme', t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  };

  // Restore session
  useEffect(() => {
    const sToken = localStorage.getItem('support-token');
    const sUser = localStorage.getItem('support-user');
    if (sToken && sUser) {
      const parsedUser = JSON.parse(sUser);
      setToken(sToken);
      setUser(parsedUser);
      // Route to correct dashboard by default
      setActiveView(parsedUser.role);
    }
  }, []);

  // WebSockets Connection
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Connect to WebSocket pointing to server
    const socket = io(window.location.origin, {
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    // Join room for presence broadcast
    socket.emit('user:status', { userId: user.id, status: user.status || 'online' });

    // Handle incoming events
    socket.on('message:receive', (msg: Message) => {
      // If message is for the currently viewed conversation, update state
      if (activeConversationRef.current && msg.conversationId === activeConversationRef.current.id) {
        setMessages(prev => {
          // Prevent duplicates
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        
        // Auto-scroll logic happens in visual chat pane
      }

      // Update conversations list summary
      setConversations(prev => {
        return prev.map(c => {
          if (c.id === msg.conversationId) {
            return {
              ...c,
              lastMessageText: msg.text,
              lastMessageTime: msg.createdAt,
              unreadCount: (activeConversationRef.current?.id === c.id || msg.senderId === user.id) 
                ? 0 
                : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        });
      });

      // Quick Notification fallback if not looking at thread
      if (msg.senderId !== user.id && (!activeConversationRef.current || activeConversationRef.current.id !== msg.conversationId)) {
        fetchNotifications();
      }
    });

    socket.on('typing:update', (payload: { userId: string; userName: string; isTyping: boolean }) => {
      setTypingUsers(prev => {
        const next = { ...prev };
        if (payload.isTyping) {
          next[payload.userId] = { userName: payload.userName, isTyping: true };
        } else {
          delete next[payload.userId];
        }
        return next;
      });
    });

    socket.on('status:update', (payload: { userId: string; status: 'online' | 'away' | 'busy' | 'offline' }) => {
      setOnlineUsers(prev => ({
        ...prev,
        [payload.userId]: payload.status,
      }));
    });

    socket.on('ticket:notified', () => {
      if (user.role === 'agent' || user.role === 'admin') {
        fetchNotifications();
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('user:status', { userId: user.id, status: 'offline' });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  // Lazy update refs
  const selectConversation = (conv: Conversation | null) => {
    setActiveConversationState(conv);
    activeConversationRef.current = conv;
    setMessages([]); // reset

    if (conv) {
      if (socketRef.current) {
        socketRef.current.emit('join', conv.id);
      }
      fetchMessages(conv.id);
    }
  };

  // --- API ROUTINES INJECTORS ---

  const headers = () => {
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  };

  const register = async (name: string, email: string, pass: string, role: 'customer' | 'agent' | 'admin') => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass, name, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      
      localStorage.setItem('support-token', data.token);
      localStorage.setItem('support-user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setActiveView(data.user.role);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      localStorage.setItem('support-token', data.token);
      localStorage.setItem('support-user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setActiveView(data.user.role);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (socketRef.current && user) {
      socketRef.current.emit('user:status', { userId: user.id, status: 'offline' });
    }
    localStorage.removeItem('support-token');
    localStorage.removeItem('support-user');
    setToken(null);
    setUser(null);
    setActiveView('landing');
    setConversations([]);
    setMessages([]);
    setNotifications([]);
    selectConversation(null);
  };

  const updateProfile = async (updates: { name: string; bio?: string; phone?: string; company?: string }) => {
    if (!token) return;
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        localStorage.setItem('support-user', JSON.stringify(data.user));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updatePresenceStatus = async (status: 'online' | 'away' | 'busy' | 'offline') => {
    if (!token) return;
    try {
      const res = await fetch('/api/users/status', {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        localStorage.setItem('support-user', JSON.stringify(data.user));
        if (socketRef.current) {
          socketRef.current.emit('user:status', { userId: data.user.id, status });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const setWithToken = (tok: string, usr: User) => {
    setToken(tok);
    setUser(usr);
    localStorage.setItem('support-token', tok);
    localStorage.setItem('support-user', JSON.stringify(usr));
    setActiveView(usr.role);
  };

  const setView = (view: AppContextType['activeView']) => {
    setActiveView(view);
  };

  const fetchConversations = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/conversations', { headers: headers() });
      const data = await res.json();
      if (res.ok) {
        setConversations(data.conversations);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async (convId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`, { headers: headers() });
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages);
        
        // Sync conversations unread state
        setConversations(prev => prev.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessage = async (text: string, mediaUrl?: string, mediaType?: 'image' | 'file') => {
    if (!token || !activeConversation) return;
    try {
      const res = await fetch(`/api/conversations/${activeConversation.id}/messages`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ text, mediaUrl, mediaType }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages(prev => [...prev, data.message]);

        // Local socket emit for real-time delivery
        if (socketRef.current) {
          socketRef.current.emit('message:send', data.message);
        }

        // Auto-Trigger instant AI response greeting if the user explicitly triggers it
        // and they are a customer submitting an initial thread queries.
        await fetchConversations();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const triggerAIChatbotReply = async () => {
    if (!token || !activeConversation) return;
    try {
      const res = await fetch(`/api/conversations/${activeConversation.id}/ai-reply`, {
        method: 'POST',
        headers: headers(),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages(prev => {
          if (prev.some(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });

        // Broadcast AI message through Socket
        if (socketRef.current) {
          socketRef.current.emit('message:send', data.message);
        }
        await fetchConversations();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', { headers: headers() });
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markNotificationRead = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: headers(),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/users', { headers: headers() });
      const data = await res.json();
      if (res.ok) {
        setUsersList(data.users);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMetrics = async (): Promise<ServiceMetrics | null> => {
    if (!token || user?.role !== 'admin') return null;
    try {
      const res = await fetch('/api/analytics/dashboard', { headers: headers() });
      const data = await res.json();
      if (res.ok) {
        return data.metrics;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const sendTypingStatus = (isTyping: boolean) => {
    if (socketRef.current && activeConversation && user) {
      socketRef.current.emit('typing:status', {
        roomId: activeConversation.id,
        userId: user.id,
        userName: user.name,
        isTyping,
      });
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        activeView,
        theme,
        setTheme,
        isLoading,
        setIsLoading,
        usersList,
        conversations,
        messages,
        notifications,
        activeConversation,
        onlineUsers,
        typingUsers,
        socket: socketRef.current,
        tourRun,
        startTour,
        stopTour,
        
        register,
        login,
        logout,
        updateProfile,
        updatePresenceStatus,
        setWithToken,
        setView,
        
        fetchConversations,
        selectConversation,
        sendMessage,
        triggerAIChatbotReply,
        fetchNotifications,
        markNotificationRead,
        fetchUsers,
        fetchMetrics,
        sendTypingStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used inside an AppProvider');
  return context;
};
