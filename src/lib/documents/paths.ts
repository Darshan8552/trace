const DOCUMENTS_FOLDER = "documents";

export function documentFolder(userId: string): string {
  return `${DOCUMENTS_FOLDER}/${userId}/`;
}

export function isOwnedStorageKey(userId: string, pathname: string): boolean {
  return pathname.startsWith(documentFolder(userId));
}
