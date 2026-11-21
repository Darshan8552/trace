export const STORAGE_PROVIDER_IDS = ["vercel-blob"] as const;

export type StorageProviderId = (typeof STORAGE_PROVIDER_IDS)[number];

export type StoredBlob = {
  pathname: string;
  size: number;
  contentType: string;
};

export type BlobContent = StoredBlob & {
  stream: ReadableStream<Uint8Array>;
  etag: string;
};

export type StorageProvider = {
  id: StorageProviderId;
  label: string;
  isConfigured: () => boolean;
  put: (
    pathname: string,
    body: Uint8Array,
    contentType: string,
  ) => Promise<StoredBlob>;
  stat: (pathname: string) => Promise<StoredBlob | null>;
  read: (pathname: string) => Promise<BlobContent | null>;
  remove: (pathname: string) => Promise<void>;
};
