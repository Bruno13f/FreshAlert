import express from "express";

/**
 * Configure Express middleware
 */
export function setupMiddleware(app) {
  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Basic security headers
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
  });

  // Request logging middleware
  app.use((req, res, next) => {
    console.log(
      `📝 ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`
    );
    next();
  });
}

/**
 * Handle 404 routes
 */
export function setup404Handler(app) {
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: "Route not found",
      message: `Cannot ${req.method} ${req.originalUrl}`,
      timestamp: new Date().toISOString(),
    });
  });
}

/**
 * Global error handler
 */
export function setupErrorHandler(app) {
  app.use((error, req, res, next) => {
    console.error("❌ Unhandled error:", error);

    res.status(500).json({
      success: false,
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
      timestamp: new Date().toISOString(),
    });
  });
}
