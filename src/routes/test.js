const express = require("express");
const router = express.Router();
const { generateTestSteps } = require("../services/openaiService");
const { runPlaywrightTest } = require("../services/playwrightService");
const config = require("../config");

// Generate test steps using ChatGPT
router.post("/generate-test", async (req, res) => {
  const { description } = req.body;

  console.log("🤖 Generating test steps for:", description);
  console.log(
    "🔑 Using OpenAI API Key:",
    config.openai.apiKey ? "✅ Configured" : "❌ Missing"
  );

  try {
    const steps = await generateTestSteps(description);
    res.json({ steps });
  } catch (err) {
    console.error("❌ Test generation error:", err.message);
    res.status(500).send("Error generating test");
  }
});

// Run test with Playwright
router.post("/run-test", async (req, res) => {
  const { steps } = req.body;

  if (!steps) {
    return res.status(400).json({ error: "Missing test steps" });
  }

  try {
    const result = await runPlaywrightTest(steps);
    res.json(result);
  } catch (err) {
    console.error("❌ Error executing test:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
