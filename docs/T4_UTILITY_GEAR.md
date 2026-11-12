# Gear IV đa dụng — 12/11/2026

4 công thức phổ thông mở sẵn ở Rèn Hiệu Ứng, giá2400 Vụn +12000 Coin +1 GearIII chưa trang bị; không nhận miễn phí. Mỗi món chiếm một ô thường; cùng nhóm không thể trang bị hai món trên một người. Không cần đổi savev7.

| Gear | Chỉ số thường trực | Hiệu ứng |
| --- | --- | --- |
| Lăng Kính Dồn Ma Lực | MP+10% | Kỹ năng tấn công: +6% sát thương mỗi5 MP thực trả, tối đa30% mỗi chiêu |
| Dải Lụa Dệt Khiên | SPD+15% | Khiên từ kỹ năng chủ động ×1,3 |
| Chén Sinh Khí | HP+15% | Hồi HP từ kỹ năng chủ động ×1,18 |
| Chuông Đồng Tâm | MP+10% | Phòng thủ chia lượng MP thực hồi cho các đồng đội khác còn sống |

## Hợp đồng tính toán và thời gian

- MP sát thương chốt sau giảm/tăng chi phí, gồm phụ trội Helena, trước mọi hoàn phí. `min(30%, floor(paidMp/5)*6%)`; đạt trần ở25MP. Không tích lũy qua các lần thi triển. MP0 hoặc trả tài nguyên thayMP không hưởng. Một hệ số cho toàn bộ hit/mục tiêu trong chiêu; không nhân lặp theo hit. Không áp Đánh thường, Phòng thủ, Độc, tự động, Liên kích hoặc phản công. Gear là nguồn riêng với buff khuếch đại kỹ năng mạnh nhất hiện tại; không tạo status amp.
- Chỉ số thường trực và hiệu ứng không cộng dồn cùng tên/nhóm. Hai món khác nhau cùng tăng MP được cộng theo pipeline gear hiện tại. Hiệu ứng không tự tăng Rank/Thông Thạo.
- Tăng Khiên/hồiHP áp lên lượng kỹ năng tạo sau scaling/Rank và bonus trực tiếp trong lượng hồi, làm tròn rồi qua giảm lượng nhận, nợHP, chặn hồi và giới hạn HP. Không nhân lại gear/nội tại hồi hoặc tạo Khiên riêng, hút máu hay hồi theo thời gian. Khiên mạnh nhất vẫn được giữ. Preview kỹ năng dùng chung hệ số support với engine.
- Chuông Đồng Tâm chụp MP trước hành động Phòng thủ, xét lượng thực nhận sau5%MP và các hồi cá nhân đã xử lý ở mốc đó (gồm Hương Trầm +4). Bị capMP thì chỉ chia phần thực nhận. Chủ đầyMP không chia, không tiêu hạn mức. Đồng đội khác nhận cùng sốMP, giới hạn MaxMP riêng, không nhận lặp trên chủ. Bỏ qua người gục và không hồi sinh.
- Hạn mức Chuông theo **phe + effectGroup + battle.round**, chung mọi người trang bị, Vòng Chính và Vòng Phụ. Reserve trước khi phát hồi; chỉ tiêu nếu có đồng đội thiếuMP. Không kích lại từ MP vừa được chia, không cấp lượt. Không kích khi Choáng bỏ hành động hoặc lệnh lỗi. Forecast clone cả hạn mức, không thay trận thật. Hai phe Arena độc lập. Trận mới có hạn mức mới; wave/phase cùng trận giữ giới hạn của vòng.
- Đây không phải buff duy trì, không có thời gian để xóa/giải. Gear đi theo snapshot xuất phát chuẩn, không có thay nền/BGM. Các lần hồi dùng eventMP thông thường.

Kiểm chứng: utility-gear.test.js, bộ gear/forecast/Rank/PvP hiện hành; E2E Rèn Hiệu Ứng và layout mobile. Không dùng save cá nhân.
