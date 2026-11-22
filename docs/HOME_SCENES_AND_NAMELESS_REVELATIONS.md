# Cảnh nền màn hình chờ và Hé Lộ Bài Ca Vô Danh

Cập nhật 22/11/2026. Phạm vi màn hình chờ là `/home`; màn chọn hồ sơ lúc khởi động giữ nền mặc định vì chưa chọn hành trình.

## Cảnh nền theo hồ sơ

`src/core/home-scenes.js` là catalog và điều kiện mở khóa dùng chung. Hồ sơ lưu `homeScene`, không lưu bản sao background, BGM hay danh sách unlock. Quán Trọ Phương Bắc luôn có; Bến Cảng Không Chào Đón cần first clear **toàn màn** `east_ke_02`; Chuông Đền Vang Giữa Vực Sâu cần first clear toàn màn `east_ke_05`. Chỉ có tiến độ một wave chưa mở cảnh. Save đã hoàn thành trước bản này tự thấy cảnh mở.

Bấm hồ sơ → Đổi cảnh nền và nhạc → chọn preview → Áp dụng. Cảnh khóa ghi đúng nhiệm vụ, không cho chọn. Thay cảnh chỉ được công bố sau khi lưu thành công. Một lựa chọn thay đồng thời SVG và BGM; quay lại menu giữ track/vị trí đang phát, sang chiến đấu hoặc Shop không phát nhạc chồng. Cả hai BGM lặp theo cơ chế sẵn có, tôn trọng cài đặt âm lượng, tắt tiếng và tab ẩn.

- `east_town`: `/art/home-east-town.svg`, nhóm `home_east_town`, track người dùng `/bgm/bgm_east_town.mp3`. Phố gỗ, bến nước và đèn chiều theo hai ảnh tham chiếu.
- `keijo_shrine`: `/art/home-keijo-shrine.svg`, nhóm `home_shrine`, track `/bgm/bgm_shrine.mp3`. Torii son, bậc đá, điện thờ Keijo và rừng núi theo ảnh tham chiếu.
- `tavern`: giữ SVG và nhạc Quán Trọ cũ.

Save thiếu trường mới mặc định tavern; ID lạ bị từ chối; cảnh đã lưu nhưng không đủ điều kiện hiển thị tavern. Không đổi version7, legacy namespace hoặc thư mục AppData. Split save phân trường vào `account`; cơ chế extensions cũ vẫn đọc an toàn. Không ghi vào save thật khi test.

UI dùng bảng chọn ba preview, một cột trên mobile, nút chọn/áp dụng dùng hệ thống Modal/focus/gamepad có sẵn. Noto Serif và tông vàng/navy JRPG giữ từ sản phẩm; không đổi hệ thống giao diện toàn game theo phong cách dashboard. Background là SVG gốc, không sử dụng ảnh tham chiếu làm bitmap được sao chép. Không thêm người vào hình.

## Filter Nguyệt Quang

Dropdown nhân vật bỏ lựa chọn hệ Nguyệt, thay bằng `element=moonlight` / **Nguyệt Quang Chúc Phúc**. Kết quả gồm người cấp Chúc Phúc, Luna cấp quyền toàn bộ, người có nội tại trực tiếp liên quan Chúc Phúc (như Aisha) và người đã được phát hành Hé Lộ, dù chưa mua/bật Hé Lộ. URL cũ `element=moon` được hiểu cùng nhóm để giữ liên kết đã lưu. Không xóa hệ damage Nguyệt khỏi engine, điểm yếu, tooltip hoặc quest. Sở hữu, tìm kiếm, vai trò và sort vẫn kết hợp bình thường.

## Elsavetta

Mỗi hành động thành công vẫn cấp buff ATK căn bản Quang/Ám như cũ. Riêng hồi3%MP toàn đội tối đa **3 lần mỗi vòng chung**, chia sẻ giữa Main/Extra và các Liên kích. Không tính theo số mục tiêu/hit/debuff. Quota riêng từng đơn vị/phe, reserve trước hồi MP, reset khi round đổi; qua phase cùng vòng không reset. Đủ MP vẫn dùng một lần kích, như các proc MP theo vòng hiện hữu. Dùng `lampkeeperMpState` trên battle actor; không lưu quota vào campaign.

