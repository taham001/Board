const mongoose = require('mongoose');

const board = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now },
  change: {
    type: Object, 
    required: true,
  },
});

module.exports = mongoose.model('Board', board);