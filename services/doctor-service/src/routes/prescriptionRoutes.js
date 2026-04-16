const express = require("express");
const { protect, authorizeRoles } = require("../middleware/auth");
const {
  createPrescription,
  getPrescriptionsByDoctor,
  getPrescriptionsByPatient,
  getPrescriptionById,
  getPrescriptionByAppointment,
  updatePrescription,
  updatePrescriptionStatus,
  deletePrescription,
  getPatientPrescriptionsSummary,
} = require("../controllers/prescriptionController");

const router = express.Router();

router.post("/", protect, authorizeRoles("Doctor"), createPrescription);
router.get("/doctor/:doctorId", protect, getPrescriptionsByDoctor);
router.get("/patient/:patientId", protect, getPrescriptionsByPatient);
router.get("/patient/:patientId/summary", protect, getPatientPrescriptionsSummary);
router.get("/appointment/:appointmentId", protect, getPrescriptionByAppointment);
router.get("/:id", protect, getPrescriptionById);
router.put("/:id", protect, authorizeRoles("Doctor"), updatePrescription);
router.patch("/:id/status", protect, authorizeRoles("Doctor"), updatePrescriptionStatus);
router.delete("/:id", protect, authorizeRoles("Doctor"), deletePrescription);

module.exports = router;