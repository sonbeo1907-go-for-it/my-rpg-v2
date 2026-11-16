# Đại Yêu Ma · hậu kỳ Thảo Phạt Phương Đông

Triển khai **15/11/2026**. Thiết kế ban đầu: [kế hoạch](EAST_GREAT_YOKAI_SUPERBOSSES_PLAN.md). Bộ số bên dưới là cấu hình playtest hiện hành, thay các số đề xuất ban đầu; không sửa chỉ số Miraebolis hay công thức tăng trưởng chung.

## Nội dung và mở khóa

Ba encounter `east_super_mountain`, `east_super_fox`, `east_super_twins`, category `east_super`, nằm cuối danh mục Phương Đông, sau 33 màn cũ. Yêu cầu đã nhận kết quả thắng **Bát Kỳ Xà — Đêm Nuốt Trời** (`east_ke_08`). Dùng `east_campaign_completed`; receipt Orochi cũ cũng hợp lệ và được phục hồi cờ lúc chuẩn hóa save, không cấp lại thưởng.

Không yêu cầu cờ Hiểm Ác cũ, không cần thắng Miraebolis. Sau mở khóa, cả ba có Lv60/70/80/90, mặc định Lv60. Kiểm tra ở core chặn cấp ngoài tập và truy cập khi chưa mở. Trước mở có dòng giải thích điều kiện trong danh sách. Trở về giữ đúng tab Phương Đông và cấp đã chọn; Miraebolis vẫn trở về Hiểm Ác.

Thưởng mỗi trận: **1.000 Coin**, không EXP hoặc tiền tệ mới. First-clear ghi một receipt chung cho encounter, chưa có thưởng/chiến tích riêng từng cấp. Không đổi version save; controller nghi thức là trạng thái trận.

## Chỉ số nền Lv1

HP dùng đường **superboss theo encounter**, scale một lần. ATK/MAG và DEF/RES vẫn dừng tăng sau Lv50 theo engine, không tự thêm tăng trưởng Super Level.

| Đơn vị | HP | MP | ATK | MAG | DEF | RES | SPD | Điểm yếu |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Daidarabotchi — Cự Quỷ Gánh Núi | 6.200 | 620 | 55 | 36 | 36 | 30 | 12 | Phong / Thủy / Hồn Kiếm |
| Tamamo-no-Mae — Cửu Vĩ Dệt Chú | 5.600 | 700 | 20 | 49 | 26 | 40 | 23 | Hỏa / Quang / Hồn Kiếm |
| Lôi Quỷ Trấn Môn | 3.400 | 380 | 53 | 28 | 33 | 28 | 20 | Thổ / Thủy / Hồn Kiếm |
| Phong Quỷ Trấn Môn | 3.200 | 420 | 30 | 48 | 28 | 34 | 22 | Hỏa / Lôi / Hồn Kiếm |

Cả bốn miễn Choáng từ người chơi. Không tự kế thừa Phong Ấn Hồn Kiếm hoặc kháng nguyên tố của boss tuyến cũ. HP nền đã tăng sau lượt đối chứng đầu vì đội Hồn Kiếm hạ cấu hình ban đầu nhanh hơn Miraebolis; Cửu Vĩ tăng hệ số nghi thức và Phong Quỷ thêm buff giảm sát thương có thể xóa để tạo áp lực thực, không chỉ kéo dài thanh máu.

## Cự Quỷ Gánh Núi

