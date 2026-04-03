import mongoose from 'mongoose';
import User from './User.js';

const DoctorSchema = new mongoose.Schema({
  specialization: {
    type: String,
    required: true,
    trim: true
  },
  qualifications: {
    type: String,
    required: true,
    trim: true
  },
  licenseNumber: {
    type: String,
    required: true,
    trim: true
  },
  hospitalOrClinic: {
    type: String,
    trim: true
  },
  experience: {
    type: Number,
    default: 0,
    min: 0
  },
  consultationFee: {
    type: Number,
    default: 0,
    min: 0
  },
  bio: {
    type: String,
    trim: true
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  verificationRequestedAt: {
    type: Date
  },
  approvedAt: {
    type: Date
  }
});

const Doctor = User.discriminator('Doctor', DoctorSchema);

export default Doctor;