---
title: Rubric-Walker Review — Architecture Spine (库存驱动设计)
target: ARCHITECTURE-SPINE.md
altitude: feature (brownfield)
reviewer: rubric-walker
date: 2026-06-30
verdict: ACCEPT (with minor findings)
---

# Rubric-Walker Review — 库存驱动设计 Architecture Spine

Scope: feature-level brownfield spine for FR-1..FR-11 on top of the existing
pindou-studio (`@pindou/shared` pure-core + `@pindou/frontend` Vue shell). Criticality
scaled to a pure-frontend, single-user, localStorage-only client feature — no
platform-grade concerns invented.

Codebase claims verified against source (not taken on faith):
- `commitConversion` / `applyCellChanges` exist in `packages/frontend/src/stores/design.ts`;
  `applyCellChanges` is the path that maintains `countMap` (lines ~172-198). ✓
- `findClosestColor` / `paletteLabs` exist in `packages/shared/src/color/match.ts`. ✓
- `setPalette` exists and (per project-context) does NOT re-match — confirmed in
  `stores/design.ts:141` + `ParameterPanel.vue`. ✓
- `BeadColor.id: string` (stable, required) vs `code?: string` (optional) confirmed in
  `packages/shared/src/types.ts:23-36` — AD-2's key choice is grounded in real types. ✓
- `BrandId` type (`'generic'|'perler'|'artkal'`) exists — AD-4's per-brand keying is real. ✓

---

## Criterion 1 — Fixes the real divergence points for the level below, misses none

**PASS.** The spine correctly identifies and pins the non-obvious decisions where two
independently-developed stories would otherwise diverge:

- **The single biggest trap is caught (AD-1):** "what does the grid index point to now?"
  A naive story author would model the 库存色板 as a *new Palette with its own index space*,
  silently breaking切板/导出/撤销. AD-1 fixes index = brand-palette index always; the
  inventory palette is a *candidate mask over the brand index space*, never a parallel index.
  This is the load-bearing invariant and it is correctly the first AD.
