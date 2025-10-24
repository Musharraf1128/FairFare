import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/api';

const TripDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTrip();
  }, [id]);

  const fetchTrip = async () => {
    try {
      const { data } = await API.get(`/trips/${id}`);
      setTrip(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch trip');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this trip?')) return;

    try {
      await API.delete(`/trips/${id}`);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete trip');
    }
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
    <div className="max-w-5xl mx-auto px-4 py-8">
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
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Delete Trip
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members Section */}
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

        {/* Summary Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              💰 Expense Summary
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{trip.totalExpenses.toFixed(2)}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Number of Expenses</p>
                <p className="text-2xl font-bold text-green-600">
                  {trip.expenses.length}
                </p>
              </div>
            </div>
          </div>

          {/* Expenses Section - Placeholder for Part 3 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                📝 Expenses
              </h2>
              <button
                disabled
                className="bg-gray-300 text-gray-500 px-4 py-2 rounded-lg cursor-not-allowed"
              >
                + Add Expense (Coming in Part 3)
              </button>
            </div>

            {trip.expenses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-4xl mb-2">📊</p>
                <p>No expenses added yet</p>
                <p className="text-sm mt-1">Add expenses in Part 3!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Expenses will be displayed here in Part 3 */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripDetail;
