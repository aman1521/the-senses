const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

// GET /api/notifications
router.get('/', auth(), async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({
            recipient: req.user._id,
            read: false
        });

        res.json({ success: true, count: unreadCount, notifications });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', auth(), async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            recipient: req.user._id
        });

        if (!notification) return res.status(404).json({ error: "Notification not found" });

        notification.read = true;
        await notification.save();

        res.json({ success: true, notification });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/notifications/read-all
router.put('/read-all', auth(), async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, read: false },
            { $set: { read: true } }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
