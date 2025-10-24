import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/api';

const Home = () => {
  const { user } = useContext(AuthContext);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const { data } = await API.get('/trips');
      setTrips(data);
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
        <div className="text-center text-gray-600">Loading trips...</div>
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
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
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
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">🏖️</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No trips yet</h3>
          <p className="text-gray-500 mb-4">Create your first trip to start tracking expenses</p>
          <Link
            to="/trips/create"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Create Your First Trip
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <div
              key={trip._id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-800 mb-1">
                    {trip.name}
                  </h3>
                  {trip.description && (
                    <p className="text-gray-600 text-sm">{trip.description}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium">👥 Members:</span>
                  <span className="ml-2">{trip.members.length}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium">💰 Total:</span>
                  <span className="ml-2">₹{trip.totalExpenses.toFixed(2)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium">📅 Created:</span>
                  <span className="ml-2">
                    {new Date(trip.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Link
                  to={`/trips/${trip._id}`}
                  className="flex-1 bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  View Details
                </Link>
                {trip.createdBy._id === user._id && (
                  <button
                    onClick={() => handleDelete(trip._id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
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
