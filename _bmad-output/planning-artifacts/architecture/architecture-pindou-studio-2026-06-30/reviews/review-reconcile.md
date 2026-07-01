---
title: Input-Reconciliation Review — Architecture Spine vs PRD / UX / project-context
type: reconciliation-review
reviewer: input-reconciliation reviewer
target: ARCHITECTURE-SPINE.md (库存驱动设计 / inventory-driven-design)
created: 2026-06-30
verdict: spine is sound on the load-bearing invariants; a small set of UX-surface requirements and one deployment rule were silently dropped.
---

# 输入对账复核 — 架构脊柱 vs 三份输入

**方法**：逐条把每份输入的需求/约束/决议，与 `ARCHITECTURE-SPINE.md` 的 AD-1~AD-8、Consistency Conventions、Capability Map、Deferred 段比对。判定每条为：
- `✅ LANDED` — 脊柱已正确钉死或映射。
- `⏬ CORRECTLY DEFERRED` — 合法下推（明确进了 Deferred 段或确属 story 实现细节，脊柱无需钉）。
- `⚠️ SILENTLY DROPPED` — 该进脊柱却没进，且没有被显式下推（下游 story 可能各自跑偏）。
- `❌ CONTRADICTED` — 脊柱与输入相互矛盾。

总评：脊柱在三不变量、写回路径、单一派生源、库存数据契约、party-mode 两条决议（FR-10 不级联校验、FR-11 带人话）这些**会让下游跑偏的非显然决策**上钉得准且完整。漏的几条集中在 **UX 表层契约**（新增顶级路由、窄屏退化、空库存禁用 vs 报错的交互语义、loading 形态）和**一条部署铁律**（新路由要同步 sitemap）。无硬矛盾。

---

## 1. PRD 对账

### 1.1 Functional Requirements (FR-1~FR-11)

| 条目 | 判定 | 说明 |
|---|---|---|
| FR-1 按色卡勾选+数量录入 | ✅ LANDED | Capability Map → components 库存面板 → store → inventoryRepo；AD-2 钉键。数量校验（非整数/负数拒绝或归一化）属 story 级，脊柱不必钉。 |
| FR-2 本地持久化 | ✅ LANDED | AD-4 单一仓储边界 + 版本信封 + 按 brandId 分键，完整覆盖「多品牌各自独立、互不覆盖」。 |
| FR-3 批量操作（全选/统一默认数量） | ⏬ CORRECTLY DEFERRED | 纯 UI 交互，无跨 story 不变量风险，脊柱不必钉。 |
| FR-4 库存模式开关 | ✅ LANDED | AD-7 钉「默认关、关闭零回归」。 |
| FR-5 重匹配 | ✅ LANDED | AD-1 + AD-3 + AD-6。注意见下方「FR-5 Out of Scope」遗漏。 |
| FR-6 缺色/不足标记 | ✅ LANDED | AD-5 单一派生源 + AD-8 双编码。 |
| FR-7 感知替代建议 | ✅ LANDED（主体） | AD-1/3/5。**但空库存色板 edge case 漏**，见 1.3。 |
| FR-8 应用替代 | ✅ LANDED | AD-1 + AD-6 单条历史。 |
| FR-9 替代影响预览 | 部分 ✅ | AD-8 钉 ΔE 阈值单一常量；但「替代前/后画布对比」是否为脊柱关心的不变量，脊柱未提（属 UX 表层，见 2.x，判定为可下推）。 |
| FR-10 三态可拼性判定 | ✅ LANDED | AD-5 + 三态判据约定，**明确写「不做替代色级联校验」**。party-mode 决议钉到位。 |
| FR-11 缺口清单（带人话） | ✅ LANDED | Consistency Conventions「数量数字旁必带人话」+ Deferred 重申。party-mode 决议钉到位。 |

### 1.2 PRD party-mode 决议（重点核查）

