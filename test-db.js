import mongoose from 'mongoose';
import 'dotenv/config';

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const users = await db.collection('user').find({}).limit(2).toArray();
  console.log("USERS:", JSON.stringify(users, null, 2));
  process.exit(0);
}
test();
