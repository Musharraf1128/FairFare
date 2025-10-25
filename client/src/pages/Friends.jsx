import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Friends = () => {
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        API.get('/friends'),
        API.get('/friends/requests'),
      ]);
      setFriends(friendsRes.data);
      setRequests(requestsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data } = await API.get(`/friends/search?query=${query}`);
      setSearchResults(data);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const sendRequest = async (userId) => {
    try {
      await API.post(`/friends/request/${userId}`);
      alert('Friend request sent!');
      handleSearch(searchQuery);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send request');
    }
  };

  const acceptRequest = async (userId) => {
    try {
      await API.post(`/friends/accept/${userId}`);
      await fetchData();
      alert('Friend request accepted!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept request');
    }
  };

  const rejectRequest = async (userId) => {
    try {
      await API.delete(`/friends/reject/${userId}`);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject request');
    }
  };

  const removeFriend = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) return;

    try {
      await API.delete(`/friends/${userId}`);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove friend');
    }
  };

  const getAvatarUrl = (avatar, name) => {
    if (avatar) return avatar;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name || 'User'
    )}&background=2563eb&color=fff&size=100`;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <LoadingSpinner message="Loading friends..." />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Friends</h1>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 px-6 py-4 font-semibold transition ${
              activeTab === 'friends'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Friends ({friends.length})
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 px-6 py-4 font-semibold transition relative ${
              activeTab === 'requests'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Requests ({requests.length})
            {requests.length > 0 && (
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {requests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 px-6 py-4 font-semibold transition ${
              activeTab === 'search'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Find Friends
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Friends Tab */}
          {activeTab === 'friends' && (
            <div>
              {friends.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-4xl mb-2">👥</p>
                  <p>No friends yet</p>
                  <p className="text-sm mt-1">
                    Search for users to add friends
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {friends.map((friend) => (
                    <div
                      key={friend._id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      <Link
                        to={`/profile/${friend._id}`}
                        className="flex items-center space-x-3 flex-1"
                      >
                        <img
                          src={getAvatarUrl(friend.avatar, friend.name)}
                          alt={friend.name}
                          className="w-14 h-14 rounded-full"
                        />
                        <div>
                          <p className="font-medium text-gray-800">
                            {friend.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {friend.email}
                          </p>
                          {friend.location && (
                            <p className="text-xs text-gray-400">
                              📍 {friend.location}
                            </p>
                          )}
                        </div>
                      </Link>
                      <div className="flex items-center space-x-2">
                        {friend.isOnline ? (
                          <span className="flex items-center text-xs text-green-600">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                            Online
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {new Date(friend.lastSeen).toLocaleDateString()}
                          </span>
                        )}
                        <button
                          onClick={() => removeFriend(friend._id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div>
              {requests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-4xl mb-2">📬</p>
                  <p>No friend requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div
                      key={request.from._id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-blue-50"
                    >
                      <Link
                        to={`/profile/${request.from._id}`}
                        className="flex items-center space-x-3 flex-1"
                      >
                        <img
                          src={getAvatarUrl(
                            request.from.avatar,
                            request.from.name
                          )}
                          alt={request.from.name}
                          className="w-14 h-14 rounded-full"
                        />
                        <div>
                          <p className="font-medium text-gray-800">
                            {request.from.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {request.from.email}
                          </p>
                          {request.from.bio && (
                            <p className="text-sm text-gray-600 mt-1">
                              {request.from.bio}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </Link>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => acceptRequest(request.from._id)}
                          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => rejectRequest(request.from._id)}
                          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <div>
              <div className="mb-6">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search users by name or email..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {searching ? (
                <div className="text-center py-8 text-gray-500">
                  Searching...
                </div>
              ) : searchQuery.length < 2 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-4xl mb-2">🔍</p>
                  <p>Start typing to search for users</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-4xl mb-2">😕</p>
                  <p>No users found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      <Link
                        to={`/profile/${user._id}`}
                        className="flex items-center space-x-3 flex-1"
                      >
                        <img
                          src={getAvatarUrl(user.avatar, user.name)}
                          alt={user.name}
                          className="w-14 h-14 rounded-full"
                        />
                        <div>
                          <p className="font-medium text-gray-800">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {user.email}
                          </p>
                          {user.bio && (
                            <p className="text-sm text-gray-600 mt-1">
                              {user.bio}
                            </p>
                          )}
                          {user.location && (
                            <p className="text-xs text-gray-400">
                              📍 {user.location}
                            </p>
                          )}
                        </div>
                      </Link>
                      <div>
                        {user.isFriend ? (
                          <span className="text-green-600 font-medium">
                            ✓ Friends
                          </span>
                        ) : user.requestSent ? (
                          <span className="text-gray-500">Request Sent</span>
                        ) : user.hasPendingRequest ? (
                          <span className="text-blue-600">
                            Pending Request
                          </span>
                        ) : (
                          <button
                            onClick={() => sendRequest(user._id)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                          >
                            Add Friend
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Friends;
