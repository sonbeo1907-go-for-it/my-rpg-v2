# Rà UI với taste-skill

Skill đã cài: design-taste-frontend từ Leonxlnx/taste-skill. Dùng quy trình app-screen và bộ probe/judge thực trên browser có hồ sơ kiểm thử; không truy cập save người chơi.

Direction tham khảo: Editorial greeting, seed 906116386, giữ palette/type. Không đổi game thành dashboard nền sáng: theme JRPG hiện có, SVG tavern, màu tím Prisma, viền vàng và Noto Serif là ràng buộc của dự án. Chỉ sử dụng nguyên tắc hierarchy, bố cục, focus và kiểm tra đa kích thước.

## Phạm vi rà

14 màn × 3 kích thước (1440, 768, 390): Tavern, Đấu Trường, Đội Hình, Nhân Vật, chi tiết Arthur, trang bị Arthur, Túi Đồ, Quest, Shop, Thợ Rèn, Chiêu Mộ, Hầm Ngục, Lữ Hành, Biên Niên Ký. Hồ sơ kiểm thử có gear mẫu để kiểm tra danh sách; dữ liệu này không được đưa vào game như save mặc định.

Lượt kiểm tra: 42 layout, không có lỗi JavaScript hoặc tràn ngang. Ảnh và metrics ở `.taste-skill/arena/audit/` được gitignore. Đây không phải tuyên bố toàn bộ rule của dashboard đã pass: bộ kiểm tra vẫn báo cảnh báo style/typography với theme game.

## Chỉnh sửa từ góc nhìn người chơi

1. Hai phe mirror cần đọc khác nhau: nhãn phe trên card, thanh lượt, log và bảng tài nguyên riêng.
2. Đội đối thủ bốn người cần grid đồng đều: bốn cột desktop, hai cột mobile.
3. Tavern cần điểm vào rõ: Đấu Trường cột phải, banner Chiêu Mộ góc trái dưới; đổi hồ sơ nằm trong menu profile.
4. Tăng chữ phụ ở tavern mobile lên tối thiểu 11px và bio 12px; chuyển menu mobile sang flow hai cột, banner có hàng riêng để không che nút.
5. Giữ mode trong card thay vì hiệu ứng toàn màn; đồng thời sửa anchor VFX theo phe và chủ sở hữu.

## Những cảnh báo giữ nguyên / còn lại

- Chữ The trong logo cố ý nhỏ theo chỉ định, không áp dụng ngưỡng chữ giao diện cho thương hiệu.
- Viền, gradient, cỡ heading serif và màu nguyên tố là nhận diện JRPG; không loại bỏ chỉ để đạt rule dashboard.
- Một số chữ phụ nhỏ, mật độ và khoảng trắng của các màn cũ vẫn được ghi nhận trong báo cáo tự động; không thực hiện redesign toàn game trong bản nền móng PvP.
- Chưa có kiểm thử khả năng tiếp cận đầy đủ với screen reader hoặc đấu mạng. Điều hướng tay cầm hiện dùng bộ focus/spatial chung; các nút mới dùng button/link chuẩn.

## Cập nhật prototype 0.2

Ba route `/arena`, `/arena/match`, `/arena/practice` tách chọn mode, ghép đội AI và luyện tập. Hai banner SVG dùng đấu trường/kiếm và bia tập; đội mẫu có huy hiệu riêng, lề chữ cố định và trạng thái chọn rõ. Kiểm tra 1440/768/390 px, gồm flow ghép trận và log soft cap. Giữ palette, font, icon và khả năng focus của game; không redesign các màn ngoài phạm vi. Tìm Trận ghi rõ chuẩn hóa Lv50/Rank5 và không gear để người chơi hiểu điều kiện.

## Trải nghiệm ghép trận và hành động

Bổ sung màn tìm kiếm, báo tìm thấy và tải hai đội; dùng silhouette và card theo hệ. Username/avatar giả lập nằm trên/dưới bàn đấu cùng trạng thái suy nghĩ/thi triển/kết quả. Xem `ARENA_EXPERIENCE.md`. Ảnh loading được xem ở ba kích thước; ảnh bàn đấu desktop/mobile được rà trực tiếp. Bỏ thông báo bắt đầu trận dạng toast thường trực vì che thẻ nhân vật. Giữ serif/viền/gradient của theme game có chủ đích.
