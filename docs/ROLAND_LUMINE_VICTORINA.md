# Roland, Lumine và Victorina

Cả ba thuộc nhóm Chiêu Mộ thường, gồm quay banner và đổi Pure Prisma. Không mở miễn phí. Dùng lại quy tắc bản trùng, trang bị, biểu tượng vai trò và save hiện có.

## Roland · Trưởng đoàn Kị sĩ

Quang, hỗ trợ tấn công. HP190 / MP130 / ATK14 / MAG26 / DEF23 / RES24 / SPD18.

| Kỹ năng | MP | Hồi chiêu | Hiệu lực |
| --- | ---: | ---: | --- |
| Hiệu lệnh: Thần tốc | 14 | 3 | Toàn đội +60% SPD, 3 lượt chính của người nhận |
| Quân lệnh song hành | 54 | 6 | Hai ô kề nhận một Lượt Thêm/người trong Vòng Phụ hiện tại |
| Cờ lệnh bình minh | 12 | 2 | Toàn đội +20% ATK và MAG, 2 lượt chính của người nhận |

**Hậu cần tổng chỉ huy:** cuối vòng sau mọi Vòng Phụ, hồi 4% MP tối đa cho từng đồng đội còn sống, gồm Roland. Không cần tích tầng hoặc kích hoạt công kích. Roland phải còn sống. Làm tròn lên; không vượt MP tối đa. Chiến thắng kết thúc trận ngay không cấp một lần hồi cuối vòng miễn phí.

Lượt Thêm dùng đúng hệ thống Lionel: không chen lượt, không bỏ qua chi phí/hồi chiêu, không tạo chuỗi vòng phụ. Hai người được xác định bằng ô đội hình cố định, không bằng thứ tự SPD. Ô 1 kề ô 4 và ô 2. Không tự chọn mục tiêu, không tự nhận lượt; ô trống/người đã gục bị bỏ qua, không thay bằng người kế tiếp. Mỗi người vẫn tối đa một Lượt Thêm/vòng; trùng quyền thì bỏ qua riêng người đó. Không có người nhận hợp lệ thì không được thi triển.

So với Lionel (36 MP, hồi 4): Roland tốn 54 MP, hồi 6, buộc sắp xếp đội hình và không linh hoạt chọn một chủ lực đang cần lượt. Hai lượt có thể rơi vào hỗ trợ hoặc một ô đã gục. Phần đáng tin cậy của anh là SPD và hậu cần. SPD chỉ áp dụng ở lần xếp lượt kế tiếp, không đổi lịch sử/lượt còn lại của hàng đợi đã xếp.

## Lumine · Hội trưởng hội học sinh

Thủy, DPS vật lí. HP165 / MP85 / ATK10 / MAG35 / DEF18 / RES22 / SPD22.

| Kỹ năng | MP | Hồi chiêu | Hiệu lực |
| --- | ---: | ---: | --- |
| Đánh thường | 0 | — | Vật lí Thủy, 100% MAG, đơn mục tiêu |
| Kiếm lệnh hội đồng | 6 | — | Vật lí Thủy, 160% MAG, đơn mục tiêu |
| Điều lệ: Võ trang | 12 | 3 | Bản thân +35% MAG trong 3 lượt chính |
| Phán quyết thủy ngân | 24 | 2 | Vật lí Thủy, 280% MAG, xuyên 20% DEF, đơn mục tiêu |

**Ma pháp võ trang:** +15% MAG thường trực, dùng lại nội tại tăng chỉ số. Cộng tỷ lệ với buff MAG thông thường.

Tách `damageType` và `scalingStat`: loại vật lí quyết định DEF, né/phản công và điểm yếu vật lí; `scalingStat: magic` quyết định sức mạnh. ATK không tăng sức mạnh đòn đánh này, MAG có tăng. RES không giảm sát thương. Không kích hoạt Liên kích phép đơn mục tiêu của Aurora hoặc những hiệu ứng chỉ dành cho sát thương ma pháp. Hệ nguyên tố vẫn là Thủy.

## Victorina · Kị sĩ Hoa Hồng

Hỏa, Thủ Hộ. HP240 / MP90 / ATK18 / MAG12 / DEF30 / RES28 / SPD16.

| Kỹ năng | MP | Hồi chiêu | Hiệu lực |
| --- | ---: | ---: | --- |
| Màn hồng che chở | 10 | 2 | Khiên toàn đội = 120% × trung bình DEF và RES hiện tại của Victorina |
| Lũy gai bất khuất | 8 | 3 | Toàn đội +35% DEF trong 3 lượt chính của người nhận |
| Lời thề hồng diễm | 8 | 3 | Toàn đội +35% RES trong 3 lượt chính của người nhận |

**Nhựa sống dưới gai:** khi khiên cô tạo bị đánh vỡ, hồi MP cho người mang khiên bằng 20% × trung bình DEF và RES hiện tại của Victorina. Tối đa một lần/người/vòng, chung hạn mức chính/phụ; cả nguồn và người nhận phải còn sống. Làm tròn lên, giới hạn bởi MP tối đa; đầy MP không tiêu hạn mức.

Cơ bản tạo 35 khiên và hồi 6 MP/người khi vỡ; khi cả hai buff DEF/RES đang hoạt động tạo 47 khiên và hồi 8 MP/người. Không có Khiêu khích. Khiên tuân theo quy tắc hiện có: không cộng dồn, chỉ khiên mạnh hơn mới thay được và thay cả người tạo. Thay/ghi đè khiên không kích hoạt nội tại. Khiên của người khác không kích hoạt nội tại Victorina.

## Hợp đồng dữ liệu dùng lại

- `adjacent_allies`: chọn ô kề có nối vòng, bỏ qua khoảng trống và đơn vị đã gục. Giữ vị trí đội hình khi sang phòng.
- `scalingStat`: bộ chọn sức mạnh độc lập với loại sát thương. Giữ mặc định ATK/vật lí và MAG/ma pháp khi không khai báo.
- `scalingStats`: trung bình các chỉ số, dùng cho khiên/hồi phục và nội tại khiên vỡ; không được khai báo cùng `scalingStat`. Đọc từng chỉ số sau các modifier hiện tại rồi mới lấy trung bình.
- `end_round_team_mp`: hồi MP theo phần trăm MP tối đa người nhận, đúng một lần sau mọi Vòng Phụ.
- `shield_break_mp`: truy nguồn khiên, hồi cho người nhận; hạn mức được giữ trên người nhận theo nguồn và số vòng, không nằm trong save tiến trình.

## Điều chỉnh cùng bản

Kreider: MAG 34 → 41, HP 145 → 125. Charlemagnes: ATK 30 → 34, SPD 12 → 14. Không đổi hệ số kỹ năng hoặc cơ chế nội tại.
