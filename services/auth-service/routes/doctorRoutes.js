import express from 'express';
import { getMyProfile, updateMyProfile,getAllPatientsForDoctor,getPatientByIdForDoctor } from '../controllers/profileController.js';
import {
  protect,
  authorizeRoles,
  ensureEmailVerified,
  ensureDoctorApproved
} from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(
  protect,
  authorizeRoles('Doctor'),
  ensureEmailVerified,
  ensureDoctorApproved
);

router.get('/profile', getMyProfile);
router.put('/profile', updateMyProfile);
router.get('/patients', getAllPatientsForDoctor);
router.get('/patients/:id', getPatientByIdForDoctor);

export default router;