# Ghi chú nghiệm thu UI: Khúc Ca Ngoài Sử Sách

Skill design-taste-frontend: draw app builder Achromatic ledger, seed830709882. Giữ palette và type của thương hiệu có sẵn (JRPG xanh đen/vàng, Noto Serif cho tiêu đề, Segoe UI cho nội dung); không áp palette sáng của dashboard lên game. Sheet lưu local .taste-skill/unrecorded/direction.json. Không dùng canvas node vì công việc thực tế là chọn điều kiện, không vẽ graph.

Câu hỏi chính: với bộ điều kiện này, tôi nhận được gì khi thắng? Khối tổng điểm/điều kiện/thưởng dùng dữ liệu chung với engine; mọi con số là cấu hình thật, không sample giả. Nét riêng là9 điều kiện của một trang sử bị bỏ quên và hình siêu trùm SVG tự dựng. Desktop điều kiện ở trái, tổng ở phải; tablet thu1 cột điều kiện, mobile đưa tổng xuống dưới. Danh sách có9 phần tử nên chia6 điều kiện chung/3 đặc trưng, không xổ mọi chữ trên một trang.

Chỉ số, mức chọn và progress dùng tabular figures, tổng score từ lựa chọn; focus button/radio, confirm modal tái dùng trap focus của app, gamepad LT/RT đổi cấp. Khung theo flat tone/border4px, không có entrance animation, reduced motion tắt thanh điểm. Các gradient trong tranh SVG là ánh sáng trong hình, không phải mặt điều khiển. Shell/header và gold button kế thừa ngôn ngữ game có sẵn.

E2E kiểm tra Quest→Đi vào→bảng→modal→combat, điểm/thưởng24/33→30Pure, tranh3màn, overflow1440/768/390, deep link/chọn lại. Ảnh trong test-results/song-*.png là artifact local.

Nghiệm thu cuối 11/11/2026: 3 E2E qua, inspector 0 FAIL/2 WARN tại 1440/768/390. Giữ hai cảnh báo: chữ thương hiệu chung của PageHeader và viền nổi hơn ở điều kiện ĐÃ CHỌN để dễ phân biệt. Cho phép text-shadow/button-fx/tiny-text của logo phát sáng, Settings và nhãn tiền tệ có sẵn ở shell; không áp các ngoại lệ đó cho thẻ điều kiện mới. Đã bỏ data-ui ở main, tăng cỡ chữ nút Đội hình, dùng nhãn câu thường và tabular figures. Inspector đọc snapshot HTML thật được tạo từ browser đã seed hồ sơ test, phục vụ cùng origin để font tải đúng; thao tác tương tác được kiểm tra trong E2E riêng. Không có dữ liệu mẫu cần thay trong UI phát hành.

B? sung Remulia: hi?n th? ba m?c nh?n nh?n v?t/? gear/c?ng th?c trong t?ng k?t; n?i dung c? ch? d?ng s? li?u th?t. C?nh b?o c? m?c S?p di?n ra v? th?ng b?o c? s? v?ng, kh?ng ph? thu?c Battle Logs. Ki?m tra 5 E2E v? inspector v?n 0 FAIL/2 WARN v?i ngo?i l? th??ng hi?u/vi?n l?a ch?n n?i tr?n.
