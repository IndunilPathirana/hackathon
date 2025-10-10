const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const os = require("os");
const config = require("../config");
const { uploadToS3 } = require("../utils/s3Helper");

async function runPlaywrightLoginTest() {
  console.log("🚀 Starting Playwright login test...");

  const startTime = Date.now();
  const timestamp = startTime;
  const screenshotFileName = `pega-login-${timestamp}.png`;
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
    const pegaUrl =
      "https://evonsys05.pegalabs.io/prweb/app/district-retirment-cs-system/";
    console.log("🌐 Navigating to:", pegaUrl);

    await page.goto(pegaUrl, { waitUntil: "networkidle" });

    console.log("🧾 Filling in login credentials...");
    await page.fill('input[name="UserIdentifier"]', "DummyUser");
    await page.fill('input[name="Password"]', "Deci@123");
    await page.click('button[type="submit"]');

    console.log("⌛ Waiting for dashboard/home page...");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    console.log("📸 Taking screenshot after login...");
    const screenshotBuffer = await page.screenshot({ fullPage: true });
    const screenshotUrl = await uploadToS3(
      screenshotFileName,
      screenshotBuffer
    );
    console.log("✅ Screenshot uploaded to S3:", screenshotUrl);

    // Close context/browser to finalize video
    await context.close();
    await browser.close();

    // Upload video
    const videoFiles = fs.readdirSync(videoDir);
    let videoUrl = null;

    if (videoFiles.length) {
      const videoPath = path.join(videoDir, videoFiles[0]);
      const videoBuffer = fs.readFileSync(videoPath);
      const videoFileName = `pega-login-${timestamp}.webm`;
      videoUrl = await uploadToS3(videoFileName, videoBuffer);
      console.log("🎥 Video uploaded to S3:", videoUrl);

      // Cleanup temporary files
      fs.unlinkSync(videoPath);
    }
    fs.rmdirSync(videoDir);

    const durationMs = Date.now() - startTime;
    const durationSec = (durationMs / 1000).toFixed(2);

    return {
      success: true,
      message: "Test executed successfully!",
      screenshot: screenshotUrl,
      video: videoUrl,
      duration: `${durationSec}s`,
      executedAt: new Date().toISOString(),
    };
  } catch (error) {
    await browser.close();
    console.error("❌ Error executing test:", error);
    throw error;
  }
}

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

    // TEMPORARILY DISABLED - SimpleLogin testing
    // Step 1: Navigate to login page
    if (lower.includes("login page")) {
      console.log("➡ Navigating to SimpleLogin login page...");
      await page.goto(
        "https://evonsys05.pegalabs.io/prweb/app/district-retirment-cs-system/",
        {
          waitUntil: "networkidle",
        }
      );
    }

    // Step 2: Enter credentials
    if (lower.includes("enter valid credentials")) {
      console.log("🧾 Filling in login credentials...");
      await page.fill('input[name="UserIdentifier"]', "DummyUser"); // Replace with test account
      await page.fill('input[name="Password"]', "Rules@123"); // Replace with test account
      await page.click('button[type="submit"]');
    }

    // Step 3: Verify dashboard
    if (lower.includes("dashboard") || lower.includes("home page")) {
      console.log("✅ Waiting for dashboard to load...");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);
    }

    // For now, just navigate to a simple test page or take a basic screenshot
    console.log("🔧 Running in test mode - taking basic screenshot");
    await page.goto("https://example.com", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

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

async function testPegaConnection(pegaUrl) {
  console.log("🔗 Testing connection to Pega server:", pegaUrl);

  const timestamp = Date.now();
  const screenshotFileName = `pega-test-${timestamp}.png`;

  const browser = await chromium.launch({
    headless: config.playwright.headless,
    args: config.playwright.args,
  });

  const context = await browser.newContext({
    // Set a longer timeout for initial connection
    ignoreHTTPSErrors: true, // In case of SSL issues
  });

  const page = await context.newPage();

  try {
    console.log("🌐 Attempting to navigate to Pega server...");

    // Try to navigate to the Pega URL with a timeout
    const response = await page.goto(pegaUrl, {
      waitUntil: "networkidle",
      timeout: 30000, // 30 second timeout
    });

    console.log("📡 Response status:", response.status());
    console.log("📡 Response URL:", response.url());

    // Wait a bit for any dynamic content to load
    await page.waitForTimeout(3000);

    // Take screenshot
    const screenshotBuffer = await page.screenshot({
      fullPage: true, // Capture full page
    });

    // Upload screenshot to S3
    const screenshotUrl = await uploadToS3(
      screenshotFileName,
      screenshotBuffer
    );
    console.log("📸 Pega test screenshot uploaded to S3:", screenshotUrl);

    // Get page title and basic info
    const pageTitle = await page.title();
    const pageUrl = page.url();

    await browser.close();

    return {
      success: true,
      message: "Successfully connected to Pega server!",
      screenshot: screenshotUrl,
      pageTitle,
      pageUrl,
      responseStatus: response.status(),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    await browser.close();
    console.error("❌ Failed to connect to Pega server:", error.message);

    return {
      success: false,
      message: "Failed to connect to Pega server",
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = {
  runPlaywrightTest,
  runPlaywrightLoginTest,
  testPegaConnection,
};
