import express from 'express';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import apiRoutes from './src/server/routes';
import dbStore from './src/server/db.ts';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Initialize PostgreSQL database layer
  await dbStore.init();

  // Global Middlewares
  app.use(express.json());

  // Mount clean REST APIs
  app.use('/api', apiRoutes);

  // Initialize standard network server hooks
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH'],
    },
  });

  // Set Socket.IO event handler for multi-client routing
  io.on('connection', (socket) => {
    // Join conversation rooms for thread-level updates
    socket.on('join', (roomId: string) => {
      socket.join(roomId);
    });

    // Leave conversation rooms
    socket.on('leave', (roomId: string) => {
      socket.leave(roomId);
    });

    // Bridge message routing
    socket.on('message:send', (messagePayload) => {
      // Broadcast specifically to people in that conversation workspace
      io.to(messagePayload.conversationId).emit('message:receive', messagePayload);
    });

    // Bridge client typing indicators
    socket.on('typing:status', (payload: { roomId: string; userId: string; userName: string; isTyping: boolean }) => {
      socket.to(payload.roomId).emit('typing:update', payload);
    });

    // Bridge system presence
    socket.on('user:status', (payload: { userId: string; status: 'online' | 'away' | 'busy' | 'offline' }) => {
      io.emit('status:update', payload);
    });

    // Bridge general ticket events
    socket.on('ticket:alert', (payload: { ticketId: string; title: string; customerId: string }) => {
      io.emit('ticket:notified', payload);
    });

    socket.on('disconnect', () => {
    });
  });

  // Mount Vite assets pipeline for developer preview
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Customer Support Chat system booted at http://localhost:${PORT}`);
  });
}

startServer();
