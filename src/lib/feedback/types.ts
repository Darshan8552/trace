export const FEEDBACK_RATINGS = ["up", "down"] as const;
export const FEEDBACK_REASONS = [
  "not-in-sources",
  "wrong-answer",
  "incomplete",
  "too-long",
  "other",
] as const;

export type FeedbackRating = (typeof FEEDBACK_RATINGS)[number];
export type FeedbackReason = (typeof FEEDBACK_REASONS)[number];

export const FEEDBACK_REASON_LABELS: Record<FeedbackReason, string> = {
  "not-in-sources": "Not in sources",
  "wrong-answer": "Wrong answer",
  incomplete: "Incomplete",
  "too-long": "Too long",
  other: "Other",
};

export function isFeedbackReason(
  value: string | null,
): value is FeedbackReason {
  return (
    value !== null && (FEEDBACK_REASONS as readonly string[]).includes(value)
  );
}

export type FeedbackSummary = {
  rating: FeedbackRating;
  reason: FeedbackReason | null;
  note: string | null;
};

export function ratingValue(rating: FeedbackRating): number {
  return rating === "up" ? 1 : -1;
}

export function ratingLabel(value: number): FeedbackRating {
  return value === 1 ? "up" : "down";
}
