const express = require("express");
const {
  sendNotifications,
  getAllNotifications,
  sendTestEmail,
} = require("../controllers/notificationController");

const router = express.Router();

router.post("/send", sendNotifications);
router.get("/", getAllNotifications);
router.post("/test-email", sendTestEmail);

module.exports = router;