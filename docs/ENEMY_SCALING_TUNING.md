# Tune mới — 01/11/2026

Đây là cấu hình hiện hành theo bảng designer và xác nhận **Lv1 áp dụng toàn bộ**. Nó thay curve Boss4%/7%, mục tiêu2,25/1,5 và các ngoại lệ mốc Lv25/Lv60 cũ. Bản chụp Google Doc cũ vẫn được giữ để truy vết, không còn là thông số hiện hành.

### Enemy & Encounter Scaling — tune 01/11/2026

Quyết định mới của designer thay các mốc tham chiếu cũ: toàn bộ 59 template và 55 encounter dùng referenceLevel=1, bao gồm quái thường, truyện và siêu trùm. Giữ nguyên bảy stats gốc; chúng nay là chỉ số ở Lv1. Không còn ngoại lệ referenceLevel=60 cho Alice/Miraebolis hoặc ref15 cho Phi long Lôi.

HP chọn profile theo Encounter: rewardTier normal/boss/super → normal/boss/superboss; encounter.hpScalingProfile có thể ghi đè. Không phân loại Enemy thành Normal/Elite/Boss. Truy Nã dùng Boss, Hắc ảnh Arthur dùng Superboss như đã chốt.

| Chỉ số | Bước tăng |
| --- | --- |
| HP Normal | 1,8% đến Lv30; 2,5% từ bước 30→31; hỗ trợ đến Lv50 |
| HP Boss | 3% đến Lv30; 4% từ bước 30→31; hỗ trợ đến Lv50 |
| HP Superboss | 1,5% đến Lv50; 2,5% ở Lv51–80; 3% ở Lv81–90 |
| ATK/MAG | Đạt ×2 ở Lv50; trọng số tăng trưởng gấp đôi từ bước 30→31 |
| DEF/RES | Đạt ×1,25 ở Lv50; trọng số tăng trưởng gấp đôi từ bước 30→31 |

ATK/MAG và DEF/RES dùng F(L)=T^(w(L)/69), với L tạm giới hạn ở50, w(L)=min(L,30)−1+2×max(0,L−30). 69=29+2×20. T=2 hoặc1,25. Mỗi bước trước Lv31 tăng khoảng 1,009624%/0,323920%; từ Lv31 tăng khoảng 2,029441%/0,648889%. F(1)=1, F(50)=T chính xác. Trên Lv50 giữ hệ số Lv50, gắn pendingSuperLevelBalance; chưa mở Super Level.

MP/SPD giữ đường tăng cũ 1+growth×(L−1), growth 1%/0,15%; nay cũng chuẩn hóa từ Lv1. Các trường enemyGrowth cũ khác và milestones được giữ cho tương thích dữ liệu, không cộng vào curve mới.

Chỉ số cuối = round(templateStat × F(level)/F(referenceLevel) × explicitMultiplier), chỉ làm tròn một lần. HP có thể cấu hình hpReferenceLevel riêng nhưng nội dung hiện hành đều là1. Không scale trên actor đã scale. Validator chặn curve/level/reference sai; Normal/Boss không tự kéo dài quá50.

Giáo Sĩ Lv45: HP4.753 thay cho9.637 ở bản Boss4%/7%. Alice/Miraebolis Lv60 vẫn HP6.372/9.558; các chỉ số khác nay tăng từ Lv1 (ATK/MAG×2, DEF/RES×1,25; MP/SPD theo curve cũ).

Mỏ Vàng/Hiểm Nguy giữ Lv15/30/45, HP/ATK/MAG override=1 và hệ số MP cũ, không chồng hệ số cũ. Rèn Luyện/Phá Giới, số wave, quota, phần thưởng, EXP và carry-over không đổi. Truy Nã trở về giữ boss và độ khó. Preview/trinh sát/combat dùng cùng hàm và context.

Chi tiết công thức: [ENEMY_SCALING_TUNING.md](ENEMY_SCALING_TUNING.md). Báo cáo [ENCOUNTER_SCALING_PLAYTEST.md](ENCOUNTER_SCALING_PLAYTEST.md) chỉ là smoke test tự động; không khẳng định cân bằng cuối.


Nguồn cấu hình: data/progressionRules.json. Điểm chuyển/trọng số cho ATK/MAG và DEF/RES là accelerateAfterLevel=30, lateGrowthWeight=2; designer có thể tune riêng từng nhóm. Curve HP vẫn cấu hình theo Encounter, không thêm phân loại Enemy.

Raw stats của59 enemy không đổi. Save v7, player cap50, skill coefficient, cơ chế né/khiên, gear, điểm phân bổ và thưởng không đổi.
