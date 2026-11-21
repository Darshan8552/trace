import type { DocumentStatus } from "@/lib/documents/types";
import type { FeedbackRating, FeedbackReason } from "@/lib/feedback/types";

export type AdminStats = {
  users: number;
  notebooks: number;
  messages: number;
  documents: Record<DocumentStatus, number>;
  feedbackUp: number;
  feedbackDown: number;
  pendingBlobDeletions: number;
};

export type AdminFailedDocument = {
  id: string;
  title: string;
  chatId: string;
  chatTitle: string;
  userId: string;
  userEmail: string;
  error: string | null;
  updatedAt: string;
  mimeType: string;
  sizeBytes: number;
};

export type AdminBlobDeletion = {
  storageKey: string;
  attempts: number;
  lastError: string | null;
  createdAt: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: string;
  banned: boolean;
  banReason: string | null;
  banExpires: string | null;
  createdAt: string;
  sessionCount: number;
  chatCount: number;
};

export type AdminFeedback = {
  id: string;
  rating: FeedbackRating;
  reason: FeedbackReason | null;
  note: string | null;
  createdAt: string;
  messageId: string;
  excerpt: string;
  chatId: string;
  chatTitle: string;
  userEmail: string;
};
