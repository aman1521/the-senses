const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  code: { type: String, unique: true, index: true },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);
