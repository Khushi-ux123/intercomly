import { pgTable, text, integer, boolean } from "drizzle-orm/pg-core";

// Users table mapping
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull(), // 'customer' | 'agent' | 'admin'
  avatar: text("avatar"),
  status: text("status").default("offline"),
  company: text("company"),
  phone: text("phone"),
  bio: text("bio"),
  createdAt: text("created_at").notNull(),
});

// Passwords table mapping
export const passwords = pgTable("passwords", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  passwordHash: text("password_hash").notNull(),
});

// Tickets table mapping
export const tickets = pgTable("tickets", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  customerId: text("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  agentId: text("agent_id").references(() => users.id, { onDelete: "set null" }),
  agentName: text("agent_name"),
  status: text("status").notNull(), // 'open' | 'in_progress' | 'resolved'
  priority: text("priority").notNull(), // 'low' | 'medium' | 'high'
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
  category: text("category"),
  sentiment: text("sentiment"),
  firstResponseMinutes: integer("first_response_minutes"),
  resolutionMinutes: integer("resolution_minutes"),
  tags: text("tags"), // JSON or Comma-separated
});

// Ticket Activities table mapping
export const activities = pgTable("activities", {
  id: text("id").primaryKey(),
  ticketId: text("ticket_id").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  actorId: text("actor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  actorName: text("actor_name").notNull(),
  actorRole: text("actor_role").notNull(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  noteText: text("note_text"),
  createdAt: text("created_at").notNull(),
});

// Conversations table mapping
export const conversations = pgTable("conversations", {
  id: text("id").primaryKey(),
  ticketId: text("ticket_id").references(() => tickets.id, { onDelete: "set null" }),
  customerId: text("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  customerName: text("customer_name").notNull(),
  customerAvatar: text("customer_avatar"),
  agentId: text("agent_id").references(() => users.id, { onDelete: "set null" }),
  agentName: text("agent_name"),
  status: text("status").notNull(),
  lastMessageText: text("last_message_text"),
  lastMessageTime: text("last_message_time"),
  unreadCount: integer("unread_count").default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

// Messages table mapping
export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: text("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  senderName: text("sender_name").notNull(),
  senderRole: text("sender_role").notNull(),
  text: text("text").notNull(),
  sentiment: text("sentiment"),
  isRead: boolean("is_read").default(false),
  isBot: boolean("is_bot").default(false),
  createdAt: text("created_at").notNull(),
});

// Notifications table mapping
export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  ticketId: text("ticket_id").references(() => tickets.id, { onDelete: "cascade" }),
  conversationId: text("conversation_id").references(() => conversations.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  type: text("type").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: text("created_at").notNull(),
});
