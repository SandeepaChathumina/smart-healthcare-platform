import express from 'express';
import { getMyProfile, updateMyProfile, getAllApprovedDoctors, getApprovedDoctorById} from '../controllers/profileController.js';
import {
  protect,
  authorizeRoles,
  ensureEmailVerified
} from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, authorizeRoles('Patient'), ensureEmailVerified);

router.get('/profile', getMyProfile);
router.put('/profile', updateMyProfile);

router.get('/doctors', getAllApprovedDoctors);
router.get('/doctors/:id', getApprovedDoctorById);

export default router;