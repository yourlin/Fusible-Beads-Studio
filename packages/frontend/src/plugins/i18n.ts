import { createI18n } from 'vue-i18n';

export type LocaleCode = 'en' | 'zh';

const STORAGE_KEY = 'pindou-locale';

const en = {
  brand: 'Fusible Beads Studio',
  pageTitle: 'Fusible Beads Studio — Turn images into bead patterns',
  nav: { home: 'Home', studio: 'Studio' },
  home: {
    eyebrow: 'Runs locally · your data never leaves the device',
    titleLine1: 'Turn any image',
    titleLine2: 'into a bead pattern',
    lead: 'Upload an image, convert it to a bead pattern right in the browser, fine-tune each bead, then export a high-res PNG or a PDF with a material list.',
    start: 'Start designing',
    learn: 'See features',
    github: 'View source on GitHub',
    sectionTitle: 'Three simple steps',
    f1Title: 'Local conversion',
    f1Desc: 'Powered by Canvas and CIEDE2000 color matching — the whole image is converted in your browser, no network needed.',
    f2Title: 'Edit online',
    f2Desc: 'Brush, eraser, paint bucket and eyedropper — adjust bead by bead, undo and redo anytime.',
    f3Title: 'One-click export',
    f3Desc: 'Export a high-res PNG, or a PDF with bead numbers and a material list to build from.',
  },
  studio: {
    import: 'Import image',
    reimport: 'Re-import',
    workbench: 'Workbench',
    beads: 'beads',
    colors: 'colors',
    converting: 'Converting…',
    emptyHint: 'Click "Import image" to upload and generate a bead pattern',
    materialList: 'Material list',
    showNumbers: 'Numbers',
  },
  tools: {
    brush: 'Brush',
    eraser: 'Eraser (restore original)',
    bucket: 'Paint bucket',
    eyedropper: 'Eyedropper',
    pan: 'Pan (hand)',
    undo: 'Undo (Ctrl+Z)',
    redo: 'Redo (Ctrl+Shift+Z)',
  },
  params: {
    boardSize: 'Board size',
    palette: 'Palette',
    dither: 'Dither',
    ditherHelp:
      'When on, uses Floyd–Steinberg error diffusion: spreads each pixel’s color-match error to neighboring pixels for smoother gradients, at the cost of slight noise in detailed areas. Good for photos; turn off for pixel art / cartoons.',
    bgRemoval: 'Background removal',
    bgRemovalHelp:
      'Treats near-white pixels as background (empty beads). Higher values remove more light pixels. Set to 0 to keep all colors. Transparent pixels are always removed automatically.',
    colorsWord: 'colors',
  },
  boards: {
    'single-29': 'Single board',
    'quad-58': '4-board (2×2)',
    'tri-87x29': '3-board (horizontal)',
  },
  palettes: {
    'generic-48': 'Generic',
    'perler-30': 'Perler',
    'artkal-30': 'Artkal',
  },
  upload: {
    dropHint: 'Click to select, or drag an image here',
    formats: 'PNG / JPG / WebP / SVG — processed locally, never uploaded',
    cancel: 'Remove image',
    reselect: 'Choose another image',
    notImage: 'Please choose an image file',
    loadFailed: 'Failed to read image, please try another one',
  },
  dialog: {
    title: 'Import image and generate',
    cancel: 'Cancel',
    generate: 'Generate pattern',
    regenerate: 'Regenerate',
    original: 'Original',
    beadPreview: 'Bead preview',
    params: 'Conversion settings',
  },
  preview: {
    generating: 'Generating preview…',
    hint: 'Preview appears automatically after upload',
  },
  canvas: {
    zoomOut: 'Zoom out',
    zoomIn: 'Zoom in',
    reset100: 'Reset to 100%',
    fit: 'Fit to window',
  },
  exportCtl: {
    settings: 'Export settings',
    cellSize: 'Cell size',
    gridLines: 'Grid lines',
    beadNumbers: 'Bead numbers',
    png: 'PNG',
    pdf: 'PDF',
    noDesign: 'Nothing to export',
    tooLarge: 'Export resolution {w}×{h}px exceeds the {max}px limit, please reduce the cell size',
    pngFailed: 'PNG generation failed',
    moduleFailed: 'A new version was just released. Please refresh the page and export again.',
  },
  palettePanel: { title: 'Palette' },
};

