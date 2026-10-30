# Astoria · Technical test

Astoria is opt-in per profile through Settings → Developer Option. It grants ownership with zero duplicates (3 gear slots). It never enters a banner or Pure Prisma recruitment pool. Disabling removes her from every party preset and unequips gear without deleting inventory. Changes are blocked during an unfinished battle/run. The existing v6 save envelope is retained; `developer.astoria` is a profile flag.

## Content

Dark / Thuật Sư; HP175 MP120 ATK12 MAG36 DEF18 RES22 SPD16.

| Command | Cost | Effect |
| --- | --- | --- |
| Basic | 0 MP | Two separate magical hits, 60% MAG each |
| Vết chém không gian | 10 MP | One hit per enemy: primary 160%, others 80% MAG; +1 rift per cast |
| Không gian rạn nứt | 12 MP, CD3 | One 160% MAG hit; −25% RES for 4 **target main turns**; +2 rifts |
| Triệu hồi Magnamut | 0 MP; requires 5 rifts, consumes none | Enter Magnamut mode; grant one Extra Turn in the current extra phase |
| Mệnh lệnh hủy diệt | 1 rift, spent after damage | Primary 360%, others 200% MAG |

Rifts cap at 5. Mode grants +15 **base** MAG before percentage modifiers. It owns no independent actor, HP, SPD, action or party slot. Every other command remains visible and unavailable, including Basic and Defend. Engine availability also rejects forged commands.

## Lifecycle

`enter_mode` uses the actor's reusable `combatModes` definition: allowed commands, resource, base bonuses, exit MP ratio, background, music.

- Empty resource: check at the beginning of **every** turn and at main round end **after** the extra phase. Turn-start exit preserves the current action.
- Resource reaches zero during damage: finish all hits using the mode bonus before spending the resource. No immediate exit hook on spending.
- Replenishing before the next check preserves the mode.
- Owner KO and battle outcome also terminate the mode.
- `leaveCombatMode` first clears state, then emits one exit event and restores `ceil(maxMP × .35)` (42 at base stats), capped at maximum. Repeated checks do nothing.
- React rendering, navigation and audio playback never trigger the gameplay refund.

## Presentation

`ability_cast` emits once per cast. `primaryMultiplier` selects a single primary hit without applying defense twice. AoE remains AoE for follow-up eligibility; Aurora only reacts to qualifying single-target magic from another ally.

Magnamut uses `public/art/magnamut.svg` and the supplied `/bgm/bgm_astoria.mp3`. The music overlay pauses the base encounter track and restores its position when the mode ends. Victory clears the overlay and takes priority. Leaving the battle route only pauses playback.

Cosmic Effects renders one bounded SVG per cast, 12 fixed particles, no animation dependency in simulation. Formation effects anchor to the enemy grid; single-target slashes anchor to the target card. Timers are cancelled on replacement/unmount and session changes. Reduced motion uses a short static effect.

The role icon, skill facts and catalog use the shared data-driven systems. This character tests lifecycle, multi-hit, primary AoE, turn manipulation and scene overrides; it is not a synthetic many-entity throughput benchmark.
