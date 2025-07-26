require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const connectDB = require('./database/connectDB');
const { createRoom, roomExists, deleteRoom } = require('./database/roomController');
const {
  saveChange,
  getBoardHistory,
  clearBoard,

} = require('./database/boardController');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);


connectDB();


app.use(express.static(path.join(__dirname, '../client')));

io.on('connection', (socket) => {
  console.log('🔌 New user connected');


  socket.on('create-room', async () => {
    try {
      const roomId = await createRoom();
      socket.join(roomId);
      console.log(`Room created: ${roomId}`);
      socket.emit('room-created', roomId);
    } catch (err) {
      console.error('Failed to create room:', err);
      socket.emit('error', 'Could not create room');
    }
  });


  socket.on('join-room', async (roomId) => {
    try {
      const exists = await roomExists(roomId);
      if (!exists) {
        socket.emit('error', `Room "${roomId}" does not exist`);
        return;
      }

      socket.join(roomId);
      console.log(` User joined room: ${roomId}`);
      socket.emit('joined-room', roomId);


      const pastChanges = await getBoardHistory(roomId);
      pastChanges.forEach(change => {
        socket.emit('canvas-change', { change });
      });
    } catch (err) {
      console.error(' Error joining room:', err);
      socket.emit('error', 'Could not join room');
    }
  });


  socket.on('canvas-change', async ({ roomId, change }) => {
    try {
      socket.to(roomId).emit('canvas-change', { change });
      saveChange(roomId, change)
    } catch (err) {
      console.error(' Failed to save canvas change:', err);
    }
  });

  socket.on('clear-board', async (roomId) => {
    try {
      await clearBoard(roomId);
      socket.to(roomId).emit('clear-board');
    } catch (err) {
      console.error(' Failed to clear board:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(' A user disconnected');
  });
  socket.on('delete-room', async (roomId) => {
    try {
      await deleteRoom(roomId);
      await clearBoard(roomId);
      io.to(roomId).emit('room-deleted');
      io.socketsLeave(roomId);
      console.log(`Room ${roomId} deleted`);
    } catch (err) {
      console.error(' Failed to delete room:', err);
      socket.emit('error', 'Could not delete room');
    }
  });
});


const PORT = process.env.PORT
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
