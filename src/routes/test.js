const express = require("express");
const router = express.Router();
const { generateTestSteps } = require("../services/openaiService");
const {
  runPlaywrightTest,
  testPegaConnection,
} = require("../services/playwrightService");
const config = require("../config");

// Generate test steps using ChatGPT
router.post("/generate-test", async (req, res) => {
  const { Description } = req.body;

  // Log the request body
  console.log(
    "📝 /generate-test - Request Body:",
    JSON.stringify(req.body, null, 2)
  );

  console.log("🤖 Generating test steps for:", Description);
  // console.log(
  //   "🔑 Using OpenAI API Key:",
  //   config.openai.apiKey ? "✅ Configured" : "❌ Missing"
  // );

  try {
    const steps = await generateTestSteps(Description);
    res.json({ steps });
  } catch (err) {
    console.error("❌ Test generation error:", err.message);
    res.status(500).send("Error generating test");
  }
});

// Run test with Playwright
router.post("/run-test", async (req, res) => {
  const { steps } = req.body;

  // Log the request body
  console.log(
    "📝 /run-test - Request Body:",
    JSON.stringify(req.body, null, 2)
  );

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

// Test Pega server connectivity
router.post("/test-pega-connection", async (req, res) => {
  const pegaUrl =
    "https://evonsys05.pegalabs.io/prweb/app/district-retirment-cs-system/";

  console.log("📝 /test-pega-connection - Testing connectivity to:", pegaUrl);

  try {
    const result = await testPegaConnection(pegaUrl);
    res.json(result);
  } catch (err) {
    console.error("❌ Error testing Pega connection:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
