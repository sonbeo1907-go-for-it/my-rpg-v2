# Arthur — Ba thử thách Hắc Ảnh và nâng cấp Ogre’s Bane

Cập nhật 06/11/2026. JSON và engine là nguồn xác định hành vi; thông số dưới là Rank1 trừ khi ghi khác.

## Mở khóa

Cần hoàn thành ba truyện Iris/Fiona/Takeshi, Arthur phải tham chiến. Ba mức dùng chung boss ba phase, đường HP siêu trùm và BGM `ogrebane`; chỉ cấp địch và thưởng khác nhau:

| Mức | Cấp | Thưởng lần đầu |
| --- | ---: | --- |
| Dễ (`epilogue_shadow_easy`) | 1 | Cờ `eastern_hunts_unlocked`, +1 ô trang bị Arthur, trần6 |
| Thường (`epilogue_unfinished`, giữ ID cũ) | 30 | Kiểm soát hoàn toàn và Thiểm Quang Kiếm |
| Khó (`epilogue_shadow_hard`) | 60 | Ánh sáng không lùi bước; mở nâng Rank1–5 cho mọi nhánh Ogre’s Bane |

Mở tuần tự bằng first-clear. Thảo Phạt Phương Đông hiện chỉ là cờ chờ nội dung. Save đã thắng mức Thường cũ giữ thưởng cũ, không tự nhận thưởng Dễ/Khó; có thể quay lại đánh Dễ. Thưởng đi qua persistence trước publish, thất bại có thể thử lại, không phát trùng.

## Kỹ năng

| Kỹ năng | Chi phí | Rank1 |
| --- | --- | --- |
| Kiểm soát hoàn toàn | 10MP, 3 Cộng hưởng | 600% ATK đơn mục tiêu Quang; sau đòn +20% ATK đến hết trận |
| Thiểm Quang Kiếm | 10MP, 3 Cộng hưởng | 280% ATK toàn địch Quang |

Không có CD riêng. Kiểm soát hoàn toàn bỏ Dư chấn; buff sau damage, không cộng dồn, dispel được và có thể cấp lại. AoE không tự cấp buff. Trấn Khế ước bất kham xuyên25% DEF vẫn chỉ áp dụng bản đơn mục tiêu.

Sau màn Khó, mọi nhánh Ogre’s Bane nâng Rank1–5 theo luật chuẩn, tuyệt đối không Thông Thạo. Bất kham/Kiểm soát/Kiểm soát hoàn toàn dùng chung dòng tiến trình; Thiểm Quang Kiếm dùng dòng riêng. Tăng damage10%/Rank và buff chỉ số5%/Rank nếu có; MP/Cộng hưởng giữ nguyên. Trước cờ Khó có thể xem preview nhưng không mua Rank.

## Ánh sáng không lùi bước

Native passive mới dùng schema `starting_resource_skill_chance`:
- Trận độc lập bắt đầu: 3 Cộng hưởng.
- Sau khi dùng Kiếm Quang thành công: xác suất thêm1 Cộng hưởng = min(100%, max(0, ATK căn bản) /150). Đây là ngoài lượng tạo gốc của chiêu; không vượt trần3.
- ATK căn bản đi qua `baseStatValue`, không lấy buff ATK% tạm thời.
- Mỗi lần dùng chiêu đều xét, kể cả Lượt Thêm. Bị Choáng/bỏ lượt không thi triển nên không xét.
- Không nạp lại khi chuyển wave/phòng có carry actor hoặc chuyển phase boss; không refill mỗi lượt/vòng. Trận mới độc lập nạp lại3.
- Nội tại không phụ thuộc Rank Kiếm Quang. Không thay kit hồi tố cho actor đang chiến đấu.

Kiểm chứng: `test/arthur-revision.test.js`, `test/takeshi-epilogue.test.js`, `test/skill-ranks.test.js`, `e2e/arthur-revision.spec.ts`.
