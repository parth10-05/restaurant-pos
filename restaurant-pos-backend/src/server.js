import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { config } from './config/env.js';
import prisma from './prisma/client.js';
import { initializeKitchenSocket } from './socket/kitchen.socket.js';

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.IO
    const io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    // Initialize kitchen socket handlers
    initializeKitchenSocket(io);

    httpServer.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📍 Health check: http://localhost:${config.port}/api/health`);
      console.log(`🔌 WebSocket ready for connections`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();