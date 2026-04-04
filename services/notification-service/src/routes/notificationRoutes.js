const express = require("express");
const {
  sendAppointmentNotifications,
  getAllNotifications,
  sendTestEmail
} = require("../controllers/notificationController");

const router = express.Router();

router.post("/send", sendAppointmentNotifications);
router.get("/", getAllNotifications);
router.post("/test-email", sendTestEmail);

module.exports = router;