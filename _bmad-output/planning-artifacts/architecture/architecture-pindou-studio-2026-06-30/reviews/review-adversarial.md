---
title: Adversarial Review — Architecture Spine 库存驱动设计
type: architecture-review
mode: adversarial
target: ARCHITECTURE-SPINE.md (architecture-pindou-studio-2026-06-30)
reviewer: adversary
date: 2026-06-30
verdict: NOT-YET-SOUND — 7 genuine incompatible-build pairs found (3 high, 3 medium, 1 low)
---

# Adversarial Review — 库存驱动设计 Spine

## Method

I assumed the role of two independent story-implementers working one level below the spine.
Each obeys **every** AD and every Consistency Convention to the letter. Where I can construct
two such stories whose artifacts cannot link/compose at build or runtime, the spine has a hole.
Each finding below is a concrete `(Story A vs Story B)` pair, both spine-legal, that build
incompatibly — not a style nit. Findings are grounded in the actual repo types:

- `BeadGrid = number[][]`, empty cell = `-1` (`shared/src/types.ts`)
- `countMap: Record<number, number>` keyed by **color index** (not id), maintained incrementally
  by `applyCellChanges` and wholesale by `commitConversion` (`frontend/src/stores/design.ts`)
- `BeadColor { id, name, code?, hex, rgb, brand? }`; `Palette { id, name, brand, colors[] }`
- `findClosestColor(rgb, palette, labs?) → { index, deltaE }`
- Multi-board: a `quad-58` board is a **single contiguous 58×58 grid**; `boardCols/boardRows`
  exist only for drawing divider lines at export. Grid index space spans all boards.
- History: `HistoryEntry<CellChange> { redo[], undo[] }`, one stroke = one entry.

---

## FINDINGS

### F-1 [HIGH] — AD-5 output shape underspecified: `perColorStatus` / `shortfall` keyspace and `substitutions` direction are ambiguous

**The seam.** AD-5 fixes a *single* function
`analyzeInventory(grid, brandPalette, inventory) → { mask, perColorStatus, verdict, shortfall, substitutions }`
and decrees all stories read "this唯一出口". But it specifies only the *names* of the five
outputs, never their *types*. Two stories both reading the one getter can still read it
incompatibly.

**The incompatible pair.**

- **Story FR-6 (缺色/不足标记)** is the *producer* of `analyzeInventory` (per the map, FR-6 and FR-10
  "live in" `shared/inventory/analyze`). The dev keys `perColorStatus` and `shortfall` by
  **`BeadColor.id`** — natural, because AD-2 says "库存条目以 `BeadColor.id` 为键", and the panel/
  list needs stable color identity across palette切板.
  ```ts
  perColorStatus: Record<string /* BeadColor.id */, 'ok'|'insufficient'|'missing'>
  shortfall: { colorId: string; type: 'missing'|'insufficient'; deficit: number }[]
  ```
- **Story FR-6-canvas (画布叠加标记)** is the *consumer* that paints the canvas. The canvas walks
  `grid` cells, and every cell is a **palette index** (`number`). To decide "is this cell's color
  missing/insufficient", the simplest spine-legal read is `perColorStatus[cellIndex]`. So this dev
  *expects* `perColorStatus` keyed by **index**:
  ```ts
  const status = perColorStatus[grid[r][c]]; // expects Record<number, Status>
  ```

Both obey AD-1 (grid index = brand index), AD-2 (id is the entry key), AD-5 (single source).
But `Record<string id, …>` and `Record<number index, …>` are different shapes. The canvas
overlay silently reads `undefined` for every cell (id keys never match numeric indices) → no
markers ever render, no type error, no crash. This is exactly the "UI 不报错但结果错" class the
spine claims to prevent.

