const Expense = require('../models/Expense');
const Trip = require('../models/Trip');

// @desc    Get all expenses for a trip
// @route   GET /api/trips/:tripId/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check if user is part of the trip
    const isMember = trip.members.includes(req.user.id);
    const isCreator = trip.createdBy.toString() === req.user.id;

    if (!isMember && !isCreator) {
      return res.status(403).json({ message: 'Not authorized to view expenses' });
    }

    const expenses = await Expense.find({ tripId: req.params.tripId })
      .populate('paidBy', 'name email')
      .populate('splitAmong', 'name email')
      .sort({ date: -1 });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('paidBy', 'name email')
      .populate('splitAmong', 'name email')
      .populate('tripId');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check authorization
    const trip = await Trip.findById(expense.tripId);
    const isMember = trip.members.includes(req.user.id);
    const isCreator = trip.createdBy.toString() === req.user.id;

    if (!isMember && !isCreator) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add expense to trip
// @route   POST /api/trips/:tripId/expenses
// @access  Private
const addExpense = async (req, res) => {
  try {
    const { description, amount, paidBy, splitAmong, category, date } = req.body;

    // Validate required fields
    if (!description || !amount || !paidBy) {
      return res.status(400).json({ message: 'Please provide description, amount, and paidBy' });
    }

    const trip = await Trip.findById(req.params.tripId);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check if user is part of the trip
    const isMember = trip.members.some(member => member.toString() === req.user.id);
    const isCreator = trip.createdBy.toString() === req.user.id;

    if (!isMember && !isCreator) {
      return res.status(403).json({ message: 'Not authorized to add expenses' });
    }

    // If splitAmong is not provided, split among all members
    const splitList = splitAmong && splitAmong.length > 0 
      ? splitAmong 
      : trip.members;

    // Create expense
    const expense = await Expense.create({
      tripId: req.params.tripId,
      description,
      amount,
      paidBy,
      splitAmong: splitList,
      category: category || 'other',
      date: date || Date.now()
    });

    // Add expense to trip and update total
    trip.expenses.push(expense._id);
    trip.totalExpenses = (trip.totalExpenses || 0) + parseFloat(amount);
    await trip.save();

    // Populate and return
    const populatedExpense = await Expense.findById(expense._id)
      .populate('paidBy', 'name email')
      .populate('splitAmong', 'name email');

    res.status(201).json(populatedExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const trip = await Trip.findById(expense.tripId);

    // Only the person who paid or trip creator can update
    const canUpdate = expense.paidBy.toString() === req.user.id || 
                      trip.createdBy.toString() === req.user.id;

    if (!canUpdate) {
      return res.status(403).json({ message: 'Not authorized to update this expense' });
    }

    const oldAmount = expense.amount;
    const { description, amount, category, date, splitAmong } = req.body;

    if (description) expense.description = description;
    if (amount) expense.amount = amount;
    if (category) expense.category = category;
    if (date) expense.date = date;
    if (splitAmong) expense.splitAmong = splitAmong;

    await expense.save();

    // Update trip total if amount changed
    if (amount && amount !== oldAmount) {
      trip.totalExpenses = trip.totalExpenses - oldAmount + parseFloat(amount);
      await trip.save();
    }

    const updatedExpense = await Expense.findById(expense._id)
      .populate('paidBy', 'name email')
      .populate('splitAmong', 'name email');

    res.json(updatedExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const trip = await Trip.findById(expense.tripId);

    // Only the person who paid or trip creator can delete
    const canDelete = expense.paidBy.toString() === req.user.id || 
                      trip.createdBy.toString() === req.user.id;

    if (!canDelete) {
      return res.status(403).json({ message: 'Not authorized to delete this expense' });
    }

    // Update trip total and remove from expenses array
    trip.totalExpenses = Math.max(0, trip.totalExpenses - expense.amount);
    trip.expenses = trip.expenses.filter(
      expId => expId.toString() !== expense._id.toString()
    );
    await trip.save();

    await expense.deleteOne();

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getExpenses,
  getExpenseById,
  addExpense,
  updateExpense,
  deleteExpense
};
