import { MongoClient } from 'mongodb';
import 'dotenv/config';

async function test() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
  const users = await db.collection('user').find({}).limit(1).toArray();
  console.log("USER:", users[0]);
  console.log("_id type:", typeof users[0]._id, users[0]._id.constructor.name);
  process.exit(0);
}
test();
