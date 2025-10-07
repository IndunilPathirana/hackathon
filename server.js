require("dotenv").config();
const express = require("express");
const axios = require("axios");
const { chromium } = require("playwright");

const app = express();
app.use(express.json());

// Test endpoint
app.get("/", (req, res) => {
  res.send("Intelligent Test Automation API running");
});

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
app.post("/run-test", async (req, res) => {
  const { steps } = req.body;

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // For demo: navigate to example.com
    await page.goto("https://example.com");
    // TODO: convert steps into Playwright commands dynamically
    console.log("Test steps:", steps);

    await browser.close();
    res.json({ message: "Test run completed" });
  } catch (err) {
    console.error(err.message);
    await browser.close();
    res.status(500).send("Test failed");
  }
});

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
