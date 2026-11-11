# Geoffrey, Anabel và bản sửa Remulia — 11/11/2026

Yêu cầu người dùng là nguồn thiết kế. ID mới: Geoffrey `geoffrey`/release105; Anabel `anabel`/release106. Cả hai dùng asset vai trò/kỹ năng chung, vào pool Chiêu Mộ thường ngay; tham gia lịch rate-up từ12/11 để không viết lại lịch cũ. Không có Trấn riêng hoặc Thông Thạo trong bản này.

## Geoffrey — Vương Thuẫn Hoàng Gia

Thủ Hộ hệ Thổ, `capital_knights`, tag danh xưng riêng `royal_knight`.

Chỉ số thô Lv1: HP280 / MP90 / ATK20 / MAG8 / DEF30 / RES30 / SPD15.

Nội tại **Vương Thành Bất Động**: Geoffrey còn sống thì cả đội, gồm chính anh, +35% DEF/RES. Là hào quang native, không phải buff status; không thể xóa và không bị Phong Ấn. Geoffrey gục: tắt ngay; hồi sinh: hoạt động lại. Nhiều nguồn cùng `team_stat_aura` lấy giá trị lớn nhất cho từng chỉ số. Hào quang cộng vào nhóm phần trăm chỉ số, không nhân thêm một lớp và không cộng vào chỉ số căn bản.

| Kỹ năng | MP/CD | Rank1 |
| --- | --- | --- |
| Vương Thuẫn — Giữ Vững Hàng Quân | 10/0 | Khiên cả đội150% DEF; bản thân Khiêu Khích3 lượt chính |
| Quân Lệnh — Hạ Vũ Khí | 10/0 | 120% ATK Thổ toàn địch, giảm25% ATK/MAG trong3 lượt chính của người nhận |
| Thành Trì Trước Ngai Vàng | 18/1 | Khiên bản thân350% DEF; Che chắn toàn đội3 lượt chính |

Che chắn tái dùng Brant: `cover/coverTeam/coverArea/coverReactions` và giảm15% sát thương nhận. Gắn lên Geoffrey; đồng đội hành động không bào thời gian, Geoffrey bị Choáng ở main vẫn bào, extra không bào. Không chuyển đòn qua nhiều người chắn. Khiên là lượng riêng, không mặc định hết cùng trạng thái Che chắn, không cộng dồn khi cấp lại; chỉ thay nếu mạnh hơn.

Rank1 DEF sau native40,5: khiên đội61, khiên cá nhân142 theo rounding chung. Khiên tăng10%/Rank; đòn AoE tăng10%/Rank; debuff giữ25%. Native35% không tăng theo Rank.

## Anabel — Trưởng Đoàn Viễn Chinh

DPS vật lí hệ Quang, `expedition_corps`, tag riêng `expedition_commander`. Ngang cấp Roland, cấp trên các đội trưởng, dưới quyền Belochkin. Không tái dùng tag danh xưng riêng `order_captain` của Roland.

Chỉ số thô Lv1: HP180 / MP95 / ATK35 / MAG8 / DEF22 / RES18 / SPD18. Native cộng15 ATK căn bản, nên khi không có trang bị/buff, ATK thực là50; không ghi sẵn50 vào template rồi cộng lần nữa.

**Uy Danh Tổng Chỉ Huy**: mỗi loại buff đang hiệu lực +10% sát thương và xuyên10% DEF, tối đa30% mỗi hiệu quả. Đếm loại status, không đếm số tầng. Khiên, hào quang và combatMode không tự tính là buff. Native damage bonus nằm ở nhóm bonus nội tại hiện có, tách khỏi quy tắc buff khuếch đại chỉ lấy lớn nhất; xuyên DEF cộng với nguồn xuyên khác và chịu trần100%.

| Kỹ năng | MP/CD | Rank1 |
| --- | --- | --- |
| Quân Lệnh — Ánh Dương Dẫn Lối | 14/3 | +50% ATK bản thân5 lượt chính |
| Tiên Phong — Trảm Quang | 6/0 | 180% ATK một địch; địch còn sống thì tái kích cùng chiêu |
| Phán Quyết — Bình Minh Viễn Chinh | 20/3 | 600% ATK một địch; địch còn sống thì tái kích cùng chiêu |

14MP cho tự buff là cấu hình playtest vì yêu cầu chưa chỉ định chi phí. Buff tăng5% tương đối/Rank, sát thương10%/Rank. Không nâng lượng15 ATK hay cap30% từ Rank.

Buff tự cấp không mất lượt ngay khi cast: sau ba lượt chính tiếp theo còn2 lượt; đầu vòng kế đó CD đã0. Vòng Phụ không trừ buff hoặc CD. Refresh về5, không cộng thời gian.

## Cơ chế tái sử dụng và vòng đời

