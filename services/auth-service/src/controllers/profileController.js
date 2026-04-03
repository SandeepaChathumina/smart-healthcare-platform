import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'Profile not found'
      });
    }

    return res.status(200).json({
      success: true,
      profile: user
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: 'Profile not found'
      });
    }

    const commonFields = ['fullName', 'phone', 'location'];
    const patientFields = [
      'gender',
      'dateOfBirth',
      'emergencyContactName',
      'emergencyContactPhone',
      'bloodGroup',
      'allergies'
    ];
    const doctorFields = [
      'specialization',
      'qualifications',
      'licenseNumber',
      'hospitalOrClinic',
      'experience',
      'consultationFee',
      'bio'
    ];

    commonFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    if (user.role === 'Patient') {
      patientFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          user[field] = req.body[field];
        }
      });
    }

    if (user.role === 'Doctor') {
      doctorFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          user[field] = req.body[field];
        }
      });
    }

    await user.save();

    const updatedUser = await User.findById(user._id).select('-password');

    return res.status(200).json({
      message: 'Profile updated successfully',
      profile: updatedUser
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const getAllApprovedDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({
      accountStatus: 'active',
      isVerified: true
    })
      .select('-password -otp -otpExpires -resetPasswordOtp -resetPasswordExpires')
      .sort({ createdAt: -1 });

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

export const getApprovedDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findOne({
      _id: id,
      accountStatus: 'active',
      isVerified: true
    }).select('-password -otp -otpExpires -resetPasswordOtp -resetPasswordExpires');

    if (!doctor) {
      return res.status(404).json({
        message: 'Approved doctor not found'
      });
    }

    return res.status(200).json({
      success: true,
      doctor
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const getAllPatientsForDoctor = async (req, res) => {
  try {
    const patients = await Patient.find({
      accountStatus: 'active',
      isVerified: true
    })
      .select('-password -otp -otpExpires -resetPasswordOtp -resetPasswordExpires')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: patients.length,
      patients
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const getPatientByIdForDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findOne({
      _id: id,
      accountStatus: 'active',
      isVerified: true
    }).select('-password -otp -otpExpires -resetPasswordOtp -resetPasswordExpires');

    if (!patient) {
      return res.status(404).json({
        message: 'Patient not found'
      });
    }

    return res.status(200).json({
      success: true,
      patient
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};