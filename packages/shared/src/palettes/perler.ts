import type { BeadColor, Palette } from '../types.js';
import { bead } from './generic.js';

/**
 * Perler 常用色板（含料号）。颜色为近似值，便于颜色匹配演示与导出。
 */
const PERLER_COLORS: BeadColor[] = [
  bead('perler', 'p01', 'White', '#F4F4F1', 'P01'),
  bead('perler', 'p02', 'Cream', '#F3E6C4', 'P02'),
  bead('perler', 'p03', 'Yellow', '#FCD514', 'P03'),
  bead('perler', 'p04', 'Cheddar', '#F6A623', 'P04'),
  bead('perler', 'p05', 'Orange', '#F26C21', 'P05'),
  bead('perler', 'p06', 'Red', '#E2241A', 'P06'),
  bead('perler', 'p07', 'Magenta', '#D81E78', 'P07'),
  bead('perler', 'p08', 'Pink', '#F4A6C0', 'P08'),
  bead('perler', 'p09', 'Light Pink', '#F8C9D8', 'P09'),
  bead('perler', 'p10', 'Hot Coral', '#F2553D', 'P10'),
  bead('perler', 'p11', 'Purple', '#6E2C91', 'P11'),
  bead('perler', 'p12', 'Pastel Lavender', '#C4B0DD', 'P12'),
  bead('perler', 'p13', 'Dark Blue', '#1C3F94', 'P13'),
  bead('perler', 'p14', 'Blue', '#1F6FB2', 'P14'),
  bead('perler', 'p15', 'Light Blue', '#7EC8E3', 'P15'),
  bead('perler', 'p16', 'Pastel Blue', '#A9CCE3', 'P16'),
  bead('perler', 'p17', 'Turquoise', '#2BB6AE', 'P17'),
  bead('perler', 'p18', 'Dark Green', '#1E6E3C', 'P18'),
  bead('perler', 'p19', 'Green', '#3AA63F', 'P19'),
  bead('perler', 'p20', 'Pastel Green', '#A7D8A0', 'P20'),
  bead('perler', 'p21', 'Bright Green', '#7DC242', 'P21'),
  bead('perler', 'p22', 'Tan', '#D7B47E', 'P22'),
  bead('perler', 'p23', 'Light Brown', '#A4703C', 'P23'),
  bead('perler', 'p24', 'Brown', '#6E4524', 'P24'),
  bead('perler', 'p25', 'Gray', '#8C9091', 'P25'),
  bead('perler', 'p26', 'Light Gray', '#C4C7C8', 'P26'),
  bead('perler', 'p27', 'Black', '#202020', 'P27'),
  bead('perler', 'p28', 'Rust', '#9E4522', 'P28'),
  bead('perler', 'p29', 'Peach', '#F6C9A6', 'P29'),
  bead('perler', 'p30', 'Plum', '#7B2D5E', 'P30'),
];

export const PERLER_PALETTE: Palette = {
  id: 'perler-30',
  name: 'Perler 30 色',
  brand: 'perler',
  colors: PERLER_COLORS,
};
