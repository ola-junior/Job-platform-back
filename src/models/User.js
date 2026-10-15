const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: [true, 'Full name required'], trim: true, maxlength: 100 },
  email: { type: String, required: [true, 'Email required'], unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  password: { type: String, minlength: 8, select: false },
  role: { type: String, enum: ['JOB_SEEKER', 'EMPLOYER', 'ADMIN'], required: true },
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, select: false },
  emailVerificationExpire: { type: Date, select: false },
  resetPasswordToken: { type: String, select: false },
  resetPasswordExpire: { type: Date, select: false },
  lastLogin: Date,
  avatar: { type: String, default: '' },
  avatarPublicId: { type: String, default: '' },
  notificationCount: { type: Number, default: 0 },
  messageCount: { type: Number, default: 0 },
}, { timestamps: true });

userSchema.index({ role: 1, isActive: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationToken;
  delete obj.resetPasswordToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
