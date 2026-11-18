/**
 * Runs in the browser: shrinks a photo before upload.
 * Phones take huge photos (5–10 MB). 1024px is plenty for a 3D texture,
 * and smaller files upload faster and cost less to store.
 */
export async function shrinkImage(file: File, maxSize = 1024): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not read photo"))), "image/jpeg", 0.85)
  );
}

/** Uploads one photo to our API and returns its URL. */
export async function uploadImage(file: File): Promise<string> {
  const small = await shrinkImage(file);
  const form = new FormData();
  form.append("file", new File([small], "photo.jpg", { type: "image/jpeg" }));
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Upload failed");
  return json.url as string;
}
