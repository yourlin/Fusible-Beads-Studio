/**
 * 库存仓储边界（架构 AD-4）。
 *
 * 库存的所有本地读写**只经此模块**——组件 / store 一律不直接碰 localStorage。
 * 落盘采用版本化信封，按 `Palette.id` 分键独立保存，互不覆盖。
 * 换云同步 / JSON 备份只换该模块后端，不改上层契约。
 */
import type { Inventory, InventoryEntry, Palette } from '@pindou/shared';

/** 当前库存信封 schema 版本（整数、单调递增）。迁移逻辑收敛在本模块内。 */
export const SCHEMA_VERSION = 1;

/** localStorage 键前缀；实际键为 `${PREFIX}${paletteId}`，按品牌色板分键。 */
const KEY_PREFIX = 'pindou-inventory:';

/** 落盘的版本化信封。 */
interface InventoryEnvelope {
  schema_version: number;
  paletteId: string;
  entries: InventoryEntry[];
}

function storageKey(paletteId: string): string {
  return `${KEY_PREFIX}${paletteId}`;
}

function hasStorage(): boolean {
  return typeof localStorage !== 'undefined';
}

/**
 * 把任意已解析的 JSON 迁移到当前 schema 版本的信封。
 * v1 无历史版本可迁，但降级策略须在场且可单测：
 * - 读到**更高**的未知版本：安全忽略（返回 null），不抛错、不写坏数据。
 * - 读到结构非法：返回 null。
 * 未来新增版本时，在此按 `schema_version` 递增迁移。
 */
function migrate(raw: unknown): InventoryEnvelope | null {
  if (raw === null || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const version = obj.schema_version;
  if (typeof version !== 'number' || !Number.isInteger(version)) return null;

  // 未来版本（比当前已知的还新）：当前代码无法理解，安全降级为「无库存」。
  if (version > SCHEMA_VERSION) return null;

  // 此处随 SCHEMA_VERSION 增长追加 version < SCHEMA_VERSION 的迁移分支。
  // v1：信封即当前结构，直接校验。

  const paletteId = obj.paletteId;
  const entries = obj.entries;
  if (typeof paletteId !== 'string' || !Array.isArray(entries)) return null;
  return { schema_version: SCHEMA_VERSION, paletteId, entries: entries as InventoryEntry[] };
}

/**
 * 把信封中的条目对齐到指定品牌色板：
 * - 丢弃 `colorId` 在当前 palette 解析不到的条目（**不**回退为 -1，避免污染掩码、
 *   撞 grid 空格哨兵 -1）。
 * - 丢弃 qty 非法（非数字 / 负数 / 非整数）的条目。
 */
function reconcile(entries: InventoryEntry[], palette: Palette): InventoryEntry[] {
  const valid = new Set(palette.colors.map((c) => c.id));
  const out: InventoryEntry[] = [];
  for (const e of entries) {
    if (!e || typeof e.colorId !== 'string' || !valid.has(e.colorId)) continue;
    if (typeof e.qty !== 'number' || !Number.isInteger(e.qty) || e.qty < 0) continue;
    out.push({ colorId: e.colorId, qty: e.qty });
  }
  return out;
}

/**
 * 读取某品牌色板的库存。解析不到 / 非法 / 未知版本时返回空库存（不抛错）。
 * @param palette 当前品牌色板，用于对齐 colorId 与丢弃越界条目。
 */
export function loadInventory(palette: Palette): Inventory {
  const empty: Inventory = { paletteId: palette.id, entries: [] };
  if (!hasStorage()) return empty;

  const text = localStorage.getItem(storageKey(palette.id));
  if (!text) return empty;

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return empty;
  }

  const envelope = migrate(parsed);
  if (!envelope) return empty;

  return { paletteId: palette.id, entries: reconcile(envelope.entries, palette) };
}

/**
 * 保存某品牌色板的库存（覆盖该 palette 分键，不影响其他色板的库存）。
 * 仅持久化 qty > 0 的条目落盘（qty === 0 视为「已用完」，由上层决定是否保留 0 条目；
 * 此处只剔除负数与非整数，0 仍写盘以区分「曾登记」）。
 */
export function saveInventory(inventory: Inventory): void {
  if (!hasStorage()) return;
  const entries = inventory.entries.filter(
    (e) => typeof e.qty === 'number' && Number.isInteger(e.qty) && e.qty >= 0,
  );
  const envelope: InventoryEnvelope = {
    schema_version: SCHEMA_VERSION,
    paletteId: inventory.paletteId,
    entries,
  };
  localStorage.setItem(storageKey(inventory.paletteId), JSON.stringify(envelope));
}

/** 清空某品牌色板的库存（移除其分键）。 */
export function clearInventory(paletteId: string): void {
  if (!hasStorage()) return;
  localStorage.removeItem(storageKey(paletteId));
}
