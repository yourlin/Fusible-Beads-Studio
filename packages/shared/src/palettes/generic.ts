import type { BeadColor, BrandId, Palette } from '../types.js';
import { hexToRgb } from '../color/convert.js';

/** 根据 hex 构建 BeadColor（自动派生 rgb）。 */
export function bead(brand: BrandId, id: string, name: string, hex: string, code?: string): BeadColor {
  return { id, name, hex, code, rgb: hexToRgb(hex), brand };
}

/**
 * 通用 48 色调色板。覆盖中性色、原色、二次色与常见肤/木色，
 * 适合作为默认色板使用。
 */
const GENERIC_COLORS: BeadColor[] = [
  bead('generic', 'g01', 'White', '#FFFFFF'),
  bead('generic', 'g02', 'Cream', '#F5EAD0'),
  bead('generic', 'g03', 'Light Gray', '#C9CCCE'),
  bead('generic', 'g04', 'Gray', '#8A8E91'),
  bead('generic', 'g05', 'Dark Gray', '#4A4E51'),
  bead('generic', 'g06', 'Black', '#1B1B1B'),
  bead('generic', 'g07', 'Pink', '#F7A8C4'),
  bead('generic', 'g08', 'Hot Pink', '#E94B8A'),
  bead('generic', 'g09', 'Magenta', '#C2186A'),
  bead('generic', 'g10', 'Rose Red', '#A81B4C'),
  bead('generic', 'g11', 'Red', '#E22B27'),
  bead('generic', 'g12', 'Dark Red', '#8E1B1B'),
  bead('generic', 'g13', 'Salmon', '#F58C7B'),
  bead('generic', 'g14', 'Coral', '#F26B4E'),
  bead('generic', 'g15', 'Orange', '#F47B20'),
  bead('generic', 'g16', 'Dark Orange', '#D55B12'),
  bead('generic', 'g17', 'Apricot', '#F6C18A'),
  bead('generic', 'g18', 'Tan', '#D8A368'),
  bead('generic', 'g19', 'Light Brown', '#A9743F'),
  bead('generic', 'g20', 'Brown', '#7A4A21'),
  bead('generic', 'g21', 'Dark Brown', '#4E2E15'),
  bead('generic', 'g22', 'Skin', '#F2C9A6'),
  bead('generic', 'g23', 'Light Yellow', '#FBEF8A'),
  bead('generic', 'g24', 'Yellow', '#FCD20A'),
  bead('generic', 'g25', 'Gold', '#E0A92E'),
  bead('generic', 'g26', 'Lime', '#B6D43A'),
  bead('generic', 'g27', 'Light Green', '#7AC74F'),
  bead('generic', 'g28', 'Green', '#3AA94A'),
  bead('generic', 'g29', 'Dark Green', '#1F6E33'),
  bead('generic', 'g30', 'Forest Green', '#14502A'),
  bead('generic', 'g31', 'Teal', '#1FA89B'),
  bead('generic', 'g32', 'Mint', '#A7E3CE'),
  bead('generic', 'g33', 'Cyan', '#35C4E0'),
  bead('generic', 'g34', 'Sky Blue', '#5BA9E6'),
  bead('generic', 'g35', 'Light Blue', '#9BC4E8'),
  bead('generic', 'g36', 'Blue', '#2563C4'),
  bead('generic', 'g37', 'Dark Blue', '#1A3C8E'),
  bead('generic', 'g38', 'Navy', '#142657'),
  bead('generic', 'g39', 'Periwinkle', '#8C9CE0'),
  bead('generic', 'g40', 'Light Purple', '#B79BE0'),
  bead('generic', 'g41', 'Purple', '#7E3FB0'),
  bead('generic', 'g42', 'Dark Purple', '#54257A'),
  bead('generic', 'g43', 'Plum', '#7A2A55'),
  bead('generic', 'g44', 'Lavender', '#D7C6EC'),
  bead('generic', 'g45', 'Beige', '#E6D8BE'),
  bead('generic', 'g46', 'Olive', '#7A7A2E'),
  bead('generic', 'g47', 'Charcoal', '#33373A'),
  bead('generic', 'g48', 'Silver', '#B8BCC0'),
];

export const GENERIC_PALETTE: Palette = {
  id: 'generic-48',
  name: '通用 48 色',
  brand: 'generic',
  colors: GENERIC_COLORS,
};
