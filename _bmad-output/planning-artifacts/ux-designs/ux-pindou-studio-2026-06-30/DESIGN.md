---
title: 库存驱动设计 — 视觉规格
status: final
created: 2026-06-30
updated: 2026-06-30
inherits: Vuetify 拼豆设计系统（packages/frontend/src/plugins/vuetify.ts）
sources:
  - prd: _bmad-output/planning-artifacts/prds/prd-pindou-studio-2026-06-30/prd.md
colors:
  # 继承自现有 Vuetify 主题（不重复定义，仅命名引用）
  primary: "{vuetify.primary}"          # 莓果 Berry #C8456B / 暗色 #E5779A
  secondary: "{vuetify.secondary}"      # 薄荷绿 Teal #15A08C
  accent: "{vuetify.accent}"            # 暖橙 #F2A03D
  # 本方向新增的语义色（复用现有主题槽位，避免引入新色相）
  buildable: "{vuetify.success}"        # 绿灯·可拼 = success #15A08C
  substitutable: "{vuetify.warning}"    # 黄灯·替代后无缺色 = warning #E0A100
  insufficient: "{vuetify.error}"       # 红灯·数量不足 = error #D14343
  missing-mark: "{vuetify.accent}"      # 缺色格标记 = accent 暖橙（高对比、非红，区别于"不足"）
typography: "{vuetify.defaults}"        # 继承
rounded: "{vuetify.defaults}"           # VBtn lg / VCard xl / VChip lg
spacing: "{vuetify.defaults}"
components: "{vuetify.defaults}"
---

# 库存驱动设计 — 视觉规格

> **本规格继承既有 Vuetify 拼豆设计系统**（`packages/frontend/src/plugins/vuetify.ts`），不重新定义视觉语言。这里只规定库存驱动功能**新增**的视觉决策——主要是三态灯、缺色/不足标记、感知替代预览的色彩语义与样式。任何与既有主题冲突处，以既有主题为准。

## Brand & Style

沿用现有设计哲学，一字不改：**界面外壳保持克制，让用户的拼豆作品成为主角。** 莓果 Berry 是唯一的品牌主色，画布上色彩丰富的拼豆图样才是视觉焦点。

库存驱动功能必须**服从**这一哲学，不喧宾夺主：库存面板、三态灯、标记都用既有主题色槽，不引入新色相，不与画布抢注意力。新增的视觉信号“安静但清晰”——用得着时一眼可辨，用不着时退到背景。

## Colors

**全部复用既有主题槽位，不新增色相**（见 frontmatter）。语义映射：

| 语义 | 复用槽位 | Light | 用途 |
|---|---|---|---|
| 可拼（绿灯） | `success` | `#15A08C` 薄荷绿 | 可拼性判定：直接可拼 |
| 替代后无缺色（黄灯） | `warning` | `#E0A100` | 可拼性判定：替代后无缺色（不承诺数量） |
| 数量不足（红灯） | `error` | `#D14343` | 可拼性判定：有色放不进库存色板 |
| 缺色格标记 | `accent` | `#F2A03D` 暖橙 | 画布上缺色格子的高亮——**刻意用暖橙而非红**，与“数量不足”的红区分；暖橙本是既有“豆子高光”色，语义自洽 |
| 数量不足标红 | `error` | `#D14343` | 材料清单中不足色号的数字（与三态红灯同色，作用面不同） |

> **为何不引入新色**：既有主题已有 success / warning / error / accent 四个语义槽，恰好覆盖三态灯 + 缺色标记。引入新色相会破坏"外壳克制"的哲学，也增加 light/dark 双主题的维护负担。

## Shapes & Components

库存驱动新增的 UI 元素全部使用既有 Vuetify 组件与圆角默认值（VCard `xl`、VChip `lg`、VBtn `lg`、VTextField/VSelect `lg`）：

- **三态灯**：`VChip` + 状态色 + mdi 图标（见 EXPERIENCE 无障碍）。不自造组件。
- **库存条目行**：`VTextField`（数量）+ 色块 + 色号，沿用既有 PalettePanel 的色块呈现风格。
- **缺色格标记**：画布层（`BeadCanvas`）叠加，非 Vuetify 组件——描边 + 暖橙 + 斜纹纹理（见无障碍，不只靠颜色区分）。
- **替代预览对比**：`VCard` 内左右并排两块画布缩略图，或单画布切换（`VBtnToggle`）。

## Do's and Don'ts

| Do | Don't |
|---|---|
| 三态灯、标记一律用既有主题语义色 | ❌ 为"更醒目"引入鲜艳新色相 |
| 缺色标记暖橙 + 纹理/图标双编码 | ❌ 只靠红/橙区分缺色与不足（色盲不可辨） |
| 库存面板退到画布之后，安静 | ❌ 库存 UI 与拼豆图样抢视觉焦点 |
| dark 主题下沿用既有提亮值 | ❌ 只在 light 下验证就交付 |
