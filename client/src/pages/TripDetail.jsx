import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/api';
import AddExpenseModal from '../components/AddExpenseModal';
import ExpenseCard from '../components/ExpenseCard';
import SettlementSection from '../components/SettlementSection'; 
import TripChat from '../components/TripChat';

const TripDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState('expenses'); // Add this state

  useEffect(() => {
    fetchTripData();
  }, [id]);

  const fetchTripData = async () => {
    try {
      const [tripRes, expensesRes] = await Promise.all([
        API.get(`/trips/${id}`),
        API.get(`/expenses/${id}/expenses`)
      ]);
      setTrip(tripRes.data);
      setExpenses(expensesRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async () => {
    if (!window.confirm('Are you sure you want to delete this trip?')) return;

    try {
      await API.delete(`/trips/${id}`);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete trip');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      await API.delete(`/expenses/${expenseId}`);
      setExpenses(expenses.filter(exp => exp._id !== expenseId));
      // Refresh trip to update total
      const { data } = await API.get(`/trips/${id}`);
      setTrip(data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  const handleExpenseAdded = async (newExpense) => {
    setExpenses([newExpense, ...expenses]);
    // Refresh trip to update total
    const { data } = await API.get(`/trips/${id}`);
    setTrip(data);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center text-gray-600">Loading trip...</div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'Trip not found'}
        </div>
        <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Back to trips
        </Link>
      </div>
    );
  }

  const isCreator = trip.createdBy._id === user._id;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <Link to="/" className="text-blue-600 hover:underline text-sm mb-2 inline-block">
              ← Back to trips
            </Link>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{trip.name}</h1>
            {trip.description && (
              <p className="text-gray-600">{trip.description}</p>
            )}
            <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
              <span>Created by: {trip.createdBy.name}</span>
              <span>•</span>
              <span>{new Date(trip.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {isCreator && (
            <button
              onClick={handleDeleteTrip}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Delete Trip
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Members */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              👥 Members ({trip.members.length})
            </h2>
            <div className="space-y-3">
              {trip.members.map((member) => (
                <div key={member._id} className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              💰 Summary
            </h2>
            <div className="space-y-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{trip.totalExpenses.toFixed(2)}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Transactions</p>
                <p className="text-2xl font-bold text-green-600">
                  {expenses.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('expenses')}
                className={`flex-1 px-6 py-4 font-semibold transition ${
                  activeTab === 'expenses'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📝 Expenses
              </button>
              <button
                onClick={() => setActiveTab('settlement')}
                className={`flex-1 px-6 py-4 font-semibold transition ${
                  activeTab === 'settlement'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                ⚖️ Settlement
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 px-6 py-4 font-semibold transition ${
                  activeTab === 'chat'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                💬 Chat
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'expenses' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                      All Expenses
                    </h2>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      + Add Expense
                    </button>
                  </div>

                  {expenses.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-4xl mb-2">📊</p>
                      <p>No expenses added yet</p>
                      <p className="text-sm mt-1">Click "Add Expense" to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {expenses.map((expense) => (
                        <ExpenseCard
                          key={expense._id}
                          expense={expense}
                          currentUserId={user._id}
                          onDelete={handleDeleteExpense}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settlement' && (
                <SettlementSection tripId={id} currentUserId={user._id} tripName={trip.name} />
              )}  

              {activeTab === 'chat' && (
                <TripChat tripId={id} members={trip.members} />
              )}          
            </div>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <AddExpenseModal
          tripId={id}
          members={trip.members}
          onClose={() => setShowAddModal(false)}
          onExpenseAdded={handleExpenseAdded}
        />
      )}
    </div>
  );
};

export default TripDetail;
