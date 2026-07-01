# PRD Quality Review — 库存驱动设计（Inventory-Driven Design）

## Overall verdict

这是一份立论清晰、形态贴合的 PRD：差异化命脉（"用手头色感知替代，而非补货"）被反复锚定、贯穿 Vision → Features → Non-Goals → SM，不是装点。FR 普遍带可测试 Consequences，术语表被纪律性地全文复用，假设索引能往返对齐——下游 UX/架构/拆分基本能干净 source-extract。最大的真实风险集中在两处可测试性缝隙：感知替代的 ΔE「可接受阈值」整份 PRD 悬而未决（FR-7/FR-9/SM-C1 都依赖它却把它丢给 Open Q3），以及 FR-9 预览的"低/中/高"分级缺少落点。按个人开源项目的 stakes 校准，这份 PRD 已达到"可以开始做"的水准，但命脉功能（替代）的 done-ness 需要在动工前补一个标定动作。

## Decision-readiness — strong

决策是作为决策陈述的，不是埋成"考量"。最有说服力的是 FR-10 那段：黄灯的承诺边界被明写为"保证没缺色、**不保证数量精算到颗够完工**"，并在 Open Q2 留下决议痕迹（party-mode 2026-06-30，John 以产品定位消解技术难题、Sally 扎出"缺口清单不能只甩数字"）。这是一个真实 trade-off 被命名、且交代了放弃了什么（级联校验）以及为什么（定位而非技术限制）。FR-11 的"每行必须带人话解读，不能只甩数字"同样是有牙齿的决策，划出了"信息透明 vs 把账本甩脸上"的界线。

Open Questions 大体是真开放的（Q1 替代粒度、Q3 ΔE 阈值、Q4 跨品牌替代、Q5 存储介质），Q2 已正确归档为"已解决"并保留推理。`[NOTE FOR PM]` 落在真实张力处（FR-3 后那条"录入成本是最大体验风险"、§6.2 那条"本地存储丢失风险→优先做 JSON 备份过渡"），不是安全检查点。

### Findings
- **low** Open Q1（替代粒度）已在正文实质决定却仍挂"待确认"（§8.1 vs FR-8）— FR-8 已写"把该缺色的**全部格子**替换"且 §4.3 Description 明确"整色替换"，Open Q1 的"v1 倾向整色替换"其实已是既成事实。*Fix:* 把 Q1 降级为"已采纳整色替换，逐格替代为未来增强"，或与 Q3 合并，避免读者以为粒度仍未定。

## Substance over theater — strong

没有 persona 通胀（两个 UJ 同一主角林夕 + 维护者自身，符合 solo/hobby 形态）。差异化不是模板填空：Vision 第 3 段"CIEDE2000 引擎反着用——把色板从理想全集换成库存子集"是一个具体的、可在现有代码上验证的技术 insight，不是空喊novel。Non-Goals 里"竞品做导购，我们刻意不做"把差异化用"我们不做什么"反向钉牢，这是真 substance。SM 没有 DAU/MAU 充数——SM-1 直接量"触发并应用过感知替代的会话比例"，正对命脉。

唯一接近 furniture 的是 §2.1 的两条"情感性" JTBD，但它们仍各自牵动了功能（"肉眼硬凑偏色"→感知替代；"重复补货吃灰"→库存复用），勉强算earned，不flag。

## Strategic coherence — strong

有清晰 thesis 并全程下注："反转 先有图再买料 的默认，在真实库存约束下做图、缺色时感知替代"。功能优先级跟着 thesis 走而非"先做易的"：§4.3 感知替代被显式标为"差异化命脉，必须做透"，MVP Scope 也把它列为必做。SM 验证的是 thesis（SM-1 命脉被用、SM-2 闭环达成）而非活动量，且配了两条像样的 counter-metric：SM-C1"替代别为全绿而放大 ΔE"、SM-C2"别为库存牺牲基线性能"——这两条恰好守住 thesis 最容易被自己破坏的两个点。MVP 是清楚的 problem-solving 型 scope，逻辑自洽。

### Findings
- **medium** SM-C1 的 counter-metric 没有可执行阈值（§7 SM-C1 + Open Q3）— "ΔE 超过可接受阈值的比例要低"中的阈值整份 PRD 未定，使这条反向指标暂时无法度量。它与 FR-9 分级、Q3 是同一个悬空变量。*Fix:* 见 Done-ness 第一条——一个标定动作可同时关掉 FR-7/FR-9/SM-C1/Q3 四处的口子。

## Done-ness clarity — adequate

多数 FR 的 Consequences 是可验证的，且这份 PRD 在 done-ness 上有超出 hobby 水准的亮点：FR-4"关闭时与基线完全一致（不回归）"、FR-5/FR-8"须经 store 合法路径 commitConversion 提交、保持三不变量"、FR-7"先 paletteLabs() 预计算再 findClosestColor"——这些把验收和现有架构对齐，工程师读得出"done"长什么样。FR-10 三态有明确布尔判据（绿=每色拥有量≥需求量；红=有色不在库存色板且无可替代色）。

扣到 adequate 而非 strong，是因为命脉功能的两个量化点悬空：

