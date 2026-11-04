# Cerise — Kị sĩ Chớp Mắt

> **Ghi chú phiên bản:** nhân vật mới, triển khai 04/11/2026. Số liệu dưới đây là bản đầu tiên cần playtest, không phải kết luận cân bằng. Luật chung ở [ENGINE_RULES](ENGINE_RULES.md); thông số thô lấy từ JSON/[catalog](CHARACTER_CATALOG.md).

## Định danh

Thuộc **sư đoàn viễn trinh** của Kị sĩ đoàn Thủ đô. Trong dữ liệu: `affiliation: "capital_knights"`, tag nhóm `capital_knights`, tag danh xưng `recon_knight`.

Phong cách: kị sĩ lao vào đội hình địch bằng bước chớp nhoáng. Tốc độ thể hiện qua cơ chế né và áp sát của dạng, **không** dồn vào chỉ số SPD. Tính cách hơi tưng tửng — chi tiết nằm ở `biography`, không ảnh hưởng cơ chế.

## Chỉ số thô

Wind / physical_dps · HP168 / MP72 / ATK31 / MAG8 / DEF15 / RES15 / SPD21.

SPD cố ý ở mức trung bình: nếu cần "nhanh" thì tăng qua dạng chứ không qua stat.

## Kỹ năng

| Kỹ năng | MP / CD | Hiệu ứng |
| --- | --- | --- |
| Lướt Gió Cắt `cerise.slash` | 11 / CD1 | Đơn mục tiêu 150% ATK Phong; gắn Đứt Dòng Ma Lực, −20% MAG trong 2 lượt chính của người nhận |
| Nhát Chém Chớp `cerise.strike` | 24 / CD3 | Đơn mục tiêu 320% ATK, **Hội Tâm** (không thể né) |
| Viễn Trinh Xuất Kích `cerise.formation` | 18 / CD4 | Vào dạng 3 lượt |
| Phản Kích Chớp Ảnh `cerise.riposte` | — | Tự động, 420% ATK |

Damage Rank ×1,1 mỗi Rank; mode stat buff ×1,05 mỗi Rank (ATK của dạng từ +30% lên +31,5% ở Rank 2).

## Nội tại · Thoáng Ảnh Phản Kích

Mỗi **2 vòng** một lần: khi một kẻ địch dùng kỹ năng **chủ động không có hiệu ứng sát thương**, Cerise tự giải toàn bộ hiệu ứng bất lợi của mình rồi phản đòn kẻ đó 420% ATK.

- Không tính Phòng thủ, đánh thường, Độc, phản ứng khác hay kỹ năng tự động của địch.
- Giải debuff **trước**, phản đòn **sau** — nên debuff giảm ATK/MAG không làm yếu cú phản đòn.
- Hạn mức tính theo vòng, dùng chung Vòng Chính và Vòng Phụ: kích ở vòng R thì vòng R+1 vẫn nghỉ, R+2 mới sẵn sàng.
- Từ chối thêm một lần trong cùng hành động; phản ứng không đệ quy.
- Phản đòn vẫn chịu né, DEF, khiên và giảm sát thương như mọi đòn trực tiếp.

## Dạng · Viễn Trinh Xuất Kích

`lifetime: turns`, `durationTurns: 3` — đếm **lượt của chính Cerise**, tính cả lượt thi triển: vào dạng ở lượt 1 thì hết sau lượt 3 của cô.

- +30% ATK (stat buff theo Rank) và né **50% đòn vật lí lẫn phép**.
- Né của dạng dùng chung đường `evasionChance` với né từ nội tại khác: Hội Tâm và đòn `unavoidable` vẫn bỏ qua; không né Độc.
- Không đổi nền bàn đấu hay BGM (`presentationScope: none`), không có VFX riêng — phần này còn thiếu nếu muốn nhận diện như các Thuật Sư.
- Hết 3 lượt, gục, hoặc hết trận thì rời dạng; không có hồi MP khi rời.

## Mở khóa

Đã thêm vào pool banner chuẩn `standard` và có profile AI Arena (`pvpAiProfiles`). **Cần người dùng duyệt**: nếu Cerise phải là phần thưởng truyện/thử thách thay vì gacha, gỡ `cerise` khỏi `characterPool` và cấp qua `firstClearRewards`.

Save cũ chỉ thêm state khóa, không tự mở khóa nhân vật.

## Nghiệm chứng

`test/cerise.test.js`: affiliation/tag, kích nội tại + giải debuff, loại trừ Phòng thủ/đòn sát thương/kỹ năng đồng đội, hạn mức 2 vòng, +30% ATK và 50% né trong 3 lượt, lượt bị choáng vẫn trừ thời hạn dạng, Rank, Hội Tâm, debuff MAG, và `validateContent` trả mảng rỗng. Đã chạy `validate`, full `npm test` (1092 pass), `typecheck`.

## Còn mở

- 420% ATK cho một đòn tự động là rất mạnh: đã thấy nó xóa một quái Level 1 trong một lần. Cần chốt lại hệ số, hoặc giới hạn theo loại kỹ năng địch.
- Chưa có VFX/âm thanh riêng cho dạng và đòn phản kích.
- Chưa kiểm tra browser/Arena bằng Playwright.
