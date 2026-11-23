import "server-only";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth/minimal";
import { db } from "@/server/db";
import { authSecretForBuildOrRuntime } from "@/server/env";
import { sendTransactionalEmail } from "@/server/email";

const isProduction = process.env.NODE_ENV === "production";
const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION !== "false";

export const auth = betterAuth({
  appName: "Classroom",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: authSecretForBuildOrRuntime(),
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification,
    autoSignIn: false,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 30,
    sendResetPassword: async ({ user, url }) => sendTransactionalEmail({ to: user.email, subject: "Reset your Classroom password", text: `Use this link within 30 minutes to reset your password: ${url}` }),
  },
  emailVerification: {
    sendOnSignUp: requireEmailVerification,
    // Sign-in must fail fast with EMAIL_NOT_VERIFIED. The explicit resend
    // endpoint handles delivery and is independently rate limited.
    sendOnSignIn: false,
    sendVerificationEmail: async ({ user, url }) => sendTransactionalEmail({ to: user.email, subject: "Verify your Classroom email", text: `Verify your email address: ${url}` }),
  },
  user: {
    additionalFields: {
      locale: { type: "string", required: false, defaultValue: "en", input: true },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user, context) => {
          const callbackURL = (context?.body as { callbackURL?: unknown } | undefined)?.callbackURL;
          const roleKey = typeof callbackURL === "string" && callbackURL.startsWith("/invite/") ? "student" : "teacher";
          const role = await db.role.findUnique({ where: { key: roleKey }, select: { id: true } });
          if (role) await db.userRole.upsert({ where: { userId_roleId: { userId: user.id, roleId: role.id } }, update: {}, create: { userId: user.id, roleId: role.id } });
        },
      },
    },
    session: {
      create: {
        before: async (session) => (await db.user.count({ where: { id: session.userId, disabledAt: null } })) === 1,
      },
    },
  },
  session: { modelName: "AuthSession", expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24, cookieCache: { enabled: true, maxAge: 300, strategy: "jwe" } },
  rateLimit: {
    enabled: true,
    storage: "database",
    modelName: "RateLimit",
    window: 60,
    max: isProduction ? 30 : 120,
    customRules: {
      "/sign-in/email": { window: 15 * 60, max: isProduction ? 5 : 30 },
      "/sign-up/email": { window: 15 * 60, max: isProduction ? 5 : 30 },
      "/send-verification-email": { window: 15 * 60, max: isProduction ? 3 : 10 },
      "/request-password-reset": { window: 15 * 60, max: isProduction ? 5 : 10 },
    },
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
  advanced: { database: { joins: true, transaction: true }, useSecureCookies: process.env.NODE_ENV === "production", defaultCookieAttributes: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" } },
});

