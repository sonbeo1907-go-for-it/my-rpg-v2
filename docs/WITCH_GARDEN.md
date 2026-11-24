# Khu Vườn Phù Thủy — Nicole / Maria

Triển khai 24/11/2026. Nicole #126, Maria #127 là nhân vật chính thức trong gacha thường và roster rate-up kể từ ngày này; phe Khu Vườn Phù Thủy. Không tạo Trấn hoặc Thông Thạo chưa được thiết kế. Hai người đều cấp quyền gọi **Nguyệt Nhật Hỗn Mang**; Aisha và nhân vật chỉ hỗ trợ không tự có quyền.

## Luna — cân bằng riêng

Nội tại tăng sát thương Nguyệt trước khuếch đại: **10% → 8%**. Trường của mode tăng sát thương Nguyệt nhận vào: **30% → 12%**. Không đổi giảm ATK/MAG địch20%, thời hạn, kỹ năng hoặc Rank. Báo cáo SEED_BALANCE_2026_11_24 là ảnh chụp trước bản giảm Luna này; script khi dùng dữ liệu hiện tại sẽ cho số khác.

## Nicole — Phù Thủy Vườn Cổ Tích

Thuật Sư Thủy, HP150/MP180/ATK8/MAG36/DEF15/RES22/SPD20. Sống gần nghìn năm ở Drageshelmfjall, mất niềm tin vào con người nhưng giữ một chút hy vọng.

Nội tại Cổ Tích Chưa Khép Lại: khi Nguyệt Nhật Hỗn Mang hoạt động, sát thương cô mang thêm Nguyệt; MAG nguồn Chúc Phúc ×1,25 và hiệu lệnh nhận amp pha trăng đúng một lần. Đây là hào quang cần Nicole còn sống; gục không xóa Chúc Phúc nhưng mất hai bonus. Nhiều Nicole cùng phe không cộng dồn. Runtime switch explicit vẫn có quyền ghi đè amp khi dùng cho kịch bản kỹ thuật.

| Kỹ năng | Chi phí/CD | Trăng Tàn, Trăng Lên hoặc chưa có Chúc Phúc | Trăng Tròn |
| --- | --- | --- | --- |
| Dưới Mái Vòm Cổ Tích |15MP/CD1| Khiên120% MAG toàn đội; +25% DEF/RES3 lượt chính | Cùng khiên; địch chọn nhận2 Sơ Hở Hỏa, −35% RES3 lượt chính |
| Nét Mực Còn Hy Vọng |15MP/CD1| Đánh Thủy120% MAG một địch; đồng đội Thủy/Hỏa +45% MAG3 lượt chính | Cùng đòn; địch chọn nhận2 Sơ Hở Hỏa; **chọn riêng một đồng đội** nhận Khai Phá Điểm Yếu3 lượt chính |
| Xin Kể Thêm Một Lần |40MP/CD3| Giải toàn bộ debuff, hồi30% HP tối đa/30% MP tối đa, kéo dài buff còn thời hạn1 lượt | Như bình thường |

Riêng hồi phục ở **Trăng Tàn đang hoạt động**: HP/MP thành60%, kéo dài2 lượt. Không nhân đôi chỉ vì chưa có Chúc Phúc. Heal qua hệ giảm hồi/nợ HP/gear bình thường; lượng MP không tăng theo Rank. Heal và khiên +10% mỗi Rank; stat buff +5%; utility không tăng. Khi chọn sai/đã gục người nhận thứ hai, từ chối trước mọi chi phí và effect. AI và forecast dùng cùng command allyTargetId; không đoán người nhận hộ người chơi. Có thể chọn bản thân.

Kéo dài buff không thêm charge, không kéo dài Hộ Ấn, buff theo số đòn, status persistent, mode, Sân Khấu, Chúc Phúc hoặc đồng hồ Trăng Tàn của Maria. Với status đếm vòng, dịch cả remaining và deadline; đồng hồ lượt chính/mọi lượt giữ loại gốc. Không hồi sinh người gục. Phong Ấn chặn buff riêng; Hộ Ấn chặn từng debuff theo engine.

VFX riêng: sách cổ tích mở, vòng trăng và nét mực ở ô Nicole; không đổi nền/BGM. Mỗi lần cast một glyph, số damage/heal vẫn theo event thật; reduced-motion giữ hình tĩnh, không RNG trong renderer.

## Maria — Phù Thủy Của Tội Lỗi

DPS phép Hỏa, HP130/MP240/ATK8/MAG32/DEF16/RES26/SPD14. Tội lỗi dày vò, mất lý trí và niềm tin vào cuộc sống.

