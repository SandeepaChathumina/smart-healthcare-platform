const express = require("express");
const { protect, authorizeRoles } = require("../middleware/auth");
const {
  createPrescription,
  getPrescriptionsByDoctor,
  getPrescriptionsByPatient,
  getPrescriptionById,
  updatePrescriptionStatus,
} = require("../controllers/prescriptionController");

const router = express.Router();

router.post("/", protect, authorizeRoles("Doctor"), createPrescription);
router.get("/doctor/:doctorId", protect, authorizeRoles("Doctor", "Admin"), getPrescriptionsByDoctor);
router.get("/patient/:patientId", protect, authorizeRoles("Patient", "Doctor", "Admin"), getPrescriptionsByPatient);
router.get("/:id", protect, authorizeRoles("Patient", "Doctor", "Admin"), getPrescriptionById);
router.patch("/:id/status", protect, authorizeRoles("Doctor"), updatePrescriptionStatus);

module.exports = router;