- Một actor/HP/MP/status/ô hàng lượt; `formationSpan: 3` chỉ là footprint trình bày. Desktop rộng bằng ba ô đồng đội, căn giữa; điện thoại thu theo chiều rộng có sẵn. Ba phần thân không sinh thêm mục tiêu.
- AoE một hit không thành ba hit; random, đòn lan, chia hệ số theo số địch và phản ứng tiếp tục dùng danh sách actor thật. Bấm thân chọn cùng mục tiêu; lớp status vẫn có thể mở tooltip.
- Hai giai đoạn tại 50% HP: một rồi hai hành động/lượt. Vòng chiêu Bàn Tay → Bước Chân → chuẩn bị Núi Đổ → Đá Tảng; đòn lớn đến hạn thay ô hành động, không được thêm ngoài ngân sách.
- Bàn Tay: 140% ATK Thổ đơn, miễn phí. Bước Chân: 90% ATK Thổ AoE, giảm 15% SPD hai lượt chính, 10 MP/CD1. Đá Tảng: 180% ATK Thổ đơn, vận sức một vòng, 12 MP/CD2.
- Núi Đổ: 200% ATK Thổ AoE, 24 MP/CD3. Chuẩn bị ở R, cảnh báo chính thức đầu R+1, giải phóng không sớm hơn lượt boss R+2.
- Cửa sổ Sơn Thế có ba dấu. Đòn trực tiếp trúng điểm yếu gây mất HP/khiên phá một dấu mỗi cast; phản công/Liên kích là cast riêng, nhiều hit không nhân dấu, DoT không phá.
- Một/hai dấu đã phá giảm 15%/30% sức mạnh riêng Núi Đổ. Đủ ba hủy chiêu, thay bằng Bàn Tay ở ô đến hạn; boss nhận thêm 20% sát thương trong Vỡ Thế đến hết lượt chính kế tiếp. DoT cũng hưởng Vỡ Thế nhưng không tạo dấu.
- Vỡ Thế đếm lượt chính của boss, không đếm move. Nếu phản công tạo Vỡ Thế giữa lượt boss, không hết ngay cuối lượt vừa tạo. Bỏ lượt chính vẫn trôi đồng hồ; boss vốn miễn Choáng.

## Cửu Vĩ Dệt Chú

- Hai giai đoạn tại 50% HP, một rồi hai hành động/lượt. Ô phụ chỉ dùng Hồ Hỏa, kể cả lượt giải phóng nghi thức; không ghép Bách Chú với Hương Chú hoặc rải thêm debuff cùng lượt đó.
- Hồ Hỏa: 110% MAG Ám đơn, miễn phí. Mặt Nạ: 65% MAG Ám AoE và một Phong Ấn/người, 12 MP/CD2. Sợi Chỉ: 140% MAG Ám đơn và một Nhiễu Ma Lực, 10 MP/CD2. Hương Chú: 70% MAG Ám AoE, Vết Thương Sâu và Rạn Khiên hai lượt chính, 18 MP/CD3.
- Bách Chú: **160% MAG Ám AoE**, 24 MP/CD3; cùng quy tắc đầy đủ một vòng đáp trả như Sơn Thế. Mỗi loại debuff còn hiệu lực do chính Cửu Vĩ áp trên người nhận tăng 15% sát thương vào người đó, tối đa ba loại (+45%).
- Đếm loại/source, không đếm stack, tự phạt hoặc debuff từ nguồn khác. Tính lúc damage; giải hiệu ứng trong cửa sổ làm giảm sát thương thật. Không áp debuff trong chính Bách Chú để tăng ngược sức mạnh của chiêu đó.
- Hộ Ấn, cleanse, Phong Ấn, Nhiễu Ma Lực, Vết Thương Sâu và Rạn Khiên giữ nguyên quy tắc engine. Không thêm Choáng/khóa toàn đội hoặc hút sạch MP.
- Vòng chiêu bắt đầu Hồ Hỏa miễn phí rồi Mặt Nạ → Sợi Chỉ → Hương Chú → chuẩn bị Bách Chú. Việc giải phóng không tiêu bước kế trong rotation.

## Song Quỷ Trấn Môn

- Hai actor độc lập, mỗi người một hành động/vòng khi cả hai sống. Lôi Quỷ gây vật lí; Phong Quỷ gây phép và bảo hộ. Scripted boss một giai đoạn không tạo thêm mốc chặn HP giả.
- Lôi Quỷ: Chùy Sấm 140% ATK Lôi đơn, miễn phí; Lôi Chấn 90% ATK Lôi AoE kèm Rạn Khiên hai lượt chính, 12 MP/CD2.
- Phong Quỷ: Phong Nhận 140% MAG Phong đơn, miễn phí; Màn Gió tạo khiên 180% RES cho hai boss và buff giảm 15% sát thương nhận hai lượt chính người nhận, 14 MP/CD3. Buff có thể bị xóa bình thường.
- Đầu vòng 3 cảnh báo Thiên Môn Lôi Bạo, giải phóng vòng 4; lặp chu kỳ bốn vòng. Mỗi nửa dùng đúng ô lượt của boss tương ứng: 110% ATK Lôi vật lí hoặc 110% MAG Phong phép AoE, mỗi người 16 MP.
- Đánh điểm yếu hai cast vào cùng một boss trong cửa sổ phá hai dấu Liên Kết và hủy phần của boss đó, thay bằng đòn đơn miễn phí. Phần còn lại không tự bị hủy.
- Một boss gục: hủy mọi phần phối hợp còn chờ; phần đã đánh không hoàn tác. Boss sống sót vào Độc Giữ Thiên Môn từ đầu vòng kế tiếp, hai hành động và sát thương +15%, không hồi HP/MP hay cộng hành động hồi tố.
- Cả hai cùng gục trong AoE được thắng ngay; không hồi sinh hoặc buộc hạ trong một số vòng. Chỉ phát thưởng khi cả hai gục, handler chống nhận lặp.

