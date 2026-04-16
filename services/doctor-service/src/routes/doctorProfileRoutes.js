const express = require("express");
const { protect, authorizeRoles } = require("../middleware/auth");
const {
  getDoctorProfile,
  updateDoctorProfile,
  getDoctorStats,
  getDoctorPatients,
  getDoctorDetailsById
} = require("../controllers/doctorProfileController");

const router = express.Router();

router.get("/details/:doctorId", getDoctorDetailsById);


router.use(protect, authorizeRoles("Doctor"));

router.get("/profile", getDoctorProfile);
router.put("/profile", updateDoctorProfile);
router.get("/stats", getDoctorStats);
router.get("/patients", getDoctorPatients);


module.exports = router;