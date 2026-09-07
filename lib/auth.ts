import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { db, schema } from "@/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: { ...schema, user: schema.users, session: schema.sessions, account: schema.accounts, verification: schema.verifications },
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  user: { additionalFields: { mustChangePassword: { type: "boolean", required: true, defaultValue: true, input: false } } },
  emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 10, maxPasswordLength: 128 }, disabledPaths: ["/is-username-available"],
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  rateLimit: { enabled: true, window: 60, max: 30, customRules: { "/sign-in/username": { window: 60, max: 5 }, "/sign-up/email": { window: 300, max: 3 } } },
  advanced: { cookiePrefix: "ledgerly", useSecureCookies: process.env.NODE_ENV === "production" },
  plugins: [username({ minUsernameLength: 3, maxUsernameLength: 30, immutableUsername: true }), nextCookies()],
});
