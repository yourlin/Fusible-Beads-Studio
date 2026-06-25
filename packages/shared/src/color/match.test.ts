import { describe, it, expect } from 'vitest';
import { findClosestColor, paletteLabs } from './match.js';
import { GENERIC_PALETTE } from '../palettes/generic.js';
import type { Palette } from '../types.js';

describe('findClosestColor', () => {
  it('matches exact palette color with deltaE 0', () => {
    const target = GENERIC_PALETTE.colors[10]; // Red
    const match = findClosestColor(target.rgb, GENERIC_PALETTE);
    expect(match.index).toBe(10);
    expect(match.deltaE).toBe(0);
  });

  it('matches pure white to the White swatch', () => {
    const match = findClosestColor({ r: 255, g: 255, b: 255 }, GENERIC_PALETTE);
    expect(GENERIC_PALETTE.colors[match.index].name).toBe('White');
  });

  it('matches pure black to the Black swatch', () => {
    const match = findClosestColor({ r: 0, g: 0, b: 0 }, GENERIC_PALETTE);
    expect(GENERIC_PALETTE.colors[match.index].name).toBe('Black');
  });

  it('uses precomputed labs identically', () => {
    const labs = paletteLabs(GENERIC_PALETTE);
    const rgb = { r: 120, g: 30, b: 200 };
    expect(findClosestColor(rgb, GENERIC_PALETTE, labs)).toEqual(
      findClosestColor(rgb, GENERIC_PALETTE),
    );
  });

  it('throws on empty palette', () => {
    const empty: Palette = { id: 'x', name: 'x', brand: 'generic', colors: [] };
    expect(() => findClosestColor({ r: 0, g: 0, b: 0 }, empty)).toThrow();
  });
});
