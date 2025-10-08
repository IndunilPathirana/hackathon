const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const os = require("os");
const config = require("../config");
const { uploadToS3 } = require("../utils/s3Helper");

async function runPlaywrightTest(steps) {
  console.log("🧠 Received steps:\n", steps);

  const timestamp = Date.now();
  const screenshotFileName = `screenshot-${timestamp}.png`;
  const videoDir = fs.mkdtempSync(
    path.join(os.tmpdir(), `video-${timestamp}-`)
  );

  const browser = await chromium.launch({
    headless: config.playwright.headless,
    args: config.playwright.args,
  });

  const context = await browser.newContext({
    recordVideo: {
      dir: videoDir,
      size: config.playwright.videoSettings.size,
    },
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

    return {
      success: true,
      message: "Test executed successfully!",
      screenshot: screenshotUrl,
      video: videoUrl,
    };
  } catch (error) {
    await browser.close();
    console.error("❌ Error executing test:", error);
    throw error;
  }
}

module.exports = {
  runPlaywrightTest,
};
