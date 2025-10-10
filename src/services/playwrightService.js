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

async function runDynamicPlaywrightTest(stepsText) {
  const startTime = Date.now();
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
    const lines = stepsText.split("\n").map((line) => line.trim());

    for (const line of lines) {
      if (!line) continue;
      console.log("⚙️ Executing step:", line);

      // Navigate to URL
      if (line.startsWith("Given I navigate to")) {
        const match = line.match(/Given I navigate to "(.*)"/);
        if (match) {
          const url = match[1];
          console.log("🌐 Navigating to:", url);
          await page.goto(url, { waitUntil: "networkidle" });
        }
      }

      // Fill input fields
      else if (
        line.startsWith("When I fill") ||
        line.startsWith("And I fill")
      ) {
        const match = line.match(/I fill "(.*)" with "(.*)"/);
        if (match) {
          const fieldName = match[1];
          const value = match[2];
          console.log(`🧾 Filling field '${fieldName}' with '${value}'`);
          await page.waitForSelector(`input[name="${fieldName}"]`, {
            timeout: 10000,
          });
          await page.fill(`input[name="${fieldName}"]`, value);
        }
      }

      // Click button
      else if (line.startsWith("And I click")) {
        const match = line.match(/I click the "(.*)" button/);
        if (match) {
          const buttonTypeOrText = match[1];
          console.log(`🔘 Clicking button '${buttonTypeOrText}'`);
          try {
            await page.click(`button[type="${buttonTypeOrText}"]`);
          } catch {
            await page.click(`button:has-text("${buttonTypeOrText}")`);
          }
        }
      }

      // Wait for dashboard/homepage
      else if (
        line.startsWith("Then I should see") ||
        line.includes("homepage loaded")
      ) {
        console.log("⌛ Waiting for dashboard/home page...");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(3000);
      }
    }

    // Take screenshot
    console.log("📸 Taking screenshot...");
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
      const videoFileName = `video-${timestamp}.webm`;
      videoUrl = await uploadToS3(videoFileName, videoBuffer);
      console.log("🎥 Video uploaded to S3:", videoUrl);

      // Cleanup temp files
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
    console.error("❌ Error executing dynamic test:", error);
    return {
      success: false,
      message: "Test execution failed!",
      error: error.message,
    };
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
  runPlaywrightLoginTest,
  testPegaConnection,
  runDynamicPlaywrightTest,
};
