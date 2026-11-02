# Luật PvP và AI — prototype 0.2

## Phạm vi

Tìm Trận là đấu AI ngẫu nhiên offline, không kết nối người chơi thật. Luyện Tập chứa các đội mẫu và Ảnh gương. Chưa triển khai app admin, banlist hay đọc JSON bên ngoài EXE; cấu hình hiện được đóng gói cùng game.

## Luật riêng cho trận

`data/pvpRules.json` chứa phiên bản và cấu hình. `preparePvpContent` sao chép dữ liệu PvE, kiểm tra cấu hình, áp override rồi đóng băng sâu. Mỗi trận giữ phiên bản bất biến; công cụ xem kỹ năng trong trận dùng đúng bản dữ liệu đã điều chỉnh. Save, dữ liệu PvE và kinh tế không bị thay đổi.

- `characterOverrides[id].stats`: chỉ số nền. `passive`: các trường số đã có của nội tại.
- `abilityOverrides[id]`: MP, cooldown và các trường hiệu ứng được cho phép như multiplier, primaryMultiplier, duration, penetration, hits, perStack.
- `statusOverrides[id].modifiers`: sửa modifier đã tồn tại.
- `normalization`, `softCaps`, `loopGuards`, `ai.maxCandidates`: cấu hình chung.

Các bảng override đang để trống, tránh áp nerf nhân vật khi chưa có dữ liệu playtest. Hàm tạo trận nhận `options.rules` để tích hợp nguồn cấu hình sau này; không tự thay luật giữa trận.

## Soft cap

Sau các phép tính damage và giảm sát thương thông thường, trước khi khiên/HP hấp thụ:

`F(x) = x` khi `x <= T`; còn lại `T + (x - T) × 0,25`.

| Nhóm | Ngưỡng mỗi mục tiêu | Ngưỡng chia cho toàn hành động |
| --- | ---: | ---: |
| Đơn mục tiêu / nhiều hit cùng mục tiêu | 100 | — |
| Ngẫu nhiên | 100 | 180 |
| Diện rộng / lan | 70 | 200 |
| Liên kích / phản công đơn mục tiêu | 70 | — |
| Liên kích / phản công diện rộng | 50 | 140 |
| Sát thương định kỳ | 40 | Theo nguồn, mục tiêu, vòng |

Nhiều hit và phần vật lý/phép của cùng hành động cộng dồn trước cap. Sát thương hit = phần tăng của `F(tổng damage)`, tránh chia nhỏ đòn để nhận lại ngưỡng. Ví dụ ba hit 100 thành 100 + 25 + 25. Đòn 1.000 đơn mục tiêu còn 325, vẫn có thể oneshot.

Với diện rộng, ngưỡng toàn hành động được chia trước theo trọng số mục tiêu chính/phụ trong danh sách mục tiêu hợp lệ lúc bắt đầu. Ngưỡng thực tế là giá trị nhỏ hơn giữa phần được chia và ngưỡng mỗi mục tiêu. Không cap hai lần và không ưu ái mục tiêu đứng trước. Ngẫu nhiên chia theo tập mục tiêu hợp lệ ban đầu, không phân bổ lại ngân sách theo kết quả RNG.

Đây là ngưỡng bắt đầu giảm tăng trưởng, không phải trần cứng hay cap theo %HP. Giá trị cần tiếp tục playtest với đội hình thực tế. Log debug ghi loại đòn, phiên bản luật và damage trước/sau; sự kiện damage giữ metadata để phân tích.

## Chống vòng lặp

Tối đa một Thêm Lượt/người/vòng; phản ứng không kích chuỗi phản ứng. Mặc định tối đa bốn hành động tự động/người/vòng và 32 lần trúng mỗi hành động. Các phản ứng chính kiểm tra giới hạn trước khi tạo tài nguyên/VFX. Sát thương định kỳ dùng ngân sách cộng dồn theo nguồn/mục tiêu/vòng, kể cả lượt thêm.

## AI

`data/pvpAiProfiles.json` có cấu hình cho các nhân vật; Monica dùng cấu hình chung. Không có chỉ dẫn riêng cho Monica. Hồ sơ xác định mức cần hồi phục, dự trữ MP, các chiêu chuẩn bị/burst và trọng số kỹ năng.

AI lấy kỹ năng/mục tiêu qua cùng API hợp lệ như người chơi, chấm sơ bộ rồi dự báo tối đa 12 hành động trên bản sao trận. Dự báo dùng RNG trung tính riêng, không tiêu RNG thật. Thứ tự ưu tiên: cứu/bảo vệ trước nguy cơ bị hạ, kết liễu, triển khai buff/mode/tài nguyên, burst đúng điều kiện, phòng thủ khi thiếu MP. Có đánh giá khiên, hồi phục, giải hiệu ứng, buff/debuff, lượt thêm và trường thứ tự lượt. Đây là AI chiến thuật một bước, chưa phải bộ giải tối ưu nhiều vòng.

## Chuẩn hóa Tìm Trận

Hai bên Lv50, Rank5, mở nâng cấp truyện cho nhân vật đã chọn, không gear/Trấn. Phân bổ điểm cố định theo vai trò và chỉ số scale, cùng một thuật toán cho hai phe. Đội AI gồm bốn nhân vật khác nhau và có vai trò tấn công, hỗ trợ tấn công, bảo hộ/phòng thủ. Không chọn nhân vật developer. Người chơi cần đủ bốn người.

Luyện Tập giữ loadout thật ở Ảnh gương; đội mẫu giữ quy tắc cấp/Rank cũ. Đánh lại giữ seed; tìm trận mới tạo seed mới. Không nhận thưởng, EXP hoặc tiến độ nhiệm vụ ngày.

## Kiểm chứng

Kiểm thử riêng việc tách dữ liệu PvE, khóa phiên bản, cap nhiều hit/hybrid/AoE/ngẫu nhiên/DoT, không phụ thuộc thứ tự mục tiêu, khả năng oneshot, giới hạn phản ứng, dự báo không tiêu RNG, AI cứu đồng đội và chuẩn hóa không sửa save. Kiểm thử UI ba kích thước cho chọn mode, chọn đội và chiến đấu.
