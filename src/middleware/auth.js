const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isAllowedAdminEmail } = require('../utils/adminAccess');

// Verify JWT and attach user to request
exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_dev_secret_32chars_min');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account is suspended' });
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Role-based authorization
exports.authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role: ${roles.join(' or ')}`,
    });
  }
  if (roles.includes('ADMIN') && req.user.role === 'ADMIN' && !isAllowedAdminEmail(req.user.email)) {
    return res.status(403).json({ success: false, message: 'This account is not allowed to access admin features' });
  }
  next();
};

// Generate tokens
exports.generateAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_dev_secret_32chars_min', {
    expiresIn: process.env.JWT_EXPIRE || '15m',
  });

exports.generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_32chars', {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });
