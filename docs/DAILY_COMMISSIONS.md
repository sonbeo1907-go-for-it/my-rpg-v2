# Ủy Thác Hằng Ngày

Icon cuộn giấy ở góc tavern mở modal; chấm than đỏ khi có thưởng nhận được. Nguồn: src/core/daily-commissions.js; ledger version2 trong save v7.

| Nhiệm vụ | Thưởng |
| --- | --- |
| Đăng nhập sau chọn hồ sơ |1 Prisma |
| Hoàn thành1 Quest Thảo Phạt |1000 Coin |
| Hoàn thành3 Quest Thảo Phạt |1500 Coin |
| Hoàn thành5 Quest Thảo Phạt |2000 Coin |
| Hoàn thành1 lượt thám hiểm |3 Pure Prisma |
| Hoàn thành1 Rèn Luyện hoặc Phá Giới |2 Thẻ Quét |

Quest normal/boss đều tính, kể cả lặp cùng Quest và bất kể nhánh Coin/Vụn. Không tính wave riêng, truyện, Chronicle, siêu trùm hoặc Arena. Rèn Luyện/Phá Giới đồng thời hoàn thành mục thám hiểm chung. Quét hợp lệ cũng tính như đánh thật.

| Số nhiệm vụ hoàn thành | Thưởng mốc |
| --- | --- |
|1|500 Coin|
|2|3 Pure Prisma|
|3|2 Thẻ Quét|
|4|1500 Coin|
|5|5 Pure Prisma|
|6|1 Original Prisma|

Tổng tối đa:6500 Coin,1 Prisma,11 Pure Prisma,1 Original Prisma,4 Thẻ Quét; chưa tính thưởng trận/dungeon. Mốc tính điều kiện đã hoàn thành, không phải số nút đã nhận. Nhận riêng/Nhận tất cả cùng transaction, không cộng trùng khi retry.

Reset00:00 Asia/Ho_Chi_Minh. Kết quả tính ngày lưu thưởng; thưởng chưa nhận ngày cũ hết hạn. Lùi đồng hồ không tạo thêm reset; game offline không có chống sửa giờ cấp server. Mỗi hồ sơ có ledger riêng. Ghi đăng nhập thất bại không tạo vòng lặp retry.

Migration mốc cũ3–5 sang4–6 giữ đúng loại thưởng, không nhận Original lần hai. Không xóa ledger legacy hoặc cấp bù bằng phỏng đoán lịch sử.
