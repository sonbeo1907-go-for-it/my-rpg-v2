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
| Lời Hứa Chắn Trước `brant.challenge` | 14 / CD3 | Bản thân Brant nhận hào quang Che chắn toàn đội + Khiêu Khích, cùng kéo dài 2 lượt chính của Brant |

Khiên dùng `growthProfile: shield` (×1,1 mỗi Rank). Lời Hứa là kỹ năng tiện ích cố định, không có cấp nâng.

## Che chắn toàn đội

Lời Hứa không gắn buff lên từng đồng đội. Nó gắn **một trạng thái `brant_guard` lên chính Brant** với cờ `coverTeam`, và engine coi đó là hào quang che chắn của cả đội:

- `cover` + `coverTeam` — mọi đòn giáng vào đồng đội được chuyển sang Brant khi anh còn sống.
- `coverArea` — **chắn cả đòn diện rộng**: từng đồng đội trúng AoE đều chuyển sang Brant.
- `coverReactions` — **chắn cả Liên kích/phản công**: cú quật thứ hai của Joshua vẫn bị hút về Brant.

Vì trạng thái nằm trên Brant, thời hạn chỉ có **một đồng hồ duy nhất**:

| Tình huống | Che chắn có giảm? |
| --- | --- |
| Đồng đội hành động (kể cả kết thúc lượt chính của họ) | **Không** |
| Brant kết thúc lượt chính | **Có** — giảm một mức, áp dụng ngay cho cả đội |
| Brant nhận Lượt Thêm / hành động ở Vòng Phụ | **Không** |
| Brant bị choáng ở Vòng Chính (lượt bị bỏ) | **Có** — tính như một lượt chính đã trôi qua |
| Brant bị choáng ở Vòng Phụ | **Không** |
| Brant gục | **Ngừng nhận đòn thay ngay lập tức** (hào quang tắt, Khiêu Khích cũng hết) |

Cơ chế gốc vẫn giữ nguyên cho Garrek/Leonardo: họ dùng `cover` gắn lên **người được bảo vệ**, nên thời hạn của họ vẫn trôi theo lượt của chính người mang — khác với hào quang của Brant.

Dùng lại Lời Hứa là **làm mới** hào quang về 2 lượt chính, không cộng dồn hay tạo tầng thứ hai. Hiện chiêu có CD3 còn hào quang chỉ 2 lượt chính, nên trên thực tế Brant phải chờ hào quang tắt rồi mới niệm lại được; nếu sau này hạ CD xuống ≤ thời hạn thì lần niệm lại sẽ refresh thời hạn thay vì kéo dài cộng dồn.

**Đây là cơ chế dùng chung, không hardcode Brant.** Bất kỳ nhân vật nào tự niệm một status có `cover: true` + `coverTeam: true` (tuỳ chọn thêm `coverArea`/`coverReactions`) đều trở thành người chắn cho cả đội, với thời hạn trôi theo lượt chính của chính người đó. Muốn tái dùng cho nhân vật sau: tạo status riêng (tên/mô tả/modifier/duration tuỳ ý) + kỹ năng self-cast; không cần sửa engine. Test `hào quang che đội là cơ chế dùng chung` cho Iris phát hào quang và chắn đòn cho Arthur để khoá điều này.

Giới hạn hiện tại: mỗi đòn chỉ có **một** người chắn (người bảo hộ còn sống đầu tiên trong danh sách trận); đòn đã chuyển sang người chắn không chuyển tiếp sang người chắn khác (chống vòng lặp).

## Đồng bộ Che chắn và Khiêu Khích

`brant_guard` và `brant_taunt` được cấp cùng lúc và đều có `durationClock: "main_turn"`, `duration: 2`, nên luôn giảm/rời đi **cùng nhịp của Brant**:

- Cả hai chỉ giảm khi kết thúc **lượt chính của Brant**; Vòng Phụ không bào thời hạn.
- Lượt bị **choáng ở Vòng Chính** vẫn tính: cả hai cùng giảm một mức.
- Lượt bị **choáng ở Vòng Phụ** không làm giảm thời hạn.
- Khi Brant còn hào quang, Khiêu Khích vẫn buộc đòn đơn mục tiêu của địch nhắm vào anh — kể cả trong Vòng Phụ.

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
- Nhánh Brant gục giữa lúc hào quang còn hiệu lực đã có test: Che chắn tắt ngay, đồng đội nhận đòn bình thường.
- AI Đấu Trường có profile ưu tiên Che chắn/Khiên nhưng chưa playtest cân bằng.

## Kiểm chứng

`test/brant.test.js`: định danh/chỉ số, Lời Hứa mở hào quang trên chính Brant + Khiêu Khích giới hạn mục tiêu, chắn đòn đơn mục tiêu, chắn AoE, nội tại giảm 20% đòn chắn, đồng đội hành động không bào thời hạn, chỉ lượt chính Brant mới giảm, choáng Vòng Chính/Vòng Phụ, Brant gục thì mất chắn ngay, **hai kịch bản Mori/Artesia và Joshua chạy dưới `pvpRules` Arena (soft cap + chuẩn hóa Lv50)**, pool Chiêu Mộ. Mỗi kịch bản còn khẳng định log có `[PvP arena-0.2.0] … soft cap` để chắc chắn luật PvP thực sự có hiệu lực.
