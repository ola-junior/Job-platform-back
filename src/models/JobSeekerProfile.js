const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  institution: { type: String, required: true },
  degree: String,
  fieldOfStudy: String,
  startDate: Date,
  endDate: Date,
  isCurrent: { type: Boolean, default: false },
  description: String,
}, { _id: true });

const experienceSchema = new mongoose.Schema({
  company: { type: String, required: true },
  title: { type: String, required: true },
  location: String,
  employmentType: { type: String, enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'] },
  startDate: Date,
  endDate: Date,
  isCurrent: { type: Boolean, default: false },
  description: String,
}, { _id: true });

const certificationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  issuer: String,
  issueDate: Date,
  expiryDate: Date,
  credentialId: String,
  credentialUrl: String,
}, { _id: true });

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  url: String,
  githubUrl: String,
  technologies: [String],
  startDate: Date,
  endDate: Date,
}, { _id: true });

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  level: { type: String, enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'], default: 'INTERMEDIATE' },
}, { _id: true });

const jobSeekerProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  headline: { type: String, maxlength: 220 },
  about: { type: String, maxlength: 2000 },
  location: String,
  website: String,
  linkedin: String,
  github: String,
  skills: [skillSchema],
  education: [educationSchema],
  experience: [experienceSchema],
  certifications: [certificationSchema],
  projects: [projectSchema],
  languages: [{ name: String, proficiency: String }],
  cv: { url: String, publicId: String, fileName: String, uploadedAt: Date },
  profileCompleteness: { type: Number, default: 0, min: 0, max: 100 },
  isOpenToWork: { type: Boolean, default: true },
  preferredJobTypes: [{ type: String, enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'] }],
  preferredLocations: [String],
  expectedSalary: { min: Number, max: Number, currency: { type: String, default: 'USD' } },
}, { timestamps: true });

jobSeekerProfileSchema.index({ user: 1 });
jobSeekerProfileSchema.index({ 'skills.name': 1 });

module.exports = mongoose.model('JobSeekerProfile', jobSeekerProfileSchema);
