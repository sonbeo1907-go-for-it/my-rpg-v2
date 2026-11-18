# Giải đấu học viện — đặc tả triển khai v1

Ngày18/11/2026, múi giờ Việt Nam. Tên làm việc: **Mùa Thi Đấu, Những Vì Sao Chưa Sáng**. ID nội dung và bộ luật `academy_tournament`; không tự chiếm số Quyển III của mạch truyện chính.

## 1. Phạm vi và nguồn quyết định

Yêu cầu người dùng: làm bước1 của kế hoạch (chốt luật/đặc tả) và triển khai bước2 (dữ liệu/validator). **Sau khi kết thúc phải chơi lại được.** Khung16 đội/4 bảng, đội7A trung tâm, phiên xuyên giải, trinh sát và khoảng nghỉ được triển khai thành định nghĩa như kế hoạch vừa trao đổi.

Những con số chưa được người dùng chỉ định — cấu hình mượn, thưởng lần đầu và giới hạn chấm điểm trận — là **mặc định playtest của đặc tả này**, có phiên bản, chưa phải kết quả cân bằng. Thay đổi sau này cần cập nhật config/version và kiểm thử.

Đợt này chỉ có định nghĩa dữ liệu, validator và kiểm thử. `publication:data_only`, `enabled:false`. Không thêm thẻ vào `chronicles.json`, không mở route mới, không đổi save/schema hiện hành, không cấp nhân vật/phần thưởng, không tạo lịch đấu hoặc chạy combat. Các bước3–10 mới xây hệ thống chơi thực tế. Replay hiện là **hợp đồng dữ liệu đã kiểm tra**, chưa phải nút đang chơi được.

## 2. Thể thức chính thức

| Mục | Quy tắc v1 |
| --- | --- |
| Đội tham gia |16, gồm1 đội người chơi và15 đội AI |
| Vòng bảng |4 bảng A–D, mỗi bảng4 đội, vòng tròn một lượt |
| Số lượt bảng |3 lượt; mỗi đội đánh3 trận |
| Đi tiếp |Hai đội đứng đầu mỗi bảng |
| Điểm |Thắng3, thua0; không ghi hòa |
| Loại trực tiếp |Tứ kết4 trận → bán kết2 → chung kết1; mỗi cặp một trận |
| Số trận chính thức |24 vòng bảng +7 loại trực tiếp =31; chưa tính trận phụ |
| Người chơi vào chung kết |Đánh6 trận chính; trận phụ có thể tăng số này |
| Tranh hạng ba |Không có ởv1 |

Bốc thăm từ4 nhóm hạt giống, mỗi nhóm4 đội; mỗi bảng nhận1 đội từ mỗi nhóm. Dùng seed của lượt chơi. Nhóm của người chơi được **đổi nhãn thành A sau bốc thăm**, không ép sẵn ba đối thủ. Chơi lại dùng seed mới nhưng kết quả bốc thăm vẫn có thể vô tình trùng.

Phân hạng bằng điểm: đối đầu trực tiếp trong nhóm đội bằng điểm → hiệu số số người còn trụ sân → trận phụ. Khi có3 đội vẫn bằng nhau, tổ chức nhánh phụ loại trực tiếp có bốc thăm suất miễn lượt; đủ trận để phân định các vị trí liên quan đi tiếp. Không lặp vòng tròn phụ vô hạn. Trận phụ không cộng lại điểm/hiệu số vòng bảng và không có thưởng riêng.

Hiệu số người trụ sân của trận = số người sống phe mình − số người sống phe đối phương lúc chốt kết quả. Chỉ đội hình4 người xuất chiến được tính. Trận bỏ cuộc ghi đội bỏ cuộc0, đối phương4; không dùng lượng HP thô vì mức HP giữa vai trò khác nhau.

### Nhánh loại trực tiếp

