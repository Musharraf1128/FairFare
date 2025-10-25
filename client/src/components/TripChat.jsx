import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/api';

const TripChat = ({ tripId, members }) => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [tripId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data } = await API.get(`/trips/${tripId}/messages`);
      setMessages(data);
      
      // Mark unread messages as read
      const unreadIds = data
        .filter(msg => !msg.readBy.some(r => r.user === user._id))
        .map(msg => msg._id);
      
      if (unreadIds.length > 0) {
        await API.post(`/trips/${tripId}/messages/read`, { messageIds: unreadIds });
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const { data } = await API.post(`/trips/${tripId}/messages`, {
        content: newMessage
      });
      
      setMessages([...messages, data]);
      setNewMessage('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleEdit = async (messageId) => {
    if (!editContent.trim()) return;

    try {
      const { data } = await API.put(`/trips/messages/${messageId}`, {
        content: editContent
      });
      
      setMessages(messages.map(msg => msg._id === messageId ? data : msg));
      setEditingId(null);
      setEditContent('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to edit message');
    }
  };

  const handleDelete = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;

    try {
      await API.delete(`/trips/messages/${messageId}`);
      setMessages(messages.filter(msg => msg._id !== messageId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete message');
    }
  };

  const startEdit = (message) => {
    setEditingId(message._id);
    setEditContent(message.content);
  };

  const getAvatarUrl = (avatar, name) => {
    if (avatar) return avatar;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=2563eb&color=fff&size=40`;
  };

  const formatTime = (date) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffMs = now - messageDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return messageDate.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-md">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
        <h3 className="text-xl font-semibold">Trip Chat</h3>
        <p className="text-sm text-blue-100">{members.length} members</p>
      </div>

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50"
      >
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-2">💬</p>
            <p>No messages yet</p>
            <p className="text-sm mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender._id === user._id;
            const isSystemMessage = message.messageType === 'system' || message.messageType === 'expense';

            if (isSystemMessage) {
              return (
                <div key={message._id} className="flex justify-center my-4">
                  <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm">
                    {message.content}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={message._id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2 max-w-[70%]`}>
                  {/* Avatar */}
                  <img
                    src={getAvatarUrl(message.sender.avatar, message.sender.name)}
                    alt={message.sender.name}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />

                  {/* Message Bubble */}
                  <div>
                    {!isOwnMessage && (
                      <p className="text-xs text-gray-500 mb-1 ml-2">
                        {message.sender.name}
                      </p>
                    )}
                    
                    {editingId === message._id ? (
                      <div className="bg-white p-3 rounded-lg border-2 border-blue-500">
                        <input
                          type="text"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded mb-2"
                          autoFocus
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(message._id)}
                            className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-xs bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isOwnMessage
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-800 border border-gray-200'
                        }`}
                      >
                        <p className="break-words">{message.content}</p>
                        {message.isEdited && (
                          <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-400'}`}>
                            (edited)
                          </p>
                        )}
                      </div>
                    )}

                    <div className={`flex items-center space-x-2 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                      <p className="text-xs text-gray-400">
                        {formatTime(message.createdAt)}
                      </p>
                      
                      {isOwnMessage && editingId !== message._id && (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => startEdit(message)}
                            className="text-xs text-gray-500 hover:text-blue-600"
                          >
                            Edit
                          </button>
                          <span className="text-gray-300">•</span>
                          <button
                            onClick={() => handleDelete(message._id)}
                            className="text-xs text-gray-500 hover:text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="px-6 py-4 border-t bg-white rounded-b-lg">
        <form onSubmit={handleSend} className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <span>{sending ? 'Sending...' : 'Send'}</span>
            <span>📤</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default TripChat;
