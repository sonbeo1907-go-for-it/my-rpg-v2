# Thông Thạo Kĩ năng và kinh tế — 06/11/2026

Quyết định mới nhất của người dùng. Không phải áp dụng Thông Thạo cho toàn roster.

## Phạm vi và chi phí

Danh sách cố định `progressionRules.default.skillProgression.mastery.characterIds` gồm #1 Arthur đến #31 Mandred, thêm Sylva, Monica, Logia, Tywin, Tobin, Lumine, Rivia và Elise. Astoria chưa mở. Không tự suy ra phạm vi từ thứ tự dữ liệu khi roster được sắp xếp lại.

Chỉ kỹ năng đã rankable mới được nâng, gồm Đánh thường. Giữ nguyên fixed/utility/passive. Mọi nhánh Ogre’s Bane là ngoại lệ: chỉ mở Rank1–5 sau Hắc Ảnh Arthur — Khó, `masteryEligible:false`, không có Thông Thạo. Các chiêu thay thế dùng cùng skillLineId thừa hưởng tiến trình như Rank hiện tại.

Yêu cầu sở hữu, Lv50 và Rank5 trước mức1. Nâng tuần tự, lần lượt **1 / 2 / 3 Original Prisma**, tổng6 cho một dòng. Không tiêu Coin ở bước Thông Thạo. Có preview và modal xác nhận; khóa trong trận/chuyến/phiên. Lưu thất bại không thay nguyên liệu hoặc tiến trình.

## Công thức

- Sát thương, đánh thường, hồi HP, khiên: Bạc ×1,12; Vàng tiếp ×1,12; Cầu Vồng tiếp ×1,15. Data: coefficientGrowthByTier.
- Buff chỉ số vốn được phép tăng ở Rank1–5: Bạc ×1,06; Vàng tiếp ×1,06; Cầu Vồng tiếp ×1,075. Data: statBuffGrowthByTier. SPD và các nhóm trước đây cố định vẫn cố định.
- Chiêu có nhóm giảm MP: hệ số MP Rank5 ×0,9^m, áp dụng sau sàn70% của Rank1–5; cùng các điều chỉnh MP hiện hành rồi ceil một lần. Có thể có mốc liền nhau cùng MP nguyên; preview hiển thị chính xác trước khi trả phí.
- Không tăng damage amp, xuyên giáp, debuff, hit count, hồi tài nguyên, thời gian hoặc CD chỉ vì tăng Thông Thạo.
- Kỹ năng nhiều nhóm tăng tất cả nhóm hợp lệ một lần; không tăng lần nữa khi nguồn đã resolve. Các điều chỉnh Trấn Phái vẫn đi qua pipeline cũ.

Mức3 bằng **×1,44256** đầu ra hoặc **×1,20787** buff chỉ số so với Rank5. Đây là tăng lũy tiến theo mức trước. Hệ số mới áp dụng cả các mức Thông Thạo đã mua; không đổi số Rank hay thu thêm nguyên liệu. Rank1–5 vẫn tăng10%/5% như cũ.

## UI và save

Khung skill bạc/vàng/cầu vồng theo mức1/2/3, có ánh lấp lánh; reduced-motion tắt chuyển động. Hiện “Rank 5 · Thông Thạo N”, không gọi là Rank6–8 trên UI. Nút skill trong PvE có cùng khung; preview lẫn chiến đấu dùng skill-resolver.

Giữ save v7 và `skillRanks`; nội bộ6/7/8 tương ứng ba mức. Map cũ không đổi; từ chối rank9, rank>5 cho nhân vật chưa mở, Lv<50, dòng fixed/ngoại lai. Snapshot mới lấy mastery vào combat; wave/phòng giữ cùng snapshot. Thông Thạo chỉ có hiệu lực trong PvE. Mọi trận PvP, gồm Tìm Trận, Luyện Tập và Ảnh gương không chuẩn hóa, giới hạn Rank hiệu lực tối đa5 cho cả hai phe. Snapshot actor gắn masteryDisabled; resolver cũng chặn bản skill đã cache và rankOverride. Save PvE vẫn giữ Rank6–8, không hoàn nguyên tiến trình đã mua.

Tái rèn Trấn Phái:10Pure, dữ liệu trong blacksmith.json có currency riêng; pending đã trả phí từ bản trước được giữ và quyết định không thu lại. Original vẫn nằm trong craftCost Trấn Phái và nay thêm vai trò Thông Thạo.

Vé và mốc300rate-up xem RATE_UP_BANNERS.md. Counter `recruitmentTickets` và `gacha.rateUpMileage` là optional mới trên save v7, mặc định0; không phát thưởng hồi tố. Ticket receipt là lịch sử trình bày, không được dùng làm hàm cấp thưởng.

Kiểm chứng: mastery.test.js, economy-ticket.test.js, skill-ranks.test.js; e2e/mastery.spec.ts. Test chức năng không chứng minh cân bằng toàn roster; cần playtest cùng Level/allocation/Rank/Trấn/gear/đội/địch.
