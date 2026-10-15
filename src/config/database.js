const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobplatform');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    mongoose.connection.on('error', (err) => console.error('MongoDB error:', err));
    mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB disconnected'));
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
