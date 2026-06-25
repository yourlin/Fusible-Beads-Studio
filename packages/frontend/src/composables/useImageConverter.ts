import { ref } from 'vue';
import type { BoardSize, ConvertOptions, ConvertResult, Palette } from '@pindou/shared';
import { convertImageData, type ImageLike } from '@/utils/imageConvert';

/** 可作为转换输入的来源类型。 */
export type ConvertSource = ImageBitmapSource;

/**
 * 浏览器图片 → 拼豆网格 转换 composable。
 * 流程：createImageBitmap → 离屏 canvas 最近邻缩放(cols×rows) → getImageData → 本地颜色匹配。
 * 全程无网络请求。
 */
export function useImageConverter() {
  const converting = ref(false);
  const error = ref<string | null>(null);

  /**
   * 把任意图片源按比例（contain）适配到 boardSize 网格并取出像素。
   * 保持原图宽高比，居中放置，四周留空（透明 → 空珠）。
   * 使用最近邻（imageSmoothingEnabled=false）以保留硬边像素感。
   */
  async function rasterize(source: ConvertSource, boardSize: BoardSize): Promise<ImageLike> {
    const { cols, rows } = boardSize;
    const bitmap = await createImageBitmap(source);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = cols;
      canvas.height = rows;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('无法获取 2D canvas 上下文');
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, cols, rows);

      // 按比例缩放使图片完整放入板内（contain），居中，避免拉伸变形
      const bw = bitmap.width;
      const bh = bitmap.height;
      const scale = Math.min(cols / bw, rows / bh);
      const drawW = Math.max(1, Math.round(bw * scale));
      const drawH = Math.max(1, Math.round(bh * scale));
      const dx = Math.floor((cols - drawW) / 2);
      const dy = Math.floor((rows - drawH) / 2);
      ctx.drawImage(bitmap, 0, 0, bw, bh, dx, dy, drawW, drawH);

      const imageData = ctx.getImageData(0, 0, cols, rows);
      return { data: imageData.data, width: imageData.width, height: imageData.height };
    } finally {
      bitmap.close();
    }
  }

  /**
   * 将图片源转换为拼豆网格 + 用量统计。
   * @throws 当 canvas 不可用或图片解码失败时
   */
  async function convert(
    source: ConvertSource,
    boardSize: BoardSize,
    palette: Palette,
    options: ConvertOptions = {},
  ): Promise<ConvertResult> {
    converting.value = true;
    error.value = null;
    try {
      const image = await rasterize(source, boardSize);
      return convertImageData(image, boardSize, palette, options);
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      converting.value = false;
    }
  }

  return { converting, error, convert, rasterize };
}
