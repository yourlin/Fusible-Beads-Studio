import type { Palette } from '../types.js';
import { GENERIC_PALETTE } from './generic.js';
import { PERLER_PALETTE } from './perler.js';
import { ARTKAL_PALETTE } from './artkal.js';

export { bead, GENERIC_PALETTE } from './generic.js';
export { PERLER_PALETTE } from './perler.js';
export { ARTKAL_PALETTE } from './artkal.js';

/** 所有内置调色板。 */
export const PALETTES: Palette[] = [GENERIC_PALETTE, PERLER_PALETTE, ARTKAL_PALETTE];

/** 默认调色板（通用 48 色）。 */
export const DEFAULT_PALETTE = GENERIC_PALETTE;

export function getPalette(id: string): Palette | undefined {
  return PALETTES.find((p) => p.id === id);
}
