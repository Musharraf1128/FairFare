import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

const CreateTrip = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [memberEmails, setMemberEmails] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEmailChange = (index, value) => {
    const newEmails = [...memberEmails];
    newEmails[index] = value;
    setMemberEmails(newEmails);
  };

  const addEmailField = () => {
    setMemberEmails([...memberEmails, '']);
  };

  const removeEmailField = (index) => {
    const newEmails = memberEmails.filter((_, i) => i !== index);
    setMemberEmails(newEmails);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Filter out empty emails
      const validEmails = memberEmails.filter(email => email.trim() !== '');

      const { data } = await API.post('/trips', {
        ...formData,
        memberEmails: validEmails
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

          {/* Members */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Add Members (by email)
            </label>
            <p className="text-sm text-gray-500 mb-3">
              You will be automatically added as a member
            </p>

            {memberEmails.map((email, index) => (
              <div key={index} className="flex space-x-2 mb-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="friend@example.com"
                />
                {memberEmails.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEmailField(index)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addEmailField}
              className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add Another Member
            </button>
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
