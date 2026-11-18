# Tỷ thí học viện — combat và giao diện bản chơi thử

Triển khai bước 4–5 ngày 18/11/2026. Route `/chronicles/academy`, mở từ thẻ riêng trên kệ Biên Niên Ký. Definition enabled=true/publication=playtest. Không phải Arena; không cần sở hữu 7A. Nội dung đối thủ/quan hệ vẫn nháp, chưa có payout, boss hiếm hay cảnh đối thủ đầy đủ (các bước sau).

## Combat adapter

tournament-combat.js dựng campaign mượn độc lập, Lv/điểm/Rank/T2 theo snapshot, không Thông Thạo/Trấn/tiến trình tài khoản. Tạo battle bằng opponentCampaign nhưng đánh dấu tournament riêng: arena=null, không pvpRules/soft cap. Hai phe đều là actor nhân vật, có Rank/nội tại/tài nguyên và ID theo run/phe/ô/definition. Original NPC dùng tên học viên, named_character giữ danh tính thật. AI tái sử dụng bộ chọn kỹ năng đối xứng, không dựng AI riêng Monica.

Mỗi trận mới hồi đầy HP/MP; tất cả status/khiên/CD/resource/mode khởi tạo mới qua createBattle. Retry khởi tạo lại cùng seed. Không reset giữa hit, Main/Extra hoặc khi tải lại. Sau mỗi hành động clone → execute → checkpoint/propose kết quả nếu kết thúc → persist → publish. Lỗi lưu không publish tiến trình combat mới; không retry RNG trên bản runtime đã mutate. Đóng trang chỉ unmount, không xử thua.

Snapshot combat dùng serializer Set/Map/RNG hiện hành, khôi phục qua dữ liệu kit đã chốt. Tài khoản không nhận gear mượn, XP, Coin, victories, daily hoặc Danh Dự. Kết quả trận chỉ cập nhật giải khi người chơi xác nhận. Hết trận vẫn xem lại kết quả được sau reload; thua có thể retry hoặc accept. Trở về giải trong lúc đánh giữ checkpoint và khóa thay lineup cho trận đó.

## Giới hạn 40 vòng

tournament-judging.js được gọi ở kết toán vòng sau khi Main và Extra đã xong. Không cắt giữa phản ứng/hit/lượt choáng. Nếu chưa có outcome thường: so số người sống, tổng tỷ lệ HP động, sát thương HP trực tiếp thực gây, cuối cùng RNG bốc thăm đã lưu. Damage trực tiếp theo event hit, không cộng khiên/overkill/tự gây/DoT. Có outcome victory/defeat, không áp luật hòa Arena. Luật hiện ngay trong modal và trinh sát.

## Giao diện

academy-tournament.tsx gồm đăng ký, overview, bảng/fixtures, đội hình mượn sáu chọn bốn (đổi chỗ nếu chọn người đã có), trinh sát và xác nhận, battle thông qua scoped GameContext, kết quả, rút giải và replay. BattlePage tái sử dụng kỹ năng/target/VFX/log hiện hành, nhưng có tiêu đề/return/result tỷ thí riêng. Scoped context không ghi đè runtime trận thường toàn ứng dụng. Cần hoàn tất trận nội dung khác trước khi tỷ thí.

Mobile chọn bảng A–D để giảm chiều dài. Tay cầm dùng focus không gian/A/B/RS, modal focus trap có sẵn; combat dùng skill/target/help của BattlePage. BGM chiến đấu thường, thắng dùng victory, rời trang trả route audio. Không có combat auto-farm trong giải.

## Thiết kế và kiểm tra

Dùng taste skill hướng true-black-flat, giữ bảng màu/font/theme JRPG đã có; chữ/chấm màu phục vụ lớp 7A và kết quả. Panel mới dùng nền phẳng, không shadow; action chính đặt trước, mobile không tràn ngang. Header/logo giữ thiết kế thương hiệu có chữ The nhỏ và viền/glow đã được yêu cầu trước; không sửa logo chung để khớp giới hạn kích thước chữ của inspector. Font fallback cảnh báo trên HTML QA tĩnh cần đối chiếu browser thật đã tải font.

Test engine qua createBattle/executeAction thực, hai phe, save envelope, RNG, outcome/confirm không thưởng và 40 vòng có Extra. Playwright dùng hồ sơ tổng hợp, kiểm đăng ký → lineup → scout → hành động → reload/resume, ba độ rộng, và replay từ season đã kết thúc. Không thao tác save thật. Full engine suite kiểm hồi quy PvE/Arena cũ.

## Còn lại

Hoàn thiện nội dung/quan hệ NPC, cảnh phản ứng kết quả, cân bằng build và simulation, payout/milestones, encounter đặc biệt. Boss hiếm vẫn configured=false. Bản chơi thử không phải nghiệm thu các nội dung chưa triển khai đó.
