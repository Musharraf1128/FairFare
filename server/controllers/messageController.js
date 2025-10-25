const Message = require('../models/Message');
const Trip = require('../models/Trip');

// @desc    Get all messages for a trip
// @route   GET /api/trips/:tripId/messages
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { limit = 50, before } = req.query;

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check if user is member
    const isMember = trip.members.some(member => member.toString() === req.user.id);
    const isCreator = trip.createdBy.toString() === req.user.id;

    if (!isMember && !isCreator) {
      return res.status(403).json({ message: 'Not authorized to view messages' });
    }

    // Build query
    const query = { tripId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'name email avatar')
      .populate('relatedExpense', 'description amount')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(messages.reverse()); // Reverse to show oldest first
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send a message
// @route   POST /api/trips/:tripId/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { content, messageType = 'text', relatedExpense } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check if user is member
    const isMember = trip.members.some(member => member.toString() === req.user.id);
    const isCreator = trip.createdBy.toString() === req.user.id;

    if (!isMember && !isCreator) {
      return res.status(403).json({ message: 'Not authorized to send messages' });
    }

    // Create message
    const message = await Message.create({
      tripId,
      sender: req.user.id,
      content: content.trim(),
      messageType,
      relatedExpense,
      readBy: [{ user: req.user.id }] // Mark as read by sender
    });

    // Add message to trip
    trip.messages.push(message._id);
    trip.lastActivity = Date.now();
    await trip.save();

    // Populate and return
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email avatar')
      .populate('relatedExpense', 'description amount');

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark messages as read
// @route   POST /api/trips/:tripId/messages/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { messageIds } = req.body;

    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({ message: 'Message IDs array is required' });
    }

    const messages = await Message.find({
      _id: { $in: messageIds },
      tripId
    });

    // Update each message
    for (const message of messages) {
      const alreadyRead = message.readBy.some(
        read => read.user.toString() === req.user.id
      );
      
      if (!alreadyRead) {
        message.readBy.push({ user: req.user.id });
        await message.save();
      }
    }

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Edit a message
// @route   PUT /api/messages/:messageId
// @access  Private
const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only sender can edit
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this message' });
    }

    // System messages cannot be edited
    if (message.messageType === 'system') {
      return res.status(400).json({ message: 'System messages cannot be edited' });
    }

    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = Date.now();
    await message.save();

    const updatedMessage = await Message.findById(messageId)
      .populate('sender', 'name email avatar')
      .populate('relatedExpense', 'description amount');

    res.json(updatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:messageId
// @access  Private
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only sender can delete
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await message.deleteOne();

    // Remove from trip
    await Trip.findByIdAndUpdate(message.tripId, {
      $pull: { messages: messageId }
    });

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get unread message count for a trip
// @route   GET /api/trips/:tripId/messages/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const { tripId } = req.params;

    const count = await Message.countDocuments({
      tripId,
      'readBy.user': { $ne: req.user.id }
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  markAsRead,
  editMessage,
  deleteMessage,
  getUnreadCount
};
