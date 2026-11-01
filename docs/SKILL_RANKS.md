# Skill Rank — implementation v1.1

**User revision, 1 November 2026:** all eligible groups in a mixed skill grow together. This supersedes the single-profile policy in section 5 of the archived source specification.

## Player flow

Open **Nhân Vật → Chi Tiết → Kỹ Năng → Xem nâng cấp**. Every eligible card shows its current Rank, next character-level requirement, Coin price and current/next MP cost. The confirmation dialog compares both versions using the same skill presentation code as combat. Cancel is free. Failed persistence leaves both Coins and Rank unchanged and permits retry.

Ranks 1–5 require character levels **1 / 15 / 30 / 40 / 50**. Character levels unlock the ceiling only; they never purchase ranks. Each sequential upgrade costs **400 / 800 / 1,600 / 3,200 Coin**, total 6,000 per skill. Upgrade is locked during a live battle, unfinished dungeon/story wave chain, and save transaction. Maximum rank and fixed skills sell no further upgrade.

## Common authoring contract

Every data ability declares `skillLineId`, its primary `growthProfile`, all eligible `growthGroups`, and `rankable`. The primary profile categorizes the skill; it does not restrict growth to one group. Fixed skills also carry a Vietnamese `fixedReason`. Growth profiles are independent of character identity:

| Profile | Grows | Remains authored |
| --- | --- | --- |
| `basic` | Playable basic coefficients ×1.1^(Rank−1) | Enemy basics, hits, element, type |
| `damage` | Direct active coefficients, including primary/dynamic components ×1.1^(Rank−1) | Debuffs, penetration, final damage bonuses |
| `heal` | Direct multiplier and flat HP recovery ×1.1^(Rank−1) | Gear and passive recovery |
| `shield` | Direct multiplier and flat shield ×1.1^(Rank−1) | Duration, nonstacking policy |
| `stat_buff` | Positive ATK/MAG/DEF/RES percentages ×1.05^(Rank−1) | SPD, reduction, MP recovery, output buffs |
| `output_buff_mp` | Base MP ×max(0.7,0.9^(Rank−1)) | Output percentage, resources, duration |
| `fixed` | Nothing | Utility, automatic attacks, periodic effects, unsupported fields/formulas/summons |

Mixed skills grow **all eligible groups** in one paid Rank, with no extra group fee. Chloe care grows healing ×1.1 and ATK/DEF percentages ×1.05 while SPD stays fixed. Sieg sanctuary grows shield output ×1.1 and DEF/RES percentages ×1.05. Gahallad mount grows its ATK percentage ×1.05; shielded-target damage amplification stays +100%, and its authored zero MP cost remains zero. Paid output-buff skills keep the original MP discount rule alongside their other growing groups. `mode_stat_buff` is an explicit adapter for Yufina's percentage mode buff: ATK grows, SPD, duration, cost reduction and exit refund do not. Manually issued mode attacks can grow direct damage; automatic companion pulses cannot.

All four Ogre's Bane forms are story-fixed. Their damage, MP/resource costs and mastered +20% ATK remain authored. Fiona refraction and its story replacement share `fiona.refraction` and inherit paid ranks. Other new unlocks begin at Rank 1. Content validation rejects replacement lines that silently lose ranks, unsupported adapters and growth profiles without a legitimate benefit.

## Runtime order and persistence

- `skill-rules.js`: formulas, gates, sparse-map validation and authoring validation.
- `skill-progression.js`: common quote/commit eligibility, sequential Coin transaction, asynchronous persistence helper.
- `skill-resolver.js`: immutable source-owned skill instance. Actor Rank/config is snapshotted once when a battle/run starts and carried to later rooms/waves.
- `exclusiveDamageEffect`: authored Trấn Phái override **first**, then Rank factor once on direct coefficients; DEF/RES is subtracted afterwards. Passive SPD contribution is separate and does not grow with Rank.
- `appliedModifiers` on a status instance stores its caster's ranked buff strength. Linked buffs carry their own snapshots. Same-ID refresh replaces the snapshot; modifier groups and per-stack behavior remain unchanged. Global status definitions are never modified.
- `modeAppliedModifiers` stores percentage mode strength on the actor and is cleared on mode exit. Shared mode templates remain unchanged.
- `mpCost` combines Rank, native and mode discounts, then rounds up **once**, minimum 1 when authored MP is positive. Preferred-resource payment still yields 0 MP. Iris formula MP is **7/7/6/6/5**; assault MP is **12/11/10/9/9**.
- Save envelope remains **v7**. Each character has sparse `skillRanks`, absent keys = Rank 1. Missing legacy maps normalize to `{}` without spending Coins. Foreign/locked/fixed skill keys, invalid rank values and ranks above character level are rejected. Five presets and save round trips remain intact.

## Traveler stories

Every three-chapter story uses fixed enemy levels **10 → 20 → 30**, including all waves and boss phases in that chapter. The separate one-chapter Arthur epilogue remains Lv30. Enemy stat templates and growth curves are unchanged by this update.

## Verification and playtest limits

`test/skill-ranks.test.js` covers transactions, rank caps, v7 migration, source ownership, coefficient order, hybrid/AoE/random/multi-hit skills, direct healing/shields, linked/mode snapshots, unchanged side-effects and fixed story policy. `e2e/skill-ranks.spec.ts` checks confirmation/cancel, MP plateaus, mobile layout, live-battle locks and disk-failure rollback/retry.

Run `node scripts/skill-rank-balance.mjs 30` to regenerate `SKILL_RANK_PLAYTEST.json`. It compares **the same** Yufina/Chloe/Victorina/Elaine party, allocations, three T3 pieces per character and 30 random seeds against Giáo Sĩ Hắc Văn Lv45, HP 4,753. Only legally purchasable Skill Ranks change. No Trấn Phái, T4 or consumables are used.

| Character levels | All Rank 1: wins / mean winning rounds | Legal maximum Ranks: wins / mean winning rounds | Coin investment |
| --- | --- | --- | --- |
| 16/1/1/20 | 30/30 · 32.1 | 30/30 · 28.8 | 3,600 |
| 45/45/45/45 | 30/30 · 26.0 | 30/30 · 18.0 | 47,600 |
| 50/50/50/50 | 30/30 · 26.0 | 30/30 · 15.0 | 102,000 |

This is a synthetic fixed-policy comparison, **not a reproduction** of the user's historical 28-round clear. A 120-round bound and successful clears do not prove that infinite sustain is impossible, nor establish endgame economic balance. No enemy/player stats or crafting prices were altered to compensate for these results. More player testing is needed for that judgment.
