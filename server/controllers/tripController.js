const Trip = require('../models/Trip');
const User = require('../models/User');

// @desc    Get all trips for logged-in user
// @route   GET /api/trips
// @access  Private
const getTrips = async (req, res) => {
  try {
    const trips = await Trip.find({
      $or: [
        { createdBy: req.user.id },
        { members: req.user.id }
      ]
    })
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });

    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single trip
// @route   GET /api/trips/:id
// @access  Private
const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .populate('expenses');

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check if user is part of the trip
    const isMember = trip.members.some(member => member._id.toString() === req.user.id);
    const isCreator = trip.createdBy._id.toString() === req.user.id;

    if (!isMember && !isCreator) {
      return res.status(403).json({ message: 'Not authorized to view this trip' });
    }

    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new trip
// @route   POST /api/trips
// @access  Private
const createTrip = async (req, res) => {
  try {
    const { name, description, memberEmails } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Please provide trip name' });
    }

    // Find users by email
    let members = [];
    if (memberEmails && memberEmails.length > 0) {
      const users = await User.find({ email: { $in: memberEmails } });
      members = users.map(user => user._id);
    }

    // Add creator to members if not already included
    if (!members.includes(req.user.id)) {
      members.push(req.user.id);
    }

    const trip = await Trip.create({
      name,
      description,
      createdBy: req.user.id,
      members
    });

    // Populate the response
    const populatedTrip = await Trip.findById(trip._id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    res.status(201).json(populatedTrip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update trip
// @route   PUT /api/trips/:id
// @access  Private
const updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Only creator can update trip
    if (trip.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this trip' });
    }

    const { name, description, memberEmails } = req.body;

    if (name) trip.name = name;
    if (description !== undefined) trip.description = description;

    // Update members if provided
    if (memberEmails) {
      const users = await User.find({ email: { $in: memberEmails } });
      let members = users.map(user => user._id);
      
      // Ensure creator is in members
      if (!members.includes(req.user.id)) {
        members.push(req.user.id);
      }
      
      trip.members = members;
    }

    await trip.save();

    const updatedTrip = await Trip.findById(trip._id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    res.json(updatedTrip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete trip
// @route   DELETE /api/trips/:id
// @access  Private
const deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Only creator can delete trip
    if (trip.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this trip' });
    }

    await trip.deleteOne();

    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users (for adding members)
// @route   GET /api/trips/users/search
// @access  Private
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.json([]);
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('name email').limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  searchUsers
};
