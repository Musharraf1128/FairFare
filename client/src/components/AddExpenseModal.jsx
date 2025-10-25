import { useState, useEffect } from 'react';
import API from '../utils/api';

const AddExpenseModal = ({ tripId, members, onClose, onExpenseAdded }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    paidBy: '',
    category: 'other',
    date: new Date().toISOString().split('T')[0]
  });
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Select all members by default
    setSelectedMembers(members.map(m => m._id));
  }, [members]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMemberToggle = (memberId) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.paidBy) {
      setError('Please select who paid');
      return;
    }

    if (selectedMembers.length === 0) {
      setError('Please select at least one member to split among');
      return;
    }

    setLoading(true);

    try {
      const { data } = await API.post(`/expenses/${tripId}/expenses`, {
        ...formData,
        splitAmong: selectedMembers
      });

      onExpenseAdded(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Add Expense</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Description */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Description *
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Dinner at restaurant"
              />
            </div>

            {/* Amount and Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="food">🍔 Food</option>
                  <option value="transport">🚗 Transport</option>
                  <option value="accommodation">🏨 Accommodation</option>
                  <option value="entertainment">🎉 Entertainment</option>
                  <option value="shopping">🛍️ Shopping</option>
                  <option value="other">📝 Other</option>
                </select>
              </div>
            </div>

            {/* Date and Paid By */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Paid By *
                </label>
                <select
                  name="paidBy"
                  value={formData.paidBy}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select member</option>
                  {members.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Split Among */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Split Among
              </label>
              <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                {members.map((member) => (
                  <label key={member._id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member._id)}
                      onChange={() => handleMemberToggle(member._id)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">{member.name}</span>
                  </label>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Split equally among {selectedMembers.length} member(s) - 
                ₹{formData.amount ? (parseFloat(formData.amount) / selectedMembers.length).toFixed(2) : '0.00'} each
              </p>
            </div>

            {/* Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-300"
              >
                {loading ? 'Adding...' : 'Add Expense'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddExpenseModal;
