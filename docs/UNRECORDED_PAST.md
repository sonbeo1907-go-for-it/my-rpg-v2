# Biên Niên Ký: Khúc Ca Ngoài Sử Sách

Triển khai 11/11/2026. Tên gốc: Song of the Unrecorded Past. Đây là nội dung thử thách độc lập; không thay thế hai quyển kể chuyện, không khôi phục Hầm Ngục Ảo Ảnh.

## Luồng người chơi

- Kệ Biên Niên Ký có bìa mới → Quest tab Khúc Ca Ngoài Sử Sách → chọn một trong ba màn → **Đi vào** → trang điều kiện riêng `/chronicles/unrecorded/{chimera|ego|calamity}`.
- Không có nút farm lặp. Engine chặn đăng ký target Quest loại trial; vào trial dừng vòng farm cũ. Tự động trong một trận vẫn dùng được, chỉ chạy trận hiện tại.
- Mỗi màn có cùng 6 điều kiện chung và 3 điều kiện riêng, mỗi điều kiện chọn không/I/II/III, không cộng các mức của cùng một điều kiện. Lv60/70/80/90 thêm0/2/4/6 điểm. Tối đa33 điểm.
- Điều kiện, Level và stat đã chốt cho riêng battle; không sửa template PvE. Quay lại từ kết quả giữ Level và lựa chọn trên URL. Chọn lại điều kiện rồi mới thi triển trận tiếp, không có Đánh Lại tự động bỏ qua bảng điều kiện.
- Trinh sát hiện stat sau Level và điều kiện. Combat có thanh thông báo deadline/thích nghi/Nghịch Thời, danh sách điều kiện, điểm yếu và kháng trên thẻ địch.
- Hiện không thêm yêu cầu mở khóa: người dùng chưa chỉ định gate. Ba màn mở trên tab riêng, không bị gate Hiểm Ác cũ và không lọt sang Thảo Phạt/Truy Nã.

## Thưởng (cấu hình playtest)

Thắng nhận1.000 Coin. Không cấp EXP. Pure Prisma theo tổng điểm:

| Điểm tối thiểu | Pure mỗi lần thắng |
| --- | --- |
| 8 | 6 |
| 12 | 12 |
| 16 | 20 |
| 19 | 25 |
| 22 | 30 |

22 điểm là2/3 của33 điểm (làm tròn lên). Một trận22+ đủ lấy trọn hạn mức nếu chưa nhận gì hôm đó. Tổng Pure từ cả3 màn tối đa30/ngày. Thưởng bị chặn ở phần còn lại; vẫn nhận Coin khi đủ trần. Thua/hòa không thưởng. Reset00:00 Việt Nam **lúc nhận thưởng**, không lúc vào trận. Không reset khi đồng hồ lùi ngày.

`unrecordedLedger` là field campaign tùy chọn trong save v7/campaign v3, migration mặc định rỗng. Giữ earned/day/best theo màn và lastSerial không reset mỗi ngày. Claim trên transaction copy; chỉ cập nhật battle/live sau persist thành công. Retry không mất thưởng, cùng serial không cấp lại Coin/Pure/victory. Không ghi lẫn Alice difficulty clears. Save thật của người chơi không được sửa bởi test.

## Cơ chế và đồng hồ

### Dị Thú Tam Đầu — Mutated Chimera

3 actor riêng, tất cả miễn Choáng, có bossClass super cho nội tại săn siêu trùm (như Chen) nhận diện dù không dùng phase script. Đầu Rồng yếu Thủy/Lôi, Sư Tử yếu Phong/Quang, Rắn yếu Hỏa/Thổ. HP nền Lv1 lần lượt1100/1350/950. HP curve superboss theo encounter.

- Deadline bắt đầu khi đầu đầu tiên thực sự gục và vẫn còn đầu sống: vòngR → hếtR+2. Tính cả vòng tạo. Hạ đầu thứ2 không gia hạn.
- Check ở checkOutcome nên nhận cả DoT, đòn nhiều hit và phản ứng. Hạ đủ3 thắng ngay, kể cả ở vòng deadline hoặc nhờ summon cuối vòng; không hồi sinh sau victory.
- Hết toàn bộ Main+Extra của vòng deadline, chỉ những đầu gục hồi50% HP tối đa, xóa status/khiên/preparedMove. MP/CD không reset. Không nhận lượt mới giữa vòng; queue vòng kế được tạo từ người sống. Deadline xóa; lần gục kế có cửa sổ mới.
- Điều kiện riêng: hồi sinh65/80/100%; đầu còn sống +15/30/45% sát thương mỗi đầu gục; đầu sống hồi3/6/9% HP cuối vòng (đầu vừa hồi sinh không nhận thêm regen ở cùng mốc).

### Bản Ngã Tiến Hóa — Evolution’s Ego

HP nền3300, yếu Hỏa/Ám ban đầu, miễn Choáng. Cứ cuối5 vòng thật kể từ đầu trận/lần thích nghi trước, xét lịch sử sát thương của đội mình (bao gồm liên kích, chặn bởi khiên và hit đa hệ). Kháng tối đa2 hệ gây nhiều damage nhất, chọn hệ còn lại ít dùng làm điểm yếu. Nếu đội chỉ có một hệ, kháng hệ đó nhưng vẫn nhận70% damage, điểm yếu chuyển sang một hệ khác. Không tạo miễn nhiễm tuyệt đối.

