const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: 1000
  },
  messageType: {
    type: String,
    enum: ['text', 'expense', 'system'],
    default: 'text'
  },
  relatedExpense: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense'
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
messageSchema.index({ tripId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
