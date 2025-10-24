const express = require('express');
const router = express.Router();
const {
  getTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  searchUsers
} = require('../controllers/tripController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

router.route('/').get(getTrips).post(createTrip);
router.get('/users/search', searchUsers);
router.route('/:id').get(getTripById).put(updateTrip).delete(deleteTrip);

module.exports = router;
