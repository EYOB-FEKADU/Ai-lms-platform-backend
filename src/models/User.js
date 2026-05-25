const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['super_admin', 'institution_admin', 'instructor', 'parent', 'student'],
    required: true,
  },
  // NEW FIELDS - Add these
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  profilePicture: {
    type: String,
    default: null
  },
  profile: {
    grade: String,
    preferredLanguage: { type: String, enum: ['en', 'am', 'om'], default: 'en' },
    bio: String,
    specializations: [String],
    linkedChildren: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    institutionName: String,
    permissions: {
      canManageUsers: { type: Boolean, default: false },
      canManageCourses: { type: Boolean, default: false },
      canViewAnalytics: { type: Boolean, default: false },
    },
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);