---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories']
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-pindou-studio-2026-06-30/prd.md
  - _bmad-output/planning-artifacts/architecture/architecture-pindou-studio-2026-06-30/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-pindou-studio-2026-06-30/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-pindou-studio-2026-06-30/EXPERIENCE.md
---

# pindou-studio - Epic Breakdown

## Overview

本文档为 pindou-studio 的「库存驱动设计（Inventory-Driven Design）」方向提供完整的 epic 与 story 拆分，把 PRD、UX 设计契约（DESIGN + EXPERIENCE）与架构脊柱的需求分解为可实现的 story。

核心立论：把现有 CIEDE2000 引擎「反着用」——颜色匹配的候选从「品牌全色板」缩到「用户真实拥有的库存子集」，缺色时做**感知最优替代**（替代而非补货）。库存模式是**叠加可选层**，关闭即完全回到基线、零回归。

## Requirements Inventory

### Functional Requirements

FR-1: 按色卡勾选录入库存——用户在选定品牌色板后，从其全部色号中勾选拥有的颜色，并为每个勾选项填写拥有数量（非负整数），生成该品牌色板下的库存条目集合。
FR-2: 库存本地持久化与维护——库存本地持久化、跨会话保留、可随时增删改；同一用户可分别保存多个品牌色板各自的库存互不覆盖；清空/重置须二次确认。
FR-3: 库存数量的快捷批量操作——支持「全选/全不选」、给一批勾选项设统一默认数量后再个别微调，降低录入成本。
FR-4: 库存模式开关——用户可在编辑器开启/关闭库存模式；默认关闭且关闭时与基线零回归；开启要求当前品牌色板已有非空库存，库存为空时禁用并引导去录入；开关状态在会话内保持。
FR-5: 以库存色板重新匹配图纸——开启库存模式时，用户可显式让工具用库存色板（拥有数量 > 0 的颜色）对当前图纸用 CIEDE2000 重新匹配；写回经 store 合法路径、保持三不变量、可撤销记单条历史；切换品牌色板不自动重匹配。
FR-6: 缺色与数量不足的可视标记——画布上缺色格带可辨识标记（暖橙描边+斜纹+图标，双编码色盲友好）；材料清单中数量不足色号显示「需求 vs 拥有」并标红、缺色单独归类；标记实时反映 grid 真实用量。
FR-7: 缺色的感知替代建议——对每个缺色，用 CIEDE2000 在库存色板内计算并给出感知色差（ΔE）最小的替代色号；候选仅取库存色板内颜色；库存色板为空时不产出替代并引导录入；复用 paletteLabs() + findClosestColor，无需 Web Worker。
FR-8: 应用感知替代到图纸——用户可一键把所有（或选定）缺色按 FR-7 建议整色替换为库存色，写回经 store 合法路径保持三不变量；记单条撤销历史可整体回退；应用后材料清单与可拼性判定即时刷新。v1 不做逐色手动指定替代色。
FR-9: 替代影响预览——应用前可预览：将被替代的缺色数、受影响格子总数、每个替代的 ΔE 与「视觉影响：低/中/高」分级（初值 低<2 / 中 2–5 / 高>5，待标定）；提供「替代前/后」画布对比（并排，窄屏退化为切换）；可接受全部或放弃。
FR-10: 三态可拼性判定——开启库存模式时给出三态判定：可拼（绿，全色在掩码内且量足）/ 替代后无缺色（黄，有缺色但全部可在库存色板找到替代，不承诺数量精算到颗）/ 数量不足（红，有色连替代都进不了掩码）；以红黄绿状态+一句人话呈现；v1 不做替代色库存级联校验。
FR-11: 缺口清单——可拼性判定附带缺口清单，每项含色号、类型（缺色/数量不足）、差额数量，且每行必须带人类可读解读（如「够铺这张图，余量紧张」「还差约 N 颗」）；缺色项可跳转 FR-7 替代建议；清单可复制/导出为纯文本，不内置购买链接、不入 PDF。

### NonFunctional Requirements

NFR-1（性能·无回归）：库存模式不得拖慢或劣化基线转珠体验；关闭库存模式时性能与结果零回归（SM-C2）。
NFR-2（性能·无 Worker）：库存色板重匹配与感知替代沿用现有路径——先 paletteLabs() 预计算 Lab 再 findClosestColor，作用于板尺寸级（数千格），不引入 Web Worker。
NFR-3（隐私·本地化）：纯前端、无登录、无后端，库存与计算全部本地化（localStorage，KB 级）。
NFR-4（无障碍·双编码）：缺色/不足标记与三态灯不只靠颜色——配独立 mdi 图标 + 纹理 + 文字标签，色盲与高对比模式可辨；新增暖橙标记在 light/dark 下均达 WCAG AA。
NFR-5（键盘可达）：库存录入（勾选/数量/批量）、库存模式开关、替代应用/放弃全部键盘可操作，沿用 Vuetify 默认焦点管理。
NFR-6（替代质量·反指标）：感知替代的平均 ΔE 不应为求「全绿」无上限放大；「高视觉影响」（ΔE > 5）替代占比要低（SM-C1）。
NFR-7（i18n·构建门禁）：所有新增 UI 文案每个 key 必须同时补 en 和 zh，否则类型不过、阻断构建；非组件上下文用导出的 t()。

### Additional Requirements

> 来自架构脊柱（ARCHITECTURE-SPINE.md）的技术不变量与结构约束，下游 story 必须遵守。本 feature **不引入任何新依赖**（localStorage 为浏览器原语）。

