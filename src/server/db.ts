import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, Ticket, Conversation, Message, Notification, ServiceMetrics, TicketActivity } from '../types';
import { db } from '../db/index.ts';
import * as schema from '../db/schema.ts';
import { eq, sql } from 'drizzle-orm';

// Simple password hashing algorithm using Node's crypto
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

interface DatabaseSchema {
  users: User[];
  passwords: Record<string, string>; // userId -> passwordHash
  tickets: Ticket[];
  conversations: Conversation[];
  messages: Message[];
  notifications: Notification[];
  activities: TicketActivity[];
}

class DiskDatabase {
  private filePath: string;
  private db: DatabaseSchema;

  constructor() {
    this.filePath = path.join(process.cwd(), 'database_store.json');
    this.db = {
      users: [],
      passwords: {},
      tickets: [],
      conversations: [],
      messages: [],
      notifications: [],
      activities: [],
    };
    this.load();
    if (this.db.users.length === 0) {
      this.seed();
    }
  }

  // Asynchronous initializer connected to Cloud SQL (Called during boot in server.ts)
  public async init() {
    try {
      const dbUrl = process.env.DATABASE_URL;
      const sqlHost = process.env.SQL_HOST;

      const isPlaceholderUrl = !dbUrl || dbUrl.trim() === "" || dbUrl.includes('${') || dbUrl.includes('YOUR_');
      const isPlaceholderHost = !sqlHost || sqlHost.trim() === "" || sqlHost === 'base' || sqlHost.includes('${') || sqlHost.includes('YOUR_');

      if (isPlaceholderUrl && isPlaceholderHost) {
        console.log('No active external DATABASE_URL or SQL_HOST supplied in environment. Skipping PostgreSQL layer and falling back directly to local JSON database storage.');
        this.load();
        if (this.db.users.length === 0) {
          this.seed();
        }
        return;
      }

      console.log('Initializing relational database layer with PostgreSQL (Drizzle)...');
      
      // Auto-provision tables if they do not exist (e.g., custom Railway deployment first booted)
      try {
        console.log('Verifying PostgreSQL schema tables exist...');
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            avatar TEXT,
            status TEXT DEFAULT 'offline',
            company TEXT,
            phone TEXT,
            bio TEXT,
            created_at TEXT NOT NULL
          );
        `);
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS passwords (
            user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            password_hash TEXT NOT NULL
          );
        `);
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS tickets (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            customer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            customer_name TEXT NOT NULL,
            customer_email TEXT,
            agent_id TEXT REFERENCES users(id) ON DELETE SET NULL,
            agent_name TEXT,
            status TEXT NOT NULL,
            priority TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT,
            category TEXT,
            sentiment TEXT,
            first_response_minutes INTEGER,
            resolution_minutes INTEGER,
            tags TEXT
          );
        `);
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS activities (
            id TEXT PRIMARY KEY,
            ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
            actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            actor_name TEXT NOT NULL,
            actor_role TEXT NOT NULL,
            type TEXT NOT NULL,
            message TEXT NOT NULL,
            note_text TEXT,
            created_at TEXT NOT NULL
          );
        `);
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            ticket_id TEXT REFERENCES tickets(id) ON DELETE SET NULL,
            customer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            customer_name TEXT NOT NULL,
            customer_avatar TEXT,
            agent_id TEXT REFERENCES users(id) ON DELETE SET NULL,
            agent_name TEXT,
            status TEXT NOT NULL,
            last_message_text TEXT,
            last_message_time TEXT,
            unread_count INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT
          );
        `);
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
            sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            sender_name TEXT NOT NULL,
            sender_role TEXT NOT NULL,
            text TEXT NOT NULL,
            sentiment TEXT,
            is_read BOOLEAN DEFAULT FALSE,
            is_bot BOOLEAN DEFAULT FALSE,
            created_at TEXT NOT NULL
          );
        `);
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            ticket_id TEXT REFERENCES tickets(id) ON DELETE CASCADE,
            conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
            text TEXT NOT NULL,
            type TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TEXT NOT NULL
          );
        `);
        console.log('PostgreSQL database schema auto-provisioned successfully!');
      } catch (err) {
        console.warn('PostgreSQL table auto-creation schema assertion warning or error details:', err);
      }

      // Load all records from Postgres
      const pUsers = await db.select().from(schema.users);
      const pPasswords = await db.select().from(schema.passwords);
      const pTickets = await db.select().from(schema.tickets);
      const pConversations = await db.select().from(schema.conversations);
      const pMessages = await db.select().from(schema.messages);
      const pNotifications = await db.select().from(schema.notifications);
      const pActivities = await db.select().from(schema.activities);

      if (pUsers.length === 0) {
        console.log('PostgreSQL is empty. Seeding relational database...');
        await this.seedToPostgres();
      } else {
        // Populate local cache with PostgreSQL records
        this.db.users = pUsers.map(u => ({
          ...u,
          status: (u.status || 'offline') as any,
          role: u.role as any,
        }));

        this.db.passwords = {};
        pPasswords.forEach(p => {
          this.db.passwords[p.userId] = p.passwordHash;
        });

        this.db.tickets = pTickets.map(t => ({
          ...t,
          status: t.status as any,
          priority: t.priority as any,
          tags: t.tags ? t.tags.split(',') : [],
        }));

        this.db.conversations = pConversations.map(c => ({
          ...c,
          status: c.status as any,
          unreadCount: c.unreadCount || 0,
        }));

        this.db.messages = pMessages.map(m => ({
          ...m,
          senderRole: m.senderRole as any,
          sentiment: m.sentiment as any,
          isRead: m.isRead || false,
          isBot: m.isBot || false,
        }));

        this.db.notifications = pNotifications.map(n => ({
          ...n,
          type: n.type as any,
          isRead: n.isRead || false,
          ticketId: n.ticketId || undefined,
          conversationId: n.conversationId || undefined,
        }));

        this.db.activities = pActivities.map(a => ({
          ...a,
          type: a.type as any,
          actorRole: a.actorRole as any,
          noteText: a.noteText || undefined,
        }));
        
        console.log(`Relational database loaded with: ${this.db.users.length} users, ${this.db.tickets.length} tickets, and ${this.db.conversations.length} conversations.`);
      }
    } catch (error) {
      console.error('Failed to initialize PostgreSQL layer. Falling back to disk/in-memory cache:', error);
      this.load();
      if (this.db.users.length === 0) {
        this.seed();
      }
    }
  }

  private async seedToPostgres() {
    console.log('Seeding PostgreSQL database with default Support Workspace values...');
    const protoHash = hashPassword('password');

    // Default users
    const defaultUsers = [
      {
        id: 'usr_cust_1',
        email: 'customer@example.com',
        name: 'Sarah Jenkins',
        role: 'customer',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        status: 'online',
        company: 'Acme Corp',
        phone: '+1 (555) 234-5678',
        bio: 'Founder at Acme Corp, an enterprise cloud security provider.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_cust_2',
        email: 'alex@startup.co',
        name: 'Alex Rivera',
        role: 'customer',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        status: 'offline',
        company: 'SaaSify Inc',
        phone: '+1 (555) 987-6543',
        bio: 'Product Manager at SaaSify Inc, looking to automate ticketing.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_agent_1',
        email: 'agent@example.com',
        name: 'Michael Chen',
        role: 'agent',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        status: 'online',
        bio: 'Senior Support Lead. Specialized in system config and API integrations.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_agent_2',
        email: 'emma@support.com',
        name: 'Emma Watson',
        role: 'agent',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        status: 'online',
        bio: 'Billing & Account Success Specialist.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_admin_1',
        email: 'admin@example.com',
        name: 'Sophia Carter',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        status: 'online',
        bio: 'Director of Support Operations and Workspace Administrator.',
        createdAt: new Date().toISOString(),
      },
    ];

    for (const u of defaultUsers) {
      await db.insert(schema.users).values(u);
      await db.insert(schema.passwords).values({ userId: u.id, passwordHash: protoHash });
    }

    // Default tickets
    const defaultTickets = [
      {
        id: 'tc_1',
        title: 'Billing Issue: Charged Twice on Pro Plan upgrade',
        description: 'Hi support team, I upgraded our team plan to Acme Pro yesterday, but I noticed two separate charges of $149 on our credit card statement instead of one. Can you please refund the duplicate and verify our subscription status?',
        customerId: 'usr_cust_1',
        customerName: 'Sarah Jenkins',
        customerEmail: 'customer@example.com',
        agentId: 'usr_agent_2',
        agentName: 'Emma Watson',
        status: 'in_progress',
        priority: 'high',
        createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        tags: 'billing,refund',
      },
      {
        id: 'tc_2',
        title: 'Unable to connect API Webhook endpoints',
        description: 'I am getting a 403 forbidden error whenever your platform tries to trigger our endpoint webhook, although manual testing with postman is working perfectly. Are there specific support IP ranges we need to whitelist in our AWS Security Groups?',
        customerId: 'usr_cust_1',
        customerName: 'Sarah Jenkins',
        customerEmail: 'customer@example.com',
        agentId: 'usr_agent_1',
        agentName: 'Michael Chen',
        status: 'open',
        priority: 'medium',
        createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
        tags: 'api,webhook',
      },
      {
        id: 'tc_3',
        title: 'Custom Domain Setup for Knowledge Base',
        description: 'Our team wants to link our own help.acme.com subdomain to direct customers to our support center. We populated the CNAME records in Cloudflare, but the SSL handsake keeps failing with a TLS error. Please advise!',
        customerId: 'usr_cust_1',
        customerName: 'Sarah Jenkins',
        customerEmail: 'customer@example.com',
        agentId: 'usr_agent_1',
        agentName: 'Michael Chen',
        status: 'resolved',
        priority: 'low',
        createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        tags: 'domain,ssl',
      },
    ];

    for (const t of defaultTickets) {
      await db.insert(schema.tickets).values(t);
    }

    // Default activities
    const defaultActivities = [
      {
        id: 'act_seed_1',
        ticketId: 'tc_1',
        actorId: 'usr_cust_1',
        actorName: 'Sarah Jenkins',
        actorRole: 'customer',
        type: 'creation',
        message: 'Sarah Jenkins created double charge billing support ticket.',
        createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      },
      {
        id: 'act_seed_2',
        ticketId: 'tc_1',
        actorId: 'usr_agent_2',
        actorName: 'Emma Watson',
        actorRole: 'agent',
        type: 'reassignment',
        message: 'Michael Chen reassigned this billing ticket to billing specialist Emma Watson.',
        createdAt: new Date(Date.now() - 3.8 * 3600000).toISOString(),
      },
      {
        id: 'act_seed_3',
        ticketId: 'tc_1',
        actorId: 'usr_agent_2',
        actorName: 'Emma Watson',
        actorRole: 'agent',
        type: 'status_change',
        message: 'Emma Watson updated ticket status to In Progress.',
        createdAt: new Date(Date.now() - 3.5 * 3600000).toISOString(),
      },
      {
        id: 'act_seed_4',
        ticketId: 'tc_1',
        actorId: 'usr_agent_2',
        actorName: 'Emma Watson',
        actorRole: 'agent',
        type: 'note',
        message: 'Emma Watson added diagnostic event log note:',
        noteText: 'Initiated duplicate charge void request via Stripe dashboard. Void terminal code: STRIPE_VOID_4402.',
        createdAt: new Date(Date.now() - 3.4 * 3600000).toISOString(),
      },
      {
        id: 'act_seed_5',
        ticketId: 'tc_2',
        actorId: 'usr_cust_1',
        actorName: 'Sarah Jenkins',
        actorRole: 'customer',
        type: 'creation',
        message: 'Sarah Jenkins created API webhook networking query.',
        createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
      },
    ];

    for (const act of defaultActivities) {
      await db.insert(schema.activities).values(act);
    }

    // Default conversations
    const defaultConversations = [
      {
        id: 'conv_tc_1',
        ticketId: 'tc_1',
        customerId: 'usr_cust_1',
        customerName: 'Sarah Jenkins',
        customerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        agentId: 'usr_agent_2',
        agentName: 'Emma Watson',
        status: 'open',
        lastMessageText: 'Just double check the records. Let me know details.',
        lastMessageTime: new Date(Date.now() - 2 * 3600000).toISOString(),
        unreadCount: 0,
        createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
      {
        id: 'conv_tc_2',
        ticketId: 'tc_2',
        customerId: 'usr_cust_1',
        customerName: 'Sarah Jenkins',
        customerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        agentId: 'usr_agent_1',
        agentName: 'Michael Chen',
        status: 'open',
        lastMessageText: 'Let me look at your server logs. Send details soon.',
        lastMessageTime: new Date(Date.now() - 8 * 3600000).toISOString(),
        unreadCount: 1,
        createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
      },
    ];

    for (const c of defaultConversations) {
      await db.insert(schema.conversations).values(c);
    }

    // Default messages
    const defaultMessages = [
      {
        id: 'msg_1',
        conversationId: 'conv_tc_1',
        senderId: 'usr_cust_1',
        senderName: 'Sarah Jenkins',
        senderRole: 'customer',
        text: 'Hi Emma, I noticed two separate charges of $149 on our card statement instead of one yesterday. Below is the screenshot from our bank statement.',
        isRead: true,
        sentiment: 'negative',
        createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      },
      {
        id: 'msg_2',
        conversationId: 'conv_tc_1',
        senderId: 'usr_agent_2',
        senderName: 'Emma Watson',
        senderRole: 'agent',
        text: 'Hello Sarah! I see what happened. Our stripe terminal had a minor retry delay which initiated two charge requests. I am initiating a refund immediately. Please expect it in 2-3 business days.',
        isRead: true,
        createdAt: new Date(Date.now() - 3.5 * 3600000).toISOString(),
      },
      {
        id: 'msg_3',
        conversationId: 'conv_tc_1',
        senderId: 'usr_cust_1',
        senderName: 'Sarah Jenkins',
        senderRole: 'customer',
        text: 'Perfect! Thank you so much for the quick response. Just double check the records and ensure our dashboard subscription remains active.',
        isRead: true,
        sentiment: 'positive',
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
      {
        id: 'msg_4',
        conversationId: 'conv_tc_2',
        senderId: 'usr_cust_1',
        senderName: 'Sarah Jenkins',
        senderRole: 'customer',
        text: 'Hello Michael! We cannot receive webhook triggers onto our internal API Gateway. Do you have specific security IPs?',
        isRead: true,
        sentiment: 'negative',
        createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
      },
    ];

    for (const m of defaultMessages) {
      await db.insert(schema.messages).values(m);
    }

    // Default notifications
    const defaultNotifications = [
      {
        id: 'nt_1',
        userId: 'usr_agent_1',
        text: 'New Ticket Assigned: Webhook connection issue from Acme Corp.',
        type: 'ticket',
        isRead: false,
        ticketId: 'tc_2',
        createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
      },
    ];

    for (const n of defaultNotifications) {
      await db.insert(schema.notifications).values(n);
    }

    // Load back to core object model
    this.db.users = defaultUsers as any[];
    this.db.passwords = {};
    defaultUsers.forEach(u => {
      this.db.passwords[u.id] = protoHash;
    });

    this.db.tickets = defaultTickets.map(t => ({
      ...t,
      status: t.status as any,
      priority: t.priority as any,
      tags: t.tags ? t.tags.split(',') : [],
    }));

    this.db.conversations = defaultConversations.map(c => ({
      ...c,
      status: c.status as any,
    }));

    this.db.messages = defaultMessages as any[];
    this.db.activities = defaultActivities as any[];
    this.db.notifications = defaultNotifications as any[];

    console.log('PostgreSQL database and in-memory cache successfully seeded.');
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf-8');
        this.db = JSON.parse(data);
        if (!this.db.activities) {
          this.db.activities = [];
        }
      }
    } catch (e) {
      console.error('Failed to load database from disk, using empty database:', e);
    }
  }

  private save() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save database to disk:', e);
    }
  }

  private seed() {
    console.log('Seeding disk database fallback...');
    const protoHash = hashPassword('password');

    const defaultUsers = [
      {
        id: 'usr_cust_1',
        email: 'customer@example.com',
        name: 'Sarah Jenkins',
        role: 'customer',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        status: 'online',
        company: 'Acme Corp',
        phone: '+1 (555) 234-5678',
        bio: 'Founder at Acme Corp, an enterprise cloud security provider.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_cust_2',
        email: 'alex@startup.co',
        name: 'Alex Rivera',
        role: 'customer',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        status: 'offline',
        company: 'SaaSify Inc',
        phone: '+1 (555) 987-6543',
        bio: 'Product Manager at SaaSify Inc, looking to automate ticketing.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_agent_1',
        email: 'agent@example.com',
        name: 'Michael Chen',
        role: 'agent',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        status: 'online',
        bio: 'Senior Support Lead. Specialized in system config and API integrations.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_agent_2',
        email: 'emma@support.com',
        name: 'Emma Watson',
        role: 'agent',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        status: 'online',
        bio: 'Billing & Account Success Specialist.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_admin_1',
        email: 'admin@example.com',
        name: 'Sophia Carter',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        status: 'online',
        bio: 'Director of Support Operations and Workspace Administrator.',
        createdAt: new Date().toISOString(),
      },
    ];

    defaultUsers.forEach(u => {
      this.db.users.push(u as any);
      this.db.passwords[u.id] = protoHash;
    });

    const defaultTickets: Ticket[] = [
      {
        id: 'tc_1',
        title: 'Billing Issue: Charged Twice on Pro Plan upgrade',
        description: 'Hi support team, I upgraded our team plan to Acme Pro yesterday, but I noticed two separate charges of $149 on our credit card statement instead of one. Can you please refund the duplicate and verify our subscription status?',
        customerId: 'usr_cust_1',
        customerName: 'Sarah Jenkins',
        customerEmail: 'customer@example.com',
        agentId: 'usr_agent_2',
        agentName: 'Emma Watson',
        status: 'in_progress',
        priority: 'high',
        createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
      {
        id: 'tc_2',
        title: 'Unable to connect API Webhook endpoints',
        description: 'I am getting a 403 forbidden error whenever your platform tries to trigger our endpoint webhook, although manual testing with postman is working perfectly. Are there specific support IP ranges we need to whitelist in our AWS Security Groups?',
        customerId: 'usr_cust_1',
        customerName: 'Sarah Jenkins',
        customerEmail: 'customer@example.com',
        agentId: 'usr_agent_1',
        agentName: 'Michael Chen',
        status: 'open',
        priority: 'medium',
        createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
      },
      {
        id: 'tc_3',
        title: 'Custom Domain Setup for Knowledge Base',
        description: 'Our team wants to link our own help.acme.com subdomain to direct customers to our support center. We populated the CNAME records in Cloudflare, but the SSL handsake keeps failing with a TLS error. Please advise!',
        customerId: 'usr_cust_1',
        customerName: 'Sarah Jenkins',
        agentId: 'usr_agent_1',
        agentName: 'Michael Chen',
        status: 'resolved',
        priority: 'low',
        createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      },
    ];

    defaultTickets.forEach(t => this.db.tickets.push(t));

    const defaultActivities: TicketActivity[] = [
      {
        id: 'act_seed_1',
        ticketId: 'tc_1',
        actorId: 'usr_cust_1',
        actorName: 'Sarah Jenkins',
        actorRole: 'customer',
        type: 'creation',
        message: 'Sarah Jenkins created double charge billing support ticket.',
        createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      },
      {
        id: 'act_seed_2',
        ticketId: 'tc_1',
        actorId: 'usr_agent_2',
        actorName: 'Emma Watson',
        actorRole: 'agent',
        type: 'reassignment',
        message: 'Michael Chen reassigned this billing ticket to billing specialist Emma Watson.',
        createdAt: new Date(Date.now() - 3.8 * 3600000).toISOString(),
      },
      {
        id: 'act_seed_3',
        ticketId: 'tc_1',
        actorId: 'usr_agent_2',
        actorName: 'Emma Watson',
        actorRole: 'agent',
        type: 'status_change',
        message: 'Emma Watson updated ticket status to In Progress.',
        createdAt: new Date(Date.now() - 3.5 * 3600000).toISOString(),
      },
      {
        id: 'act_seed_4',
        ticketId: 'tc_1',
        actorId: 'usr_agent_2',
        actorName: 'Emma Watson',
        actorRole: 'agent',
        type: 'note',
        message: 'Emma Watson added diagnostic event log note:',
        noteText: 'Initiated duplicate charge void request via Stripe dashboard. Void terminal code: STRIPE_VOID_4402.',
        createdAt: new Date(Date.now() - 3.4 * 3600000).toISOString(),
      },
      {
        id: 'act_seed_5',
        ticketId: 'tc_2',
        actorId: 'usr_cust_1',
        actorName: 'Sarah Jenkins',
        actorRole: 'customer',
        type: 'creation',
        message: 'Sarah Jenkins created API webhook networking query.',
        createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
      },
    ];
    this.db.activities = defaultActivities;

    const defaultConversations: Conversation[] = [
      {
        id: 'conv_tc_1',
        ticketId: 'tc_1',
        customerId: 'usr_cust_1',
        customerName: 'Sarah Jenkins',
        customerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        agentId: 'usr_agent_2',
        agentName: 'Emma Watson',
        status: 'open',
        lastMessageText: 'Just double check the records. Let me know details.',
        lastMessageTime: new Date(Date.now() - 2 * 3600000).toISOString(),
        unreadCount: 0,
        createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
      {
        id: 'conv_tc_2',
        ticketId: 'tc_2',
        customerId: 'usr_cust_1',
        customerName: 'Sarah Jenkins',
        customerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        agentId: 'usr_agent_1',
        agentName: 'Michael Chen',
        status: 'open',
        lastMessageText: 'Let me look at your server logs. Send details soon.',
        lastMessageTime: new Date(Date.now() - 8 * 3600000).toISOString(),
        unreadCount: 1,
        createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
      },
    ];

    defaultConversations.forEach(c => this.db.conversations.push(c));

    const defaultMessages: Message[] = [
      {
        id: 'msg_1',
        conversationId: 'conv_tc_1',
        senderId: 'usr_cust_1',
        senderName: 'Sarah Jenkins',
        senderRole: 'customer',
        text: 'Hi Emma, I noticed two separate charges of $149 on our card statement instead of one yesterday. Below is the screenshot from our bank statement.',
        isRead: true,
        sentiment: 'negative',
        createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      },
      {
        id: 'msg_2',
        conversationId: 'conv_tc_1',
        senderId: 'usr_agent_2',
        senderName: 'Emma Watson',
        senderRole: 'agent',
        text: 'Hello Sarah! I see what happened. Our stripe terminal had a minor retry delay which initiated two charge requests. I am initiating a refund immediately. Please expect it in 2-3 business days.',
        isRead: true,
        createdAt: new Date(Date.now() - 3.5 * 3600000).toISOString(),
      },
      {
        id: 'msg_3',
        conversationId: 'conv_tc_1',
        senderId: 'usr_cust_1',
        senderName: 'Sarah Jenkins',
        senderRole: 'customer',
        text: 'Perfect! Thank you so much for the quick response. Just double check the records and ensure our dashboard subscription remains active.',
        isRead: true,
        sentiment: 'positive',
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
      {
        id: 'msg_4',
        conversationId: 'conv_tc_2',
        senderId: 'usr_cust_1',
        senderName: 'Sarah Jenkins',
        senderRole: 'customer',
        text: 'Hello Michael! We cannot receive webhook triggers onto our internal API Gateway. Do you have specific security IPs?',
        isRead: true,
        sentiment: 'negative',
        createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
      },
    ];

    defaultMessages.forEach(m => this.db.messages.push(m));

    const defaultNotifications: Notification[] = [
      {
        id: 'nt_1',
        userId: 'usr_agent_1',
        text: 'New Ticket Assigned: Webhook connection issue from Acme Corp.',
        type: 'ticket',
        isRead: false,
        ticketId: 'tc_2',
        createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
      },
    ];

    defaultNotifications.forEach(n => this.db.notifications.push(n));

    this.save();
  }

  // --- QUERY APIS ---

  public getUsers(): User[] {
    return this.db.users;
  }

  public getUserByEmail(email: string): User | undefined {
    return this.db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: string): User | undefined {
    return this.db.users.find(u => u.id === id);
  }

  public getUserPasswordHash(userId: string): string | undefined {
    return this.db.passwords[userId];
  }

  public createUser(user: Omit<User, 'id' | 'createdAt'>, pass: string): User {
    const newUser: User = {
      ...user,
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    this.db.users.push(newUser);
    const hash = hashPassword(pass);
    this.db.passwords[newUser.id] = hash;

    // Persist to Postgres
    db.insert(schema.users).values({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      avatar: newUser.avatar || null,
      status: newUser.status || null,
      company: newUser.company || null,
      phone: newUser.phone || null,
      bio: newUser.bio || null,
      createdAt: newUser.createdAt,
    }).then(() => {
      return db.insert(schema.passwords).values({
        userId: newUser.id,
        passwordHash: hash,
      });
    }).catch(err => {
      console.error('PostgreSQL write failure on createUser:', err);
    });

    this.save();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const userIndex = this.db.users.findIndex(u => u.id === id);
    if (userIndex === -1) return undefined;
    
    this.db.users[userIndex] = { ...this.db.users[userIndex], ...updates };

    // Persist to Postgres
    db.update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, id))
      .catch(err => {
        console.error('PostgreSQL write failure on updateUser:', err);
      });

    this.save();
    return this.db.users[userIndex];
  }

  public createActivity(activity: Omit<TicketActivity, 'id' | 'createdAt'>): TicketActivity {
    if (!this.db.activities) {
      this.db.activities = [];
    }
    const newAct: TicketActivity = {
      ...activity,
      id: 'act_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    this.db.activities.push(newAct);

    // Persist to Postgres
    db.insert(schema.activities)
      .values({
        id: newAct.id,
        ticketId: newAct.ticketId,
        actorId: newAct.actorId,
        actorName: newAct.actorName,
        actorRole: newAct.actorRole,
        type: newAct.type,
        message: newAct.message,
        noteText: newAct.noteText,
        createdAt: newAct.createdAt,
      })
      .catch(err => {
        console.error('PostgreSQL write failure on createActivity:', err);
      });

    this.save();
    return newAct;
  }

  public getTickets(): Ticket[] {
    return this.db.tickets.map(t => ({
      ...t,
      activities: this.db.activities ? this.db.activities.filter(a => a.ticketId === t.id) : []
    }));
  }

  public getTicketById(id: string): Ticket | undefined {
    const t = this.db.tickets.find(x => x.id === id);
    if (!t) return undefined;
    return {
      ...t,
      activities: this.db.activities ? this.db.activities.filter(a => a.ticketId === t.id) : []
    };
  }

  public createTicket(ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'activities'>): Ticket {
    const newTicket: Ticket = {
      ...ticket,
      id: 'tc_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.db.tickets.push(newTicket);

    const cust = this.getUserById(ticket.customerId);
    
    // Log ticket creation activity
    this.createActivity({
      ticketId: newTicket.id,
      actorId: ticket.customerId,
      actorName: cust?.name || 'Customer',
      actorRole: 'customer',
      type: 'creation',
      message: `${cust?.name || 'Customer'} created custom ticket "${newTicket.title}"`,
    });

    // Automatically spawn empty conversation as well
    this.createConversation({
      ticketId: newTicket.id,
      customerId: ticket.customerId,
      customerName: cust?.name || 'Customer',
      customerAvatar: cust?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      agentId: ticket.agentId,
      agentName: ticket.agentId ? (this.getUserById(ticket.agentId)?.name || 'Agent') : undefined,
      status: 'open',
    });

    // Persist to Postgres
    db.insert(schema.tickets)
      .values({
        id: newTicket.id,
        title: newTicket.title,
        description: newTicket.description,
        customerId: newTicket.customerId,
        customerName: newTicket.customerName,
        customerEmail: newTicket.customerEmail || cust?.email,
        agentId: newTicket.agentId || null,
        agentName: newTicket.agentName || null,
        status: newTicket.status,
        priority: newTicket.priority,
        createdAt: newTicket.createdAt,
        updatedAt: newTicket.updatedAt,
        category: newTicket.category || null,
        sentiment: newTicket.sentiment || null,
        firstResponseMinutes: newTicket.firstResponseMinutes || null,
        resolutionMinutes: newTicket.resolutionMinutes || null,
        tags: newTicket.tags ? newTicket.tags.join(',') : '',
      })
      .catch(err => {
        console.error('PostgreSQL write failure on createTicket:', err);
      });

    this.save();
    return newTicket;
  }

  public updateTicket(id: string, updates: Partial<Ticket> & { status?: string }, actor?: User): Ticket | undefined {
    const index = this.db.tickets.findIndex(t => t.id === id);
    if (index === -1) return undefined;

    const currentTicket = this.db.tickets[index];
    const statusVal = updates.status as Ticket['status'] | undefined;

    // Detect status changes to record logs
    if (statusVal && statusVal !== currentTicket.status) {
      this.createActivity({
        ticketId: id,
        actorId: actor?.id || 'system',
        actorName: actor?.name || 'System Operator',
        actorRole: actor?.role || 'admin',
        type: 'status_change',
        message: `${actor?.name || 'User'} updated status to "${statusVal.replace('_', ' ')}"`,
      });
    }

    // Detect reassignment to record logs
    if (updates.agentId !== undefined && updates.agentId !== currentTicket.agentId) {
      const prevRep = currentTicket.agentId ? (this.getUserById(currentTicket.agentId)?.name || 'Agent') : 'Unassigned Pool';
      const newRepName = updates.agentId ? (this.getUserById(updates.agentId)?.name || 'Agent') : 'Unassigned Pool';
      
      this.createActivity({
        ticketId: id,
        actorId: actor?.id || 'system',
        actorName: actor?.name || 'System Operator',
        actorRole: actor?.role || 'admin',
        type: 'reassignment',
        message: `${actor?.name || 'User'} changed assignment from "${prevRep}" to "${newRepName}"`,
      });
    }
    
    this.db.tickets[index] = {
      ...currentTicket,
      ...updates,
      status: statusVal || currentTicket.status,
      updatedAt: new Date().toISOString(),
    };

    // Keep conversation status updated too
    const conv = this.db.conversations.find(c => c.ticketId === id);
    if (conv) {
      if (updates.status === 'resolved' || updates.status === 'closed') {
        conv.status = updates.status;
      } else {
        conv.status = 'open';
      }
      conv.agentId = this.db.tickets[index].agentId;
      conv.agentName = this.db.tickets[index].agentId ? (this.getUserById(this.db.tickets[index].agentId!)?.name || 'Agent') : undefined;
      conv.updatedAt = new Date().toISOString();

      // Update conversation in Postgres
      db.update(schema.conversations)
        .set({
          status: conv.status,
          agentId: conv.agentId || null,
          agentName: conv.agentName || null,
          updatedAt: conv.updatedAt,
        })
        .where(eq(schema.conversations.id, conv.id))
        .catch(err => {
          console.error('PostgreSQL conversation update failure inside updateTicket:', err);
        });
    }

    // Persist ticket changes to Postgres
    db.update(schema.tickets)
      .set({
        title: updates.title,
        description: updates.description,
        agentId: updates.agentId || null,
        agentName: updates.agentName || null,
        status: statusVal || currentTicket.status,
        priority: updates.priority,
        updatedAt: this.db.tickets[index].updatedAt,
        category: updates.category,
        sentiment: updates.sentiment,
        firstResponseMinutes: updates.firstResponseMinutes,
        resolutionMinutes: updates.resolutionMinutes,
        tags: updates.tags ? updates.tags.join(',') : undefined,
      })
      .where(eq(schema.tickets.id, id))
      .catch(err => {
        console.error('PostgreSQL ticket update failure:', err);
      });

    this.save();
    return this.db.tickets[index];
  }

  public getConversations(): Conversation[] {
    return this.db.conversations;
  }

  public getConversationById(id: string): Conversation | undefined {
    return this.db.conversations.find(c => c.id === id);
  }

  public getConversationByTicketId(ticketId: string): Conversation | undefined {
    return this.db.conversations.find(c => c.ticketId === ticketId);
  }

  public createConversation(conv: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>): Conversation {
    const newConv: Conversation = {
      ...conv,
      id: 'conv_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.db.conversations.push(newConv);

    // Persist to Postgres
    db.insert(schema.conversations)
      .values({
        id: newConv.id,
        ticketId: newConv.ticketId || null,
        customerId: newConv.customerId,
        customerName: newConv.customerName,
        customerAvatar: newConv.customerAvatar,
        agentId: newConv.agentId || null,
        agentName: newConv.agentName || null,
        status: newConv.status,
        lastMessageText: newConv.lastMessageText || null,
        lastMessageTime: newConv.lastMessageTime || null,
        unreadCount: newConv.unreadCount || 0,
        createdAt: newConv.createdAt,
        updatedAt: newConv.updatedAt,
      })
      .catch(err => {
        console.error('PostgreSQL write failure on createConversation:', err);
      });

    this.save();
    return newConv;
  }

  public updateConversation(id: string, updates: Partial<Conversation>): Conversation | undefined {
    const index = this.db.conversations.findIndex(c => c.id === id);
    if (index === -1) return undefined;
    this.db.conversations[index] = {
      ...this.db.conversations[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Persist to Postgres
    db.update(schema.conversations)
      .set(updates)
      .where(eq(schema.conversations.id, id))
      .catch(err => {
        console.error('PostgreSQL write failure on updateConversation:', err);
      });

    this.save();
    return this.db.conversations[index];
  }

  public getMessages(conversationId: string): Message[] {
    return this.db.messages.filter(m => m.conversationId === conversationId);
  }

  public createMessage(msg: Omit<Message, 'id' | 'createdAt'>): Message {
    const newMessage: Message = {
      ...msg,
      id: 'msg_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    this.db.messages.push(newMessage);

    // Update conversation metadata
    const conv = this.getConversationById(msg.conversationId);
    if (conv) {
      conv.lastMessageText = msg.text;
      conv.lastMessageTime = newMessage.createdAt;
      conv.updatedAt = newMessage.createdAt;

      db.update(schema.conversations)
        .set({
          lastMessageText: conv.lastMessageText,
          lastMessageTime: conv.lastMessageTime,
          updatedAt: conv.updatedAt,
        })
        .where(eq(schema.conversations.id, conv.id))
        .catch(err => {
          console.error('PostgreSQL conversation update failure inside createMessage:', err);
        });
    }

    // Persist message to Postgres
    db.insert(schema.messages)
      .values({
        id: newMessage.id,
        conversationId: newMessage.conversationId,
        senderId: newMessage.senderId,
        senderName: newMessage.senderName,
        senderRole: newMessage.senderRole,
        text: newMessage.text,
        sentiment: newMessage.sentiment || null,
        isRead: newMessage.isRead || false,
        isBot: newMessage.isBot || false,
        createdAt: newMessage.createdAt,
      })
      .catch(err => {
        console.error('PostgreSQL write failure on createMessage:', err);
      });

    this.save();
    return newMessage;
  }

  public markMessagesAsRead(conversationId: string, currentUserId: string): void {
    let changed = false;
    this.db.messages.forEach(m => {
      if (m.conversationId === conversationId && m.senderId !== currentUserId && !m.isRead) {
        m.isRead = true;
        changed = true;
      }
    });

    const conv = this.getConversationById(conversationId);
    if (conv && conv.customerId === currentUserId) {
      conv.unreadCount = 0;
      changed = true;
    }

    // Persist read updates to Postgres
    db.update(schema.messages)
      .set({ isRead: true })
      .where(eq(schema.messages.conversationId, conversationId))
      .catch(err => {
        console.error('PostgreSQL message state update failure on markMessagesAsRead:', err);
      });

    if (conv) {
      db.update(schema.conversations)
        .set({ unreadCount: 0 })
        .where(eq(schema.conversations.id, conversationId))
        .catch(err => {
          console.error('PostgreSQL conversation unread update failure:', err);
        });
    }

    if (changed) {
      this.save();
    }
  }

  public getNotifications(userId: string): Notification[] {
    return this.db.notifications.filter(n => n.userId === userId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createNotification(not: Omit<Notification, 'id' | 'createdAt'>): Notification {
    const newNot: Notification = {
      ...not,
      id: 'nt_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    this.db.notifications.push(newNot);

    // Persist to Postgres
    db.insert(schema.notifications)
      .values({
        id: newNot.id,
        userId: newNot.userId,
        ticketId: newNot.ticketId || null,
        conversationId: newNot.conversationId || null,
        text: newNot.text,
        type: newNot.type,
        isRead: newNot.isRead || false,
        createdAt: newNot.createdAt,
      })
      .catch(err => {
        console.error('PostgreSQL write failure on createNotification:', err);
      });

    this.save();
    return newNot;
  }

  public markNotificationAsRead(id: string): void {
    const item = this.db.notifications.find(n => n.id === id);
    if (item) {
      item.isRead = true;

      // Persist to Postgres
      db.update(schema.notifications)
        .set({ isRead: true })
        .where(eq(schema.notifications.id, id))
        .catch(err => {
          console.error('PostgreSQL write failure on markNotificationAsRead:', err);
        });

      this.save();
    }
  }

  // --- ANALYTICS ENGINE MODEL ---
  public getSaaSMetrics(): ServiceMetrics {
    const t = this.db.tickets;
    const resolved = t.filter(x => x.status === 'resolved' || x.status === 'closed').length;
    const active = t.filter(x => x.status === 'open' || x.status === 'in_progress').length;

    const priority = {
      low: t.filter(x => x.priority === 'low').length,
      medium: t.filter(x => x.priority === 'medium').length,
      high: t.filter(x => x.priority === 'high').length,
    };

    const statuses = {
      open: t.filter(x => x.status === 'open').length,
      in_progress: t.filter(x => x.status === 'in_progress').length,
      resolved: t.filter(x => x.status === 'resolved').length,
      closed: t.filter(x => x.status === 'closed').length,
    };

    return {
      totalTickets: t.length,
      activeConversations: active,
      resolvedTickets: resolved,
      averageResolutionTimeHours: 14.6,
      customerSatisfactionScore: 94.2,
      ticketsByPriority: priority,
      ticketsByStatus: statuses,
      agentPerformance: [
        {
          agentId: 'usr_agent_1',
          agentName: 'Michael Chen',
          resolvedCount: 14,
          avgResponseMinutes: 12.4,
          rating: 4.8,
        },
        {
          agentId: 'usr_agent_2',
          agentName: 'Emma Watson',
          resolvedCount: 12,
          avgResponseMinutes: 8.5,
          rating: 4.9,
        },
      ],
      dailyResolutionData: [
        { date: 'Mon', resolved: 4, created: 5 },
        { date: 'Tue', resolved: 5, created: 7 },
        { date: 'Wed', resolved: 9, created: 8 },
        { date: 'Thu', resolved: 8, created: 6 },
        { date: 'Fri', resolved: 12, created: 10 },
        { date: 'Sat', resolved: 6, created: 4 },
        { date: 'Sun', resolved: 5, created: 3 },
      ],
      slaHourlyData: (() => {
        const arr = [];
        const now = new Date();
        for (let i = 23; i >= 0; i--) {
          const hourDate = new Date(now.getTime() - i * 3600000);
          let hours = hourDate.getHours();
          const ampm = hours >= 12 ? 'PM' : 'AM';
          hours = hours % 12;
          hours = hours ? hours : 12;
          const hourString = `${hours.toString().padStart(2, '0')} ${ampm}`;

          const seed = (hourDate.getHours() + hourDate.getDate()) % 15;
          const ticketsInHour = t.filter(x => {
            const tDate = new Date(x.createdAt);
            const diffMs = Math.abs(tDate.getTime() - hourDate.getTime());
            return diffMs < 3600000;
          });

          let avgResponse = 10 + (seed % 8);
          let hThroughput = ticketsInHour.length;
          let hSlaRate = 92 + (seed % 6);

          if (hThroughput === 0) {
            hThroughput = 1 + (seed % 4);
          } else {
            avgResponse = Math.max(4, avgResponse - ticketsInHour.length);
            hSlaRate = Math.min(100, hSlaRate + 2);
          }

          arr.push({
            hour: hourString,
            avgResponseMinutes: parseFloat(avgResponse.toFixed(1)),
            throughput: hThroughput,
            slaMetRate: Math.min(100, hSlaRate),
          });
        }
        return arr;
      })(),
      resolutionTimeTrend: (() => {
        const trend = [];
        const now = new Date();
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
          const dateString = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          
          const seed = (d.getDate() + d.getMonth()) % 20;
          const avgResMin = 13 + (seed % 6) + Math.cos(i / 2) * 2.5;
          const slaMet = Math.min(100, Math.max(75, 94 + Math.sin(i / 2) * 4.5 + (seed % 2)));
          
          trend.push({
            date: dateString,
            averageResolutionMinutes: parseFloat(Math.max(4, avgResMin).toFixed(1)),
            slaThresholdMinutes: 15,
            slaMetRatePercent: parseFloat(slaMet.toFixed(1)),
          });
        }
        return trend;
      })(),
    };
  }
}

export const dbStore = new DiskDatabase();
export default dbStore;
