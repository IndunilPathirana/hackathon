const express = require("express");
const cors = require("cors");
const config = require("./src/config");

// Import routes
const indexRoutes = require("./src/routes/index");
const testRoutes = require("./src/routes/test");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/", indexRoutes);
app.use("/", testRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message:
      config.server.env === "development"
        ? err.message
        : "Something went wrong",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = config.server.port;

app.listen(PORT, () => {
  console.log(`🚀 Intelligent Test Automation API running on port ${PORT}`);
  console.log(`📊 Environment: ${config.server.env}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
});

module.exports = app;
