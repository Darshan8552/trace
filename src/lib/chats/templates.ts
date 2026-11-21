export type ChatTemplate = {
  id: string;
  label: string;
  description: string;
  title: string;
  questions: string[];
};

export const CHAT_TEMPLATES: ChatTemplate[] = [
  {
    id: "research",
    label: "Research notebook",
    description: "Compare sources and trace claims back to passages.",
    title: "Research notebook",
    questions: [
      "What are the main claims across these sources?",
      "Where do the sources disagree?",
      "Which passage best supports the central claim?",
    ],
  },
  {
    id: "contract-review",
    label: "Contract review",
    description: "Ask about obligations, dates, and risky clauses.",
    title: "Contract review",
    questions: [
      "What are the key deadlines in this document?",
      "Which clauses limit liability?",
      "What would I need to renegotiate first?",
    ],
  },
  {
    id: "meeting-notes",
    label: "Meeting notes",
    description: "Pull out decisions, owners, and follow-ups.",
    title: "Meeting notes",
    questions: [
      "What was decided in this meeting?",
      "Who owns each follow-up?",
      "Which dates or deadlines were mentioned?",
    ],
  },
];

export function findChatTemplate(id: string | undefined): ChatTemplate | null {
  if (!id) {
    return null;
  }

  return CHAT_TEMPLATES.find((template) => template.id === id) ?? null;
}
