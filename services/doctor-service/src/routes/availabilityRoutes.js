const express = require("express");
const { protect, authorizeRoles } = require("../middleware/auth");
const {
  createAvailability,
  getMyAvailability,
  updateAvailability,
  deleteAvailability,
  checkAvailability,
} = require("../controllers/availabilityController");

const router = express.Router();

router.get("/me", protect, authorizeRoles("Doctor"), getMyAvailability);
router.get("/check/:doctorId", protect, authorizeRoles("Patient", "Doctor", "Admin"), checkAvailability);
router.post("/", protect, authorizeRoles("Doctor"), createAvailability);
router.patch("/:id", protect, authorizeRoles("Doctor"), updateAvailability);
router.delete("/:id", protect, authorizeRoles("Doctor"), deleteAvailability);

module.exports = router;