const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already in use`;
    statusCode = 400;
  }

  // Mongoose validation
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map(e => e.message).join(', ');
    statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') { message = 'Invalid token'; statusCode = 401; }
  if (err.name === 'TokenExpiredError') { message = 'Token expired'; statusCode = 401; }

  // Mongoose cast error (invalid ID)
  if (err.name === 'CastError') { message = 'Invalid ID format'; statusCode = 400; }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
