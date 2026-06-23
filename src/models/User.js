import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Better Auth uses string IDs (cuid) natively mapped to _id
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  emailVerified: { type: Boolean, default: false },
  image: { type: String },
  role: { type: String, enum: ["user", "trainer", "admin"], default: "user" },
  status: { type: String, enum: ["active", "blocked"], default: "active" },
  trainerApplicationStatus: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "none" },
  trainerFeedback: { type: String },
  createdAt: { type: Date },
  updatedAt: { type: Date }
}, { 
  collection: "user", // MUST match Better Auth's collection name
  timestamps: true
});

export const User = mongoose.models.User || mongoose.model("User", userSchema);
