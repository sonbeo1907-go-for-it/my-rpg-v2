# Angelica — Thuật Sư Hậu Cần

Thuật Sư hệ Quang, **Kị sĩ Sư đoàn Viễn Chinh** (`expedition_corps`), release 99. Cô gái trẻ mới tốt nghiệp Học viện Ma pháp, gia nhập hội hậu cần và bám theo người dẫn đường nhanh nhất của đội.

## Chỉ số nền

HP165 / MP130 / ATK8 / MAG24 / DEF14 / RES24 / **SPD1**.

## Nội tại — Bám Nhịp Hậu Cần

`type: speed_lock_ally`.

- Một lần ở đầu trận, khóa đồng đội còn sống có **SPD căn bản cao nhất** (không tính Angelica).
- Khi người đó còn sống: **SPD của Angelica = SPD căn bản của người đó − 1**.
- Nếu người đó gục: SPD của Angelica trở về **1**.
- Không đổi sang đồng đội khác khi người được khóa gục; không chạy lại mỗi vòng.
- Chỉ dùng SPD căn bản của người được khóa, không dùng buff/debuff SPD tạm thời.

## Kỹ năng

| Kỹ năng | MP / CD | Hiệu ứng |
| --- | --- | --- |
| Ấn Phong Hậu Cần `angelica.seal` | 15 / 0 | **100% MAG** toàn địch; áp **Phong Ấn** 1 lần chặn buff mới |
| Nghi Thức Hỗn Loạn `angelica.curse` | 24 / 2 | Toàn địch: **Nhiễu Ma Lực**, **Vết Thương Sâu** 2 lượt, giảm **15% DEF/RES** 2 lượt |
| Dấu Ấn Ngưng Đọng `angelica.iconic` | 30 / 6 | **180% MAG** toàn địch; kéo dài **+1 vòng hồi chiêu** của mọi kỹ năng địch có cooldown tối thiểu 1 |

### Skill hợp lệ của iconic

- Có `cooldown >= 1`, kể cả kỹ năng tiêu tài nguyên ngoài MP.
- Kỹ năng `cooldown 0`/không CD và kỹ năng passive không bị ảnh hưởng.
- Nếu kỹ năng đang sẵn sàng, nó vào cooldown 1 vòng; nếu đang hồi, cộng thêm 1 vòng.

## VFX

Iconic dùng presentation riêng **`angelica_iconic`**, component `AngelicaGlyph`: vòng tròn ánh sáng, rune và dấu ấn xoay, tách khỏi VFX sách/phán quyết của Sandra và các glyph hiện có.
