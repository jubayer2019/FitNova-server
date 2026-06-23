import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
  className: { type: String, required: true },
  image: { type: String },
  category: { type: String, required: true },
  difficultyLevel: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Beginner" },
  duration: { type: Number, required: true }, // in minutes
  schedule: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  trainerId: { type: String, ref: "User", required: true },
  trainerName: { type: String, required: true },
  trainerEmail: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  bookingCount: { type: Number, default: 0 },
}, { timestamps: true });

export const Class = mongoose.models.Class || mongoose.model("Class", classSchema);