| Trận | Cặp đấu |
| --- | --- |
| Tứ kết1 |Nhất A – Nhì B |
| Tứ kết2 |Nhất C – Nhì D |
| Tứ kết3 |Nhất B – Nhì A |
| Tứ kết4 |Nhất D – Nhì C |
| Bán kết1 |Thắng TK1 – Thắng TK2 |
| Bán kết2 |Thắng TK3 – Thắng TK4 |
| Chung kết |Thắng BK1 – Thắng BK2 |

Hai đội cùng bảng chỉ có thể gặp lại ở chung kết. Thua loại trực tiếp kết thúc giải của người chơi, vẫn có hậu truyện và quyền chơi lại.

## 3. Đăng ký và nhân vật mượn

Đội người chơi là lớp7A: Luka, Gairyu, Ariel, Charlotte, Clark, Mariel. Đăng ký6 người, chọn4 cùng thứ tự ô trước mỗi trận. Không bắt buộc Luka xuất chiến.15 đội AI đăng ký4 người; bản đầu chưa cần hệ thống thay người AI.

Không cần sở hữu nhân vật. Nhân vật mượn không trở thành sở hữu, không tăng bản trùng/ô gear, không mở Trấn hoặc thay tiến trình thật. Không dùng đội hình/trang bị đang mặc của tài khoản. Đổi người/vị trí giữa các trận được phép; danh sách6 đã đăng ký và các build mượn cố định trong lượt chơi.

Nền playtest cho cả hai phe:

- Lv30, Phá Giới1, EXP0;29 điểm phân bổ hợp lệ theo engine.
- Rank3 cho đánh thường/kỹ năng nâng được; kỹ năng cố định giữ hành vi cố định. Không Thông Thạo.
- Bản trùng0, ba mảnhT2; không Trấn, không GearIV, không nâng cấp cốt truyện bổ sung.
- Không dùng dược liệu/thực phẩm/vật phẩm tài khoản trong giải v1.
- Các build khác nhau theo vai trò, cùng ngân sách cấp/điểm/gear. Cần playtest thực tế trước khi phát hành, đặc biệt các chuỗi sát thương Gairyu và điều khiển lượt Monica/Rotary.

Build NPC là **mẫu kit**, không phải nhân vật gốc cũng đăng ký ở đội khác. Mỗi học viên NPC có ID/tên riêng; tái dùng kit không đưa60 người mới vào roster/gacha. Runtime phải chuẩn bị họ bằng đường build nhân vật (điểm/Rank/gear), không áp enemy-level curve lên chỉ số nguồn. Chỉ số nền nguồn vẫn ởLv1.

## 4. Luật một trận và ranh giới

Mỗi trận bắt đầu mới: HP/MP đầy; trạng thái, khiên, CD, tài nguyên, mode, trường, bộ đếm vòng và quyền Lượt Thêm được khởi tạo lại. Nội tại bắt đầu trận vẫn chạy như thường. Không mang thương tích từ trận trước; không reset lại giữa các hit hoặc phase của cùng trận.

Khóa đội hình trong trận. Ngoài trận được chọn4 người/đổi ô từ danh sách đăng ký. Do dùng build mượn độc lập, không cần khóa inventory/đội hình tài khoản khi chỉ tạm rời giải.

Dùng bộ luật tỷ thí riêng, không tự áp PvP soft cap, cấm/chọn, Danh Dự, xếp hạng hoặc xử thua khi đóng game. Kỹ năng/nội tại/gear/Rank của hai phe phải đối xứng. Không thưởng EXP/Coin/Vụn mỗi trận, không tính nhiệm vụ ngày Quest/Arena/Dungeon. Mốc thưởng giải có giao dịch riêng.

### Chấm điểm khi trận kéo dài — mặc định playtest

Tối đa40 Vòng Chính; hoàn tất toàn Vòng Phụ của vòng40 rồi chấm, không ngắt giữa cast/Liên kích. Nếu trước đó có đội bị hạ hết thì dùng kết quả combat bình thường.

