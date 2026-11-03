# Khám phá hầm ngục

Nguồn: data/dungeons.json; dungeon.js, dungeon-rules.js, training-charges.js. **Ảo Ảnh đã gỡ**, dữ liệu legacy chỉ phục vụ tương thích save.

| Loại | Dễ | Trung bình | Khó | Lượt |
| --- | --- | --- | --- | --- |
| Mỏ vàng | Lv15,3 đợt,1000 Coin | Lv30,4 đợt,2000 Coin | Lv45,4 đợt,3000 Coin |3/ngày |
| Hiểm trở | Lv15,1 phòng,1 Pure | Lv30,2 phòng,3 Pure | Lv45,2 phòng,5 Pure |1/ngày |
| Rèn Luyện | Lv15,3 đợt,360 XP/người | Lv30,4 đợt,900 XP/người | Lv45,5 đợt,1900 XP/người |Tích9; hồi3 lúc00/08/16h Việt Nam |
| Phá Giới | Lv20,1 phòng,1 Tinh Thạch | Lv30,2 phòng,2 Tinh Thạch | Lv40,3 phòng,3 Tinh Thạch |2/ngày |

Rèn Luyện không reset9 vào nửa đêm; dư vượt9 bị bỏ, tính cả offline, đồng hồ lùi không tạo thêm lượt. Quota ngày tính theo ngày lưu thưởng, reset00:00 Việt Nam.

## Pool và scale

Pool normal cho Mỏ vàng/Rèn Luyện, boss hợp lệ cho Hiểm trở/Phá Giới. dungeon-rules lọc dungeonEligible, truyện/Chronicle/Truy Nã/siêu trùm; không chọn trùng encounter trong chuyến.

HP/ATK/MAG dùng Level, override=1 cho Mỏ vàng/Hiểm trở. **Không chồng hệ số cũ** HP1,1/1,75/1,9 hoặc ATK/MAG1,25/1,6. Hệ số MP cũ vẫn có: Mỏ1,5/2,25/2,25; Hiểm trở1,2/1,6/2. HP curve chọn theo encounter; raw stats ở Lv1. Preview/trinh sát/trận dùng cùng context.

Hiểm trở/Phá Giới dùng Phòng1/2/3 trong modal xuất phát. Danh sách trinh sát giữ theo hồ sơ/độ khó/ngày trong sessionStorage; xác nhận dùng đúng danh sách, không âm thầm roll lại. Hết hạn/sai pool phải từ chối. Footer cố định có chỉnh đội/hủy/xuất phát.

## Carry và thưởng

Giữ actor snapshot qua wave: HP/MP kể cả người gục, status, khiên/nguồn, tài nguyên, CD và mode. Không resolve lại loadout ngoài trận. Vòng/queue mới theo engine; ID quái mới phân biệt theo wave, nguồn cũ giữ riêng.

Không thưởng Coin/XP/lần đầu của Quest từng phòng. Chỉ cuối chuyến nhận tổng thưởng. Phòng giữa giữ Magnamut và rifts, không refund35%; boss phase cùng battle, không giả mode exit.

Thua/hòa/bỏ dở không thưởng hoặc trừ quota nhận thưởng. Thắng cuối lưu thưởng+quota+XP+daily cùng transaction. Failed-save retry không reroll. Chuyến thông thường chỉ ở RAM; đổi route giữ runtime, reload không khôi phục battle (Chronicle là cơ chế khác).

## Quét và farm

Quét ở modal xuất phát: đã thắng đúng độ khó, một thẻ+một lượt đổi cả chuyến; đội hiện tại nhận XP nếu nội dung đó cấp XP. Không tiêu nếu lưu lỗi. Sau commit hiện BattleResult, đóng kết quả không nhận lại. Quét tính daily như đánh thật.

Farm1–999 dùng AI, không tiêu Thẻ Quét; kiểm tra quota trước chuyến kế, không chạy offline. Xem AUTO_FARM và COMBAT_MENUS.
