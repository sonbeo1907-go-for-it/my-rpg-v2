# Bianca Valmont — Hạt Giống Bội Thu

Triển khai ngày 21/11/2026. Nhân vật chính thức #121, DPS ma pháp Thổ, vào banner thường và pool rate-up quý tộc; không tự cấp nhân vật cho hồ sơ cũ. ID `bianca`, affiliation `house_valmont`, tag `valmont` để tương tác với Lyon/Lucien/Seraphine/Cedric như các thành viên khác.

Bianca là chị của Seraphine, rời thủ đô đến thị trấn dưới núi tuyết buôn bán vì không muốn theo nghề săn quái của gia đình. Lời nói dẻo miệng che giấu toan tính; lấy lòng dân bản địa. Bộ tên: **Lộc Đến Đúng Hẹn**, **Lời Chào Có Giá**, **Gieo Một Lời Hứa**, **Thu Lời Dưới Trăng**. Tài nguyên cá nhân **Lộc Nguyệt**.

HP160 / MP120 / ATK8 / MAG36 / DEF18 / RES24 / SPD18. Đánh thường phép Thổ như DPS phép thông thường; dùng asset vai trò và VFX hạt giống hiện hành, không thêm combatMode hoặc cảnh nền riêng.

## Bộ kỹ năng ở Rank 1

| Kỹ năng | Hiệu ứng | MP / CD |
| --- | --- | --- |
| Lời Chào Có Giá | +12 MAG căn bản trong 3 lượt chính bản thân, giải toàn bộ debuff bản thân | 5 / 0 |
| Gieo Một Lời Hứa | Một địch 60% MAG Thổ, trúng gắn 2 Sơ Hở Thổ, cấp bản thân Lượt Thêm | 5 / 0 |
| Thu Lời Dưới Trăng | Một địch 120% MAG Thổ. Nếu mục tiêu còn sống và có hạt giống cùng phe, tiêu tối đa 3 Lộc Nguyệt; mỗi tầng gọi một hit 380% MAG Chúc Phúc vào đúng mục tiêu | 10 / 0 |

Nội tại cấp quyền ghép Quang–Thổ. Sau khi chuỗi hành động kết toán và Hạt Giống Bội Thu thực sự kích hoạt, Bianca còn sống nhận đủ 6 Lộc Nguyệt (cap6, không cộng vượt trần). Lúc Chúc Phúc hoạt động, mọi sát thương Bianca mang thêm Nguyệt; sau khi Chúc Phúc hết, phần Nguyệt tắt. Tầng chưa tiêu không tự mất khi Chúc Phúc hết; lần kích hoạt mới đưa về6.

Chiêu cuối có hai nguồn: Bianca và thực thể Chúc Phúc. Hit Chúc Phúc dùng MAG động của Hạt Giống, loại phép Thổ–Nguyệt, hưởng tăng hiệu quả hạt giống của Shashthi. Không sao chép chỉ số hoặc buff/gear sát thương của Bianca. Hệ số chiêu và hiệu lệnh cùng tăng10% mỗi Rank; buff MAG căn bản tăng5% mỗi Rank. Không tự mở Thông Thạo cho nhân vật mới. PvP giới hạn Rank5.

## Vòng đời và trường hợp biên

