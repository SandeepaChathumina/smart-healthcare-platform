const express = require('express');
const { protect, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  uploadReport,
  getAllReports,
  getReportById,
  deleteReport,
  getMedicalHistory,
  updateMedicalHistory,
  getAppointmentHistory,
  getAppointmentById,
  getPrescriptions,
  getPrescriptionById,
  downloadReport
} = require('../controllers/patientController');

const router = express.Router();

// All routes require authentication and Patient role
router.use(protect, authorizeRoles('Patient'));

// Report routes
router.post('/reports/upload', upload.single('file'), uploadReport);
router.get('/reports', getAllReports);
router.get('/reports/:id', getReportById);
router.delete('/reports/:id', deleteReport);

// Medical history routes
router.get('/medical-history', getMedicalHistory);
router.put('/medical-history', updateMedicalHistory);

// Appointment history routes
router.get('/appointments', getAppointmentHistory);
router.get('/appointments/:id', getAppointmentById);

// Prescription routes
router.get('/prescriptions', getPrescriptions);
router.get('/prescriptions/:id', getPrescriptionById);

router.get('/reports/download/:id', protect, authorizeRoles('Patient'), downloadReport);

module.exports = router;