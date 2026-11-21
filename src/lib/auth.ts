import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin, emailOTP } from "better-auth/plugins";
import { OTP_EXPIRES_IN_SECONDS, sendOtpEmail } from "@/lib/email/send-otp";
import { serverEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const env = serverEnv();

const googleProvider =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        prompt: "select_account" as const,
      }
    : undefined;

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: googleProvider ? { google: googleProvider } : undefined,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
  },
  advanced: {
    database: {
      joins: true,
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 10 },
      "/sign-up/email": { window: 60, max: 5 },
      "/email-otp/send-verification-otp": { window: 60, max: 5 },
      "/email-otp/verify-email": { window: 60, max: 10 },
      "/email-otp/request-password-reset": { window: 60, max: 5 },
      "/email-otp/reset-password": { window: 60, max: 10 },
    },
  },
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
    emailOTP({
      overrideDefaultEmailVerification: true,
      expiresIn: OTP_EXPIRES_IN_SECONDS,
      storeOTP: "hashed",
      async sendVerificationOTP({ email, otp, type }) {
        if (type === "email-verification") {
          const user = await prisma.user.findUnique({
            where: { email },
            select: { emailVerified: true },
          });

          if (!user || user.emailVerified) {
            return;
          }
        }

        await sendOtpEmail({ email, otp, type });
      },
    }),
    nextCookies(),
  ],
});
