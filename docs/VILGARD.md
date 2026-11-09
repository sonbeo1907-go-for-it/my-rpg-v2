# Vilgard — Kẻ Mang Mối Thù Không Tàn

DPS vật lý Ám, **Kị sĩ Sư đoàn Viễn Chinh** (`expedition_corps`), release 95. Hắn không né tránh cái chết: mỗi lần gục là một lần trỗi dậy với thêm Ám Ảnh, rồi trút toàn bộ mối thù vào đòn diện rộng.

## Chỉ số nền

HP175 / MP90 / ATK40 / MAG8 / DEF18 / RES18 / SPD18. MAG8 là mức điền nền vì brief không ghi MAG; các chỉ số khác lấy đúng yêu cầu.

## Nội tại — Mối Thù Chưa Trả

`vengeful_revive`, `cooldownRounds: 5`, `hpRatio: 1`, `statusId: obsession`, `stacks: 5`.

- **Mỗi 5 vòng một lần**, khi Vilgard thực sự gục: hồi sinh ngay, đầy HP/MP, nhận **Lượt Thêm** và **5 tầng Ám Ảnh**. Khiên cũ bị xóa; trạng thái cũ bị dọn như hồi sinh chuẩn, chỉ giữ Vết Thương Sâu.
- Cooldown tính từ lần hồi sinh gần nhất: hồi sinh ở vòng R thì lần kế tiếp sớm nhất là vòng **R+5**. Gục trong thời gian chờ thì chết bình thường.
- Hồi sinh trả sạch nợ HP (Kế Ước Thế Chấp) nhưng không xóa các debuff khác đang có.
- Lượt Thêm tuân luật chung: chỉ cấp một lần/người/vòng; nếu đang ở Vòng Phụ thì hiệu ứng cấp lượt bị bỏ qua nhưng vẫn hồi sinh và nhận Ám Ảnh.
- Hồi sinh phát một event `revive`; không kích hoạt lại nếu đang trong cooldown.

### Ám Ảnh

`status obsession`: buff vĩnh viễn, tối đa **5 tầng**, mỗi tầng **+10% ATK** (`modifiersPerStack`). Không tự hết theo vòng; bị tiêu khi dùng Trả Thù Toàn Diện.

## Kỹ năng

| Kỹ năng | MP / CD | Hiệu ứng |
| --- | --- | --- |
| Truy Sát Không Rời `vilgard.pursuit` | 6 / không CD | **180% ATK** vào mục tiêu chỉ định; nếu còn kẻ địch khác, thêm **180% ATK** vào một mục tiêu ngẫu nhiên khác. Tạo **1 Ám Ảnh** |
| Nhát Chém Oán Hận `vilgard.cleave` | 8 / CD1 | Mục tiêu chính **220% ATK**, mục tiêu kề **150% ATK**; áp **Rạn Khiên 2 lượt**. Tạo **2 Ám Ảnh** |
| Trả Thù Toàn Diện `vilgard.reckoning` | 20 / CD3 | **380% ATK** toàn địch; mỗi tầng Ám Ảnh xuyên thêm **20% DEF**, tối đa +100%. Tiêu toàn bộ Ám Ảnh sau khi thi triển |

- Hit phụ của Truy Sát dùng đúng hệ số 180%, cùng hệ vật lý/Ám và cùng một hành động; không chọn lại mục tiêu chính.
- Xuyên DEF của Trả Thù cộng vào xuyên giáp của đòn, không vượt quá 100% DEF hiệu dụng.
- Rạn Khiên dùng status chung `shield_fracture`, thời hạn 2 lượt chính của mục tiêu.
- Mọi buff/debuff dùng clock `main_turn` chuẩn; Ám Ảnh là persistent nên không tick theo lượt.

## Trấn Phái — Lưỡi Kiếm Oán Hận

`vilgard.grudge`, mở bằng **10 Bản Thiết Kế** tại Shop, chế tạo tại Thợ Rèn.

- Ngay sau khi hồi sinh từ nội tại, **hồi chiêu Trả Thù Toàn Diện** (`vilgard.reckoning`) về 0.
- Không hồi chiêu các kỹ năng khác; nếu chiêu đang sẵn sàng thì giữ nguyên.
- Không áp dụng cho hồi sinh từ kỹ năng của đồng đội (Amaryllis), chỉ cho nội tại của Vilgard.

## Kiểm chứng

`test/vilgard.test.js`: chỉ số/phe/banner/AI, cộng dồn và trần Ám Ảnh, hit phụ ngẫu nhiên (có/không có kẻ khác), cleave + Rạn Khiên + 2 tầng, AoE tiêu tầng/xuyên DEF, hồi sinh đầy HP + Lượt Thêm + 5 tầng, cooldown 5 vòng, Trấn hồi chiêu sau hồi sinh. Tài liệu Iwayn liên quan ở [TRUE_STRIKE](TRUE_STRIKE.md) và [EXCLUSIVE_BALANCE](EXCLUSIVE_BALANCE_2026_11_06.md).
