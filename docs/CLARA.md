# Clara — Người Đọc Dấu Vết

Ra mắt chính thức #128, Quang, Hỗ trợ tấn công, Hội Thợ Săn. Có trong Chiêu Mộ thường và nhóm Hội Thợ Săn từ 28/11/2026; không tự tặng cho save cũ. HP165/MP100/ATK30/MAG12/DEF16/RES22/SPD22.

## Bộ kỹ năng

- **Theo Dấu Sinh Vật**: vật lí Quang, 120% ATK mục tiêu chính, 70% ATK hai ô kề; 15 MP, không CD. Không nối vòng hoặc dồn ô qua người đã gục.
- **Quan Sát Điểm Quyết Định**: bản thân và một đồng đội khác, +6% tỷ lệ Bạo Kích/+12% sát thương Bạo Kích, 2 lượt chính người nhận; 20 MP, CD2. Chọn Quang/Ám: cả hai +12%/+24%, 4 lượt chính. Rank chỉ giảm MP, không tăng Crit.
- **Cùng Nhau Theo Ánh Đèn**: bản thân và một đồng đội khác, +15% khuếch đại cho 2 hành động gây sát thương; +18% ATK/MAG trong 3 lượt chính; mỗi người 1 Lượt Thêm. 32 MP, CD3. Chọn Quang/Ám: cả hai nhận +30%/4 lần, +36% ATK/MAG/6 lượt chính. Rank tăng ATK/MAG theo luật buff và giảm MP theo luật khuếch đại; không tăng mức amp.

## Ghi Chép Dưới Đèn

Đồng đội khác gây sát thương Quang/Ám bằng kỹ năng chủ động: dùng Rank hiện tại của Theo Dấu Sinh Vật vào một địch ngẫu nhiên còn sống và hai ô kề, không trả MP/CD, hồi 6% MP tối đa động cho mọi đồng đội còn sống. Riêng Liên kích này gắn 3 Sơ Hở chính/2 hai bên theo hệ đã kích; sát thương bản thân Clara vẫn Quang. Nếu một chiêu có cả Quang/Ám, dùng hệ hợp lệ xuất hiện đầu tiên trong damage thực tế.

Tối đa 2 lần mỗi vòng chung Main/Extra, theo từng Clara và phe. Reserve trước phản ứng. Không kích từ chính Clara, đánh thường, Phòng thủ, đòn tự động, phản công hoặc Liên kích. Một chiêu nhiều hit/địch chỉ một lần. Né hết hoặc không thực sự gây sát thương HP/khiên không kích. Hồi MP không hồi sinh người đã gục. Chủ đã gục không phản ứng.

## Vòng đời và API

Buff mới/refresh không mất thời gian trong chính hành động cấp; Extra không giảm thời hạn, main bị Choáng vẫn giảm. CD dùng luật kỹ năng chung, không giảm theo Extra. Amp chỉ lấy nguồn buff lớn nhất đủ điều kiện; buff yếu vẫn tiêu charge. Không cấp thêm lượt nối vô hạn từ Extra. Buff có thể bị xóa/chặn bởi luật chung; hai người độc lập. Kết thúc trận xóa hiệu ứng; limiter và buff được snapshot theo battle state, không lưu vào build tài khoản. Chuyển phòng tuân theo cleanup chung hiện hữu, không có carry ngoại lệ.

selectedAllyBuffBonus trong ally-observation.js là metadata chung: hệ đồng đội được chọn quyết định hệ số cho mọi buff được cấp bởi chiêu, gồm modifier/thời hạn/charge. Không thay đổi JSON hoặc ranked ability dùng chung. applyStatus chấp nhận charges cho damageUses; preview dùng cùng charge override. criticalChance cộng buff tỷ lệ vào nguồn sẵn có, cap100%; criticalDamageMultiplier cộng các nguồn rồi cap tổng200%. Nguyệt vẫn không Bạo Kích.

## Font sát thương Nguyệt

Dùng **Grenze Gotisch** weight700 của Omnibus-Type, từ https://github.com/google/fonts/tree/main/ofl/grenzegotisch. Tệp và SIL OFL1.1 nằm trong public/fonts/grenze-gotisch, dùng local/offline. Chỉ chữ số sát thương có element moon (kể cả đồng hệ) đổi font; nhãn BẠO KÍCH!, heal/MP, status và số thường giữ nguyên. Không giả làm font Askold. Đây là liên tưởng mỹ thuật phương Bắc của game, không khẳng định chữ Gothic là chữ bản địa Drageshelmfjall.

## Kiểm chứng

test/clara.test.js: save, schema, Rank, conditional buff, charge, main/Extra/Choáng, quota, RNG mục tiêu, exposure, dodge, multi-hit/no-chain, forecast và hai phe/snapshot. e2e/clara-moon-font.spec.ts: skill copy ở1440/768/390 và font trên damage Nguyệt thật trong Khu Luyện Tập.
