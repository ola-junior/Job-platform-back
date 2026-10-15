const mongoose = require('mongoose');

const employerProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  jobTitle: String,
  department: String,
  bio: { type: String, maxlength: 1000 },
}, { timestamps: true });

module.exports = mongoose.model('EmployerProfile', employerProfileSchema);
