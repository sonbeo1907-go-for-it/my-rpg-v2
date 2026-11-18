# Authoring dữ liệu giải học viện

> **Hiện trạng 18/11/2026:** Bước7–8 đã triển khai shop Huy Hiệu riêng và bốn siêu trùm hiếm. Xem [ACADEMY_TOURNAMENT_REWARDS_SPECIALS](ACADEMY_TOURNAMENT_REWARDS_SPECIALS.md) để biết luật hiện hành; phần mô tả “chưa thưởng/chưa boss” và bảng thưởng v1 bên dưới là lịch sử.


Đọc [đặc tả v1](ACADEMY_TOURNAMENT.md) trước khi sửa. Trạng thái18/11/2026: **bước1–2**, data_only; chưa có phiên/lịch/combat/UI giải.

Năm collection được index theo ID bởi assembleContent và validate cùng nguồn ở CLI/runtime. Không nhét định nghĩa giải vào `chronicles.json` hoặc `chronicleEvents.json` chỉ để hiện thẻ: hai adapter cũ chưa hiểu sessionType này.

## Định nghĩa giải

`schemaVersion` cho hình dạng data; `rulesetVersion` cho luật bất biến của lượt chơi tương lai. `candidateTeamIds`, `playerTeamId`, `sceneIds`, `rewardIds` chỉ trỏ đúng collection tương ứng. `bookId` dự trữ ID, không xác định số quyển cốt truyện. `enabled:false`/`publication:data_only` là gate bắt buộc cho đợt này.

`groupStage` khai bốc thăm4 nhóm,3 lượt bảng, điểm và phân hạng. `knockout.bracket` khai suất group/position hoặc winnerOf trận trước. Không dùng đội cụ thể cố định ở tứ kết; kết quả vòng bảng quyết định suất. Validator chống forward reference/cycle/đội cùng bảng ở cùng nửa nhánh.

`retry` và `replay` khác nhau: retry cùng trận giữseed; replay sau kết thúc tạo run mới nhưng giữ permanent ledger; schema mới tách drawSeed cố định trước First Clear khỏi seed chiến đấu mới (mục 14 đặc tả), boolean newSeed hiện tại chỉ là invariant dữ liệu nền cũ. Tuyệt đối không đặt `inventory`, `ownership`, `storyFlags` hoặc `firstRewardClaims` vào danh sách reset. `repeatRewards:[]` không cấm chơi lại, chỉ cấm tự phát thưởng lặp ởv1.

## Đội và thành viên

Mỗi đội có controller, nhóm hạt giống, rating mô phỏng, mô tả chiến thuật và visual brief. Rating không được biến thành buff combat. Mỗi member cóID độc lập, tên và buildId. `identity.kind:player_loan` dành cho6 người chơi; `original_npc` cho học viên gốc tái dùng kit, `named_character` cho chính nhân vật thật. Mỗi người tham dự phải có định danh không trùng, độc lập build kit.

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

Mục 13 của [đặc tả](ACADEMY_TOURNAMENT.md) là hướng cập nhật NPC/seed/First Clear. Đoạn này là lịch sử thiết kế; hiện JSON đã có pool schema 2 theo mục đồng bộ phía dưới. Khi triển khai phải tách pool ứng viên với 16 đội tham dự; giữ 15 suất NPC: 14 filler + 1 chủ chốt hoặc 13 filler + 2 chủ chốt sau First Clear.

Phân biệt NPC có tên riêng tái dùng kit với chính Rotary/Monica/Lumine/Eri đăng ký dự thi; encounter siêu trùm của họ là dữ liệu riêng. Không dùng nhãn chủ chốt để thêm buff ngầm trong combat. Contract schema ở mục 14 (candidate/participant, quota pot, identity union, seed policy) đã có khung schema 2; runtime phiên vẫn chưa triển khai; không tự thêm các trường mà validator/loader chưa hiểu; chưa thay luật RNG/replay hoặc mở publication chỉ từ cập nhật tài liệu.


## First Clear và giải pháp blocker

