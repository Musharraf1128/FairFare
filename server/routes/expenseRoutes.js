const express = require('express');
const router = express.Router();
const {
  getExpenses,
  getExpenseById,
  addExpense,
  updateExpense,
  deleteExpense
} = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// Trip expenses routes
router.route('/:tripId/expenses')
  .get(getExpenses)
  .post(addExpense);

// Single expense routes
router.route('/:id')
  .get(getExpenseById)
  .put(updateExpense)
  .delete(deleteExpense);

module.exports = router;
