# Khai phá điểm yếu và Sơ hở nguyên tố

Hai cơ chế được triển khai ở engine; chưa tự cấp cho nhân vật, trang bị hay quái nào. Không đổi định dạng save.

## Dữ liệu dùng lại

Buff `weakness_exploitation`: `weaknessMultiplier: 2`. Khi người mang buff đánh trúng điểm yếu, thay hệ số 1.5 bằng 2; không nhân tiếp 2 vào 1.5. Nhiều nguồn lấy hệ số mạnh nhất. Áp dụng cả điểm yếu nguyên tố và loại sát thương Vật lí/Ma pháp; một đòn khớp nhiều điều kiện chỉ tính một lần. Không tự tạo điểm yếu.

```json
{"type":"status","status":"weakness_exploitation","duration":2}
```

Tám debuff `exposure_plain/fire/water/earth/wind/thunder/light/dark`: khai báo `exposedElement`, `maxStacks: 3`, `kind: "debuff"`. Không phụ thuộc ID nhân vật hoặc tên trạng thái. Tất cả cùng một nhóm độc quyền: cùng nguyên tố cộng tầng tối đa 3, khác nguyên tố thay toàn bộ loại cũ và bắt đầu bằng số tầng được cấp mới. Điểm yếu tự nhiên không bị thay đổi. Ba tầng vẫn chỉ là một loại debuff cho Kreider.

```json
{"type":"status","status":"exposure_fire","stacks":3}
```

`stacks` mặc định 1, cho phép 1–3 và chỉ dùng cho trạng thái Sơ hở. Không có duration: duy trì đến khi hết tầng hoặc bị giải. Có thể thêm `duration` để giới hạn theo lượt chính của người mang, Vòng Phụ không giảm thời hạn. Dùng lại làm mới thời hạn.

```json
{"type":"damage","damageType":"magical","element":"fire","multiplier":1.2,"onHitStatus":{"status":"exposure_fire","stacks":2}}
```

On-hit được áp dụng sau hit. Sơ hở mới sinh trong một lần thi triển không cấp lợi ích cho các hit còn lại của chính lần thi triển đó. Chiêu/liên kích kế tiếp có thể dùng ngay. Hộ ấn chặn toàn bộ một lần gắn (kể cả gắn ba tầng), giữ nguyên Sơ hở cũ nếu lần thay hệ bị chặn. Cleanse xóa tất cả tầng; dispel xóa buff Khai phá.

## Tiêu tầng theo lần thi triển

- Tối đa 1 tầng/mục tiêu/lần thi triển. Bốn hit hoặc sát thương hybrid không tiêu bốn tầng. Chiêu ngẫu nhiên cũng tính theo từng địch thực sự trúng.
- Chỉ các hit trúng nguyên tố Sơ hở hưởng lợi; khác nguyên tố không tiêu tầng.
- Cả chiêu hưởng tầng đã dành cho nó, kể cả tầng cuối. Liên kích và phản công là lần thi triển riêng, đọc buff của người thực hiện.
- Tầng được dành ngay khi có hit gây sát thương HP hoặc khiên, trước khi xử lý phản ứng chen vào. Các hit tiếp theo của chiêu gốc giữ quyền hưởng điểm yếu; liên kích không thể dùng lại tầng đã dành. Trừ và báo log khi kết thúc lần thi triển.
- Làm mới Sơ hở trong lúc có tầng đang dành không hoàn lại tầng đó; chỉ cộng vào số tầng chưa dành. Chuyển nguyên tố không chuyển số tầng cũ.
- Đánh thường, phản công, liên kích và đòn trực tiếp tự động đều tính. Né không tiêu; đòn vào khiên vẫn tiêu. Chi phí HP và sát thương định kỳ không tính.
- Trùng điểm yếu tự nhiên vẫn tiêu tầng. Sơ hở cũng được tính là điểm yếu thật cho Iris và Kìm hãm của Miraebolis; giữ hạn mức hiện có theo lần thi triển/vòng.
- Che chắn: tính trên người thực nhận đòn, không trên mục tiêu ban đầu.
- Cơ chế giữ/xóa qua phòng tuân theo luật carry của từng loại trận hiện có. Trận độc lập mới không giữ trạng thái cũ. Đổi phase trong cùng trận không tự xóa Sơ hở.

Engine dùng ngữ cảnh riêng cho từng lần thi triển và đặt chỗ tạm bằng WeakMap trên instance trạng thái. Không đưa Map/Set đặt chỗ vào battle/save. Điểm yếu gốc không bị ghi đè; UI dùng chung hàm `weaknessElements` để hiện điểm yếu tạm thời. Damage event có `weaknessMultiplier`; log hiện +50% hoặc +100% thực tế. Event `status_consumed` báo số tầng còn lại.

## Kiểm tra bắt buộc khi mở kỹ năng mới

Chạy `npm.cmd run validate` và `node --test test/weakness-mechanics.test.js test/weakness.test.js`. Bộ kiểm tra bao gồm đa hit, AoE, random, hybrid, tầng cuối với Aurora, on-hit làm mới, Hộ ấn, cleanse/dispel, khiên/né, Vòng Phụ, Độc, Iris và Miraebolis.
