
const Board = require('../models/board');


async function saveChange(roomId, change) {
  return await Board.create({ roomId, change });
}

async function getBoardHistory(roomId) {
  const docs = await Board.find({ roomId }).sort({ timestamp: 1 });
  return docs.map(doc => doc.change); 
}

async function clearBoard(roomId) {
  return await Board.deleteMany({ roomId });
}

module.exports = {
  saveChange,
  getBoardHistory,
  clearBoard,

  
};
