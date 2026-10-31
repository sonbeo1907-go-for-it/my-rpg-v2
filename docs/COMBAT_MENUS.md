# Combat results và menu — 01/11/2026

## Settings

Giao diện → Nhật ký chiến đấu (Battle Logs): bật mặc định để giữ hành vi các thiết lập cũ. Lưu riêng trên thiết bị bằng `northern-prisma.settings.v1`, không thay save nhân vật. Khi tắt, ẩn nhật ký ở combat và màn kết quả; engine vẫn giữ log của phiên để có thể bật lại.

## Kết quả trận

Kết quả xuất hiện sau hiệu ứng cuối cùng, cho cả thắng và thua. Chuỗi dungeon/truyện chỉ hiện kết quả tổng sau đợt cuối; các đợt giữa tiếp tục dùng luồng chuyển đợt hiện có.

Bảng gồm kết quả, thưởng farm, thưởng lần đầu, EXP từng thành viên và hai nút Đánh lại / Trở về. Đội hình sau trận nằm trong mục thu gọn. Màn không cấp EXP và Level 50 có thông báo riêng.

Thanh EXP: phần đã có màu xanh xám, phần nhận thêm màu vàng. Nếu tăng nhiều cấp, hiển thị tiến độ ở cấp hiện tại, số cấp tăng và điểm phân bổ. EXP vượt trần được ghi rõ; `fromXp` / `toXp` được chụp ở giao dịch nhận thưởng để không phụ thuộc biến động sau đó.

Giữ nguyên trình tự lưu nguyên tử: chưa lưu thì chưa xác nhận nhận thưởng. Nếu lưu lỗi, màn kết quả cho phép Nhận thưởng lại, khóa Đánh lại tới khi lưu thành công. Không cộng thưởng khi chỉ mở lại màn kết quả.

## Vé Quét

Chọn hầm ngục/độ khó → Bắt đầu thám hiểm → chọn Đánh trực tiếp hoặc Dùng Thẻ Quét trong cùng modal trinh sát/xác nhận.

Hiển thị số thẻ, chi phí một thẻ + một lượt, điều kiện đã thắng đúng độ khó và cảnh báo EXP vượt trần. Đánh trực tiếp là mặc định mỗi lần mở. Hủy không tiêu thẻ. Quét lỗi lưu giữ modal và toàn bộ tài nguyên để thử lại. Không thay điều kiện mở Quét, phần thưởng hoặc cách tính nhiệm vụ ngày.

## Tab Nhân Vật

Bốn phần bằng chiều rộng: Tổng Quan / Cấp Độ / Kỹ Năng / Trang Bị. Tổng Quan chứa thông số, nội tại và Trấn; Cấp Độ chứa phân bổ/Đột Phá; Kỹ Năng chứa mô tả và preview; Trang Bị tái sử dụng trang trang bị hiện tại.

Ba tab đầu dùng `/characters/:id?tab=overview|level|skills`; tab cuối giữ `/characters/:id/equipment`. Giữ query `back` cho ngữ cảnh đội hình/danh sách. Chỉ hiển thị nội dung tab đang chọn. LB/RB chuyển giữa đủ bốn tab, kể cả khi đang ở route trang bị. LT/RT ở Trang Bị vẫn phân trang đồ.

## Tab Quest

Ba phần bằng chiều rộng phía trên bảng nhiệm vụ: Thảo Phạt / Truy Nã / Hiểm Ác. Giữ cơ chế khóa, tìm kiếm, lưu vị trí chọn và lọc riêng từng danh mục.

Chọn độ khó chuyển vào góc trên ảnh, nơi trước đây chứa danh mục. LT/RT chuyển năm độ khó; LB/RB chuyển ba danh mục theo thứ tự mới. Không thực hiện phím tắt nền khi modal đang mở. Các màn khóa/siêu trùm không hiện bộ chọn độ khó.

Màu viền theo độ khó: Rất dễ xanh lá; Dễ xanh dương; Trung bình tím; Khó hổ phách; Rất khó đỏ hồng. Luôn giữ tên độ khó và Level, không dùng riêng màu để truyền đạt.

Các phần dùng lại: `WideTabs`, `CharacterTabs`, `BattleResult`, `isBattleFinished`, `xpResultProgress`. Không thay hệ số chiến đấu hoặc phần thưởng ở lượt cập nhật giao diện này.