- **[Starter/Greenfield]** 无新项目脚手架——这是**既有 brownfield 项目的增量**，建立在现有 `useDesignStore`、CIEDE2000 引擎、`palette`/`BeadGrid`/三不变量之上，不另起炉灶。Epic 1 Story 1 应为数据契约/纯逻辑地基，而非项目初始化。
- **AD-1** grid 颜色索引恒指品牌色板，库存模式不改索引语义；「库存色板」不是独立 Palette，而是品牌索引空间上的候选掩码 `InventoryMask`（拥有数量 > 0 的品牌索引集合）；写回 grid 恒为品牌色板索引。
- **AD-2** 库存数据契约集中在 `shared/src/types.ts` 并从 index.ts 重导出（`Inventory`/`InventoryEntry`/`BuildabilityVerdict`/`ShortfallItem` 等）；库存条目以 `BeadColor.id` 为键，不用 code 或数组下标；不在 frontend 另立平行类型。
- **AD-3** 库存纯逻辑（可拼性判定、缺口计算、感知替代选色、掩码推导）一律下沉 `shared` 框架无关纯函数，store/composable 只做编排与合法路径写回。
- **AD-4** 库存持久化只走单一仓储边界 `services/inventoryRepo.ts`，组件/store 不直接碰 localStorage；落盘用版本信封 `{ schema_version, paletteId, entries }` 按 `Palette.id` 分键；读取时解析不到的 colorId 直接丢弃（不回退 -1）。
- **AD-5** 库存派生数据走单一派生源——纯函数 `analyzeInventory(grid, brandPalette, inventory) → InventoryAnalysis` 一次算出 `mask`/`perColorStatus`/`verdict`/`shortfall`/`substitutions`，并定义空态契约（不抛错）；store 用单一响应式 getter 暴露，所有 story 读此唯一出口；「编辑后即时刷新」由 getter 响应性免费获得。
- **AD-6** 写回 grid 只经 store 合法路径：逐格经 `applyCellChanges`、整图经 `commitConversion`，守三不变量。
- **AD-7** 库存模式是叠加可选层，默认关闭、关闭零回归；所有库存派生/标记/三态灯只在 `inventoryMode === true` 时参与计算与渲染。
- **AD-8** ΔE 阈值与状态色为单一来源常量——阈值（初值 低<2 / 中 2–5 / 高>5）作为 `shared` 单一常量（`thresholds.ts`），三态/标记语义色复用既有 Vuetify 主题槽位（success/warning/error/accent），标记双编码。
- **AD-9** 重匹配/应用替代须保留撤销与「替代前」基线，各记为独立单条历史——不得裸调 `commitConversion`（既有实现不记历史且重置 originalGrid），须走能记录撤销的路径。
- **结构落点**：新增 `shared/src/inventory/`（analyze.ts、thresholds.ts、index.ts）、`frontend/src/services/inventoryRepo.ts`、`frontend/src/views/InventoryView.vue`、`/inventory` 路由（懒加载）、Studio 内库存面板/三态灯/缺色标记/替代预览卡组件、i18n 文案。
- **部署铁律**：新增 `/inventory` 路由必须同步更新 `vite.config.ts` 的 sitemap url 列表（否则页面静默掉出 SEO）。
- **混合 IA**：录入/维护放独立 `/inventory` 顶级视图（宽敞）；Studio 内只放轻量库存面板（开关/可拼性/缺口/触发替代）。

### UX Design Requirements

> 来自 UX 设计契约（DESIGN.md 视觉规格 + EXPERIENCE.md 体验规格）。spine 在与 mock 冲突时获胜。

UX-DR1: 三态灯组件——`VChip` + 状态语义色（success/warning/error 三槽）+ 独立 mdi 图标（绿 `mdi-check-circle`、黄 `mdi-swap-horizontal`、红 `mdi-alert-circle`）+ 一句人话标签；常驻显示状态，点击展开缺口清单。
UX-DR2: 缺色格画布标记——`BeadCanvas` 叠加层：暖橙（accent `#F2A03D`）描边 + 斜纹纹理 + 图标三重编码（刻意用暖橙非红，区别于「不足」的 error 红）；数量不足色不在画布逐格标，只在材料/缺口清单标红。
UX-DR3: 库存条目行（Inventory 页）——勾选框切换「是否拥有」，勾选后数量字段（`VTextField`）激活；色块 + 色号沿用既有 PalettePanel 风格；数量非整数/负数即时内联校验标红 + 提示。
UX-DR4: 批量操作条（Inventory 页）——「全选/全不选」+「给已勾选项设统一默认数量」（输入一个数应用到所有已勾选项再个别微调）。
UX-DR5: 库存模式开关（Studio 库存面板）——`VSwitch`；库存为空时禁用并提示去录入（不是开了再报错）；开启后画布/材料清单切到库存色板基准。
UX-DR6: 缺口清单（三态灯展开）——每行：色块 + 色号 + 人话解读；缺色行带「用库存替代」按钮跳 FR-7；「复制为文本」（纯文本，不进 PDF）。
UX-DR7: 替代预览卡——显示将替代的缺色数、受影响格数、每个替代的视觉影响分级（低/中/高，本质 ΔE）；前后对比用并排缩略图（窄屏退化为 `VBtnToggle` 切换）；底部「应用全部 / 放弃」。
UX-DR8: 微文案规范（Voice & Tone）——「引擎算得出的事别让用户用肉眼算，说人话不甩账本」：所有主文案说人话（如「全部可用你现有库存完成 ✓」「够铺这张图，余量紧张」），ΔE 等技术值仅作 hover/详情次要信息。
UX-DR9: 状态模式覆盖——库存为空 / 模式关闭（零回归）/ 全可拼 / 有缺色 / 数量不足 / 替代计算中 / 替代后 / 库存色板为空 / 录入数量非法 / 清空重置（VDialog 二次确认）各状态的 surface 行为与 treatment。
UX-DR10: dark 主题适配——所有新增视觉信号在 light/dark 双主题下沿用既有提亮值并验证，不只在 light 下交付。
UX-DR11: 缺色链可见性——「黄灯 → 点替代 → 预览 → 应用 → 转绿」是一条用户看得见因果的链；库存模式是叠加层不打断编辑、替代可逆、触发显式不偷改。

### FR Coverage Map

