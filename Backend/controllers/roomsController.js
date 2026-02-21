const Room = require('../models/Room');
const { nanoid } = require('nanoid');

exports.createRoom = async (req, res) => {
  const code = nanoid(6);
  const room = await Room.create({ code, users: [req.user._id] });
  res.json(room);
};

exports.getRoom = async (req, res) => {
  const room = await Room.findOne({ code: req.params.code });
  if (!room) return res.status(404).json({ error: 'not found' });
  res.json(room);
};