Kháng là multiplier0,7; Sơ Hở vẫn dùng engine chung, không bị xóa chỉ vì thích nghi. Lịch sử damage xóa sau mỗi lần thích nghi. Không thực hiện thích nghi sau kết quả trận. Extra không làm CD trôi thêm. Điều kiện riêng: chu kỳ4/3/2 vòng; kháng chỉ nhận60/45/30% damage; nhận khiên5/10/15% MaxHP sau thích nghi.

### Tai Ương Thông Tuệ — The Wise Calamity

HP nền3500, yếu Quang/Hồn Kiếm, miễn Choáng. Sau kỹ năng chủ động của nó, đảo **suffix chưa hành động** của queue; giữ history và người đang act. Không cho người đã đi đi lại, không thay quyền Extra hay tạo lượt. Không kích khi choáng/không cast, vận sức chỉ thông báo, không giả là đã đánh.

Cứ cuối4 vòng, đánh dấu vòng kế Nghịch Thời: sort SPD thấp đi trước. Chỉ tồn tại đúng vòng đó; Extra trong vòng đó cũng dùng cùng thứ tự. Trường ưu tiên phe của Monica vẫn là lớp ưu tiên phe, Nghịch Thời đảo thứ tự SPD bên trong lớp đó; không cướp/xóa field của nhân vật.

Điều kiện riêng: chu kỳ Nghịch Thời3/2/1; xung phép Ám cuối vòng30/50/70% MAG (qua resolve hit/giảm damage/khiên/trigger thật, không trừ HP trực tiếp); mất2/4/6% MaxMP cuối vòng. Các hook chỉ chạy một lần sau toàn bộ Extra, không thêm lượt hoặc tick CD. Xung cuối vòng có thể bị né/che chắn theo engine chung.

## Điều kiện chung

Địch MaxHP +15/30/50%; địch ATK/MAG +10/20/30%; địch DEF/RES +15/30/50%; đội mình MaxHP/MP −10/20/30%; đội mình ATK/MAG −10/20/30%; bắt đầu với Vết Thương Sâu2/4/6 lượt chính (−40% hồi HP). Stat nhân **sau** Level, chỉ một lần khi tạo trận. Đầu trận HP/MP đầy trong giới hạn mới. Không đè Rank, Mastery, gear, native hay upgrade của nhân vật.

## Source, asset và kiểm tra

- `data/trials.json`:9 điều kiện/màn, ba mức mỗi điều kiện, tham số hành vi. `data/enemies.json`, abilities/encounters/music dùng validator chuẩn. Mỗi enemy giữ ref1, dùng curve encounter super, skill cố định không Rank.
- `unrecorded-trials.js`: chuẩn hóa điều kiện, ledger, chấm điểm, reward, cơ chế boss và copy combat. Hook tại createBattle/checkOutcome/hit/endRound/resolveAction; orderActorIds cho Nghịch Thời. Forecast clone toàn state nên không tiêu lịch sử/deadline hoặc award trận thật.
- `unrecorded-trials.tsx`, CSS, static routes, Quest/Bookshelf/result/gamepad adapters. Có keyboard focus, nút tier role radio, mobile không tràn ngang, trinh sát/confirm/reward limit.
- SVG riêng ba màn trong public/art; BGM dùng `bgm_sp_song_chimera.mp3`, `...ego.mp3`, `...calamity.mp3`. Menu chọn điều kiện dùng `bgn_song_menu.mp3` được bổ sung cùng task, pause/resume riêng và chia sẻ setting âm thanh. Không lấy hình Arknights hoặc asset có bản quyền bên ngoài.
- Test module mới kiểm tra Level/modifier, deadline inclusive/Extra/hồi sinh/victory, adaptation/immutable template, pending queue, field lifetime, forecast, reward/cap/reset/rollback/idempotence/save migration. Full suite cần giữ test catalog/scaling mở rộng theo nội dung mới.
- Đây là cấu hình cân bằng playtest ban đầu; test lifecycle không chứng minh win rate hay độ khó cuối cùng. Không gắn EXP, daily quest50/150 hoặc thưởng khi thua.

Nghiệm thu 11/11/2026: validate/typecheck, 1.512 test engine, 3 E2E, 3 test native save qua; static export và EXE/NSIS thành công. EXE ở src-tauri/target/release/northern-prisma.exe. Manifest hash/timestamp local ở test-results/song-verification.json. Không chạy phiên chơi bằng save AppData thật, không commit/push.

## C?p nh?t Remulia v? c?nh b?o
Xem [REMULIA.md](REMULIA.md) cho ba m?c nh?n nh?n v?t/? trang b?/c?ng th?c, migration chi?n t?ch c? v? c?nh b?o c? ch? ngay tr?n b?n ??u. Menu v? ba boss d?ng b?n nh?m BGM ri?ng.
