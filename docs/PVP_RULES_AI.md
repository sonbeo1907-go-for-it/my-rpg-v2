# Luật PvP và AI — prototype 0.3

Bổ sung hiện hành: [Danh Dự, Đấu Hạng, chọn/cấm và build AI](ARENA_RANKED_HONOR.md). Đấu Thường giữ chuẩn hóa; Đấu Hạng dùng build thật, cần16 nhân vật chính thức. Arena có thưởng Danh Dự riêng; Luyện Tập không thưởng.

## Phạm vi

Tìm Trận là đấu AI ngẫu nhiên offline, không kết nối người chơi thật. Luyện Tập chứa các đội mẫu và Ảnh gương. Chưa triển khai app admin, banlist hay đọc JSON bên ngoài EXE; cấu hình hiện được đóng gói cùng game.

## Luật riêng cho trận

`data/pvpRules.json` chứa phiên bản và cấu hình. `preparePvpContent` sao chép dữ liệu PvE, kiểm tra cấu hình, áp override rồi đóng băng sâu. Mỗi trận giữ phiên bản bất biến; công cụ xem kỹ năng trong trận dùng đúng bản dữ liệu đã điều chỉnh. Dữ liệu PvE không bị thay đổi bởi override. Tiến trình và thưởng Đấu Trường được lưu riêng trong campaign.

- `characterOverrides[id].stats`: chỉ số nền. `passive`: các trường số đã có của nội tại.
- `abilityOverrides[id]`: MP, cooldown và các trường hiệu ứng được cho phép như multiplier, primaryMultiplier, duration, penetration, hits, perStack.
- `statusOverrides[id].modifiers`: sửa modifier đã tồn tại.
- `normalization`, `softCaps`, `loopGuards`, `ai.maxCandidates`: cấu hình chung.

Các bảng override đang để trống, tránh áp nerf nhân vật khi chưa có dữ liệu playtest. Hàm tạo trận nhận `options.rules` để tích hợp nguồn cấu hình sau này; không tự thay luật giữa trận.

## Soft cap hai ngưỡng — arena-0.3.0

Sau công thức sát thương và giảm sát thương thông thường, trước khi khiên/HP hấp thụ, tính hai bước trên tổng sát thương của cùng hành động/mục tiêu:

1. Với sát thương gốc x và ngưỡng T1: y = min(x, T1) + max(0, x − T1) × 25%.
2. Với tổng y và ngưỡng T2: F(x) = min(y, T2) + max(0, y − T2) × 25%.

Ngưỡng hai áp dụng lên **tổng sau bước một**, không chỉ phần dư. Đơn mục tiêu 1.000 → 325 → 231,25, game làm tròn xuống231. Phần cực lớn sau cả hai ngưỡng còn tăng với độ dốc6,25%; không có trần cứng hoặc cap theo %HP.

| Nhóm | T1 mỗi mục tiêu | T2 mỗi mục tiêu | Ngân sách tổng T1 / T2 |
| --- | ---: | ---: | ---: |
| Đơn mục tiêu / nhiều hit cùng mục tiêu |100|200|—|
| Ngẫu nhiên |100|200|180 /360|
| Diện rộng / lan |70|140|200 /400|
| Liên kích / phản công đơn mục tiêu |70|140|—|
| Liên kích / phản công diện rộng |50|100|140 /280|
| Sát thương định kỳ |40|80|Theo nguồn, mục tiêu, vòng|

Nhiều hit và phần vật lý/phép dùng chung đường cong cộng dồn. Sát thương của từng hit = floor(F(tổng sau hit)) − floor(F(tổng trước hit)); không reset ngưỡng theo từng hit. Ví dụ ba hit100 vẫn thành100 +25 +25; mười hit100 có cùng tổng231 như một hit1.000. Không làm tròn từng giai đoạn trước khi tính chênh lệch.

Diện rộng/ngẫu nhiên chia **cả hai ngân sách** trước khi đánh, theo snapshot mục tiêu hợp lệ và trọng số chính/phụ. Ngưỡng của mục tiêu là giá trị nhỏ hơn giữa ngưỡng riêng và phần ngân sách được chia. Không áp ngân sách tổng lại lần nữa sau khi phân bổ; không phân bổ lại theo RNG hoặc thứ tự mục tiêu chết. Các ngưỡng hiệu dụng giữ cùng tỷ lệ2:1 trong cấu hình hiện hành.

Log thử nghiệm ghi sát thương gốc → phần tăng sau cap đầu → phần tăng cuối; metadata giữ cumulativeBefore/After, threshold/secondThreshold, afterFirstCap và phiên bản luật. Quy tắc được clone/freeze lúc tạo trận. PvE không áp cap này. Trường secondThreshold/secondOverflowRatio tùy chọn cho cấu hình kiểm thử cũ; khi có phải khai báo đủ và hợp lệ. secondTotalThreshold chỉ đi kèm totalThreshold.

## Chống vòng lặp

Tối đa một Thêm Lượt/người/vòng; phản ứng không kích chuỗi phản ứng. Mặc định tối đa bốn hành động tự động/người/vòng và 32 lần trúng mỗi hành động. Các phản ứng chính kiểm tra giới hạn trước khi tạo tài nguyên/VFX. Sát thương định kỳ dùng ngân sách cộng dồn theo nguồn/mục tiêu/vòng, kể cả lượt thêm.

## AI

`data/pvpAiProfiles.json` có cấu hình cho các nhân vật; Monica dùng cấu hình chung. Không có chỉ dẫn riêng cho Monica. Hồ sơ xác định mức cần hồi phục, dự trữ MP, các chiêu chuẩn bị/burst và trọng số kỹ năng.

AI lấy kỹ năng/mục tiêu qua cùng API hợp lệ như người chơi, chấm sơ bộ rồi dự báo tối đa 12 hành động trên bản sao trận. Dự báo dùng RNG trung tính riêng, không tiêu RNG thật. Thứ tự ưu tiên: cứu/bảo vệ trước nguy cơ bị hạ, kết liễu, triển khai buff/mode/tài nguyên, burst đúng điều kiện, phòng thủ khi thiếu MP. Có đánh giá khiên, hồi phục, giải hiệu ứng, buff/debuff, lượt thêm và trường thứ tự lượt. Đây là AI chiến thuật một bước, chưa phải bộ giải tối ưu nhiều vòng.

## Chuẩn hóa Đấu Thường

Hai bên Lv50, Rank5, mở nâng cấp truyện cho nhân vật đã chọn, không gear/Trấn. Phân bổ điểm cố định theo vai trò và chỉ số scale, cùng một thuật toán cho hai phe. Đội AI gồm bốn nhân vật khác nhau và có vai trò tấn công, hỗ trợ tấn công, bảo hộ/phòng thủ. Không chọn nhân vật developer. Người chơi cần đủ bốn người.

Luyện Tập giữ loadout thật ở Ảnh gương; đội mẫu giữ quy tắc cấp/Rank cũ. Đánh lại giữ seed; tìm trận mới tạo seed mới. Luyện Tập không nhận thưởng. Đấu Thường và Đấu Hạng nhận Danh Dự; không cấp EXP hoặc tiến độ quest PvE.

## Kiểm chứng

Kiểm thử riêng việc tách dữ liệu PvE, khóa phiên bản, cap nhiều hit/hybrid/AoE/ngẫu nhiên/DoT, không phụ thuộc thứ tự mục tiêu, khả năng oneshot, giới hạn phản ứng, dự báo không tiêu RNG, AI cứu đồng đội và chuẩn hóa không sửa save. Kiểm thử UI ba kích thước cho chọn mode, chọn đội và chiến đấu.
