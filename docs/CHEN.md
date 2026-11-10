# Chen — Kiếm Sĩ Lao Vào Trận

DPS vật lý hệ Thường, **Kị sĩ Sư đoàn Viễn Chinh** (`expedition_corps`), release 98. Chen chỉ quan tâm kẻ mạnh nhất: có trùm là vào thế quyết đấu, càng đánh càng dồn lực.

## Chỉ số nền

HP180 / MP90 / ATK38 / MAG8 / DEF22 / RES16 / SPD16. MAG8 là mức điền nền vì brief không ghi MAG.

## Nội tại — Lưỡi Kiếm Quyết Đấu

`type: boss_hunter_mode`, `modeId: duelist_edge`.

- Khi có ít nhất một kẻ địch là **trùm hoặc siêu trùm** còn sống, Chen tự vào combatMode **Quyết Đấu**.
- Rời dạng ngay khi **toàn bộ** trùm/siêu trùm gục; nếu không còn trùm thì không tự vào lại.
- Trong dạng:
  - **+10 ATK căn bản**.
  - **+35% ATK**.
  - Nhận **Thăng Tiến** (`escalation`) bound với dạng, không thể bị dispel.
- Các hiệu ứng của dạng gắn với combatMode; không bị xóa bởi dispel thông thường.

## Kỹ năng

| Kỹ năng | MP / CD | Hiệu ứng |
| --- | --- | --- |
| Nhất Trảm `chen.slash` | 5 / 0 | **200% ATK** một địch; giảm **30% DEF** trong 2 lượt chính |
| Song Trảm `chen.double` | 6 / 0 | **2 hit × 120% ATK**; tạo **1 tầng Sơ hở — Thường** |
| Lục Kiếm Quyết `chen.fulfill` | 20 / 2 | **5 hit × 160% ATK**, kết thúc bằng **1 hit 240% ATK** |

- Song Trảm gắn Sơ hở một lần sau chuỗi hit, không gắn hai tầng theo số hit.
- Lục Kiếm Quyết là 6 hit trong cùng một hành động; mỗi hit xét né/giáp/khiên riêng.
- Các debuff dùng clock `main_turn` chuẩn.

## Kiểm chứng

`test/belochkin-chen.test.js`: tự vào Quyết Đấu trước trùm, cộng đúng ATK căn bản và 35%, Thăng Tiến bound, rời dạng khi toàn bộ trùm gục; kiểm tra DEF break, 1 tầng Sơ hở và tổng 6 hit của Lục Kiếm Quyết.
