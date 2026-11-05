# Kinh tế và quyền sở hữu — hiện hành

Nguồn: economy.json, banners.json, blacksmith.json, gearEffects.json; economy.js, quest-rewards.js, bounty-rewards.js, shop-daily.js. Đây là thông số playtest hiện tại, không cam kết cân bằng kinh tế cuối.

## Chiêu Mộ và quyền sở hữu

- Mở sẵn Arthur/Iris/Takeshi/Elaine/Garrek/Fiona. State tiến trình tồn tại không có nghĩa đã sở hữu; kiểm tra unlockedCharacterIds.
-600 Coin →1 Prisma tím. Quay1/10 tốn1/10 Prisma; nếu thiếu, modal xác nhận chuyển đúng lượng thiếu rồi quay trong cùng transaction.
- Tỷ lệ30%T1,50%T2,18,5%T3,1,5%nhân vật. Pity ở lượt50 không ra nhân vật; ra nhân vật kể cả dupe reset. Quay10 xử lý tuần tự; đổi tự chọn/thưởng truyện không reset pity.
-1 Vé Chiêu Mộ → một nhân vật tự chọn chưa sở hữu trong nguồn cho phép. Dupe mở thêm1 ô thường tối đa6 và nhận10 Pure; không đoán lịch sử dupe để cấp bù.
- Astoria không trong gacha/đổi vé, chỉ Developer Option; Tobin có đường nhận riêng ở Thợ Rèn sau10 intro QuyểnI, không tự cho miễn phí toàn roster.
- Kết quả/pity/ví ghi trước animation. Skip/reveal/reload không cấp thưởng hoặc quay lại. RNG gacha độc lập RNG combat.

## Chiêu Mộ theo phe — cập nhật 05/11/2026

Lịch Thứ Hai–Tư /Thứ Năm–Bảy một banner; Chủ Nhật hai banner, mỗi banner1chính+2phụ. FIFO15 chống lặp; tỷ lệ có điều kiện25%/12,5%/12,5% và50% ngoài. Pity riêng cho mỗi banner theo đợt, kể cả hai banner Chủ Nhật; hết hạn đặt lại0, không chuyển banner, `standard` vẫn riêng; không có bảo hiểm thắng rate-up sau lệch. Cấu hình, roster chốt và contract save/UI ở [RATE_UP_BANNERS](RATE_UP_BANNERS.md).

## Thưởng Quest

Mức gốc normal50 Coin hoặc5 Vụn, boss150 Coin hoặc15 Vụn, mỗi nhánh50%; nhân hệ số độ khó từ progressionRules. Thưởng lần đầu riêng vẫn nhận đầy đủ. Tier không đổi theo nhánh được roll.

Truy Nã đã clear lần đầu, từLv25:40%Coin,40%Vụn,20%Blueprint. Nhánh Blueprint lần lượt1/3/5 ởLv25/35/45, không nhân hệ số tiền.10 Blueprint mở một trong20 công thức Trấn mới ởShop; không tự tặng món. Sáu starter và các Trấn từ truyện giữ nguồn riêng, gồm Monica/Victorina/Sieg/Chelsea/Artesia.

Siêu trùm1000 Coin theo policy; Arena không thưởng PvE/XP/daily. Chronicle giải thưởng ở kết thúc scene, không nhận Coin/XP Quest từ combat event. Dungeon thưởng cả chuyến, không cộng thưởng Quest từng phòng.

## Thợ Rèn

- Phân rã gear chưa dùng: T1→5, T2→15, T3→40 Vụn; không phân rã món đang lắp hoặc bị khóa bởi pending.
- Trấn craft:10000 Coin+2400 Vụn+3 Pure+1 Original; ô riêng, yêu cầu sở hữu nhân vật và công thức. Món thưởng Quest có luật riêng.
- T4 chỉ số:1200 Vụn+8000 Coin+1T3, chọn dòng chính; dòng phụ ngẫu nhiên có thể trùng dòng chính.
- T4 hiệu ứng phổ thông:2400 Vụn+12000 Coin+1T3. Đặc biệt:3200 Vụn+18000 Coin+1T3 và mở công thức.
- Tái rèn phụ450 Vụn+2500 Coin; giữ cũ miễn phí nhưng không hoàn phí roll, không đổi dòng chính. Pending lưu bền vững, không reroll khi tải lại.

Shop đổi10 Pure→1 Original tối đa3/ngày/hồ sơ. Original còn từ mốc daily6; không mô tả phải farm Ảo Ảnh đã gỡ. Xem DAILY_COMMISSIONS, T4_FORGE, BOUNTY_GEAR, BLUEPRINT_EXCLUSIVES.

Mọi thưởng/vật liệu/ledger lưu cùng transaction trước publish. Retry không roll lại nhánh thưởng; dữ liệu thật không được dùng làm fixture test.