FR-1: Epic 1 - 按色卡勾选录入库存
FR-2: Epic 1 - 库存本地持久化与维护
FR-3: Epic 1 - 库存数量的快捷批量操作
FR-4: Epic 2 - 库存模式开关
FR-5: Epic 2 - 以库存色板重新匹配图纸
FR-6: Epic 2 - 缺色与数量不足的可视标记
FR-10: Epic 3 - 三态可拼性判定
FR-11: Epic 3 - 缺口清单
FR-7: Epic 4 - 缺色的感知替代建议
FR-8: Epic 4 - 应用感知替代到图纸
FR-9: Epic 4 - 替代影响预览

> NFR-1~7 与 UX-DR1~11 为跨切关注点，在各 epic 的相关 story 中逐条落实（i18n 构建门禁、dark 主题、无障碍双编码、键盘可达、零回归等）。

## Epic List

> **执行顺序（party-mode 2026-06-30 决议）**：1→2→3→4。先判定（KF-2「能不能拼」）后替代（KF-1「一键替」）；承重 getter `analyzeInventory` 在 Epic 2 建立、在低风险的 Epic 3 纯展示层先被真实 UI 压验，再上有写回/撤销/历史的高风险 Epic 4。

### Epic 1: 库存录入与持久化
用户可按品牌色板勾选拥有的颜色并填写数量，库存本地持久化、跨会话保留、随时增删改，并用批量操作快速录入；录入完成后能一眼确认这板库存录对了（如汇总「已登记 N 色 / 约 M 颗」）。交付完整的库存管理能力（UJ-1/UJ-2 的前置状态），即便不开启库存模式也独立可用；这也是整个方向的第一道流失漏斗，必须证明「录入不烦人」。含数据契约地基（AD-2 `shared/types.ts`）与仓储边界（AD-4 `inventoryRepo`）。
**FRs covered:** FR-1, FR-2, FR-3
**实现注记（party-mode 决议）**：持久化 story 须显式落「v1 信封落盘 + 迁移框架占位」——读到未知 `schema_version` 的降级策略要在场（虽 v1 无旧数据可迁，不假装迁移已验证）；Epic 1 验收停在「用户能确认库存录对」，而非仅「存进去了」。

### Epic 2: 库存模式与约束匹配
用户可开启库存模式，用库存色板（拥有数量 > 0 的子集）对当前图纸用 CIEDE2000 重新匹配，并在画布与材料清单上看到缺色与数量不足的可视标记。交付「我能看到我缺什么」。建立在 Epic 1 之上；含单一派生源地基（AD-5 `analyzeInventory`，一次算出 mask/perColorStatus/verdict/shortfall/substitutions）、store `inventoryMode` + 单一派生 getter、AD-1 掩码语义、AD-9 记历史整图写回。关闭模式时与基线零回归（AD-7）。
**FRs covered:** FR-4, FR-5, FR-6
**实现注记（party-mode 决议）**：须含一个专门的「库存模式关闭·基线零回归测试」story，钉死 AD-7/NFR-1/SM-C2，让零回归有明确负责人，而非散落各 story。

### Epic 3: 可拼性判定与缺口清单
用户开启库存模式即可看到三态可拼性判定（绿=可拼 / 黄=替代后无缺色 / 红=数量不足）+ 带人类可读解读的缺口清单，缺色行可跳转感知替代，清单可复制为纯文本。实现 UJ-2「这张图我现在能拼吗」——先于替代，让用户先判断要不要替。建立在 Epic 2 的 `analyzeInventory.verdict/shortfall` 之上（全为读取的纯展示层，零写回，风险最低，先压验承重 getter）。
**FRs covered:** FR-10, FR-11
**实现注记（party-mode 决议）**：缺口清单缺色行的「用库存替代」入口在本 Epic 渲染为**可见但禁用的占位**（disabled + i18n「Epic 4 点亮」类提示），让「缺色→替代→可拼」的链在判定阶段即可见；Epic 4 解禁该入口（一个 feature 标记，不增架构负担）。

### Epic 4: 感知替代（差异化命脉）
用户可对缺色一键应用 CIEDE2000 感知最优替代（整色替换），应用前先预览（将替代的缺色数、受影响格数、每个替代的视觉影响分级、前后对比），可确认全部或放弃，应用后可整体撤销。这是 pindou-studio 区别于所有竞品的核心——「别人说去买，我们用手头替」。建立在 Epic 2 的 `analyzeInventory.substitutions` 与 Epic 3 已点亮的替代入口之上；含 AD-9 应用替代记独立单条历史并保留替代前基线。点亮 Epic 3 中预置的「用库存替代」入口。
**FRs covered:** FR-7, FR-8, FR-9
**实现注记（party-mode 决议·ΔE 标定拆两段）**：① `shared/inventory/thresholds.ts` 的**结构 + 初值**（低<2/中2–5/高>5）+ 分级函数 `classifyDeltaE` 在本 Epic 第一个 story 立起，FR-7/8/9 全程用初值开发与验收（分级逻辑正确性与数值定稿解耦）；② **数值定稿**为本 Epic 最后一个 story，拿前面做出的引擎跑真实图纸标定，只改常量字面量不改函数签名，验收用产品判据（SM-C1「高视觉影响占比」在定稿阈值下可被测量）。

---

## Epic 1: 库存录入与持久化

用户可按品牌色板勾选拥有的颜色并填写数量，库存本地持久化、跨会话保留、随时增删改，并用批量操作快速录入；录入完成后能一眼确认这板库存录对了。交付完整的库存管理能力（UJ-1/UJ-2 的前置状态），即便不开启库存模式也独立可用。

### Story 1.1: 库存数据契约与仓储边界地基

As a 维护此项目的开发者,
I want 在 `@pindou/shared` 定义库存数据契约、并在 frontend 建立单一仓储边界 `inventoryRepo`（含版本信封与迁移框架占位）,
So that 后续所有库存 story 共享同一套类型与持久化入口，杜绝平行类型与直写 localStorage 导致的 schema 漂移。

**Acceptance Criteria:**

**Given** `@pindou/shared` 当前的 `src/types.ts` 与 `index.ts`
**When** 新增库存数据契约
**Then** `Inventory`、`InventoryEntry`（`{ colorId, qty }`，`colorId` 为 `BeadColor.id`、`qty` 为非负整数）定义于 `shared/src/types.ts`
**And** 全部从 `shared/index.ts` 重导出，frontend 不另立平行类型（AD-2）

