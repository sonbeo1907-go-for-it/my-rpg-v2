# Phyllis và Elsavetta — Người Giữ Đèn

Triển khai 22/11/2026. Hai nhân vật chính thức, dùng asset cơ bản và cùng cấp quyền Nguyệt Quang Chúc Phúc — Bài Ca Vô Danh. Không cần đi cùng Luna hoặc đi cùng nhau. Mã ra mắt #123 / #124; phe `lampkeepers` hiển thị “Người Giữ Đèn”. Có trong Chiêu Mộ thường, lịch admission rate-up từ ngày ra mắt và chỉ dẫn AI. Không thêm Trấn Phái hoặc Thông Thạo chưa được yêu cầu.

## Bối cảnh

Bài Ca Vô Danh vinh danh những Người Giữ Đèn chiến đấu và hy sinh mà tên tuổi có thể không ai biết đến. Phyllis là đội trưởng đội mười hai, người bản địa 24 tuổi, đầy tâm huyết chống ma vật phương Bắc. Elsavetta là tân binh dưới quyền anh: hậu đậu, ít kinh nghiệm, đôi lúc nhát gan nhưng là chỗ dựa đáng tin cậy. Không dùng giọng kiêu ngạo hoặc biến sự vụng về thành bất tài.

## Nhịp nội tại chung

Một **hành động** gắn thành công hoặc kéo dài ít nhất một debuff trên địch kích mỗi người một lần. Không tính theo số hit, số địch hoặc số debuff. Một Liên kích/phản công có context riêng là một hành động khác. Làm mới debuff đã có được tính; Hộ Ấn chặn toàn bộ thì không. Phyllis tạo tầng và buff ATK Elsavetta không có giới hạn theo vòng; từ22/11/2026 riêng hồiMP Elsavetta tối đa3 lần/vòng chung. Không cần Chúc Phúc hoạt động để nhận tầng/MP.

Dấu chống lặp nằm trong context tạm thời của hành động, được giữ bằng WeakMap, không đưa vào save, không dùng chung với forecast. Reserve trước khi cấp buff/hồi MP để không tự kích ngược. Đối tượng phải còn sống và là địch tương đối với người có nội tại; người có nội tại phải còn sống. Khi Bài Ca hoạt động, sát thương của cả hai mang thêm Nguyệt.

## Phyllis

HP170 / MP120 / ATK36 / MAG9 / DEF22 / RES16 / SPD18. DPS vật lí Ám.

- Mũi Kích Mở Đường: 5MP, CD1. 40% ATK toàn địch; hai debuff riêng: −20% DEF và −20% ATK/MAG trong 3 lượt chính; tự +35% ATK trong 3 lượt chính.
- Ánh Đèn Xé Sương: 8MP, CD1. 40% ATK toàn địch; −20% SPD trong 3 lượt chính, 2 Sơ Hở Ám và Lượt Thêm cho bản thân.
- Cho Những Tên Chưa Khắc: 10MP, CD1. 2×220% ATK toàn địch. Nếu Bài Ca đang hoạt động, tiêu toàn bộ 1–3 Dấu Canh Gác; mỗi tầng gọi một đòn 120% ATK Chúc Phúc toàn địch. Cuối chiêu kéo dài debuff còn thời hạn trên toàn địch thêm 2 lượt.
- Nội tại: mỗi hành động hợp lệ tạo 1 Dấu Canh Gác, tối đa3. Vì kéo dài chạy sau hiệu lệnh, chiêu cuối có thể tạo lại 1 tầng sau khi đã tiêu hết. Chúc Phúc không hoạt động: giữ tầng; đòn cá nhân và kéo dài vẫn chạy.

Phần cá nhân và hiệu lệnh là hai nguồn/hành động sát thương: mỗi nguồn tiêu riêng một Sơ Hở Ám mỗi địch. **Toàn bộ chuỗi hiệu lệnh** dùng một context, chỉ tiêu một tầng mỗi địch, không tiêu theo từng hit. Số hit được chỉ định 1–3 thay thế quy tắc theo debuff của pulse tự động; địch chưa có debuff vẫn bị hiệu lệnh đánh. Pulse tự động giữ nguyên 0–3 hit theo debuff.

## Elsavetta

HP150 / MP120 / ATK38 / MAG9 / DEF20 / RES16 / SPD24. Hỗ trợ tấn công Quang, sát thương vật lí.

- Nội tại: mỗi hành động hợp lệ cấp +4 ATK căn bản/tầng cho đồng đội Quang/Ám còn sống, gồm bản thân, tối đa3 tầng (+12); 3 lượt chính người nhận, tầng mới làm mới thời hạn chung. Đồng thời hồi 3% MP tối đa động cho **toàn đội** còn sống, làm tròn lên theo luật MP. Đủ tầng vẫn hồi MP nếu còn quota3 lần/vòng chung; không yêu cầu hệ Quang/Ám cho phần hồi MP. Buff có thể bị Phong Ấn chặn, không hủy phần hồi MP.
- Giữ Đèn, Em Sẽ Theo: 18MP, CD3 từ cast; mode5 vòng chung, tính vòng gọi. Vào dạng đánh 120% ATK toàn địch và kéo dài debuff1 lượt. Mỗi loại debuff trên từng địch còn sống cho +8% ATK, tối đa24%, tính động; không nhân theo stack, không tăng theo Rank. Đầu các vòng sau: 120% ATK toàn địch và ra lệnh Bài Ca **một** đòn120% ATK Chúc Phúc. Cuối mỗi vòng: 120% ATK toàn địch và khiên50% ATK toàn đội. Không có Bài Ca: bỏ hiệu lệnh, giữ đòn bản thân.
- Soi Tỏ Kẽ Nứt: 10MP, CD1. 120% ATK toàn địch; −20% DEF và Rạn Khiên trong4 lượt chính; xóa1 buff mỗi địch.
- Chớ Để Đêm Nuốt Mất: 10MP, CD1. 120% ATK toàn địch; −5 ATK/MAG **căn bản** trong4 lượt chính và1 Phong Ấn. Giảm căn bản giữ nguyên theo Rank.

