import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    phoneNumber: '',
    avatar: ''
  });

  const isOwnProfile = !userId || userId === currentUser._id;

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const endpoint = isOwnProfile ? '/profile/me' : `/profile/${userId}`;
      const { data } = await API.get(endpoint);
      setProfile(data);
      setFormData({
        name: data.name,
        bio: data.bio || '',
        location: data.location || '',
        phoneNumber: data.phoneNumber || '',
        avatar: data.avatar || ''
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.put('/profile', formData);
      setProfile({ ...profile, ...data });
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const getAvatarUrl = (avatar, name) => {
    if (avatar) return avatar;
    // Generate avatar based on name
    const initial = name?.charAt(0).toUpperCase() || 'U';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=2563eb&color=fff&size=200`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <LoadingSpinner message="Loading profile..." />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center text-gray-500">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-12">
            <img
              src={getAvatarUrl(profile.avatar, profile.name)}
              alt={profile.name}
              className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
            />
            <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left flex-1">
              <h1 className="text-3xl font-bold text-gray-800">{profile.name}</h1>
              <p className="text-gray-600">{profile.email}</p>
              {profile.location && (
                <p className="text-gray-500 text-sm mt-1">📍 {profile.location}</p>
              )}
            </div>
            {isOwnProfile && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="mt-4 sm:mt-0 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Edit Profile
              </button>
            )}
          </div>

          {profile.bio && !isEditing && (
            <div className="mt-6">
              <p className="text-gray-700">{profile.bio}</p>
            </div>
          )}

          {profile.phoneNumber && !isEditing && (
            <div className="mt-4">
              <p className="text-gray-600">📞 {profile.phoneNumber}</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Edit Profile</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows="3"
                maxLength="200"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tell us about yourself..."
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.bio.length}/200 characters
              </p>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="City, Country"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+91 9876543210"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Avatar URL</label>
              <input
                type="url"
                name="avatar"
                value={formData.avatar}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/avatar.jpg"
              />
              <p className="text-sm text-gray-500 mt-1">
                Or use <a href="https://ui-avatars.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">UI Avatars</a> for auto-generated avatars
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-3xl font-bold text-blue-600">{profile.friends?.length || 0}</p>
          <p className="text-gray-600 mt-1">Friends</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-3xl font-bold text-green-600">{profile.trips?.length || 0}</p>
          <p className="text-gray-600 mt-1">Trips</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-3xl font-bold text-purple-600">
            {profile.friendRequests?.length || 0}
          </p>
          <p className="text-gray-600 mt-1">Pending Requests</p>
        </div>
      </div>

      {/* Friends List */}
      {profile.friends && profile.friends.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Friends ({profile.friends.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profile.friends.map(friend => (
              <Link
                key={friend._id}
                to={`/profile/${friend._id}`}
                className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <img
                  src={getAvatarUrl(friend.avatar, friend.name)}
                  alt={friend.name}
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{friend.name}</p>
                  <p className="text-sm text-gray-500">{friend.email}</p>
                </div>
                {friend.isOnline && (
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
