# Cyrus và Siesta — cấu hình playtest 13/11/2026

Nhân vật chính thức #108/#109, `capital_knights`. Cyrus mang tag `archive_librarian`, Siesta `wolf_knight`; không dùng chung tag danh xưng độc nhất của Sandra. Có trong banner thường, lịch phe nhận rosterAdditions từ13/11/2026; không tự mở miễn phí, không thêm Thông Thạo. Siesta có Trấn Phái bổ sung ở mục cuối tài liệu. UI dùng card/icon vai trò và VFX hệ Phong có sẵn.

## Cyrus — Người Giữ Thư Khố Gió

Thủ thư Kị sĩ đoàn Thủ đô, hỗ trợ tấn công Phong, Đánh thường phép theoMAG.

Chỉ số Lv1 playtest: HP165, MP125, ATK10, MAG32, DEF17, RES25, SPD21.

| Kỹ năng | Rank1 | Chi phí playtest |
| --- | --- | --- |
| Phong Điển — Trang Sách Đồng Hành | Đồng đội Phong +30%ATK/MAG,4 lượt chính |16MP/CD3|
| Lật Trang — Gió Xé Kết Giới | Toàn địch50%MAG Phong,2 Sơ Hở Phong và−20%DEF/RES trong3 lượt chính |18MP/CD2|
| Dấu Sách — Lối Gió Trở Về | Đồng đội Phong hồi60%MAG HP và Khai Phá Điểm Yếu3 lượt chính |18MP/CD2|

Nội tại Hơi Thở Giữa Trang Sách dùng `defend_element_mp`: khi thực sự thi triển Phòng thủ, thành viên Phong cùng phe còn sống hồi5%MP tối đa hiện tại, làm tròn lên, kể cả Cyrus. Độc lập với5%MP vốn có của Phòng thủ; Cyrus thường nhận cả hai. Vòng Phụ vẫn kích, Choáng bỏ hành động/được cấp buff Phòng thủ không kích. Không tiêu hạn mức vòng vì thiết kế không có. MP đầy vẫn cap, không hồi sinh.

Buff4 lượt clockmain_turn của từng người nhận; không giảm ở lượt phụ, lượt chính Choáng vẫn giảm. CastR/CD3 dùng lạiR+4, refresh không cộng dồn, có thể bị Phong Ấn/xóa buff. Lọc `targetElement:'wind'` tại skill nên cả hồiHP lẫn buff đều không sang người khác hệ. Sơ Hở và giảmDEF/RES chỉ vào địch thực nhận sát thươngHP/Khiên; tuân Hộ Ấn/miễn hiệu ứng chung. Rank1–5 tăng nhómstat_buff/heal/damage hợp lệ, không tăng Sơ Hở, debuff, hồiMP hoặc Khai Phá.

## Siesta — Nanh Sói Dưới Quân Kỳ

Sói nuôi từ bé, Charlemagnes tìm thấy và dạy dỗ, hiện dưới trướng Percival. DPS vật lí Phong, cầm rìu. Hệ Phong là giả định playtest theo Sơ Hở đã yêu cầu.

Chỉ số Lv1 playtest: HP195, MP85, ATK36, MAG8, DEF20, RES16, SPD18.

Nội tại Bản Năng Bầy Sói dùng `basic_resource`: Đánh thường hợp lệ tạo1 Dã Tính sau khi thi triển, tối đa3, trận độc lập bắt đầu0. Tính mỗi lần dùng, không mỗi hit; kể cả bị né. Không tạo từ kỹ năng, Phòng thủ, phản công hoặc Liên kích, không tạo khi bỏ lượt/commandlỗi. Không tự mất theo thời gian.

| Kỹ năng | Rank1 | Chi phí playtest |
| --- | --- | --- |
| Nanh Rìu — Xé Vòng Vây | Chính240%ATK, hai ôkề180%, gắn2 Sơ Hở Phong mỗi người trúng |10MP/CD1|
| Tiếng Tru — Đánh Thức Dã Tính | Self+50%ATK và Khai Phá Điểm Yếu3 lượt chính |10MP/CD2|
| Bầy Sói — Rìu Cuồng Phong | Hai hit, mỗi hit chính320%ATK, hai ôkề260%ATK |24MP/CD3|

Metadata `resourceFollowUp` nối **Nanh Rìu → Tiếng Tru → Rìu Cuồng Phong → Rìu Cuồng Phong** khi bắt đầu bằng Nanh Rìu và có3 Dã Tính. Chiêu1 tiêu1 để tự dùng chiêu2, chiêu2 tiêu1 để tự dùng chiêu3, chiêu3 tiêu1 để tự dùng lại chiêu3; bản lặp cuối không nối nữa vì hạn mức chiêu3 đã được reserve. Có0/1/2 tầng thì dừng tương ứng trước buff/sau buff/sau một chiêu cuối.

