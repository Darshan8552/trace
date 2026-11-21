const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const CITATION_MARKDOWN = /\[(\d+)\]\([^)]*\)/g;
const CITATION_PLAIN = /\[(\d+)\]/g;

function utcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function chatTitleFromQuery(query: string): string {
  const line = query.replace(/\s+/g, " ").trim();

  if (!line) {
    return "New chat";
  }

  return line.length > 72 ? `${line.slice(0, 72).trimEnd()}…` : line;
}

export function chatPreview(text: string, maxLength = 140): string {
  const cleaned = text
    .replace(CITATION_MARKDOWN, "")
    .replace(CITATION_PLAIN, "")
    .replace(/[#*_>`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.length > maxLength
    ? `${cleaned.slice(0, maxLength).trimEnd()}…`
    : cleaned;
}

export function chatDateLabel(iso: string, now = new Date()): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const dayDifference = Math.round((utcDay(now) - utcDay(date)) / 86_400_000);

  if (dayDifference === 0) {
    return "Today";
  }

  if (dayDifference === 1) {
    return "Yesterday";
  }

  const label = `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`;

  return date.getUTCFullYear() === now.getUTCFullYear()
    ? label
    : `${label}, ${date.getUTCFullYear()}`;
}
