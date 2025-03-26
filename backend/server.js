// server.js
// Load environment variables
require("dotenv").config();

// Initialize Supabase with credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

// Validate credentials existence before initialization
if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Error: Supabase credentials not found in environment variables"
  );
  process.exit(1);
}

// Initialize Supabase client
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(supabaseUrl, supabaseKey);

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const responseTime = require("response-time");
const { body, validationResult } = require("express-validator");
const logger = require("./utils/logger");
const { Client } = require("pg");
const swaggerDocs = require("./utils/swagger");

// Environment configuration
const config = {
  port: process.env.PORT || 5001,
  nodeEnv: process.env.NODE_ENV || "development",
  database: {
    url: process.env.DATABASE_URL,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  },
};

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// Configure rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes",
});

// Apply rate limiting to API routes
app.use("/api/", apiLimiter);

// Basic middleware
app.use(express.json());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 86400, // 24 hours
};

// Apply CORS middleware with options
app.use(cors(corsOptions));

// Handle OPTIONS preflight requests
app.options("*", cors(corsOptions));

// Performance monitoring
app.use(
  responseTime((req, res, time) => {
    if (time > 1000) {
      logger.warn(
        `Slow response: ${req.method} ${req.originalUrl} - ${time.toFixed(2)}ms`
      );
    }
  })
);

// Logging API requests
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Request validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn(`Validation error: ${JSON.stringify(errors.array())}`);
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Import routes
const authRoutes = require("./routes/authRoutes");
// Add additional route imports as needed:
// const userRoutes = require('./routes/userRoutes');
// const vehicleRoutes = require('./routes/vehicleRoutes');

// Apply routes
app.use("/api/auth", authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/vehicles', vehicleRoutes);

// Test route
app.get("/", (req, res) => {
  logger.info("Test route accessed");
  res.send("✅ Verista Backend is Running!");
});

// 🔹 PostgreSQL Connection
const db = new Client({
  connectionString: config.database.url,
  ssl: { rejectUnauthorized: false },
});

db.connect()
  .then(() => logger.info("✅ PostgreSQL Connected"))
  .catch((err) => logger.error(`❌ Database Connection Error: ${err.message}`));

// Integrate Swagger
swaggerDocs(app);

// Environment-specific configuration
if (config.nodeEnv === "production") {
  app.set("trust proxy", 1); // Trust first proxy for secure cookies
  logger.info("Running in production mode with enhanced security");
}

// 404 handler
app.use((req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: "Resource not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`${err.message} - ${req.method} ${req.originalUrl}`);

  // Don't expose stack traces in production
  const errorResponse = {
    message: err.message || "Internal Server Error",
    ...(config.nodeEnv !== "production" && { stack: err.stack }),
  };

  res.status(err.status || 500).json(errorResponse);
});

// Start server with graceful shutdown handling
const server = app.listen(config.port, () =>
  logger.info(
    `🚀 Server running on port ${config.port} in ${config.nodeEnv} mode`
  )
);

// Handle graceful shutdown
function gracefulShutdown() {
  logger.info("Received shutdown signal, closing connections...");

  server.close(() => {
    logger.info("HTTP server closed");

    // Close database connections
    db.end()
      .then(() => {
        logger.info("Database connections closed");
        process.exit(0);
      })
      .catch((err) => {
        logger.error(`Error closing database connections: ${err.message}`);
        process.exit(1);
      });
  });

  // Force close if graceful shutdown takes too long
  setTimeout(() => {
    logger.error("Forcing process termination after timeout");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Export for testing
module.exports = { app, server, db };
