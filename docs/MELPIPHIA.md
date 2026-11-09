# Melpiphia — Hỗ Trợ Tấn Công

Hỗ trợ tấn công hệ Thủy, **Kị sĩ Sư đoàn Viễn Chinh** (`expedition_corps`), release 100. Nghiêm túc khi đánh đấm, tưng tửng ngoài giờ làm việc.

## Chỉ số nền

HP150 / MP100 / ATK10 / MAG30 / DEF18 / RES22 / SPD20. SPD20 là mức điền nền vì brief không ghi SPD.

## Nội tại — Tiếp Nước

`type: water_ally_mp`, `ratio: 0.025`.

- Cuối vòng, hồi **2,5% MP tối đa** cho toàn đội với **mỗi đồng đội hệ Thủy còn sống**, không tính Melpiphia.
- Ví dụ 1 đồng đội Thủy khác: toàn đội hồi 2,5% MP; 2 đồng đội: 5% MP.
- Hồi theo MP tối đa hiện tại, làm tròn lên, không vượt trần MP.

## Kỹ năng

| Kỹ năng | MP / CD | Hiệu ứng |
| --- | --- | --- |
| Mũi Nước Dò Đường `melpiphia.strike` | 8 / 1 | **160% MAG** một địch; áp **3 tầng Sơ hở Thủy** |
| Dòng Nước Dẫn Lối `melpiphia.bless` | 15 / 2 | Chọn **một đồng đội hệ Thủy**: **+40% MAG** trong 3 lượt chính và **1 Lượt Thêm** |
| Xoáy Nước Nặng `melpiphia.undertow` | 18 / 2 | **350% MAG** một địch; giảm **30% RES**, **15% SPD** trong 3 lượt chính; bản thân nhận **1 Lượt Thêm** |

- Bless chỉ chọn được nhân vật hệ Thủy; có thể chọn chính Melpiphia nếu còn sống.
- Lượt Thêm tuân luật tối đa 1 lần/người/vòng.
- Các buff/debuff dùng clock `main_turn` chuẩn.
