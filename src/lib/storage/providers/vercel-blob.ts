import "server-only";
import { del, get, head, put as putBlob } from "@vercel/blob";
import { serverEnv } from "@/lib/env";
import type { StorageProvider } from "../types";

export const vercelBlobProvider: StorageProvider = {
  id: "vercel-blob",
  label: "Vercel Blob",
  isConfigured: () => Boolean(serverEnv().BLOB_READ_WRITE_TOKEN),

  async put(pathname, body, contentType) {
    const buffer = Buffer.from(body);
    const blob = await putBlob(pathname, buffer, {
      access: "private",
      contentType,
      addRandomSuffix: false,
    });

    return {
      pathname: blob.pathname,
      size: buffer.byteLength,
      contentType: blob.contentType,
    };
  },

  async stat(pathname) {
    try {
      const blob = await head(pathname);

      return {
        pathname: blob.pathname,
        size: blob.size,
        contentType: blob.contentType,
      };
    } catch {
      return null;
    }
  },

  async read(pathname) {
    const result = await get(pathname, { access: "private", useCache: false });

    if (!result || result.statusCode !== 200) {
      return null;
    }

    return {
      pathname: result.blob.pathname,
      size: result.blob.size,
      contentType: result.blob.contentType,
      etag: result.blob.etag,
      stream: result.stream,
    };
  },

  async remove(pathname) {
    await del(pathname);
  },
};