**Same hole on `substitutions`.** AD-5 doesn't fix its direction. FR-7 (suggest) wants
`substitutions[missingColorId] → { toColorId, deltaE }`. FR-8 (apply, writes back to grid via
index) wants `{ fromIndex, toIndex, deltaE, affectedCells }`. FR-9 (preview) wants a per-cell or
per-color影响列表 with the ΔE bucket. Three legal readings, one undefined contract.

**Why it's a real build break, not a nit.** The spine's entire value proposition for AD-5 is "all
stories read one출口 and can't disagree". An untyped 5-field bag *guarantees* they will. The
producer and consumer compile independently and link to garbage.

**Close it with (new/tightened AD).** Tighten AD-5 to pin the exact `InventoryAnalysis` interface
in `shared/src/types.ts`, including the **keyspace of every map** and the **direction of
substitutions**. Mandated decisions:
- `perColorStatus` keyed by **palette index** (`number`) — because every downstream consumer that
  touches `grid`/`countMap` already lives in index space (AD-1), and a parallel id-keyed map would
  re-introduce the dual-keyspace this very AD exists to kill. Provide a derived id→status map only
  if the panel needs it, explicitly.
- `shortfall[]` and `substitutions[]` carry **both** `colorId` (for display/jump-to per AD-2) **and**
  `index` (for write-back per AD-1/AD-6), so neither consumer has to re-derive the other and risk
  mismatch.
- `substitutions` is **from缺色 → 库存色**, typed `{ fromIndex, fromColorId, toIndex, toColorId, deltaE }`.

---

### F-2 [HIGH] — Two owners of "owned qty > 0" / mask membership: `analyzeInventory` vs `inventoryRepo`/store

**The seam.** AD-1 says `InventoryMask` = "拥有数量 > 0 的品牌索引集合". AD-5 says
`analyzeInventory` *computes* `mask` as one of its outputs. AD-4 says all inventory I/O goes through
`inventoryRepo`. Nothing says **who owns the qty→membership predicate** and **who maps
`InventoryEntry`(id-keyed) into mask(index-keyed)**.

**The incompatible pair.**

- **Story FR-1/3 (录入+持久化)** owns `inventoryRepo`. To make the panel reactive and to validate
  入库, this dev computes membership at the repo/store boundary: an entry with `qty === 0` is a
  "曾登记但已用完" record (PRD §3 distinguishes it from未登记). The dev decides `qty === 0` entries
  **stay in `Inventory.entries` but are excluded from mask**, and exposes a store getter
  `ownedColorIds` doing `entries.filter(e => e.qty > 0)`. Spine-legal: AD-2/AD-4 obeyed.
- **Story FR-5/7 (重匹配/替代)** owns `analyzeInventory`. Per AD-5 it *recomputes* `mask` itself from
  `(brandPalette, inventory)`. This dev, reading FR-7's "库存色板为空时不产出替代", treats
  `qty === 0` as **still present-but-insufficient** (it's a registered color, just empty), and to be
  "safe" includes id-registered colors in the candidate set then filters by qty at substitution
  time. Also spine-legal.

Now membership of "owned qty > 0" is computed in **two places with two predicates** (`> 0` vs
`registered`). A color at exactly `qty 0`: Story A excludes it from the mask (so FR-6 marks it
缺色), Story B's `analyzeInventory` may keep it in the candidate pool (so FR-10 verdict treats it as
available substitution target). Result: canvas says 缺色 + red, the三态灯 says 替代后可拼 (green/yellow)
— precisely the "某色标黄但灯却绿" inconsistency AD-5 was written to prevent — yet **both stories obey
AD-5**, because AD-5 only forbids *re-deriving the verdict bundle* outside the getter; it does not
forbid two different *mask predicates*.

**Why real.** The id→index projection (`InventoryEntry.colorId` → `palette.colors` index) and the
`qty > 0` predicate are the join between AD-2's keyspace and AD-1's keyspace. The spine never says
this join lives in exactly one function. Two implementations of the join = two masks = inconsistent
derived state across the whole feature.