**Given** 已改动 `@pindou/shared`
**When** 在 frontend 消费这些新类型前
**Then** 已执行 `pnpm build:shared`（或 `pnpm -r build`），避免 frontend 静默使用陈旧 dist（project-context 构建顺序铁律）

**Given** 需要持久化库存
**When** 创建 `frontend/src/services/inventoryRepo.ts`
**Then** 该模块是库存读写的唯一入口，组件/store 不直接调用 `localStorage`（AD-4）
**And** 落盘格式为版本信封 `{ schema_version: number, paletteId: string, entries: InventoryEntry[] }`，`schema_version` 为整数且单调递增
**And** 按 `Palette.id`（如 `'perler-30'`）分键独立保存，不用 `Palette.brand`

**Given** repo 读取某品牌色板的库存信封
**When** 信封中某 `colorId` 在当前 palette 解析不到
**Then** 直接丢弃该条目，不回退为 `-1`（避免污染掩码、撞 grid 空格哨兵 `-1`）（AD-4）

**Given** repo 读到一个 `schema_version` 高于当前已知版本的信封（迁移框架占位）
**When** 执行读取
**Then** 采用明确的降级策略（如安全忽略/返回空并告警），不抛未捕获异常、不静默写坏数据
**And** 迁移逻辑收敛在 repo 内部，不泄漏到上层（v1 无旧数据可迁，但降级路径须在场且可单测）

**Given** 上述纯逻辑与仓储边界
**When** 编写单测（Vitest，就近同目录）
**Then** 类型契约、信封读写、分键隔离、未知 colorId 丢弃、未知 version 降级均有单测覆盖，且 `vue-tsc` 类型检查通过

### Story 1.2: 按色卡勾选 + 填量录入库存

As a 拼豆玩家,
I want 选定一个品牌色板后，从其全部色号中勾选我拥有的颜色并为每个填写数量,
So that 我能把"我有哪些珠、各多少"用最低成本告诉工具。

**Acceptance Criteria:**

**Given** 应用新增独立的库存录入页
**When** 配置路由
**Then** 新增 `/inventory` 路由（懒加载，沿用既有范式）指向 `InventoryView.vue`
**And** 同步更新 `vite.config.ts` 的 sitemap url 列表（部署铁律，否则页面静默掉出 SEO）
**And** 顶栏/导航提供进入 Inventory 页的入口

**Given** 用户在 Inventory 页选定某个品牌色板
**When** 页面渲染
**Then** 列出该色板全部色号，每项带色块、色号与可选名称（沿用既有 PalettePanel 色块风格，UX-DR3）

**Given** 某色号行
**When** 用户勾选"拥有"复选框
**Then** 该行的数量字段（VTextField）激活，可输入拥有数量
**And** 未勾选的色号不计入库存（不生成库存条目）

**Given** 用户在数量字段输入
**When** 输入为非整数或负数
**Then** 即时内联校验：标红 + 一句人话提示，不静默吞掉（UX-DR3, UX-DR9）
**And** 数量字段接受 0 与正整数

**Given** 用户完成勾选与填量
**When** 录入生效
**Then** 经 `inventoryRepo`（Story 1.1）生成该品牌色板下的库存条目集合并落盘，不直接碰 localStorage

**Given** 任意新增的 UI 文案（页面标题、勾选、数量、校验提示、导航入口等）
**When** 提交代码
**Then** 每个文案 key 同时补 `en` 与 `zh`（构建门禁 NFR-7），非组件上下文用导出的 `t()`
**And** 录入交互（勾选、数量输入）键盘可达（NFR-5），light/dark 双主题均验证（UX-DR10）

### Story 1.3: 库存录入的快捷批量操作

As a 拥有很多色号的拼豆玩家,
I want 用"全选/全不选"和"给已勾选项设统一默认数量"来快速录入,
So that 录入一整板新货能在一两分钟内完成，不被逐格填数劝退。

**Acceptance Criteria:**

**Given** Inventory 页已展示某品牌色板的色号列表（Story 1.2）
**When** 页面提供批量操作条
**Then** 含"全选本色板 / 全不选"操作，一键切换全部色号的勾选状态（UX-DR4）

**Given** 已有若干勾选项
**When** 用户在批量条输入一个统一默认数量并应用
**Then** 该数量应用到所有当前已勾选项
**And** 之后用户仍可对个别色号微调数量，覆盖批量值

**Given** 批量操作改变了勾选/数量
**When** 操作生效
**Then** 经 `inventoryRepo` 落盘（不绕过仓储边界）
**And** 批量操作全程键盘可达（NFR-5），新增文案补 en/zh（NFR-7）

### Story 1.4: 跨会话持久化与多品牌色板独立库存

As a 拼豆玩家,
I want 我录的库存在关掉浏览器后仍然在，且不同品牌色板的库存各自独立互不覆盖,
So that 我无需登录、无需重录，且能分别管理 Perler / Hama / Artkal 等多套库存。

**Acceptance Criteria:**

**Given** 用户已录入某品牌色板的库存并落盘
**When** 关闭并重开浏览器后再次进入 Inventory 页
**Then** 已录入的库存仍在，从本地恢复，无需登录（FR-2, NFR-3）

**Given** 用户先后为两个不同品牌色板录入库存
**When** 在 Inventory 页的品牌色板切换间来回切换
**Then** 每个品牌色板加载各自独立的库存（按 `Palette.id` 分键，Story 1.1），互不覆盖

**Given** 多套库存已分键保存
**When** 检查持久化数据
**Then** 各信封以各自 `Palette.id` 为键独立存在；编辑其一不影响其他
**And** 端到端流程（录入 → 落盘 → 重载 → 渲染）有测试覆盖（E2E 或集成）

### Story 1.5: 库存维护、二次确认与录入确认汇总

As a 拼豆玩家,
I want 随时增删改库存条目、清空时有二次确认、并在录入后一眼看到这板库存的汇总,
So that 我能放心维护库存、不怕误删，并确认"这板真的录对了"。

