# Mori / Sandra / Tywin — cấu hình hiện hành

Cập nhật03/11/2026. Ba nhân vật chính thức trong pool thường; save chưa sở hữu vẫn khóa. Dùng asset vai trò chung, không có background riêng. Số dưới đây là stat thô và Rank1.

| Nhân vật | HP | MP | ATK | MAG | DEF | RES | SPD |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Mori |175|70|30|10|17|16|32|
| Sandra |155|130|10|34|15|27|18|
| Tywin |180|65|33|12|18|18|25|

## Mori — vật lí Lôi

Nội tại chuyển25% SPD căn bản thành ATK căn bản, cap25 tại100SPD. Gear và phân bổ được tính, buff SPD% không tính. Adapter stat_conversion có cap; không thay đường Mandred cũ.

- Nhất Trảm — Rạch Sấm:8MP,200%ATK, giảm20%DEF trong2 lượt chính.
- Lôi Kiếm Vô Câu:24MP/CD3, Hộ Ấn cả đội, tự tăng40%ATK trong2 lượt chính, nhận Lượt Thêm.
- Vạn Lý Lôi Vũ:20MP/CD3,280%ATK diện rộng, giảm15%SPD trong2 lượt chính và xóa2 buff mỗi địch.

Dùng tự buff ởR1: hết sau lượt chínhR3, R4 downtime, dùng lạiR5. Lượt Phụ không trừ thời hạn buff main_turn hoặc CD.

## Sandra — Thuật Sư Thổ

Nội tại tăng30% sát thương lên mục tiêu không có buff, xét từng hit; khiên/status bất lợi riêng không tính là buff.

- Sắc Lệnh — Cấm Viện Dẫn:24MP/CD6, xóa hết buff rồi cấp2 Phong Ấn mỗi địch.
- Địa Thư — Phán Quyết Cuối:22MP/CD2,280%MAG diện rộng; không thêm debuff.
- Điều Khoản — Nhiễu Ma Lực:14MP, khôngCD,150%MAG diện rộng, cấp1 Nhiễu Ma Lực mỗi địch.

Sắc Lệnh dùng presentation edict_interdict: một sách lệnh trên đội hình đích và một dấu phong ấn trên mỗi mục tiêu, kể cả khi không có buff để xóa. Cả hai **chỉ là VFX thi triển**, tự gỡ sau timeline; debuff Phong Ấn còn nguyên số lần. Không đổi background hoặc combatMode.

Phong Ấn là status reusable buff_seal, không độc quyền Sandra. effect.charges cấp số lần riêng, tái cấp làm mới, không cộng dồn hoặc tăng theo Rank. Nhanh/reduced motion dùng timeline chung; targetIds/actor ID giữ đúng hai phe Arena.

## Tywin — vật lí Thủy

Nội tại Tĩnh Tâm Như Thủy tăng20%RES.

- Thủy Kiếm — Thương Lưu:8MP,180%ATK, Vết Thương Sâu2 lượt chính.
- Tẩy Trần Song Ảnh:10MP/CD2, giải debuff cho bản thân và đúng một đồng đội khác còn sống, không hồiHP.
- Nhất Kiếm — Thủy Nguyệt:16MP/CD2,350%ATK, Hội Tâm riêng đòn này; không cấp buff Hội Tâm lâu dài.

## Rank và kiểm tra

Damage tăng10% tương đối/Rank; buff ATK Mori tăng5% tương đối/Rank. Debuff, dispel, charges và Lượt Thêm giữ nguyên. AI dùng forecast chung/profile riêng. Test: test/mori-sandra-tywin.test.js, test/recipient-statuses.test.js, e2e/mori-sandra-tywin.spec.ts (gồm VFX đã gỡ nhưng status còn2 lần).
