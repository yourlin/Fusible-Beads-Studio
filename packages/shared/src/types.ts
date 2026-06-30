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

/* ============================================================
 * 库存驱动设计（Inventory-Driven Design）数据契约
 * 全部集中于 shared，frontend 不另立平行类型（架构 AD-2）。
 * 术语严格逐字采用 PRD 术语表。
 * ============================================================ */

/**
 * 库存条目（Inventory Entry）：一条「色号 × 拥有数量」记录。
 * - `colorId` 取自某品牌色板的 `BeadColor.id`（palette 内稳定，不用 code 或下标）。
 * - `qty` 为非负整数；`0` 表示「曾登记但已用完」，与「从未登记」（无此条目）区分。
 */
export interface InventoryEntry {
  colorId: string;
  qty: number;
}

/**
 * 库存（Inventory）：用户声明的、自己实际拥有的珠子集合，绑定到某个品牌色板。
 * 由若干库存条目组成。
 */
export interface Inventory {
  /** 绑定的品牌色板 id（`Palette.id`，如 'perler-30'） */
  paletteId: string;
  /** 库存条目集合 */
  entries: InventoryEntry[];
}

/**
 * 库存色板掩码（InventoryMask）：拥有数量 > 0 的**品牌色板索引**集合。
 * 与 grid 同索引空间（架构 AD-1）；不是独立 Palette。
 */
export type InventoryMask = Set<number>;

/** 单个品牌索引相对当前库存的状态。 */
export type PerColorStatus = 'ok' | 'insufficient' | 'missing';

/**
 * 可拼性判定（Buildability Verdict）三态 + 空态：
 * - `buildable` 绿·可拼：无缺色且无数量不足。
 * - `substitutable` 黄·替代后无缺色：存在缺色，但全部缺色都能在库存色板找到替代（不承诺数量精算到颗）。
 * - `insufficient` 红·数量不足：无缺色，但存在数量不足色。
 * - `unavailable` 不可用：库存/掩码为空，引导去录入（空态契约）。
 */
export type BuildabilityVerdict = 'buildable' | 'substitutable' | 'insufficient' | 'unavailable';

/** 缺口项（Shortfall Item）：缺色或数量不足色的明细。双带 colorId + index（架构 AD-5）。 */
export interface ShortfallItem {
  /** 品牌色板内稳定 id */
  colorId: string;
  /** 品牌色板索引（与 grid 同空间） */
  index: number;
  /** 缺色 missing / 数量不足 insufficient */
  kind: 'missing' | 'insufficient';
  /**
   * 差额数量：
   * - missing：该缺色在图纸中的需求量（你需要这么多，但一颗没有）。
   * - insufficient：需求量 − 拥有量（还差这么多）。
   */
  deficit: number;
  /** 需求量（图纸中该色用量），用于人话解读「需求 vs 拥有」。 */
  required: number;
  /** 拥有量（库存中该色数量；missing 恒为 0）。 */
  owned: number;
}

/**
 * 感知替代（Perceptual Substitution）：把某缺色整色替换为库存色板内 ΔE 最小的颜色。
 * 方向明确：from = 缺色品牌索引 → to = 库存内品牌索引。
 */
export interface Substitution {
  fromIndex: number;
  toIndex: number;
  /** CIEDE2000 色差（越小越接近） */
  deltaE: number;
  /** 受影响格子数（该缺色在图纸中的格数） */
  affectedCells: number;
}

/**
 * 库存分析结果（InventoryAnalysis）：`analyzeInventory` 的单一派生源输出（架构 AD-5）。
 * 一次算出全部派生结论，所有下游读此唯一出口，不各自重算。
 */
export interface InventoryAnalysis {
  /** 库存色板掩码（品牌索引集合） */
  mask: InventoryMask;
  /** 品牌索引 → 状态（仅含图纸用到的索引） */
  perColorStatus: Record<number, PerColorStatus>;
  /** 三态 + 空态判定 */
  verdict: BuildabilityVerdict;
  /** 缺口清单（缺色 + 数量不足） */
  shortfall: ShortfallItem[];
  /** 缺色的感知替代建议 */
  substitutions: Substitution[];
}