- **FR-10 不做级联校验** — ✅ LANDED。脊柱三态判据约定明写「红=有色连替代都进不了掩码（AD-5；**不做替代色级联校验**）」，Deferred 段亦列「替代色库存级联校验（精算到颗）：产品定位明确不做（party-mode 决议）」。**钉得准。**
- **FR-11 必须带人类可读解读** — ✅ LANDED。Consistency Conventions 行「数量数字旁必带人话……（FR-11 party-mode 决议）」。**钉得准。**
- **黄灯承诺边界（"没有缺色了"≠"数量精算到颗够"）** — ✅ LANDED。三态判据约定写「黄……**不承诺数量精算到颗**」。

### 1.3 PRD edge cases（重点核查）

- **UJ-1 edge：某色缺口太大，替代后仍差约 X 颗** — ⚠️ **PARTIALLY DROPPED（中）**。
  脊柱 AD-5 的派生源签名含 `shortfall`，FR-11 约定缺口解读句含「还差约 N 颗」，所以**数据层覆盖到了**。但 PRD/UX 的关键语义是：这种「替代后仍不足」的色，三态灯应呈现为**黄灯 + 一行红字**（EXPERIENCE KF-1 resolution、State Patterns「数量不足」行），而脊柱三态判据把「红」定义为「有色连替代都进不了掩码」——即「掩码里根本没有任何可替代色」。**「替代后数量仍不足」这一中间态（掩码里有替代色，但替代后用量超出拥有量）在脊柱的三态判据里没有明确归属**：按脊柱字面，它既不是红（替代色进得了掩码），也不完全是绿，落在黄里——但脊柱没说黄灯要附「替代后仍差 X 颗」的红字提示。这是 UX 明确要求的呈现，脊柱未将其作为派生输出的语义点钉住。下游可能把这种色误判为「干净的黄灯」而不显缺口。**建议**：在 AD-5 派生输出或三态约定里显式说明 shortfall 要区分「替代后仍不足」并驱动黄灯附注。

- **FR-7 空库存色板 → 不产替代 + 提示去录入** — ⚠️ **SILENTLY DROPPED（中）**。
  PRD FR-7 第三条 testable：「库存色板为空（无任何可用色）时，不产出替代，并提示用户去录入库存」。EXPERIENCE State Patterns 亦有「库存色板为空但开了模式 → 不产出替代，提示去录入」。脊柱完全没提这个空集分支——`analyzeInventory` 的契约未说明掩码为空时的返回语义（是抛错？返回空 substitutions + 一个「需录入」信号？）。这是个**会让两个 story 各自瞎猜的边界**（替代 story 与三态灯 story 都要消费这个空集结论）。**建议**：在 AD-5 把「掩码为空」作为派生源的一个明确出口状态钉住。
  注：FR-4 的「开库存模式要求非空库存，空则引导录入」与此不同——那是开关前置校验（EXPERIENCE 已明确「禁用并提示，不是开了再报错」），脊柱亦未钉，见 2.2。

- **FR-5 Out of Scope：切品牌色板不自动重匹配** — ⚠️ **SILENTLY DROPPED（低-中）**。
  PRD FR-5 Out of Scope 明写「切换品牌色板时不自动重匹配，沿用现有『切 palette 不重匹配』的既定行为」；project-context 亦把「切 palette 不重匹配」列为必须知道的既有行为；EXPERIENCE Interaction Primitives「触发显式、不偷改……呼应 project-context『切 palette 不重匹配』」。脊柱 AD-6/AD-7 钉了「写回必经合法路径」「显式动作」，但**没有显式重申「切品牌色板不触发库存重匹配」这条反向约束**。这是个典型「不写就可能被好心 story 破坏」的既有不变量（某 story 可能"贴心地"在切板时自动重匹配）。**建议**：补一条不变量或在 AD-7 备注。

### 1.4 §4.5 Cross-Cutting Constraints（重点核查）

