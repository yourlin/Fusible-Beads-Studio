---
project_name: 'pindou-studio'
user_name: 'Linyesh'
date: '2026-06-30'
sections_completed:
  [
    'technology_stack',
    'build_and_modules',
    'data_contracts',
    'vue_state',
    'i18n',
    'export_gotchas',
    'testing',
    'code_style',
    'deployment',
  ]
status: 'complete'
rule_count: 26
optimized_for_llm: true
existing_patterns_found: 7
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

**Monorepo**：pnpm workspace（`packages/*`），Node ≥18，pnpm ≥8。三个包：

- `@pindou/shared` — 框架无关的核心逻辑（颜色匹配、调色板、拼豆板），纯 TS，编译为 ESM。
- `@pindou/frontend` — Vue 3 UI。
- `@pindou/infra` — AWS CDK（可选托管路径）。

**Frontend**：Vue `^3.4`（Composition API + `<script setup>`）、Vuetify `^3.5`、Pinia `^2.1`、vue-router `^4.3`、vue-i18n `^9.13`、jsPDF `^2.5`。
**构建**：Vite `^5.2`，`vue-tsc`（类型检查门禁），`vite-plugin-vuetify`（autoImport）。
**Infra**：aws-cdk-lib `^2.140`（CommonJS，与前端 ESM 隔离）。
**测试**：Vitest `^1.5`（jsdom）+ Playwright `^1.44`（仅 chromium）。
**TS**：`strict` + `noUnusedLocals/Parameters` + `noImplicitReturns` + `isolatedModules`，target ES2020，`moduleResolution: Bundler`。

## Critical Implementation Rules

### 构建顺序与模块系统

- **改了 `shared` 必须 rebuild**：frontend 通过 `workspace:*` 消费 `@pindou/shared` 的 `dist/`。改完 `shared` 不跑 `pnpm build:shared`（或 `pnpm -r build`），frontend 会**静默使用陈旧的类型与实现，测试可能假绿**。开发期建议跑 `shared` 的 `pnpm --filter @pindou/shared dev`（tsc watch）。
- **`shared` 内部 import 必须带 `.js` 后缀**（如 `import { rgbToLab } from './convert.js'`）。它编译为纯 ESM，省略后缀运行时报错——**不要"好心"帮它删掉后缀**。frontend 内部用 `@/` 别名（指向 `src/`）且不加后缀（Vite 解析）。
- `infra` 是 CommonJS（`type: commonjs`），不要把它的 import 风格带到其他包。

### 数据契约（集中在 `shared/src/types.ts`）

- 新增跨包数据结构，先改 `shared/types.ts`，再从 `shared/index.ts` 重导出。**不要**在 frontend 里另立平行类型。
- `BeadGrid = number[][]`，存的是**相对于某个特定 palette 的颜色索引**，`-1` 表示空珠。遍历网格的逻辑必须显式处理 `idx < 0`。
- **三不变量**，违反任一项 UI 不报错但统计/导出会错：
  1. `grid` 的行列数恒等于当前 `boardSize` 的 `rows`×`cols`；
  2. `countMap` 恒等于 `grid` 的真实用量统计（只能经 store 的 `applyCellChanges` / `commitConversion` 修改，**不要绕过它直接改 `grid`**）；
  3. 颜色索引恒 ∈ `[-1, palette.colors.length)`。
- 颜色匹配用 CIEDE2000（`shared/color`）。逐像素调用务必先 `paletteLabs()` 预计算 Lab 再传入 `findClosestColor`。

### Vue / 状态管理

- 组件统一 `<script setup lang="ts">`；Vuetify 组件 autoImport，**不要**手动 import `v-*` 组件。
- 全局状态用 Pinia options-store（`useDesignStore`，见 `stores/design.ts`）。
- 一次完整笔画（按下→拖拽→抬起）合并为**单条**撤销历史（见 `useEditor` + `useHistory`）。
- **切换 palette 不会重新匹配颜色**：`setPalette` 只改 `paletteId`，网格里的索引原样保留。若换到更短的 palette，越界索引会在画布上渲染成黑色（`colors[idx]?.hex ?? '#000'`）、在材料清单里被静默跳过（`counts`/`numberedCounts` 里 `if (!color) continue`）。改动 palette 相关逻辑时必须知道此行为；要"换板重算颜色"需显式重新 `convert` 并 `commitConversion`。

### i18n（强约束）

- 文案只能放 `plugins/i18n.ts`，`zh` 对象的类型由 `typeof en` 约束：**加任何 key 必须同时补 `en` 和 `zh`**，否则类型不过。
- 组件里用 `useI18n()` 的 `t`；在 composable/工具等非组件上下文，用从 `plugins/i18n.ts` 导出的 `t()`。

### 导出（PNG / PDF）gotchas

- **PDF 里的中文（CJK）必须经 `addLabel()` 渲染成 canvas 图片再嵌入**：jsPDF 内置字体不支持 CJK。**不要把中文标签"优化"成 `doc.text()` 直接写**，否则 PDF 中文变乱码/方块。
- 导出受单边像素上限 `MAX_EXPORT_PX = 8000` 约束，由 `exceedsMaxSize()` 拦截。**不要绕过此检查**，超限会得到空白 canvas（浏览器静默失败）。
- 图片转换流程是「先缩放到板尺寸（最大约 87×58）→ 再逐格颜色匹配」，CIEDE2000 只跑几千个格子。无需 Web Worker，**不要**为"大图性能"自作主张引入 Worker 改写。
- PDF 用动态 `import('jspdf')` 懒加载；重新部署后旧 chunk 会 404，已统一捕获并提示用户刷新（`exportCtl.moduleFailed`）。

### 测试

- `*.test.ts` 与源文件**同目录就近**放置。
- 单测用 Vitest（`globals: true`，jsdom）；涉及 Vuetify 的依赖已在 `vite.config.ts` inline 配置。
- E2E 在 `frontend/e2e/`，Playwright 自动起 Vite dev server（:5173），仅跑 chromium。
- `pnpm build:frontend` 会先跑 `vue-tsc --noEmit`——**类型错误会阻断构建**，提交前确保类型干净。

### 代码风格

- Prettier：单引号、分号、`trailingComma: all`、`printWidth: 100`、2 空格、LF。
- ESLint：未用变量报错（`_` 前缀豁免），`no-explicit-any` 警告（尽量避免 `any`）。
- **注释与文档字符串用中文**，JSDoc 风格（项目现有惯例）。

### 部署

- 站点 URL 单一来源是 `vite.config.ts` 的 `SITE_URL`（可被 `SITE_URL` 环境变量覆盖，**必须以 `/` 结尾**）；robots.txt 与 sitemap.xml 构建时自动生成，**别手写**。新增路由要同步更新 `vite.config.ts` 里 sitemap 的 url 列表。
- GitHub Pages 子路径部署靠 `BASE_PATH` 环境变量；推送 `main` 自动触发 `.github/workflows/deploy.yml` 部署。
- AWS CDK（`infra`）是另一条可选托管路径：私有 S3 + CloudFront OAC，SPA 403/404 重写到 `index.html`。

---

## Usage Guidelines

**给 AI Agent：**

- 实现任何代码前先读本文件，并严格遵守全部规则。
- 拿不准时，选更保守的做法。
- 出现新的稳定模式时，更新本文件。

**给维护者（Linyesh）：**

- 保持精简，只收录"看不见、不写就会错"的规则。
- 技术栈变化时同步更新（尤其版本号与构建流程）。
- 定期复查，删掉已变得显而易见的规则。

Last Updated: 2026-06-30