Thứ tự phân thắng khi hết thời gian: số người sống → tổng tỷ lệHP hiện tại/HP tối đa của4 ô → tổng sát thươngHP trực tiếp thực gây lên địch. Không tính overheal, damage vào khiên, tự gây damage hoặc sát thương vượt HP còn lại để làm đẹp số. Nếu vẫn bằng tuyệt đối, bốc thăm công khai từ seed riêng của trận; kết quả được chốt, không roll lại khi reload. Luật chấm phải có trong màn trinh sát trước xuất chiến. Đây là phương án finite v1, cần kiểm chứng chống stall ở bước combat.

## 5. Lịch đấu, AI và tính bất biến

Chốt seed, nhóm hạt giống, luật và build pack lúc mở lượt chơi. Tách RNG bốc thăm, mô phỏng và chiến đấu. Thao tác xem bảng, mở menu hoặc lưu không được tiêu RNG. Trận AI không có người chơi dùng sức mạnh khai báo và tương quan đội hình, với phần ngẫu nhiên nhỏ; không sửa điểm để ép một nhân vật vào chung kết.

Mỗi lượt bảng chỉ công bố kết quả AI sau khi trận người chơi được xác nhận. Không lộ kết quả chưa công bố trong giao diện/nhật ký. Kết quả đã chốt chỉ được ghi một lần; nhấn hai lần, load checkpoint hay nhận thưởng không tính trận lại.

Phiên phải giữ bản luật/build/kit cần thiết theo `rulesetVersion`, không đọc thay đổi giữa chừng từ bản cập nhật mới để làm lệch trận đang dở. Nếu triển khai sau này dùng gói nội dung bất biến, cần schema/giới hạn kích thước và migration; không chỉ lưu chuỗi version nhưng vẫn resolve tất cả skill từ data mới.

## 6. Thua trận, rút lui và khôi phục

Sau trận thua chưa chốt: **Thử lại** giữ đối thủ/đội hình của địch/seed, trận bắt đầu mới theo luật hồi đầy; hoặc **Chấp nhận kết quả** ghi trận thua chính thức. Không tính bảng trước khi lựa chọn được lưu thành công. Trận thắng chốt một lần ở bước xác nhận kết quả.

Rút khỏi một trận được xem là thua đang chờ xác nhận, không tự nhận tiền hoặc tự reroll địch. Rút cả giải qua xác nhận ngoài trận kết thúc với outcome `eliminated`, reason `withdrawn`; vẫn mở chơi lại. Hết3 trận bảng mà không vào top2, hoặc thua loại trực tiếp, cũng kết thúc `eliminated`.

Back, đổi URL và đóng game không phải rút giải. Lưu checkpoint trận/RNG, khôi phục đúng trận và lượt khi mở lại. Persist thất bại giữ nguyên kết quả đang chờ, không reroll. Save cũ, Quyển I/II và trạng thái tài khoản không được thay khi chỉ thêm định nghĩa v1.

## 7. Kết thúc và chơi lại — yêu cầu bắt buộc

Hai hậu truyện: **Tên Lớp Trên Chiếc Cúp** và **Ngày Mai Vẫn Có Tiết Học**. Sau khi hoàn thành hậu truyện, giải ở trạng thái kết thúc, có nút **Chơi lại giải đấu** và nút trở về.

Chơi lại không giới hạn số lần/ngày/tuần, cho cả vô địch lẫn bị loại/rút giải. Không tự mở giải mới ngay sau khi thắng chung kết; người chơi chủ động bấm nút và xác nhận.

| Mở lượt chơi mới | Phải giữ |
| --- | --- |
| ID lượt và seed mới |Lịch sử, tổng thành tích, thứ hạng tốt nhất |
| Bốc thăm/lịch/bảng/nhánh mới |Cờ truyện vĩnh viễn đã đạt |
| Đội hình xuất chiến mặc định từ roster mượn |Sổ thưởng lần đầu và quyền nhận còn chờ |
| Trận và bộ RNG mới |Nhân vật, trang bị, tiền tệ tài khoản |