**Acceptance Criteria:**

**Given** 已存在某品牌色板的库存
**When** 用户修改某库存条目的数量、取消勾选以移除条目、或新增勾选
**Then** 变更经 `inventoryRepo` 持久化，跨会话保留（FR-2）

**Given** 用户触发"清空/重置当前色板库存"
**When** 执行该操作前
**Then** 弹出二次确认（VDialog），用户确认后才清空，避免误删（FR-2, UX-DR9）

**Given** 用户完成或查看某品牌色板的库存
**When** Inventory 页渲染库存概况
**Then** 展示一目了然的汇总，如"已登记 N 个色 / 约 M 颗"（party-mode 决议：验收停在"能确认录对"，而非仅"存进去了"）

**Given** 维护与汇总相关的全部新增 UI
**When** 提交代码
**Then** 文案补 en/zh（NFR-7），操作键盘可达（NFR-5），light/dark 双主题验证（UX-DR10）

---

## Epic 2: 库存模式与约束匹配

用户可开启库存模式，用库存色板（拥有数量 > 0 的子集）对当前图纸用 CIEDE2000 重新匹配，并在画布与材料清单上看到缺色与数量不足的可视标记。交付「我能看到我缺什么」。关闭模式时与基线零回归。

### Story 2.1: analyzeInventory 单一派生源（shared 纯逻辑）

As a 维护此项目的开发者,
I want 在 `@pindou/shared` 实现纯函数 `analyzeInventory(grid, brandPalette, inventory)`，一次算出库存模式所需的全部派生结论,
So that FR-6 标记 / FR-10 三态灯 / FR-11 缺口清单 / FR-7 替代建议读同一个出口，永不对同一源头得出不一致结论。

**Acceptance Criteria:**

**Given** `@pindou/shared` 与新增 `shared/src/inventory/` 目录
**When** 实现 `analyze.ts`
**Then** 导出纯函数 `analyzeInventory(grid, brandPalette, inventory) → InventoryAnalysis`，零 Vue 依赖、可单测（AD-3）
**And** 内部 import 带 `.js` 后缀（shared 纯 ESM 铁律）

**Given** `analyzeInventory` 的输出
**When** 定义其返回类型
**Then** `InventoryAnalysis` 及其字段均定型于 `shared/src/types.ts` 并重导出，键法不留白（AD-2, AD-5）：
**And** `mask: InventoryMask`（`Set<number>`，品牌色板索引，与 grid 同空间）
**And** `perColorStatus: Record<number, 'ok' | 'insufficient' | 'missing'>`（以品牌色板索引为键，与 `grid[r][c]` 同空间，画布按索引直查）
**And** `verdict: BuildabilityVerdict`（三态枚举：可拼 / 替代后无缺色 / 数量不足）
**And** `shortfall: ShortfallItem[]`，每项 `{ colorId, index, kind: 'missing' | 'insufficient', deficit, note }`（双带 colorId 与 index）
**And** `substitutions: Substitution[]`，每项 `{ fromIndex, toIndex, deltaE, affectedCells }`（from=缺色品牌索引 → to=库存内品牌索引）

**Given** 「拥有数量 > 0」谓词与「`BeadColor.id` → 品牌索引」的连接
**When** 计算掩码与各派生字段
**Then** 该连接只在 `analyzeInventory` 内计算一次（AD-1），grid 写回的恒为品牌色板索引

**Given** 三态判据
**When** 计算 `verdict`
**Then** 绿=全色在掩码内且每色拥有量 ≥ 需求量；黄=有缺色但全部缺色都能在掩码内找到替代（不承诺数量精算到颗）；红=有色连替代都进不了掩码
**And** v1 不做替代色库存级联校验（party-mode 决议）

**Given** `inventory` 或 `mask` 为空
**When** 调用 `analyzeInventory`
**Then** 返回确定值（`verdict` 取「不可用·引导录入」、`substitutions = []`），不抛错（AD-5 空态契约）

**Given** 感知替代选色与缺口计算
**When** 实现这些纯逻辑
**Then** 复用既有引擎：先 `paletteLabs()` 预计算库存色板 Lab，再 `findClosestColor`/`ciede2000`，作用于板尺寸级，不引入 Web Worker（NFR-2）

**Given** 上述纯逻辑
**When** 编写单测（Vitest，就近同目录）
**Then** mask 推导、三态判据各分支、空态契约、shortfall/substitutions 字段正确性均有单测覆盖；改动 shared 后已 `pnpm build:shared`，`vue-tsc` 通过

### Story 2.2: 库存模式开关与单一派生 getter

As a 拼豆玩家,
I want 在编辑器里开启/关闭库存模式，开启后工具以我的库存色板为基准,
So that 我能让画布、材料清单、判定都切到"我真实拥有的颜色"这个约束下。

**Acceptance Criteria:**

**Given** design store 与 Studio 库存面板
**When** 引入库存模式状态
**Then** store 新增 `inventoryMode` 状态，默认关闭，状态在当前设计会话内保持（FR-4）

**Given** store 已持有 `inventory`、`inventoryMode` 与 `countMap`
**When** 暴露派生结论
**Then** store 用单一响应式 getter 调用 `analyzeInventory`（Story 2.1）暴露结果，依赖 `countMap` + `inventory` + `inventoryMode`（AD-5）
**And** 所有下游（标记/灯/清单/替代）读此唯一出口，不各自重算
**And** 仅在 `inventoryMode === true` 时参与计算与渲染（AD-7）

**Given** Studio 库存面板的库存模式开关（VSwitch，UX-DR5）
**When** 当前品牌色板的库存为空
**Then** 开关禁用，并显示一行人话引导「先录一点库存，才能开库存模式」+ 跳 Inventory 页按钮（不是开了再报错）（UX-DR5, UX-DR9）

**Given** 当前品牌色板已有非空库存
**When** 用户拨动开关开启库存模式
**Then** 画布渲染与材料清单切到库存色板基准
**And** 新增文案补 en/zh（NFR-7），开关键盘可达（NFR-5），light/dark 验证（UX-DR10）

