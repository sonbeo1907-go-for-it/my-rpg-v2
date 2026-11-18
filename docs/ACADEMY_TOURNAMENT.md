# Giải đấu học viện — đặc tả triển khai v1

> Cập nhật thiết kế 18/11/2026: phân loại NPC, seed giới thiệu, First Clear và pool sau First Clear ở mục 13. Đây là giải truyện với NPC trong trường, không phải Arena. Dữ liệu bước 2 vẫn là bản nền 16 đội cũ; các quyết định mới chưa được triển khai vào JSON/validator/runtime.

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

Bốc thăm từ4 nhóm hạt giống, mỗi nhóm4 đội; mỗi bảng nhận1 đội từ mỗi nhóm. Dùng seed của lượt chơi. Nhóm của người chơi được **đổi nhãn thành A sau bốc thăm**. Cấu hình giới thiệu dùng seed cố định và bố trí cuộc gặp bạn cũ Luka theo mục 13; không áp câu “mọi lượt đều bốc thăm tự do” cho lượt đầu. Lượt ngẫu nhiên sau First Clear dùng seed mới, kết quả vẫn có thể vô tình trùng.

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

Trong dữ liệu bước 2 hiện tại, build NPC là **mẫu kit**, không phải nhân vật gốc cũng đăng ký ở đội khác. Thiết kế mới cho phép Rotary, Monica, Lumine và Eri đích thân tham gia đội thi (mục 13); phải phân biệt NPC tái dùng kit với nhân vật thật, không đổi tên một NPC filler rồi coi đó là nhân vật chính thức. Mỗi học viên NPC có ID/tên riêng; tái dùng kit không đưa60 người mới vào roster/gacha. Runtime phải chuẩn bị họ bằng đường build nhân vật (điểm/Rank/gear), không áp enemy-level curve lên chỉ số nguồn. Chỉ số nền nguồn vẫn ởLv1.

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
| ID lượt mới; seed theo chính sách giới thiệu/ngẫu nhiên ở mục 13 |Lịch sử, tổng thành tích, thứ hạng tốt nhất |
| Bảng/lịch/nhánh khởi tạo lại theo cấu hình của lượt |Cờ truyện vĩnh viễn đã đạt |
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

## 9. Đội tham gia và định hướng — dữ liệu nền bước 2

Bảng dưới là snapshot dữ liệu đang có, **không phải pool cuối cùng theo thiết kế mới**. Không tự gán các đội này vào 18 filler/4 đội quan hệ khi chưa viết và duyệt hồ sơ.

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


## 13. Thiết kế cập nhật: NPC và lượt giới thiệu

### 13.1. Bản chất sự kiện

Đây là câu chuyện về lớp 7A tham gia giải đấu học viện với các đội NPC có danh tính. AI và chuẩn bị nhân vật có thể tái dùng cơ sở kỹ thuật đối xứng, nhưng không kéo theo luật, giao diện tìm trận, ban/pick hoặc nhịp trải nghiệm Arena. Đối thủ cần hiện diện trong đời sống học viện; trận đấu là một phần của quan hệ truyện.

### 13.2. Những yêu cầu đã được người dùng chốt

- Có First Clear Flag vĩnh viễn theo hồ sơ; trước First Clear dùng **cấu hình giới thiệu và drawSeed cố định**. Không ép kết quả chiến đấu theo seed truyện.
- Có **18 đội NPC phụ (filler)** để làm đầy giải và tạo đa dạng đội hình.
- Có **4 đội NPC chủ chốt có quan hệ với lớp 7A**. Trong đó một đội có bạn cũ cùng quê Luka, gắn với cấu hình giới thiệu cố định. Ba đội còn lại phải có quan hệ với thành viên 7A; chưa chốt tên, tiểu sử hay quan hệ cụ thể.
- Sau First Clear, mỗi giải có **1–2 đội chủ chốt**, phần còn lại là filler; vẫn có lớp 7A.
- Đội chủ chốt thường có xác suất thắng cao hơn khi mô phỏng các trận NPC.
- Rotary, Monica, Lumine và Eri có thể xuất hiện trong giải. Ngoài ra có bốn cuộc chạm trán siêu trùm hiếm ở các lượt giải được mở sau First Clear, tương ứng bốn người này; bản siêu trùm không bắt buộc giống bộ kỹ năng playable.

