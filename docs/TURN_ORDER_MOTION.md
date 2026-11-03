# Thanh lượt — phản hồi chuyển động

Mục tiêu: nhìn được ai vừa hành động và ai đổi vị trí, không đổi luật xếp lượt.

Giữ font/màu JRPG; áp dụng taste skill Data terminal (seed1011008307) ở phạm vi phản hồi hàng đợi. Không thêm icon rail hoặc đổi shell: phần đó ngoài yêu cầu và trái hệ thống game hiện tại. Màu đánh dấu lượt hiện tại và ranh giới phe đã có được giữ.

Ô rời hàng đợi fade230ms, đồng thời trượt trái18px. Các ô còn lại dùng FLIP380ms, định danh actorId (bao gồm ID riêng từng phe Arena). Mọi thay đổi thứ tự từ engine, gồm SPD và trường thời gian, đi cùng luồng. Lượt Phụ trượt nguyên cụm từ trái sang phải480ms, cả đồng hồ cát. Chuyển vòng mới vẫn có fade/trượt ngắn; không phát lại entry vì publish HP/MP/log.

Một hàng cuộn ngang, không wrap trên điện thoại. Chuyển động đọc queue thực; không tự sort theo SPD ở UI. Ghost bị inert/aria-hidden, không nhận input hay nhân bản ID. Không trì hoãn engine hoặc khóa hành động. Theo dõi vị trí khi chuyển động để cập nhật liên tiếp không giật về đích cũ. Dọn rAF/animations khi rời trang; resize và giảm chuyển động hủy phần đang chạy.

Nghiệm thu: fade ô đã hành động; vị trí dịch trái; đổi thứ tự thực; Vòng Phụ entry; tác vụ liên tiếp; tên trùng Arena; 1440/768/390px; prefers-reduced-motion. Không dữ liệu giả trên UI.

## Taste QA

Source lint: không có FAIL/WARN. Browser inspector dùng DOM trận thực xuất sau thao tác Monica; đo1440/768/390. Chỉnh font thanh lượt/ô lên12px sau vòng kiểm tra đầu. Các allowance toàn trang: micro-label/tiny-text (logo, ví tiền và label màn cũ ngoài thanh lượt); gradient/text-shadow/button-fx (phong cách JRPG có sẵn, không đổi trong task hoạt ảnh). Cảnh báo font-count/fallback là Noto Serif + Segoe UI + Consolas của giao diện/log cũ; heavy-borders là khung chọn mục tiêu; app-title-size là tiêu đề Quest. Giữ nguyên vì nằm ngoài phạm vi thanh lượt và giúp giữ nhận diện game. Không áp dụng icon-rail/shell của mẫu Data terminal. Chụp cả giữa chuyển động, kết thúc và ba độ rộng; tests đọc keyframe thực, không chỉ ảnh tĩnh.
