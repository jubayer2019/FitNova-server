import mongoose from "mongoose";
import bcrypt from "bcrypt";
import "dotenv/config";
import connectDB from "../config/db.js";
import { auth } from "../config/auth.js";
import { fromNodeHeaders } from "better-auth/node";

import { User } from "../models/User.js";
import { Class } from "../models/Class.js";
import { ForumPost } from "../models/ForumPost.js";

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await mongoose.connection.db.collection('session').deleteMany({});
    await mongoose.connection.db.collection('account').deleteMany({});
    await Class.deleteMany({});
    await ForumPost.deleteMany({});

    console.log("Cleared existing database...");

    // Since we are running in a script, we provide dummy headers
    const reqHeaders = new Headers();

    const adminResponse = await auth.api.signUpEmail({
      headers: reqHeaders,
      body: {
        name: "Admin FitNova",
        email: "admin@fitnova.com",
        password: "Password123!",
        role: "admin",
        status: "active",
        image: "https://ui-avatars.com/api/?name=Admin+FitNova"
      }
    });
    const admin = adminResponse.user;

    const trainerResponse = await auth.api.signUpEmail({
      headers: reqHeaders,
      body: {
        name: "John Trainer",
        email: "john@trainer.com",
        password: "Password123!",
        role: "trainer",
        status: "active",
        trainerApplicationStatus: "approved",
        image: "https://ui-avatars.com/api/?name=John+Trainer"
      }
    });
    const trainer1 = trainerResponse.user;

    const userResponse = await auth.api.signUpEmail({
      headers: reqHeaders,
      body: {
        name: "Jane User",
        email: "jane@user.com",
        password: "Password123!",
        role: "user",
        status: "active",
        image: "https://ui-avatars.com/api/?name=Jane+User"
      }
    });
    const user1 = userResponse.user;

    console.log("Users seeded.");

    // 2. Create Classes
    const class1 = await Class.create({
      className: "High Intensity Interval Training (HIIT)",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop",
      category: "Cardio",
      difficultyLevel: "Intermediate",
      duration: 45,
      schedule: "Mon, Wed, Fri at 6:00 PM",
      price: 25.00,
      description: "Push your limits with this intense full-body cardiovascular workout designed to burn fat and build endurance.",
      trainerId: trainer1.id,
      trainerName: trainer1.name,
      trainerEmail: trainer1.email,
      status: "approved",
      bookingCount: 15
    });

    const class2 = await Class.create({
      className: "Yoga for Beginners",
      image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1520&auto=format&fit=crop",
      category: "Yoga",
      difficultyLevel: "Beginner",
      duration: 60,
      schedule: "Tue, Thu at 7:00 AM",
      price: 15.00,
      description: "A gentle introduction to yoga focusing on basic postures, breath control, and relaxation.",
      trainerId: trainer1.id,
      trainerName: trainer1.name,
      trainerEmail: trainer1.email,
      status: "pending"
    });

    console.log("Classes seeded.");

    // 3. Create Forum Posts
    await ForumPost.create({
      title: "Welcome to FitNova Community!",
      image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1470&auto=format&fit=crop",
      description: "We are excited to launch FitNova! Connect with trainers, share your progress, and get the most out of your fitness journey.",
      excerpt: "We are excited to launch FitNova! Connect with trainers...",
      authorId: admin.id,
      authorName: admin.name,
      authorEmail: admin.email,
      authorRole: admin.role,
      category: "Announcements"
    });

    await ForumPost.create({
      title: "Nutrition Tips for Muscle Gain",
      image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1453&auto=format&fit=crop",
      description: "Building muscle requires more than just lifting weights. You need to focus on your protein intake, caloric surplus, and rest. Aim for 1.6g of protein per kg of body weight.",
      excerpt: "Building muscle requires more than just lifting weights. You need to focus on your protein intake...",
      authorId: trainer1.id,
      authorName: trainer1.name,
      authorEmail: trainer1.email,
      authorRole: trainer1.role,
      category: "Nutrition"
    });

    console.log("Forum Posts seeded.");

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding Error:", error);
    process.exit(1);
  }
};

seedDatabase();
