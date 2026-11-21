import "server-only";

type LogMeta = Record<string, unknown>;

export function logError(
  context: string,
  error: unknown,
  meta?: LogMeta,
): void {
  const payload = {
    level: "error",
    timestamp: new Date().toISOString(),
    context,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...meta,
  };

  console.error(JSON.stringify(payload));
}
