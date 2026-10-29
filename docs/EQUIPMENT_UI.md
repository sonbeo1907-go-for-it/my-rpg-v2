# Icon trang bị và giao diện Trấn Phái

29/10/2026.

## Màu và nhận diện

| Loại | Màu icon | Dấu đi kèm |
| --- | --- | --- |
| Cấp thấp | Xanh lá `#78de9b` | I |
| Cấp trung | Xanh dương `#7bbcff` | II |
| Cấp cao, cả hai loại | Tím `#c6a0ff` | III |
| Trấn Phái | Vàng cam `#ffbf69` | Biểu tượng lò rèn và ✦ |

Dùng chung `EquipmentIcon` trong Túi đồ, thẻ chọn trang bị, ô đã lắp, ô Trấn Phái và Thợ Rèn. Tên cấp và dấu I/II/III vẫn có để không phụ thuộc màu. Dấu E đỏ trên nền trắng là trạng thái **đang trang bị**, không phải màu độ hiếm. Viền chọn/focus không thay màu cấp.

## Góc nhìn game thủ

- Xem ngay tên, chỉ số cộng và nội tại của món đang đeo.
- Túi đồ có mục Trấn Phái riêng, có lọc theo nhân vật/tìm tên, dẫn tới trang quản lý đúng chủ nhân.
- Đổi Trấn Phái bằng chọn → xem trước → xác nhận. Không tự đổi khi vừa chạm vào thẻ.
- So sánh chỉ số thực sau trang bị/đội hình/nội tại. Chỉ hiện các dòng thay đổi; nếu chỉ số bằng nhau, vẫn nói rõ nội tại sẽ đổi.
- Một nhân vật có một ô riêng. Tháo không làm mất món hoặc các ô thường.

## Góc nhìn UI/UX

- Phân biệt “đang trang bị” bằng E + chữ; “đang xem” bằng khung chọn và khối xem trước.
- Modal chỉ liệt kê Trấn Phái đã sở hữu của nhân vật đang quản lý.
- Một nút chính để xác nhận; nút hủy đóng mà không lưu. Món hiện tại không thể xác nhận lại.
- Nội tại có câu ngắn, ngoại lệ nằm trong phần mở rộng theo `SKILL_COPY_AND_UX_SPEC.md`.
- Desktop chia danh sách/xem trước; mobile dùng danh sách chọn cuộn ngang để ưu tiên khoảng trống xem trước, có cuộn và nút tối thiểu 44 px. Bàn phím và tay cầm dùng chung điều hướng modal.
- Ghi lưu lỗi giữ nguyên món đang đeo và lựa chọn trong modal. Chỉ đóng sau khi lưu thành công.

Không đổi cơ chế, chỉ số, nguyên liệu hay chi phí chế tạo/tái rèn trong đợt này.