### 13.3. Số đội và pool

Giữ giải 16 đội, nên có 15 suất NPC bên cạnh 7A. Cách quy đổi yêu cầu “14 hoặc 15 filler, 1–2 chủ chốt” để không vượt số đội:

| Cấu hình sau First Clear | Filler | Chủ chốt | 7A | Tổng |
| --- | --- | --- | --- | --- |
| Một đội chủ chốt | 14 | 1 | 1 | 16 |
| Hai đội chủ chốt | 13 | 2 | 1 | 16 |

Đây là điều chỉnh số học theo thể thức đang giữ, không phải tăng giải lên 17–18 đội. Tỷ lệ chọn hai cấu hình **chưa được người dùng chốt**; 50/50 là đề xuất playtest, không phải luật đã duyệt.

Pool mục tiêu của phương án triển khai: **26 đội NPC**, gồm 18 filler + 4 đội quan hệ với 7A + 4 đội do Rotary/Monica/Lumine/Eri đại diện. Hai nhóm sau đều tính là chủ chốt. Đây là phương án tổ chức nội dung để giải quyết pool, không phải 26 đội cùng thi. Cộng đội 7A là 27 định nghĩa đội; mỗi giải vẫn chỉ chọn 16. Chưa có tên/roster hoàn chỉnh cho các đội mới.

### 13.4. First Clear là mốc tiến trình duy nhất

**Quyết định mới nhất thay thế các cách diễn đạt cũ:** bỏ First Run. Không tạo cờ “đã kết thúc lượt đầu” hoặc dùng số lượt đã chơi để mở nội dung. First Clear nghĩa là hồ sơ đã vô địch giải ít nhất một lần.

| Trạng thái khi tạo lượt giải | Cấu hình |
| --- | --- |
| Chưa First Clear | Cấu hình giới thiệu cố định; 7A + 4 đội quan hệ + 11 filler chọn sẵn; bảo đảm bạn cũ Luka cùng bảng |
| Đã First Clear | Chọn theo quota ở mục 14; 1–2 đội chủ chốt; mở khả năng sinh encounter siêu trùm hiếm |

Thua, bị loại hoặc rút giải không bật First Clear. Chơi lại trước khi clear vẫn dùng cấu hình giới thiệu. Vô địch lần đầu phải chốt kết quả giải và First Clear trong cùng giao dịch lưu thành công; lỗi lưu giữ kết quả chờ, không mở nội dung sớm. Cờ vĩnh viễn độc lập với ledger thưởng: chưa bấm nhận thưởng không đồng nghĩa chưa clear. Chơi lại/qua ngày/cập nhật luật không xóa cờ.

Lượt giải đang diễn ra giữ nguyên cấu hình đã chốt lúc tạo. Vô địch không chèn siêu trùm vào phần cuối lượt giới thiệu; pool mới và gate encounter chỉ áp dụng khi mở lượt giải tiếp theo.

