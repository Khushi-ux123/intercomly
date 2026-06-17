import { Router, Response } from 'express';
import { dbStore, hashPassword } from './db';
import { signToken, authenticate, AuthenticatedRequest, requireRole } from './auth';
import { generateAIChatbotResponse, classifyMessageSentiment, generateSmartCannedReplies } from './gemini';

const router = Router();

// ================= AUTH ROUTES =================

router.post('/auth/register', (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name) {
    res.status(400).json({ error: 'All fields (email, password, name) are required' });
    return;
  }

  const existing = dbStore.getUserByEmail(email);
  if (existing) {
    res.status(400).json({ error: 'Email already registered' });
    return;
  }

  const defaultRole = role === 'agent' || role === 'admin' ? role : 'customer';
  const defaultAvatars = {
    customer: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    agent: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    admin: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
  };

  const user = dbStore.createUser({
    email,
    name,
    role: defaultRole,
    avatar: defaultAvatars[defaultRole],
    status: 'online',
    bio: `Active support platform ${defaultRole}.`,
  }, password);

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.status(201).json({ token, user });
});

router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const user = dbStore.getUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const hash = hashPassword(password);
  const storedHash = dbStore.getUserPasswordHash(user.id);

  if (hash !== storedHash) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  // Set user status to online
  dbStore.updateUser(user.id, { status: 'online' });

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.json({ token, user });
});

router.get('/auth/me', authenticate, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

// ================= USER OPERATIONS =================

router.get('/users', authenticate, (req: AuthenticatedRequest, res) => {
  const users = dbStore.getUsers().map(({ id, email, name, role, avatar, status, company, phone, bio, createdAt }) => ({
    id, email, name, role, avatar, status, company, phone, bio, createdAt
  }));
  res.json({ users });
});

router.patch('/users/status', authenticate, (req: AuthenticatedRequest, res) => {
  const { status } = req.body;
  if (req.user && (status === 'online' || status === 'away' || status === 'busy' || status === 'offline')) {
    const updated = dbStore.updateUser(req.user.id, { status });
    res.json({ user: updated });
  } else {
    res.status(400).json({ error: 'Invalid user status' });
  }
});

router.patch('/users/profile', authenticate, (req: AuthenticatedRequest, res) => {
  const { name, bio, phone, company } = req.body;
  if (req.user) {
    const updated = dbStore.updateUser(req.user.id, { name, bio, phone, company });
    res.json({ user: updated });
  } else {
    res.status(400).json({ error: 'Update failed' });
  }
});


// ================= TICKET OPERATIONS =================

router.get('/tickets', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  let tickets = dbStore.getTickets();

  // Filter based on user roles
  if (user.role === 'customer') {
    tickets = tickets.filter(t => t.customerId === user.id);
  } else if (user.role === 'agent') {
    tickets = tickets.filter(t => t.agentId === user.id || t.agentId === null);
  }

  res.json({ tickets });
});

router.get('/tickets/:id', authenticate, (req: AuthenticatedRequest, res) => {
  const ticket = dbStore.getTicketById(req.params.id);
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  // Customer authorization check
  if (req.user!.role === 'customer' && ticket.customerId !== req.user!.id) {
    res.status(403).json({ error: 'Forbidden access to ticket' });
    return;
  }

  res.json({ ticket });
});

router.post('/tickets', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { title, description, priority, category } = req.body;

  if (!title || !description) {
    res.status(400).json({ error: 'Title and description are required' });
    return;
  }

  // Create ticket
  const ticket = dbStore.createTicket({
    title,
    description,
    customerId: user.id,
    customerName: user.name,
    customerEmail: user.email,
    agentId: null,
    status: 'open',
    priority: priority || 'medium',
  });

  // Notify active agents / admin of new support ticket
  const agents = dbStore.getUsers().filter(u => u.role === 'agent' || u.role === 'admin');
  agents.forEach(agent => {
    dbStore.createNotification({
      userId: agent.id,
      text: `New Ticket: ${user.name} submitted "${title}"`,
      type: 'ticket',
      isRead: false,
      ticketId: ticket.id,
    });
  });

  res.status(201).json({ ticket });
});

