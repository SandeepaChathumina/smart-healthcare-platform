const express = require("express");
const { protect, authorizeRoles } = require("../middleware/auth");
const {
  createPrescription,
  getPrescriptionsByDoctor,
  getPrescriptionsByPatient,
  getPrescriptionById,
  updatePrescriptionStatus,
  getPatientPrescriptionsSummary,
} = require("../controllers/prescriptionController");

const router = express.Router();

router.post("/", protect, authorizeRoles("Doctor"), createPrescription);
router.get("/doctor/:doctorId", protect, getPrescriptionsByDoctor);
router.get("/patient/:patientId", protect, getPrescriptionsByPatient);
router.get("/patient/:patientId/summary", protect, getPatientPrescriptionsSummary);
router.get("/:id", protect, getPrescriptionById);
router.patch("/:id/status", protect, authorizeRoles("Doctor"), updatePrescriptionStatus);

module.exports = router;