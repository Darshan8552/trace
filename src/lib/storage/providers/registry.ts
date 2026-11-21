import "server-only";
import { serverEnv } from "@/lib/env";
import {
  STORAGE_PROVIDER_IDS,
  type StorageProvider,
  type StorageProviderId,
} from "../types";
import { vercelBlobProvider } from "./vercel-blob";

const providers: Record<StorageProviderId, StorageProvider> = {
  "vercel-blob": vercelBlobProvider,
};

export function getStorageProvider(
  id: string = serverEnv().STORAGE_PROVIDER,
): StorageProvider {
  if (!STORAGE_PROVIDER_IDS.includes(id as StorageProviderId)) {
    throw new Error(
      `Unknown storage provider "${id}". Configured providers: ${STORAGE_PROVIDER_IDS.join(", ")}.`,
    );
  }

  return providers[id as StorageProviderId];
}
