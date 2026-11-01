# Trấn Phái và Bản Thiết Kế

## Nguồn mở công thức

- Sáu nhân vật khởi đầu giữ nguồn mở hiện tại.
- Monica, Victorina, Sieg và Chelsea giữ nguồn mở ở chương II Lữ Khách. Không chuyển sang Blueprint.
- Hai mươi Trấn mới dưới đây mở bằng 10 Bản Thiết Kế dùng chung, tại tab Công thức Trấn Phái của Shop. Mở một lần, vĩnh viễn; có thể mở trước khi sở hữu nhân vật.
- Chế tạo vẫn yêu cầu sở hữu nhân vật, nguyên liệu và chi phí Trấn Phái hiện tại. Mở công thức không tặng trang bị.
- Save v7 cũ thiếu `blueprints` / `unlockedExclusiveRecipes` được bổ sung `0` / `[]`. Trấn đã chế tạo và trang bị giữ nguyên.

## Rơi Bản Thiết Kế

Chỉ áp dụng khi đánh lại Truy Nã đã nhận thưởng lần đầu, từ Level 25:

| Nhánh thưởng | Xác suất | Số lượng |
| --- | --- | --- |
| Coin | 40% | Theo thưởng độ khó hiện tại |
| Vụn Prisma | 40% | Theo thưởng độ khó hiện tại |
| Bản Thiết Kế | 20% | Lv25: 1; Lv35: 3; Lv45: 5 |

Số Blueprint không nhân thêm hệ số thưởng tiền. Lần đầu, Lv5/Lv15 và quest ngoài Truy Nã giữ cơ chế cũ. Thưởng được chốt một lần; lỗi lưu không tiêu tiền/mất thưởng, thử lưu lại không quay thưởng lại. Mốc lần đầu dùng chung giữa các độ khó.

## Hai mươi Trấn mới

Các hiệu ứng dưới đây chỉ hoạt động khi trang bị đúng Trấn, không thay đổi kit gốc. Ngoại trừ dòng RES của Kai được chỉ định tăng theo Rank, hiệu ứng Trấn không tự nhân hệ số cấp kỹ năng.

| Nhân vật | Trấn Phái | Hiệu ứng |
| --- | --- | --- |
| Dain | Trọng Kiếm Bất Khuất | Gồng mình: xác suất Quyết Tâm = min(100%, 50% + 0,25 điểm % × ATK hiện tại). Đạt 100% tại 200 ATK. |
| Rowan | Cung Dấu Chân Gió | Chiêu thực sự tiêu Điểm Ngắm nhận +40% ATK riêng lần thi triển đó. |
| Freya | Hồng Tâm Viêm Trượng | Mỗi lần thực sự tạo/tiêu Nhiệt: +8% MAG, 4 lượt, tối đa 3 tầng; làm mới thời hạn chung. Lượt thêm cũng giảm thời hạn. |
| Galliard | Lũy Thép Tiền Phong | Dùng Khiêu khích: tự tạo Khiên bằng 120% DEF hiện tại. |
| Armie | Túi Cứu Thương Phương Bắc | Hồi trực tiếp cho đồng đội dưới 50% HP trước hồi: cộng 50% MAG vào lượng hồi. |
| Rhett | Lõi Sấm Tái Nạp | Phòng thủ: +1 Điện tích, hồi 5% HP tối đa. |
| Fran | Tinh Đồ Đêm Không Trăng | Đêm không che chở: hiệu quả giảm DEF/RES ×1,75; thêm 1 lượt; MP ×1,5. Rank1: −35%, 3 lượt, 24 MP. |
| Kai | Khiên Tập Sự Giữ Làng | Tập giữ hàng thêm RES toàn đội: 15% ở Rank1, nhân 1,05 mỗi Rank kế tiếp. |
| Lisbeth | Quang Trượng Kiêu Hãnh | Phán quyết kiêu hãnh hoàn 8 MP nếu Kiêu hãnh Ranoc còn hiệu lực lúc bắt đầu thi triển. |
| Benard | Song Kiếm Xé Gió | Khi có Nhịp gió: mỗi hit Song kiếm cuồng phong thêm 25% SPD hiện tại trước phòng thủ. |
| Lanceveil | Hồng Diễm Hộ Quân | Khiên lửa hộ quân: người còn sống có tỷ lệ HP thấp nhất nhận Khiên 100% DEF hiện tại của Lanceveil. Xét cả bản thân. |
| Gahallad | Hắc Kiếm Nghiền Khiên | Tự đánh vỡ Khiên địch: hồi 5 MP, một lần/vòng; tính cả đòn hạ địch. |
| Gawain | Đại Kiếm Triệu Lôi | Xung sát thương tự động của Mây giông gây sát thương HP/Khiên ít nhất một địch: hồi 3 MP, một lần/vòng. |
| Lucien | Pháp Điển Gia Huy | Kết giới gia huy: hồi 4 MP mỗi Valmont còn sống, gồm Lucien. |
| Seraphine | Ấn Kiếm Người Thừa Kế | +15% ATK/MAG mỗi Valmont khác trong đội. Có đồng đội và tất cả đều Valmont: xuyên thêm 15% DEF/RES. Giữ nội tại cộng chỉ số gốc. |
| Lyon | Bất Xâm Gia Thuẫn | Hộ ấn do Lyon tạo thực sự chặn debuff địch: người được bảo vệ nhận Khiên 100% DEF hiện tại của Lyon. |
| Cedric | Hiệu Kỳ Tiếp Viện | Tiếp viện chiến trường: mỗi người nhận hồi thêm 25% ATK × số đồng đội còn sống đang có Hiệu lệnh gia tộc. |
| Helena | Dù Đêm Đông Kiêu Hãnh | Trả đủ MP phụ trội của nội tại: +35% MAG riêng cho chiêu đó. Trả thiếu không kích hoạt. |
| Leonardo | Thủ Kiếm Người Anh Cả | Giảm sát thương phép toàn đội theo tổng MP tối đa đã chuẩn bị; tối đa 30% tại 800 MP. Aura chốt theo đội lúc xuất phát, không phụ thuộc MP còn lại. |
| Kyle | Hộp Đồ Chơi Nghịch Lý | Mục tiêu có 3 Trò quậy: MAG tăng cho đồng đội khác đánh phép từ 15% lên 25%. |