- **Single derivation source (AD-5):** prevents FR-6 / FR-7 / FR-9 / FR-10 / FR-11 each
  re-deriving from `grid + inventory` and reaching contradictory conclusions (the "cell marked
  yellow but the light is green" class of bug). One `analyzeInventory()` → all derived outputs.
  This is exactly the divergence a multi-story feature produces and it is correctly centralized.
- **Write-back path (AD-6):** re-match (FR-5) and apply-substitution (FR-8) are the two write
  paths; both pinned to `commitConversion`/`applyCellChanges` + single undo entry.
- **Persistence boundary (AD-4):** prevents the "second story does `localStorage.setItem`
  directly and bends the schema" divergence.
- **Mode-off zero-regression (AD-7):** prevents inventory logic leaking into the baseline path.

No obvious divergence point is missed. One borderline gap noted under Criterion 6 (empty-state
contract), tracked as a low finding — it is more story-acceptance than architecture-invariant.

## Criterion 2 — Every AD's Rule is enforceable and actually prevents its stated divergence

**PASS, with one soft-enforcement note.**

| AD | Enforceable? | Notes |
| --- | --- | --- |
| AD-1 | Yes (strong) | "Write-back is always brand index; inventory = mask" is mechanically checkable; type system keeps grid as `number[][]` over brand palette. Backed by invariant ③. |
| AD-2 | Yes (strong) | Types live in `shared/src/types.ts` re-exported via `index.ts`; key = `BeadColor.id`. Compiler + monorepo build order enforce it; project-context already forbids parallel frontend types. |
| AD-3 | Yes (medium) | "Pure logic in shared, no algorithms in Vue" is a convention; enforced indirectly because shared is framework-agnostic and unit-tested. A story *could* still re-implement in a composable — caught by review/test, not the compiler. Acceptable at feature altitude. |
| AD-4 | Yes (strong) | Single `inventoryRepo` boundary + versioned envelope `{schema_version, brandId, entries[]}`, per-brand keying. Enforceable by lint/review ("no `localStorage` outside repo") and by the envelope shape. |
| AD-5 | Yes (strong) | Single reactive getter wrapping one pure function; the reactivity-derived "instant refresh after edit" is a real consequence, not hand-waving. |
| AD-6 | Yes (strong) | The two write paths exist in code; "single undo entry" reuses `useEditor`+`useHistory` (verified present). |
| AD-7 | Yes (strong) | `inventoryMode` default-off gate; "derived/marks/lights only computed when `=== true`" is testable and maps to SM-C2. |
| AD-8 | Yes (strong) | ΔE thresholds + status colors as single `shared` constant (`thresholds.ts`); dual-encoding (color+icon) requirement is testable against UX. |

Every Rule names a concrete divergence and the Rule plausibly blocks it. AD-3 is the only
"convention-grade" rather than "compiler-grade" enforcement, which is appropriate here.

## Criterion 3 — Nothing under Deferred could let two units diverge

**PASS.** Each deferred item is either (a) genuinely out of v1 scope with the seam already
pinned by an adopted AD, or (b) a pre-work task, not an architectural fork:

- 账号/云同步, JSON 导出/导入备份 → seam owned by AD-4 (swap repo backend). No story-level fork.
- 跨品牌替代 → `analyzeInventory` signed for a single brand; the single-brand signature is itself
  the invariant that prevents divergence (a story can't quietly go cross-brand without changing
  the pinned signature). Good.
- 逐格手动替代 → routed to existing brush/eyedropper, explicitly outside this contract.
- 替代色级联校验 (精算到颗) → product decision (party-mode); quantity transparency owned by FR-11.
  Note: AD-5's three-state criterion already encodes the yellow-light boundary ("不做替代色级联校验"),
  so two stories cannot diverge on what yellow means.
- ΔE 阈值定稿值 → structure fixed by AD-8 (single constant); only the *number* is deferred, and
  it's correctly flagged as a pre-work calibration task, not an open architectural question.
- 部署/运维 envelope → correctly deferred for a pure-frontend feature (see Criterion 6).

The critical observation: **the spine defers values and future extensions, but in each case the
*shape/seam* is already pinned by an adopted AD or by the function signature.** That is exactly
how Deferred should behave — no silent divergence latitude.

## Criterion 4 — RATIFIES rather than contradicts the brownfield codebase / project-context

**PASS (strong).** This is the spine's strongest dimension. It is a ratification layer, not a
rewrite, and it does not contradict a single project-context rule:

- Reuses three-invariants verbatim (grid rows×cols / countMap-via-store-only / index range) and
  AD-1/AD-6 are explicitly built on them.
- Honors "改了 shared 必须 rebuild" and "types in shared/types.ts, no parallel frontend types"
  (AD-2).
- Honors "切 palette 不重匹配" — FR-5 Out-of-Scope keeps the existing no-auto-rematch behavior.
- Honors i18n build-gate (en+zh per key; `t()` in non-component context) in Consistency Conventions.
- Honors export gotchas: shortfall list is text/clipboard only, explicitly NOT into PDF (avoids the
  jsPDF CJK trap), and explicitly no purchase links.
- Honors performance rule: "no Web Worker", whole-recompute at board scale (thousands of cells).
- Stack table is correctly marked SEED / "no new dependencies" (localStorage is a browser
  primitive) — matches the "纯前端零安装" product constraint.

All five symbols/types the spine leans on were confirmed to exist in the actual code. The spine
adds an *overlay constraint layer* (AD-7) that collapses to baseline when off — the literal
definition of ratifying brownfield.

## Criterion 5 — Covers FR-1..FR-11 (Capability→Architecture map)

**PASS.** All eleven FRs are present in the map with a "Lives in" home and a "Governed by" AD set:

FR-1 ✓ (AD-2,AD-4) · FR-2 ✓ (AD-4) · FR-3 ✓ (folded into FR-1/3 row, AD-2/AD-4) · FR-4 ✓ (AD-7) ·
FR-5 ✓ (AD-1,AD-3,AD-6) · FR-6 ✓ (AD-5,AD-8) · FR-7 ✓ (AD-1,AD-3,AD-5) · FR-8 ✓ (AD-1,AD-6) ·
FR-9 ✓ (AD-5,AD-8) · FR-10 ✓ (AD-5) · FR-11 ✓ (AD-5 + shortfall-readout convention).

Note: the map row "FR-1/3" combines FR-1 and FR-3 on one line. FR-3 (batch ops: 全选/全不选/批量设默认数量)
is therefore covered only implicitly — it has no dedicated row and no AD speaks to batch-edit UX.
This is acceptable because FR-3 is pure UI ergonomics over the same `inventoryRepo`/types substrate
already governed by AD-2/AD-4 (no new divergence surface), but a reader scanning for "FR-3" finds it
only by inference. Low finding (see below).

The `binds:` frontmatter lists FR-1..FR-11 completely. ✓

## Criterion 6 — Every dimension this altitude owns is decided / deferred / open-question; no silent dimension

**PASS, with one low finding.** Dimensions checked:

- Data contract / typing — decided (AD-2).
- State & reactivity — decided (AD-5, AD-7).
- Derivation/compute placement — decided (AD-3, AD-5).
- Persistence — decided (AD-4); medium (localStorage) chosen, IndexedDB question (PRD Open Q7)
  resolved in favor of localStorage with rationale "数据 KB 级". Good — a PRD open question is
  explicitly closed by the spine rather than left silent.
- Write-back / history — decided (AD-6).
- Color/perceptual thresholds — decided structurally (AD-8), value deferred (calibration).
- i18n / export / performance — decided (Consistency Conventions).
- Operational/environmental envelope — **correctly deferred** with explicit reasoning ("纯前端
  客户端特性，无新基础设施；沿用既有 GitHub Pages / 可选 CDK"). For a feature-altitude pure-frontend
  spine this is the right call, not a silent gap. ✓

**The one dimension that is thin: empty/degenerate-state contract.** The PRD repeatedly specifies
behavior when the 库存色板 is empty (FR-4: 库存为空引导去录入; FR-7: 库存色板为空不产出替代并提示;
FR-10/FR-11 on empty inventory). The spine's `analyzeInventory(grid, brandPalette, inventory)` is the
single derivation source for all of these, but the spine does not state the empty-inventory /
empty-mask contract for that function (e.g. "empty mask → verdict = red/blocked, substitutions = [],
no throw"). Because all stories read this one function, leaving its empty-input behavior unstated is a
place where FR-7's story and FR-10's story could make *different* assumptions about the same call.
This is the closest thing to a real divergence risk in the spine. Severity: medium — it sits on the
single shared seam (AD-5) where divergence is most expensive, even though each individual FR's empty
behavior is in the PRD.

---

## Findings (tiered)

### Critical
*(none)*

### High
*(none)*

### Medium
- **M1 — Empty-input contract for `analyzeInventory` is unstated on the single shared seam (AD-5).**
  The PRD pins empty-库存色板 behavior per-FR (FR-4/FR-7/FR-10/FR-11), but the spine does not nail down
  what the one shared derivation function returns for an empty inventory/mask (verdict value,
  `substitutions = []`, no-throw). Since every story consumes this single getter, two stories could
  diverge on empty-state semantics. Recommend one line in AD-5 or the Consistency table:
  "空库存/空掩码 → `analyzeInventory` 返回 verdict=红(不可拼)、substitutions=[]、perColorStatus 全标缺色，
  不抛错；UI 据此引导录入(FR-4/FR-7)."

### Low
- **L1 — FR-3 has no dedicated Capability-map row.** FR-3 (batch select / set-default-quantity) is
  folded into the "FR-1/3" row with no AD addressing batch-edit ergonomics. It introduces no new
  divergence surface (same repo + types), so this is presentational, but a reader scanning for FR-3
  finds it only by inference. Consider splitting the row or noting "FR-3 = UI ergonomics over AD-2/AD-4
  substrate, no new invariant."
- **L2 — AD-3 enforcement is convention-grade, not compiler-grade.** "No business algorithms in the Vue
  layer" is enforced by review/tests, not the type system; a story could re-implement an analysis in a
  composable and still compile. Acceptable at feature altitude, but worth an explicit "caught by review +
  the shared unit tests are the source of truth" note so it isn't mistaken for a hard guarantee.
- **L3 — "库存色板/InventoryMask" terminology drift.** Glossary defines 库存色板 (Inventory Palette) as the
  derived constraint sub-palette; the spine introduces `InventoryMask` and in the Consistency table maps
  `InventoryMask` ↔ 库存色板. These are conceptually the same thing (mask = the indices of that
  sub-palette), and AD-1 deliberately makes the mask the implementation (not a separate Palette) — which
  is correct — but the naming pairs one PRD glossary term with a new spine type. Minor; just confirm
  downstream stories treat 库存色板 and `InventoryMask` as the same concept and don't materialize a second
  Palette object (AD-1 already forbids this, so risk is low).

---

## Verdict

**ACCEPT (with minor findings).** This is a disciplined feature-altitude brownfield spine. It pins
exactly the non-obvious, divergence-prone decisions (index semantics, single derivation source,
write-back path, persistence boundary, mode-off zero-regression), ratifies every relevant
project-context rule without contradiction (verified against real code), covers all of FR-1..FR-11,
and defers only values/future-extensions whose seams are already nailed by an adopted AD. It does not
over-reach into platform concerns it doesn't own. Address M1 before stories are written (it sits on the
one shared seam where divergence costs the most); L1-L3 are polish.