## Contract, dữ liệu và giao diện

- Module dữ liệu `src/core/east-superbosses.js` ghép qua hai loader Node/browser, gồm enemy, ability, status, encounter và BGM. ID nhạc riêng nhưng hiện cùng trỏ track đã có `/bgm/bt_boss_east.mp3`; chưa có nhạc mới riêng từng boss.
- `src/core/encounter-rituals.js` giữ luật nghi thức/last-stand. Pending ritual nằm trên `actor.bossState.pendingMoves`; controller song trùm ở `battle.linkedBossState`, được publish sang React. Tất cả clone được; forecast không tiêu state/RNG thật.
- `pendingFiller` là capability theo boss: khi giải phóng pending move, đóng băng rotation và lấp ô còn lại bằng đòn nhẹ đã khai. Tránh ghép hai chiêu áp lực hoặc bỏ qua bước sau trong rotation. Hai chiêu lớn cùng đến hạn được giữ lại phần chưa có chỗ, tối đa một chiêu lớn/lượt.
- Chuẩn bị tốn ô hành động, chưa trả MP/CD. Trả khi thực sự giải phóng. Không đủ MP/CD thì dùng đòn miễn phí; không âm MP. Ngắt nghi thức không thu chi phí hai lần.
- Chuyển giai đoạn hủy chuẩn bị cũ có log, không hồi đầy MP và không reset mode/CD/tài nguyên/quota của người chơi. Kết quả trận dọn controller; Đánh lại tạo state mới. Không thêm chức năng lưu trận PvE mới.
- Validator cho multi-boss theo `bossEncounter: linked_bosses`, không bỏ kiểm tra solo chung. Super Level kiểm tra capability thay vì whitelist ID. Footprint tính tổng tối đa bốn ô.
- Ba scene SVG gốc tại `public/art/yokai-{mountain,fox,twins}.svg`; Cự Quỷ còn dùng scene trong khung thân ba ô. Kỹ năng dùng bộ VFX tấn công cơ bản theo loại damage/nguyên tố của game.
- Thông tin phase và cảnh báo song trùm xếp cạnh nhau khi đủ rộng; điện thoại xếp dọc. Cảnh báo hiển thị độc lập Battle Logs, có vòng đến hạn, dấu đã phá, nguồn và hệ số debuff từng người. Số cơ chế lấy trực tiếp từ battle state.
- Xem [COMBAT_LIFECYCLE_CONTRACT](COMBAT_LIFECYCLE_CONTRACT.md) trước khi thêm nghi thức khác. Không chuyển các clock này sang hit/animation.

## Nghiệm thu

Regression: `test/east-superbosses.test.js`, gồm mở khóa/migration receipt, bốn cấp và scale, footprint, nhiều hit/cast, DoT, ngắt/giảm chiêu, phase, clone/forecast, debuff theo nguồn, song trùm/hạ cùng lúc, deadline last-stand, buff tick một lần mỗi lượt nhiều move và miễn Choáng. Bộ encounter smoke cũ được bổ sung quyền mở Đại Yêu Ma trong fixture.

Browser: `e2e/east-superbosses.spec.ts`, kiểm tra khóa, danh sách/cấp, hình thân ba ô ở 1440/768/390, hai thanh boss/cảnh báo, Bách Chú khi tắt log, Miraebolis cũ và RT Xbox cùng modal xuất chiến.

Runner đối chứng: `scripts/great-yokai-playtest.mjs`. Báo cáo hiện hành: [playtest](EAST_GREAT_YOKAI_PLAYTEST.md). Chạy bằng fixture tổng hợp, không đụng AppData. Mục tiêu khó hơn Miraebolis phải đánh giá cùng cấp/build; không suy ra chỉ từ HP hoặc tuyên bố mọi đội đều cần nhiều vòng hơn.
