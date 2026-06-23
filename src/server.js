import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import "dotenv/config";

import connectDB from "./config/db.js";
import errorHandler from "./middlewares/error.middleware.js";

import userRoutes from "./routes/user.routes.js";
import classRoutes from "./routes/class.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import favoriteRoutes from "./routes/favorite.routes.js";
import trainerApplicationRoutes from "./routes/trainerApplication.routes.js";
import forumRoutes from "./routes/forum.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import trainerRoutes from "./routes/trainer.routes.js";

import { auth } from "./config/auth.js";
import { toNodeHandler } from "better-auth/node";

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Trust proxy for rate limiting behind reverse proxies (like Vercel)
app.set("trust proxy", 1);

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    // Allow all origins to support Vercel preview URLs and custom domains
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token", "x-requested-with", "Accept", "Accept-Version", "Content-Length", "Content-MD5", "Date", "X-Api-Version"]
}));

// Rate limiting (general)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});
app.use("/api", apiLimiter);

// For Stripe webhooks, we need the raw body BEFORE express.json() parses it
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// Logger
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "FitNova server is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Root Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "FitNova API Server"
  });
});

// API Routes
app.use("/api/auth", toNodeHandler(auth));
app.use("/api/users", userRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/trainer-applications", trainerApplicationRoutes);
app.use("/api", forumRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/trainer", trainerRoutes);

// Temporary fix for jwks
app.get("/api/fix-jwks", async (req, res) => {
  try {
    const mongoose = (await import("mongoose")).default;
    await mongoose.connection.db.dropCollection("jwks");
    res.json({ success: true, message: "Dropped jwks collection successfully! BetterAuth will regenerate it. You can now reload your site." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Temporary fix for initial classes DB sync
app.get("/api/fix-initial-classes", async (req, res) => {
  try {
    const mongoose = (await import("mongoose")).default;
    const db = mongoose.connection.db;
    
    // Find admin
    const admin = await db.collection('users').findOne({ role: 'admin' });
    if (!admin) return res.status(404).json({ success: false, message: "No admin found" });

    // Update classes
    const classes = await db.collection('classes').find({}).toArray();
    for (const cls of classes) {
      let updates = {
        trainerId: admin._id.toString(),
        trainerName: admin.name,
        trainerEmail: admin.email
      };
      if (cls.title && !cls.className) updates.className = cls.title;
      await db.collection('classes').updateOne({ _id: cls._id }, { $set: updates });
    }

    // Update bookings
    const bookings = await db.collection('bookings').find({}).toArray();
    for (const b of bookings) {
      let bUpdates = {
        trainerId: admin._id.toString(),
        trainerName: admin.name
      };
      if (b.className === "Unknown Class" || !b.className) {
        const cls = classes.find(c => c._id.toString() === b.classId.toString());
        if (cls) bUpdates.className = cls.className || cls.title || "Unknown Class";
      }
      await db.collection('bookings').updateOne({ _id: b._id }, { $set: bUpdates });
    }

    res.json({ success: true, message: "Fixed initial classes and bookings successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Unknown routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found"
  });
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Only listen if not imported (useful for Vercel serverless functions)
if (process.env.NODE_ENV !== "production" || process.env.LOCAL_RUN === "true") {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
}

export default app;
