// Socket Service for SoulSeer (RTC Signaling, Notifications)
const { v4: uuidv4 } = require('uuid');

function initSocket(io) {
  io.on('connection', (socket) => {
    // Join RTC room
    socket.on('joinRoom', ({ session_id, user_id, role }) => {
      socket.join(session_id);
      io.to(session_id).emit('userJoined', { user_id, role });
    });

    // Relay SDP/ICE candidates
    socket.on('signal', ({ session_id, data }) => {
      socket.to(session_id).emit('signal', data);
    });

    // Notify reader of new session request
    socket.on('notifyReader', ({ reader_id, session_id, client_id }) => {
      io.to(reader_id).emit('newReading', { session_id, client_id });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      // Optionally notify room
    });
  });
}

module.exports = { initSocket };