**Close it.** Tighten AD-1 (or add AD-9): the **mask predicate and the id→index projection are
defined exactly once, inside `analyzeInventory` (shared)**. The repo/store may NOT compute a parallel
`ownedColorIds`/membership getter; any UI that needs "owned" reads `analysis.mask`. State the
`qty === 0` rule once and authoritatively: `qty === 0` ⇒ **not in mask** (treated as缺色-equivalent
for matching) but **retained as an entry** (preserves the "曾登记" distinction for the panel). Pin
where `colorId → index` resolution happens and what it does when an entry's `colorId` is absent from
the current palette (see F-3).

---

### F-3 [HIGH] — AD-4 envelope: `schema_version` semantics, key collision, and stale-`colorId` handling unspecified

**The seam.** AD-4 fixes the envelope `{ schema_version, brandId, entries[] }`, "按 brandId 分键".
It does NOT fix: (a) the concrete localStorage **key string**, (b) what `schema_version` *means* and
who bumps it, (c) what `brandId` is (it conflates with `Palette.id`), (d) what happens to an entry
whose `colorId` no longer exists in the palette.

**Incompatible pair (a) — key collision via brandId vs paletteId.** The repo only has `Palette { id,
name, brand: BrandId }` where `BrandId = 'generic' | 'perler' | 'artkal'`. There is **no
`BrandPalette` type** and no `brandId` field — the spine's glossary term `BrandPalette` maps to the
existing `Palette`, and "brandId" is ambiguous between `Palette.id` and `Palette.brand`.

- **Story FR-2 (持久化)** keys by `Palette.id` → `pindou:inventory:perler-default`. Multiple palettes
  per brand get distinct keys.
- **Story FR-1 (录入)** reads AD-4's literal word "brandId" + "按品牌色板分键" and keys by
  `Palette.brand` → `pindou:inventory:perler`. All Perler palettes **collide into one key**.

