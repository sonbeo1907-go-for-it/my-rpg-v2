# Astoria · Nhân vật chính thức và Magnamut

Cập nhật 06/11/2026: Astoria đã ra mắt chính thức. `releaseId=93`, ngay sau Chiyoko #92. Slot thử nghiệm #33 bị deprecated vĩnh viễn; không tái sử dụng hoặc đánh lại số nhân vật khác. Stable ID vẫn là `astoria`, không thay các ability ID hoặc khóa save.

Astoria xuất hiện trong danh mục chưa sở hữu, pool banner thường và pool ngoài rate-up. Lịch rate-up đã công bố được giữ; thêm cô ấy vào roster quay vòng từ đợt 09/11/2026, có thể ở vị trí phụ ngoài phe. Không đổi phe `time_travelers` chỉ để khớp banner.

Gỡ nút Developer Option và lệnh bật/tắt Astoria khỏi runtime. Save từng bật thử vẫn giữ quyền sở hữu, cấp độ, Rank, gear, preset và dupe; flag `developer.astoria` cũ không còn điều khiển quyền truy cập. Save chưa sở hữu không được tặng miễn phí. Không tự thêm Thông Thạo. Astoria được tính vào điều kiện 16 nhân vật và pool Đấu Hạng như các nhân vật chính thức khác. Bộ kỹ năng/VFX/giới hạn PvP Rank 5 giữ nguyên.

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
- Owner KO, defeat/draw, standalone battle victory and the final dungeon-room victory terminate the mode.
- Gold Mine / Dangerous Dungeon: intermediate victories keep mode + remaining rifts. No exit event or 35% MP refund is emitted. Existing zero-resource turn-start / round-end checks still apply in the next room.
- Miraebolis transitions remain inside one battle: keep mode + rifts, and apply the boss's independent full-MP phase reward. This is not a summon exit/refund.
- `leaveCombatMode` first clears state, then emits one exit event and restores `ceil(maxMP × .35)` (42 at base stats), capped at maximum. Repeated checks do nothing.
- React rendering, navigation and audio playback never trigger the gameplay refund.

## Presentation

`ability_cast` emits once per cast. `primaryMultiplier` selects a single primary hit without applying defense twice. AoE remains AoE for follow-up eligibility; Aurora only reacts to qualifying single-target magic from another ally.

Magnamut uses `public/art/magnamut.svg` and the supplied `/bgm/bgm_astoria.mp3`. The music overlay pauses the base encounter track and restores its position when the mode ends. Final victory clears the overlay and takes priority. Intermediate room victory keeps the overlay playing without restarting it; only the backing encounter track changes. Leaving the battle route only pauses playback.

Cosmic Effects renders one bounded SVG per cast, 12 fixed particles, no animation dependency in simulation. Formation effects anchor to the enemy grid; single-target slashes anchor to the target card. Timers are cancelled on replacement/unmount and session changes. Reduced motion uses a short static effect.

The role icon, skill facts and catalog use the shared data-driven systems. This character tests lifecycle, multi-hit, primary AoE, turn manipulation and scene overrides; it is not a synthetic many-entity throughput benchmark.
