import { z } from "zod";
import { FEEDBACK_RATINGS, FEEDBACK_REASONS } from "./types";

export const feedbackRequestSchema = z.object({
  chatId: z.string().trim().min(1).max(64),
  messageId: z.string().trim().min(1).max(64),
  rating: z.enum(FEEDBACK_RATINGS),
  reason: z.enum(FEEDBACK_REASONS).nullable().optional(),
  note: z.string().trim().max(500).nullable().optional(),
});

export const feedbackDeleteSchema = feedbackRequestSchema.pick({
  chatId: true,
  messageId: true,
});