Bỏ First Run. Trước First Clear dùng cấu hình giới thiệu/drawSeed cố định; sau First Clear mới mở pool ngẫu nhiên và gate siêu trùm ở lượt mới. Mục 14 đặc tả định nghĩa chọn đội theo quota pot 4/4/4/3 NPC, bạn cũ Luka pot 3, 7A pot 4; tách runId/drawSeed/combatSeed và identity NPC gốc/nhân vật thật. Pool mục tiêu là 26 NPC teams; 16 là số đội trong một phiên. Validator đã hiểu contract mới, kèm kiểm khả thi chọn đội; vẫn cần session/runtime và migration được test trước phát hành. Không chạy runtime hoặc công bố tính năng từ tài liệu này.


## Đồng bộ khung dữ liệu schema 2 — 18/11/2026

Mục này cập nhật trạng thái triển khai, thay các ghi chú “chưa chuyển thành JSON/validator” ở phần lịch sử bên trên. Hiện đã có 27 định nghĩa đội (7A + 18 filler + 4 đội quan hệ + 4 đội nhân vật thật), schemaVersion 2/ruleset academy-2.0.0. Các đội mới và quan hệ vẫn là bản nháp, chưa duyệt tiểu sử hoặc cân bằng. Không đưa thêm nhân vật vào roster sở hữu/gacha.

`candidateTeamIds` là pool; `selection.introduction.participantTeamIds` là 16 đội giới thiệu, bạn cũ Luka pot 3 khóa cùng bảng 7A pot 4. `selectTournamentParticipants` trong tournament-pool.js là hàm thuần chọn đủ đội theo quota và tránh trùng định danh; có tìm kiếm hữu hạn để kiểm tính khả thi K=1/2. Trọng số 1:1 chỉ là cấu hình playtest. Hàm chưa tạo bảng/lịch/phiên save.

Member dùng identity tagged union original_npc/named_character/player_loan; build nguồn và characterId phải khớp. Pool có thể chứa nhiều phương án cho cùng một người nhưng danh sách tham dự không được trùng. Bộ validator không còn yêu cầu pool đúng 16 hoặc replay.newSeed=true; dùng First Clear gate, seedPolicy và newRunId. Các RNG được khai riêng draw/simulation/combat/encounter. Cờ First Clear mới ở contract dữ liệu, chưa có migration/transaction runtime.

specialEncounters chỉ khai bốn nhân vật và gate sau First Clear, configured=false/design_only; chưa có kit, xác suất, thưởng hoặc trận siêu trùm chạy được. Rating đội chủ chốt là dữ liệu playtest cho mô phỏng tương lai, không cấp buff chiến đấu.

Vẫn enabled=false/data_only. Chưa có schedule engine, áp ràng buộc cùng bảng vào bốc thăm thực tế, combat adapter, UI, save phiên hoặc replay chạy được. Các phần ấy vẫn cần triển khai/kiểm thử riêng; không dùng helper chọn pool để tuyên bố giải hoàn chỉnh.


## Trạng thái bước phiên/lịch/mô phỏng — 18/11/2026

Đã triển khai ba bước core tiếp theo: [Phiên giải học viện](ACADEMY_TOURNAMENT_SESSION.md). Có save v7 tương thích, snapshot, lịch bảng/nhánh/playoff hữu hạn và simulation sau confirm. Những ghi chú “chưa có schedule/session/save” phía trên là lịch sử trước đợt này. Chưa có UI, combat adapter/restore engine thật, cảnh tương tác, payout hay boss hiếm; vẫn data_only và chưa phát hành.


## Cập nhật bước 4–5 — bản chơi thử

Đã mở `/chronicles/academy` từ kệ sách; có combat adapter, lưu/khôi phục trận thật, chuẩn bị/trinh sát, bảng giải và kết quả/replay UI. Xem [Combat và UI giải học viện](ACADEMY_TOURNAMENT_COMBAT_UI.md). enabled=true/publication=playtest thay ghi chú data_only/chưa có UI ở các phần lịch sử. Chưa payout, hoàn thiện NPC hoặc boss hiếm.


## Bước 6 và đăng ký sau clear — 18/11/2026

Đã thêm hồ sơ/tương tác NPC,70 cảnh và journal theo kết quả. First Clear mở tên đội/roster6 từ nhân vật đã sở hữu với build tài khoản chụp cố định (gồm Thông Thạo); giữ quyền mượn7A. Đây là thay đổi mới thay các mô tả “luôn mượn6 người, không Thông Thạo” cho account mode. Xem [NPC và đăng ký](ACADEMY_TOURNAMENT_STORIES_REGISTRATION.md). Chưa payout/boss hiếm.
