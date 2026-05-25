require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function fixAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Delete old admin
  const deleted = await mongoose.connection.db.collection('users').deleteOne({ email: 'admin@lms.com' });
  console.log('Deleted old admin:', deleted.deletedCount);

  // Create new admin with proper hash
  const hashedPassword = await bcrypt.hash('Admin123!', 12);
  await mongoose.connection.db.collection('users').insertOne({
    email: 'admin@lms.com',
    password: hashedPassword,
    fullName: 'System Admin',
    role: 'super_admin',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log('Created new admin: admin@lms.com / Admin123!');

  await mongoose.connection.close();
  process.exit(0);
}

fixAdmin().catch(err => { console.error(err); process.exit(1); });