### Story 2.3: 以库存色板重新匹配图纸

As a 拼豆玩家,
I want 开启库存模式后，显式让工具用我的库存色板对当前图纸重新做颜色匹配,
So that 图纸的每个格子优先落在我真实拥有的颜色上。

**Acceptance Criteria:**

**Given** 库存模式已开启
**When** 用户触发"以库存色板重新匹配"（显式动作）
**Then** 重新匹配仅在库存色板（拥有数量 > 0 的颜色）范围内用 CIEDE2000 选色（FR-5, AD-1）

**Given** 重新匹配产生新的 grid
**When** 写回 grid
**Then** 经 store 合法路径提交，保持三不变量（grid 行列、countMap、索引范围）（AD-6）
**And** 写回的颜色索引恒为品牌色板索引（AD-1）

**Given** 重匹配是整图级写回
**When** 提交变更
**Then** 不裸调 `commitConversion`（既有实现不记历史且重置 originalGrid）——须走能记录撤销的路径（AD-9）
**And** 重匹配记为独立的单条撤销历史，可整体回退，沿用既有 undo/redo

**Given** 用户切换品牌色板（非重匹配动作）
**When** palette 改变
**Then** 不自动重匹配，沿用既有"切 palette 不重匹配"行为（FR-5 Out of Scope，触发显式不偷改 UX-DR11）

**Given** 重匹配相关新增 UI
**When** 提交代码
**Then** 文案补 en/zh（NFR-7），触发入口键盘可达（NFR-5）

### Story 2.4: 缺色与数量不足的可视标记

As a 拼豆玩家,
I want 开启库存模式后，画布上缺色的格子被高亮标出、材料清单里数量不足的色号标红,
So that 我一眼就能看到这张图我缺哪些色、哪些色不够。

**Acceptance Criteria:**

**Given** 库存模式已开启、派生 getter 已产出 `perColorStatus`（Story 2.2）
**When** 渲染画布
**Then** 缺色格子叠加可辨识标记：暖橙（accent `#F2A03D`）描边 + 斜纹纹理 + 图标三重编码（UX-DR2, AD-8）
**And** 画布按品牌索引直查 `perColorStatus`，无需 id↔index 二次解析

**Given** 缺色标记
**When** 校验无障碍
**Then** 标记不只靠颜色（双编码：颜色 + 纹理/图标），色盲与高对比模式可辨；暖橙标记在 light/dark 下均达 WCAG AA（NFR-4, UX-DR2, UX-DR10）
**And** 刻意用暖橙而非红，与"数量不足"的 error 红区分

**Given** 数量不足的色号
**When** 渲染材料清单
**Then** 显示"需求 vs 拥有"并标红（error），缺色单独归类；数量不足不在画布逐格标（避免画布过吵）（FR-6, UX-DR2）

**Given** 用户编辑图纸改变了 grid 真实用量
**When** countMap 更新
**Then** 标记经派生 getter 的响应性即时刷新，无需手动触发（AD-5, FR-6）

**Given** ΔE 阈值与状态语义色
**When** 实现标记与后续判定的视觉
**Then** 语义色复用既有 Vuetify 主题槽位（accent/error），不引入新色相（AD-8, UX-DR2）
**And** 新增文案补 en/zh（NFR-7）

### Story 2.5: 库存模式关闭·基线零回归测试套件

As a 维护此项目的开发者,
I want 一套明确的回归测试，钉死"关闭库存模式时与基线转珠完全一致",
So that 库存逻辑永不渗入基线路径、零回归有明确负责人（而非散落各 story 飘着）。

**Acceptance Criteria:**

**Given** 库存模式默认关闭
**When** 不开启库存模式使用基线转珠
**Then** 颜色匹配、画布渲染、材料清单、撤销/重做、导出行为与引入库存功能前完全一致（AD-7, NFR-1, SM-C2）
**And** 无三态灯、无缺色标记参与渲染

**Given** 库存相关派生与 getter
**When** `inventoryMode === false`
**Then** 库存派生计算不参与、不影响基线性能（NFR-1）；基线路径不调用 `analyzeInventory`

**Given** 需要防止未来回归
**When** 编写测试套件
**Then** 以自动化测试（单测 + 必要的 E2E）覆盖"关模式 = 基线"的关键路径：转珠结果、countMap、导出、撤销历史
**And** 测试可作为后续任何改动 store/匹配路径的回归门禁

---

## Epic 3: 可拼性判定与缺口清单

用户开启库存模式即可看到三态可拼性判定（绿=可拼 / 黄=替代后无缺色 / 红=数量不足）+ 带人类可读解读的缺口清单，缺色行可跳转感知替代，清单可复制为纯文本。实现 UJ-2「这张图我现在能拼吗」——先于替代，让用户先判断要不要替。全为读取 `analyzeInventory` 的纯展示层，零写回。

### Story 3.1: 三态可拼性判定灯

As a 拼豆玩家,
I want 开启库存模式后，在库存面板看到一盏三态灯告诉我"这张图我现在能不能拼",
So that 我一眼就能判定：直接可拼 / 替代后无缺色 / 数量不足，不用自己肉眼算账。

**Acceptance Criteria:**

**Given** 库存模式已开启、派生 getter 已产出 `verdict`（Epic 2 Story 2.2）
**When** 渲染 Studio 库存面板
**Then** 常驻显示一盏三态灯（VChip），读 `analyzeInventory.verdict`，不自行重算（AD-5, FR-10）

**Given** 三态灯的三种状态
**When** 渲染状态
**Then** 绿=可拼（`success` `#15A08C`）/ 黄=替代后无缺色（`warning` `#E0A100`）/ 红=数量不足（`error` `#D14343`），复用既有 Vuetify 主题槽位、不引入新色相（AD-8, UX-DR1）
**And** 每个状态配独立 mdi 图标（绿 `mdi-check-circle`、黄 `mdi-swap-horizontal`、红 `mdi-alert-circle`）+ 文字标签，不只靠红黄绿（NFR-4, UX-DR1）

