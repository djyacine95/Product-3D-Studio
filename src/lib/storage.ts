/**
 * FILE STORAGE (Vercel Blob)
 * Saves uploaded photos and generated 3D files and returns a public URL.
 *
 * If BLOB_READ_WRITE_TOKEN is not set (for example on your laptop before you
 * create a Blob store), photos are stored as "data URLs" inside the database
 * instead. That is fine for learning, but use Vercel Blob in production.
 */
import "server-only";
import { put } from "@vercel/blob";

export const isBlobConfigured = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export async function saveFile(
  path: string,
  data: Blob | ArrayBuffer,
  contentType: string
): Promise<string> {
  if (!isBlobConfigured()) {
    const buffer = Buffer.from(data instanceof Blob ? await data.arrayBuffer() : data);
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  }
  const blob = await put(path, data, {
    access: "public",
    contentType,
    addRandomSuffix: true,
  });
  return blob.url;
}
