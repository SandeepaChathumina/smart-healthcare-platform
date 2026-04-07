const express = require("express");
const { protect } = require("../middleware/auth");
const {
  createPrescription,
  getPrescriptionsByDoctor,
  getPrescriptionsByPatient,
  getPrescriptionById,
  updatePrescriptionStatus,
} = require("../controllers/prescriptionController");

const router = express.Router();

router.use(protect);

router.post("/", createPrescription);
router.get("/doctor/:doctorId", getPrescriptionsByDoctor);
router.get("/patient/:patientId", getPrescriptionsByPatient);
router.get("/:id", getPrescriptionById);
router.patch("/:id/status", updatePrescriptionStatus);

module.exports = router;