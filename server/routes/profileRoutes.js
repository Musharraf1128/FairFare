const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateProfile,
  getMyProfile
} = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/me', getMyProfile);
router.put('/', updateProfile);
router.get('/:userId', getUserProfile);

module.exports = router;