**Given** 每种状态
**When** 显示判定结论
**Then** 配一句人话，而非技术值（如绿「全部可用你现有库存完成 ✓」、黄「缺 N 个色——可以用手头的色替代」、红「有 N 个色即便替代也不够」）（UX-DR8, FR-10）
**And** ΔE 等技术值仅作 hover/详情次要信息，不进主文案

**Given** 库存色板为空或库存为空但开了模式
**When** getter 返回空态契约（AD-5）
**Then** 灯呈现"不可用·引导录入"态，不报错（UX-DR9）

**Given** 三态灯相关 UI
**When** 提交代码
**Then** 全部新增文案补 en/zh（NFR-7），灯可键盘聚焦/操作（NFR-5），light/dark 双主题验证（UX-DR1, UX-DR10）

### Story 3.2: 缺口清单（带人话解读）+ 复制为文本

As a 拼豆玩家,
I want 点开三态灯看到缺口清单，每行用人话告诉我每个问题色的后果，并能把清单复制成文本,
So that 我能读懂"缺哪些色、各差多少、后果是什么"，并自行决定补货或改图、把清单带去采购。

**Acceptance Criteria:**

**Given** 三态灯常驻显示（Story 3.1）
**When** 用户点击三态灯
**Then** 展开缺口清单，读 `analyzeInventory.shortfall`，不自行重算（AD-5, UX-DR1）

**Given** 缺口清单的每一项
**When** 渲染清单行
**Then** 每行含：色块 + 色号 + 类型（缺色 / 数量不足）+ 差额数量（FR-11）
**And** 缺色与数量不足分类清晰（缺色单独归类、数量不足标红 `error`）

**Given** 引擎能算出后果
**When** 渲染每行解读
**Then** 数字旁必缀一句人类可读解读，不能只甩数字（如数量不足「够铺这张图，余量紧张」或「还差约 N 颗」）（FR-11 party-mode 决议, UX-DR8）
**And** 解读句由引擎可算的事实生成，主文案说人话、不甩账本

**Given** 用户想把缺口清单带走
**When** 点击"复制为文本"
**Then** 缺口清单以纯文本复制到剪贴板（FR-11, UX-DR6）
**And** 不内置购买/采购链接（工具中立）；不嵌入 PDF（仅纯文本/剪贴板，导出形态铁律）

**Given** 缺口清单相关 UI
**When** 提交代码
**Then** 新增文案补 en/zh（NFR-7），清单与复制操作键盘可达（NFR-5），light/dark 验证（UX-DR10）

### Story 3.3: 缺色行「用库存替代」入口（可见占位）与缺色链可见

As a 拼豆玩家,
I want 在缺口清单的每个缺色行看到一个"用库存替代"的入口,
So that 我能看见「缺色 → 替代 → 可拼」是一条连贯的路，知道下一步可以做什么（即使该功能将在后续点亮）。

**Acceptance Criteria:**

**Given** 缺口清单中某行是缺色（kind = 'missing'）（Story 3.2）
**When** 渲染该行
**Then** 该行带一个"用库存替代"按钮入口（UX-DR6, UX-DR11）

**Given** 本 Epic 阶段感知替代功能（Epic 4）尚未点亮
**When** 渲染"用库存替代"按钮
**Then** 按钮渲染为**可见但禁用的占位**，带 tooltip/提示说明该能力即将可用（party-mode 占位决议）
**And** 由一个 feature 标记控制启用状态，Epic 4 解禁时无需改动本 Epic 结构

**Given** 数量不足行（kind = 'insufficient'）
**When** 渲染该行
**Then** 不提供"用库存替代"入口（替代只解决缺色，不解决数量不足），解读句给出「还差约 X 颗」让用户决定补货或改图（FR-11）

**Given** 整条缺色处理链
**When** 用户浏览库存面板
**Then** 「黄灯 → 点开缺口清单 → 看到缺色行的替代入口」这条因果链在判定阶段即可见，不是黑箱（UX-DR11）

**Given** 占位入口相关 UI
**When** 提交代码
**Then** 新增文案（按钮、tooltip）补 en/zh（NFR-7），入口键盘可达（NFR-5），light/dark 验证（UX-DR10）

---

## Epic 4: 感知替代（差异化命脉）

用户可对缺色一键应用 CIEDE2000 感知最优替代（整色替换），应用前先预览（将替代的缺色数、受影响格数、每个替代的视觉影响分级、前后对比），可确认全部或放弃，应用后可整体撤销。这是 pindou-studio 区别于所有竞品的核心——「别人说去买，我们用手头替」。

### Story 4.1: ΔE 阈值结构、初值与分级函数

As a 维护此项目的开发者,
I want 在 `@pindou/shared` 立起 ΔE 分级阈值的单一常量来源与分级函数（带可推翻的初值）,
So that FR-7/8/9 全程基于稳定的分级 API 开发，分级逻辑正确性与数值是否定稿彻底解耦。

**Acceptance Criteria:**

**Given** `shared/src/inventory/` 目录（Epic 2 已建）
**When** 实现 `thresholds.ts`
**Then** ΔE 分级阈值作为 `shared` 的**单一常量来源**，标定时只改这一处（AD-8）
**And** 初值为 低 < 2 / 中 2–5 / 高 > 5（PRD FR-9 给定，标记为待标定的初值）

**Given** 需要把 ΔE 值映射为视觉影响分级
**When** 导出分级函数
**Then** 提供 `classifyDeltaE(dE): 'low' | 'mid' | 'high'`，纯函数、可单测、零 Vue 依赖（AD-3, AD-8）
**And** 函数签名固定——后续标定（Story 4.5）只改常量字面量，不改此签名

**Given** 分级函数与常量
**When** 编写单测
**Then** 覆盖各阈值边界（如 dE=2、dE=5 的归类），改动 shared 后已 `pnpm build:shared`，`vue-tsc` 通过

### Story 4.2: 缺色的感知替代建议

