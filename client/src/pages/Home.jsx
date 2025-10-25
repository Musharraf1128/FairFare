import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const Home = () => {
  const { user } = useContext(AuthContext);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const { data } = await API.get('/trips');
      setTrips(data);
      
      // Fetch unread counts for all trips
      const counts = {};
      await Promise.all(
        data.map(async (trip) => {
          try {
            const { data: countData } = await API.get(`/trips/${trip._id}/messages/unread-count`);
            counts[trip._id] = countData.count;
          } catch (err) {
            counts[trip._id] = 0;
          }
        })
      );
      setUnreadCounts(counts);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch trips');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tripId) => {
    if (!window.confirm('Are you sure you want to delete this trip?')) return;

    try {
      await API.delete(`/trips/${tripId}`);
      setTrips(trips.filter(trip => trip._id !== tripId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete trip');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <LoadingSpinner message="Loading your trips..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Trips</h1>
          <p className="text-gray-600 mt-1">Manage your group expenses</p>
        </div>
        <Link
          to="/trips/create"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md hover:shadow-lg"
        >
          + Create Trip
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Trips Grid */}
      {trips.length === 0 ? (
        <EmptyState
          icon="🏖️"
          title="No trips yet"
          message="Create your first trip to start tracking expenses with friends"
          actionText="Create Your First Trip"
          actionLink="/trips/create"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <div
              key={trip._id}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 relative"
            >
              {/* Unread Message Badge */}
              {unreadCounts[trip._id] > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                  {unreadCounts[trip._id]}
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-800 mb-1">
                    {trip.name}
                  </h3>
                  {trip.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">{trip.description}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium">👥 Members:</span>
                  <span className="ml-2">{trip.members.length}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="font-medium text-gray-600">💰 Total:</span>
                  <span className="ml-2 text-blue-600 font-semibold">
                    ₹{trip.totalExpenses.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium">📅 Created:</span>
                  <span className="ml-2">
                    {new Date(trip.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {unreadCounts[trip._id] > 0 && (
                  <div className="flex items-center text-sm text-red-600 font-medium">
                    <span>💬 {unreadCounts[trip._id]} new message{unreadCounts[trip._id] > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Link
                  to={`/trips/${trip._id}`}
                  className="flex-1 bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  View Details
                </Link>
                {trip.createdBy._id === user._id && (
                  <button
                    onClick={() => handleDelete(trip._id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    title="Delete trip"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
