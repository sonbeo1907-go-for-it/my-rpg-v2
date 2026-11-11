# Remulia và phần thưởng Khúc Ca Ngoài Sử Sách

Trạng thái: đã triển khai, 11/11/2026. Quyết định mới nhất của người dùng là nguồn ưu tiên.

## Nhân vật

Remulia — Thiếu Nữ Của Khúc Ca, ID ổn định `remulia`, releaseId 104. DPS ma pháp hệ Thường, thuộc Làng Phương Bắc. Nhận miễn phí qua ba thử thách; không vào Chiêu Mộ thường hay rate-up.

Chỉ số playtest Lv1: HP 160, MP 120, ATK 9, MAG 39, DEF 14, RES 24, SPD 18.

| Kỹ năng | Hiệu ứng Rank 1 | MP / CD |
| --- | --- | --- |
| Dạo Khúc — Tiếng Gọi Đầu Tiên | +30% MAG và Khai Phá Điểm Yếu, 4 lượt chính của Remulia | 16 / 3 |
| Điệp Khúc — Ký Ức Không Tên | 180% MAG toàn địch, tạo 1 Khúc Ca | 12 / 0 |
| Chung Khúc — Ngoài Trang Sử | 320% MAG toàn địch; có 10 Khúc Ca lúc bắt đầu chiêu thì tiêu hết để hồi phục đội | 24 / 3 |

Các con số MP/CD/chỉ số nền chưa được người dùng chỉ định là cấu hình playtest. Rank tăng sát thương 10%, buff chỉ số 5% theo engine hiện tại; Khai Phá Điểm Yếu, lượng tầng và hồi phục 100% không tăng theo Rank. Không mở Thông Thạo cho release 104.

## Nội tại và đổi hệ

`exposure_attunement` chụp Sơ Hở còn tầng hợp lệ trên từng mục tiêu ngay khi bắt đầu kỹ năng tấn công. Mỗi địch nhận hệ riêng; địch không có Sơ Hở nhận hệ gốc. Không thêm hệ Thường vào đòn đã đổi hệ. Nhiều hit dùng cùng ảnh chụp và tiêu một tầng Sơ Hở cho cả hành động theo luật chung.

Sau chiêu, nếu có ít nhất một mục tiêu mang Sơ Hở trong ảnh chụp, nhận 2 Khúc Ca một lần cho toàn chiêu, kể cả khi các hit bị né. Không tính đánh thường, Phòng thủ, Liên kích hoặc kỹ năng bị chặn trước khi thi triển. Khúc Ca tối đa 10; Điệp Khúc vẫn tạo riêng 1 tầng.

Chung Khúc xét đủ 10 tầng trước khi trả chi phí/đánh. 9 tầng không được dùng 2 tầng nội tại sắp tạo để thanh toán hồi phục. Sau khi chiêu dùng đủ 10 tầng, nội tại có thể tạo lại 2 tầng cho lần kế tiếp. Không tiêu Khúc Ca thì vẫn trả MP và gây sát thương bình thường.

## Hồi phục toàn đội

Effect tái sử dụng `restore_team`, tham số `resource` và `minimum`. Chỉ tác động đồng đội còn sống tương đối với người thi triển: xóa toàn bộ debuff, đồng bộ lại trần HP/MP, hồi đầy HP/MP và đặt CD các kỹ năng chủ động có CD được sở hữu về 0, gồm chính Chung Khúc. Không hồi sinh; không làm mới nội tại, gear proc, companion timer, thời hạn mode, Thêm Lượt hoặc lượt đã dùng. Buff còn nguyên. Phần hồi phục không tăng theo Rank.

Khúc Ca là tài nguyên trận đấu thông thường; không thêm persistence riêng. Tuân thủ quy tắc tạo trận/chuyển phòng của engine, không sửa save giữa forecast. Stun skip không cast và không tạo tầng. Vòng Phụ dùng cùng luật mỗi lần thi triển, không có giới hạn theo vòng mới. Hai đội PvP giữ tài nguyên và mục tiêu tương đối riêng.

## Trấn Phái

Âm Thoa Thất Truyền: đồng đội khác dùng kỹ năng trực tiếp gắn Sơ Hở thành công thì Remulia +10% MAG đến hết trận, tối đa 3 tầng. Một kỹ năng AoE/nhiều hit chỉ tăng một tầng; refresh Sơ Hở thành công vẫn tính. Hộ Ấn chặn hết các lần áp thì không kích hoạt. Không tính chính Remulia, Liên kích, phản công, gear hay nội tại tạo Sơ Hở. Buff có thể bị xóa, sau đó gây dựng lại theo luật buff thường.

Adapter `ally_exposure_self_buff` dùng status có persistent/maxStacks; không kiểm tra tên hiển thị. Việc gắn Sơ Hở được ghi trong context của đúng hành động, không suy ra từ toàn bộ event queue nên phản ứng lồng không kích nhầm.

## Mốc thưởng, save và giao dịch

- Thắng đủ cả ba màn, kể cả 0 điểm: mở Remulia.
- Mỗi màn có kỷ lục từ 12: mở thêm một ô gear Remulia, tối đa ba ô. Mốc đạt trước khi nhận nhân vật được giữ và cấp khi nhận cô.
- Một màn có kỷ lục từ 22: mở công thức Âm Thoa Thất Truyền; chế tạo vẫn yêu cầu sở hữu nhân vật và nguyên liệu.

Nguồn chân lý là `unrecordedLedger.best`; kiểm tra tồn tại key để nhận biết chiến thắng 0 điểm. `grantTrialMilestones` chạy trong claim transaction và sau deserialize để xét cả chiến tích trước cập nhật. Receipt từng ô trong storyFlags ngăn phát lại khi load; recipe gate cũng được engine kiểm tra từ kỷ lục. Không thay namespace AppData, ID cũ hay version envelope v7. Không chỉnh file save thật của người chơi.

## Cảnh báo và âm nhạc

Menu dùng `song_menu` (`bgn_song_menu.mp3`); ba trận dùng nhóm riêng `song_chimera`, `song_ego`, `song_calamity`. Tên file bgn của menu được giữ nguyên theo asset.

Cảnh báo có state và xuất hiện ở bảng cơ chế ngay cả khi Battle Logs tắt. Chimera: mở đếm sau đầu gục đầu tiên, nhắc vòng cuối, báo hồi sinh. Ego: báo đầu vòng sắp thích nghi và báo hệ mới khi đổi cuối vòng. Calamity: báo vòng Nghịch Thời kế tiếp, báo khi vào hiệu lực và khi đảo các lượt chưa dùng. Đòn có windup dùng cảnh báo tên chiêu/vòng sẵn sàng. Lịch sử giới hạn 12 thông báo, có số vòng; không lưu sang trận khác.

## Kiểm thử

`test/remulia.test.js`, `test/trial-warnings.test.js`, `test/unrecorded-trials.test.js`, `test/game-music.test.js`; UI `e2e/unrecorded-trials.spec.ts`. Bao gồm mixed-element AoE, trần tài nguyên, threshold trước chiêu, hồi phục/cleanse/CD, không hồi sinh, mirror PvP, forecast không sửa live, lượt bị Choáng, Vòng Phụ, claim lỗi ổ đĩa và migration không cấp trùng.
