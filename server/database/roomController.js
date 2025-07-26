const Room = require('../models/room');
const { v4: uuidv4 } = require('uuid');

async function createRoom() {
  const roomId = uuidv4().slice(0, 8);
  const room = new Room({ roomId });
  await room.save();
  return roomId;
}

async function roomExists(roomId) {
  const room = await Room.findOne({ roomId });
  return !!room;
}


async function deleteRoom(roomId) {
  return await Room.deleteOne({ roomId });
}

module.exports = {
  createRoom,
  roomExists,
  deleteRoom
};