- **i18n 构建门禁（每 key 同补 en/zh，非组件用 t()）** — ✅ LANDED。Consistency Conventions「i18n」行 + Structural Seed plugins/i18n.ts。
- **导出形态（缺口清单仅纯文本/剪贴板，不入 PDF；未来进 PDF 须 addLabel CJK）** — ✅ LANDED（v1 部分）。Consistency Conventions「导出」行「缺口清单仅纯文本/剪贴板，不入 PDF、不含采购链接」。**注**：脊柱没重述「若未来进 PDF 须经 addLabel 渲染 CJK」的条件分支——但这是「未来」分支，且 project-context 已是全局铁律，判定为 ⏬ 可接受省略（脊柱标注了 Stack「不引新依赖」，PDF 路径不在本 feature）。
- **性能（沿用 paletteLabs + findClosestColor，无 Web Worker）** — ✅ LANDED。AD-5「遵性能约定**不引 Worker**」+ Stack「不引入任何新依赖」。
- **状态变更合法路径（重匹配/应用替代经 commitConversion/applyCellChanges）** — ✅ LANDED。AD-6 + Consistency Conventions「写回路径」行。

### 1.5 Non-Goals / Deferred 对账

| PRD Non-Goal / OOS | 判定 |
|---|---|
| 不做补货/采购电商闭环（无购买链接） | ✅ Consistency「导出……不含采购链接」+ FR-11 约定。 |
| 不做账号/云同步（v1） | ✅ Deferred「账号体系/云端库存同步」。 |
| 不做实拍识别库存 | ✅ Deferred「拍照/订单截图辅助录入」。 |
| 不做社区/交易/分享 | ⏬ 战略层，脊柱无需钉（无对应不变量）。 |
| 不改基线转珠默认行为 | ✅ AD-7 零回归。 |
| 不做多用户/协作 | ⏬ 同社区层。 |
| 逐色手动指定替代（FR-8 OOS） | ✅ Deferred「逐格/逐色手动指定替代色」。 |
| 跨品牌替代（v1 不跨） | ✅ Deferred「跨品牌色板替代……analyzeInventory 按单品牌签名设计」。 |
| ΔE 阈值标定（动工前必做） | ✅ Deferred「ΔE 阈值定稿值……动工前必做任务」+ AD-8 结构钉死。 |
| Open Q7 存储介质 localStorage vs IndexedDB | ⚠️ 见下。 |

- **Open Q7：localStorage vs IndexedDB（介质决策留给架构）** — ⚠️ **轻微未决（低）**。PRD Open Q7 明确「属架构决策……留给架构文档」，而脊柱 Stack 与 AD-4 直接钉定 localStorage（「介质=localStorage（数据 KB 级）」「换云同步/备份只换该模块后端」）。这其实是架构**做了决策并给了理由（数据 KB 级）**，属合理收口，不算漏——但脊柱没有点名回应 Open Q7，也没提 EXPERIENCE 里反复出现的「localStorage/IndexedDB（介质属架构决策）」这一悬念。判定为 ✅ 实质已决，建议补一句「Open Q7 已决：localStorage」以闭环。

---

## 2. UX 规格对账（DESIGN.md + EXPERIENCE.md）

### 2.1 无障碍（重点核查）