- `team_stat_aura.modifiers`: preview giải theo đội hình; trong trận đồng bộ theo nguồn còn sống, tách theo team. `baseStats` giữ nền chưa nhân để không nhân35% hai lần hoặc giữ hào quang sau KO. `stat`, đường hit trực tiếp và `checkOutcome` cùng cập nhật trạng thái.
- `self_buff_offense`: `baseStatBonuses`, `damagePerBuff`, `penetrationPerBuff`, `cap`. Engine và tooltip dùng cùng helper; không suy ra từ tên nhân vật.
- `survivingTargetRepeat: {perRound:1}`: chỉ hợp lệ trên kỹ năng chủ động đơn mục tiêu, toàn effect là damage. Đây là **tái kích riêng từ chính kỹ năng**, theo yêu cầu Anabel, không nới `canTriggerFollowUp` của các nội tại kích từ đồng đội.
- Hạn mức riêng cho mỗi kỹ năng, theo actorID/vòng. Main và Extra dùng chung. Hai chiêu có thể mỗi chiêu tái kích một lần trong cùng vòng. Không trả thêmMP, không ghi thêmCD, không sinh lượt chủ động mới hoặc kích lặp lại chính nó.
- Mục tiêu chính và người thi triển phải còn sống sau đòn gốc. Không chuyển sang mục tiêu khác nếu địch gục. Nếu đòn gốc bị né mà địch vẫn sống, vẫn thử tái kích. Che chắn dùng pipeline chuẩn cho từng đòn.
- Kết toán charge khuếch đại của đòn gốc trước khi tạo context tái kích; buff còn lượt cuối vẫn hưởng cho cả hai đòn, chỉ tick thời hạn sau tái kích. Native/gear phản ứng vẫn dùng guard chung; trong PvP tái kích chịu cap FuA và hạn mức automatic.
- Choáng/thiếuMP/sai target không tạo tái kích hay chiếm quota. Forecast chạy trên clone, không chiếm quota/MP của trận thật. Không reset quota lúc đổi phase hay giữa main/extra; trận mới tạo actor state mới, carry dùng adapter của nội dung.

## Remulia

Dạo Khúc cấp hai buff timed độc lập: `remulia_prelude` (+MAG) và `weakness_exploitation` (×2 điểm yếu), cùng4 lượt chính. Bỏ `linkedStatuses` trong định nghĩa status vì engine chỉ hỗ trợ link instance qua effect toggle, không đọc link định nghĩa đó. Không mở rộng schema liên kết chỉ để vá trường hợp này.

Đã kiểm thử buff thực sự áp×2; bốn lượt chính tiếp theo hết về×1,5; extra không bào; main bị Choáng vẫn bào; tái dùng refresh4, không cộng dồn thời gian. Khai Phá là buff thường, có thể bị xóa/Phong Ấn theo luật chung.

Mốc Khúc Ca mới: thắng đủ3 màn nhận Remulia; từng màn8+ điểm mở1 ô gear; một màn16+ điểm mở công thức Trấn.22+ vẫn thưởng30 Pure nếu còn đủ hạn mức chung trong ngày. Ledger/receipt cũ được xét lại khi load/claim, không thu hồi phần đã nhận và không cấp trùng slot. Xem REMULIA.md.

## Nghiệm thu

`test/geoffrey-anabel.test.js`: dữ liệu, base+15 không cộng hai lần, aura/KO/PvP, shield/Che chắn, damage/penetration thực, hai quota riêng, MP/CD, targetKO, forecast và buff cuối lượt. `test/remulia-regression.test.js`: các clock thật và mốc7/8/15/16/22. `e2e/knights-remulia.spec.ts`: card/tooltip responsive và mốc thưởng mới. Không sửa dữ liệu AppData thật.

## VFX Anabel — cập nhật 11/11/2026

Đánh thường dùng anabel_slash: vệt chém ánh vàng mảnh. Trảm Quang dùng anabel_cleave: nét dày và phạm vi lớn hơn. Quân Lệnh dùng anabel_command: hào quang/cương huy vàng ở chính ô Anabel, không ghi đè nền.

Bình Minh Viễn Chinh dùng anabel_dawn: kiếm nghi lễ vàng dựng bằng SVG riêng (lưỡi dài, họa tiết khắc, chuôi và chắn tay uốn), lao từ trên xuống mục tiêu thật nhận đòn. Hào quang và vòng chạm vàng được dọn cùng timeline. Nếu bị Che Chắn, VFX theo người chắn, không ghim vào người được chọn ban đầu. Đòn né vẫn có nhịp kiếm và hiện Né; không dựng số damage giả.

presentationFollowUpDelayMs=250 chỉ điều khiển trình bày: cue Liên kích bắt đầu cách impact trước đó 250ms, giữ cả tốc độ nhanh. Không thêm sleep hoặc thao tác gameplay vào core. Sword signature bắt đầu trước impact; anabelHitDelay là thời gian rơi đến chạm (220ms thường,100ms nhanh), được dùng chung với CSS và số damage. Reduced motion bỏ thời gian chờ/chuyển động, giữ phản hồi tĩnh. Không đổi MP, CD, quota hoặc thứ tự lượt.

Kiểm thử: test/anabel-vfx.test.js khóa timing chính xác, đồng bộ chạm/damage, target sau Che Chắn, reduced motion và pure presentation. e2e/anabel-vfx.spec.ts kiểm tra renderer/cleanup và ảnh thực trong trận; e2e/eri-chiyoko.spec.ts kiểm tra các VFX iaido đang có không bị ảnh hưởng.
