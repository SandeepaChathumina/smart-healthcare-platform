const express = require("express");
const { protect } = require("../middleware/auth");
const {
  createAvailability,
  getMyAvailability,
  updateAvailability,
  deleteAvailability,
  checkAvailability,
} = require("../controllers/availabilityController");

const router = express.Router();

router.use(protect);

router.get("/me", getMyAvailability);
router.get("/check/:doctorId", checkAvailability);
router.post("/", createAvailability);
router.patch("/:id", updateAvailability);
router.delete("/:id", deleteAvailability);

module.exports = router;