# Gear Siêu Cấp, tái rèn dòng phụ và thưởng Quest

## Bốn tab Thợ Rèn

- Phân rã: chọn theo trang, xem tổng Vụn trước khi xác nhận; không hiện món đang được tái rèn dòng phụ.
- Trấn Phái: cơ chế cũ; giá Vụn chế tạo tăng từ 120 lên **2.400**, giữ 10.000 Coin + 3 Pure Prisma + 1 Original Prisma. Trấn từ Quest vẫn là phần thưởng, không mất phí chế tạo.
- Rèn Chỉ Số: chọn dòng chính và một Gear T3 chưa sử dụng. Tái rèn dòng phụ nằm trong tab này.
- Rèn Hiệu Ứng: xem bùa phổ thông/đặc biệt và điều kiện mở công thức.

## Giá và chỉ số

| Loại | Vụn | Coin | Nguyên liệu |
| --- | ---: | ---: | --- |
| T4 chỉ số | 1.200 | 8.000 | 1 T3 |
| T4 hiệu ứng phổ thông | 2.400 | 12.000 | 1 T3 |
| T4 hiệu ứng đặc biệt | 3.200 | 18.000 | 1 T3 + công thức |
| Roll lại dòng phụ | 450 | 2.500 | Một T4 chỉ số đã sở hữu |

Dòng chính 5 điểm được chọn, dòng phụ 3 điểm ngẫu nhiên đều trong bảy chỉ số. HP nhân 5, MP nhân 2 như gear cũ. Hai dòng có thể trùng: ATK 5+3=8; HP 25+15=40; MP 10+6=16. Lưu riêng `primaryStat`/`secondaryStat`, còn `stats` chứa tổng để bộ cộng chỉ số hiện có hoạt động chính xác.

T4 hiệu ứng có `stats: {}`, chiếm một ô thường trong 3–6 ô. Mỗi nhân vật chỉ trang bị một món cùng `effectGroup`. Không thêm T4 vào banner gacha. Dùng ID `rune_N` với bộ đếm `craftedGearSerial` riêng, không tăng số lượt quay hay đụng ID gear/loot.

Chọn T3 làm nguyên liệu không tự phân rã lấy thêm Vụn. Không nhận lại T3 hoặc Coin khi phân rã món mới. Mặc định phân rã T4 hoàn 10% chi phí Vụn chế tạo: 120 / 240 / 320; các giá trị nằm trong dữ liệu để điều chỉnh về sau.

## Bốn gear hiệu ứng đầu tiên

| Món | Loại | Tác dụng | Kích hoạt lại |
| --- | --- | --- | --- |
| Bùa Hộ Vệ | Phổ thông | Đầu vòng, nếu chưa có bất kỳ Hộ Ấn còn lần chặn nào, cấp 1 lần chặn | 3 vòng |
| Bùa Suối Nguồn | Phổ thông | Đầu vòng, hồi 5% HP tối đa nếu thiếu HP | 2 vòng |
| Bùa Tụ Linh | Phổ thông | Đầu vòng, hồi 5% MP tối đa nếu thiếu MP | 3 vòng |
| Kính Săn Điểm Yếu | Đặc biệt | Đầu vòng, nhận Khai phá điểm yếu trong 2 lượt chính nếu chưa có | 4 vòng |

Kính mở bằng cờ hoàn thành vĩ thanh Arthur `arthur.full_control_story_cleared`. HP/MP làm tròn lên, không vượt tối đa. Hiệu ứng không hồi sinh người đã gục. Bùa Hộ Vệ không giải debuff cũ, không cộng lần chặn, và nhận biết Hộ Ấn từ mọi nguồn. Một lần chặn chỉ chặn một hiệu ứng theo luật Hộ Ấn hiện hành.

Chỉ bắt đầu hồi chiêu khi thật sự kích hoạt. Kích hoạt vòng 1, CD 3 → sớm nhất vòng 4. Không kích hoạt thêm trong Vòng Phụ hoặc khi boss đổi phase. CD theo vòng toàn trận, giữ xuyên phòng theo snapshot hiện có; trận độc lập mới bắt đầu lại. Kỹ năng và gear của trận đang chạy không thay đổi khi chỉnh trang bị ngoài trận.

## Tái rèn an toàn

Roll trừ phí ngay và lưu hai lựa chọn vào `pendingGearReforge`. Dòng chính cố định. Giữ cũ hoặc nhận mới không mất thêm; giữ cũ không hoàn chi phí roll. Cho phép ra lại dòng phụ cũ. Không được roll tiếp hoặc phân rã/dùng món đang chờ làm nguyên liệu. Khóa chung với kết quả tái rèn Trấn Phái chưa quyết định. Đóng modal hoặc đóng game giữ nguyên kết quả chờ; vào Thợ Rèn có thể tiếp tục chọn.

Giao dịch dùng bản sao và chỉ cập nhật trạng thái UI sau khi persist thành công. Món nguyên liệu từng xuất hiện trong gacha được đánh dấu đã tiêu hao trong lịch sử, không hồi sinh khi tải save.

## Thưởng Quest

Quest Thảo phạt thường: 50% 50 Coin, 50% 5 Vụn. Quest boss: 50% 150 Coin, 50% 15 Vụn. Mỗi chiến thắng chọn đúng một nhánh; không nhận cả hai.

RNG phần thưởng độc lập với seed combat cố định, nên đánh lại cùng chiến thuật không bị cố định phần thưởng. Chốt kết quả trên trận trước khi lưu; lưu thất bại rồi thử lại không roll lại. Phần thưởng lần đầu vẫn nhận đủ ở cả hai nhánh. Ủy Thác Hằng Ngày tính số lượt thắng theo loại Quest, không xét loại tiền thưởng.

Truyện Lữ Hành, siêu trùm và phần thưởng cuối hầm ngục giữ luật cũ. Sort/phân loại Quest vẫn dựa theo cấp thường/boss/siêu trùm; UI công khai cả hai nhánh và tỷ lệ.

## UI, tay cầm và save

12 món/trang desktop, 6 món/trang mobile; áp dụng túi đồ, màn trang bị, danh sách phân rã, nguyên liệu T3, T4 sở hữu và Trấn Phái trong túi. LT/RT đổi trang của danh sách đang mở; LB/RB vẫn đổi tab. Đổi bộ lọc/sort về trang 1; chọn nhiều món phân rã có thể giữ qua các trang.

Save ứng dụng vẫn v6: thêm các trường tùy chọn `craftedGearSerial`, `pendingGearReforge` với mặc định 0/null cho save cũ. Bộ kiểm tra xác thực metadata T4, số tổng, ID, bộ đếm, kết quả chờ và các món đang trang bị. Không chỉnh file save thật trong quá trình kiểm tra.

Nguồn chính: `data/gearEffects.json`, `data/blacksmith.json`, `data/economy.json`; adapter dùng lại: `gear-rules.js`, `gear-forge.js`, `gear-effects.js`, `quest-rewards.js`.

## Batch Truy Nã

Thêm 18 công thức qua năm boss, tổng 22 hiệu ứng. Luật hook, nguồn mở khóa, phân trang và nghiệm thu xem [BOUNTY_GEAR.md](BOUNTY_GEAR.md).
