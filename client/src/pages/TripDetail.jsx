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
        <div className="text-center text-gray-600 dark:text-gray-400">Loading trip...</div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          {error || 'Trip not found'}
        </div>
        <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline mt-4 inline-block">
          ← Back to trips
        </Link>
      </div>
    );
  }

  const isCreator = trip.createdBy._id === user._id;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 fade-in">
      {/* Header */}
      <div className="card mb-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-2 inline-block">
              ← Back to trips
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{trip.name}</h1>
            {trip.description && (
              <p className="text-gray-600 dark:text-gray-400">{trip.description}</p>
            )}
            <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
              <span>Created by: {trip.createdBy.name}</span>
              <span>•</span>
              <span>{new Date(trip.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {isCreator && (
            <button
              onClick={handleDeleteTrip}
              className="btn-danger px-4 py-2 rounded-lg"
            >
              Delete Trip
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Members */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Members ({trip.members.length})
            </h2>
            <div className="space-y-3">
              {trip.members.map((member) => (
                <div key={member._id} className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Summary
            </h2>
            <div className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ₹{trip.totalExpenses.toFixed(2)}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Transactions</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {expenses.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="card">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('expenses')}
                className={`flex-1 px-6 py-4 font-semibold transition ${
                  activeTab === 'expenses'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Expenses
              </button>
              <button
                onClick={() => setActiveTab('settlement')}
                className={`flex-1 px-6 py-4 font-semibold transition ${
                  activeTab === 'settlement'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Settlement
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 px-6 py-4 font-semibold transition ${
                  activeTab === 'chat'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Chat
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'expenses' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      All Expenses
                    </h2>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="btn-primary px-4 py-2 rounded-lg flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Add Expense</span>
                    </button>
                  </div>

                  {expenses.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
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
