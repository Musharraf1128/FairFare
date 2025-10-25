const express = require('express');
const router = express.Router();
const {
  getMessages,
  sendMessage,
  markAsRead,
  editMessage,
  deleteMessage,
  getUnreadCount
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Trip messages
router.get('/:tripId/messages', getMessages);
router.post('/:tripId/messages', sendMessage);
router.post('/:tripId/messages/read', markAsRead);
router.get('/:tripId/messages/unread-count', getUnreadCount);

// Individual message operations
router.put('/messages/:messageId', editMessage);
router.delete('/messages/:messageId', deleteMessage);

module.exports = router;
