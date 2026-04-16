// doctor-service/routes/availabilityRoutes.js

const express = require("express");
const { protect, authorizeRoles } = require("../middleware/auth");
const {
  createAvailability,
  getMyAvailability,
  getAllAvailabilitySlots,
  updateAvailability,
  deleteAvailability,
  checkAvailability,
  getAvailableSlotsByDoctor,
  calculateAvailabilityMetrics,
  checkTimeAvailability,
  incrementBookedCount,
  decrementBookedCount,
  getAllAvailabilitySlotsEnriched
} = require("../controllers/availabilityController");

const router = express.Router();

// Debug endpoint - log request body (remove after debugging)
router.post("/debug/test", (req, res) => {
  console.log("DEBUG endpoint - Request body:", JSON.stringify(req.body, null, 2));
  res.json({
    received: req.body,
    types: {
      dayOfWeek: typeof req.body.dayOfWeek,
      specificDate: typeof req.body.specificDate,
      startTime: typeof req.body.startTime,
      endTime: typeof req.body.endTime,
      breakTime: typeof req.body.breakTime,
      maxAppointments: typeof req.body.maxAppointments,
    }
  });
});

// Public/Patient routes - require authentication but not specific role
router.get("/slots", protect, getAllAvailabilitySlots);
router.get("/slots/enriched", protect, getAllAvailabilitySlotsEnriched);
router.get("/check/:doctorId", protect, checkAvailability);
router.get("/doctor/:doctorId", protect, getAvailableSlotsByDoctor);

// Doctor-specific routes - require authentication and Doctor role
router.use(protect, authorizeRoles("Doctor"));

router.get("/me", getMyAvailability);
router.post("/", createAvailability);
router.patch("/:id", updateAvailability);
router.delete("/:id", deleteAvailability);
router.post("/calculate-metrics", calculateAvailabilityMetrics);
router.post("/check-time", checkTimeAvailability);

// Internal endpoints for appointment service (appointment service should use these)
// These still require authentication but are marked for internal use
router.post("/:availabilityId/increment-booked", incrementBookedCount);
router.post("/:availabilityId/decrement-booked", decrementBookedCount);

module.exports = router;