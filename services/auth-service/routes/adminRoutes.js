import express from 'express';
import {
  getPendingDoctors,
  approveDoctor,
  rejectDoctor,
  getAllUsers,
  getUsersByRole,
  getUserById,
  deleteUser
} from '../controllers/authController.js';
import {
  protect,
  authorizeRoles,
  ensureEmailVerified
} from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, authorizeRoles('Admin'), ensureEmailVerified);

router.get('/doctors/pending', getPendingDoctors);
router.put('/doctors/:id/approve', approveDoctor);
router.put('/doctors/:id/reject', rejectDoctor);

router.get('/users', getAllUsers);
router.get('/users/role/:role', getUsersByRole);
router.get('/users/:id', getUserById);
router.delete('/users/:id', deleteUser);

export default router;