Giữ tối đa20 bản ghi giải gần nhất cùng tổng số lượt/vô địch và thành tích tốt nhất. Bản ghi có rulesetVersion để phân biệt cấu hình.20 là giới hạn danh sách hiển thị/lưu chi tiết, không phải xóa sổ thưởng hay tổng thành tích.

Lệnh chơi lại phải kiểm tra phiên cũ đã kết thúc và revision/token; clone → tạo lượt mới → persist → publish. Nhấn hai lần không tạo hai lượt hoặc tiêu hai seed. Không cho nút chơi lại reset một giải còn đang diễn ra mà không qua xác nhận rút giải.

## 8. Phần thưởng v1

Các số sau là ngân sách playtest một lần/hồ sơ:

| Mốc | Thưởng |
| --- | --- |
| Vượt vòng bảng |500 Coin +20 Vụn Prisma |
| Vào chung kết |1.000 Coin +2 Pure Prisma |
| Vô địch |1.500 Coin +1 Original Prisma |

Nhận đủ ba mốc lần đầu:3.000 Coin,20 Vụn,2 Pure,1 Original. Không tự tặng nhân vật7A trong bản này. Không có thưởng cho từng trận hoặc thưởng lặp lại ởv1; **chơi lại vẫn được phép sau khi đã nhận hết thưởng**.

Ledger nhận thưởng theo hồ sơ + ID giải + ID mốc, không theo seed/runID. Không tự reset ledger khi chơi lại, qua00:00, sang tuần hoặc đổi rulesetVersion. Mốc đạt nhưng chưa nhận vẫn phải nhận được sau khi kết thúc/mở lượt khác; transaction thưởng và đánh dấu đã nhận phải nguyên tử. Không tiêu quota28/tuần của Quyển I/II.

## 9. Đội tham gia và định hướng

| Nhóm hạt giống | Các đội |
| --- | --- |
|1 |Đội Hội Đồng Học Sinh; Dàn Nhạc Đêm; Những Người Giữ Nhịp; Thành Lũy Thuật Thức |
|2 |Tiếng Sấm Đầu Mùa; Những Người Đọc Sao; Bốn Mùa Ma Pháp; Nét Mực Và Phù Văn |
|3 |Băng Kết Ban Mai; Dưới Lòng Địa Mạch; Chiếc Bình Sủi Bọt; Dòng Nước Trong Sân |
|4 |Gió Qua Giảng Đường; Đốm Lửa Chưa Tàn; Mực Tím Cuối Ngày; Đội Lớp7A |

Nhóm hạt giống/rating mô phỏng không phải buff chỉ số chiến đấu. Đội mạnh cần phối hợp tốt, đọc được ý đồ và có cảnh báo chiến thuật; không đẩy level bí mật vượt cấu hình mượn. Tên học viên NPC và11 cảnh ngắn là bản thảo cho bước8, không tuyên bố kịch bản hoàn chỉnh.

Mỗi đội có motif/màu để làm SVG về sau; hiện không khai đường ảnh giả hoặc tải asset ngoài. Các cảnh được nối qua `sceneHooks`, không bắt runtime hardcode tên ID cảnh.

## 10. Giao diện và bước triển khai tiếp

Kệ Biên Niên Ký → đăng ký/khai mạc → tổng quan giải → khoảng nghỉ → trinh sát → chọn đội → trận → kết quả → cập nhật bảng/nhánh → hậu truyện → **Chơi lại giải đấu**.

Trước xác nhận trận phải thấy đối thủ, luật chấm40 vòng, đội mượn và quyền thay người. Thời hạn/đòn báo trước trong combat dùng hệ thống cảnh báo hiện hữu. Không chỉ dựa vào hover: tay cầm có nút xem chi tiết; trinh sát và xác nhận xuất chiến chung một modal theo UX hiện hành.