router.patch('/tickets/:id', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const ticket = dbStore.getTicketById(req.params.id);

  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  // Only customers can modify their own open details, but agent/admin can manage anything
  if (user.role === 'customer' && ticket.customerId !== user.id) {
    res.status(403).json({ error: 'Unauthorized to modify ticket' });
    return;
  }

  const { status, priority, agentId } = req.body;
  const updates: any = {};

  if (status) updates.status = status;
  if (priority) updates.priority = priority;

  if (agentId !== undefined) {
    if (agentId === null) {
      updates.agentId = null;
      updates.agentName = undefined;
    } else {
      const targetAgent = dbStore.getUserById(agentId);
      if (targetAgent && (targetAgent.role === 'agent' || targetAgent.role === 'admin')) {
        updates.agentId = targetAgent.id;
        updates.agentName = targetAgent.name;
      }
    }
  }

  const updatedTicket = dbStore.updateTicket(req.params.id, updates, user);

  // Notify customer if agent updates status
  if (user.role !== 'customer') {
    dbStore.createNotification({
      userId: ticket.customerId,
      text: `Ticket Update: "${ticket.title}" status is now ${status || ticket.status}`,
      type: 'ticket',
      isRead: false,
      ticketId: ticket.id,
    });
  }

  res.json({ ticket: updatedTicket });
});

// Post a diagnostic log timeline note/comment to the ticket history
router.post('/tickets/:id/activities/note', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { noteText } = req.body;
  if (!noteText) {
    res.status(400).json({ error: 'Note text body is required' });
    return;
  }

  const ticket = dbStore.getTicketById(req.params.id);
  if (!ticket) {
    res.status(404).json({ error: 'Ticket profile not found' });
    return;
  }

  if (user.role === 'customer' && ticket.customerId !== user.id) {
    res.status(403).json({ error: 'Unauthorized entry log access' });
    return;
  }

  const act = dbStore.createActivity({
    ticketId: ticket.id,
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    type: 'note',
    message: `${user.name} added a workspace audit note:`,
    noteText,
  });

  res.status(201).json({ activity: act, ticket: dbStore.getTicketById(ticket.id) });
});


// ================= CONVERSATION & CHAT CHANNELS =================

// Get lists of support chats
router.get('/conversations', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  let conversations = dbStore.getConversations();

  if (user.role === 'customer') {
    conversations = conversations.filter(c => c.customerId === user.id);
  } else if (user.role === 'agent') {
    // Agents can see all unassigned or assigned to them
    conversations = conversations.filter(c => c.agentId === null || c.agentId === user.id);
  }

  res.json({ conversations });
});

// View specific message list
router.get('/conversations/:id/messages', authenticate, (req: AuthenticatedRequest, res) => {
  const conv = dbStore.getConversationById(req.params.id);
  if (!conv) {
    res.status(404).json({ error: 'Conversation channel not found' });
    return;
  }

  // Auth lock
  if (req.user!.role === 'customer' && conv.customerId !== req.user!.id) {
    res.status(403).json({ error: 'Access forbidden to chat feed' });
    return;
  }

  // Clear unreads for user reading it
  dbStore.markMessagesAsRead(req.params.id, req.user!.id);

  const messages = dbStore.getMessages(req.params.id);
  res.json({ messages });
});

