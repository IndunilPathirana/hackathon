require("dotenv").config();
const express = require("express");
const axios = require("axios");
const { chromium } = require("playwright");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Generate test steps using ChatGPT
app.post("/generate-test", async (req, res) => {
  const { description } = req.body;

  //   console.log("description", description);
  console.log("Api Key", process.env.OPENAI_API_KEY);

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a QA automation engineer." },
          {
            role: "user",
            content: `Write Cucumber style steps for: ${description}`,
          },
        ],
        temperature: 0,
      },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        "Content-Type": "application/json",
      }
    );

    const steps = response.data.choices[0].message.content;
    res.json({ steps });
  } catch (err) {
    console.error("error is ", err.message);
    res.status(500).send("Error generating test");
  }
});

// Run test with Playwright
// Run test with Playwright (DigitalOcean-ready)
// Run test with Playwright (fixed for video path)
app.post("/run-test", async (req, res) => {
  const { steps } = req.body;
  if (!steps) return res.status(400).json({ error: "Missing test steps" });

  const fs = require("fs");
  const timestamp = Date.now();
  const screenshotPath = `./screenshots/screenshot-${timestamp}.png`;
  const videoDir = `./videos/test-${timestamp}`;
  if (!fs.existsSync("./screenshots")) fs.mkdirSync("./screenshots");
  if (!fs.existsSync("./videos")) fs.mkdirSync("./videos");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    recordVideo: { dir: videoDir, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();

  try {
    const lower = steps.toLowerCase();

    if (lower.includes("login page")) {
      await page.goto("https://app.simplelogin.io/auth/login", {
        waitUntil: "networkidle",
      });
    }
    if (lower.includes("enter valid credentials")) {
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="password"]', "testpassword");
      await page.click('button[type="submit"]');
    }
    if (lower.includes("dashboard") || lower.includes("home page")) {
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: screenshotPath });

    // Close browser/context first
    await context.close();
    await browser.close();

    // Get video file path after context is closed
    const videoFiles = fs.readdirSync(videoDir);
    const videoFile = videoFiles.length ? `${videoDir}/${videoFiles[0]}` : null;

    res.json({
      success: true,
      message: "Test executed successfully!",
      screenshot: screenshotPath,
      video: videoFile,
    });
  } catch (err) {
    await browser.close();
    console.error("❌ Error executing test:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
