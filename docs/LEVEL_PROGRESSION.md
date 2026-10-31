# Level, Đột Phá và hầm ngục — bản playtest 01/11/2026

## Phạm vi đã triển khai

- Level 1–50, EXP và điểm phân bổ riêng cho từng nhân vật. Lên cấp không tự cộng chỉ số.
- Đột Phá ở 20/30/40, dùng 1/2/3 Tinh Thạch Phá Giới, mở cap 30/40/50.
- Năm độ khó cho Thảo phạt và Truy Nã; nội dung Lữ Hành và Siêu Trùm giữ cấp cố định.
- Rèn Luyện, Phá Giới, Thẻ Quét và nhiệm vụ ngày thứ sáu. Không khôi phục Hầm Ngục Ảo Ảnh.
- Save v7 tự chuyển từ v1–v6; không đổi thư mục lưu, tên hồ sơ, trang bị, cờ truyện hoặc thưởng lần đầu.

## Quy tắc tiến trình

EXP cần từ L lên L+1 = `80 + 20×(L−1) + 2×(L−1)²`. Nhân vật trong đội xuất phát nhận đủ EXP, kể cả gục; dự bị không nhận. EXP thưởng một lần sau chiến thắng cuối cùng, không thưởng theo từng wave.

Ở cap tạm thời, chỉ tích tối đa EXP của đúng một cấp kế tiếp. Phần dư bị bỏ, được cảnh báo trước Quest/Rèn Luyện/Quét và ghi trong kết quả. Đột Phá xử lý EXP đã tích ngay, không cấp thêm điểm ngoài việc lên cấp. Level 50 luôn có `xp = 0`.

| Chỉ số | Mỗi lần nâng | Giá điểm |
| --- | --- | --- |
| HP | +5 | 1 |
| MP | +2 | 1 |
| ATK / MAG / DEF / RES | +1 | 1 |
| SPD | +1 | 2 |

Điểm khả dụng = `Level − 1 − tổng chi phí đã phân bổ`. Giới hạn số lần nâng từng chỉ số thường: `min(25, ceil((L−1)/3))`; SPD: `min(10, ceil((L−1)/6))`. Level 50 tương ứng 17 và 9. Phần cộng phẳng từ Level được tính trước trang bị, Trấn, cộng đội hình và buff phần trăm.

Phân bổ, đặt lại và Đột Phá bị khóa trong trận/chuyến hoặc khi chưa lưu thưởng chiến thắng. Đặt lại miễn phí trong bản playtest, giữ Level, EXP và nâng cấp truyện. Cần bấm Áp dụng để lưu; thay đổi nháp chưa ảnh hưởng chiến đấu.

Không giảm trần né của Chelsea xuống 90%. SPD trang bị, Trấn và phân bổ đều là SPD căn bản. Ví dụ 28 + 9 phân bổ + 6×8 Gear IV + 10 Trấn = 95 SPD, tương ứng 97% né nội tại; buff SPD phần trăm trong trận không được tính vào công thức này.

## Quest và đối thủ

| Độ khó | Level | EXP Normal | EXP Boss | EXP Truy Nã | Hệ số Coin/Vụn |
| --- | --- | --- | --- | --- | --- |
| Rất dễ | 5 | 40 | 80 | 120 | ×1 |
| Dễ | 15 | 150 | 300 | 450 | ×1,25 |
| Trung bình | 25 | 340 | 680 | 1.020 | ×1,5 |
| Khó | 35 | 615 | 1.230 | 1.845 | ×1,75 |
| Rất khó | 45 | 965 | 1.930 | 2.895 | ×2 |

Thưởng farm giữ xác suất 50% Coin / 50% Vụn, làm tròn sau hệ số. Thưởng độc nhất dùng chung Quest ID giữa cả năm mức. Độ khó được giữ trong URL, kết quả và Đánh lại. Mặc định Normal ở Rất dễ; Boss/Truy Nã ở Trung bình, để phản ánh vị trí thử thách của chúng. Người chơi có thể chọn mọi mức ngay.

Story không nhận EXP. Iris/Fiona/Takeshi lần lượt có cấp chương 5/15/20; truyện nhân vật gacha có 15/20/25. Hắc ảnh Arthur cấp 30, Alice/Miraebolis cấp 60 và không nhận EXP. Không có phạt chênh lệch cấp.

Mỗi enemy giữ `referenceLevel`: chỉ số JSON là chỉ số đúng ở cấp đó. Quái thường gắn với nội dung ban đầu, enemy riêng truyện gắn với cấp chương, boss riêng gắn với thử thách. Quái dùng chung nhiều nội dung lấy mốc sớm nhất; đây là baseline cần playtest tiếp, không tự thay chỉ số gốc.

`Stat(L) = round(templateStat × F(L)/F(referenceLevel) × override)`; chỉ làm tròn một lần. Tăng trưởng HP 3%, MP 1%, ATK/MAG 1,2%, DEF/RES 0,8%, SPD 0,15% mỗi L−1. Milestone cộng vào F tại 20/30/40/50/60: offense 4/5/6/7/8%, defense 2/2/3/3/4%. Không nhân chồng milestone.

