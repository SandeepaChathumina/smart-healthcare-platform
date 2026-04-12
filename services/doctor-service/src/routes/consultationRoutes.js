const express = require("express");
const { protect, authorizeRoles } = require("../middleware/auth");
const {
  createConsultationNote,
  getConsultationNoteByAppointment,
  getMyConsultationNotes,
} = require("../controllers/consultationController");

const router = express.Router();

router.post("/", protect, authorizeRoles("Doctor"), createConsultationNote);
router.get("/me", protect, authorizeRoles("Doctor"), getMyConsultationNotes);
router.get("/:appointmentId", protect, authorizeRoles("Doctor", "Patient"), getConsultationNoteByAppointment);

module.exports = router;