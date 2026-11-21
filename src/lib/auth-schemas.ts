import { z } from "zod";

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address."));

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your name.")
    .max(80, "That name is too long."),
  email: emailField,
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(128, "That password is too long."),
});

export const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password."),
});

export const otpSchema = z.string().regex(/^\d{6}$/, "Enter the 6-digit code.");

export const otpCodeLength = 6;

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(128, "That password is too long.");

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z
  .object({
    email: emailField,
    otp: otpSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Repeat your new password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Those passwords do not match.",
    path: ["confirmPassword"],
  });
