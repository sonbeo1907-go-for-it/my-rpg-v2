# Brant — Lá chắn của Hội Thợ Săn

> **Ghi chú phiên bản:** nhân vật mới, triển khai 04/11/2026 theo yêu cầu thiết kế. Số liệu là bản đầu tiên cần playtest. Luật chung ở [ENGINE_RULES](ENGINE_RULES.md), vòng đời ở [COMBAT_LIFECYCLE_CONTRACT](COMBAT_LIFECYCLE_CONTRACT.md).

## Định danh

Thợ săn kỳ cựu của **Hội Thợ Săn**, `roleGroup: tank`, hệ Thường. Chuyên bảo vệ đồng đội bằng **Che chắn + Khiêu Khích**, đổi lại bản thân phải đủ dày để trụ.

## Chỉ số thô

Plain / tank · HP300 / MP90 / ATK24 / MAG8 / DEF30 / RES22 / SPD12.

Bản nerf 04/11/2026 (sau playtest PvP): HP 400→300, DEF 44→30, RES 28→22, nội tại giảm đòn 50%→20%, Che chắn giảm 40%→15%, khiên 300% DEF + 50 → 200% DEF + 30, CD 2→3 và MP 14/12→16/14.

SPD thấp có chủ ý: anh hành động sau cùng trong vòng, nên kỹ năng che chắn phải có thời hạn đủ dài để phủ cả Vòng Phụ.

## Kỹ năng

| Kỹ năng | MP / CD | Hiệu ứng |
| --- | --- | --- |
| Khiên Sắt Tiền Tuyến `brant.bulwark` | 16 / CD3 | Khiên bản thân 200% DEF + 30, giữ 3 vòng |
| Lời Hứa Chắn Trước `brant.challenge` | 14 / CD3 | Toàn đội nhận Che chắn (đơn mục tiêu, diện rộng, Liên kích) và Brant nhận Khiêu Khích trong 2 lượt chính |

Khiên dùng `growthProfile: shield` (×1,1 mỗi Rank). Lời Hứa là kỹ năng tiện ích cố định, không có cấp nâng.

## Che chắn mở rộng

Trạng thái `brant_guard` (do Lời Hứa cấp cho cả đội) có ba cờ:

- `cover` — nhận đòn thay người mang như Che chắn cũ (Garrek/Leonardo).
- `coverArea` — **chắn cả đòn diện rộng**: mỗi đồng đội trúng AoE đều được chuyển sang Brant.
- `coverReactions` — **chắn cả Liên kích/phản công**: cú quật thứ hai của Joshua vẫn bị hút về Brant.

Cơ chế gốc vẫn giữ nguyên: chỉ trạng thái có cờ tương ứng mới chắn loại đòn đó, nên Che chắn cũ của Garrek/Leonardo không đổi hành vi.

Bổ sung: nếu Brant gục, Che chắn mất hiệu lực (nguồn phải còn sống). Brant không chắn đòn nhắm chính mình.

## Đồng bộ Che chắn và Khiêu Khích

Hai buff được cấp cùng lúc bởi Lời Hứa và dùng **cùng một loại đồng hồ thời hạn**: `brant_guard` và `brant_taunt` đều có `durationClock: "main_turn"`, `duration: 2`.

- Cả hai chỉ giảm khi kết thúc **lượt chính của Brant**; Vòng Phụ không bào thời hạn, nên buff không bị lệch nhau khi Brant có Lượt Thêm.
- Lượt bị **choáng ở Vòng Chính** vẫn tính: cả hai cùng giảm một mức.
- Lượt bị **choáng ở Vòng Phụ** không làm giảm thời hạn của cả hai.
- Khi Brant còn buff, Khiêu Khích vẫn buộc đòn đơn mục tiêu của địch nhắm vào anh — kể cả trong Vòng Phụ.
- Hết 2 lượt chính thì Che chắn và Khiêu Khích rời đi **cùng lúc**.

