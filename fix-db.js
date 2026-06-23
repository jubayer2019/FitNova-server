import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const db = mongoose.connection.db;
    
    // 1. Get the admin user
    const admin = await db.collection('users').findOne({ role: 'admin' });
    if (!admin) throw new Error('No admin found');
    console.log('Found admin:', admin.name, admin._id);

    // 2. Update all classes
    const classes = await db.collection('classes').find({}).toArray();
    
    for (const cls of classes) {
      let updates = {};
      
      // Fix title -> className
      if (cls.title && !cls.className) {
        updates.className = cls.title;
      }

      // We ONLY update if the trainerId is completely broken, or if the user explicitly wants ALL initial classes to be admin.
      // The user says "Initial je koyekta class ache sobgular trainer admin ke kore daw"
      // Let's assume all existing classes should belong to the admin.
      updates.trainerId = admin._id.toString();
      updates.trainerName = admin.name;
      updates.trainerEmail = admin.email;
      
      await db.collection('classes').updateOne({ _id: cls._id }, { $set: updates });
      console.log('Updated class:', cls._id, updates.className || cls.className);
    }

    // 3. Update existing bookings
    const bookings = await db.collection('bookings').find({}).toArray();
    for (const b of bookings) {
      let bUpdates = {};
      
      const cls = classes.find(c => c._id.toString() === b.classId.toString());
      if (cls) {
        bUpdates.className = cls.className || cls.title || 'Unknown Class';
      }
      
      // Update the trainer in the booking to match admin, since all initial classes were moved to admin
      bUpdates.trainerName = admin.name;
      bUpdates.trainerId = admin._id.toString();
      
      await db.collection('bookings').updateOne({ _id: b._id }, { $set: bUpdates });
      console.log('Updated booking:', b._id, bUpdates.className);
    }

    console.log('Done');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

run();
