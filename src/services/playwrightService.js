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
  console.log("🧠 Starting dynamic Playwright test...");
  const startTime = Date.now();
  const timestamp = startTime;

  const screenshotFileName = `dynamic-test-${timestamp}.png`;
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
    // Split into steps
    const steps = stepsText
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log("📜 Parsed steps:", steps);

    for (const step of steps) {
      const lower = step.toLowerCase();
      console.log(`⚙️ Executing step: "${step}"`);

      // Navigation
      if (lower.includes("go to") || lower.includes("navigate to")) {
        const urlMatch = step.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          const url = urlMatch[0];
          console.log("🌍 Navigating to:", url);
          await page.goto(url, { waitUntil: "networkidle" });
        }
      }

      // Input fields
      else if (lower.includes("enter") || lower.includes("fill")) {
        const valueMatch = step.match(/'(.*?)'/);
        const nameMatch = step.match(/'(.*?)'/g);
        if (nameMatch && nameMatch.length >= 2) {
          const value = nameMatch[0].replace(/'/g, "");
          const field = nameMatch[1].replace(/'/g, "");
          console.log(`⌨️ Filling field [${field}] with value [${value}]`);
          await page.fill(`input[name="${field}"]`, value);
        } else if (valueMatch) {
          console.log(`⚠️ Could not extract field name properly from: ${step}`);
        }
      }

      // Clicks
      else if (lower.includes("click")) {
        const buttonMatch = step.match(/'(.*?)'/);
        if (buttonMatch) {
          const label = buttonMatch[1];
          console.log(`🖱️ Clicking button with label: ${label}`);
          await page.click(`text=${label}`).catch(async () => {
            await page.click(`button:has-text("${label}")`).catch(() => {
              console.log(`⚠️ Could not find button: ${label}`);
            });
          });
        }
      }

      // Wait / pause
      else if (lower.includes("wait") || lower.includes("pause")) {
        const timeMatch = step.match(/\d+/);
        const ms = timeMatch ? parseInt(timeMatch[0]) * 1000 : 2000;
        console.log(`⏳ Waiting for ${ms}ms`);
        await page.waitForTimeout(ms);
      }

      // Expectations (just logs for now)
      else if (lower.includes("expect") || lower.includes("verify")) {
        console.log("🔍 Expectation step detected (mock verification)");
        // Future: can use page.textContent() or expect-like assertions
      }
    }

    console.log("📸 Taking final screenshot...");
    const screenshotBuffer = await page.screenshot({ fullPage: true });
    const screenshotUrl = await uploadToS3(
      screenshotFileName,
      screenshotBuffer
    );
    console.log("✅ Screenshot uploaded to S3:", screenshotUrl);

    await context.close();
    await browser.close();

    // Upload video
    const videoFiles = fs.readdirSync(videoDir);
    let videoUrl = null;

    if (videoFiles.length) {
      const videoPath = path.join(videoDir, videoFiles[0]);
      const videoBuffer = fs.readFileSync(videoPath);
      const videoFileName = `dynamic-test-${timestamp}.webm`;
      videoUrl = await uploadToS3(videoFileName, videoBuffer);
      console.log("🎥 Video uploaded to S3:", videoUrl);

      // Cleanup temp files
      fs.unlinkSync(videoPath);
    }
    fs.rmdirSync(videoDir);

    const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

    return {
      success: true,
      message: "Dynamic Playwright test executed successfully!",
      screenshot: screenshotUrl,
      video: videoUrl,
      duration: `${durationSec}s`,
      executedAt: new Date().toISOString(),
    };
  } catch (error) {
    await browser.close();
    console.error("❌ Error executing dynamic test:", error);
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
  runPlaywrightLoginTest,
  testPegaConnection,
  runDynamicPlaywrightTest,
};
