import { describe, it, expect } from 'vitest';
import { BOARD_SIZES } from '@pindou/shared';

describe('frontend can import shared package', () => {
  it('reads board presets from @pindou/shared', () => {
    expect(BOARD_SIZES.length).toBeGreaterThan(0);
    expect(BOARD_SIZES[0].cols).toBe(29);
  });
});
