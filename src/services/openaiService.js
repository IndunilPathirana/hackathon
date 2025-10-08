const axios = require("axios");
const config = require("../config");

async function generateTestSteps(description) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: config.openai.model,
        messages: [
          { role: "system", content: "You are a QA automation engineer." },
          {
            role: "user",
            content: `Write Cucumber style steps for: ${description}`,
          },
        ],
        temperature: config.openai.temperature,
      },
      {
        headers: { Authorization: `Bearer ${config.openai.apiKey}` },
        "Content-Type": "application/json",
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI API error:", error.message);
    throw error;
  }
}

module.exports = {
  generateTestSteps,
};
