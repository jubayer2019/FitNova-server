import { Class } from "../models/Class.js";
import { ForumPost } from "../models/ForumPost.js";
import { Booking } from "../models/Booking.js";

// GET /api/trainer/overview
export const getOverview = async (req, res, next) => {
  try {
    const totalClassesCreated = await Class.countDocuments({ trainerId: req.user._id });
    const trainerClasses = await Class.find({ trainerId: req.user._id }).select("_id");
    const classIds = trainerClasses.map(c => c._id);

    const totalStudentsEnrolled = await Booking.countDocuments({ classId: { $in: classIds } });

    res.status(200).json({
      success: true,
      data: {
        totalClassesCreated,
        totalStudentsEnrolled,
        profile: {
          name: req.user.name,
          email: req.user.email,
          image: req.user.image,
          status: req.user.status
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/trainer/my-classes
export const getMyClasses = async (req, res, next) => {
  try {
    const classes = await Class.find({ trainerId: req.user._id })
      .populate("trainerId", "name image specialty")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: classes });
  } catch (error) {
    next(error);
  }
};

// GET /api/trainer/my-posts
export const getMyPosts = async (req, res, next) => {
  try {
    const posts = await ForumPost.find({ authorId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    next(error);
  }
};

// GET /api/trainer/my-bookings
export const getTrainerBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ trainerId: req.user._id })
      .populate("userId", "name email image")
      .populate("classId", "className image price");
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};
