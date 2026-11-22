# Hé Lộ Yufina / Lisbeth và Trấn Lisbeth — 22/11/2026

## Yufina

Chuyển điều kiện từ Hạt Giống Bội Thu sang **Bài Ca Vô Danh cùng phe**. Vẫn cần mở/bật Hé Lộ và đang trong Quang quyền bừng sáng. Mọi sát thương mang thêm Nguyệt; mỗi kỹ năng công kích thêm một hit phép Quang–Nguyệt bằng **120% ATK động** của Yufina, cố định không tăng theo Rank/Thông Thạo. Đánh thường chỉ thêm Nguyệt. Giữ tiến trình mở/bật cũ, không thu lại30 Pure hoặc đổi ID.

## Lisbeth

Mở Hé Lộ30 Pure tại Kỹ Năng, bật/tắt miễn phí ngoài trận/chuyến đi như khung hiện hành. Không cấp quyền ghép Chúc Phúc. Khi **Hạt Giống Bội Thu cùng phe** còn hiệu lực, Lisbeth nhận **+10 MAG căn bản** (trước modifier%) và mọi sát thương thêm Nguyệt, gồm đánh thường. Không phụ thuộc Kiêu hãnh Ranoc.

Sau sát thương Phán quyết kiêu hãnh, gọi **một hit350% MAG động của Chúc Phúc** vào đúng mục tiêu còn sống/còn hạt giống; không lan, không đổi mục tiêu nếu mục tiêu gục. Đây là nguồn sát thương phép Thổ–Nguyệt độc lập của Chúc Phúc, nhận hệ số hiệu quả hạt giống/hào quang/gear hiệu lệnh theo khung hiện tại. Không tăng theo Rank/Thông Thạo của Phán quyết; không dùng MAG Lisbeth thay MAG Chúc Phúc. Không gọi từ các chiêu khác; không tiêu tài nguyên/MP phụ, không gia hạn Chúc Phúc hoặc chiếm pulse tự động. Mỗi hành động hiệu lệnh có context tiêu Sơ Hở riêng như các hiệu lệnh hiện hành.

+10 MAG được suy ra từ trạng thái Chúc Phúc, không ghi vào build/save hoặc cộng lặp. Tắt Hé Lộ, hết hạn hoặc sai Chúc Phúc thì mất; snapshot trận/chuyến đi khóa cấu hình như cũ. Qua wave/phase giữ luật carry hiện có, không kích lại activation. Hai phe tính độc lập.

## Quang Trượng Kiêu Hãnh

Giữ ID/công thức/đồ đã sở hữu và roll chỉ số. **Thay** hoàn8 MP khi có Kiêu hãnh bằng:

- Phán quyết kiêu hãnh giảm1 vòng CD: CD2→1. CastR1 khóaR2, sẵn sàngR3. CD giảm đầu vòng chung, không giảm thêm ở Vòng Phụ/Choáng. Lệnh sai/thiếu MP không gán CD.
- Riêng kỹ năng đó nhận thêm30% MAG qua modifier chỉ số của hành động, cộng với các modifier MAG khác; không phải damage amp, không tăng hệ số2,8 hoặc buff MAG tồn tại trên người. Không tăng MAG Chúc Phúc khi ra lệnh. Không nhân Rank hai lần.

Hai adapter Trấn dùng lại theo dữ liệu: skill_cooldown_reduction và skill_stat_bonus; resolver/preview và thực thi dùng cùng nguồn. Không thay đổi PvE gốc khi không mang Trấn. PvP vẫn clamp Rank5 và áp luật damage hiện có.

## Nghiệm thu

Kiểm thử thực thi: mở/bật/lưu, đúng/sai/hết hạn Chúc Phúc, MAG căn bản không cộng lặp, các chiêu không liên quan/đánh thường, hiệu lệnh đúng target/không chuyển khi gục, Rank1/8, forecast không mutate, CD qua queue thật, mirror hai phe, validator. Các test: test/lisbeth-revelation.test.js, test/seed-storm.test.js, test/blueprint-exclusives.test.js.

Kết quả nghiệm thu22/11/2026: 2.021/2.021 kiểm thử Node đạt; validate/typecheck/diff-check đạt; Playwright kiểm mô tả, mở/bật và lưu Hé Lộ Yufina/Lisbeth đạt. Frontend export và EXE Windows đã build thành công. Công cụ Next.js đã phát khuyến nghị nâng cấp bảo mật trong lần build đầu; bản vá này giữ dependency hiện có.
