const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name}`);

    // Join user to a personal room for direct notifications
    socket.join(`user-${socket.user._id}`);

    socket.on('join-groups', (groupIds) => {
      groupIds.forEach(groupId => {
        socket.join(`group-${groupId}`);
      });
      console.log(`${socket.user.name} joined ${groupIds.length} groups`);
    });

    socket.on('leave-group', (groupId) => {
      socket.leave(`group-${groupId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name}`);
    });
  });

  return io;
};

const emitToGroup = (groupId, event, data) => {
  if (io) io.to(`group-${groupId}`).emit(event, data);
};

const emitToAll = (event, data) => {
  if (io) io.emit(event, data);
};

module.exports = { initializeSocket, emitToGroup, emitToAll };