Tách danh tính và các luồng ngẫu nhiên:
- `runId`: duy nhất cho mỗi lượt giải mới, kể cả khi dùng cùng cấu hình giới thiệu; tạo lượt phải chống nhấn lặp bằng token/revision.
- `drawSeed`: cố định theo phiên bản cấu hình giới thiệu trước clear; mới mỗi lượt giải sau clear. Chốt chọn đội/bốc thăm/lịch. Không suy drawSeed chỉ từ runId.
- `simulationSeed`: luồng độc lập cho NPC–NPC, đề xuất mới mỗi lượt giải; kết quả từng trận chỉ commit một lần.
- `combatSeed`: độc lập theo lượt giải và trận. Mở lượt giải mới tạo seed mới; thử lại cùng trận hoặc tải save giữ nguyên seed và checkpoint/RNG đã lưu.
- `encounterSeed`: luồng riêng cho encounter hiếm, chỉ dùng ở lượt đủ điều kiện; quyết định và kết quả đã lưu không quay lại khi xem menu hoặc tải save.

Seed cố định bảo đảm cuộc gặp và lịch giới thiệu, không ép thắng thua hoặc buộc các lượt chơi mới lặp toàn bộ RNG chiến đấu. Cấu hình/version, danh sách đội và snapshot luật đã lưu không bị đổi bởi cập nhật giữa phiên.

### 13.5. NPC phụ và chủ chốt

NPC phụ cần tên, khoa/lớp, một nét nhận diện, build và chủ đề đội; không cần tuyến truyện dài. Đội chủ chốt cần 1–2 gương mặt được viết sâu: động cơ, quan hệ, giọng thoại, cảnh trước/sau trận và phản ứng thắng/thua.

Các hướng quan hệ với Charlotte, Gairyu và Ariel trong kế hoạch trước chỉ là đề xuất, chưa phải canon. Clark và Mariel phải có vai trò xuyên tuyến, không chỉ phụ họa. Theo [hướng dẫn viết cảnh](STORY_SCENE_WRITING_GUIDE.md), không suy tính cách từ kit hoặc tự ghi tiểu sử mới vào nhân vật.

Main NPC được bảo đảm có tương tác phù hợp khi xuất hiện, **không được bảo đảm đi tiếp**. Cảnh ngoài sân không cần chờ đối đầu trực tiếp; hậu trận chỉ chạy khi thực sự có trận. Không viết sẵn họ ở chung kết nếu đã bị loại.

### 13.6. Lợi thế mô phỏng

Áp lợi thế vào rating/độ phối hợp khai báo của đội chủ chốt trong mô phỏng NPC–NPC. Mức lợi thế chưa có con số được duyệt; cần cấu hình, thử nhiều seed và ghi tỷ lệ đi tiếp trước phát hành. Filler vẫn có thể thắng, hai đội chủ chốt gặp nhau vẫn xét tương quan bình thường; không sửa kết quả đã chốt hoặc cứu đội bị loại.

Khi đấu trực tiếp với người chơi, không có xác suất thắng ngầm. Sức mạnh phải đến từ build, kit, đội hình và AI hợp lệ, có thể trinh sát; giữ ngân sách chuẩn hóa hoặc công khai ngoại lệ được duyệt. Nhãn chủ chốt không tự cấp buff chiến đấu.

### 13.7. Nhân vật thật trong giải và siêu trùm

Rotary/Monica/Lumine/Eri trong giải dùng cấu hình tỷ thí học viện, chiếm suất đội bình thường, có thể bị loại. Bản siêu trùm dùng enemy/encounter và luật riêng; không sửa playable hoặc áp chỉ số siêu trùm lên đội thi. Chưa có level, kit, phần thưởng hay tần suất siêu trùm được chốt.

Phương án đề xuất: cuộc chạm trán tùy chọn ở khoảng nghỉ, tối đa một lần mỗi lượt giải; tung và lưu kết quả khi tạo lượt để chống reload đổi kết quả. Con số 15% từng được đề xuất **chưa được duyệt**. Không bắt buộc đánh để tiếp tục giải, không tính kết quả vào bảng đấu. Cách hồi phục, thưởng và hạn chế lặp nhân vật cũng cần chốt trước triển khai.

### 13.8. Các bước cập nhật tiếp theo và nghiệm thu