Mode dùng hiển thị tiêu chuẩn trên ô nhân vật, không đổi nền/BGM: Elsavetta không thuộc lớp Thuật Sư. Vòng thứ5 vẫn có đòn và khiên cuối vòng trước khi thoát dạng. Vòng Phụ không tạo pulse thêm. Choáng chặn hành động chủ động nhưng không tắt pulse đầu/cuối vòng; buff ATK theo lượt chính vẫn giảm khi người nhận mất lượt vì Choáng. Người nguồn gục thì mode/pulse/aura ngừng; Chúc Phúc đã gọi giữ contract riêng, không duy trì trận khi cả đội gục.

## Rank, kéo dài, carry và kiểm thử

Sát thương, hệ số hiệu lệnh opt-in và khiên tăng10%/Rank; buff ATK tự thân Phyllis tăng5%/Rank. Nội tại, debuff, số hit, số tầng, thời hạn và CD giữ nguyên. Pulse Elsavetta lấy Rank từ chiêu vào dạng, hệ số chỉ áp dụng một lần. PvP dùng cùng engine và tối đa Rank5.

`extend_debuffs` chỉ tăng thời hạn: main_turn/default tăng remaining; round tăng deadline. Bỏ hiệu ứng vô hạn, hết hạn, stack0 hoặc trên địch đã gục. Không cộng số charge Phong Ấn/Nhiễu, stack Sơ Hở, không đổi chủ nguồn hoặc potency Độc. Kéo dài debuff có sẵn không phải gắn mới nên không tiêu Hộ Ấn.

Qua phòng dungeon: actor/resource/status/mode và deadline theo adapter sẵn có, không làm mới thời lượng; encounter mới khởi tạo theo luật nội dung hiện hành. Save v7 / split save và legacy namespaces giữ nguyên. Forecast không đụng trạng thái thật.

Nguồn: src/core/lampkeeper.js, battle.js, moonlight-blessings.js, moonlight-revelation.js, skill-rules.js; data/characters, abilities, statuses, banners, pvpAiProfiles; test/lampkeepers.test.js. Kiểm thử qua executeAction và tiến vòng thật, không chỉ gọi tick helper.

## Tham chiếu bối cảnh liên quan

Bản giới thiệu dài trước khi rút gọn thẻ nhân vật (giữ nguyên lore):

- **Shashthi**: Nữ tư tế bản địa Drageshelmfjall, kế nhiệm ngôi vị thánh nữ của tín ngưỡng thờ Thần Mặt Trăng. Khi nhiều đồng bào xuống thị trấn tuyết giao thương, cô ở lại gìn giữ nghi lễ đã truyền qua nghìn năm. Dâng lời khấn để tiếp sức cho đồng đội Quang/Thổ và nuôi dưỡng Hạt Giống Bội Thu.
- **Flynn**: High Elf xuất thân quý tộc phương Bắc, đã sống ở thị trấn dưới núi tuyết suốt vài trăm năm. Thành viên cấp cao của Người Giữ Đèn, dùng cây kích gắn một ngọn đèn nhỏ; chiếc đèn bên người đã rỉ sét theo năm tháng. Anh thường lặng lẽ chăm sóc mộ những đồng đội đã ngã xuống.
- **Bianca Valmont**: Chị của Seraphine Valmont, rời thủ đô đến thị trấn dưới núi tuyết để buôn bán, tránh con đường săn quái của gia đình. Sau lời chào ngọt ngào là những toan tính khéo léo; cô dần lấy lòng người bản địa.

Kiểm chứng bản triển khai: 2.001/2.001 kiểm thử engine/regression đạt; validate, typecheck và diff-check đạt; 2 bài Playwright đạt, có ảnh desktop/tablet/mobile. Dữ liệu và mô tả dùng cùng bản frontend đóng gói.

### Nghiệm thu số hit hiệu lệnh — 22/11/2026

Đã kiểm tra lại cảnh báo moonlightTargetHits ưu tiên debuffHits: đường gọi moonlightPulse hiện ưu tiên options.hits trước khi gọi helper này. Elsa truyền hits=1; Phyllis truyền số tầng đã tiêu. Hai regression mới dùng ba địch có 0/1/5 debuff: hiệu lệnh Phyllis đúng 1/2/3 hit tương ứng tầng tiêu; hiệu lệnh Elsa đúng 1 hit mỗi địch, trong khi pulse tự động cùng vòng vẫn là 0/1/3 hit. 55 kiểm thử liên quan đạt. Không cần đổi runtime hoặc build lại EXE cho lần nghiệm thu này.
