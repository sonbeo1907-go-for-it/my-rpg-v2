# Giải học viện — NPC, cảnh truyện và đăng ký sau First Clear

> **Hiện trạng 18/11/2026:** Bước7–8 đã triển khai shop Huy Hiệu riêng và bốn siêu trùm hiếm. Xem [ACADEMY_TOURNAMENT_REWARDS_SPECIALS](ACADEMY_TOURNAMENT_REWARDS_SPECIALS.md) để biết luật hiện hành; phần mô tả “chưa thưởng/chưa boss” và bảng thưởng v1 bên dưới là lịch sử.


Cập nhật bước 6 ngày 18/11/2026. Nội dung và quan hệ mới do tác giả triển khai cho giải; không tự sửa biography hoặc lịch sử của các nhân vật playable bên ngoài sự kiện này.

## NPC và cảnh

26 đội NPC có captain, khoa/lớp, tính cách, mục tiêu và danh sách cảnh. 18 filler có lời chào ngắn; 4 đội quan hệ có tuyến gặp gỡ/trước trận/thắng/thua: Niall (bạn cũ Luka), Celine (đối thủ học thuật Charlotte), Brenan (bất đồng buổi thực hành với Gairyu), Violetta (bạn diễn cũ Ariel). Bốn đội có kit phối hợp khác nhau, không còn dùng chung đội hình placeholder.

Rotary, Monica, Lumine và Eri có cảnh tỷ thí riêng. Bản boss đặc biệt của họ vẫn chưa triển khai. Cảnh sau thắng/thua xét kết quả đã xác nhận theo góc nhìn người chơi; không phản ứng vào kết quả đang chờ hoặc retry. Nếu NPC khác loại một đội chủ chốt, có cảnh rời sân riêng, không ép đội đó vào nhánh sau.

tournamentScenes có70 cảnh, gồm11 cảnh gốc,58 cảnh theo đội và1 cảnh đăng ký đội riêng. tournament-story.js tạo entries theo roster/đội đã chọn/current fixture/kết quả thật. Cảnh quan hệ chỉ hiện khi nhân vật được nhắc đến thuộc roster người chơi. Đội riêng không bị kể là 7A hoặc nhận các chương 7A ép sẵn. Có journal “Chưa đọc / Tất cả”, modal đọc, cờ đọc per-run theo scene+match; đọc lại idempotent. Cờ đọc không phát thưởng hoặc đổi RNG/kết quả. Cảnh chỉ xem nếu đội thật sự tham dự.

Snapshot khóa cả văn bản cho mùa đang chơi. Phiên cũ không có snapshot cảnh vẫn load được và không bị ghép kịch bản mới giữa chừng; mở mùa mới để có bộ cảnh mới. Các cảnh hiện optional, không chặn xuất chiến để ép đọc toàn bộ.

## Quyền mở sau First Clear

Không tạo thêm cờ First Run. tournamentRegistrationFlags suy ra quyền tên đội/roster/build từ First Clear. Trước clear luôn đội7A mượn chuẩn hóa. Sau clear có thể tiếp tục mượn7A hoặc đăng ký đội riêng.

Đội riêng: tên1–40 ký tự, trim, không ký tự điều khiển; sáu nhân vật khác nhau đã sở hữu, loại developerOnly. Dùng build tài khoản lúc xác nhận: Level, điểm phân bổ, Rank/Thông Thạo hợp lệ, nâng cấp truyện, các ô gear/Trấn và chỉ số đã rèn. Đây là ngoại lệ mới cho account mode so với luật loan không Thông Thạo. NPC vẫn build mượn Rank3, không tự tăng theo tài khoản.

Rostering thực hiện trước chọn pool NPC; tránh cùng nhân vật thật đăng ký hai đội. NPC gốc tái dùng kit không bị nhầm thành cùng người. Chốt roster6/build/name một lần, sau đó chỉ đổi4 người xuất chiến/vị trí trong roster ấy giữa các trận; không có lệnh sửa đăng ký giữa mùa. Muốn roster mới phải kết thúc/rút mùa và đăng ký mùa mới. Trang bị thật thay đổi ngoài giải không tác động build đã chụp, và gear/ownership thật không bị tiêu hao hoặc thay đổi bởi combat.

tournament-registration.js chỉ giữ loadout của sáu người, các gear/Trấn được mặc, flags cần giải kỹ năng và serial để kiểm save; không sao chép kho đồ/thành tích/session khác vào snapshot. Snapshot build được xác nhận trước publish/save. Dữ liệu trận/runId/revision vẫn chống lệnh cũ; caller persist nguyên tử như hiện tại.

## Nghiệm thu và giới hạn

Test source kiểm gate trước clear, tên/roster sai, sở hữu, snapshot build/gear, không trùng người thật, bảo toàn roster khi đổi lineup, read flags save/reload và nhánh kết quả. Playwright kiểm đăng ký đội riêng từ nhân vật sở hữu, đọc/journal, reload và responsive. Phần thưởng giải, balance NPC chi tiết, boss hiếm vẫn là các bước tiếp theo.
