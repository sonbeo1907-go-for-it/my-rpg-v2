# Khu Luyện Tập — 24/11/2026

Biên Niên Ký mở sẵn tại /chronicles/training. Dùng build tài khoản và engine PvE thật; không chuẩn hóa Arena. Không tốn lượt, không nhận Coin, EXP, vật phẩm, cờ mở khóa hoặc tiến độ nhiệm vụ. Trận và thiết lập chỉ tồn tại trong phiên đang mở, không ghi vào save.

## Thiết lập

1–12 bù nhìn, cấu hình riêng hoặc áp dụng cấu hình hiện tại cho tất cả. Chọn mẫu bất kỳ từ dữ liệu kẻ thù, cấp 1–90; chỉ sao chép chỉ số/điểm yếu/kháng, không sao chép cơ chế riêng boss. Nền chỉ số là Lv1 theo engine; đường HP dùng Normal đến55, Superboss sau55. Cấp mẫu chỉ là nguồn nạp chỉ số, có thể ghi đè cả bảy chỉ số; hiển thị cấp mẫu để nhận diện. Giá trị hữu hạn, nguyên, HP>=1, các số khác>=0, tối đa1tỷ.

Chọn nguyên tố, điểm yếu nguyên tố/loại sát thương, hệ số nhận sát thương mỗi nguyên tố0–500%, miễn Choáng, khiên ban đầu, HP vô hạn. Hành vi: đứng yên, đánh thường hoặc đòn tùy chỉnh (vật lí/phép, hệ số, số hit1–10, đơn/AoE). Bù nhìn đứng yên dùng hành động rỗng, **không** dùng Phòng Thủ để tránh làm sai kết quả đo. Mọi lựa chọn được kiểm tra trước tạo trận.

HP vô hạn giữ HP ở giá trị tối đa đã đặt, vẫn báo sát thương thực từ mọi hit và DoT qua applyLifeDamage; không dùng Infinity hay một trần HP giả cực lớn. Vì vậy điều kiện xét HP thấp/địch bị hạ không kích hoạt. Tắt HP vô hạn để kiểm tra kết liễu hoặc ngưỡng HP. Khiên vẫn hao bình thường.

## Đóng góp

combat-contributions.js cộng dồn từ emitEvent, không đọc log tiếng Việt và không giữ toàn bộ event lịch sử. Ledger hữu hạn theo số nguồn, không bị mất khi battle.events/log được xóa hoặc cắt ngắn. Forecast clone ledger cùng trạng thái; không sửa trận thật.

- Sát thương tổng = HP thực mất (bao gồm maxHP damage) + khiên thực bị trừ. Finite target chỉ tính HP thực mất, không cộng overkill; infinite target tính nguyên hit sau phòng thủ.
- Hiệu lệnh: damage.sourceId vẫn là Chúc Phúc, commanderId là người ra lệnh. Damage/reaction có metadata, log ghi tên người ra lệnh. Thống kê cộng damage đúng một lần cho commander; commandDamage là tập con để xem riêng, không cộng lần nữa. Pulse tự động ghi riêng cho Chúc Phúc; phản hồi Noelle ghi cho Noelle.
- Khiên tạo thêm = max(0,khiên mới−khiên cũ); yếu hơn không ghi. Khiên đã đỡ được ghi cho nguồn của khiên ở thời điểm trúng đòn, trước mọi phản ứng phá khiên/tạo lại khiên. Khiên ban đầu của bù nhìn không tính là nhân vật tạo.
- Hồi HP/MP chỉ tính thực nhận, không tính overheal hoặc Thế Chấp đã trả. Có số HP/khiên chịu đòn, debuff đã giải và Lượt Thêm đã cấp. Buff gián tiếp không được ước lượng thành sát thương: sát thương thực vẫn thuộc người gây ra.
- Tỷ lệ sát thương chia cho tổng cùng phe, bao gồm nguồn tự động; số0 hiển thị0%, không NaN. Có bảng hỗ trợ và bảng chịu đòn, chọn thước đo sắp xếp.

## Lifecycle và UI

Mở Tổng kết trong trận không qua lượt; nút bị khóa khi đang resolve/animation. Đóng để tiếp tục cùng HP/MP/CD. Kết thúc ghi outcome training_complete, không settlement. Làm lại cần xác nhận, tạo trận mới với build tài khoản và cùng cấu hình; xóa HP/MP/CD/resource/ledger từ phiên trước. Trận finite thắng/thua cũng dùng tổng kết riêng. Không ghi đè phiên Fortress/Arena/Tournament hoặc trận PvE chưa hoàn tất/nhận thưởng.

Giao diện theo data-terminal (seed846546667), giữ palette/type JRPG đã có; một đường mảnh cho lựa chọn, số tabular, bảng cuộn ngang trên mobile, một màu vàng cho thanh tỷ lệ sát thương. SVG sân tập không có người. Không thay shell game hoặc animation combat.

## Kiểm tra

test/training-ground.test.js: preset/cấu hình/finite/infinite/DoT/lifecycle thực/đòn AoE/khiên/hồi/forecast/isolation/hiệu lệnh/Noelle. e2e/training-ground.spec.ts: truy cập sách, cấu hình riêng, battle/report, restart, responsive và tay cầm. Không dùng save thật.
