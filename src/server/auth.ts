import { betterAuth } from "better-auth";
import { db } from "./db";

export const auth = betterAuth({
  database: db,
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],
});
