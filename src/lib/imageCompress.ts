/**
 * Center-crop an image to a square and compress it under a target byte size.
 * Returns a JPEG/WEBP File ready to upload to storage.
 */
export async function squareCompress(
  file: File,
  opts: { maxBytes?: number; size?: number; mime?: "image/jpeg" | "image/webp" } = {},
): Promise<File> {
  const maxBytes = opts.maxBytes ?? 300 * 1024; // 300 KB
  const size = opts.size ?? 1200; // square edge in px
  const mime = opts.mime ?? "image/jpeg";

  const bitmap = await loadBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);

  // Iteratively reduce quality until under maxBytes
  let quality = 0.92;
  let blob = await canvasToBlob(canvas, mime, quality);
  while (blob.size > maxBytes && quality > 0.4) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, mime, quality);
  }
  // Last resort: shrink dimensions if still too big
  let edge = size;
  while (blob.size > maxBytes && edge > 600) {
    edge = Math.round(edge * 0.85);
    canvas.width = edge;
    canvas.height = edge;
    ctx.clearRect(0, 0, edge, edge);
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, edge, edge);
    blob = await canvasToBlob(canvas, mime, 0.85);
  }

  const ext = mime === "image/webp" ? "webp" : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${baseName}.${ext}`, { type: mime, lastModified: Date.now() });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      type,
      quality,
    );
  });
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // fall through
    }
  }
  return await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed"));
    };
    img.src = url;
  });
}
