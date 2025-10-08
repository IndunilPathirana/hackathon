const express = require("express");
const router = express.Router();

// Health check endpoint
router.get("/", (req, res) => {
  res.send("Intelligent Test Automation API running");
});

module.exports = router;
