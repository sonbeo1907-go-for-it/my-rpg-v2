# Trải nghiệm Đấu Trường

## Ghép trận

Danh sách 100 username giả lập ở `data/arena-usernames.js`. Tên được chọn theo seed và loại tên trùng người chơi. Username của bạn lấy từ hồ sơ đang chơi. Seed vẫn được giữ nội bộ để tái hiện kiểm thử, không hiện trong tên đối thủ.

Luồng Tìm Trận: tìm kiếm 2,4 giây → “Đã tìm được trận!” 1 giây → chuẩn bị hai đội 5–8 giây → bàn đấu. Thời gian chuẩn bị từ seed, không giả làm tiến trình tải mạng. Preview dùng cùng hàm tạo trận, seed và username với trận thực tế. Các nâng cấp/chuẩn hóa giữ nguyên quy tắc Arena hiện có. Hủy tìm kiếm hoặc rời màn chuẩn bị dọn timer và không tự mở trận ngầm.

Màn tải dùng bốn thẻ mỗi đội trên desktop, hai cột ở mobile; tái sử dụng silhouette vai trò. Đối thủ bên trên, bạn bên dưới; thể hiện tên nhân vật, hệ, Lv50/Rank5. Tiến trình có nhãn truy cập; motion giảm khi người chơi bật reduced motion.

## Nhịp hành động

Thanh username trên đội đối thủ và dưới đội của bạn có trạng thái chờ/suy nghĩ/thi triển và kết quả hành động gần nhất. Không hiển thị tên trận mô phỏng kèm seed. Nút rời trận có ghi rõ xử thua.

Người thật tự chọn hành động. AI chờ 2 giây suy nghĩ rồi chọn qua cùng bộ kiểm tra hợp lệ; công đoạn dự báo không thay RNG thật. Hai bên đều báo tên kỹ năng trong 1 giây trước khi engine thi triển. Sau đó cập nhật kết quả thực tế và phát VFX theo tốc độ đã chọn. Log đầy đủ vẫn tuân theo setting Battle Logs, còn thanh hoạt động luôn hiện để người chơi đọc được nhịp trận. Thời gian suy nghĩ/báo chiêu không bị bỏ qua bởi chế độ VFX nhanh hoặc reduced motion.

## Rời trận

Điều hướng khỏi bàn đấu khi trận chưa kết thúc sẽ xử thua. Nếu đang đợi suy nghĩ/báo chiêu, tác vụ chờ kiểm tra lại trận trước khi thi triển, tránh đòn đánh tiếp tục sau khi đã rời.

Một marker nhỏ theo từng profile được ghi vào localStorage lúc bắt đầu và cập nhật khi kết thúc. Mở lại game sau đóng/reload/crash khi marker còn active sẽ khôi phục **kết quả xử thua**, không khôi phục trận để chơi tiếp. Marker không phải save chiến đấu đầy đủ và không chứa tiến độ phần thưởng. Kết quả thắng/hòa đã hoàn tất không bị ghi đè thành thua. Đổi tab, thu nhỏ cửa sổ hoặc mở Settings không phải rời trận.

Đây là prototype offline: chưa có thống kê xếp hạng hay hệ thống máy chủ xử phạt. Marker không thay đổi schema save campaign.

## Sau trận

Tìm Trận có nút “Tìm trận mới”, khởi động lại toàn bộ ghép trận với seed mới. Không đánh lại đối thủ cũ từ result. Luyện Tập vẫn cho đánh lại cùng đội/seed để thử chiến thuật.

## Nghiệm thu

Kiểm tra riêng pool tên, đồng nhất preview/trận thật, kế hoạch AI không tiêu RNG, marker theo profile và xử thua idempotent. Browser dùng đồng hồ kiểm thử để xác nhận đủ thời gian tìm/chuẩn bị, 1 giây trước damage và 2 giây AI suy nghĩ; kiểm tra hủy search, reload giữa trận và ghép trận mới. Rà ảnh 1440/768/390 px.

Rà dưới góc nhìn người chơi: thông tin hai đội có thật trong trận, thời điểm suy nghĩ/thi triển phân biệt rõ và có cảnh báo xử thua. Rà UI: giữ phong cách JRPG, màu phe nhẹ, icon/silhouette từ dự án; không thêm toast thường trực che nhân vật. Thông tin nhân vật ở màn chuẩn bị bỏ hậu tố “đối thủ” vì đã có tiêu đề đội.
