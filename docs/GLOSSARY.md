# Thuật ngữ, bối cảnh và quy ước

## Thế giới / thương hiệu

**The Prisma Origin** là tên hiện tại; Northern Prisma/MyRPG là tên lịch sử/namespace. Arthur, Iris, Takeshi, Elaine, Garrek, Fiona là sáu nhân vật khởi đầu. Không suy lore mới từ chỉ số thử nghiệm. Lore chỉ tiết lộ theo cờ truyện; các event ẩn không được lộ trước điều kiện.

Hunter Guild = Hội Thợ Săn; Magic Academy = Học viện Ma pháp; Capital Knights = Kị sĩ đoàn Thủ đô. Trong `data/characters.json`, `affiliation` là slug tiếng Anh ổn định (ví dụ `capital_knights`, `hunters_guild`, `magic_academy`), kèm tag nhóm và tag danh xưng riêng từng người (ví dụ `lion_knight` của Mandred); UI hiển thị tiếng Việt qua `AFFILIATION_LABELS` trong [catalog.js](../src/core/catalog.js). Danh sách phe và luật thêm phe ở [AFFILIATIONS](AFFILIATIONS.md). Valmont, Vertosse, Ranoc, Black Rose Mafia là liên kết nội dung; dùng tag/affiliation trong dữ liệu. Simon thuộc Vertosse nhưng không mang họ Vertosse. Sandra có bối cảnh chức vụ được phát triển qua nhiều lần thiết kế; dùng nội dung hiện tại, không tự hợp nhất vai trò lore khác nhau bằng đổi tênID.

## UI ↔ engine

| UI tiếng Việt | ID / ý nghĩa |
| --- | --- |
| Thường / Hỏa / Thủy / Thổ / Phong / Lôi / Quang / Ám / Nguyệt | plain / fire / water / earth / wind / thunder / light / dark / moon |
| Oán Hận | trạng thái sống đặc biệt + group agony, không phải element |
| DPS vật lí / DPS ma pháp | physical_dps / magical_dps; type sát thương không bắt buộc trùng stat scale |
| Hỗ trợ tấn công / phòng thủ | offensive_support / defensive_support |
| Thủ Hộ | tank; không đổi internal ID vì đổi class label |
| Đấu sĩ / Thuật Sư | fighter / sorcerer; Thuật Sư được ưu tiên VFX đặc trưng gắn cơ chế. Có mode không đồng nghĩa Thuật Sư; VFX riêng không bắt buộc là background riêng |
| Liên kích (FuA) | follow_up; thay tên “đánh bồi” trong copy mới, không renameID hàng loạt |
| Phản công | counter; phản ứng sau nhận/né đòn, khác trigger của Aurora |
| Che chắn | trạng thái có cờ `cover`; `coverArea` mở cho đòn diện rộng, `coverReactions` mở cho Liên kích/phản công. Chỉ Brant dùng hai cờ mở rộng hiện tại |
| Khiêu Khích | trạng thái có cờ `taunt`: đòn đơn mục tiêu của địch buộc nhắm người mang; không hút AoE. Brant dùng `brant_taunt` để chung clock `main_turn` với Che chắn |
| Hồi sinh | effect `revive` trên toàn đội: người đã gục trở lại đầy HP/MP và sạch status (giữ Vết Thương Sâu); người còn sống được xóa Kế Ước Thế Chấp, giữ Vết Thương Sâu nhưng vẫn hồi đầy nhờ lượng hồi đủ lớn; không hành động trong vòng hiện tại; VFX dùng chung |
| Phòng thủ | $defend: giảm 40% damage theo status và hồi 5% maxMP bản thân, ceil/capped |
| Lượt Thêm / Vòng Phụ | quyền một người / pha extra của vòng; không phải đẩy ngay lên đầu queue |
| Hội Tâm | true strike / bypassEvasion / unavoidable: bỏ né, không phải chí mạng |
| Khai Phá Điểm Yếu | weakness_exploitation: thay× 1,5 thành× 2 khi thật sự đánh điểm yếu |
| Sơ Hở nguyên tố | exposure_*: debuff tạo weakness và tiêu stack theo cast |
| Sơ hở của Takeshi | tài nguyên riêng; không phải exposure_* |
| Hộ Ấn / Phong Ấn | effect_ward / buff_seal: charge chặn debuff / chặn buff mới |
| Vết Thương Sâu / Rạn Khiên / Nhiễu Ma Lực | deep_wound / shield_fracture / mana_disruption |
| Bằng Chứng Đanh Thép / Thuốc Súng | teamResources, phe riêng; không phải status buff |
| Thảo Phạt / Truy Nã / Hiểm Ác | extermination / bounty / sinister, khác rewardTier normal/boss/super |
| Hiểm trở / Hiểm Nguy | các tên trao đổi của dungeon dangerous; không nhầm tab siêu trùm Hiểm Ác. Tên UI lấy dungeons.json |
| Câu chuyện Lữ Hành | travelerStories; “Lữ Khách” trong trao đổi cũ là cùng nhóm tính năng |
| Biên Niên Ký | chronicles, QuyểnI/II; không gộp vào travelerStories |
| Trấn Phái | exclusiveGear + ô riêng; khác gear thườngTierIV dù cả hai có hiệu ứng |
| Bản Thiết Kế | blueprints; mở công thức, không tự tặng món đồ |

