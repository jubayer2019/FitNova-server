import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema({
  userId: { type: String, ref: "User", required: true },
  userEmail: { type: String, required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
}, { timestamps: true });

// Prevent duplicate favorites
favoriteSchema.index({ userId: 1, classId: 1 }, { unique: true });

export const Favorite = mongoose.models.Favorite || mongoose.model("Favorite", favoriteSchema);
