# Miraebolis · Hắc Long Thiêu Thành

Encounter `miraebolis_superboss`, enemy `miraebolis`, BGM `/bgm/spboss_miraebolis.mp3`. Nhạc không bắt đầu lại khi đổi phase; thắng chuyển victory như các trận khác. Thưởng thắng 100 coin, chưa có thưởng lần đầu riêng.

## Chỉ số và điểm yếu

3.600 HP, 600 MP, ATK 48, MAG 42, DEF 32, RES 35, SPD 18, hệ Hỏa. Yếu Thủy / Quang / Lôi (+50% sát thương theo luật chung), nhận 70% sát thương Hỏa. Không có phá sừng hoặc mục tiêu bộ phận.

## Giai đoạn

| Phase | Khoảng HP | Hành động/lượt | Vòng chiêu |
|---|---|---|---|
| 1 — Bóng đen trên thành cổ | Trên 2.340 | 1 | Nanh đen, Hỏa cầu, Quét đuôi, Hơi thở thiêu thành |
| 2 — Thành trì cháy đỏ | 2.340 đến trên 1.260 | 1 | Hỏa tức quét thành, Nanh đen, Vảy thép nghiền nát, Hỏa cầu bạo liệt |
| 3 — Bạch hỏa diệt thành | 1.260 trở xuống | 2 | Nanh đen + Hỏa cầu; Quét đuôi + Bạch hỏa; Vảy thép + Hỏa cầu; vận Tâm diệt thành + Nanh đen |

Mốc chuyển phase chặn phần sát thương vượt ngưỡng của hành động, kể cả nhiều hit/độc, để không bỏ qua giai đoạn. Chuyển phase khi hành động kết thúc (độc kiểm tra sau tick đầu lượt), chỉ một lần. Vào phase 2 và 3 hồi 100% MP tối đa cho đồng đội còn sống; không hồi HP, hồi sinh, reset cooldown hoặc tài nguyên riêng. Hủy cảnh báo vận sức cũ khi đổi phase, bắt đầu rotation mới. Nếu phản công khiến boss chuyển phase giữa lượt, số move đã chốt đầu lượt không được tăng hồi tố.

Hai lần chuyển giai đoạn diễn ra trực tiếp theo HP, sau đó trận tiếp tục với hàng hành động bình thường. Tất cả nhân vật còn sống, gồm boss, đều được xếp theo SPD ở đầu mỗi vòng. Không thêm sự kiện cuối vòng hoặc điều kiện chờ giữa các phase.

## Kìm hãm

Đòn trúng điểm yếu gây mất HP hoặc sát thương vào khiên tạo 1 stack `dragon_suppressed`, tối đa 2. Một hành động nhiều hit chỉ tính một lần. Phản công và liên kích được xem là đòn riêng; liên kích nhiều hit cũng chỉ tính một lần. Độc không kích hoạt, đòn né hoặc không gây sát thương vào HP/khiên không kích hoạt. Đúng hệ vẫn nhận bonus sát thương bình thường.

Nhận stack làm mới toàn bộ thời hạn, kể cả đã đủ hai. Phase 1–2 tồn tại 3 lượt của boss; phase 3 tồn tại 2. Sang phase 3 giới hạn thời hạn đang có xuống tối đa 2. Mỗi lượt boss chỉ giảm thời hạn một lần sau tất cả move, không hai lần trong phase 3. Stack nhận mới giữa lượt từ phản công không bị trừ ngay ở cuối lượt đó theo quy tắc trạng thái mới. Kìm hãm không làm khựng hoặc hủy lượt boss.

Ở phase 3, mọi hit hệ Hỏa của boss nhân thêm 1,6 / 1,3 / 1,0 khi có 0 / 1 / 2 stack. Tính sau DEF/RES, trước giảm sát thương và khiên. Đòn vật lí Thường không chịu hệ số này. Phase 1–2 giữ mức sát thương gốc; Kìm hãm có thể được tích trước để chuẩn bị giai đoạn cuối.

## Chiêu thức và vận sức

| Chiêu | Hệ số | MP / hồi chiêu | Ghi chú |
|---|---|---|---|
| Nanh đen | 140% ATK Thường, đơn | 0 | Đòn dự phòng khi thiếu MP |
| Quét đuôi | 80% ATK Thường, toàn đội | 5 | Có thể né vật lí |
| Hỏa cầu hắc long | 150% MAG Hỏa, đơn | 7 | Có thể cover/khiêu khích |
| Hơi thở thiêu thành | 120% MAG Hỏa, toàn đội | 12 / 2 | Vận sức 1 lượt |
| Hỏa tức quét thành | 130% MAG Hỏa, toàn đội | 14 / 2 | Vận sức 1 lượt |
| Vảy thép nghiền nát | 85% ATK Thường × 2, đơn | 8 | Phản công vẫn tối đa 1 lần/vòng |
| Hỏa cầu bạo liệt | 180% MAG Hỏa, đơn | 12 / 2 | Vận sức và báo mục tiêu |
| Bạch hỏa liên hoàn | 65% MAG Hỏa × 2, toàn đội | 16 / 1 | Hệ số lửa phase 3 áp dụng từng hit |
| Tâm diệt thành | 220% MAG Hỏa, toàn đội | 22 / 3 | Vận sức; chuẩn bị Kìm hãm, khiên và kháng phép |

Vận sức tiêu một slot hành động, chưa gây sát thương và chưa trừ MP. Lượt boss vòng sau giải phóng chiêu, chiếm một slot; phase 3 vẫn chỉ có tổng hai slot, không thêm move thứ ba. Mọi đồng đội có cơ hội hành động giữa hai lượt boss. Cooldown/MP tính lúc giải phóng; nếu không đủ MP hoặc chiêu còn hồi, thay bằng Nanh đen. Giới hạn một chiêu `bossHeavy` trong mỗi lượt. Khiêu khích/cover mới có thể đổi người thực nhận một đòn đơn đã báo; mục tiêu đã gục được chọn lại từ người hợp lệ.

## Cấu trúc và kiểm tra

Metadata nằm trong `data/enemies.json` dưới `boss`: `type`, `phases` (`name`, `atHpRatio`, `actionsPerTurn`, `rotation`), `suppression` (`statusId`, `maxStacks`, `durations`, `fireMultipliers`). Chiêu nằm trong `abilities.json`, status nằm trong `statuses.json`. Validator kiểm tra tham chiếu, ngưỡng giảm dần, số slot, đòn dự phòng miễn phí và encounter đơn boss.

Battle state thêm `bossState` (phase, rotationStep, pendingMoves); không có schema save mới và không lưu trận vào campaign. Mỗi lần Đánh lại khởi tạo lại toàn bộ state. UI hiện phase, stack/thời hạn Kìm hãm, hệ số lửa, mốc HP và chiêu đang vận sức.

Kiểm thử gồm chuyển phase trực tiếp, hàng hành động chung sau chuyển phase, MP không hồi sinh người chết, phản công hủy move hai, Kìm hãm theo hành động thay vì hit và một trận thắng bằng đội starter có Arthur kiểm soát Ogre’s Bane/bốn gear ATK +3. Chỉ số là cấu hình thử nghiệm; kiểm tra headless không thay thế đánh giá cân bằng rộng hoặc kiểm tra bố cục trong trình duyệt.
