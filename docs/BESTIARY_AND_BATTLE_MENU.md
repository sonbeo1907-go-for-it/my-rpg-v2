# Bách Khoa và menu trận đấu

## Hành vi đã chốt

- Bách Khoa nằm ở màn hình chờ, chỉ hiện quái đã thực sự gặp trong trận. Ghi nhận theo definitionId, lưu encounterId để chọn đúng đường tăng HP. Trinh sát không mở ghi chép; quái ở đợt tiếp theo chỉ được ghi khi đợt đó bắt đầu. Quái triệu hồi được ghi khi xuất hiện, kể cả đã gục trong cùng hành động.
- Không ghi bù nhìn Khu Luyện Tập hoặc nhân vật đối phương trong Đấu Trường/tự thí. Quái thử thách đặc biệt học viện dùng cùng quy tắc nếu có trong dữ liệu kẻ thù chính thức.
- Save cũ thiếu trường bestiary: dùng biên nhận nhận thưởng lần đầu để khôi phục quái của những đợt đã vượt, không suy diễn từ màn mới chỉ mở khóa. Không suy diễn quái triệu hồi chưa có bằng chứng đã gặp.
- Tra cứu cấp 1–55 cho đường HP thường/boss; 1–90 cho siêu trùm. Cùng hàm levelScaledEnemyStats của trận đấu, bao gồm referenceLevel của encounter. Đây là chỉ số đầu trận chưa áp điều kiện thử thách/pha sau/hệ số riêng của lượt chạy. Chiêu thức, điểm yếu, kháng, giai đoạn và Oán Hận hiện bên dưới.
- Bestiary là trường bổ sung tùy chọn trong save hiện hành. Native split-save đặt nó vào progression; không đổi ID, tên file hay namespace save. Ghi nhận được gom trong runtime và lưu qua cùng khóa ghi hồ sơ, tránh ghi đè phần thưởng/tiến trình khác. Ghi thất bại không đánh dấu đã lưu; lần publish mới có thêm ghi nhận hoặc lần lưu hồ sơ tiếp theo sẽ thử lại.

## Menu trận đấu

- Nút trở về/Escape/B mở menu giữa các hành động. Không cắt ngang một hành động/chuỗi phản ứng đang giải quyết. Vào menu dừng tự động và farm lặp, không tự bật lại khi tiếp tục.
- **Tiếp tục:** đóng menu, giữ nguyên trận.
- **Tạm thoát:** về màn hình chờ. Trận PvE thường và dungeon chỉ giữ trong bộ nhớ phiên game hiện tại; đóng ứng dụng mất trận này. Chronicle/tự thí tiếp tục dùng checkpoint hiện có, không hạ cấp cơ chế lưu của chúng. Không tick thêm vòng, thời hạn, MP, hồi chiêu hoặc RNG khi đang ở màn chờ.
- **Thoát trận:** cần xác nhận; quest/dungeon thường xóa lượt chạy đang dở, không phát thưởng. Chronicle chuyển về nhánh rút lui/thử lại hiện hành. Tự thí lưu thất bại của trận hiện tại, không xóa cả giải.
- Đấu Trường không hỗ trợ tạm thoát. Thoát trận ghi xử thua và lưu kết quả trước khi điều hướng. Cơ chế xử thua khi rời route/đóng cửa sổ vẫn giữ.

## Điều hướng đội hình

- Hai nguồn bị thiếu trong allowlist: Khu Luyện Tập và trang chọn điều kiện Khúc Ca. Nhánh Khúc Ca dùng chung cho ba màn, tổng cộng bốn trang được sửa đường về.
- Giữ URL nguồn và query qua trang đội hình và các lần xem nhân vật/trang bị. Không dùng history.back vì reload/đi vòng có thể sai đích. Các link Dungeon dạng cũ vẫn được hỗ trợ tương thích.

## Giảm áp lực Bóng Đen Bám Đèn

- ATK Lv1: 45 → 36; Lv50: 90 → 72.
- Đòn cắn riêng north.shade_snap: 180% → 140% ATK. Giữ north.shade_bite 180% cho Kẻ Gõ Cửa Sau Nửa Đêm, tránh vô tình sửa boss dùng chung kỹ năng.
- Không đổi đường scale cấp hoặc HP/phép diện rộng của Bóng Đen.

## Kiểm thử và nghiệm thu

- test/bestiary.test.js: ghi nhận thực tế, đợt mới, summon, loại trừ training/Arena, chuẩn hóa, migration, roundtrip save, đường scale theo encounter, giới hạn cấp, URL an toàn và rút tự thí.
- e2e/bestiary-menu.spec.ts: tìm/lọc/tra cấp/xem chiêu, desktop/tablet/mobile, tạm thoát giữ nguyên trận, lưu ghi nhận qua reload, thoát thật, đường về đội hình.
- Native test bestiary_belongs_to_progression_section xác nhận phân đoạn save.
- Hướng UI: design-taste-frontend, app style data-terminal, seed 938167388. Giữ bảng màu navy/gold và Noto Serif của game; không áp màu/font một dashboard mới lên thương hiệu JRPG. Chữ được chọn gạch một đường vàng mảnh; số liệu tabular, tương phản cao; mobile dùng danh sách/chi tiết luân phiên, không ép hai cột.
- Câu hỏi màn hình: “Kẻ thù này có chỉ số và chiêu thức thế nào ở cấp tôi đang xem?” Đối tượng: kẻ thù, trận đã gặp, nguyên tố, cấp và kỹ năng. Đơn vị: HP/MP/ATK/MAG/DEF/RES/SPD, hệ số %, MP, vòng. Mốc thật: Bóng Đen Lv50 có 2.737 HP, 72 ATK, 86 MAG; giao diện dùng trực tiếp dữ liệu engine, không dùng số trang trí.

Kiểm tra thiết kế: lint không phát hiện mẫu bị cấm. Inspector dùng ảnh chụp DOM thực từ bản preview, phục vụ cùng origin để font cục bộ tải đúng. Ngoại lệ giữ nguyên: bóng chữ của logo và chữ The nhỏ, nhãn tiền tệ 10px trong header chung; đây là nhận diện/khung đã có của game, không phải nội dung Bách Khoa. Ba font gồm font logo riêng, Noto Serif cho tiêu đề và Segoe UI cho thông tin. Nội dung mới dùng từ 13px trở lên.
