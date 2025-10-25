const ExpenseCard = ({ expense, currentUserId, onDelete }) => {
  const getCategoryIcon = (category) => {
    const icons = {
      food: '🍔',
      transport: '🚗',
      accommodation: '🏨',
      entertainment: '🎉',
      shopping: '🛍️',
      other: '📝'
    };
    return icons[category] || '📝';
  };

  const sharePerPerson = (expense.amount / expense.splitAmong.length).toFixed(2);
  const isPaidByCurrentUser = expense.paidBy._id === currentUserId;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-2xl">{getCategoryIcon(expense.category)}</span>
            <h3 className="font-semibold text-gray-800">{expense.description}</h3>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex items-center text-gray-600">
              <span className="font-medium">Paid by:</span>
              <span className={`ml-2 ${isPaidByCurrentUser ? 'text-green-600 font-semibold' : ''}`}>
                {expense.paidBy.name}
              </span>
            </div>

            <div className="flex items-center text-gray-600">
              <span className="font-medium">Split among:</span>
              <span className="ml-2">{expense.splitAmong.length} member(s)</span>
            </div>

            <div className="flex items-center text-gray-600">
              <span className="font-medium">Date:</span>
              <span className="ml-2">
                {new Date(expense.date).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center text-gray-500 text-xs">
              <span>₹{sharePerPerson} per person</span>
            </div>
          </div>
        </div>

        <div className="text-right ml-4">
          <p className="text-2xl font-bold text-blue-600">
            ₹{expense.amount.toFixed(2)}
          </p>
          {isPaidByCurrentUser && (
            <button
              onClick={() => onDelete(expense._id)}
              className="mt-2 text-red-500 hover:text-red-700 text-sm"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseCard;
