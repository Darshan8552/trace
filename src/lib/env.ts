import { z } from "zod";

const optionalString = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().min(1).optional(),
);

const optionalEmail = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.email().optional(),
);

const optionalSecret = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().min(32).optional(),
);

const optionalFlag = z.preprocess((value) => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["1", "true", "yes"].includes(normalized)) {
      return true;
    }

    if (["0", "false", "no", ""].includes(normalized)) {
      return false;
    }
  }

  return value;
}, z.boolean().default(false));

const serverEnvSchema = z.object({
  DATABASE_URL: z.url(),
  DIRECT_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  BREVO_API_KEY: optionalString,
  EMAIL_FROM: optionalEmail,
  EMAIL_FROM_NAME: z.string().min(1).default("Trace"),
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  STORAGE_PROVIDER: z.string().min(1).default("vercel-blob"),
  BLOB_READ_WRITE_TOKEN: optionalString,
  ADMIN_EMAILS: optionalString,
  REINDEX_SECRET: optionalSecret,
  GOOGLE_GENERATIVE_AI_API_KEY: optionalString,
  AI_CHAT_PROVIDER: z.string().min(1).default("google"),
  AI_CHAT_MODEL: z.string().min(1).default("gemini-3.5-flash-lite"),
  AI_EMBEDDING_PROVIDER: z.string().min(1).default("google"),
  AI_EMBEDDING_MODEL: z.string().min(1).default("gemini-embedding-001"),
  AI_EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(1536),
  INGEST_SPREADSHEETS: optionalFlag,
  INGEST_OCR: optionalFlag,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (!cached) {
    cached = serverEnvSchema.parse(process.env);
  }
  return cached;
}

export function isGoogleAuthEnabled(): boolean {
  const env = serverEnv();
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}
