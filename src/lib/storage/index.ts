import "server-only";
import { getStorageProvider } from "./providers/registry";

export function getStorage() {
  return getStorageProvider();
}
