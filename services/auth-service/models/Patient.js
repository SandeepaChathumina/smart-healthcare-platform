import mongoose from 'mongoose';
import User from './User.js';

const PatientSchema = new mongoose.Schema({
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  dateOfBirth: {
    type: Date
  },
  emergencyContactName: {
    type: String,
    trim: true
  },
  emergencyContactPhone: {
    type: String,
    trim: true
  },
  bloodGroup: {
    type: String,
    trim: true
  },
  allergies: [
    {
      type: String,
      trim: true
    }
  ]
});

const Patient = User.discriminator('Patient', PatientSchema);

export default Patient;