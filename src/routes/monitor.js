const express = require("express");
const router = express.Router();
const monitor = require("../utils/requestMonitor");

// Get monitoring stats
router.get("/stats", (req, res) => {
  const stats = monitor.getStats();
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    stats,
  });
});

// Get active requests
router.get("/active", (req, res) => {
  const activeRequests = monitor.getActiveRequests();
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    activeRequests,
    count: activeRequests.length,
  });
});

// Reset stats (useful for debugging)
router.post("/reset", (req, res) => {
  monitor.reset();
  res.json({
    success: true,
    message: "Monitoring stats reset",
    timestamp: new Date().toISOString(),
  });
});

// Real-time monitoring dashboard (simple HTML)
router.get("/dashboard", (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Request Monitor Dashboard</title>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; }
            .card { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
            .stat-item { background: #e3f2fd; padding: 15px; border-radius: 5px; text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #1976d2; }
            .stat-label { color: #666; margin-top: 5px; }
            h1, h2 { color: #333; }
            .refresh-btn { background: #1976d2; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; }
            .refresh-btn:hover { background: #1565c0; }
            pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 Request Monitor Dashboard</h1>
            <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>
            
            <div class="card">
                <h2>Quick Stats</h2>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-value" id="totalRequests">-</div>
                        <div class="stat-label">Total Requests</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="avgResponseTime">-</div>
                        <div class="stat-label">Avg Response Time (ms)</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="activeRequests">-</div>
                        <div class="stat-label">Active Requests</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="uptime">-</div>
                        <div class="stat-label">Uptime (seconds)</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h2>📊 Detailed Stats</h2>
                <pre id="detailedStats">Loading...</pre>
            </div>
        </div>

        <script>
            async function loadStats() {
                try {
                    const response = await fetch('/monitor/stats');
                    const data = await response.json();
                    const stats = data.stats;
                    
                    document.getElementById('totalRequests').textContent = stats.totalRequests;
                    document.getElementById('avgResponseTime').textContent = Math.round(stats.responseTimeStats.avg);
                    document.getElementById('activeRequests').textContent = stats.activeRequestsCount;
                    document.getElementById('uptime').textContent = Math.round(stats.uptime);
                    document.getElementById('detailedStats').textContent = JSON.stringify(stats, null, 2);
                } catch (error) {
                    console.error('Error loading stats:', error);
                    document.getElementById('detailedStats').textContent = 'Error loading stats: ' + error.message;
                }
            }
            
            loadStats();
            setInterval(loadStats, 5000); // Auto-refresh every 5 seconds
        </script>
    </body>
    </html>
  `;
  res.send(html);
});

module.exports = router;
