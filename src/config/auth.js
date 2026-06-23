import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { MongoClient } from "mongodb";
import "dotenv/config";

const client = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017/fitnova");

export const auth = betterAuth({
  database: mongodbAdapter(client.db()),
  secret: process.env.BETTER_AUTH_SECRET || "fallback_secret_for_local_dev",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
  trustedOrigins: process.env.CLIENT_URL ? [process.env.CLIENT_URL, "http://localhost:3000"] : ["http://localhost:3000"],
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "dummy",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy",
    }
  },
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "user" },
      status: { type: "string", defaultValue: "active" },
      trainerApplicationStatus: { type: "string", defaultValue: "none" },
      trainerFeedback: { type: "string", required: false }
    }
  },
  session: {
    cookieCache: {
      enabled: false,
      maxAge: 5 * 60 // Cache session in memory for 5 minutes
    }
  },
  plugins: [
    jwt({
      jwt: {
        secret: process.env.JWT_SECRET || "super_secret_jwt_key",
        expiresIn: "7d"
      }
    })
  ],
  advanced: {
    cookiePrefix: process.env.COOKIE_NAME || "fitnova_token",
    defaultCookieAttributes: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none", // To support cross-domain frontend/backend
    }
  }
});