1. Dùng First Clear làm gate duy nhất; triển khai contract seed, quota và định danh ở mục 14 trước khi thêm nội dung.
2. Viết/duyệt 18 đội filler, 4 đội quan hệ và 4 đội đại diện nhân vật thật theo pool mục tiêu.
3. Mở rộng schema/validator: pool khác danh sách tham dự; phân loại đội; giới hạn số đội; cấu hình giới thiệu và trạng thái hồ sơ. Không chỉ thêm đội vào teamIds hiện tại vì validator cũ đang yêu cầu đúng 16.
4. Triển khai chọn đội đồng thời theo quota hạt giống và chủ chốt, sau đó bốc thăm/lịch và mô phỏng có lưu seed. Sau đó tích hợp phiên/save/First Clear/replay.
5. Viết cảnh theo đối thủ và kết quả; triển khai combat tỷ thí rồi mới thêm các siêu trùm hiếm.
6. Kiểm tra đủ 16 đội mỗi lượt, đúng quota chủ chốt, không trùng người thật, reload không reroll; thua/rút lui/chơi lại không mất cờ hoặc nhân đôi thưởng; ưu thế NPC không thành buff bí mật khi đấu người chơi.

**Trạng thái cập nhật này: chỉ tài liệu.** JSON, validator, test và runtime vẫn ở nền bước 2 nêu tại mục 11; chưa có pool 18 filler, 4 đội quan hệ, First Clear hay encounter hiếm chạy trong game.


## 14. Phương án giải quyết blocker trước implementation

Các tên trường dưới đây là **contract schema đề xuất**, chưa tồn tại trong code. Cần cập nhật JSON, validator, loader, save và test đồng bộ; không thêm trường chỉ để validator bỏ qua.

### 14.1. Chọn theo quota hạt giống

Tách `candidateTeamIds` (pool nội dung) khỏi `participantTeamIds` (16 đội đã chốt trong phiên). Mỗi định nghĩa đội có `seedPot` và `narrativeRole` = filler/key/player. Mỗi giải phải có đúng 4 đội mỗi pot 1–4; 7A chiếm một suất pot 4, nên số NPC cần chọn lần lượt **4/4/4/3**.

Phân bổ authoring khả thi ban đầu:

| Pool | Pot 1 | Pot 2 | Pot 3 | Pot 4 | Tổng |
| --- | --- | --- | --- | --- | --- |
| Filler | 5 | 5 | 4 | 4 | 18 |
| Bốn đội quan hệ | 1 | 1 | 1 (bạn cũ Luka) | 1 | 4 |
| Bốn đội nhân vật thật | Phân pot theo sức mạnh sau playtest; không bắt buộc mỗi pot một đội | — | — | — | 4 |
| 7A | 0 | 0 | 0 | 1 | 1 |

Giới thiệu chọn cả bốn đội quan hệ, rồi filler theo quota **3/3/3/2**; bạn cũ pot 3 và 7A pot 4 được khóa cùng bảng trước khi điền các suất còn lại. Kiểm ràng buộc ngay lúc authoring, không hy vọng một seed ngẫu nhiên sửa được hai đội cùng pot.

Sau clear, chọn số đội chủ chốt K = 1 hoặc 2 theo trọng số cấu hình. Bộ chọn có seed dùng tìm kiếm hữu hạn/backtracking trên tổ hợp nhỏ: chọn các đội chủ chốt không xung đột định danh, giữ đủ suất cho từng pot, rồi điền filler trong từng pot. Rút gọn nhánh ngay khi không còn đủ ứng viên. Không chọn 15 đội tùy ý rồi đổi pot để vá, không nới quota hoặc lặp roll vô hạn.

Validator phải chứng minh mỗi cấu hình K có trọng số dương có ít nhất một tập hợp hợp lệ. Nếu thiếu, báo lỗi nội dung kèm pot/quota/xung đột; không bắt đầu phiên và không ghi save nửa chừng. Thứ tự ứng viên chuẩn hóa trước khi shuffle để cùng seed/content version có cùng kết quả.