Mỏ Vàng và Hiểm Trở giữ hệ số hiện tại và dùng đúng chỉ số ở referenceLevel, không chồng scale Level lên hệ số cũ. Rèn Luyện/Phá Giới dùng cấp cố định bên dưới; trinh sát và combat dùng cùng hàm scale.

## Bốn loại hầm ngục

| Loại | Dễ | Trung bình | Khó | Giới hạn |
| --- | --- | --- | --- | --- |
| Mỏ vàng | Giữ hiện tại | Giữ hiện tại | Giữ hiện tại | 3/ngày |
| Hiểm trở | Giữ hiện tại | Giữ hiện tại | Giữ hiện tại | 1/ngày |
| Rèn Luyện | Lv15, 3 đợt, 360 EXP/người | Lv30, 4 đợt, 900 EXP/người | Lv45, 5 đợt, 1.900 EXP/người | Tích tối đa 9 |
| Phá Giới | Lv20, 1 phòng, 1 Tinh Thạch | Lv30, 2 phòng, 2 Tinh Thạch | Lv40, 3 phòng, 3 Tinh Thạch | 2/ngày |

Rèn Luyện bắt đầu với 9 lượt. Hồi +3 đúng 00:00 / 08:00 / 16:00 giờ Việt Nam, tính cả offline; chạm 9 thì dư mất, không giữ ngân hàng lượt. Không reset về 9 vào nửa đêm. Đồng hồ chạy lùi không tạo thêm lượt. Các giới hạn khác reset 00:00 giờ Việt Nam.

Pool Rèn Luyện dùng Quest normal. Pool Phá Giới dùng boss thường, bỏ truyện, Truy Nã, siêu trùm. Chọn không trùng trong chuyến. Phá Giới hiển thị Phòng 1/2/3 và đội địch trong modal xuất phát. Giữ hành vi chuyển wave hiện có: nhân vật và tài nguyên chiến đấu được mang tiếp, không cộng XP giữa wave.

Thất bại/bỏ chuyến không trừ lượt nhận thưởng; chiến thắng cuối chuyến chỉ trừ lượt khi lưu thành công. Với lượt theo ngày, tính ngày nhận thưởng (giữ quy tắc engine hiện có). Với Rèn Luyện, hồi lượt rồi trừ một tại thời điểm nhận thưởng.

## Thẻ Quét và nhiệm vụ ngày

Thẻ nằm trong Túi đồ → Vật phẩm. Quét chỉ áp dụng hầm ngục đã chiến thắng đúng độ khó; một thẻ + một lượt nhận thưởng đổi cả chuyến. Dùng đội hiện tại để nhận EXP. Không Quét khi đang có trận/chuyến chưa kết thúc hoặc thưởng chưa lưu. Quét tính hoàn thành dungeon và nhiệm vụ ngày như đánh thật. Không tiêu thẻ nếu thiếu lượt hoặc lưu lỗi.

Nhiệm vụ thứ sáu: hoàn thành Rèn Luyện hoặc Phá Giới, nhận 2 Thẻ Quét. Đồng thời được tính vào nhiệm vụ thám hiểm chung.

| Số nhiệm vụ hoàn thành | Thưởng mốc |
| --- | --- |
| 1 | 500 Coin |
| 2 | 3 Pure Prisma |
| 3 | 2 Thẻ Quét |
| 4 | 1.500 Coin |
| 5 | 5 Pure Prisma |
| 6 | 1 Original Prisma |

Tối đa 4 Thẻ Quét/ngày từ nhiệm vụ và mốc. Các mốc đã nhận trên save cũ được chuyển theo đúng loại thưởng, tránh nhận Original lần hai trong ngày nâng cấp.

## Lưu và hướng mở rộng

Save v7 thêm `levelProgressionVersion:1`, `characters[id].xp/allocations/limitBreakRank`, `limitBreakStones`, `sweepTickets`, `trainingCharges`, `dungeonClearedDifficulties`. Tiến trình ngày có version2. EXP/phân bổ không lưu bản sao chỉ số combat.

Save trước hệ Level giữ Level cũ tối đa50, rank phù hợp, EXP0, phân bổ rỗng. Nhân vật nội dung mới khởi đầu Level1, không tự mở khóa. Không sửa file save thực để kiểm thử.

Các giao dịch clone trạng thái → kiểm tra → lưu → mới thay trạng thái đang chạy. Nếu ghi đĩa lỗi, giữ EXP, vật liệu, quota, thẻ, cờ thưởng cũ; retry không quay lại RNG hay trả thưởng hai lần.

Cấu hình playtest nằm ở `data/progressionRules.json`, `data/dungeons.json`, `data/enemies.json` và `data/encounters.json`. Logic dùng lại: `leveling.js`, `quest-difficulty.js`, `training-charges.js`, `enemy-scaling.js`, `dungeon.js`. Các giá trị EXP/thưởng đã được người thiết kế duyệt để playtest, chưa phải cân bằng cuối cùng.
