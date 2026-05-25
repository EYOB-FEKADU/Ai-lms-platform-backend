// require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define User schema inline so we don't need to copy files
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  role: {
    type: String,
    enum: ['super_admin', 'institution_admin', 'instructor', 'parent', 'student'],
    required: true,
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const User = mongoose.model('User', userSchema);

const seedUsers = [
  {
    email: 'admin@lms.com',
    password: 'Admin123!',
    fullName: 'System Admin',
    role: 'super_admin',
  },
  {
    email: 'teacher.almaz@lms.com',
    password: 'Teacher123!',
    fullName: 'Dr. Almaz Bekele',
    role: 'instructor',
  },
  {
    email: 'teacher.tadesse@lms.com',
    password: 'Teacher123!',
    fullName: 'Mr. Tadesse Hailu',
    role: 'instructor',
  },
  {
    email: 'parent.chaltu@lms.com',
    password: 'Parent123!',
    fullName: 'Chaltu Tadesse',
    role: 'parent',
  },
  {
    email: 'student.abebe@lms.com',
    password: 'Student123!',
    fullName: 'Abebe Kebede',
    role: 'student',
  },
  {
    email: 'student.mohammed@lms.com',
    password: 'Student123!',
    fullName: 'Mohammed Ali',
    role: 'student',
  },
];

async function seed() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Insert seed users
    const users = await User.insertMany(seedUsers);
    console.log(`✅ Seeded ${users.length} users:\n`);

    users.forEach(user => {
      console.log(`   ${user.role}: ${user.email} (password: ${user.password})`);
    });

    console.log('\nUse these credentials to log in from StackBlitz!');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
}

seed();