const Notification = require('../models/Notification');

/**
 * Create a new in-app notification and emit via WebSocket
 * @param {Object} req - Express request object (needed to access req.app.get('io'))
 * @param {Object} payload - Notification payload
 * @param {String} payload.recipient - User ID of the recipient
 * @param {String} payload.type - Notification type ('social_like', 'social_comment', etc.)
 * @param {String} payload.title - Short title
 * @param {String} payload.message - Full message body
 * @param {Object} payload.data - Additional metadata/links
 */
exports.createInAppNotification = async (req, { recipient, type, title, message, data }) => {
    try {
        // Prevent sending notification to self
        if (req.user && req.user._id && req.user._id.toString() === recipient.toString()) {
            return null;
        }

        const notification = new Notification({
            recipient,
            type,
            title,
            message,
            data
        });

        await notification.save();

        // Emit real-time socket event
        if (req && req.app) {
            const io = req.app.get('io');
            if (io) {
                io.to(recipient.toString()).emit('new_notification', notification);
            }
        }

        return notification;
    } catch (err) {
        console.error("Error creating notification: ", err);
        return null;
    }
};