### 14.2. Thay hợp đồng replay một seed

Schema mới dùng chính sách seed theo mục 13.4, thay invariant `replay.newSeed === true`. Không đổi ý nghĩa boolean cũ một cách im lặng. Giữ `replay.enabled`, điều kiện phiên đã kết thúc, preserve ledger/cờ/account và chống tạo hai lượt.

Runtime lưu runId, drawSeed, các seed/tiến độ RNG độc lập, phiên bản cấu hình, participantTeamIds và luật snapshot. ID instance đơn vị phải dựa trên runId/đội/ô, không dựa riêng drawSeed vì drawSeed giới thiệu được dùng lại. Nếu gặp save thử nghiệm cũ khi migration, không tự coi một lượt đã kết thúc là First Clear; chỉ suy từ kết quả champion đã được lưu đáng tin cậy, nếu không giữ false.

### 14.3. Định danh học viên gốc và nhân vật thật

Mỗi member có memberId độc lập và `identity` theo tagged union:
- `kind: original_npc`, `npcId`: học viên gốc; buildId có thể tái dùng templateCharacterId. Dùng kit Monica không có nghĩa học viên đó chính là Monica.
- `kind: named_character`, `characterId`: chính Rotary/Monica/Lumine/Eri; tham chiếu nhân vật thật và build thi đấu riêng, không cấp ownership/gear vào tài khoản.
- `kind: player_loan`, `characterId`: sáu người lớp 7A, chọn bốn xuất chiến như hiện tại.

Kiểm memberId/npcId phù hợp, characterId và build nguồn khớp nhau. Sau khi chọn danh sách tham dự, mỗi characterId thật chỉ được đăng ký ở một đội (kể cả người dự bị); không cấm một nhân vật có nhiều phương án đội trong pool nhưng không thể cùng được chọn. Tương tự không nhân bản một npcId gốc trong hai đội tham dự. Unit instanceId combat vẫn riêng, không dùng characterId làm ID đơn vị.

Siêu trùm có enemyId/encounterId riêng, có thể tham chiếu characterId cho lore nhưng không dùng roster thi đấu để suy ra kit boss. Cùng nhân vật xuất hiện ở giải và cuộc chạm trán riêng không phải hai đăng ký đội; việc hạn chế lặp mặt là chính sách nội dung riêng chưa chốt.

### 14.4. Ma trận nghiệm thu bắt buộc

- Giới thiệu luôn đủ 16 đội/4 đội mỗi pot, bạn cũ khác pot và cùng bảng 7A; không ép kết quả.
- Sau clear: K=1 → 14 filler, K=2 → 13 filler; quota 4/4/4/3 NPC luôn đúng, đội chủ chốt tính gồm đội nhân vật thật.
- Chạy nhiều seed; dữ liệu không khả thi thất bại hữu hạn trước ghi phiên; seed giống với cùng version cho cùng bốc thăm.
- Thua/rút lui chưa clear → seed giới thiệu; champion commit thành công → clear; lỗi lưu/nhận thưởng chậm không tạo sai gate.
- Chơi lại: runId/unit instance mới dù drawSeed cũ; combat seed mới. Retry/reload cùng trận không reroll; AI kết quả commit một lần.
- Trước clear không sinh siêu trùm; sau clear chỉ có cơ hội, không bảo đảm xuất hiện. Không thêm vào lượt đã tạo trước khi clear.
- Nhân vật thật trùng hai đội bị chặn; NPC dùng cùng kit nhưng khác npcId không bị nhận nhầm thành cùng người. Bản boss không làm đổi playable.

Tần suất siêu trùm, trọng số K, lợi thế rating và kit/thưởng boss vẫn là cấu hình cần playtest; các giá trị 15% và 50/50 trước đây không tự trở thành quyết định đã chốt.