Nội tại Tội Lỗi Dưới Trăng Tròn: khi Chúc Phúc hoạt động, mọi damage Maria có thêm Nguyệt. Trong Trăng Tròn: **+28 MAG căn bản**, mọi kỹ năng trả MP×2. Hai vòng Full đều hưởng; main/extra, Choáng, nhiều hit không đổi pha. Đánh thường/Phòng Thủ MP0 vẫn0; giảm MP của đội và Nhiễu Ma Lực vẫn áp dụng, giá chốt trước damage. Căn bản +28 trước buff phần trăm; không sửa prepared stats.

| Kỹ năng | Hiệu quả Rank1 | Chi phí/CD |
| --- | --- | --- |
| Vết Cháy Không Phai | Một địch200% MAG Hỏa; bản thân nhận Lượt Thêm |15MP/CD2|
| Tro Tàn Của Lời Nguyện | +50% MAG đến hết Trăng Tàn; mỗi lần +30% MP tối đa, max3 tầng đến hết trận |15MP/CD2|
| Xin Thiêu Hết Tội Lỗi Này | Một địch450% MAG Hỏa; ra lệnh Chúc Phúc400% MAG cùng địch |60MP/CD0, chỉ Trăng Tròn|

Full Moon burst có giá gốc **120MP**, trước các điều chỉnh. Hai nguồn damage riêng: đòn cá nhân và phép Hỏa–Nguyệt của Chúc Phúc. Rank tăng cả hai hệ số; Chúc Phúc lấy MAG động của nguồn, không lấy MAG riêng người ra lệnh. Thiếu MP/pha sai không tiêu phí. Nếu đòn cá nhân đã hạ địch, bỏ command còn lại; không đổi target. Một Sơ Hở mỗi nguồn hành động theo contract hiện hành.

### Đồng hồ Tro Tàn

- Chu kỳ đã sửa: Trăng Lên (R) → Trăng Tròn (R+1, R+2) → Trăng Tàn (R+3). Dùng trong bất kỳ pha nào của Chúc Phúc đang tồn tại: buff50% MAG giữ đến hết Trăng Tàn của **chính chu kỳ đó**, gồm Vòng Phụ. Chưa có Chúc Phúc: chờ hết Trăng Tàn của lần gọi kế tiếp. Không gỡ buff khi vừa vào Full hoặc vừa vào Waning.
- Runtime status ghi waningCycleStart của chu kỳ đang tồn tại ngay khi cấp; khi kích hoạt cycle mới, bind những buff đang chờ vào startedRound. Chỉ expire ở cuối đúng Waning, sau mọi hành động/pulse hợp lệ. Choáng không giữ buff; Extra không tick hoặc kết thúc sớm.
- Buff MAG và buff MP là hai status bình thường có thể bị dispel/Phong Ấn chặn riêng. Dùng lại refresh MAG, cộng tầng MP tối đa3; **không tự hồi MP**. Rank tăng hai stat buff theo5%, không tăng +28 nội tại, thời hạn hoặc số tầng.
- Kết thúc trận/trận độc lập: không mang status sang. Wave/phòng cùng dungeon và boss phase giữ marker/chỉ số stack theo carry chung; không khởi tạo deadline mới. Chronicle combat độc lập vẫn chỉ mang HP/MP. Forecast clone không đổi live, Arena tách hai phe và cap Rank5, không Thông Thạo.

## Bản đồ triển khai và nghiệm thu

witch-cycle.js chọn nhánh trước cast, xử lý mục tiêu phụ/đồng hồ Waning/extension. resolveBattleAbility được engine, UI và AI dùng; skill resolver Rank chung còn dùng ở preview tĩnh. Dữ liệu nhánh Full là ability ẩn cùng skillLineId, không mở thêm nút hoặc nguồn nâng Rank. Giữ dữ liệu PvE gốc trong PvP snapshot.

test/nicole.test.js: quyền, phase, hai mục tiêu, bị từ chối trước phí, Rank, hồi phục, modifier/cycle thật, forecast, Arena. test/maria.test.js: giá120MP, ngoài Full khóa, +28 căn bản, Rank hai nguồn, ngắt khi target gục, Lượt Thêm, buff hết khi Choáng, carry, mirror. e2e/witch-garden.spec.ts kiểm tra copy, UI hai mục tiêu, ba kích thước, VFX/reduced-motion. Không thử trên save AppData thật.

Nicole ở Trăng Tròn dùng thẳng con trỏ địch và đồng đội có sẵn; đã bỏ dropdown chọn đồng đội. Dòng xác nhận nêu người bị đánh và người nhận Khai Phá Điểm Yếu. Quy tắc chung cho nhân vật tương lai: [COMBAT_MENUS](COMBAT_MENUS.md).