## Ba Nguyệt Quang Hé Lộ

Giữ giá30 Pure Prisma, mở một lần, bật/tắt miễn phí ngoài chuyến/trận; không cấp quyền gọi Chúc Phúc. Chỉ hoạt động khi **Bài Ca Vô Danh cùng phe** đang tồn tại. Mọi nguồn sát thương của ba người nhận thêm Nguyệt, gồm đánh thường/phản công; không thay hệ gốc.

- Gahallad: Vạn vó chôn quân trúng đòn gây Rạn Khiên3 lượt chính mục tiêu.
- Yumia: phản công giữ Hội Tâm và quota1/vòng, đạt ít nhất hệ số tương đương **đòn gốc420% × hệ số R5M3** trong PvE; PvP vẫn chỉ dùng đến Rank5 theo quy tắc chung. Không nhân hai lần Rank/Trấn; Trấn mạnh hơn mức sàn không bị giảm. Phản công trúng gây Vết Thương Sâu3 lượt chính. Không nâng những kỹ năng chủ động khác và không mở Thông Thạo cho chiêu cố định trong dữ liệu.
- Chelsea: +ATK căn bản bằng25% SPD căn bản, tối đa25 ở100 SPD. Có tính trang bị/flat base SPD, không tính buff SPD%. Giao Tận Tay đánh thêm **một hit280%ATK Quang–Nguyệt**, cố định không tăng theo Rank, cùng hành động/cùng context nên không tiêu thêm Sơ Hở. Dấu Niêm không nhận hit bổ sung. Hết Chúc Phúc/tắt Hé Lộ thì mất phần tăng mới; không ảnh hưởng nguồn gốc.

Trạng thái Rạn Khiên/Vết Thương Sâu đi qua đường on-hit chung: né hoặc Hộ Ấn có thể chặn theo quy tắc status. Thời hạn main_turn của mục tiêu, bỏ lượt do Choáng vẫn giảm, Extra không giảm. Không tự gắn Sơ Hở hoặc cấp thêm lượt ngoài đặc tả.

## Vong hồn Drageshelmfjall

Đã sửa đường trừ HP tối đa: với group `agony` có cấu hình Oán Hận, sát thương mang Nguyệt ở hệ chính **hoặc phụ** luôn trừ thẳng maxHP, bỏ phần hấp thụ khiên, kể cả khi chưa hóa Oán Hận. HP hiện tại chỉ bị kẹp về maxHP mới nếu vượt. MaxHP về0 mới chết hẳn. Vẫn tính DEF/RES, điểm yếu, kháng và giảm sát thương; nếu đang Oán Hận vẫn hưởng giảm30% như cũ. Không biến thành true damage.

Đòn không mang Nguyệt giữ luật cũ: HP/khiên bình thường trước Oán Hận, HP0 kích trạng thái rồi các hit sau bào maxHP. Người/quái ngoài group không nhận quy tắc đặc biệt này. DoT cũng chuyển đúng route khi thực sự mang Nguyệt. Log/event maxHpDamage và quan sát sát thương HP+khiên dùng cùng một kết quả; không báo hạ địch hai lần.

Nguồn kiểm thử: `test/home-scenes.test.js`, `test/nameless-revelations.test.js`, `test/agony.test.js`, `test/lampkeepers.test.js`, `test/game-music.test.js`, native save tests và `e2e/home-scenes.spec.ts`.

Nghiệm thu: 2.014/2.014 kiểm thử engine; 14/14 kiểm thử Rust/native; 3/3 Playwright; validate, typecheck, diff-check đạt. Đã build thành công EXE và bộ cài Windows. Browser inspector modal: 0 FAIL sau khi giữ các quy tắc của overlay/nút JRPG có sẵn; warning font trên bản HTML chụp riêng được kiểm tra lại trên app thật, font Noto đã tải.
