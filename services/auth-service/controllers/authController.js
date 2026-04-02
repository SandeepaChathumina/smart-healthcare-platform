import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';
import Admin from '../models/Admin.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import sendEmail from '../utils/sendEmail.js';

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sanitizeUser = (user) => {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isVerified: user.isVerified,
    accountStatus: user.accountStatus
  };
};

export const registerPatient = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phone,
      gender,
      dateOfBirth,
      emergencyContactName,
      emergencyContactPhone,
      bloodGroup,
      allergies,
      location
    } = req.body;

    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({
        message: 'fullName, email, password and phone are required'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this email'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newPatient = await Patient.create({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      gender,
      dateOfBirth,
      emergencyContactName,
      emergencyContactPhone,
      bloodGroup,
      allergies,
      location,
      isVerified: false,
      accountStatus: 'active'
    });

    return res.status(201).json({
      message:
        'Patient registered successfully. Please verify your email using OTP before login.',
      user: sanitizeUser(newPatient)
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const registerDoctor = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phone,
      specialization,
      qualifications,
      licenseNumber,
      hospitalOrClinic,
      experience,
      consultationFee,
      bio,
      location
    } = req.body;

    if (
      !fullName ||
      !email ||
      !password ||
      !phone ||
      !specialization ||
      !qualifications ||
      !licenseNumber
    ) {
      return res.status(400).json({
        message:
          'fullName, email, password, phone, specialization, qualifications and licenseNumber are required'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this email'
      });
    }

    const existingLicense = await Doctor.findOne({ licenseNumber });
    if (existingLicense) {
      return res.status(400).json({
        message: 'Doctor already exists with this license number'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newDoctor = await Doctor.create({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      specialization,
      qualifications,
      licenseNumber,
      hospitalOrClinic,
      experience,
      consultationFee,
      bio,
      location,
      isVerified: false,
      accountStatus: 'pending',
      verificationRequestedAt: new Date()
    });

    return res.status(201).json({
      message:
        'Doctor registered successfully. Verify your email first. Admin approval is required before login.',
      user: sanitizeUser(newDoctor)
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const registerAdmin = async (req, res) => {
  try {
    const { fullName, email, password, phone, adminLevel, adminSecret } = req.body;

    if (!fullName || !email || !password || !phone || !adminSecret) {
      return res.status(400).json({
        message: 'fullName, email, password, phone and adminSecret are required'
      });
    }

    if (adminSecret !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({
        message: 'Invalid admin secret'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this email'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await Admin.create({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      adminLevel: adminLevel || 'Admin',
      isVerified: true,
      accountStatus: 'active'
    });

    return res.status(201).json({
      message: 'Admin registered successfully',
      user: sanitizeUser(newAdmin)
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const requestVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Account is already verified' });
    }

    const otpCode = generateOtp();
    user.otp = otpCode;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    await sendEmail({
      email: user.email,
      subject: 'Smart Healthcare - Email Verification OTP',
      message: `Hello ${user.fullName},\n\nYour verification OTP is: ${otpCode}\n\nThis OTP expires in 10 minutes.`
    });

    return res.status(200).json({
      message: 'OTP sent successfully to your email'
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: 'Email and OTP are required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP code' });
    }

    if (!user.otpExpires || user.otpExpires < Date.now()) {
      return res.status(400).json({
        message: 'OTP has expired. Please request a new one.'
      });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    return res.status(200).json({
      message: 'Email verified successfully'
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({
        message: 'Invalid email or password'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Invalid email or password'
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Please verify your email before login'
      });
    }

    if (user.role === 'Doctor') {
      if (user.accountStatus === 'pending') {
        return res.status(403).json({
          message: 'Doctor account is pending admin approval'
        });
      }

      if (user.accountStatus === 'rejected') {
        return res.status(403).json({
          message: 'Doctor account was rejected by admin'
        });
      }

      if (user.accountStatus === 'suspended') {
        return res.status(403).json({
          message: 'Doctor account is suspended'
        });
      }
    }

    if (user.role === 'Patient' || user.role === 'Admin') {
      if (user.accountStatus !== 'active') {
        return res.status(403).json({
          message: 'Account is not active'
        });
      }
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetOtp = generateOtp();
    user.resetPasswordOtp = resetOtp;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    await sendEmail({
      email: user.email,
      subject: 'Smart Healthcare - Password Reset OTP',
      message: `Hello ${user.fullName},\n\nYour password reset OTP is: ${resetOtp}\n\nThis OTP expires in 15 minutes.`
    });

    return res.status(200).json({
      message: 'Password reset OTP sent to your email'
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: 'Email, otp and newPassword are required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.resetPasswordOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({
        message: 'OTP has expired. Please request a new one.'
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.status(200).json({
      message: 'Password reset successfully'
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const requestDoctorVerification = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user._id);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (!doctor.isVerified) {
      return res.status(403).json({
        message: 'Please verify your email first'
      });
    }

    if (doctor.accountStatus === 'active') {
      return res.status(400).json({
        message: 'Doctor account is already approved'
      });
    }

    doctor.accountStatus = 'pending';
    doctor.verificationRequestedAt = new Date();
    doctor.rejectionReason = undefined;

    await doctor.save();

    return res.status(200).json({
      message: 'Doctor verification request sent to admin successfully'
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};
export const getPendingDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ accountStatus: 'pending' }).select('-password');

    return res.status(200).json({
      success: true,
      count: doctors.length,
      doctors
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const approveDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    doctor.accountStatus = 'active';
    doctor.approvedAt = new Date();
    doctor.rejectionReason = undefined;

    await doctor.save();

    return res.status(200).json({
      message: 'Doctor approved successfully',
      doctor: sanitizeUser(doctor)
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const rejectDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    doctor.accountStatus = 'rejected';
    doctor.rejectionReason = reason || 'Doctor verification rejected by admin';

    await doctor.save();

    return res.status(200).json({
      message: 'Doctor rejected successfully',
      doctor: sanitizeUser(doctor)
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;

    const allowedRoles = ['Admin', 'Doctor', 'Patient'];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: 'Invalid role. Allowed roles are Admin, Doctor, Patient'
      });
    }

    const users = await User.find({ role }).select('-password').sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      role,
      users
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    if (req.user._id.toString() === id) {
      return res.status(400).json({
        message: 'Admin cannot delete their own account'
      });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const logout = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Logout successful. Please remove the token from client storage.'
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};