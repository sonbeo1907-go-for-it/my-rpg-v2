# Ardelia — Quân Y Tiền Tuyến

Hỗ trợ phòng thủ hệ Thủy, **Kị sĩ Sư đoàn Viễn Chinh** (`expedition_corps`), release 96. Cô giữ tuyến bằng DEF/RES, hồi máu, giải debuff và dựng Khiên từ RES.

## Chỉ số nền

HP240 / MP125 / ATK10 / MAG14 / DEF24 / RES32 / SPD15. SPD15 là mức điền nền vì brief không ghi SPD.

## Nội tại — Tuyến Phòng Thủ Quân Y

`type: living_team_flat_guard`, `modifiers: { defense: 10, resistance: 10 }`.

- Khi Ardelia còn sống, **toàn đội +10 DEF và +10 RES căn bản**.
- Cộng vào chỉ số nền trước phần trăm buff; Ardelia gục thì mất ngay.
- Không cần cùng hàng, cùng tag hay đứng gần; áp cho mọi đồng đội còn sống, gồm bản thân.

## Kỹ năng

| Kỹ năng | MP / CD | Hiệu ứng |
| --- | --- | --- |
| Ca Mổ Tiền Tuyến `ardelia.triage` | 12 / không CD | Hồi HP toàn đội bằng **50% RES**; tăng **20% DEF/RES** toàn đội trong **3 lượt chính** |
| Lá Chắn Quân Y `ardelia.aegis` | 10 / không CD | Giải toàn bộ debuff trên đồng đội; tạo **Khiên 80% RES** |
| Sóng Xung Kích `ardelia.purge` | 18 / CD2 | **240% RES** toàn địch; giảm **15% ATK/MAG** trong **3 lượt chính** |

- Buff `ardelia_guard` và debuff `ardelia_weaken` dùng clock `main_turn`, không tick ở Vòng Phụ.
- Khiên không cộng dồn; chỉ thay thế Khiên yếu hơn.
- Skill 1 và 3 tăng theo Rank chuẩn; Skill 2 tăng lượng Khiên theo Rank.

## Trấn Phái — Huy Hiệu Quân Y

`ardelia.field_kit`, mở bằng **10 Bản Thiết Kế** tại Shop, chế tạo tại Thợ Rèn.

- Sau khi dùng **Lá Chắn Quân Y**, tạo Khiên toàn đội bằng **120% RES** (thay vì 80% RES); lượng Khiên tăng theo Rank của kỹ năng.
- Đồng thời cấp **Hộ Ấn** (`effect_ward`) cho toàn đội để chặn hiệu ứng bất lợi tiếp theo.
- Khiên mạnh nhất được giữ; Khiên Trấn không cộng dồn.

## Kiểm chứng

`test/ardelia-exclusives.test.js`: chỉ số/phe/banner/AI, aura +10 DEF/RES khi còn sống, hồi máu + buff DEF/RES, cleanse + Khiên, damage + debuff ATK/MAG, Trấn tăng Khiên theo RES và cấp Hộ Ấn.