- Buff3 `main_turn`: lượt tạo không trừ ngay, lượt chính Choáng vẫn trừ, Lượt Thêm không trừ. Dùng lại làm mới, không cộng12 nhiều lần. Buff có thể bị Phong Ấn chặn; cleanse vẫn giải debuff sau đó.
- Lượt Thêm theo engine: tối đa một/người/vòng, vào Vòng Phụ; dùng lại ở Vòng Phụ không sinh chuỗi lượt vô hạn. Đánh hụt không gắn Sơ Hở nhưng quyền Lượt Thêm vẫn được cấp từ hiệu ứng riêng.
- Chiêu cuối vẫn dùng được khi không có Chúc Phúc hoặc tầng. Không có đúng hạt giống, mục tiêu đã gục sau đòn Bianca, người dùng gục, hoặc Chúc Phúc không sẵn sàng: không tiêu tầng, không đổi mục tiêu lệnh.
- Khi đủ điều kiện, chốt/tiêu tối đa3 tầng trước chuỗi hit. Địch chết giữa chuỗi thì dừng đánh địch đó; không chuyển hit dư, không hoàn tầng đã trả. Ba hit là một hành động Liên Kích nhiều hit; Sơ Hở tiêu theo hành động, PvP dùng trần Liên Kích đơn mục tiêu. Không dùng trần diện rộng của pulse tự động.
- Hiệu lệnh không cấp/nạp nguyên tố, không gia hạn Chúc Phúc, không chiếm mốc pulse tự động cuối vòng, không cấp lại6 tầng.
- Wave/phòng dungeon và phase boss cùng trận giữ tài nguyên/deadline, không phát lại activation. Trận độc lập mới bắt đầu0 tầng. Các encounter khác trong phiên Chronicle giữ HP/MP theo adapter, không mang tài nguyên nếu hợp đồng chỉ giữ HP/MP. Gục không xóa thực thể Chúc Phúc còn thời hạn; không thể nhận/cast khi đã gục. Trận kết thúc không tiếp tục đánh/hồi phục.
- Forecast chạy clone, không trừ tài nguyên/MP hoặc quota thật; AI đọc cùng forecast và availability. PvP tách quyền, hạt giống, tầng và nguồn theo phe; không dùng character ID làm ID trận.
- Không đổi schema save v7 hoặc định dạng split-save; hồ sơ cũ thêm bản ghi nhân vật khóa theo cơ chế mặc định.

## Khung tái sử dụng và kiểm thử

`moonlight_activation_resource` khai `blessingId/resource/amount`, validate resource cap và quyền provider. `command_moonlight` thêm `targetMode:selected` cho blessing anchored, và `spendResource:{id,max}` tùy chọn để gọi nhiều hit theo tầng cá nhân. Runtime truyền `hits` cùng Rank factor, không sửa định nghĩa pulse gốc. Preview hiện **MAG** của Chúc Phúc thay vì nhãn ATK cứng.

`test/bianca.test.js`: cơ chế qua queue thực tế, lượng tầng0–6, MAG động/Rank, targeting/KO/no-anchor, clock/Choáng/Extra, expiry/refill, dungeon carry, forecast, PvP đối xứng/soft cap và validator/copy. `e2e/bianca.spec.ts`: trang kỹ năng, role/lore, chiến đấu gọi hạt giống và Lượt Thêm, khung tài nguyên/seed/VFX, không lỗi trình duyệt.


## Nghiệm thu combo ba vòng — 21/11/2026

Đã kiểm tra Rank1 và Rank5 bằng hàng lượt thật, không gán lại queue/round hoặc nạp tầng giữa các bước. Shashthi và Astraea đánh Quang/Thổ trước lượt Bianca ở R1 để kích hoạt Chúc Phúc một lần. Mục tiêu đủ HP để kiểm chứng đủ các hit.

| Bước | Tầng sau hành động | MP từ mức đầu120 |
| --- | --- | --- |
| R1 chính: Gieo Một Lời Hứa | 6 | 115 |
| R1 phụ: Thu Lời Dưới Trăng | 3 | 105 |
| R2 chính: Gieo Một Lời Hứa | 3 | 100 |
| R2 phụ: Thu Lời Dưới Trăng | 0 | 90 |
| R3 chính: Lời Chào Có Giá | 0 | 85 |

Hai hiệu lệnh gây tổng6 hit vào đúng mục tiêu; hai pulse cuốiR1/R2 được đếm riêng, không hoàn/nạp tầng. Deadline Chúc Phúc vẫn cuốiR3. Chiêu R3 giải debuff và tăng12 MAG căn bản ởRank1 (MAG36→48), hoặc14,586075 ởRank5 (36→50,586075). Kết quả này xác nhận vận hành/chi phí/lượt, không phải kiểm thử cân bằng boss.

Sau lần tiêu3 tầng thứ hai, tài nguyên phải là0; ghi “còn3” ởR2 là sai phép trừ nếu không có lần kích hoạt Chúc Phúc mới. Hồi quy nằm cuối test/bianca.test.js.
