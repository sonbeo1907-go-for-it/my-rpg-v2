# Thợ Rèn, Túi đồ và nền Trấn Phái

Phạm vi triển khai theo đặc tả ngày 29/10/2026: Thợ Rèn, phân rã, Vật phẩm, dữ liệu chế tạo/tái rèn và ô Trấn Phái riêng. **Hầm Ngục Ảo Ảnh vẫn đóng**, chưa có vòng chơi roguelike, thưởng Coin, phát Original Prisma hay mở flag Hiểm Ác từ chế độ đó.

## Quyết định đã thống nhất

- Danh mục hiện có 13 mẫu theo thiết kế bổ sung ngày 29/10/2026: 12 mẫu chế tạo và Dấu rèn khởi hành nhận miễn phí qua quest Lợn rừng khổng lồ (ATK +5 cố định). Xem [Vòng Phụ và đợt nhân vật mới](EXTRA_TURNS_AND_RECRUITS.md).
- Khung chế tạo/tái rèn và bốn hộp thoại đã có. Mẫu nhiệm vụ dẫn tới quest khi chưa sở hữu; sau khi nhận có thể tái rèn như mẫu khác, không thể chế tạo thêm bản sao.
- Mặc định thử nghiệm được hiện trong UI: chọn đều 7 loại chỉ số, rồi chọn đều một mức nguyên trong khoảng của loại đó; cho phép trùng stat cũ.
- Chỉ chế tạo cho nhân vật đã sở hữu, không tự trang bị sau khi chế tạo; có thể tháo và thay mẫu trong ô riêng.
- Đổi bộ lọc/sắp xếp ở Phân rã sẽ bỏ lựa chọn. Chọn tất cả chỉ chọn các món đang hiển thị, tối đa 99. Mọi lệnh, kể cả một món, đều có xác nhận.

## Dữ liệu và giao dịch

`data/blacksmith.json`: chi phí, số lượng tối đa, bảng Vụn, khoảng roll và chính sách. `data/items.json`: danh mục 5 tài nguyên và trường số dư tương ứng.

- Phân rã: t1 → 5; t2 → 15; t3_focused/t3_dual → 40 Vụn Prisma. Chỉ đồ thường chưa lắp ở bất kỳ nhân vật nào.
- Chế tạo: 10.000 Coin + 120 Vụn + 3 Pure Prisma + 1 Original Prisma, một lần/mẫu/hồ sơ.
- Tái rèn: 1 Original Prisma, tạo và lưu `pendingReforge` cùng lần trừ tiền. Chọn giữ/dùng mới là giao dịch kế tiếp, không thu lại phí.
- Khoảng: HP 25–50; MP 10–20; ATK/MAG/DEF/RES/SPD 5–10. Một chỉ số/món.
- Tất cả phép biến đổi core là hàm thuần. UI dùng `transact`, chỉ cập nhật/báo thành công sau khi file lưu được ghi.
- Mỗi pending có id từ `blacksmithRevision` để từ chối quyết định cũ hoặc gửi lặp. B/Esc/đóng chỉ ẩn hộp thoại D, giữ pending; có liên kết khôi phục ở các trang và tự mở khi quay lại Thợ Rèn.
- Đồ phân rã không còn trong kho. Nếu thuộc lần chiêu mộ gần nhất, chỉ lưu bản ghi lịch sử có `dismantled:true`, không phục hồi đồ khi xem lại kết quả và không thay lượt/pity.

## Save v5

Envelope ứng dụng v5, core vẫn v3. Các trường mới: `prismaFragments`, `originalPrisma`, `exclusiveGear`, `equippedExclusiveGear`, `pendingReforge`, `blacksmithRevision`.

Save v1–v4 được đọc/chuyển đổi; v4 giữ nguyên 5 đội hình và mọi tiến trình trước đó, bổ sung dữ liệu Thợ Rèn trống/0. Lần ghi tiếp theo dùng v5. Key cũ `.campaign.v4` tiếp tục được phát hiện cùng v1–v3; không xóa key gốc. Native vẫn dùng `savedata<N>.json`, cơ chế backup/revision/ghi nguyên tử hiện có.

V5 thiếu trường mới, số dư âm/lẻ/quá giới hạn, mẫu trùng/không tồn tại, stat ngoài khoảng, ô thuộc nhầm nhân vật hoặc pending lệch stat cũ đều bị từ chối.

## Khi bổ sung mẫu thật

Mỗi mẫu có `id`, `characterId`, `name`, `description`, `enabled`, `passive`. Chỉ mẫu đang trang bị mới cộng stat/nội tại; stat cộng trước % và trận đang chạy giữ snapshot.

Các adapter được khai báo/kiểm tra trong `exclusive-hooks.js`, xử lý qua các điểm nối của combat: dùng chiêu, né, tiêu dấu, vỡ khiên, chuyển Cover và đầu lượt kế tiếp. Danh sách 13 nội tại thật và quy tắc Vòng Phụ có trong `EXTRA_TURNS_AND_RECRUITS.md`. Nội tại mới cần schema, handler và bài kiểm tra trước khi mở mẫu. Các mẫu kiểm thử tổng quát vẫn chỉ nằm trong test. Giữ ID/định nghĩa đã phát hành để save đã sở hữu còn tải được.

## UI và kiểm tra

`MerchantScene` dùng chung cho Tiệm Prisma và Thợ Rèn, SVG thuần vector `/art/blacksmith.svg`, 60/40 desktop và xếp dọc trên cửa sổ nhỏ. Có đúng 2 thẻ Phân rã/Trấn Phái; Túi đồ có Trang bị/Vật phẩm. LB/RB nhận diện hai nhóm, không đổi nền khi hộp thoại mở. Ô Trấn Phái nằm riêng trên trang chi tiết/trang bị nhân vật, không tăng số ô thường.

Đã kiểm tra core: di trú, giới hạn 99, sở hữu, chi phí, RNG, 2 mẫu cùng nhân vật, % cộng một lần, snapshot trận, pending sau khởi động lại và từ chối stat/save sai. Kiểm tra giao diện thật có Phân rã/hủy/lỗi lưu/thử lại/giới hạn chọn/Vật phẩm/điện thoại/tay cầm. Luồng UI chế tạo/tái rèn với mẫu thật cần kiểm tra lại khi nội tại và mẫu được bổ sung.
