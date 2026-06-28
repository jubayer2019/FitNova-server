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
      .populate("classId", "className image price")
      .lean();

    // Fetch users using raw MongoDB driver to bypass any Mongoose _id casting issues 
    // (Better Auth might use ObjectId in DB despite String in schema, or vice versa)
    const mongoose = (await import("mongoose")).default;
    const db = mongoose.connection.db;
    
    const userIds = bookings.map(b => b.userId);
    const objectIds = userIds.filter(id => mongoose.isValidObjectId(id)).map(id => new mongoose.Types.ObjectId(id));
    
    // Search for both String IDs and Object IDs
    const users = await db.collection("user").find({
      $or: [
        { _id: { $in: userIds } },
        { _id: { $in: objectIds } },
        { id: { $in: userIds } }
      ]
    }).project({ name: 1, email: 1, image: 1 }).toArray();
    
    const userMap = {};
    users.forEach(u => {
      userMap[String(u._id)] = u;
      if (u.id) userMap[String(u.id)] = u;
    });

    bookings.forEach(b => {
      const u = userMap[String(b.userId)];
      if (u) {
        // Normalize _id for the frontend
        u._id = String(u._id);
        b.userId = u;
      }
    });

    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};
