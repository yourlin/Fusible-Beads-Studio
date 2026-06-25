// 生成社交分享预览图 public/og-image.png (1200x630)。
// 用法：node scripts/generate-og.mjs  （依赖 Playwright 自带的 Chromium）
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../public/og-image.png');

// 莓果主色 / 浅莓高光，与首页爱心一致。
const B = '#C8456B';
const H = '#E8829E';
const heart = [
  [0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0],
  [1, 2, 2, 1, 0, 0, 0, 1, 2, 2, 1],
  [1, 2, 1, 1, 1, 0, 1, 1, 1, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
];

const cells = heart
  .flat()
  .map((v) => {
    if (v === 0) return '<span class="cell"></span>';
    const c = v === 2 ? H : B;
    return `<span class="cell"><span class="bead" style="background:${c}"></span></span>`;
  })
  .join('');

const html = `<!DOCTYPE html><html><head><meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=ZCOOL+KuaiLe&display=swap" rel="stylesheet" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; display: flex; align-items: center;
    font-family: 'Noto Sans SC', system-ui, sans-serif;
    background:
      radial-gradient(120% 90% at 88% 0%, rgba(200,69,107,0.12), transparent 60%),
      radial-gradient(90% 80% at 0% 100%, rgba(21,160,140,0.12), transparent 55%),
      #FFF9FB;
  }
  .wrap { display: flex; align-items: center; gap: 56px; padding: 0 80px; width: 100%; }
  .left { flex: 1; }
  .eyebrow {
    display: inline-flex; align-items: center; gap: 10px;
    font-size: 22px; font-weight: 600; color: #15A08C;
    background: rgba(21,160,140,0.12); padding: 8px 18px; border-radius: 999px; margin-bottom: 26px;
  }
  .eyebrow b { width: 14px; height: 14px; border-radius: 50%; background: #15A08C; display: inline-block; }
  h1 { font-family: 'ZCOOL KuaiLe', 'Noto Sans SC', sans-serif; font-size: 84px; line-height: 1.08; color: #2C2A33; margin-bottom: 24px; }
  h1 .accent { color: #C8456B; }
  p { font-size: 30px; line-height: 1.5; color: rgba(44,42,51,0.66); max-width: 560px; }
  .brand { margin-top: 40px; font-size: 26px; font-weight: 700; color: #C8456B; letter-spacing: .02em; }
  .art {
    display: grid; grid-template-columns: repeat(11, 1fr); gap: 8px;
    width: 420px; padding: 30px; background: #fff; border-radius: 34px;
    box-shadow: 0 30px 70px -30px rgba(44,42,51,0.45); transform: rotate(-4deg); flex: 0 0 auto;
  }
  .cell { aspect-ratio: 1; }
  .bead { display: block; width: 100%; height: 100%; border-radius: 50%;
    box-shadow: inset 0 0 0 4px rgba(255,255,255,0.35), inset 0 -3px 5px rgba(0,0,0,0.12); }
</style></head>
<body>
  <div class="wrap">
    <div class="left">
      <div class="eyebrow"><b></b>本地运行 · 数据不离开设备</div>
      <h1>把任何图片<br /><span class="accent">拼成一张豆图</span></h1>
      <p>上传图片，浏览器里转成拼豆图稿，逐颗微调，再导出高清 PNG 或带材料清单的 PDF。</p>
      <div class="brand">拼豆星球 · Fusible Beads Studio</div>
    </div>
    <div class="art">${cells}</div>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: 'networkidle' });
// 给 Web 字体一点加载时间
await page.waitForTimeout(800);
await page.screenshot({ path: OUT, clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();
console.log('Wrote', OUT);
