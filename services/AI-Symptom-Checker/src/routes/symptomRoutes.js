const express = require("express");
const router = express.Router();
const { checkSymptoms } = require("../controllers/symptomController");

router.post("/check", checkSymptoms);

module.exports = router;