# Monica · Phù thủy thời gian

Official Wind / Thuật Sư character. HP160 MP150 ATK12 MAG34 DEF15 RES24 SPD24. Locked until normally recruited; included in the standard banner and its Pure Prisma recruitment pool. No save format change or free grant.

| Command | Cost | Effect |
| --- | --- | --- |
| Basic | 0 MP | Two separate magical Wind hits at 60% MAG each |
| Thuật thức thời gian | 12 MP | AoE 80% MAG; −15% ATK/MAG for 1 target main turn |
| Lỗ Hổng Thời Gian | 20 MP, CD2 | One 320% MAG Wind hit; 25% RES penetration |
| Đảo lộn thời không | 30 MP, CD4 | Prioritize caster's team in the remaining queue, for current + next round |

## Shared ordering contract

`turn_order_field` is a reusable battlefield effect. It is not an actor status or an extra-turn grant. A field stores its priority team, source, name and absolute expiry round. Same field reapplication refreshes duration, without stacking. A replacement uses the latest priority team. Caster death does not remove a field early.

- Already completed positions and the currently acting actor never move.
- Reorder only pending positions: priority team first, current effective SPD descending within each team; stable ties retain existing order.
- Every new main round builds a fresh field-aware queue. Extra phases sort only actors actually granted an extra action, using the same field rule.
- No actor gains or loses an action; no extra action crosses the main/extra boundary. Miraebolis retains both moves inside its one phase-three boss turn.
- Expiry resolves after the next main round's entire extra phase. CD4 cast in round 1 is ready again in round 6 under the existing engine convention.
- Dungeon rooms carry the field with its absolute expiry, never adding duration. If a room ends mid-round, the next room's new round still advances that clock. Standalone new battles start with no field. Miraebolis HP phase changes preserve the field.

## Lăng kính thời gian

`later_target_base_stat`: an active damaging command targeting at least one living enemy after Monica in the full main-round order receives +6 base MAG for the whole cast. The full main order includes completed actors and is updated when its pending suffix is reordered. Extra actions consult that same main-order snapshot, including targets absent from the extra queue.

Freeze eligibility before effects resolve. Add the flat bonus before all MAG percentages; never mutate actor stats. It is granted once, not per enemy or hit. Basic attacks, automatic attacks, counters and follow-ups do not qualify. Follow-up casters do not inherit Monica's bonus. Missing ranks do not qualify. Live previews call the same eligibility function as combat.

## UI

`TurnOrder` is a separate component. While the field is active it shows a named hourglass badge with remaining rounds and an accessible tooltip. A noninteractive hourglass divider appears at each actual team boundary in the pending queue. If only one team's turns remain, the divider disappears and the badge stays visible. No independent visual regrouping is allowed: the chip order always matches the engine queue.

The shared hourglass SVG is used for both the badge and divider. Mobile wraps the chips and badge without horizontal overflow. Expired fields remove both indicators.
