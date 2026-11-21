import { z } from "zod";
import { CONTENT_HASH_PATTERN } from "./hash";

const chatIdSchema = z.string().trim().min(1).max(64);

export const createDocumentSchema = z.object({
  chatId: chatIdSchema,
  pathname: z.string().trim().min(1).max(512),
  filename: z.string().trim().min(1).max(255),
  title: z.string().trim().min(1).max(160).optional(),
  contentHash: z.string().regex(CONTENT_HASH_PATTERN).optional(),
});

export const createUrlDocumentSchema = z.object({
  chatId: chatIdSchema,
  url: z.url().max(2048),
});

export const documentListQuerySchema = z.object({
  chatId: chatIdSchema,
});

export const documentIdSchema = z.string().trim().min(1).max(64);

export const processDocumentSchema = z.object({
  reindex: z.boolean().optional(),
});
