/**
 * 拼豆设计图稿 - 共享数据契约
 */

/** RGB 颜色，各通道 0-255 */
export interface RGB {
  r: number;
  g: number;
  b: number;
}

/** CIE Lab 颜色空间 */
export interface Lab {
  L: number;
  a: number;
  b: number;
}

/** 拼豆品牌 */
export type BrandId = 'generic' | 'perler' | 'artkal';

/** 单个拼豆颜色定义 */
export interface BeadColor {
  /** 调色板内唯一 id */
  id: string;
  /** 颜色名称（中文或英文） */
  name: string;
  /** 品牌料号，如 Perler 的 "P01" */
  code?: string;
  /** 十六进制颜色，如 "#FF0000" */
  hex: string;
  /** RGB 表示 */
  rgb: RGB;
  /** 所属品牌 */
  brand?: BrandId;
}

/** 调色板 */
export interface Palette {
  id: string;
  name: string;
  brand: BrandId;
  colors: BeadColor[];
}

/** 拼豆板尺寸预设 */
export interface BoardSize {
  id: string;
  label: string;
  /** 总列数 */
  cols: number;
  /** 总行数 */
  rows: number;
  /** 单块拼板列数（多板拼接时用于绘制分割线） */
  boardCols?: number;
  /** 单块拼板行数 */
  boardRows?: number;
}

/**
 * 拼豆网格：存调色板颜色索引。
 * -1 表示空珠（透明/被剔除的背景）。
 */
export type BeadGrid = number[][];

/** 某种颜色的用量统计 */
export interface BeadCount {
  colorId: string;
  name: string;
  hex: string;
  count: number;
}

/** 图片转换选项 */
export interface ConvertOptions {
  /** 是否启用 Floyd–Steinberg 抖动 */
  dithering?: boolean;
  /**
   * 背景剔除阈值 (0-255)。当像素 alpha 低于该值，
   * 或接近纯白且高于阈值时，视为空珠 (-1)。
   */
  backgroundThreshold?: number;
}

/** 转换结果 */
export interface ConvertResult {
  grid: BeadGrid;
  counts: BeadCount[];
}