- **色盲双编码（颜色 + 图标/纹理）** — ✅ LANDED。AD-8 末句「标记须**双编码**（颜色 + 图标/纹理），色盲可辨（见 UX 规格）」。**钉到位。**
- **三态灯不只靠红黄绿（各配独立 mdi 图标 + 文字）** — ✅ 基本 LANDED。AD-8「三态灯/标记的语义色复用既有 Vuetify 主题槽位……标记须双编码」；Structural Seed「三态灯(VChip)」。具体图标（check-circle/swap-horizontal/alert-circle）属 story 细节，可下推。
- **缺色标记刻意用暖橙 accent 而非红（与"不足"红区分）** — ⚠️ **SILENTLY DROPPED（低）**。DESIGN.md 与 EXPERIENCE 都强调一个**语义决策**：缺色格标记用 `accent` 暖橙、**不用 error 红**，以与「数量不足」的红区分（避免两种问题态同色不可辨）。脊柱 AD-8 只笼统说「复用 success/warning/error/accent，不引新色相」，**没有钉死「缺色=accent、不足=error」这一具体语义映射**。这正是「两个 story 可能对同一槽位做不兼容假设」的非显然决策（某 story 可能把缺色也标红）。**建议**：把 DESIGN.md 的语义映射表（buildable=success/substitutable=warning/insufficient=error/missing-mark=accent）作为单一来源钉进 AD-8 或 Conventions。
- **dark 主题（不能只在 light 下验证就交付）** — ⚠️ **SILENTLY DROPPED（低-中）**。DESIGN.md Do/Don't 明列「dark 主题下沿用既有提亮值」「❌ 只在 light 下验证就交付」；EXPERIENCE Accessibility「新增暖橙标记须在 light/dark 下都达 WCAG AA」。脊柱**完全没提 dark 主题 / 双主题验证**。虽然「复用既有主题槽位」隐含了 light/dark 都有定义，但「暖橙标记叠加在彩色画布上、dark 下也要达 AA」是个**真实的、易被遗漏的交付门槛**，脊柱未作为约束钉住。**建议**：在 AD-8 补「标记在 light/dark 双主题下均须达 WCAG AA（叠加于彩色画布，靠描边+纹理保证，不只靠色差）」。
- **键盘可达 / 对比度 WCAG AA** — ⏬ CORRECTLY DEFERRED。沿用 Vuetify 默认焦点管理，属通用无障碍底线，脊柱不必逐条钉（但上条 dark+AA 因涉及新增暖橙标记的特殊性，建议钉）。

### 2.2 "外壳克制"哲学与交互语义（重点核查）

- **"界面外壳保持克制，让作品成为主角"** — ⚠️ **SILENTLY DROPPED（中，正是题目点名的"quiet requirement"）**。DESIGN.md Brand & Style 与 EXPERIENCE 都把这条立为**库存功能的最高约束**：「库存功能必须服从这一哲学，不喧宾夺主」「库存面板退到画布之后，安静」「新增视觉信号安静但清晰——用得着时一眼可辨，用不着时退到背景」。脊柱**完全没有承载这条 tone/哲学约束**。它确实偏「视觉/产品」而非「结构」，但它驱动了若干**结构性后果**已在脊柱体现却未点名其出处：AD-8「不引入新色相」、Deferred 不做电商导流。然而「不喧宾夺主」还有未落地的结构含义——例如缺色标记密集时应**聚合提示而非逐格全标**（EXPERIENCE Open Q1 已定），「数量不足不在画布逐格标、只走清单」（EXPERIENCE Component Patterns + Open Q4 已定设计）。这两条**是已定设计决策，会影响 FR-6 标记 story 怎么实现**，脊柱却没钉。**建议**：至少把「不足色不在画布逐格标，走材料清单红字」这条已定设计作为 FR-6 的约束钉入（防止某 story 在画布逐格标不足色，破坏"克制"且过吵）。

- **新增独立 Inventory 顶级视图（新路由）** — ⚠️ **SILENTLY DROPPED（高）**。EXPERIENCE Foundation/IA 明确：「新增范围：一个**独立 Inventory（库存）顶级视图** + Studio 内一个库存面板」，从顶栏可达。这是个**新增的顶级路由**。脊柱 Structural Seed 只列了 `components/`（库存面板等），**没有提到新增路由、新增顶级 view、也没提 vue-router**。结合 project-context 部署铁律（见 3.3），新路由必须同步 vite.config.ts 的 sitemap url 列表——脊柱对此整条链路（新 view + 路由 + sitemap）只字未提。这是个**结构性遗漏**：下游做录入 story 时若不知道有独立 Inventory 页，可能把录入塞进 Studio 面板内（与 IA 决策冲突）。**建议**：在 Structural Seed 补 `views/InventoryView.vue` + 路由注册，并在 Conventions/部署处补「新增路由须同步 sitemap」。

