export const CONFIDENCE_THRESHOLDS = {
  strong: 0.75,
  moderate: 0.55,
} as const;

export type Confidence = "strong" | "moderate" | "weak";

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  strong: "Strong match",
  moderate: "Possible match",
  weak: "Weak match",
};

export function sourceConfidence(similarity: number): Confidence {
  if (similarity >= CONFIDENCE_THRESHOLDS.strong) {
    return "strong";
  }

  if (similarity >= CONFIDENCE_THRESHOLDS.moderate) {
    return "moderate";
  }

  return "weak";
}

export function hasUsableMatch(similarity: number): boolean {
  return similarity >= CONFIDENCE_THRESHOLDS.moderate;
}
