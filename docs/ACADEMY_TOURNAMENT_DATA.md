# Authoring dữ liệu giải học viện

Đọc [đặc tả v1](ACADEMY_TOURNAMENT.md) trước khi sửa. Trạng thái18/11/2026: **bước1–2**, data_only; chưa có phiên/lịch/combat/UI giải.

Năm collection được index theo ID bởi assembleContent và validate cùng nguồn ở CLI/runtime. Không nhét định nghĩa giải vào `chronicles.json` hoặc `chronicleEvents.json` chỉ để hiện thẻ: hai adapter cũ chưa hiểu sessionType này.

## Định nghĩa giải

`schemaVersion` cho hình dạng data; `rulesetVersion` cho luật bất biến của lượt chơi tương lai. `teamIds`, `playerTeamId`, `sceneIds`, `rewardIds` chỉ trỏ đúng collection tương ứng. `bookId` dự trữ ID, không xác định số quyển cốt truyện. `enabled:false`/`publication:data_only` là gate bắt buộc cho đợt này.

`groupStage` khai bốc thăm4 nhóm,3 lượt bảng, điểm và phân hạng. `knockout.bracket` khai suất group/position hoặc winnerOf trận trước. Không dùng đội cụ thể cố định ở tứ kết; kết quả vòng bảng quyết định suất. Validator chống forward reference/cycle/đội cùng bảng ở cùng nửa nhánh.

`retry` và `replay` khác nhau: retry cùng trận giữseed; replay sau kết thúc tạo run/seed mới nhưng giữ permanent ledger. Tuyệt đối không đặt `inventory`, `ownership`, `storyFlags` hoặc `firstRewardClaims` vào danh sách reset. `repeatRewards:[]` không cấm chơi lại, chỉ cấm tự phát thưởng lặp ởv1.

## Đội và thành viên

Mỗi đội có controller, nhóm hạt giống, rating mô phỏng, mô tả chiến thuật và visual brief. Rating không được biến thành buff combat. Mỗi member cóID độc lập, tên và buildId. `kind:loan` dành cho6 người chơi; `kind:npc` cho học viên địch. NPC tái dùng kit của templateCharacterId, không phải nhân vật gốc đăng ký trùng nhiều đội.

Visual.motif/palette là brief vẽ SVG, chưa phải đường dẫn asset. Không đặt URL ngoài hoặc đường ảnh chưa tồn tại vào renderer. Tên/chiến thuật/cảnh/reward label ưu tiên tiếng Việt; ID và enum giữ tiếng Anh nội bộ, không show raw.

## Build

Build source phải là nhân vật Học viện; điểm theo normalizeLevelState hiện tại, tổng29 tạiLv30, mỗi stat có cap riêng. GEAR ở đây là blueprint, không có instanceID tài khoản; ba mónT2, mỗi món một stat đúng points×economy.gearStats.scale. Không ghi các món mượn vào campaign.gear hoặc cấp bản trùng.

skillRank3 chỉ là mặc định cho line nâng được; child passive/fixed không bị ép lên3. `aiProfileId:generic` là fallback được khai rõ (Monica); còn profile cụ thể phải tồn tại và thuộc đúng source. Không tự tạo profile riêng cho Monica.

## Cảnh và thưởng

`sceneHooks` gắn registration/opening/interval, từng lượt bảng, từng vòng loại trực tiếp và hai outcome kết thúc vào scene có phase đúng. Đoạn văn draft sẽ được mở rộng ở bước8; không thêm command state mutation vào paragraphs.

Mốc thưởng dùng trigger qualified/finalist/champion, scope first_ever và currency thật trong FIRST_CLEAR_CURRENCIES. Chưa mở nguồn nhận nhân vật/trấn qua sự kiện này. Sau khi có ledger, cần giữ khóa nhận theo giải+mốc qua mọi seed/version/lượt mới; không dùng runID làm khóa duy nhất của first-ever.

## Kiểm tra

`npm.cmd run validate`, `node --test test/tournament-content.test.js`, `npm.cmd test`, `npm.cmd run typecheck`; build web để kiểm runtime loader. Không cần E2E riêng hoặc EXE cho phần data chưa hiển thị; kiểm browser/replay thật thuộc các bước sau. Sau source change chạy graph:update cục bộ theo AGENTS.

Cấu hình chuẩn hóa chung nằm ở `trialRules`; thay mức playtest phải đổi policy và mọi build liên quan cùng lúc. Validator kiểm tính hợp lệ theo level/Rank/gear engine và đối chiếu với policy, không hardcode mức30/3/T2 trong từng build.


## Viết cảnh truyện

Đọc [Hướng dẫn viết cảnh theo tính cách nhân vật](STORY_SCENE_WRITING_GUIDE.md) trước khi bổ sung lời kể hoặc thoại. Cảnh giải học viện đã có bản nháp mở rộng cho sáu thành viên; giữ draft/data_only và hook hiện có. Cảnh dùng chung không giả định kết quả trận trước hay đội hình ra sân.


## Thiết kế mới chưa chuyển thành schema — 18/11/2026

Mục 13 của [đặc tả](ACADEMY_TOURNAMENT.md) là hướng cập nhật NPC/seed/First Clear. JSON hiện tại chỉ có 16 đội nền, không phải pool mới. Khi triển khai phải tách pool ứng viên với 16 đội tham dự; giữ 15 suất NPC: 14 filler + 1 chủ chốt hoặc 13 filler + 2 chủ chốt sau First Clear.

Phân biệt NPC có tên riêng tái dùng kit với chính Rotary/Monica/Lumine/Eri đăng ký dự thi; encounter siêu trùm của họ là dữ liệu riêng. Không dùng nhãn chủ chốt để thêm buff ngầm trong combat. Chưa chốt schema mới, không tự thêm các trường mà validator/loader chưa hiểu; chưa thay luật RNG/replay hoặc mở publication chỉ từ cập nhật tài liệu.
