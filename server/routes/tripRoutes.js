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
const { calculateSettlement } = require('../controllers/settlementController'); // Add this
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

router.route('/').get(getTrips).post(createTrip);
router.get('/users/search', searchUsers);
router.get('/:tripId/settlement', calculateSettlement); // Add this line
router.route('/:id').get(getTripById).put(updateTrip).delete(deleteTrip);

module.exports = router;
