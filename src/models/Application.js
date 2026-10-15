const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  coverLetter: { type: String, maxlength: 3000 },
  cv: {
    url: { type: String, required: true },
    fileName: String,
    publicId: String,
  },
  status: {
    type: String,
    enum: ['APPLIED', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN', 'HIRED'],
    default: 'APPLIED',
  },
  statusHistory: [{
    status: String,
    changedAt: { type: Date, default: Date.now },
    note: String,
  }],
  employerNote: String,
  isRead: { type: Boolean, default: false },
  withdrawnAt: Date,
  withdrawReason: String,
}, { timestamps: true });

applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
applicationSchema.index({ applicant: 1, status: 1 });
applicationSchema.index({ employer: 1, status: 1 });
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ company: 1, createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);