- **库存为空 → 开关禁用并提示（不是开了再报错）** — ⚠️ **SILENTLY DROPPED（低-中）**。FR-4 testable「库存为空时引导去录入」，EXPERIENCE State Patterns/Component Patterns 进一步把它定为**具体交互语义**：「库存为空时**禁用并提示**去录入（不是开了再报错）」。脊柱 AD-7 只说「inventoryMode 默认关闭」，未承载「空库存时开关禁用」这一前置校验语义。属交互细节但有明确决议，建议在 AD-7 或 Capability Map FR-4 行点一句。

### 2.3 响应式 / 窄屏

- **替代预览前后对比：桌面并排、窄屏退化为切换式（VBtnToggle）** — ⏬ CORRECTLY DEFERRED。EXPERIENCE Open Q2 已定「并排，窄屏退化切换」。属呈现层细节，脊柱无需钉，但注意脊柱 Structural Seed 提到「替代预览」组件时未提响应式——可接受。

### 2.4 Voice & Tone

- **"引擎算得出的事别让用户肉眼算；说人话不甩账本"** — ✅ LANDED。Consistency Conventions「数量数字旁必带人话」直接承载，且标注 party-mode 决议出处。ΔE 等技术值作次要信息（hover/详情）属 story 细节，可下推。

---

## 3. project-context 对账（feature 触及的规则）

### 3.1 三不变量（重点核查）

- **① grid 行列 = boardSize rows×cols** — ✅ 间接 LANDED。AD-6「守三不变量」+ AD-1 不改索引语义。行列不变量主要靠 commitConversion/applyCellChanges 守住，AD-6 已钉「必经合法路径」。
- **② countMap = grid 真实用量（只经 applyCellChanges/commitConversion 改）** — ✅ LANDED。AD-6 显式钉「不绕过……使 countMap……静默破裂」。AD-5 派生 getter 依赖 countMap。
- **③ 颜色索引 ∈ [-1, palette.colors.length)** — ✅ LANDED。AD-1 Binds 显式列「三不变量③」，并钉「写回 grid 的恒为品牌色板索引」「库存色板不另起索引空间，只是掩码」。**这是脊柱最核心、最准的钉法**——直接消解了「库存色板会不会另立索引空间」这个最危险的歧义。

### 3.2 构建顺序与模块系统（重点核查）

- **改 shared 必 rebuild（否则 frontend 静默用陈旧 dist）** — ⚠️ **SILENTLY DROPPED（低）**。本 feature 大量新逻辑落在 `shared/inventory/`（AD-3/AD-5），frontend 经 `workspace:*` 消费 dist。project-context 明确警告不 rebuild 会「静默用陈旧类型与实现、测试假绿」。脊柱 Structural Seed 把新代码放进 shared 却**没提醒 rebuild 链路**。属构建纪律、非架构不变量，可下推到 story/CLAUDE.md，但鉴于本 feature 重度依赖 shared，提一句更稳。判定：⏬ 可接受下推，建议轻提。
- **shared 内部 import 必带 .js 后缀** — ⏬ CORRECTLY DEFERRED。脊柱 Stack 标「shared 纯 ESM, ES2020」，后缀纪律属编码规则，project-context 已全局钉，story 实现时遵守即可。
- **infra 是 CommonJS、隔离** — ⏬ 不相关（本 feature 纯前端，Deferred 段「部署/运维 envelope……不触及」已隔离）。

### 3.3 i18n 门禁 — ✅ LANDED（见 1.4）。

### 3.4 导出 CJK — ✅ LANDED（见 1.4，缺口清单不入 PDF；未来 PDF 须 addLabel 为可接受省略的未来分支）。

### 3.5 部署铁律（重点核查）

