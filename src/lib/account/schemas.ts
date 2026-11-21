import { z } from "zod";

export const DELETE_ACCOUNT_CONFIRMATION = "DELETE";

export const deleteAccountSchema = z
  .object({
    confirmation: z.string().trim(),
    password: z.string().max(128).optional(),
  })
  .refine((value) => value.confirmation === DELETE_ACCOUNT_CONFIRMATION, {
    message: `Type ${DELETE_ACCOUNT_CONFIRMATION} to confirm.`,
    path: ["confirmation"],
  });
