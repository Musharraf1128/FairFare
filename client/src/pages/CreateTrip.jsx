import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

const CreateTrip = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Search users as you type
  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data } = await API.get(`/trips/users/search?query=${query}`);
      // Filter out already selected members
      const filtered = data.filter(
        user => !selectedMembers.some(member => member._id === user._id)
      );
      setSearchResults(filtered);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  // Add member to selected list
  const addMember = (user) => {
    setSelectedMembers([...selectedMembers, user]);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Remove member from selected list
  const removeMember = (userId) => {
    setSelectedMembers(selectedMembers.filter(member => member._id !== userId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const memberEmails = selectedMembers.map(member => member.email);

      const { data } = await API.post('/trips', {
        ...formData,
        memberEmails
      });

      navigate(`/trips/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Create New Trip</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Trip Name */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Trip Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Goa Trip 2025"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Beach vacation with college friends"
            />
          </div>

          {/* Members Search */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Add Members
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Search by name or email. You will be automatically added as a member.
            </p>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search users by name or email..."
              />
              
              {/* Search Results Dropdown */}
              {searchQuery.length >= 2 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searching ? (
                    <div className="px-4 py-3 text-gray-500">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((user) => (
                      <div
                        key={user._id}
                        onClick={() => addMember(user)}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                      >
                        <p className="font-medium text-gray-800">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500">
                      No users found. They need to register first.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Members */}
            {selectedMembers.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">Selected Members:</p>
                {selectedMembers.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between bg-blue-50 px-4 py-2 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMember(member._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-300"
            >
              {loading ? 'Creating...' : 'Create Trip'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTrip;
