# Trình bày hành động chiến đấu

Kết quả chiến đấu do engine giải quyết như trước. UI đọc sự kiện có cấu trúc, không phân tích battle log, không chọn mục tiêu lại, không dùng RNG. Không thay đổi save.

## Nhịp hành động

- Kỹ năng/đánh thường hiện tên trên người thi triển. Tấn công tiến 7px về phía đối phương; hỗ trợ nhấc 3px. Dùng `translate`, không thay bố cục.
- Sau 120ms ở tốc độ thường, hiện hit đầu; các hit tiếp theo cách 85ms. Tốc độ nhanh là 35ms/25ms. Có giới hạn hoạt ảnh và chờ trình bày theo timeline để lượt kế không đè lên các nhịp chưa xong.
- Nội tại kích hoạt thật chỉ sáng viền và hiện tên, không tiến lên. Nội tại tăng chỉ số thường trực không phát hiệu ứng lặp. Liên kích/phản công có nhịp tấn công riêng.
- Số sát thương, ánh trúng đòn và rung khung cùng nhịp. Đòn mất HP mới rung/chớp đỏ; khiên chặn hoàn toàn lóe xanh dương; né chỉ báo Né. Hồi HP lóe xanh lá, hồi MP màu tím.
- Đòn nhiều hit dùng nhịp riêng và lệch vị trí số để dễ đọc. Màu sắc theo nguyên tố, hình hiệu ứng theo damageType, độc lập với chỉ số scaling.

## Phạm vi

- Đơn mục tiêu: vệt chém vật lí hoặc vụ nổ phép nhỏ tại người thực sự trúng đòn, gồm cả người che chắn.
- AoE: một vệt quét/vụ nổ giữa đội hình, các mục tiêu phản ứng cùng nhịp. Nhiều hit chỉ phát hiệu ứng lớn một lần, sau đó nhịp nhỏ ở mục tiêu.
- Mục tiêu chính + lan: mục tiêu chính có hit lớn hơn.
- Ngẫu nhiên nhiều đòn: từng mục tiêu được engine chọn có hiệu ứng theo thứ tự, không phát hiệu ứng AoE.
- Chiêu có presentation `cosmic_*` hoặc `academic_*` giữ VFX riêng; vẫn có chuyển động nguồn và phản hồi HP/khiên/số, không chồng thêm glyph mặc định.
- Độc/sát thương định kỳ không tạo ra hoạt ảnh thi triển hoặc vụ nổ giả.

## Giới hạn và tính ổn định

Event key dùng WeakMap trên đối tượng sự kiện gốc, ổn định qua các lần publish khi UI/phase thay đổi. Không phát lại sự kiện đã xem khi quay về route combat. Lịch sử trình bày giữ tối đa hai session, 256 key gần nhất; đồng thời tối đa 64 lớp phản hồi và 128 frame mỗi batch.

VFX là SVG nhẹ được portal trực tiếp vào khung hoặc đội hình, nên đi cùng vị trí khung khi cuộn/resize. Tất cả pointer-events đều tắt. Khi đổi trận, rời route, chuyển tab nền hoặc bật giảm chuyển động, hủy timer/WAAPI còn lại. Không có vòng lặp hạt chạy từng frame.

Giảm chuyển động bỏ di chuyển, rung, phóng to và nhịp chờ; giữ thông báo ngắn tĩnh và số. Các nhãn mục tiêu/viền cam, viền khiên và tương tác chuột/tay cầm hiện tại vẫn hoạt động.

## Điểm mở rộng

`src/ui/combat-timeline.js` là bộ lập lịch thuần; `src/components/combat-effects.tsx` dựng VFX chung; `src/app/combat.css` chứa style. Skill mới dùng bộ mặc định từ target/effects/element; chỉ cần `presentation` riêng khi có hoạt ảnh đặc thù. Mọi sự kiện native mới có thể phát `passive` với sourceId và label, tránh phát theo thay đổi chỉ số suy đoán.
