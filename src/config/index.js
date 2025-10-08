require("dotenv").config();

const config = {
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || "development",
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4",
    temperature: 0,
  },
  aws: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3BucketName: process.env.S3_BUCKET_NAME,
  },
  playwright: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    videoSettings: {
      size: { width: 1280, height: 720 },
    },
  },
};

// Validate required environment variables
const requiredEnvVars = [
  "OPENAI_API_KEY",
  "AWS_REGION",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "S3_BUCKET_NAME",
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(
    "❌ Missing required environment variables:",
    missingEnvVars.join(", ")
  );
  process.exit(1);
}

module.exports = config;
