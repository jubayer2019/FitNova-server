import { auth } from "../config/auth.js";
import { fromNodeHeaders } from "better-auth/node";

export const verifyUser = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });

    if (!session || !session.user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    // Pass the user to the next middleware (ensure we attach MongoDB _id style id for compatibility)
    req.user = session.user;
    req.user._id = session.user.id; 
    
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired session" });
  }
};

export const verifyTrainer = (req, res, next) => {
  if (req.user && req.user.role === "trainer") {
    next();
  } else {
    return res.status(403).json({ success: false, message: "Access restricted to trainers only" });
  }
};

export const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ success: false, message: "Access restricted to admins only" });
  }
};

export const verifyTrainerOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "trainer" || req.user.role === "admin")) {
    next();
  } else {
    return res.status(403).json({ success: false, message: "Access restricted to trainers or admins" });
  }
};

export const checkBlockedStatus = (req, res, next) => {
  if (req.user && req.user.status === "blocked") {
    // Only block POST, PUT, PATCH, DELETE. Allow GET.
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      return res.status(403).json({ success: false, message: "Action restricted by Admin" });
    }
  }
  next();
};
