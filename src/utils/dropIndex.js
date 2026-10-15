require('dotenv').config();
const mongoose = require('mongoose');

async function dropIndex() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const collection = db.collection('users');

  const indexes = await collection.indexes();
  console.log('Current indexes:', indexes.map(i => i.name));

  try {
    await collection.dropIndex('accountNumber_1');
    console.log('✅ Dropped accountNumber_1 index successfully');
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  await mongoose.disconnect();
  process.exit(0);
}

dropIndex();
