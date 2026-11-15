# Bộ lọc nội dung đã ra mắt — trang Nhân Vật

Cập nhật 15/11/2026. Không đổi save, sở hữu hay tiến trình nâng cấp.

- **Trấn Phái** (`exclusive`): Tất cả / Đã ra mắt (`released`) / Chưa ra mắt (`unreleased`). Đã ra mắt khi có ít nhất một mẫu trong `content.exclusiveGear` mang `characterId` tương ứng và `enabled: true`. Không xét sở hữu nhân vật, mở công thức, cờ truyện, chế tạo hay trang bị. Một nhân vật có nhiều Trấn chỉ xuất hiện một lần; chỉ có mẫu tắt thì chưa ra mắt.
- **Thông Thạo** (`mastery`): ba lựa chọn tương tự, dựa trên `masteryEnabled(content, id)` và danh sách nhân vật được mở Thông Thạo trong cấu hình. Không yêu cầu Level 50, Rank 5 hay đã trả Original Prisma để nâng.
- **Thứ tự ra mắt** (`sort=releaseId`): sắp số `releaseId` tăng/giảm theo `direction`, không dùng slug `id` hoặc vị trí trong mảng JSON. Astoria ở #93 sau Chiyoko #92; không khôi phục #33 deprecated.

Hai bộ lọc kết hợp AND với nhau và với Sở hữu, Nguyên tố, Vai trò, tìm kiếm. “Chưa ra mắt” là phần bù theo cùng dữ liệu nội dung. Giá trị availability không nhận diện được không tự biến thành lọc âm.

Mặc định trang vẫn `ownership=owned`, `sort=level`, `direction=desc`. Muốn xem cả nhân vật chưa sở hữu, chọn Tất cả ở Sở hữu. Filter/sort nằm trên URL, giữ qua reload, mở Chi Tiết và trở về. Không ghi chúng vào save.

Core dùng `characterCatalog`; giao diện dùng prop `showReleaseFilters` của `CharacterFilters`, chỉ bật trên `CharactersPage`. Không thêm điều khiển mới vào modal chọn đội hay Arena. Catalogue có bốn ô mỗi hàng desktop, hai ô mỗi hàng mobile; ghi rõ bộ lọc dựa trên nội dung phát hành.

Kiểm chứng: `test/catalog-release.test.js`, `e2e/catalog-release.spec.ts`, regression sở hữu/mặc định/điều hướng hiện có. Không cần chế tạo Trấn hoặc nâng Thông Thạo để kiểm tra.
