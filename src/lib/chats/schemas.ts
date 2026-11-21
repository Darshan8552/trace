import { z } from "zod";

export const chatIdSchema = z.string().trim().min(1).max(64);

export const createChatSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
});

export const renameChatSchema = z.object({
  title: z.string().trim().min(1).max(120),
});

export const updateChatSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    pinned: z.boolean().optional(),
  })
  .refine(
    (value) => value.title !== undefined || value.pinned !== undefined,
    "Provide a title or pinned value.",
  );

export const templateNotebookSchema = z.object({
  template: z.string().trim().min(1).max(64),
});

export const chatSourceSchema = z.object({
  number: z.number().int().positive(),
  documentId: z.string().trim().min(1).max(64),
  title: z.string().trim().min(1).max(255),
  page: z.number().int().positive().nullable(),
  similarity: z.number().min(-1).max(1),
  chunkId: z.string().trim().min(1).max(64).optional(),
  snippet: z.string().max(1200).optional(),
});

export const chatSourcesSchema = z.array(chatSourceSchema);
