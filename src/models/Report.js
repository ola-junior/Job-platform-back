const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['JOB', 'USER', 'COMPANY'], required: true },
  targetJob: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reason: { type: String, required: true, enum: ['SPAM', 'MISLEADING', 'INAPPROPRIATE', 'SCAM', 'DUPLICATE', 'OTHER'] },
  description: String,
  status: { type: String, enum: ['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'], default: 'PENDING' },
  adminNote: String,
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
