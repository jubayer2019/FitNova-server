import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "ForumPost", required: true },
  userId: { type: String, ref: "User", required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  userImage: { type: String },
  body: { type: String, required: true },
  parentCommentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null }, // for replies
}, { timestamps: true });

export const Comment = mongoose.models.Comment || mongoose.model("Comment", commentSchema);
