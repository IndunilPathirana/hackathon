class RequestMonitor {
  constructor() {
    this.stats = {
      totalRequests: 0,
      requestsByMethod: {},
      requestsByEndpoint: {},
      responseTimeStats: {
        min: null,
        max: null,
        avg: 0,
        total: 0,
      },
      statusCodes: {},
      errors: [],
    };
    this.activeRequests = new Map();
  }

  logRequest(req, res) {
    const requestId = `${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const startTime = Date.now();

    // Track request start
    this.activeRequests.set(requestId, {
      method: req.method,
      url: req.originalUrl,
      startTime,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get("User-Agent"),
    });

    // Update stats
    this.stats.totalRequests++;
    this.stats.requestsByMethod[req.method] =
      (this.stats.requestsByMethod[req.method] || 0) + 1;
    this.stats.requestsByEndpoint[req.originalUrl] =
      (this.stats.requestsByEndpoint[req.originalUrl] || 0) + 1;

    // Monitor response
    res.on("finish", () => {
      const duration = Date.now() - startTime;

      // Update response time stats
      if (
        this.stats.responseTimeStats.min === null ||
        duration < this.stats.responseTimeStats.min
      ) {
        this.stats.responseTimeStats.min = duration;
      }
      if (
        this.stats.responseTimeStats.max === null ||
        duration > this.stats.responseTimeStats.max
      ) {
        this.stats.responseTimeStats.max = duration;
      }

      this.stats.responseTimeStats.total += duration;
      this.stats.responseTimeStats.avg =
        this.stats.responseTimeStats.total / this.stats.totalRequests;

      // Track status codes
      this.stats.statusCodes[res.statusCode] =
        (this.stats.statusCodes[res.statusCode] || 0) + 1;

      // Log errors
      if (res.statusCode >= 400) {
        this.stats.errors.push({
          timestamp: new Date().toISOString(),
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          duration,
          ip: req.ip || req.connection.remoteAddress,
        });
      }

      // Remove from active requests
      this.activeRequests.delete(requestId);
    });

    return requestId;
  }

  getStats() {
    return {
      ...this.stats,
      activeRequestsCount: this.activeRequests.size,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
  }

  getActiveRequests() {
    return Array.from(this.activeRequests.entries()).map(([id, req]) => ({
      id,
      ...req,
      duration: Date.now() - req.startTime,
    }));
  }

  reset() {
    this.stats = {
      totalRequests: 0,
      requestsByMethod: {},
      requestsByEndpoint: {},
      responseTimeStats: { min: null, max: null, avg: 0, total: 0 },
      statusCodes: {},
      errors: [],
    };
    this.activeRequests.clear();
  }
}

// Create a singleton instance
const monitor = new RequestMonitor();

module.exports = monitor;