Two palettes of the same brand: Story A keeps two inventories, Story B's write under the brand key
silently overwrites — "互不覆盖" (AD-4's own promise) is violated, and the two stories can't even read
each other's persisted data. Both obey AD-4 as written.

**Incompatible pair (b) — `schema_version` semantics.** AD-4 says "版本化信封" but not the type or the
bump rule.

- **Story FR-2** writes `schema_version: 1` (integer, manual bump on migration).
- **Story FR-1** writes `schema_version: '2026-06-30'` (date string, "version = the day's shape").

A later migration reader can't branch deterministically; `if (v < 2)` throws on a string, `if (v ===
'2026-06-30')` never matches an integer. Both "version" the envelope.

**Incompatible pair (c) — stale colorId.** A persisted entry's `colorId` may not exist in the current
palette (palette edited/renamed between sessions). AD-2/AD-4 say nothing about resolution.

- **Story FR-1** drops unknown `colorId`s on load (clean).
- **Story FR-5** (`analyzeInventory`) treats an unresolvable `colorId` as index `-1` and unions it
  into the mask. `mask` now contains `-1`, which collides with the **empty-cell sentinel** in `grid`
  — every empty cell suddenly reads as "in mask / owned". Catastrophic and silent.

**Close it.** Tighten AD-4: pin (1) the exact key template `pindou:inventory:v{N}:{paletteId}` using
**`Palette.id`** (rename the spine term from `brandId` to `paletteId`, kill the `BrandPalette`/`brand`
ambiguity, or explicitly state inventory is per-`Palette.id` not per-`BrandId`); (2) `schema_version:
number` with a stated bump-on-shape-change rule; (3) load-time contract: entries with `colorId` not in
the active palette are **dropped before** `analyzeInventory` is ever called, so `-1` can never enter
the mask. State the `-1`-must-never-be-in-mask invariant explicitly (it is the AD-1/grid-sentinel
collision guard).

---

### F-4 [MEDIUM] — AD-6 "single undo entry": re-match + apply-substitution boundary is two-readable

**The seam.** AD-6 says重匹配(FR-5) and 应用替代(FR-8) each write back via
`commitConversion`/`applyCellChanges` and are recorded as **单条** undo history. But FR-7→FR-8 is a
*compound* operation in UJ-1: "用库存色板重匹配" then "用库存替代缺色" can be one user gesture or two.
And `commitConversion` (used for re-match, since it replaces the whole grid) does **not** itself touch
history — in the repo, history is recorded by `useEditor` wrapping `applyCellChanges`. `commitConversion`
resets `originalGrid` and rebuilds `countMap` wholesale with **no inverse captured**.

**Incompatible pair.**

- **Story FR-5 (重匹配)** implements re-match as `commitConversion(newResult)` — the natural fit, since
  re-match rebuilds the entire grid against the mask. But `commitConversion` clobbers `originalGrid`
  and records **no** history entry (matches existing convert-flow behavior). The dev considers AD-6
  satisfied because "重匹配可撤销" is read as "re-running convert is itself reversible by re-converting".
- **Story FR-8 (应用替代)** implements apply-substitution as `applyCellChanges(cellChanges)` through
  `useEditor`, producing **one** `HistoryEntry`. Correct per AD-6.

Now undo behaves incompatibly across the two write paths the spine treats as one rule: FR-8's
substitution is one Ctrl-Z; FR-5's re-match is **not in the history stack at all** and silently
**destroys the pre-re-match `originalGrid`** (the "替代前" baseline FR-9 preview and the "整体回退"
promise depend on). If a user re-matches, then applies substitution, then hits undo expecting to land
"替代前", they instead land in a grid whose `originalGrid` is already the re-matched grid — the
baseline is gone. Both stories satisfied AD-6's literal text.

**Second reading of "单条".** Even within FR-8, "整色替换" (whole-color) of *several* missing colors at
once: is "apply all substitutions" one history entry or one-per-color? FR-8 says "一键把所有...替换…
记为单条撤销历史" (one entry) but FR-9 lets the user "放弃" individual previews, implying per-color
granularity. Story A batches all into one `applyCellChanges` → one undo. Story B applies per-color →
N undos. Different undo UX, different history-stack shape, both arguably AD-6-legal.

**Close it.** Tighten AD-6: (1) explicitly state re-match (FR-5) must go through a history-recording
path (wrap `commitConversion`-equivalent in a `useHistory` entry, or define a `commitReMatch` that
captures the full-grid inverse), and must **not** silently overwrite `originalGrid` such that the
"替代前" baseline is lost; (2) define "整色替换 of one缺色 = one CellChange-set" and "apply-all = one
history entry containing all selected colors' changes" so undo granularity is fixed; (3) state that
FR-9's "放弃 individual" happens **before** commit (in preview state), so the committed entry is always
exactly the accepted set as one entry.

---

### F-5 [MEDIUM] — AD-1 + FR-8: write-back ambiguity for 整色替换 when target color already exists in grid (countMap merge)

**The seam.** FR-8 "整色替换" replaces all cells of缺色 X with库存替代色 Y. Per AD-1, write-back is the
brand index of Y. But Y may **already be used** elsewhere in the grid. The spine never says how the
two count-streams merge, and `countMap` is index-keyed and incrementally maintained.

**Incompatible pair.**

- **Story FR-8 (apply)** builds `CellChange[]` for every cell currently == indexOf(X), setting them to
  indexOf(Y), and calls `applyCellChanges`. This is correct: `applyCellChanges` decrements X, increments
  Y, X drops out of `countMap`, Y's count grows. Invariant 2 holds.
- **Story FR-10/11 (verdict/缺口)** reads `analyzeInventory`, which (per AD-5) recomputes from
  `grid + inventory`. *Before* FR-8 commits, FR-10 must answer "替代后可拼?" — it needs the
  **post-substitution** count of Y (= existing Y usage + all X cells) to decide whether Y's qty覆盖
  得了. The spine's三态判据 explicitly says yellow "不承诺数量精算到颗", so Story B computes the verdict
  **without** merging X's cells into Y's projected demand. But FR-9 preview ("受影响格子总数" + per-ΔE)
  and FR-11缺口 ("还差约 X 颗") **do** need the merged demand to produce the人话解读.

So two consumers of the same `analyzeInventory.substitutions`/`shortfall` compute Y's effective demand
differently: FR-10 ignores the merge (yellow is "no missing color, qty not promised"), FR-11 must
account for the merge to say "余量紧张/还差约N". If `analyzeInventory` returns a **single**
`shortfall`/demand number, one of them is wrong; if it returns two, the spine hasn't said which field
is which — back to F-1. The "标黄但缺口清单说还差很多" inconsistency is structurally permitted.

**Close it.** Tighten AD-5/AD-8 convention: `analyzeInventory` must compute and expose
**post-substitution projected demand per color** (the merge of original usage + absorbed缺色 cells) as
an explicit field, and state that (a) the **verdict** uses only mask-membership (per the existing
tri-state rule, no qty精算), while (b) the **shortfall人话解读** uses post-substitution projected demand.
Both read the *same* explicit fields; neither re-derives the merge. Pin that substitution write-back to
an already-present target color is a count **merge** (not a separate logical color) — there is exactly
one index for Y.

---

### F-6 [MEDIUM] — Multi-board: inventory logic vs board segmentation — does mask/verdict depend on board, and is it whole-grid or per-board?

**The seam.** The spine never mentions `boardCols/boardRows` in any AD. The repo treats a `quad-58` as
one contiguous 58×58 grid; segmentation exists only for export dividers. But the PRD's user mental
model ("这张图能不能拼") and缺口 ("还差约 N 颗") are about the **whole project**, and a maker physically
assembles board-by-board.

**Incompatible pair.**

- **Story FR-10/11 (verdict/缺口)** computes demand from the **whole grid** `countMap` — correct to the
  repo reality and to "可拼这张图".
- **Story FR-6-canvas (标记)** or a later "per-board可拼性" story reasonably segments markers/verdict
  **per board** (boardCols×boardRows tiles), reading the UX intuition that a maker finishes one board
  at a time and wants "board 3 缺 H2". This dev partitions `grid` into board tiles using
  `boardCols/boardRows` and runs membership per tile.

If any inventory-derived number is ever split per-board by one story and whole-grid by another, the
two disagree on demand and on what "缺口" means — and because the spine is silent on board segmentation
in inventory logic, **both are spine-legal**. Worse: a later substitution story could apply a different
substitute色 per board (board-local closest color), which directly violates FR-8's "整色替换" (whole-color,
one substitute for the缺色 everywhere) — yet nothing in the ADs ties `analyzeInventory` to whole-grid
scope.

**Close it.** Add one sentence to AD-5 (or AD-1): **all inventory analysis — mask, perColorStatus,
verdict, shortfall, substitutions — is computed over the whole contiguous grid; `boardCols/boardRows`
are export-rendering concerns only and MUST NOT segment inventory computation.** Explicitly: a缺色 has
exactly one substitute across the entire grid (reinforces FR-8 整色替换). If per-board可拼性 is ever
wanted, it is a deferred item, not a free reading of the current spine.

---

### F-7 [LOW] — AD-8 tri-state rule "替代都进不了掩码" is two-readable for the red/yellow boundary

**The seam.** The Consistency Conventions tri-state row: yellow = "有缺色但全部缺色都能在掩码内找到替代";
red = "有色连替代都进不了掩码（不做替代色级联校验）". But the mask is *never empty-relative*: any缺色
will *always* have a nearest color in a non-empty mask (`findClosestColor` returns a result for any
non-empty palette). So "替代进不了掩码" can only mean "**mask is empty**" — but then there's no缺色 vs
全缺色 distinction.

**Incompatible pair.**

- **Story FR-10 (verdict)** reads red as "**mask empty** → can't substitute anything → red". So with any
  non-empty inventory, red is **unreachable** — every缺色-having design is yellow. (Matches FR-10
  Consequence text: red = "颜色既不在库存色板内、也无任何可替代色（库存色板放不下它）".)
- **Story FR-9/SM-C1-aware (preview)** reads "进不了掩码" as "**no acceptable substitute** — nearest ΔE >
  high threshold (>5, AD-8)", so a缺色 whose only available substitute is ΔE 30 is "进不了掩码" → red. This
  is the SM-C1 spirit (don't go green/yellow with ugly substitutes).

Two readings: red = mask-empty (qty/availability) vs red = no-good-substitute (quality/ΔE-gated). They
produce **opposite verdicts** for a non-empty inventory with one wildly-off缺色. Both cite AD-8. This is
lower severity because it degrades to "wrong light color" not data corruption, but it's still a genuine
two-build divergence on the headline UI element.

**Close it.** Tighten the tri-state convention to state the boundary numerically and unambiguously: red
⇔ **mask is empty** (no usable inventory at all); yellow ⇔ mask non-empty AND ≥1缺色 (every缺色 gets the
nearest mask color regardless of ΔE — quality is surfaced by FR-9/SM-C1, *not* by the light color); green
⇔ no缺色. Explicitly note that ΔE quality does **not** gate the verdict color in v1 (otherwise SM-C1
silently becomes a hard verdict input, contradicting "黄灯只保证没有缺的色"). If the maintainer wants
ΔE-gated red, that is a new decision, not a free reading.

---

## Summary of holes → AD changes required

| # | Sev | Hole | Fix |
|---|-----|------|-----|
| F-1 | HIGH | AD-5 5-field output untyped; map keyspaces & substitution direction free | Pin `InventoryAnalysis` interface in shared types; keyspaces = index, carry both id+index, fix substitution direction |
| F-2 | HIGH | "owned qty>0" mask predicate + id→index join has two owners | New/tightened AD-1/AD-9: predicate & projection live **only** in `analyzeInventory`; pin `qty===0` rule |
| F-3 | HIGH | AD-4 key string, `schema_version` type/bump, brandId-vs-paletteId, stale colorId all free | Pin key `…:{paletteId}`, `schema_version:number`, drop stale colorIds pre-analyze, forbid `-1` in mask |
| F-4 | MED | AD-6 "单条" + re-match path: `commitConversion` records no history & clobbers originalGrid | Re-match must record history + preserve 替代前 baseline; fix apply-all undo granularity |
| F-5 | MED | FR-8 write-back into already-present target → countMap/demand merge undefined across consumers | `analyzeInventory` exposes post-substitution projected demand; verdict vs shortfall read same fields |
| F-6 | MED | Spine silent on board segmentation in inventory logic | State inventory analysis is whole-grid; `boardCols/boardRows` = export only; one substitute per缺色 grid-wide |
| F-7 | LOW | Tri-state red/yellow boundary two-readable (mask-empty vs ΔE-gated) | Pin red⇔mask empty; ΔE does not gate verdict color in v1 |

**Verdict: NOT-YET-SOUND.** The spine's load-bearing claim is that AD-5's single派生源 makes
cross-story disagreement impossible. F-1/F-2/F-5 show the *opposite*: because the output shape, the
mask predicate, the id↔index join, and the post-substitution demand merge are all unspecified, two
fully spine-compliant stories produce the very "标黄但标缺色 / 灯绿但缺口很大" inconsistencies AD-5 exists
to forbid — and do so silently (no type error, no crash), matching the "UI 不报错但统计/导出错" failure
class. AD-4's envelope is similarly under-pinned enough to collide keys and corrupt the mask with `-1`.
Close F-1 through F-3 before any story is cut; F-4/F-5/F-6 before FR-5/7/8 are cut; F-7 before FR-10.
