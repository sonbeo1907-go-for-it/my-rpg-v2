# Gear Siêu Cấp, tái rèn dòng phụ và thưởng Quest

## Bốn tab Thợ Rèn

- Phân rã: chọn tối đa 999 món theo toàn bộ kết quả lọc hoặc chọn từng trang, xem tổng Vụn trước khi xác nhận; không hiện món đang được tái rèn dòng phụ.
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

Save ứng dụng hiện v7 (các trường T4 được thêm từ v6): thêm các trường tùy chọn `craftedGearSerial`, `pendingGearReforge` với mặc định 0/null cho save cũ. Bộ kiểm tra xác thực metadata T4, số tổng, ID, bộ đếm, kết quả chờ và các món đang trang bị. Không chỉnh file save thật trong quá trình kiểm tra.

Nguồn chính: `data/gearEffects.json`, `data/blacksmith.json`, `data/economy.json`; adapter dùng lại: `gear-rules.js`, `gear-forge.js`, `gear-effects.js`, `quest-rewards.js`.

## Batch Truy Nã

Thêm 18 công thức qua năm boss, tổng 22 hiệu ứng. Luật hook, nguồn mở khóa, phân trang và nghiệm thu xem [BOUNTY_GEAR.md](BOUNTY_GEAR.md).

## QoL 06/11/2026
Sau xác nhận chế tạo và lưu thành công, modal kết quả hiện đúng món vừa rèn (chỉ số chính/phụ hoặc hiệu ứng), có Tiếp tục rèn và Mở Túi đồ. Lưu lỗi không hiện thành công. Không tự trang bị. Tái rèn chỉ số có bộ lọc chỉ số tổng, trạng thái, sắp xếp và dòng chính/dòng phụ riêng; thay bộ lọc về trang 1, vẫn dùng LT/RT.

## QoL sau Orochi — 21/11/2026

Hạ Yamata no Orochi (first clear east_ke_08) mở **Tái rèn nâng cao** cho dòng phụ T4 chỉ số. Tài khoản đã hạ từ trước cũng được mở; không cần đánh lại hoặc sửa save. Không áp dụng cho Trấn Phái hoặc T4 hiệu ứng.

Tại Rèn Chỉ Số có hai bảng Chế tạo Cấp 4 / Tái rèn trang bị. Chọn món cần tái rèn mở một workbench: xem dòng chính/phụ hiện tại, chọn Ngẫu nhiên hoặc Nâng cao, dòng phụ mong muốn và 1–20 T3 chưa trang bị. Chọn nhanh lấy các món cũ nhất; có thể chọn tay và giữ lựa chọn qua nhiều trang. Chi phí hiện cạnh nút xác nhận, kể cả trên điện thoại.

Gọi n là số T3 thêm, xác suất đúng dòng đã chọn là **1/7 + (6/7) × n/20**: 1 món ≈18,6%; 10 món ≈57,1%; 20 món =100%. Tỷ lệ hiển thị làm tròn một chữ số, RNG dùng số chính xác. Nếu không trúng, chọn đều trong sáu dòng còn lại; không roll lại vào cả pool làm sai xác suất. Mỗi nguyên liệu bổ sung đều tăng cơ hội so với ngẫu nhiên thông thường.

Vẫn tốn 450 Vụn và 2.500 Coin/lần. T3 tiêu khi tạo và lưu kết quả, không hoàn khi giữ dòng cũ, không cho Vụn phân rã, không tăng tiến độ chế tạo của Tobin. Có thể chọn dòng phụ trùng dòng chính hoặc dòng phụ cũ. Giữ nguyên giá trị +3 và hệ số HP/MP. Kết quả nâng cao lưu metadata targetStat/materialCount trong pendingGearReforge. Save cũ không có metadata vẫn hợp lệ; không tăng version campaign.

Core kiểm tra quyền mở, 1–20 ID khác nhau, loại T3, đồ chưa sử dụng, số dư và pending chung trước khi giao dịch. Kho, lịch sử gacha, tiền và pending được persist cùng một campaign. UI chỉ hiện kết quả sau persist thành công, khóa nhấp lặp; retry lưu dùng lại RNG của lần xác nhận. Reload tiếp tục giữ cũ/nhận mới như trước.

### Phân rã hàng loạt

- Engine và UI cùng giới hạn **999 món/lần**. Chọn theo bộ lọc lấy trên cả kho theo thứ tự đang sắp xếp, không giới hạn 12 món đang render. Có nhập số lượng chọn nhanh và nút riêng cho cấp thấp/trung.
- Chọn trang này vẫn cộng thêm vào lựa chọn; đổi trang/sắp xếp giữ lựa chọn. Đổi lọc cấp hoặc chỉ số bỏ lựa chọn để tránh xóa nhầm đồ đang ẩn.
- Loại đồ đang mặc và món đang chờ tái rèn khỏi danh sách. Backend xác thực lại cả 999 món; một món không hợp lệ thì không phân rã món nào.
- Xác nhận nêu tổng số, phân bố cấp, tổng Vụn, số dư sau giao dịch và mẫu tối đa 20 món để modal không render 999 hàng. Sau thành công có biên nhận ngay trong bảng, không thêm modal bắt buộc đóng.
- Mobile thu gọn phần Tobin thành nút tương tác + tiến độ; nội dung tuyển mộ vẫn truy cập qua modal gốc. Bộ lọc có thể mở/đóng, mặc định gọn trên điện thoại. LT/RT vẫn đổi trang, các nút mới dùng đường điều hướng tay cầm chung.

Nguồn: src/components/forge-reforge.tsx, forge-dismantle.tsx, gear-forge.tsx; core gear-forge/blacksmith/blacksmith-state và data/blacksmith.json. Kiểm thử mới: test/forge-qol.test.js, e2e/forge-qol.spec.ts; luồng cũ e2e/t4-forge.spec.ts.

Nghi?m thu QoL: 38 ki?m th? core li?n quan v? 14 Playwright ??t, g?m pad RT/B trong modal l?ng nhau, save l?i r?i retry gi? c?ng roll, reload pending v? b?o v? ?? ?ang m?c khi ph?n r?999. Modal d?ng chung ch?n lan s? ki?n cancel ?? B/Escape ch? ??ng l?p tr?n c?ng. To?n b?1928 test JS:1927 ??t, m?t l?i c? s?n v? m? t? Shashthi qu?160 k? t?. Validate n?i dung/typecheck ??t.