## Tiền tệ

Coin (`coins`); Prisma tím (`prisma`, quaybanner); Pure Prisma vàng cam (`recruitmentShards`, giữ keycũ); Vụn Prisma tím vỡ (`prismaFragments`, rèn/phânrã); Original Prisma cầu vồng (`originalPrisma`, chếtạo); Thẻ Quét (`sweepTickets`); Tinh Thạch Phá Giới (`limitBreakStones`). Không gọi chung mọi thứ là “mảnh”.

## Viết mô tả

Tên → tác dụng chính → hệ số/stat scale → giá/đối tượng → thời hạn/điều kiện trong phần chi tiết. Không lặp nguyên đoạn effect ở cả description lẫn tooltip. Hiển thị số từ resolver, không ghi số cân bằng riêng trongTSX. Phân biệt vòng, lượt chính, lượt thực tế và lần sử dụng. “Tăng 30%” là cộng 0,30; “gây 200%” là× 2; ghi rõ “thêm 100%” khi nghĩa× 2. Chuẩn copy ở [SKILL_COPY_AND_UX_SPEC.md](SKILL_COPY_AND_UX_SPEC.md); catalog cũ trong file đó không thay dữ liệu hiện hành.

## Chính sách ngôn ngữ hiển thị

Ưu tiên game thuần Việt dù logic/code/tài liệu kỹ thuật dùng tiếng Anh. Dịch theo ý nghĩa gameplay, không dịch từng từ máy móc. Thuật ngữ đã chốt dùng nhất quán: Phòng thủ, Liên kích, Phản công, Hồi chiêu, Lượt Thêm, Vòng Phụ, Trấn Phái, Truy Nã, Đấu Trường. Ví dụ damage amplification → khuếch đại sát thương; cooldown → hồi chiêu; stack → tầng; follow-up → Liên kích.

Quy tắc này không buộc đổi tên riêng hoặc ký hiệu đã được duyệt, cũng không đổi ID/schema. Khi một từ có nghĩa khác nhau theo cơ chế, mô tả đúng tác dụng thay vì gộp vào cùng bản dịch. Lỗi kỹ thuật giữ chi tiết trong log chẩn đoán; người chơi nhận thông báo tiếng Việt dễ hiểu và thao tác khắc phục nếu có.

- **Sinh Mệnh Thế Chấp**: khoản nợ hấp thụ hồi HP; trả hết nợ rồi phần dư mới hồi HP. Thanh toán không được tính là thực sự hồi HP. Xem [LIFE_MORTGAGE](LIFE_MORTGAGE.md).
