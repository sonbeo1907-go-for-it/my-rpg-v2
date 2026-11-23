# Trấn Tywin — Ngọc Bội Song Ảnh

Cập nhật ngày 23/11/2026. Mẫu mới `tywin.twin_jade`; Tywin trước đó chưa có Trấn được phát hành. Mở công thức bằng 10 Bản Thiết Kế tại Shop, chế tạo và tái rèn theo chi phí Trấn hiện hành. Dùng ô Trấn riêng, không đổi tiến trình Nguyệt Quang Hé Lộ.

## Hiệu ứng

Tẩy Trần Song Ảnh giữ nguyên 10 MP, hồi chiêu 2 vòng và chọn một đồng đội khác. Khi thi triển hợp lệ, giải debuff của Tywin và mục tiêu trước, rồi cấp **30% ATK trong 4 lượt chính** cho cả hai. Sau đó, chỉ Tywin nhận Lượt Thêm. Hệ số cố định; kỹ năng tiện ích này không nâng Rank.

## Vòng đời

- Thời hạn theo lượt chính của từng người nhận. Lượt tạo/làm mới không trừ ngay trong chính hành động đó. Lượt chính bị Choáng vẫn trừ, Vòng Phụ không trừ.
- Dùng lại làm mới thời hạn, không cộng dồn ATK. Buff có thể bị xóa hoặc bị Phong Ấn chặn nếu Phong Ấn vẫn còn sau thanh tẩy. Chặn buff không ngăn hiệu ứng cấp Lượt Thêm riêng.
- Sai mục tiêu, thiếu MP hoặc đang hồi chiêu: không cấp hiệu ứng và không tiêu chi phí.
- Lượt Thêm dùng `grant_extra_turn` tiêu chuẩn: vào Vòng Phụ, tối đa một quyền mỗi người mỗi vòng. Quyền đã có không cộng thêm; thi triển ở Vòng Phụ không sinh chuỗi lượt.
- Tywin bỏ hành động vì Choáng thì không kích Trấn. Qua wave/phase giữ luật carry hiện có. Trận mới tạo snapshot từ Trấn đang trang bị; thay trang bị ngoài trận không sửa snapshot đang chạy.
- Hai phe Arena dùng cùng resolver, preview, availability và forecast. Không thay luật PvP hoặc giới hạn Rank.

## Khung tái sử dụng và nghiệm thu

Adapter `skill_extra_effects` thêm bản sao các hiệu ứng hỗ trợ vào kỹ năng đã resolve, không sửa dữ liệu gốc. Chỉ chấp nhận buff status hợp lệ và `grant_extra_turn`; các hiệu ứng đi qua đường áp trạng thái và cấp lượt chung. Không tự nhân Rank cho buff của Trấn.

2.032/2.032 kiểm thử Node đạt, gồm 8 kiểm thử riêng cho Trấn Tywin. Playwright xác nhận công thức trong Shop, mô tả kỹ năng và thi triển thật cấp buff cho hai người. Validate, typecheck và diff-check đạt. EXE Windows đã build thành công.

Nguồn kiểm thử: `test/tywin-jade.test.js`, `e2e/tywin-jade.spec.ts`.
