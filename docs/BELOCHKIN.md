# Belochkin — Đại Tướng Viễn Chinh

Hỗ trợ tấn công hệ Phong, **Kị sĩ Sư đoàn Viễn Chinh** (`expedition_corps`), release 97. Belochkin điều phối đội hình bằng các nhóm kỹ năng và biến nhịp phối hợp thành MP cho toàn đội.

## Chỉ số nền

HP160 / MP90 / ATK32 / MAG10 / DEF18 / RES20 / SPD24. MAG10 là mức điền nền vì brief không ghi MAG.

## Nội tại — Nhịp Tiến Công

`type: round_category_mp`, `ratio: 0.08`, `requiredCategories: 2`.

- Cuối vòng, nếu đội đã dùng ít nhất **2 trong 3 nhóm** kỹ năng trong vòng:
  1. Khiên hoặc hồi phục/revive.
  2. Tấn công đơn mục tiêu.
  3. Tấn công đa mục tiêu.
- Hồi **8% MP tối đa** cho toàn đội còn sống; `ceil` theo MP tối đa hiện tại.
- Chỉ xét kỹ năng chủ động cast thành công; đánh thường, Phòng thủ và kỹ năng passive không tính.
- Mỗi nhóm chỉ cần xuất hiện một lần; Belochkin phải còn sống khi kết toán cuối vòng.

## Kỹ năng

| Kỹ năng | MP / CD | Hiệu ứng |
| --- | --- | --- |
| Gió Xé Tuyến `belochkin.gale` | 8 / 0 | **120% ATK** toàn địch; giảm **25% DEF** trong 2 lượt chính |
| Lệnh Tiến Công `belochkin.command` | 25 / 3 | Bản thân + một đồng đội khác: **+40% ATK** trong 3 lượt chính; cả hai nhận **Lượt Thêm** |
| Bão Gươm Viễn Chinh `belochkin.storm` | 18 / 2 | **280% ATK** toàn địch; toàn đội nhận **+35% sát thương vật lý** cho **2 lần gây sát thương** |

- Lệnh Tiến Công cho người chơi **chọn trực tiếp một đồng đội khác**; Belochkin và đồng đội đó cùng nhận buff và Lượt Thêm. Không tự ưu tiên theo tag hay thứ tự ô.
- Mốc **+40% ATK** là tại **Kĩ Năng Cấp Độ 1**; vì là buff tăng Rank, từ Rank 2 trở lên hệ số tăng theo chuẩn `stat_buff`.
- Thế Công Phá là buff persistent có `damageUses: 2`; chỉ khuếch đại đòn **vật lý**, tiêu 1 lần cho mỗi hành động gây sát thương trực tiếp.
- Các buff/debuff dùng clock `main_turn` chuẩn.

## Kiểm chứng

`test/belochkin-chen.test.js`: danh tính/chỉ số, command cấp buff + Lượt Thêm cho hai người, storm cấp buff toàn đội, nội tại hồi MP khi đủ 2 nhóm kỹ năng.
