import mongoose from "mongoose";

const forumPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: { type: String },
  description: { type: String, required: true }, // The main content
  excerpt: { type: String }, // Short snippet
  authorId: { type: String, ref: "User", required: true },
  authorName: { type: String, required: true },
  authorEmail: { type: String, required: true },
  authorRole: { type: String, required: true },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  likedBy: [{ type: String, ref: "User" }],
  dislikedBy: [{ type: String, ref: "User" }],
  category: { type: String, default: "General" }
}, { timestamps: true });

export const ForumPost = mongoose.models.ForumPost || mongoose.model("ForumPost", forumPostSchema);
