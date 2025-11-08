const http = require('http');
const { Server } = require('socket.io');

let io = null;

/**
 * Initialize Socket.io instance
 * @param {http.Server} server - HTTP server instance
 * @returns {Server} - Socket.io server instance
 */
const initializeSocket = (server) => {
  if (!io) {
    io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    // Socket.io connection handling
    io.on('connection', (socket) => {
      console.log(`[SOCKET.IO] Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`[SOCKET.IO] Client disconnected: ${socket.id}`);
      });

      // Handle user joining their own room (for personalized notifications)
      socket.on('join-user-room', (userId) => {
        if (userId) {
          socket.join(`user-${userId}`);
          console.log(`[SOCKET.IO] User ${userId} joined their notification room`);
        }
      });

      // Handle user leaving their room
      socket.on('leave-user-room', (userId) => {
        if (userId) {
          socket.leave(`user-${userId}`);
          console.log(`[SOCKET.IO] User ${userId} left their notification room`);
        }
      });
    });

    console.log(`[SOCKET.IO] Socket.io server initialized`);
  }

  return io;
};

/**
 * Get the Socket.io instance (returns null if not initialized)
 * @returns {Server|null} - Socket.io server instance or null
 */
const getIO = () => {
  return io;
};

module.exports = {
  initializeSocket,
  getIO,
};

