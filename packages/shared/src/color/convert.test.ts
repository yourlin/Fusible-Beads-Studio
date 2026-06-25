import { describe, it, expect } from 'vitest';
import { hexToRgb, rgbToHex, rgbToLab } from './convert.js';

describe('hex <-> rgb', () => {
  it('parses 6-digit hex with hash', () => {
    expect(hexToRgb('#FF8000')).toEqual({ r: 255, g: 128, b: 0 });
  });

  it('parses 3-digit shorthand', () => {
    expect(hexToRgb('#0f0')).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('round-trips rgb -> hex -> rgb', () => {
    const rgb = { r: 18, g: 200, b: 77 };
    expect(hexToRgb(rgbToHex(rgb))).toEqual(rgb);
  });

  it('throws on invalid hex', () => {
    expect(() => hexToRgb('#xyz')).toThrow();
  });
});

describe('rgbToLab', () => {
  it('maps white to L≈100, a≈0, b≈0', () => {
    const lab = rgbToLab({ r: 255, g: 255, b: 255 });
    expect(lab.L).toBeCloseTo(100, 2);
    expect(lab.a).toBeCloseTo(0, 1);
    expect(lab.b).toBeCloseTo(0, 1);
  });

  it('maps black to L≈0', () => {
    const lab = rgbToLab({ r: 0, g: 0, b: 0 });
    expect(lab.L).toBeCloseTo(0, 4);
  });

  it('maps sRGB red to known Lab', () => {
    const lab = rgbToLab({ r: 255, g: 0, b: 0 });
    expect(lab.L).toBeCloseTo(53.24, 1);
    expect(lab.a).toBeCloseTo(80.09, 1);
    expect(lab.b).toBeCloseTo(67.2, 1);
  });
});
