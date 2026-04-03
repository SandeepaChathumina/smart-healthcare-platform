import mongoose from 'mongoose';
import User from './User.js';

const AdminSchema = new mongoose.Schema({
  adminLevel: {
    type: String,
    enum: ['SuperAdmin', 'Moderator', 'Admin'],
    default: 'Admin'
  }
});

const Admin = User.discriminator('Admin', AdminSchema);

export default Admin;