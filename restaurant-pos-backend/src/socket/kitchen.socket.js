import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

let io = null;

export const initializeKitchenSocket = (socketIO) => {
  io = socketIO;

  // Middleware for socket authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      socket.user = decoded;
      next();
    } catch (error) {
      return next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} | User: ${socket.user.userId} | Role: ${socket.user.role}`);

    // Join kitchen room if user has correct role
    socket.on('kitchen:join', () => {
      const allowedRoles = ['kitchen', 'admin'];

      if (!allowedRoles.includes(socket.user.role)) {
        socket.emit('kitchen:error', {
          message: `Access denied. Your role "${socket.user.role}" cannot join kitchen room.`,
        });
        return;
      }

      socket.join('kitchen');
      console.log(`👨‍🍳 User ${socket.user.userId} joined kitchen room`);

      socket.emit('kitchen:joined', {
        message: 'Successfully joined kitchen room',
        userId: socket.user.userId,
        role: socket.user.role,
      });
    });

    // Leave kitchen room
    socket.on('kitchen:leave', () => {
      socket.leave('kitchen');
      console.log(`👋 User ${socket.user.userId} left kitchen room`);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`❌ Socket disconnected: ${socket.id} | Reason: ${reason}`);
    });
  });

  console.log('🔧 Kitchen socket initialized');
};

// Get IO instance for emitting from other modules
export const getIO = () => io;

// Emit new order to kitchen
export const emitNewOrder = (ticket) => {
  if (io) {
    io.to('kitchen').emit('kitchen:new_order', {
      type: 'new_order',
      ticket,
    });
    console.log(`📤 Emitted new order to kitchen: ${ticket.id}`);
  }
};

// Emit ticket update to kitchen
export const emitTicketUpdate = (ticket) => {
  if (io) {
    io.to('kitchen').emit('kitchen:update', {
      type: 'status_change',
      ticket,
    });
    console.log(`📤 Emitted ticket update to kitchen: ${ticket.id} → ${ticket.status}`);
  }
};