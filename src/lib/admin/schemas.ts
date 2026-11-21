import { z } from "zod";

export const reindexRequestSchema = z.object({
  dryRun: z.boolean().optional(),
  chatId: z.string().trim().min(1).max(64).optional(),
  userId: z.string().trim().min(1).max(64).optional(),
  limit: z.number().int().min(1).max(200).optional(),
});

export type ReindexRequest = z.infer<typeof reindexRequestSchema>;

export const adminUserIdSchema = z.string().trim().min(1).max(64);

export const adminUserUpdateSchema = z
  .object({
    role: z.enum(["admin", "user"]).optional(),
    banned: z.boolean().optional(),
    banReason: z.string().trim().max(200).optional(),
  })
  .refine((body) => body.role !== undefined || body.banned !== undefined, {
    message: "Nothing to change",
  });

export type AdminUserUpdate = z.infer<typeof adminUserUpdateSchema>;
