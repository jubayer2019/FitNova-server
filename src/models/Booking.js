import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  userId: { type: String, ref: "User", required: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
  className: { type: String, required: true },
  trainerId: { type: String, ref: "User", required: true },
  trainerName: { type: String, required: true },
  schedule: { type: String, required: true },
  price: { type: Number, required: true },
  paymentStatus: { type: String, enum: ["paid", "unpaid"], default: "paid" },
  transactionId: { type: String, required: true },
}, { timestamps: true });

// Prevent duplicate bookings
bookingSchema.index({ userId: 1, classId: 1 }, { unique: true });

export const Booking = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
