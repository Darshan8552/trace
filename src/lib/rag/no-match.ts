import { hasUsableMatch } from "@/lib/chat/confidence";
import {
  isDocumentOverviewRequest,
  isGroundedQuestion,
} from "@/lib/rag/intents";

export function buildNoMatchAnswer(): string {
  return [
    "I couldn't find that in your sources.",
    "Try naming a topic, section, or page from the notebook, or check that the right source is added.",
  ].join(" ");
}

export function shouldUseNoMatchAnswer({
  fullCorpus,
  indexedCount,
  query,
  similarities,
}: {
  fullCorpus: boolean;
  indexedCount: number;
  query: string;
  similarities: number[];
}): boolean {
  return (
    !fullCorpus &&
    indexedCount > 0 &&
    isGroundedQuestion(query) &&
    !isDocumentOverviewRequest(query) &&
    !similarities.some(hasUsableMatch)
  );
}
