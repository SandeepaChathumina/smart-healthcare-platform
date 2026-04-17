const express = require("express");
const { protect, authorizeRoles } = require("../middleware/auth");
const {
  createConsultationNote,
  getConsultationNoteByAppointment,
  getConsultationNoteById,
  getMyConsultationNotes,
  getConsultationNotesByPatient,
  updateConsultationNote,
  deleteConsultationNote,
} = require("../controllers/consultationController");

const router = express.Router();

router.post("/", protect, authorizeRoles("Doctor"), createConsultationNote);
router.get("/me", protect, authorizeRoles("Doctor"), getMyConsultationNotes);
router.get("/patient/:patientId", protect, getConsultationNotesByPatient);
router.get("/appointment/:appointmentId", protect, getConsultationNoteByAppointment);
router.get("/:id", protect, getConsultationNoteById);
router.patch("/:id", protect, authorizeRoles("Doctor"), updateConsultationNote);
router.delete("/:id", protect, authorizeRoles("Doctor"), deleteConsultationNote);

module.exports = router;