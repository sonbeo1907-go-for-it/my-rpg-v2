# Thuật ngữ, bối cảnh và quy ước

## Thế giới / thương hiệu

**The Prisma Origin** là tên hiện tại; Northern Prisma/MyRPG là tên lịch sử/namespace. Arthur, Iris, Takeshi, Elaine, Garrek, Fiona là sáu nhân vật khởi đầu. Không suy lore mới từ chỉ số thử nghiệm. Lore chỉ tiết lộ theo cờ truyện; các event ẩn không được lộ trước điều kiện.

Hunter Guild = Hội Thợ Săn; Magic Academy = Học Viện Ma Thuật; Capital Knights = Hội/Kị sĩ đoàn thủ đô. Valmont, Vertosse, Ranoc, Black Rose Mafia là liên kết nội dung; dùng tag/affiliation trong dữ liệu. Simon thuộc Vertosse nhưng không mang họ Vertosse. Sandra có bối cảnh chức vụ được phát triển qua nhiều lần thiết kế; dùng nội dung hiện tại, không tự hợp nhất vai trò lore khác nhau bằng đổi tênID.

## UI ↔ engine

| UI tiếng Việt | ID / ý nghĩa |
| --- | --- |
| Thường / Hỏa / Thủy / Thổ / Phong / Lôi / Quang / Ám / Nguyệt | plain / fire / water / earth / wind / thunder / light / dark / moon |
| Oán Hận | trạng thái sống đặc biệt + group agony, không phải element |
| DPS vật lí / DPS ma pháp | physical_dps / magical_dps; type sát thương không bắt buộc trùng stat scale |
| Hỗ trợ tấn công / phòng thủ | offensive_support / defensive_support |
| Thủ Hộ | tank; không đổi internal ID vì đổi class label |
| Đấu sĩ / Thuật Sư | fighter / sorcerer; có mode không đồng nghĩa Thuật Sư và Thuật Sư không tự có background |
| Liên kích (FuA) | follow_up; thay tên “đánh bồi” trong copy mới, không renameID hàng loạt |
| Phản công | counter; phản ứng sau nhận/né đòn, khác trigger của Aurora |
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
