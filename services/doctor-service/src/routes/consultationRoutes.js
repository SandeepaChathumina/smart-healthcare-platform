const express = require("express");
const { protect, authorizeRoles } = require("../middleware/auth");
const {
  createConsultationNote,
  getConsultationNoteByAppointment,
  getConsultationNoteById,
  getMyConsultationNotes,
  updateConsultationNote,
} = require("../controllers/consultationController");

const router = express.Router();

router.post("/", protect, authorizeRoles("Doctor"), createConsultationNote);
router.get("/me", protect, authorizeRoles("Doctor"), getMyConsultationNotes);
router.get("/appointment/:appointmentId", protect, getConsultationNoteByAppointment);
router.get("/:id", protect, getConsultationNoteById);
router.patch("/:id", protect, authorizeRoles("Doctor"), updateConsultationNote);

module.exports = router;