## Nội tại · Thân Chắn Bão Tố

`type: cover_guard`, `ratio: 0.2`.

Khi **thực sự nhận đòn thay đồng đội**, giảm thêm **20%** sát thương của đòn đó.

- Chỉ áp dụng khi Che chắn đổi mục tiêu sang Brant; đòn đánh trực tiếp vào anh không hưởng.
- Nhân riêng với giảm đòn Che chắn từ Trấn Phái (Garrek) và với giảm sát thương thường; tổng hệ số giảm đòn chắn bị chặn ở 70%.
- Không giảm sát thương định kỳ và không đổi lượng khiên hấp thụ.

## Cân bằng: hai kịch bản bắt buộc

Cả hai chạy **dưới luật PvP Arena** (`arena-0.2.0`): content đi qua `preparePvpContent`, campaign chuẩn hóa Lv50/Rank5, battle có `pvpRules` (soft cap, loop guard), đội bị đánh gồm Brant và ba đồng đội mỏng, đội địch dùng chính kit thật trong dữ liệu (`test/brant.test.js`).

| Kịch bản | Diễn biến | Kết quả dưới soft cap PvP |
| --- | --- | --- |
| **Mori được Artesia buff** | Vòng 1 Artesia dùng Song Tinh (+25% ATK); Brant dựng khiên. Vòng 2 Artesia dùng Ánh Sao Định Mệnh (+30% sát thương), Mori dùng Lôi Kiếm Vô Câu (+40% ATK, Lượt Thêm), rồi Vạn Lý Lôi Vũ trong Vòng Phụ | Brant chắn cả bốn hit, **khiên vỡ hết**, còn **172/385 HP (45%)**; đồng đội **không mất HP** |
| **Joshua Kế Hoạch B** | Joshua xuống dưới 50% HP, vào dạng, nhận Lượt Thêm; dùng Nanh Lửa + Liên kích Bữa Tiệc (đòn lan) | Ba hit 111 / 93 / 27 sau soft cap; Brant còn **154/385 HP (40%)**, đồng đội **không mất HP**, phần lan cũng bị chắn |

Hai kịch bản là **điều kiện nghiệm thu tối thiểu**, không chứng minh cân bằng ở mọi cấu hình: Brant vẫn có thể chết nếu ăn thêm đòn khác trong cùng vòng, nếu không kịp dựng khiên trước khi địch hành động, hoặc nếu luật PvP đổi soft cap.

## Chiêu Mộ

Đã có trong pool banner `standard` ("Tiếng gọi Prisma") cùng toàn bộ nhân vật chính thức khác. Chưa chạy playtest cân bằng trong Đấu Trường dù AI profile đã có.

## Giới hạn đã biết

- Chưa có VFX riêng; dùng hiệu ứng khiên/che chắn chung.
- Khiên 3 vòng và Che chắn 2 lượt chính đã có test cho nhánh choáng Vòng Chính/Vòng Phụ; chưa test trường hợp Brant gục giữa lúc đồng đội còn Che chắn (theo luật, Che chắn tắt ngay khi nguồn gục).
- AI Đấu Trường có profile ưu tiên Che chắn/Khiên nhưng chưa playtest cân bằng.

## Kiểm chứng

`test/brant.test.js`: định danh/chỉ số, Che chắn áp lên cả đội + Khiêu Khích giới hạn mục tiêu, chắn đòn đơn mục tiêu, chắn AoE, giảm 50% đòn chắn so với đòn trực tiếp, **hai kịch bản Mori/Artesia và Joshua chạy dưới `pvpRules` Arena (soft cap + chuẩn hóa Lv50)**, đồng bộ hai buff qua lượt chính + Vòng Phụ, choáng ở Vòng Chính và Vòng Phụ, pool Chiêu Mộ. Mỗi kịch bản còn khẳng định log có `[PvP arena-0.2.0] … soft cap` để chắc chắn luật PvP thực sự có hiệu lực.
