import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import { fileURLToPath, URL } from 'node:url';

// SEO 域名的唯一来源。绑定自定义域名后只改这里（或通过 SITE_URL 环境变量覆盖）。
// 注意：必须以斜杠结尾，与 BASE_PATH 子路径保持一致。
const SITE_URL = process.env.SITE_URL || 'https://yourlin.github.io/Fusible-Beads-Studio/';

/**
 * 统一注入 SEO 静态资源：
 * - 把 index.html 中的 %SITE_URL% 占位符替换为真实域名（dev / build 均生效）。
 * - 构建时按 SITE_URL 生成 robots.txt 与 sitemap.xml，无需手工维护。
 */
function seoAssets(): Plugin {
  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`;
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}studio</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
`;
  return {
    name: 'seo-assets',
    transformIndexHtml: {
      // 必须在 vite 解析 HTML 节点之前替换占位符：
      // 否则 vite 对 URL 属性执行 decodeURI 时会因 %SI 非法转义而报 "URI malformed"。
      order: 'pre',
      handler(html) {
        return html.replaceAll('%SITE_URL%', SITE_URL);
      },
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots });
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap });
    },
  };
}

export default defineConfig({
  // GitHub Pages 项目站点需要子路径 base；本地与其他环境默认 '/'
  base: process.env.BASE_PATH || '/',
  plugins: [vue(), vuetify({ autoImport: true }), seoAssets()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    server: {
      deps: {
        inline: ['vuetify'],
      },
    },
  },
});
