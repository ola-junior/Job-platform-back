require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Connect to database
connectDB();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true }));
app.use('/api/auth/', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, message: 'Too many requests' } }));

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/jobs', require('./routes/job.routes'));
app.use('/api/applications', require('./routes/application.routes'));
app.use('/api/profile', require('./routes/profile.routes'));
app.use('/api/companies', require('./routes/company.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/messages', require('./routes/message.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// Public categories endpoint
app.get('/api/categories', async (req, res) => {
  const Category = require('./models/Category');
  const categories = await Category.find({ isActive: true }).sort('name');
  res.json({ success: true, data: { categories } });
});

// Health check
app.get('/api/health', (req, res) => res.json({ success: true, message: 'API running', env: process.env.NODE_ENV }));

// 404
app.use('*', (req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 JobPlatform API running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
