const express = require("express");
const { protect } = require("../middleware/auth");
const {
  createConsultationNote,
  getConsultationNoteByAppointment,
  getMyConsultationNotes,
} = require("../controllers/consultationController");

const router = express.Router();

router.use(protect);

router.post("/", createConsultationNote);
router.get("/me", getMyConsultationNotes);
router.get("/:appointmentId", getConsultationNoteByAppointment);

module.exports = router;