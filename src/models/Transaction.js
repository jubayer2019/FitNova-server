import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  userId: { type: String, ref: "User", required: true },
  userEmail: { type: String, required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
  className: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "usd" },
  transactionId: { type: String, required: true },
  paymentIntentId: { type: String },
  status: { type: String, enum: ["succeeded", "pending", "failed"], default: "pending" },
}, { timestamps: true });

export const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);
