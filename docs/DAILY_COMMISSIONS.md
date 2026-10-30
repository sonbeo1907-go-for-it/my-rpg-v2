# Ủy Thác Hằng Ngày

Thay lựa chọn Hầm Ngục Ảo Ảnh bằng modal Ủy Thác ở vị trí nút thư mục save trên tavern. Icon cuộn giấy có dấu chấm than đỏ khi bất kỳ thưởng nhiệm vụ hoặc mốc nào có thể nhận. Save vẫn mở thư mục được từ màn chọn hồ sơ.

| Nhiệm vụ | Thưởng |
| --- | --- |
| Đăng nhập, sau khi chọn hồ sơ và vào game | 1 Prisma |
| Thắng 1 quest Thảo phạt | 1000 Coin |
| Thắng 3 quest Thảo phạt | 1500 Coin |
| Thắng 5 quest Thảo phạt | 2000 Coin |
| Hoàn thành toàn bộ một lượt Mỏ Vàng hoặc Hiểm Trở, bất kỳ độ khó | 3 Pure Prisma |

Quest 50 và 150 Coin đều được tính, cho phép lặp lại cùng quest. Không tính chương truyện lữ hành, siêu trùm hoặc các wave riêng trong hầm ngục. Một lần thắng chỉ được tính cùng giao dịch lưu thưởng của trận đó; retry không đếm lại.

| Số nhiệm vụ đã hoàn thành | Thưởng mốc |
| --- | --- |
| 1 | 500 Coin |
| 2 | 3 Pure Prisma |
| 3 | 1500 Coin |
| 4 | 5 Pure Prisma |
| 5 | 1 Original Prisma |

Mốc tính điều kiện đã hoàn thành, không phụ thuộc việc đã bấm nhận thưởng nhiệm vụ. Có nút Nhận tất cả và các nút nhận riêng. Tối đa toàn bộ ngày: 6500 Coin, 1 Prisma, 11 Pure Prisma, 1 Original Prisma, chưa tính thưởng chiến đấu/hầm ngục gốc.

Đặt lại lúc 00:00 theo Asia/Ho_Chi_Minh. Kết quả được tính vào ngày nhận/lưu thưởng chiến thắng. Qua ngày mới, thưởng chưa nhận của ngày trước hết hạn; đăng nhập ngày mới được ghi nhận khi đang mở game. Lùi đồng hồ không tạo thêm lần reset. Không cung cấp chống chỉnh đồng hồ/save cấp máy chủ trong game offline.

`dailyCommissions` là ledger ngày hiện tại, có day, loggedIn, questClears (tối đa 5), dungeonClears (tối đa 1), claimedTasks, claimedMilestones. Mỗi hồ sơ có dữ liệu riêng. Save v6 cũ thiếu ledger được khởi tạo rỗng khi đọc; giữ version/key hiện tại để tương thích. Bộ phận đọc dữ liệu Ảo Ảnh cũ vẫn giữ cho save và gear loot lịch sử, không còn route/lựa chọn chơi.

Thưởng và cờ đã nhận được ghi cùng một lần lưu trước khi cập nhật UI. Nếu ghi thất bại thì không cộng thưởng hoặc tiêu cờ. Đăng nhập tự động chỉ thử một lần/ngày/hồ sơ mỗi đợt kích hoạt, tránh vòng lặp lỗi ghi; mở modal cho phép thử lại.

Các quest Hiểm Ác vẫn giữ điều kiện khóa hiện tại và tiến trình đã mở của save cũ. Gỡ liên kết và nội dung yêu cầu đi Ảo Ảnh, hiển thị điều kiện sẽ được bổ sung sau.
