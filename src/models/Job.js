const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  title: { type: String, required: [true, 'Job title required'], trim: true, maxlength: 200 },
  slug: { type: String, unique: true },
  description: { type: String, required: [true, 'Description required'], maxlength: 10000 },
  responsibilities: [String],
  requirements: [String],
  skills: [{ type: String, trim: true }],
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  categoryName: String,
  location: { type: String, required: true },
  workMode: { type: String, enum: ['REMOTE', 'HYBRID', 'ON_SITE'], required: true, default: 'ON_SITE' },
  employmentType: {
    type: String,
    enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'],
    required: true,
    default: 'FULL_TIME',
  },
  experienceLevel: {
    type: String,
    enum: ['ENTRY', 'MID', 'SENIOR', 'EXECUTIVE'],
    required: true,
    default: 'MID',
  },
  educationLevel: { type: String, enum: ['HIGH_SCHOOL', 'ASSOCIATE', 'BACHELOR', 'MASTER', 'PHD', 'ANY'] },
  salary: {
    min: Number,
    max: Number,
    currency: { type: String, default: 'USD' },
    isHidden: { type: Boolean, default: false },
    period: { type: String, enum: ['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'], default: 'YEARLY' },
  },
  benefits: [String],
  applicationDeadline: Date,
  openings: { type: Number, default: 1, min: 1 },
  status: {
    type: String,
    enum: ['DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED', 'EXPIRED'],
    default: 'DRAFT',
  },
  applicationCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  isReported: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  expiresAt: Date,
}, { timestamps: true });

jobSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
  }
  next();
});

jobSchema.index({ title: 'text', description: 'text', skills: 'text' });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ employer: 1, status: 1 });
jobSchema.index({ company: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ workMode: 1 });
jobSchema.index({ employmentType: 1 });
jobSchema.index({ experienceLevel: 1 });
jobSchema.index({ categoryName: 1 });
jobSchema.index({ isFeatured: 1, status: 1 });

module.exports = mongoose.model('Job', jobSchema);
