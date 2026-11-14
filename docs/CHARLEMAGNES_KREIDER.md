# Charlemagnes and Kreider

> **Ghi chú phiên bản:** tài liệu chuyên đề theo đợt triển khai. Các con số trận mẫu là ảnh chụp, không tự áp lên mọi Level/Rank. Luật chung hiện hành ở [ENGINE_RULES](ENGINE_RULES.md), thông số thô ở JSON/[catalog](CHARACTER_CATALOG.md); thay đổi mới hơn được ưu tiên. Save ứng dụng hiện v7. Không triển khai lại tính năng đã gỡ từ mô tả lịch sử.

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

## Trấn Phái Charlemagnes — Ấn Soái Lệnh (14/11/2026)

Mở công thức bằng 10 Bản Thiết Kế tại Shop, chế tạo/trang bị theo luật Trấn hiện hành; không tự tặng vào save cũ. Khi mang Trấn, sau khi thi triển **Quân lệnh: Phá giáp**, bản thân nhận **+30% ATK**, giữ **3 lượt chính**. Dùng lại làm mới, không cộng dồn. Trấn không đổi MP/CD hay hiệu quả giảm DEF của chiêu, không làm chiêu tiện ích này có Rank.

Dùng adapter `after_skill_status` và status `charlemagnes_marshal`, không thêm nhánh riêng vào engine. Buff cố định 30%, không tăng theo Rank/Thông Thạo. Kích theo lần thi triển hợp lệ, kể cả địch có Hộ Ấn chặn giảm DEF; lệnh sai, thiếu MP/CD hoặc Choáng bỏ lượt không kích. Phong Ấn trên người mang có thể chặn buff, xóa buff theo luật chung. Hai phe Arena xét nguồn/đích riêng.

Thời hạn đếm ở cuối lượt chính của Charlemagnes, gồm lượt chính bị Choáng; Lượt Thêm không trừ. Lượt mới cấp hoặc làm mới không trừ ngay. Qua wave/phòng dùng adapter carry hiện hành, phase cùng trận không tự làm mới; trận độc lập bắt đầu không có buff. Forecast không đổi trạng thái thật; snapshot giữ thời hạn theo luật chung.
