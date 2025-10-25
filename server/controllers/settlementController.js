const Expense = require('../models/Expense');
const Trip = require('../models/Trip');

// @desc    Calculate settlement for a trip
// @route   GET /api/trips/:tripId/settlement
// @access  Private
const calculateSettlement = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId)
      .populate('members', 'name email');

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check if user is part of the trip
    const isMember = trip.members.some(member => member._id.toString() === req.user.id);
    const isCreator = trip.createdBy.toString() === req.user.id;

    if (!isMember && !isCreator) {
      return res.status(403).json({ message: 'Not authorized to view settlement' });
    }

    // Get all expenses for this trip
    const expenses = await Expense.find({ tripId: req.params.tripId })
      .populate('paidBy', 'name email')
      .populate('splitAmong', 'name email');

    // Calculate balances for each member
    const balances = {};
    
    // Initialize balances for all members
    trip.members.forEach(member => {
      balances[member._id.toString()] = {
        userId: member._id,
        name: member.name,
        email: member.email,
        paid: 0,
        share: 0,
        balance: 0
      };
    });

    // Calculate what each person paid and their share
    expenses.forEach(expense => {
      const paidById = expense.paidBy._id.toString();
      const sharePerPerson = expense.amount / expense.splitAmong.length;

      // Add to the amount this person paid
      if (balances[paidById]) {
        balances[paidById].paid += expense.amount;
      }

      // Add to each person's share
      expense.splitAmong.forEach(member => {
        const memberId = member._id.toString();
        if (balances[memberId]) {
          balances[memberId].share += sharePerPerson;
        }
      });
    });

    // Calculate final balance (positive = owed money, negative = owes money)
    Object.keys(balances).forEach(userId => {
      balances[userId].balance = balances[userId].paid - balances[userId].share;
    });

    // Generate settlement transactions (who owes whom)
    const transactions = calculateTransactions(balances);

    // Convert balances object to array for response
    const balanceArray = Object.values(balances).map(b => ({
      userId: b.userId,
      name: b.name,
      email: b.email,
      paid: parseFloat(b.paid.toFixed(2)),
      share: parseFloat(b.share.toFixed(2)),
      balance: parseFloat(b.balance.toFixed(2))
    }));

    res.json({
      balances: balanceArray,
      transactions,
      totalExpenses: trip.totalExpenses
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to calculate optimal transactions
const calculateTransactions = (balances) => {
  const transactions = [];
  
  // Separate creditors (positive balance) and debtors (negative balance)
  const creditors = [];
  const debtors = [];

  Object.values(balances).forEach(person => {
    if (person.balance > 0.01) { // They are owed money
      creditors.push({ ...person });
    } else if (person.balance < -0.01) { // They owe money
      debtors.push({ ...person });
    }
  });

  // Sort creditors (descending) and debtors (ascending)
  creditors.sort((a, b) => b.balance - a.balance);
  debtors.sort((a, b) => a.balance - b.balance);

  let i = 0, j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const amountToSettle = Math.min(creditor.balance, Math.abs(debtor.balance));

    if (amountToSettle > 0.01) {
      transactions.push({
        from: {
          userId: debtor.userId,
          name: debtor.name,
          email: debtor.email
        },
        to: {
          userId: creditor.userId,
          name: creditor.name,
          email: creditor.email
        },
        amount: parseFloat(amountToSettle.toFixed(2))
      });
    }

    creditor.balance -= amountToSettle;
    debtor.balance += amountToSettle;

    if (creditor.balance < 0.01) i++;
    if (Math.abs(debtor.balance) < 0.01) j++;
  }

  return transactions;
};

module.exports = { calculateSettlement };
