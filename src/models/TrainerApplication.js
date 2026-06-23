import mongoose from "mongoose";

const trainerApplicationSchema = new mongoose.Schema({
  userId: { type: String, ref: "User", required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  experience: { type: Number, required: true }, // in years
  specialty: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  feedback: { type: String },
}, { timestamps: true });

export const TrainerApplication = mongoose.models.TrainerApplication || mongoose.model("TrainerApplication", trainerApplicationSchema);
