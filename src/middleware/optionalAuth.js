const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_dev_secret_32chars_min');
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch {}
  next();
};
