const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 5000 },
  isRead: { type: Boolean, default: false },
  readAt: Date,
  attachment: {
    url: String,
    fileName: String,
    fileType: String,
  },
}, { timestamps: true });

messageSchema.index({ conversation: 1, createdAt: 1 });
messageSchema.index({ sender: 1 });

module.exports = mongoose.model('Message', messageSchema);