const zh: typeof en = {
  brand: '拼豆星球',
  pageTitle: '拼豆星球 — 把图片拼成豆图',
  nav: { home: '首页', studio: '工作台' },
  home: {
    eyebrow: '本地运行 · 数据不离开设备',
    titleLine1: '把任何图片',
    titleLine2: '拼成一张豆图',
    lead: '上传图片，浏览器里直接转换成拼豆图稿，逐颗调整珠子颜色，再导出高清 PNG 或带材料清单的 PDF。',
    start: '开始设计',
    learn: '了解功能',
    github: '在 GitHub 查看源码',
    sectionTitle: '三步搞定',
    f1Title: '本地转换',
    f1Desc: '基于 Canvas 与 CIEDE2000 颜色匹配，整张图在浏览器里完成转换，无需联网。',
    f2Title: '在线编辑',
    f2Desc: '画笔、橡皮、油漆桶、取色器一应俱全，逐颗微调，随时撤销重做。',
    f3Title: '一键导出',
    f3Desc: '导出高清 PNG 图稿，或带珠子编号与材料清单的 PDF，照着拼就行。',
  },
  studio: {
    import: '导入图片',
    reimport: '重新导入',
    workbench: '工作台',
    beads: '颗',
    colors: '色',
    converting: '正在转换…',
    emptyHint: '点击「导入图片」上传并生成拼豆图',
    materialList: '材料清单',
    showNumbers: '编号',
  },
  tools: {
    brush: '画笔',
    eraser: '橡皮（恢复原色）',
    bucket: '油漆桶',
    eyedropper: '取色器',
    pan: '平移（抓手）',
    undo: '撤销 (Ctrl+Z)',
    redo: '重做 (Ctrl+Shift+Z)',
  },
  params: {
    boardSize: '拼豆板尺寸',
    palette: '色板',
    dither: '抖动',
    ditherHelp:
      '开启后使用 Floyd–Steinberg 误差扩散算法：将每个像素的颜色匹配误差分散到邻近像素，使渐变和过渡区域看起来更平滑自然，代价是细节处可能出现轻微噪点。适合照片类图片，像素画/卡通建议关闭。',
    bgRemoval: '背景剔除',
    bgRemovalHelp:
      '将接近纯白的像素视为背景并标记为空珠（不放珠子）。数值越大，越多的浅色像素会被剔除。设为 0 则保留所有颜色。透明像素始终会被自动剔除，无需此设置。',
    colorsWord: '色',
  },
  boards: {
    'single-29': '单板',
    'quad-58': '4 板拼接',
    'tri-87x29': '横向 3 板',
  },
  palettes: {
    'generic-48': '通用',
    'perler-30': 'Perler',
    'artkal-30': 'Artkal',
  },
  upload: {
    dropHint: '点击选择，或将图片拖拽到这里',
    formats: '支持 PNG / JPG / WebP / SVG，本地处理不上传',
    cancel: '取消图片',
    reselect: '重新选择图片',
    notImage: '请选择图片文件',
    loadFailed: '图片读取失败，请换一张图片试试',
  },
  dialog: {
    title: '导入图片并生成',
    cancel: '取消',
    generate: '生成拼豆图',
    regenerate: '重新生成',
    original: '原图',
    beadPreview: '拼豆预览',
    params: '转换参数',
  },
  preview: {
    generating: '预览生成中…',
    hint: '上传图片后自动显示预览',
  },
  canvas: {
    zoomOut: '缩小',
    zoomIn: '放大',
    reset100: '还原为 100%',
    fit: '适配窗口',
  },
  exportCtl: {
    settings: '导出设置',
    cellSize: '每格尺寸',
    gridLines: '网格线',
    beadNumbers: '珠子编号',
    png: 'PNG',
    pdf: 'PDF',
    noDesign: '没有可导出的图稿',
    tooLarge: '导出分辨率 {w}×{h}px 超过 {max}px 上限，请减小每格尺寸',
    pngFailed: 'PNG 生成失败',
    moduleFailed: '检测到新版本，请刷新页面后再导出。',
  },
  palettePanel: { title: '色板' },
};

function initialLocale(): LocaleCode {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  return saved === 'zh' || saved === 'en' ? saved : 'en';
}

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: 'en',
  messages: { en, zh },
});

/** 切换语言并持久化。 */
export function setLocale(locale: LocaleCode): void {
  i18n.global.locale.value = locale;
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, locale);
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', locale === 'zh' ? 'zh-CN' : 'en');
  }
}

/** 在非组件上下文（composable/工具）中翻译。 */
export const t = i18n.global.t as unknown as (
  key: string,
  named?: Record<string, unknown>,
) => string;
