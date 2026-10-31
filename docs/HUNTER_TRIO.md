# Logia, Amelia và Chloe

Ba nhân vật chính thức của Hội Thợ Săn, dùng icon vai trò, silhouette và VFX nguyên tố cơ bản. Có trong Chiêu Mộ thường và danh sách đổi Pure Prisma; mặc định chưa sở hữu, không nhận thêm ô trang bị khi mở lần đầu. Không thay phiên bản save.

| Nhân vật | Hệ / Vai trò | HP | MP | ATK | MAG | DEF | RES | SPD |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Logia | Lôi / DPS vật lí | 165 | 80 | 31 | 10 | 16 | 17 | 23 |
| Amelia | Thủy / Hỗ trợ phòng thủ | 155 | 110 | 9 | 30 | 16 | 28 | 20 |
| Chloe | Thường / Hỗ trợ tấn công | 160 | 90 | 25 | 23 | 15 | 20 | 27 |

## Logia — Độc xà Lôi ảnh

- **Nanh xà chớp giật** — 6 MP, đơn mục tiêu, 140% ATK Lôi; hit trúng gắn 1 Độc xà.
- **Màn săn tẩm độc** — 12 MP, hồi 2 vòng, toàn địch, 70% ATK Lôi; mỗi hit trúng gắn 1 Độc xà.
- **Chết chậm thôi** — 12 MP, hồi 2 vòng, đơn mục tiêu, 2 × 90% ATK Lôi; mỗi hit trúng gắn 1 Độc xà.
- **Thú vui độc địa** — Độc xà tự gây có sát thương tăng 25%.

Độc xà tối đa 3 tầng; mỗi tầng gây 45% ATK trước nội tại vào đầu lượt mục tiêu, tồn tại 3 lần kích hoạt. ATK chốt khi áp dụng, làm tròn lượng độc mỗi tầng; ở ATK 31 là 17 HP/tầng, 51 HP khi đủ 3 tầng. Gắn lại chốt lại lượng độc mỗi tầng và làm mới thời hạn; không tạo nhiều bản trạng thái cùng loại. Khác loại Độc của Kai vẫn cùng tồn tại. Theo cơ chế Độc hiện tại, lượt chính và lượt thêm đều kích hoạt độc; không đổi luật của Kai.

Độc bỏ qua DEF, RES và khiên; không hưởng điểm yếu, không tự kích hoạt Liên kích. Sát thương trực tiếp vẫn là vật lí Lôi, tính DEF và có thể né. Hộ Ấn chặn việc gắn độc, cleanse gỡ toàn bộ tầng; độc đã gắn vẫn hoạt động khi Logia gục.

## Amelia — Pháp sư Băng hộ

- **Màn băng tĩnh lặng** — 10 MP, hồi 3 vòng; toàn đội giảm 20% sát thương nhận, 3 vòng toàn cục tính cả vòng thi triển.
- **Thành lũy pha lê** — 16 MP, hồi 2 vòng; khiên toàn đội bằng 120% MAG + 12 (48 khiên tại MAG 30). Khiên không cộng dồn, không có thời hạn riêng.
- **Mảnh băng cảnh giới** — 5 MP; 160% MAG Thủy đơn mục tiêu.
- **Băng kính hồi âm** — tối đa 1 lần mỗi vòng: đồng đội khác bị địch đánh khi đang có khiên và còn sống, còn khiên sau toàn bộ chiêu thì kích hoạt **Băng kính phản chiếu**: Liên kích 65% MAG Thủy lên toàn địch, giảm 10% ATK và MAG trong 1 lượt chính của từng mục tiêu trúng đòn.

Xét bất kỳ nguồn khiên; không chỉ khiên Amelia. Nếu chỉ Amelia bị đánh thì không kích hoạt. Đòn nhiều hit và AoE chờ toàn bộ hit/hiệu ứng giải quyết rồi mới kiểm tra, không phản ứng giữa hit. Trong số các đồng đội khác đã bị đánh trúng khi có khiên, chỉ cần một người vẫn có khiên cuối chiêu. Né hoàn toàn, độc, đồng minh tự gây sát thương và phản ứng khác không kích hoạt. Không tiêu MP/lượt và không sinh chuỗi Liên kích; Vòng Chính/Vòng Phụ dùng chung giới hạn.

## Chloe — Mèo hoang của Hội

- **Vuốt mèo cào rối** — 10 MP, hồi 2 vòng; 120% ATK Thường mục tiêu chính, 60% ATK hai ô kề; hit trúng giảm 20% DEF và RES trong 2 lượt chính của mục tiêu.
- **Chăm chút bằng chân mèo** — 6 MP; hồi 160% MAG + 10 HP cho một đồng đội (47 HP tại MAG 23).
- **Vồ lấy sơ hở** — 5 MP; 180% ATK Thường đơn mục tiêu.
- **Mèo vờn chuột** — đòn trực tiếp trúng địch giảm 10% ATK và MAG trong 1 lượt chính của người đó. Tính đánh thường và kỹ năng, trúng khiên vẫn được; né và hồi máu không kích hoạt. Dùng lại làm mới, không cộng tầng. Hiệu ứng của kỹ năng giải quyết trước hiệu ứng nội tại.

Vuốt mèo sử dụng `enemy_splash`: mục tiêu chính và vị trí liền kề cố định, không nối vòng 1 ↔ 4, không nén khoảng trống/địch đã gục. Đánh ở hai đầu tối đa 2 mục tiêu, ở giữa tối đa 3. Được chọn anchor tự do như AoE, không bị Khiêu khích hoặc Che chắn chuyển hướng. Cùng thuật toán chọn mục tiêu dùng cho engine, dự báo và viền mục tiêu UI.

## Khung tái sử dụng

- `dot_potency_bonus`: danh sách status DoT và hệ số tăng, dùng chung hàm tính potency với preview.
- Status DoT có `maxStacks`: mỗi tick nhân potency đã chốt với số tầng hiện tại.
- `shield_survival_followup`: ability passive toàn địch, giới hạn 1/vòng, xét sau cả chiêu. Dùng chung điều kiện không tự kích hoạt FuA.
- `attack_status`: status bất lợi và thời hạn gắn sau hit trực tiếp thành công.
- `enemy_splash` + `selectedTargets`: phân biệt anchor hợp lệ và danh sách thực nhận theo ô đội hình.

Hồi chiêu giữ quy ước hiện có: CD N khóa N vòng kế tiếp sau vòng thi triển; ví dụ CD 2 dùng ở vòng 1 thì sẵn lại ở vòng 4. Đây là cân bằng khởi điểm, cần battle log thực tế để tune.