Khiên từ Trấn tuân theo quy tắc Khiên mạnh nhất, không cộng dồn. Chỉ số/phòng thủ và buff cơ bản vẫn qua engine chung. Seraphine xét thành phần đội xuất phát; thành viên bị hạ không làm thay đổi điều kiện gia tộc. Hiệu ứng giảm sát thương của Leonardo vẫn tuân trần giảm sát thương chung của engine.

## Gear Siêu Cấp chuyển đổi MP

- Chiến Ấn Mạch Nguồn: tăng ATK căn bản.
- Pháp Ấn Mạch Nguồn: tăng MAG căn bản.
- Công thức: `min(25, floor(MP tối đa × 0,05))`; luôn hoạt động, không dùng MP còn lại.
- Hiển thị trong phần chỉ số cộng từ trang bị. Hai nhóm hiệu ứng riêng biệt; quy tắc một món mỗi nhóm giữ nguyên.
- Cùng chi phí Gear IV hiệu ứng phổ thông: 2.400 Vụn Prisma, 12.000 Coin, 1 Gear III.

## Cấp độ và giao diện

- Quest Thảo Phạt/Boss/Truy Nã chưa có lựa chọn rõ ràng mặc định Rất dễ, Lv5. Query độ khó đã chọn được giữ nguyên.
- Lữ Khách hiển thị đúng Lv10/20/30 và HP đã scale của từng chương, cả danh sách lẫn xác nhận xuất chiến.
- Bản Thiết Kế xuất hiện trong Túi đồ, Shop và kết quả chiến đấu. Shop có xác nhận trước khi mua; trạng thái chiến đấu/chuyến đang chạy khóa giao dịch.

## Điểm kiểm thử

Core: migration và dữ liệu lỗi; mở/craft đúng nguồn; tỷ lệ và mốc thưởng; chống nhận thưởng/mua lặp; lỗi lưu và thử lại; đủ 20 hiệu ứng Trấn; điều kiện/giới hạn mỗi vòng; hệ số Rank; chuyển đổi MP; mặc định và scale Level.

UI: mua/hủy/tải lại, lỗi ghi save, mobile, số dư vật phẩm, chỉ số gear, preview Fran/Kai, cấp quest/lữ khách, và nhận Blueprint sau trận Truy Nã thực tế.
