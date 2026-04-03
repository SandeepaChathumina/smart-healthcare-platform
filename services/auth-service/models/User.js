import mongoose from 'mongoose';

const baseOptions = {
  discriminatorKey: 'role',
  collection: 'users',
  timestamps: true
};

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },

    isVerified: {
      type: Boolean,
      default: false
    },

    accountStatus: {
      type: String,
      enum: ['active', 'pending', 'rejected', 'suspended'],
      default: 'active'
    },

    otp: {
      type: String
    },
    otpExpires: {
      type: Date
    },

    resetPasswordOtp: {
      type: String
    },
    resetPasswordExpires: {
      type: Date
    },

    location: {
      address: { type: String, trim: true },
      city: { type: String, trim: true },
      district: { type: String, trim: true }
    }
  },
  baseOptions
);

const User = mongoose.model('User', UserSchema);

export default User;