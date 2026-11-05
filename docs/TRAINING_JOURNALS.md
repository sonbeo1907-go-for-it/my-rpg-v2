# Rèn Luyện và Nhật kí hành trình — 05/11/2026

Shop có mục Original Prisma riêng, có icon cầu vồng, luôn là tab cuối. Giữ luật đổi10 Pure →1 Original, tối đa3 lần/ngày Việt Nam. Mục Chuyển đổi Prisma thêm đổi Tinh Thạch Phá Giới:20.000 Coin/viên, có số lượng và xác nhận. Nhật kí hành trình có tab mua riêng; cả sách và Tinh Thạch mới không có hạn mức mua ngày ngoài số Coin đang có. Giá và EXP sách là dữ liệu trong items.json.

| Cấp sách | Màu | EXP cho một người | Giá Coin |
| --- | --- | --- | --- |
| I | Xanh lá |400|400|
| II | Xanh dương |2.000|2.000|
| III | Tím |6.000|6.000|

Sách nằm trong Túi đồ → Vật phẩm. Chọn sách, số lượng và người đã sở hữu; xem trước Level, EXP thực nhận, điểm phân bổ và EXP vượt giới hạn trước khi xác nhận. Không dùng trong combat/chuyến dungeon/phiên pháo đài; không tự Đột Phá hoặc phân bổ điểm. Giữ quy tắc EXP/Level hiện hành: bank ở mốc cap theo engine, Lv50 XP=0. Nếu không nhận được EXP nào thì từ chối và không tiêu sách; nếu chỉ nhận một phần thì báo phần bị bỏ trước khi dùng. Transaction lưu thành công mới cập nhật UI.

## Phần thưởng toàn chuyến Rèn Luyện

| Độ khó | EXP mỗi thành viên đội hình | Sách rơi thêm |
| --- | --- | --- |
| Dễ |1.200|10–12 cấpI và3–5 cấpII|
| Trung bình |4.400|8–12 cấpII,6–9 cấpI và1 cấpIII|
| Khó |8.800|4–6 cấpIII và10–12 cấpII|

Mỗi khoảng là chọn số nguyên đều, tính cả hai đầu; các loại cùng rơi, không chọn một trong số đó. EXP trực tiếp vẫn cho từng thành viên đội snapshot; sách đưa vào túi chung để dùng sau. Không thưởng ở từng wave, thất bại không nhận. Lượt Rèn Luyện vẫn trần9, hồi3 tại00:00/08:00/16:00 Việt Nam; số wave và enemyLevel không đổi.

Chuyến đánh trực tiếp chốt sách khi tạo run, dùng nguồn random thưởng riêng khỏi RNG combat; giữ run.reward qua mọi wave và lần thử lưu lại. Quét dùng cùng rollDungeonReward và cùng claimDungeonReward; runtime giữ rewardAttempt theo campaign/profile và mức chọn khi lưu lỗi, không reroll lần thử lưu cùng giao dịch. Chỉ thành công mới tiêu vé/lượt và cộng EXP/sách. Kết quả Quét/BattleResult hiển thị đúng số sách đã lưu, còn màn chọn mức hiển thị khoảng rơi.

## Save và kiểm chứng

Save v7 thêm counter không bắt buộc `xpBooksGreen`, `xpBooksBlue`, `xpBooksPurple`; save cũ mặc định0, không đổi namespace/version. Serialize/deserialize kiểm tra số nguyên an toàn không âm. Không nhận sách như gear, không sinh dòng gear hoặc slot trang bị. Vật phẩm số lượng lớn và tổng giá/EXP có kiểm tra overflow.

Nguồn: progression-items.js, dungeon.js, dungeon-rules.js, progression.js, data/items.json, data/dungeons.json. UI: progression-shop.tsx, experience-book-card.tsx, dungeon-rewards.tsx và battle-result.tsx. Kiểm tra: training-books.test.js, training-books.spec.ts, level-progression và hunter-quartet (đường tab Original mới).

Farm lặp lại cộng ba counter sách vào tổng thưởng đã lưu; không cộng lần nữa khi replay cùng kết quả. Không thay luật tiêu lượt hoặc AI.
