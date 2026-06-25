import { onBeforeUnmount, type Ref } from 'vue';
import { renderBeadGrid, type RenderOptions } from '@/utils/render';

/**
 * Canvas 渲染调度 composable：
 * - 适配 devicePixelRatio（高清屏不糊）
 * - 用 requestAnimationFrame 合并多次重绘请求
 * - resize() 根据 CSS 尺寸重设画布像素尺寸
 */
export function useCanvasRenderer(
  canvasRef: Ref<HTMLCanvasElement | null>,
  getOptions: () => RenderOptions | null,
) {
  let rafId = 0;
  let cssW = 0;
  let cssH = 0;

  function resize(width: number, height: number) {
    cssW = width;
    cssH = height;
    const canvas = canvasRef.value;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    requestRender();
  }

  function draw() {
    rafId = 0;
    const canvas = canvasRef.value;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const opts = getOptions();
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!opts) {
      ctx.clearRect(0, 0, cssW, cssH);
      return;
    }
    renderBeadGrid(ctx, { ...opts, viewW: cssW, viewH: cssH });
  }

  function requestRender() {
    if (rafId) return;
    rafId = requestAnimationFrame(draw);
  }

  onBeforeUnmount(() => {
    if (rafId) cancelAnimationFrame(rafId);
  });

  return { resize, requestRender, size: () => ({ width: cssW, height: cssH }) };
}
