export const OPEN_COMMAND_PALETTE = "trace:open-command-palette";
export const OPEN_SHORTCUTS = "trace:open-shortcuts";

export function dispatchUiEvent(name: string): void {
  window.dispatchEvent(new Event(name));
}
