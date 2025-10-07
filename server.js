require("dotenv").config();
const express = require("express");
const { chromium } = require("playwright");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");
const os = require("os");

const app = express();
app.use(cors());
app.use(express.json());

// AWS S3 setup
const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Helper function to upload file to S3 (without ACL)
async function uploadToS3(fileName, fileContent) {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `tests/${fileName}`,
    Body: fileContent,
    // No ACL needed, bucket policy handles public access
  };
  const data = await s3.upload(params).promise();
  return data.Location; // public URL
}

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

  console.log("🧠 Received steps:\n", steps);

  const timestamp = Date.now();
  const screenshotFileName = `screenshot-${timestamp}.png`;
  const videoDir = fs.mkdtempSync(
    path.join(os.tmpdir(), `video-${timestamp}-`)
  );

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

    // Step 1: Navigate to login page
    if (lower.includes("login page")) {
      console.log("➡ Navigating to SimpleLogin login page...");
      await page.goto("https://app.simplelogin.io/auth/login", {
        waitUntil: "networkidle",
      });
    }

    // Step 2: Enter credentials
    if (lower.includes("enter valid credentials")) {
      console.log("🧾 Filling in login credentials...");
      await page.fill('input[name="email"]', "test@example.com"); // Replace with test account
      await page.fill('input[name="password"]', "testpassword"); // Replace with test account
      await page.click('button[type="submit"]');
    }

    // Step 3: Verify dashboard
    if (lower.includes("dashboard") || lower.includes("home page")) {
      console.log("✅ Waiting for dashboard to load...");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);
    }

    // Take screenshot in memory
    const screenshotBuffer = await page.screenshot();
    const screenshotUrl = await uploadToS3(
      screenshotFileName,
      screenshotBuffer
    );
    console.log("📸 Screenshot uploaded to S3:", screenshotUrl);

    // Close context/browser to finalize video
    await context.close();
    await browser.close();

    // Upload video
    const videoFiles = fs.readdirSync(videoDir);
    let videoUrl = null;
    if (videoFiles.length) {
      const videoPath = path.join(videoDir, videoFiles[0]);
      const videoBuffer = fs.readFileSync(videoPath);
      const videoFileName = `video-${timestamp}.webm`;
      videoUrl = await uploadToS3(videoFileName, videoBuffer);
      console.log("🎥 Video uploaded to S3:", videoUrl);

      // Delete temp video file and folder
      fs.unlinkSync(videoPath);
    }
    fs.rmdirSync(videoDir);

    res.json({
      success: true,
      message: "Test executed successfully!",
      screenshot: screenshotUrl,
      video: videoUrl,
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
