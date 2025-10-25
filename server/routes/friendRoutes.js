const express = require('express');
const router = express.Router();
const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriends,
  getFriendRequests,
  searchUsers
} = require('../controllers/friendController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getFriends);
router.get('/requests', getFriendRequests);
router.get('/search', searchUsers);
router.post('/request/:userId', sendFriendRequest);
router.post('/accept/:userId', acceptFriendRequest);
router.delete('/reject/:userId', rejectFriendRequest);
router.delete('/:userId', removeFriend);

module.exports = router;
