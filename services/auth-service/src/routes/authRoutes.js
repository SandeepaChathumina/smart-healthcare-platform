import express from 'express';
import {
  registerPatient,
  registerDoctor,
  registerAdmin,
  login,
  logout,
  requestVerificationOTP,
  verifyEmail,
  forgotPassword,
  resetPassword,
  requestDoctorVerification
} from '../controllers/authController.js';
import {
  protect,
  authorizeRoles
} from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register/patient', registerPatient);
router.post('/register/doctor', registerDoctor);
router.post('/register/admin', registerAdmin);

router.post('/login', login);
router.post('/logout', protect, logout);

router.post('/request-otp', requestVerificationOTP);
router.post('/verify-email', verifyEmail);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.put(
  '/doctor/request-verification',
  protect,
  authorizeRoles('Doctor'),
  requestDoctorVerification
);

export default router;