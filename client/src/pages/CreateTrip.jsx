import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

const CreateTrip = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [friends, setFriends] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const { data } = await API.get('/friends');
      setFriends(data);
    } catch (err) {
      console.error('Error fetching friends:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data } = await API.get(`/trips/users/search?query=${query}`);
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

  const addMember = (user) => {
    if (!selectedMembers.some(m => m._id === user._id)) {
      setSelectedMembers([...selectedMembers, user]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

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

  const getAvatarUrl = (avatar, name) => {
    if (avatar) return avatar;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=2563eb&color=fff&size=50`;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="card fade-in">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Create New Trip</h2>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Trip Name */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Trip Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input"
              placeholder="e.g., Goa Trip 2025"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="input"
              placeholder="Beach vacation with college friends"
            />
          </div>

          {/* Members */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Add Members
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              You will be automatically added as a member
            </p>

            {/* Friends quick select */}
            {friends.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select from friends:</p>
                <div className="flex flex-wrap gap-2">
                  {friends.map(friend => {
                    const isSelected = selectedMembers.some(m => m._id === friend._id);
                    return (
                      <button
                        key={friend._id}
                        type="button"
                        onClick={() => isSelected ? removeMember(friend._id) : addMember(friend)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border-2 transition ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                            : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300'
                        }`}
                      >
                        <img
                          src={getAvatarUrl(friend.avatar, friend.name)}
                          alt={friend.name}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-sm">{friend.name}</span>
                        {isSelected && <span>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Search for other users */}
            <div>
              <button
                type="button"
                onClick={() => setShowSearch(!showSearch)}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm mb-2"
              >
                {showSearch ? '− Hide search' : '+ Search for other users'}
              </button>

              {showSearch && (
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search users by name or email..."
                  />
                  
                  {searchQuery.length >= 2 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {searching ? (
                        <div className="px-4 py-3 text-gray-500">Searching...</div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((user) => (
                          <div
                            key={user._id}
                            onClick={() => addMember(user)}
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 flex items-center space-x-3"
                          >
                            <img
                              src={getAvatarUrl(user.avatar, user.name)}
                              alt={user.name}
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <p className="font-medium text-gray-800">{user.name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-gray-500">
                          No users found
                        </div>
                      )}
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
                    <div className="flex items-center space-x-3">
                      <img
                        src={getAvatarUrl(member.avatar, member.name)}
                        alt={member.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium text-gray-800">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
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
              className="flex-1 btn-primary py-3 rounded-lg font-semibold disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create Trip'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn-secondary px-6 py-3"
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
