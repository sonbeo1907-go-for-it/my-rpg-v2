# Charlemagnes and Kreider

Both characters enter the standard banner and its Pure Prisma recruitment pool. Existing rates, pity, duplicates and gear-slot rules remain unchanged; neither is unlocked for free. Save v6 is retained.

## Charlemagnes · Đại tướng Kị sĩ đoàn

Fire / physical DPS; HP210 MP100 ATK34 MAG8 DEF22 RES18 SPD14.

| Command | MP / cooldown | Effect |
| --- | --- | --- |
| Kị đoàn xung kích | 20 / CD1 | 2 random hits, 200% ATK each |
| Uy lệnh tổng tiến công | 40 / CD4 | 4 random hits, 180% ATK each |
| Quân lệnh: Phá giáp | 10 / CD2 | −30% DEF on one target for 3 target main turns |

**Tiết kiệm quân lực:** after personally defeating one enemy, reduce subsequent MP costs by 12%, once only. No refund for the casting skill. Costs round up: 20→18, 40→36, 10→9; a positive cost never becomes free. The persistent buff survives rooms in one dungeon run and resets in an independent new battle. Allied kills do not grant credit. Shields and HP phase thresholds do not count as defeated actors.

`random_enemies` is a reusable targeting category. Every hit draws uniformly from the current living legal pool; repeats are allowed. Rebuild the pool after every hit. Stop when no enemies remain or the caster falls. A sole enemy receives all remaining hits. The selected UI anchor does not bias RNG. The skill is multi-target for taunt, cover and follow-up eligibility, so it ignores taunt/cover and never qualifies as single-target magic for Aurora. Per-hit evasion, counters, weakness and shields still resolve normally. Previewing never draws combat RNG.

## Kreider · Nhạc công giao hưởng

Dark / magical DPS; HP125 MP110 ATK8 MAG41 DEF14 RES25 SPD18.

| Command | MP / cooldown | Effect |
| --- | --- | --- |
| Khúc dạo đầu | 5 / no cooldown | Single-target 120% MAG |
| Hòa âm nghịch hành | 10 / CD2 | −35% RES on one target for 3 target main turns |
| Đại hợp tấu: Chung chương | 26 / CD2 | Single-target 300% MAG |

**Cộng hưởng nghịch âm:** +30% direct damage per distinct active debuff ID on the actual victim, capped at +90%. Three layers of one effect count once. An effect reducing multiple stats counts once. Buffs, expired effects and zero-layer effects do not count. Source does not matter. Re-evaluate per hit. Applies to basic/direct attacks, not periodic poison. Add to existing outgoing damage bonuses; do not multiply again. The native cap does not cap unrelated buffs. Follow-up casters use their own passives.

Shared helpers supply costs and target debuff counts to combat, AI affordability and skill previews. Live hover uses the real selected target; out-of-combat previews start at zero debuffs and offer a 0–3 assumption slider.