Thứ tự sau đợt này: bước3 schedule/standings/bracket/simulation → bước4 phiên/save/replay thật → bước5 combat adapter → bước6 vòng bảng chơi xuyên suốt → bước7 UI → bước8 nội dung → bước9 thưởng → bước10 nghiệm thu/phát hành. Không chuyển enabled=true chỉ vì JSON đã hợp lệ.

## 11. Dữ liệu đã triển khai ở bước2

| File | Nội dung |
| --- | --- |
|`data/tournaments.json` |Một định nghĩa giải, luật, nhánh, retry/replay, hook cảnh/thưởng |
|`data/tournamentTeams.json` |16 đội,66 memberID độc lập (6 người chơi +60 NPC) |
|`data/tournamentBuilds.json` |16 mẫu kit từ nhân vật Học viện hiện hữu, Lv30/Rank3/ba T2 |
|`data/tournamentScenes.json` |11 cảnh bản thảo gồm cả2 kết thúc |
|`data/tournamentRewards.json` |Ba mốc currency first_ever |
|`src/core/tournament-content.js` |Validator thuần cho schema, tham chiếu và các invariant |

CLI đọc qua `COLLECTIONS`; runtime import cùng5 JSON và gọi chung assembleContent/validateContent. Định nghĩa giải không được đưa vào danh sách hai quyển đã chơi được. Monica dùng AI chung khi không có profile riêng, giữ quyết định đã chốt trước đây.

Validator kiểm tra số đội/nhóm/roster, memberID độc lập, kit nguồn/AI/điểm/Rank/gear hợp lệ, đủ8 suất vào nhánh, dependency hữu hạn và không tái đấu cùng bảng trước chung kết; cảnh/thưởng đúng giải; không cho bật phát hành, tắt replay hoặc reset permanent progress. Validator không tạo lịch, không sửa save, không phát thưởng và không âm thầm sửa data lỗi.

## 12. Tiêu chí nghiệm thu phần còn lại

- Giải có thể kết thúc bằng vô địch hoặc bị loại, sau đó mở lượt mới ở cả hai trường hợp.
- Save/reload ở mọi checkpoint không reroll lịch/kết quả đã chốt hoặc phát thưởng hai lần.
- Chơi lại không reset quyền nhận đã dùng, cờ truyện hoặc tài khoản; không yêu cầu sở hữu nhân vật mượn.
- Mỗi trận khởi tạo mới đúng HP/MP/status/CD/resource; hai phe dùng chỉ số chuẩn bị cùng đường, không nhầm enemy-level curve.
- Các case Choáng, Extra, Liên kích, Voodoo, cover, khiên, hết40 vòng và quả quyết định được kiểm qua engine thật, không chỉ tick helper.
- Quyển I/II, Arena, gacha, nhiệm vụ ngày, quota và save cũ giữ hành vi cũ.
- Qua kiểm thử nguồn, browser mobile/tay cầm, playtest thắng/thua trước khi phát hành. Test của bước2 chỉ chứng minh dữ liệu hợp lệ, không chứng minh toàn bộ giải đã chơi được.

Cấu hình chuẩn hóa chung nằm ở `trialRules`; thay mức playtest phải đổi policy và mọi build liên quan cùng lúc. Validator kiểm tính hợp lệ theo level/Rank/gear engine và đối chiếu với policy, không hardcode mức30/3/T2 trong từng build.

Nghiệm thu bước1–2 ngày18/11: validate qua đủ5 collection;1.773/1.773 kiểm thử engine qua, gồm24 ca dữ liệu giải; TypeScript và build web qua. Đã kiểm nguồn loader runtime/CLI đồng nhất và không mở quyển/quest/nhân vật sở hữu mới. Graph code cập nhật cục bộ. Không build EXE hoặc tuyên bố giải đã chơi được trong đợt nền dữ liệu này.