As a 拼豆玩家,
I want 工具对当前图纸的每个缺色，从我的库存色板里算出感知色差最小的替代色,
So that 缺色时我能知道"用手头的哪个色替最不影响效果"，而不是被告知"去补货"。

**Acceptance Criteria:**

**Given** 库存模式已开启、派生 getter 已产出 `substitutions`（Epic 2 Story 2.1/2.2）
**When** 读取替代建议
**Then** 对每个缺色，输出一个来自库存色板的替代色（`Substitution { fromIndex, toIndex, deltaE, affectedCells }`），来自 `analyzeInventory.substitutions`，不自行重算（AD-5, FR-7）

**Given** 替代候选的计算
**When** `analyzeInventory` 计算 substitutions（已在 2.1 实现）
**Then** 替代候选只取库存色板（拥有数量 > 0）内的颜色，保证替代后确有料可用（FR-7）
**And** 计算复用既有引擎：`paletteLabs()` 预计算库存色板 Lab + `findClosestColor`，不引入 Web Worker（NFR-2）

**Given** 库存色板为空（无任何可用色）
**When** 请求替代建议
**Then** 不产出替代（`substitutions = []`，AD-5 空态契约），并提示用户去录入库存（UX-DR9, FR-7）

**Given** 每个替代建议
**When** 在 UI 呈现
**Then** 主文案说人话（如「用天蓝 A7 替代浅蓝 H2」），ΔE 经 `classifyDeltaE`（Story 4.1）映射为视觉影响分级作主要呈现，ΔE 原值仅作次要信息（UX-DR8）
**And** 新增文案补 en/zh（NFR-7）

### Story 4.3: 应用感知替代到图纸（整色替换）

As a 拼豆玩家,
I want 一键把所有缺色按建议替换为库存色，并能整体撤销,
So that 我不用逐格手动改，且替错了能一键退回——敢点，因为随时能退。

**Acceptance Criteria:**

**Given** 存在缺色与替代建议（Story 4.2）
**When** 用户触发"应用全部替代"
**Then** 每个缺色的全部格子整色替换为其建议的库存替代色（整色替换，v1 不做逐色手动指定）（FR-8, PRD Open Q1）

**Given** 应用替代写回 grid
**When** 提交变更
**Then** 被替代格子的颜色索引指向库存色板中的替代色（仍为品牌色板索引空间，AD-1）
**And** 写回经 store 合法路径，保持三不变量（AD-6）

**Given** 应用替代是整图级写回
**When** 提交变更
**Then** 不裸调 `commitConversion`（不记历史且重置 originalGrid）——走能记录撤销的路径（AD-9）
**And** 应用替代记为**独立的单条**撤销历史（与重匹配各自一条，不合并），可整体回退到替代前（AD-9, UX-DR11）

**Given** 应用替代完成
**When** 派生 getter 重算
**Then** 材料清单与三态可拼性判定即时刷新（缺色应消失 → 灯转绿/黄）（FR-8, AD-5）

**Given** Epic 3 Story 3.3 的"用库存替代"占位入口
**When** 本 Story 交付
**Then** 解禁该入口的 feature 标记，使缺口清单缺色行的"用库存替代"可点击并进入替代流程（party-mode 占位决议）

### Story 4.4: 替代影响预览（前后对比）

As a 拼豆玩家,
I want 在应用替代前先预览影响范围、视觉影响分级，并对比"替代前/后"画面,
So that 我能判断这次替代可不可接受，而不是盲点"应用"。

**Acceptance Criteria:**

**Given** 用户点"用库存替代"、替代建议已就绪（Story 4.2/4.3）
**When** 显示替代预览卡（应用前）
**Then** 显示：将被替代的缺色数、受影响格子总数、每个替代的视觉影响分级（低/中/高，来自 `classifyDeltaE`）（FR-9, UX-DR7）

**Given** 预览声称"受影响 N 格"
**When** 用户随后应用替代（Story 4.3）
**Then** 实际被替代的格子数与预览所示一致（预览是对应用的承诺，须可被验证）

**Given** 用户想判断视觉效果
**When** 查看前后对比
**Then** 提供"替代前 / 替代后"画布对比：桌面端并排缩略图，窄屏退化为 `VBtnToggle` 切换（UX-DR7）
**And** "替代前"基线在应用前可得（AD-9）

**Given** 预览卡底部
**When** 用户决策
**Then** 可"应用全部"（走 Story 4.3）或"放弃"（不改图纸）（FR-9, UX-DR7）

**Given** 视觉影响以分级呈现
**When** 渲染分级
**Then** 分级以文字 + 图标呈现，不只靠颜色（NFR-4）；新增文案补 en/zh（NFR-7）；light/dark 验证（UX-DR10）；预览操作键盘可达（NFR-5）

### Story 4.5: ΔE 阈值真实图纸标定（定稿）

As a 维护此项目的开发者（兼第一验收人）,
I want 用几张真实图纸跑感知替代引擎，把 ΔE 分级阈值从初值标定为定稿值,
So that "视觉影响低/中/高"的分级真实可信，且 SM-C1 反指标（高视觉影响占比）有可测量的判据。

**Acceptance Criteria:**

**Given** 感知替代引擎已可端到端运行（Story 4.2/4.3/4.4）
**When** 用 N 张真实拼豆图纸（含真实库存场景）跑替代并观察 ΔE 分布与主观视觉效果
**Then** 据观察校准 低/中/高 阈值，得出定稿值（PRD Open Q3「动工前必做」标定任务）

**Given** 标定得出定稿阈值
**When** 写回常量
**Then** **仅修改 `thresholds.ts` 的常量字面量**，不改 `classifyDeltaE` 函数签名、不回炉 FR-7/8/9 任何已写代码（party-mode 决议）

**Given** 标定完成
**When** 验收
**Then** 用产品判据而非工程判据：以真实图纸验证后，SM-C1「高视觉影响（ΔE > 高阈值）替代占比」在定稿阈值下可被测量，且不为求"全绿"而无上限放大平均 ΔE（NFR-6, SM-C1）
**And** 标定结论与定稿值有文档记录（可追溯）
