const APPLE_USER_AGENT = /Macintosh|Mac OS X|iPhone|iPad|iPod/i;

export function commandPaletteShortcut(userAgent: string): string {
  return APPLE_USER_AGENT.test(userAgent) ? "⌘K" : "Ctrl K";
}
