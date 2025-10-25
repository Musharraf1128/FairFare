const User = require('../models/User');

// @desc    Send friend request
// @route   POST /api/friends/request/:userId
// @access  Private
const sendFriendRequest = async (req, res) => {
  try {
    const recipientId = req.params.userId;
    const senderId = req.user.id;

    if (recipientId === senderId) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }

    const recipient = await User.findById(recipientId);
    const sender = await User.findById(senderId);

    if (!recipient) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already friends
    if (sender.friends.includes(recipientId)) {
      return res.status(400).json({ message: 'Already friends' });
    }

    // Check if request already sent
    const existingRequest = recipient.friendRequests.find(
      req => req.from.toString() === senderId
    );

    if (existingRequest) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    // Add friend request
    recipient.friendRequests.push({ from: senderId });
    await recipient.save();

    res.json({ message: 'Friend request sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept friend request
// @route   POST /api/friends/accept/:userId
// @access  Private
const acceptFriendRequest = async (req, res) => {
  try {
    const senderId = req.params.userId;
    const recipientId = req.user.id;

    const recipient = await User.findById(recipientId);
    const sender = await User.findById(senderId);

    if (!sender) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find and remove the friend request
    const requestIndex = recipient.friendRequests.findIndex(
      req => req.from.toString() === senderId
    );

    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    recipient.friendRequests.splice(requestIndex, 1);

    // Add to friends list (both ways)
    if (!recipient.friends.includes(senderId)) {
      recipient.friends.push(senderId);
    }
    if (!sender.friends.includes(recipientId)) {
      sender.friends.push(recipientId);
    }

    await recipient.save();
    await sender.save();

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject friend request
// @route   DELETE /api/friends/reject/:userId
// @access  Private
const rejectFriendRequest = async (req, res) => {
  try {
    const senderId = req.params.userId;
    const recipientId = req.user.id;

    const recipient = await User.findById(recipientId);

    if (!recipient) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find and remove the friend request
    recipient.friendRequests = recipient.friendRequests.filter(
      req => req.from.toString() !== senderId
    );

    await recipient.save();

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove friend
// @route   DELETE /api/friends/:userId
// @access  Private
const removeFriend = async (req, res) => {
  try {
    const friendId = req.params.userId;
    const userId = req.user.id;

    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!friend) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove from both friends lists
    user.friends = user.friends.filter(id => id.toString() !== friendId);
    friend.friends = friend.friends.filter(id => id.toString() !== userId);

    await user.save();
    await friend.save();

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all friends
// @route   GET /api/friends
// @access  Private
const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('friends', 'name email avatar isOnline lastSeen bio location');

    res.json(user.friends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get friend requests
// @route   GET /api/friends/requests
// @access  Private
const getFriendRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('friendRequests.from', 'name email avatar bio');

    res.json(user.friendRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search users (not friends)
// @route   GET /api/friends/search?query=
// @access  Private
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user.id;

    if (!query || query.length < 2) {
      return res.json([]);
    }

    const currentUser = await User.findById(currentUserId);

    const users = await User.find({
      _id: { $ne: currentUserId }, // Exclude current user
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
    .select('name email avatar bio location friends')
    .limit(20);

    // Add friend status to each user
    const usersWithStatus = users.map(user => {
      const isFriend = currentUser.friends.includes(user._id);
      const hasPendingRequest = user.friends.some(friendId => 
        currentUser.friendRequests.some(req => req.from.toString() === friendId.toString())
      );
      const requestSent = currentUser.friendRequests.some(
        req => req.from.toString() === user._id.toString()
      );

      return {
        ...user.toObject(),
        isFriend,
        hasPendingRequest,
        requestSent
      };
    });

    res.json(usersWithStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriends,
  getFriendRequests,
  searchUsers
};
