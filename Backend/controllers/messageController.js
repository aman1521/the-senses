const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

/**
 * Get all conversations for the logged-in user
 */
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user._id.toString(); // Ensure string comparison if needed

        // Find conversations where user is a participant and not archived
        const conversations = await Conversation.find({
            participants: userId,
            archivedBy: { $ne: userId }
        })
            .sort({ updatedAt: -1 })
            .limit(50); // Pagination could be added later

        // Populate participant details (exclude self)
        const populatedConvos = await Promise.all(conversations.map(async (convo) => {
            // Use User model to get other participant's details
            const otherParticipantIds = convo.participants.filter(id => id !== userId);

            // If direct message, fetch the other user
            let otherUsers = [];
            if (otherParticipantIds.length > 0) {
                otherUsers = await User.find({ _id: { $in: otherParticipantIds } })
                    .select('name username profilePicture tier verified headline');
            }

            return {
                ...convo.toObject(),
                otherParticipants: otherUsers
            };
        }));

        res.status(200).json({
            success: true,
            conversations: populatedConvos
        });

    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve conversations'
        });
    }
};

/**
 * Get messages inside a conversation
 */
exports.getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id.toString();

        // Verify access
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: userId
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found or access denied'
            });
        }

        const messages = await Message.find({ conversationId })
            .sort({ createdAt: 1 }) // Chronological order
            .limit(100);

        res.status(200).json({
            success: true,
            messages
        });

    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve messages'
        });
    }
};

/**
 * Send a message
 */
exports.sendMessage = async (req, res) => {
    try {
        const { recipientId, content, conversationId } = req.body;
        const senderId = req.user._id.toString();

        let targetConversationId = conversationId;

        // If no conversationId, check if one exists or create new
        if (!targetConversationId) {
            // Check for existing direct conversation
            const existingConvo = await Conversation.findOne({
                participants: { $all: [senderId, recipientId], $size: 2 },
                channelType: 'direct'
            });

            if (existingConvo) {
                targetConversationId = existingConvo._id;
                // Unarchive if archived
                if (existingConvo.archivedBy.includes(senderId)) {
                    await Conversation.findByIdAndUpdate(existingConvo._id, { $pull: { archivedBy: senderId } });
                }
                if (existingConvo.archivedBy.includes(recipientId)) {
                    await Conversation.findByIdAndUpdate(existingConvo._id, { $pull: { archivedBy: recipientId } });
                }
            } else {
                // Create new conversation
                const newConvo = await Conversation.create({
                    _id: uuidv4(),
                    participants: [senderId, recipientId],
                    channelType: 'direct',
                    updatedAt: new Date(), // Manually set
                    lastMessage: {
                        content,
                        sender: senderId,
                        createdAt: new Date(),
                        read: false
                    }
                });
                targetConversationId = newConvo._id;
            }
        }

        // Create message
        const newMessage = await Message.create({
            conversationId: targetConversationId,
            sender: senderId,
            recipient: recipientId || (await getRecipientFromConvo(targetConversationId, senderId)), // Helper needed if only convoId provided
            content,
            createdAt: new Date()
        });

        // Update conversation last message
        await Conversation.findByIdAndUpdate(targetConversationId, {
            lastMessage: {
                content,
                sender: senderId,
                createdAt: new Date(),
                read: false
            },
            updatedAt: new Date()
        });

        res.status(201).json({
            success: true,
            message: newMessage,
            conversationId: targetConversationId
        });

    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message'
        });
    }
};

// Helper to find recipient if only conversation ID is known
async function getRecipientFromConvo(conversationId, senderId) {
    const convo = await Conversation.findById(conversationId);
    if (!convo) return null;
    return convo.participants.find(p => p !== senderId);
}

/**
 * Mark messages as read
 */
exports.markAsRead = async (req, res) => {
    try {
        const { conversationId } = req.body;
        const userId = req.user._id.toString();

        // Update messages
        await Message.updateMany(
            { conversationId, recipient: userId, read: false },
            { $set: { read: true } }
        );

        // Update conversation last message status if applicable
        const convo = await Conversation.findById(conversationId);
        if (convo && convo.lastMessage && convo.lastMessage.sender !== userId) {
            await Conversation.findByIdAndUpdate(conversationId, {
                'lastMessage.read': true
            });
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error marking read:', error);
        res.status(500).json({ success: false, message: 'Failed to mark read' });
    }
};
