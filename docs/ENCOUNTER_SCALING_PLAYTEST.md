# Playtest — tune HP và chỉ số, Lv1 toàn bộ (01/11/2026)

Tuning 01/11/2026: all 59 enemy templates and all 55 encounters use base Level 1, including story and Superboss. Normal HP 1.8% to30/2.5% after; Boss 3%/4%; Superboss unchanged. Offense target 2, defense 1.25 at50; log growth weight doubles after30. F2P Arthur/Iris/Garrek/Elaine, same three T3 +5 stat items each, starter-story upgrades, no gacha, exclusives, effect gear or consumables. Fixed heuristic allocations and action policy, not proof of optimal balance. Legacy control uses raw templates and old Gold Mine multipliers; current engine, not the historical executable. Each seed records its wave roll, outcome, HP/MP and KOs. Bounds: 2500 actions/120 global rounds; engine retains 60 per encounter.

Đội F2P: Arthur / Iris / Garrek / Elaine. Mỗi người ba Gear III +5 chỉ số chính, cùng gear giữa mọi cấp; điểm Level phân bổ bằng heuristic. Không gacha, Trấn, Gear hiệu ứng hoặc consumable. Dữ liệu giả lập, không sửa save người chơi. Đây không phải chiến thuật tối ưu và không chứng minh cân bằng cuối.

Mỏ Vàng/Hiểm Nguy ở mức Khó (địch Lv45). Boss/Truy Nã có cấp địch bằng cấp đội. Siêu trùm Lv60 với đội Lv50. Đối chứng lịch sử là raw template + hệ số Mỏ Vàng cũ, chơi bằng engine hiện tại để cô lập chỉ số; không chạy binary n−1. Mỗi kịch bản 30 seed, JSON lưu wave IDs và kết quả từng seed. HP/MP là tổng cuối trận; không phải đáy tài nguyên. Hòa/bounded không tính thắng.

| Nội dung | Lv đội | Thắng | Hòa/bounded | Vòng thắng TB | HP cuối TB | MP cuối TB | KO TB |
| --- | --- | --- | --- | --- | --- | --- | --- |
| legacy_gold_hard | 1 | 30/30 | 0 | 28.27 | 746.33 | 94.6 | 0 |
| gold_mine_hard | 35 | 30/30 | 0 | 27.5 | 958.93 | 135.57 | 0 |
| dangerous_hard | 35 | 4/30 | 4 | 62.5 | 148.17 | 30.13 | 3.17 |
| gold_mine_hard | 45 | 30/30 | 0 | 27.07 | 1031.47 | 145.1 | 0 |
| dangerous_hard | 45 | 15/30 | 4 | 61.53 | 388.7 | 33.93 | 1.8 |
| gold_mine_hard | 50 | 30/30 | 0 | 27.07 | 1061.07 | 153.83 | 0 |
| dangerous_hard | 50 | 20/30 | 4 | 59.25 | 548.83 | 35.27 | 1.03 |
| ogre_trial | 25 | 30/30 | 0 | 10 | 857.7 | 179.4 | 0 |
| bounty_black_script_cleric | 25 | 30/30 | 0 | 12 | 926.97 | 223.2 | 0 |
| ogre_trial | 35 | 30/30 | 0 | 11.2 | 849.77 | 190.1 | 0 |
| bounty_black_script_cleric | 35 | 30/30 | 0 | 16 | 976.17 | 213.03 | 0 |
| ogre_trial | 45 | 30/30 | 0 | 16.27 | 729.83 | 132.5 | 0.23 |
| bounty_black_script_cleric | 45 | 30/30 | 0 | 20 | 1047.2 | 196.7 | 0 |
| alice_superboss | 50 | 0/30 | 0 | — | 0 | 116.4 | 4 |
| miraebolis_superboss | 50 | 0/30 | 0 | — | 0 | 253.17 | 4 |

Hiểm Nguy Khó ở Lv45/Lv50 tăng từ0/30 ở bản ref1 Boss4%/7% lên15/30 và20/30. Mỏ Vàng Khó vẫn30/30. Alice/Miraebolis là0/30 với đội/policy này vì nay toàn bộ stats cũng từ Lv1; không kết luận mọi build đều không thể thắng, không tự sửa hệ số hay bộ kỹ năng để ép benchmark đạt.

Chạy lại: `node scripts/encounter-balance.mjs 30`. [Từng seed](ENCOUNTER_SCALING_PLAYTEST.json), [ma trận năm độ khó](LEVEL_PLAYTEST_BASELINE.csv), [đặc tả tune](ENEMY_SCALING_TUNING.md).

Kiểm tra kỹ thuật sau tune: 753 kiểm thử engine, 169 kiểm thử UI, content validator và TypeScript đều qua. Raw stats của 59 enemy giữ nguyên; toàn bộ referenceLevel chuyển về1. Save v7 không đổi.