### Findings
- **high** 感知替代的 ΔE「可接受阈值」/「低中高分级」无定义，命脉功能缺验收落点（FR-9 Consequences、FR-7、§7 SM-C1、§8 Q3）— FR-9 要求显示"视觉影响：低/中/高"，但低/中/高如何切分（ΔE 几算低）通篇没给；FR-7 输出 ΔE 数值但不判断"这个替代算不算可接受"。这是差异化命脉的 done-ness，被整体推给 Open Q3"需要试做几张图标定"。对个人项目不必现在定死，但应在动工前作为前置标定任务而非开放问题。*Fix:* 把 Q3 转成一个明确的前置动作（"动 FR-7/9 前先用 3~5 张真实图标定 ΔE 分级阈值，写回 FR-9"），给一个可被推翻的初值（如 ΔE<2 低 / 2–5 中 / >5 高，参考 CIEDE2000 经验区间），避免"做的时候再说"。
- **low** FR-3 的批量默认数量是 `[ASSUMPTION]` 但已进 MVP In Scope（FR-3 / §6.1）— 一条仍标假设的能力被列入交付范围，done-ness 取决于该假设是否成立。*Fix:* 维护者自用，确认即可去掉假设标。

## Scope honesty — strong

Non-Goals 做了真功（§5 六条全是会被默默假设进去的边界：不做采购电商、不做账号云端、不做实拍、不做社区、不改基线、不做协作），且 §6.2 的 Out of Scope 与 §5 不重复而是补充（云同步、逐色手动替代、跨品牌替代）。`[NON-GOAL for MVP]`（FR-8 逐色手动）和 `[ASSUMPTION]` 标注克制且都进了索引。De-scoping 是公开提议的——级联校验的放弃在 Open Q2 留痕、FR-10 正文也写明，没有偷偷砍。

开放项密度：Open Questions 5 条（实际待决 4 条）+ `[ASSUMPTION]` 7 处 + `[NOTE FOR PM]` 2 处，对一个个人开源项目的 MVP 而言完全合理，不构成 build blocker。

## Downstream usability — strong

这是这份 PRD 最扎实的维度。术语表（§3）定义了 9 个领域名词并写明"下游须逐字使用、不得引入同义词"，正文确实做到了：库存/库存条目/品牌色板/库存色板/缺色/数量不足/感知替代/可拼性判定/缺口清单 在 FR、UJ、SM 中用词一致。FR-1..11 连续唯一；UJ-1/UJ-2、FR-N、SM-N 交叉引用（Realizes/Validates/Counterbalances）全部能 resolve。每个 FR 块能独立抽出阅读，引用走术语表而非"见上文"。两个 UJ 都有具名主角（林夕）并把 context 写在 inline。完全满足 chain-top（喂 UX→架构→stories）的要求。

## Shape fit — strong

形态判断准确。这是 solo/hobby + brownfield + chain-top 的混合体，PRD 对每一面都对位了：rigor 轻（不强求企业级 NFR），但 substance bar 守住；brownfield 引用准确且区分了"现有"与"新增"（§0 显式引 project-context 的 useDesignStore/CIEDE2000/palette/BeadGrid/三不变量，FR-5/7/8 引具体函数名 commitConversion/applyCellChanges/paletteLabs/findClosestColor）；两个 UJ 数量恰当不过度形式化。维护者自身作为"第一验收人"被建模进 §2.1 与 SM-4，符合 single-operator 现实。没有 over/under-formalize。

### Findings
- **low** brownfield 代码引用未在本 PRD 内验证准确性（§0、FR-5、FR-7）— `commitConversion`、`applyCellChanges`、`paletteLabs()`、`findClosestColor`、"三不变量"均引自 project-context，本评审未核对其与真实代码一致（超出 PRD 文本评审范围）。*Fix:* 架构文档阶段对照实际 store/引擎 API 核名，若签名已变需回写 FR-5/7/8。

## Mechanical notes

- **术语表一致性**：通过。9 个术语全文逐字复用，未见同义词漂移（如未出现"补货色/可用色板"等替代说法替代"库存色板"）。大小写/单复数无问题（中文术语，英文对照仅在 §3 定义处出现）。
- **FR 编号连续性**：FR-1 → FR-11 连续、唯一、无 gap、无重复。
- **UJ / SM 编号**：UJ-1、UJ-2；SM-1..4 + SM-C1、SM-C2 连续唯一。
- **交叉引用解析**：所有 Realizes UJ-N / Validates FR-N / Counterbalances SM-N 均指向存在的 ID，无悬空引用。SM-2 引"FR-10, FR-5, FR-8"、FR-11"跳到 FR-7"等均可达。
- **假设索引往返**：7 处 inline `[ASSUMPTION]`（§2.1、FR-2、FR-3、FR-6、FR-9、FR-11、§6.2）与 §9 索引的 7 条一一对应，往返干净。轻微瑕疵：SM-4 的 inline `[ASSUMPTION]` 与 §2.1 共用索引行"§2.1 / SM-4"（同一假设两处标注、一行索引），可接受但严格说是"两个 inline 标 → 一条索引"，非一对一。
- **UJ 主角具名**：UJ-1、UJ-2 主角均为"林夕"，context inline 完整。通过。
- **必需章节**：Vision / Target User+JTBD+Non-Users+UJ / Glossary / Features+FR / Non-Goals / MVP Scope / Success Metrics+Counter / Open Questions / Assumptions Index 全部就位，符合该 stakes 与产品类型所需。
