import type { BeadColor, Palette } from '../types.js';
import { bead } from './generic.js';

/**
 * Artkal 常用色板（S 系列近似料号）。颜色为近似值。
 */
const ARTKAL_COLORS: BeadColor[] = [
  bead('artkal', 'a01', 'White', '#FAFAF7', 'S01'),
  bead('artkal', 'a02', 'Off White', '#F0E9D6', 'S02'),
  bead('artkal', 'a03', 'Lemon Yellow', '#FBE018', 'S03'),
  bead('artkal', 'a04', 'Golden Yellow', '#F7B718', 'S04'),
  bead('artkal', 'a05', 'Orange', '#F36F21', 'S05'),
  bead('artkal', 'a06', 'Bright Red', '#E12028', 'S06'),
  bead('artkal', 'a07', 'Carmine', '#C01747', 'S07'),
  bead('artkal', 'a08', 'Rose', '#EC6A9C', 'S08'),
  bead('artkal', 'a09', 'Light Pink', '#F7C5D6', 'S09'),
  bead('artkal', 'a10', 'Coral', '#F4644B', 'S10'),
  bead('artkal', 'a11', 'Violet', '#6B2E92', 'S11'),
  bead('artkal', 'a12', 'Lilac', '#BBA6DA', 'S12'),
  bead('artkal', 'a13', 'Navy Blue', '#17357F', 'S13'),
  bead('artkal', 'a14', 'Sea Blue', '#1C73B3', 'S14'),
  bead('artkal', 'a15', 'Sky Blue', '#73C2E8', 'S15'),
  bead('artkal', 'a16', 'Powder Blue', '#A7CDE5', 'S16'),
  bead('artkal', 'a17', 'Peacock', '#1AA9A0', 'S17'),
  bead('artkal', 'a18', 'Deep Green', '#1B6B39', 'S18'),
  bead('artkal', 'a19', 'Grass Green', '#39A845', 'S19'),
  bead('artkal', 'a20', 'Tender Green', '#A6D79C', 'S20'),
  bead('artkal', 'a21', 'Yellow Green', '#8CC53F', 'S21'),
  bead('artkal', 'a22', 'Khaki', '#D4B07C', 'S22'),
  bead('artkal', 'a23', 'Coffee', '#A06A36', 'S23'),
  bead('artkal', 'a24', 'Dark Brown', '#5F3A1E', 'S24'),
  bead('artkal', 'a25', 'Steel Gray', '#888C8E', 'S25'),
  bead('artkal', 'a26', 'Silver Gray', '#C2C5C6', 'S26'),
  bead('artkal', 'a27', 'Black', '#1C1C1C', 'S27'),
  bead('artkal', 'a28', 'Brick', '#9C4326', 'S28'),
  bead('artkal', 'a29', 'Skin', '#F4CBA8', 'S29'),
  bead('artkal', 'a30', 'Wine', '#74284F', 'S30'),
];

export const ARTKAL_PALETTE: Palette = {
  id: 'artkal-30',
  name: 'Artkal 30 色',
  brand: 'artkal',
  colors: ARTKAL_COLORS,
};
