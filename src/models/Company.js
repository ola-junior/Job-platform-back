const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: [true, 'Company name required'], trim: true },
  email: { type: String, lowercase: true, trim: true },
  phone: String,
  website: String,
  linkedin: String,
  twitter: String,
  logo: { url: { type: String, default: '' }, publicId: String },
  description: { type: String, maxlength: 3000 },
  industry: String,
  size: { type: String, enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] },
  founded: Number,
  headquarters: String,
  locations: [String],
  specialties: [String],
  isVerified: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
}, { timestamps: true });

companySchema.index({ name: 1 });
companySchema.index({ owner: 1 });

module.exports = mongoose.model('Company', companySchema);