Mỗi chiêu có hạn mức riêng unit/skill/vòng, tính cả bước tự động và Lượt Thêm. `chain:true` chỉ cho phép chính chuỗi metadata này tiếp tục trong reactioncontext; không nới FuA đồng đội, gear hoặc phản công khác. Chiêu2 tự động áp buff nhưng không kết toán/tiêu damage-charge; chỉ các bước tấn công kết toán contextdamage. Chuỗi giữ mục tiêu chính ban đầu qua bước self-buff; khi mục tiêu gục thì chọn địch hợp lệ đầu tiên. Splash chính và hai ôkề không nối vòng.

Chỉ chiêu người chơi bấm trảMP và bắt đầuCD; mọi bước tự động bỏqua MP/CD hiện tại, không đặt CD mới, dùng Rank hiện tại của đúng dòng kỹ năng. Nanh Rìu với3 tầng: trả10MP một lần, không trả10MP chiêu2 hoặc24MP cho hai chiêu3. Mỗi bước tiêu1 tầng ngay trước thi triển; kiểm quota/targets/budgetPvP/chủ sống trước khi tiêu. Không có địch sống thì dừng, không trả thêm. Hạn mức reserve trước effect nên ngay cả vòng tham chiếu chiêu3 về chính nó cũng hữu hạn.

Giải chiêu gốc và kết toán buff có sốlần trước khi chụp buff cho Liên kích; Liên kích giải trước khi tick thời hạn cuối lượt gốc, nên buffATK mới của Tiếng Tru áp dụng ngay. Một lượt chỉ tickstatus một lần, không do Liên kích. Ngoại lệ tự truy kích có metadata riêng, không nới quy tắcFuA đồng đội khác toàn engine.

Bước tự buff nhắm vào Siesta và giữ lại mục tiêu địch ban đầu cho bước sau. Bước tấn công ưu tiên mục tiêu chính cũ nếu còn sống và hợp lệ; nếu mục tiêu gục thì chọn đối thủ hợp lệ đầu tiên rồi lan theo ô cố định. Không có địch sống/chủ gục/budgetPvP chặn thì không tiêu tầng hoặc limiter. Reserve trước sideeffect. SkillthiếuMP/CD/targetlỗi không tiêu tầng. Liên kích dùng reactioncontext và softcap/budgetPvP chuẩn, hai phe và hai bảnSiesta riêng biệt.

## Carry, save, nghiệm thu

Tài nguyên/buff/CD dùng carry có sẵn qua wave/phòng/phase, không tự reset do metadata mới. Trận độc lập0 Dã Tính, limiter mới; forecast clone không tiêu tài nguyên/proc thật. Savecũ thêm nhân vật khóa và tiến trình mặc định, giữ ID release cũ. Phân biệt chỉ số/MP/CD playtest với những hệ số người dùng đã chốt; các giá trị chưa chỉ định đã dùng phán đoán triển khai, không coi là số cân bằng cuối.

`test/cyrus-siesta.test.js`: save/pool/AI, lọc Phong, hồiMP, main/extra/Choáng/CD4lượt, resource/cap, từngquota, không vònglặp, splash không nối vòng, forecast/lệnhlỗi, Rank và Arena đối xứng. Kiểm tra toàn engine, validate/typecheck, previewbrowserdesktop/mobile. Không sửa save thật.

## Trấn Phái Siesta — Nanh Rìu Bầy Sói

Mở công thức bằng 10 Bản Thiết Kế theo shop hiện hành, chế tạo và trang bị theo luật Trấn chung. Chỉ khi mang Trấn: bắt đầu trận độc lập với 3 Dã Tính; không nạp lại khi carry actor qua wave/phòng. Hai phe Arena áp dụng riêng theo người mang.

Sau một Đánh thường hợp lệ (kể cả bị né), nhận 1 tầng vốn có rồi thử nhận thêm 1 tầng với xác suất `min(1, max(0, ATK căn bản) / 150)`. Tính phân bổ, trang bị và phần cộng căn bản; không dùng buff ATK phần trăm. Trần vẫn 3; đã đầy sau tầng thường thì không quay RNG. Không kích từ kỹ năng/Phòng thủ/phản ứng/lượt bị choáng hoặc lệnh lỗi. Lượt Thêm có thể kích như Đánh thường thường; không có hạn mức theo vòng. Forecast không thay RNG hay tài nguyên trận thật; reload snapshot không khởi tạo lại tài nguyên.
