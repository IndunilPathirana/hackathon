const express = require("express");
const router = express.Router();
const { generateTestSteps } = require("../services/openaiService");
const {
  runPlaywrightTest,
  testPegaConnection,
  runPlaywrightLoginTest,
  runDynamicPlaywrightTest,
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

// Run Playwright test (Login and capture screenshot + video)
router.post("/run-hard-test", async (req, res) => {
  try {
    console.log("⚡ Received /run-test request");

    const result = await runPlaywrightLoginTest();
    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Error running Playwright test:", error);
    res.status(500).json({
      success: false,
      message: "Test execution failed!",
      error: error.message,
    });
  }
});

// Run test dynamically based on received Playwright-style steps
router.post("/run-test", async (req, res) => {
  const { steps } = req.body;

  console.log("🧠 /run-test - Incoming steps:", steps);

  if (!steps || typeof steps !== "string") {
    return res.status(400).json({
      success: false,
      message:
        "Invalid or missing 'steps'. Please provide Playwright-style steps as text.",
    });
  }

  try {
    const result = await runDynamicPlaywrightTest(steps);
    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Error running Playwright test:", error);
    res.status(500).json({
      success: false,
      message: "Test execution failed!",
      error: error.message,
    });
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
