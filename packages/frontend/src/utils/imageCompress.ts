/**
 * 浏览器端图片预压缩：把超大图片等比缩小到 maxEdge 以内，
 * 减少 createImageBitmap 的内存占用。返回 PNG Blob（保留 alpha）。
 * 若图片已足够小则原样返回。
 */
export async function precompressImage(file: Blob, maxEdge = 1024): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const { width, height } = bitmap;
    const longest = Math.max(width, height);
    if (longest <= maxEdge) {
      return file;
    }
    const scale = maxEdge / longest;
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, width, height, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    return blob ?? file;
  } finally {
    bitmap.close();
  }
}