// Post a message and optionally execute AI triggers
router.post('/conversations/:id/messages', authenticate, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const conv = dbStore.getConversationById(req.params.id);
  if (!conv) {
    res.status(404).json({ error: 'Conversation profile not found' });
    return;
  }

  // Post a message and optionally execute AI triggers
  const { text, mediaUrl, mediaType } = req.body;
  if (!text && !mediaUrl) {
    res.status(400).json({ error: 'Message body or attachments required' });
    return;
  }

  // Classify sentiment of customer texts using Gemini or fallback
  let sentiment: 'positive' | 'neutral' | 'negative' | undefined = undefined;
  if (user.role === 'customer' && text) {
    try {
      sentiment = await classifyMessageSentiment(text);
    } catch (err) {
      console.error('Error classifying sentiment in message route:', err);
    }
  }

  // Save the message
  const msg = dbStore.createMessage({
    conversationId: conv.id,
    senderId: user.id,
    senderName: user.name,
    senderRole: user.role,
    text: text || '',
    mediaUrl,
    mediaType,
    isRead: false,
    sentiment,
  });

  // Notify real-time users (using notifications for non-focused clients)
  const recipientId = user.role === 'customer' ? (conv.agentId || 'unassigned') : conv.customerId;
  if (recipientId !== 'unassigned') {
    dbStore.createNotification({
      userId: recipientId,
      text: `${user.name}: ${text.substring(0, 40)}${text.length > 40 ? '...' : ''}`,
      type: 'message',
      isRead: false,
      conversationId: conv.id,
    });
  }

  res.status(201).json({ message: msg });
});


// ================= AI ACTION TRIGGERS =================

// Asks Gemini AI to immediately solve a conversation state
router.post('/conversations/:id/ai-reply', authenticate, async (req: AuthenticatedRequest, res) => {
  const conv = dbStore.getConversationById(req.params.id);
  if (!conv) {
    res.status(404).json({ error: 'Conversation workspace missing' });
    return;
  }

  const ticket = dbStore.getTicketById(conv.ticketId);
  if (!ticket) {
    res.status(404).json({ error: 'Linked support ticket is missing' });
    return;
  }

  // Get active history
  const previousMessages = dbStore.getMessages(conv.id)
    .slice(-10) // feed latest 10 messages
    .map(m => `${m.senderName} (${m.senderRole}): ${m.text}`);

  try {
    const aiText = await generateAIChatbotResponse(
      ticket.title,
      ticket.description,
      previousMessages
    );

    // Save AI reply as support bot message
    const botMsg = dbStore.createMessage({
      conversationId: conv.id,
      senderId: 'ai_chatbot',
      senderName: 'InterBot (AI Support)',
      senderRole: 'agent',
      text: aiText,
      isRead: false,
    });

    res.json({ message: botMsg });
  } catch (error: any) {
    res.status(500).json({ error: 'AI processing failed: ' + error.message });
  }
});

// Generates context-aware "Smart Canned Replies" for agents
router.get('/conversations/:id/smart-replies', authenticate, async (req: AuthenticatedRequest, res) => {
  const conv = dbStore.getConversationById(req.params.id);
  if (!conv) {
    res.status(404).json({ error: 'Conversation workspace missing' });
    return;
  }

  const ticket = dbStore.getTicketById(conv.ticketId);
  if (!ticket) {
    res.status(404).json({ error: 'Linked support ticket is missing' });
    return;
  }

  // Get active history
  const previousMessages = dbStore.getMessages(conv.id)
    .slice(-10) // feed latest 10 messages
    .map(m => `${m.senderName} (${m.senderRole}): ${m.text}`);

  try {
    const replies = await generateSmartCannedReplies(
      ticket.title,
      ticket.description,
      previousMessages
    );

    res.json({ replies });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate canned replies: ' + error.message });
  }
});


// ================= METRICS & OPERATIONS =================

router.get('/analytics/dashboard', authenticate, requireRole(['admin']), (req, res) => {
  const metrics = dbStore.getSaaSMetrics();
  res.json({ metrics });
});

router.get('/notifications', authenticate, (req: AuthenticatedRequest, res) => {
  const list = dbStore.getNotifications(req.user!.id);
  res.json({ notifications: list });
});

router.patch('/notifications/:id/read', authenticate, (req: AuthenticatedRequest, res) => {
  dbStore.markNotificationAsRead(req.params.id);
  res.json({ success: true });
});

export default router;
