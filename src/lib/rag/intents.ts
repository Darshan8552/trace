const DOCUMENT_REFERENCE =
  /\b(?:my|our|the|these|those|this|uploaded|indexed|attached)\b[^.!?]{0,40}\b(?:documents?|docs?|files?|sources?|uploads?)\b/i;
const DOCUMENT_LIST_REQUEST =
  /\b(?:what|which|list|show|how many)\b[^.!?]{0,30}\b(?:documents?|docs?|files?|sources?)\b/i;
const SUMMARY_INTENT = /\b(?:summari[sz]e|summary|overview)\b/i;

const INVENTORY_PATTERNS = [
  /\bhow many (?:[a-z]+ ){0,2}(?:sources?|documents?|docs?|files?)\b/i,
  /\blist (?:me )?(?:all )?(?:the |my |your )?(?:sources?|documents?|docs?|files?)\b/i,
  /\b(?:what|which) (?:sources?|documents?|docs?|files?) (?:do|did) (?:i|we|you) (?:have|upload|uploaded|add|added)\b/i,
  /\b(?:what|which) (?:sources?|documents?|docs?|files?) (?:are|is) (?:in|part of|uploaded to) (?:this|the) (?:chat|notebook)\b/i,
];

export function isDocumentOverviewQuery(query: string): boolean {
  return (
    DOCUMENT_REFERENCE.test(query) ||
    DOCUMENT_LIST_REQUEST.test(query) ||
    SUMMARY_INTENT.test(query)
  );
}

export function isDocumentOverviewRequest(query: string): boolean {
  return DOCUMENT_LIST_REQUEST.test(query) || SUMMARY_INTENT.test(query);
}

export function isInventoryQuestion(query: string): boolean {
  return INVENTORY_PATTERNS.some((pattern) => pattern.test(query));
}

const GROUNDED_PATTERNS = [
  DOCUMENT_REFERENCE,
  /\b(?:according to|based on)\s+(?:the|my|our|these|this|your)\s+(?:document|docs?|file|files|source|sources|policy|report|brief|guide|handbook|notebook)\b/i,
  /\b(?:does|did|do)\s+(?:the|my|our|this|these)\s+(?:document|file|source|policy|report|brief)\s+(?:say|state|mention|include)\b/i,
  /\b(?:cited|citation|passage|footnote)\b/i,
];

export function isGroundedQuestion(query: string): boolean {
  return GROUNDED_PATTERNS.some((pattern) => pattern.test(query));
}
