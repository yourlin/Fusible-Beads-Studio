# 拼豆设计图稿 Fusible Beads Studio

[English](./README.md) · **简体中文**

把任意图片转换成拼豆（Perler / Hama / Artkal）图稿 —— 全程在浏览器里完成。
上传图片，转换为珠子网格，逐颗微调，再导出高清 PNG 或可直接打印、带编号材料清单的 PDF。

**在线体验：** https://yourlin.github.io/Fusible-Beads-Studio/

> 全程本地处理，图片不上传服务器。界面支持中英文切换（默认英文）。

## 功能特性

- **本地转换** —— `createImageBitmap` → 离屏 Canvas（最近邻、保持宽高比）→ 逐像素用
  **CIEDE2000** 颜色匹配最接近的珠子色。无任何网络请求。
- **可选抖动** —— Floyd–Steinberg 误差扩散，让渐变过渡更平滑。
- **背景剔除** —— 把接近纯白 / 透明的像素作为空珠剔除。
- **交互式编辑器** —— 画笔、橡皮（恢复原色）、油漆桶（迭代洪水填充）、取色器、平移（抓手）工具，
  支持撤销 / 重做（深度 50）。
- **画布查看器** —— 锚点滚轮缩放、拖拽与双指平移、视口裁剪、适配 devicePixelRatio、
  多板分割线、悬停提示、带 100% 顿挫的缩放滑块。
- **颜色编号** —— 用到的颜色分配图例编号，并在色板、每颗珠子、材料清单与导出文件中保持一致。
- **导出** —— 高清 PNG（含材料清单图例）与单页 PDF（矢量圆点 + 编号 + 材料清单，不分页）。
- **国际化** —— 中文 / English，本地持久化记忆。
- **拼豆板预设** —— 单板 29×29、四板拼接 58×58、横向三板 87×29。
- **色板** —— 通用 48 色、Perler、Artkal。

## 技术栈

- **前端：** Vue 3 + Vuetify 3 + Vite + TypeScript + Pinia + vue-router + vue-i18n
- **共享逻辑：** `@pindou/shared` —— 色板 + CIEDE2000 颜色匹配（与框架无关）
- **PDF：** jsPDF（矢量绘制）；**PNG：** 离屏 Canvas
- **基础设施：** AWS CDK（S3 + CloudFront，私有桶 + OAC）—— 可选，用于 AWS 托管
- **测试：** Vitest（单元）+ Playwright（端到端）
- **Monorepo：** pnpm workspaces

## 目录结构

```
.
├── packages/
│   ├── shared/     # 类型、色板、color/{convert,ciede2000,match}
│   ├── frontend/   # Vue 应用：stores、composables、components、views、utils
│   └── infra/      # AWS CDK 栈（GitHub Pages 之外的可选方案）
├── .github/workflows/deploy.yml   # GitHub Pages 持续部署
└── pnpm-workspace.yaml
```

## 快速开始

需要 Node 20+ 与 pnpm 10+。

```bash
pnpm install

# 开发服务器（http://localhost:5173）
pnpm dev:frontend

# 单元测试（shared + frontend + infra）
pnpm test

# 代码检查
pnpm lint

# 生产构建（全部包）
pnpm build
```

### 端到端测试

```bash
pnpm --filter @pindou/frontend exec playwright install chromium
pnpm --filter @pindou/frontend exec playwright test
```

## 部署

### GitHub Pages（自动）

推送到 `main` 会触发 `.github/workflows/deploy.yml`：以项目子路径 `/Fusible-Beads-Studio/`
构建前端，并将 `packages/frontend/dist` 发布到 GitHub Pages。

仓库一次性设置：**Settings → Pages → Build and deployment → Source 选择 GitHub Actions**。

本应用是单页应用（SPA），工作流会把 `index.html` 复制为 `404.html`，保证深链接刷新可正常解析。

### AWS（可选）

```bash
pnpm --filter @pindou/infra synth      # 生成 CloudFormation 模板
pnpm --filter @pindou/infra exec cdk deploy
```

会创建一个私有 S3 桶，通过 CloudFront（Origin Access Control）对外服务，并配置 SPA 路由。

## 许可证

MIT
