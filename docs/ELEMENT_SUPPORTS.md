# Ember và Myonne — Hỗ trợ nguyên tố

Triển khai 04/11/2026 theo concept đã chốt. Cả hai là nhân vật chính thức trong banner standard, chưa có Trấn Phái hay truyện riêng.

## Ember

Hội Thợ Săn · Hỏa · Hỗ trợ tấn công. HP155 / MP110 / ATK9 / MAG30 / DEF14 / RES22 / SPD25.

- Đánh thường: 100% MAG phép Hỏa.
- Khoan Đã, Chỗ Đó Dễ Cháy!: 10 MP, CD2, gắn 3 Sơ Hở Hỏa đơn mục tiêu, không sát thương. CD2 khóa hai vòng sau thi triển, dùng lại R+3; Sơ Hở theo tầng, không tự hết theo thời gian.
- Lần Này Chắc Chắn Thành Công!: 16 MP, CD2, mọi đồng đội Hỏa gồm Ember nhận 30% ATK/MAG trong 3 lượt chính của từng người nhận. Rank tăng hai stat theo luật 5%, không tăng thời hạn.
- Chữa Cháy Theo Nghĩa Đen: 8 MP, không CD, 160% MAG phép Hỏa đơn mục tiêu, Rank tăng damage 10%.
- Ơ, Nó Cháy Tiếp Kìa!: đồng đội Hỏa khác dùng kỹ năng chủ động gây sát thương Hỏa → Liên kích Lửa Bén Ngoài Ý Muốn 100% MAG Hỏa, 1 lần/vòng. Liên kích cố định, không Rank.

## Myonne

Hội Thương Nhân Drageshelmfjall · Ám · Hỗ trợ tấn công. HP160 / MP105 / ATK10 / MAG29 / DEF15 / RES21 / SPD24.

- Đánh thường: 100% MAG phép Ám.
- Điều Khoản Chữ Nhỏ: 8 MP, CD1, gắn 2 Sơ Hở Ám đơn mục tiêu.
- Ưu Đãi Dành Riêng Cho Ngài: 16 MP, CD2, một đồng đội Ám (có thể tự chọn Myonne) nhận 25% ATK/MAG và Khai Phá Điểm Yếu trong 2 lượt chính. Rank chỉ tăng ATK/MAG theo luật 5%; hệ số điểm yếu giữ ×2.
- Xin Đọc Kỹ Trước Khi Ký: 10 MP, CD2, 150% MAG phép Ám đơn mục tiêu; nếu gây sát thương HP/khiên, xóa 1 buff của người thực sự trúng đòn. Né/không gây damage không xóa. Rank tăng damage 10%.
- Khách Quen Được Hoàn Phí: đồng đội Ám khác dùng kỹ năng chủ động gây damage Ám trúng điểm yếu → hồi 3 MP cho chính người tấn công, 1 lần/vòng trên toàn nội tại. Không tự đánh nên không tiêu Sơ Hở thay chủ lực.

## Hợp đồng vòng đời / tái sử dụng

- `targetElement` chỉ dùng cho ally/all_allies, giới hạn hệ nhân vật nhận; dùng chung targetsFor/selectedTargets cho UI, AI, execution. Không có mục tiêu hợp lệ thì không thi triển/tiêu MP/CD.
- `element_ally_followup` và `element_ally_weakness_mp` khai nguyên tố trong data; đòi cả người thi triển và sát thương cùng hệ đó. Không hardcode tên/ID nhân vật trong engine.
- Xét sau toàn bộ kỹ năng chủ động và sau khi kỹ năng nguồn đã quyết toán Sơ Hở; ghi nhận cả HP và khiên. Không xét basic/Defend, DoT, phản ứng hoặc automatic. Multi-hit/AoE chỉ kích một lần.
- Ember chọn mục tiêu chính nếu còn sống và thực sự nhận đòn đúng hệ; nếu không còn chọn người nhận đòn còn sống đầu tiên theo thứ tự hit. Không còn mục tiêu sống không tiêu hạn mức. Reserve trước khi Liên kích; dùng global no-self và PvP reaction guard, không nối chuỗi.
- Myonne xét điểm yếu nguyên tố hoặc loại đòn được engine công nhận, gồm đòn kết liễu. Chủ nội tại và người nhận MP phải sống; MP đầy không tiêu quota. Đã kích thì các đồng đội khác trong vòng không được hoàn thêm.
- Quota gắn owner actor ID + battle.round; main/extra dùng chung, choáng không tắt nội tại, bỏ lượt không kích. Qua wave/phase cùng battle giữ limiter, round mới tự sẵn sàng. Trận mới reset; forecast chỉ tác động clone.
- Buff theo lượt chính người nhận, choáng main vẫn giảm, extra không giảm. Tái cấp refresh, không cộng. Hộ Ấn/Phong Ấn áp dụng bình thường. Sơ Hở cùng loại cộng tối đa 3, khác hệ thay thế theo luật chung.
- Cả hai phe dùng cùng hook; PvP mirror dùng actor ID riêng, không chia nhầm limiter. Các hiệu ứng dùng VFX cơ bản theo hệ, không đổi nền/BGM.

Mã: battle.js, advanced-combat.js, content.js. Kiểm chứng: test/element-supports.test.js, e2e/element-supports.spec.ts.
