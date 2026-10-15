const crypto = require('crypto');
const User = require('../models/User');
const JobSeekerProfile = require('../models/JobSeekerProfile');
const EmployerProfile = require('../models/EmployerProfile');
const Company = require('../models/Company');
const { generateAccessToken, generateRefreshToken } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../config/email');
const jwt = require('jsonwebtoken');
const { isAllowedAdminEmail } = require('../utils/adminAccess');

// Helper: send token response
const sendTokens = (res, user, statusCode = 200, message = 'Success') => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  const userData = {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    isEmailVerified: user.isEmailVerified,
  };
  res.status(statusCode).json({ success: true, message, data: { accessToken, refreshToken, user: userData } });
};

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { fullName, email, phone, password, role, companyName, companyEmail } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already registered' });

    const validRoles = ['JOB_SEEKER', 'EMPLOYER'];
    if (!validRoles.includes(role)) return res.status(400).json({ success: false, message: 'Invalid role' });

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = await User.create({
      fullName, email, phone, password, role,
      emailVerificationToken: crypto.createHash('sha256').update(verificationToken).digest('hex'),
      emailVerificationExpire: Date.now() + 24 * 60 * 60 * 1000,
    });

    // Create role-specific profile
    if (role === 'JOB_SEEKER') {
      await JobSeekerProfile.create({ user: user._id });
    } else if (role === 'EMPLOYER') {
      const company = await Company.create({
        owner: user._id,
        name: companyName || `${fullName}'s Company`,
        email: companyEmail || email,
      });
      await EmployerProfile.create({ user: user._id, company: company._id });
    }

    // Send verification email (non-blocking)
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    const { subject, html } = emailTemplates.verifyEmail(fullName, verifyUrl);
    sendEmail({ to: email, subject, html }).catch(console.error);

    sendTokens(res, user, 201, 'Registration successful. Please verify your email.');
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password' });
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account suspended. Contact support.' });
    if (user.role === 'ADMIN' && !isAllowedAdminEmail(user.email)) {
      return res.status(403).json({ success: false, message: 'This account is not allowed to access admin features' });
    }
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in.',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email,
      });
    }

    if (isAllowedAdminEmail(user.email)) user.role = 'ADMIN';
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    sendTokens(res, user, 200, 'Login successful');
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required' });
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_32chars');
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    const accessToken = generateAccessToken(user._id);
    res.json({ success: true, data: { accessToken } });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/verify/:token
exports.verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOneAndUpdate(
      {
        emailVerificationToken: hashedToken,
        emailVerificationExpire: { $gt: Date.now() },
      },
      {
        isEmailVerified: true,
        emailVerificationToken: undefined,
        emailVerificationExpire: undefined,
      },
      { new: true }
    );
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired verification link' });
    res.json({ success: true, message: 'Email verified successfully!' });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/resend-verification
exports.resendVerification = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email }).select('+emailVerificationToken +emailVerificationExpire +password');
    if (!user) return res.json({ success: true, message: 'If that email exists, a verification link has been sent.' });
    if (user.isEmailVerified) return res.status(400).json({ success: false, message: 'Email is already verified.' });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(verificationToken).digest('hex');

    await User.findByIdAndUpdate(user._id, {
      emailVerificationToken: hashed,
      emailVerificationExpire: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    const { subject, html } = emailTemplates.verifyEmail(user.fullName, verifyUrl);
    sendEmail({ to: user.email, subject, html }).catch(console.error);

    res.json({ success: true, message: 'Verification email sent.' });
  } catch (error) { next(error); }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const { subject, html } = emailTemplates.resetPassword(user.fullName, resetUrl);
    await sendEmail({ to: user.email, subject, html });

    res.json({ success: true, message: 'Password reset email sent.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/reset-password/:token
exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire');
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset link' });
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    sendTokens(res, user, 200, 'Password reset successful');
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    if (!await user.comparePassword(req.body.currentPassword)) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = req.body.newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};