- **新增路由要同步更新 vite.config.ts 里 sitemap 的 url 列表** — ⚠️ **SILENTLY DROPPED（高，与 2.2 的新路由遗漏同根）**。project-context 部署段明确：「新增路由要同步 vite.config.ts 里 sitemap 的 url 列表」「robots.txt/sitemap.xml 构建时自动生成，别手写」。EXPERIENCE 明确新增了 Inventory 顶级视图（=新路由）。脊柱**两头都没接上**：既没在 Structural Seed 列新路由，也没在 Deferred/Conventions 提 sitemap 同步。后果：录入 story 加了 /inventory 路由却忘更新 sitemap，SEO 静默缺页（不报错）。**建议**：补「新增 Inventory 路由 → 同步 vite.config.ts SITE_URL sitemap 列表」。
- **GitHub Pages / CDK 双路径** — ✅ LANDED（按"不触及"正确处理）。Deferred「部署/运维 envelope……沿用既有 GitHub Pages / 可选 CDK 路径，本 feature 不触及」。

### 3.6 测试 / 代码风格

- **test 就近同目录、Vitest/Playwright chromium** — ⏬ CORRECTLY DEFERRED。脊柱 Stack 列了 Vitest/Playwright，测试落点属 story 细节。AD-1~AD-3 强调纯函数「可单测/零 Vue 依赖」已隐含可测性导向。
- **注释/JSDoc 用中文、Prettier/ESLint** — ⏬ CORRECTLY DEFERRED。编码风格，全局规则。

---

## 4. 汇总：按严重度分级

### CRITICAL
（无）脊柱没有破坏任何不变量，也无硬矛盾。

### HIGH（结构性遗漏，下游会跑偏）
1. **新增 Inventory 顶级视图/路由未进脊柱** — EXPERIENCE 明确新增独立顶级 view；Structural Seed 只列 components，未列新 view + vue-router 路由注册。下游录入 story 可能违背 IA 决策（把录入塞进 Studio 面板）。
2. **新路由 → sitemap 同步铁律未接上** — project-context 部署铁律「新增路由要同步 vite.config.ts sitemap」，与 #1 同根；漏则 SEO 静默缺页。

### MEDIUM
3. **FR-7 空库存色板边界未钉** — PRD + UX 都要求「掩码为空 → 不产替代 + 提示去录入」，`analyzeInventory` 契约未定义空集出口，两个 story 会各自瞎猜。
4. **UJ-1 edge「替代后仍不足」的三态归属与黄灯红字附注未钉** — 数据层（shortfall）有，但「替代后仍不足 → 黄灯 + 红字提示」的呈现语义未作为派生输出语义点钉住，可能被误判为干净黄灯。
5. **"外壳克制"哲学 + 已定设计「不足色不在画布逐格标，走清单」未钉** — quiet tone 约束完全缺席；其已定的结构后果（不足色走清单/缺色密集聚合提示）影响 FR-6 实现，未约束。

### LOW
6. **缺色=accent暖橙 / 不足=error红 的语义映射未钉**（AD-8 只笼统说"复用四槽位"，未钉死映射，story 可能把缺色也标红）。
7. **dark 主题双主题验证 + 暖橙标记 light/dark 双达 WCAG AA 未钉**（DESIGN/EXPERIENCE 反复强调，脊柱无 dark 字样）。
8. **FR-5 OOS「切品牌色板不自动重匹配」反向约束未重申**（既有行为，易被"贴心"story 破坏）。
9. **FR-4「空库存时开关禁用而非开后报错」交互语义未钉**。
10. **改 shared 必 rebuild 的构建纪律未轻提**（本 feature 重度依赖 shared/inventory）。
11. **Open Q7 介质决策未点名闭环**（脊柱实质已定 localStorage 并给理由，仅未点名回应 Open Q7）。

---

## 5. 正确下推清单（确认无遗漏，非问题）
- FR-3 批量操作、数量输入校验细节、三态灯具体图标、ΔE 作次要信息呈现、替代前后对比窄屏退化、shared .js 后缀纪律、test 落点、Prettier/ESLint/中文注释、GitHub Pages/CDK 部署、跨品牌替代、逐色手动替代、云同步/JSON 备份、拍照录入、ΔE 阈值定稿值——均已显式进 Deferred 或属合法 story/全局规则下推。
