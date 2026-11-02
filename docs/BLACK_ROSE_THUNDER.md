# Thợ săn Lôi và Hoa Hồng Đen — cấu hình playtest

## Cập nhật hệ và danh sách nhân vật

- Oán Hận không còn là hệ nguyên tố. Vong hồn Người giữ đèn và các đòn của chúng chuyển sang **Ám**, vẫn yếu Nguyệt. Cơ chế `group: agony` và trạng thái Oán Hận vẫn giữ nguyên: HP 0 vẫn hành động, giảm 30% sát thương, damage lúc này trừ HP tối đa, không nhận khiên/hồi phục, trở lại cuối vòng sau với Max HP còn lại. Xóa quy tắc “đòn hệ Oán Hận trực tiếp trừ Max HP”.
- Gỡ Sơ Hở Oán Hận và lựa chọn hệ đó khỏi UI. Snapshot cũ khi khôi phục đổi hệ cũ thành Ám, bỏ Sơ Hở không còn hợp lệ, giữ trạng thái Oán Hận và deadline.
- Trang Nhân Vật thêm sort **Cấp độ**, tăng/giảm dần, dùng cấp thực từ save; hỗ trợ URL, tải lại và bộ lọc sở hữu/nguyên tố. Bộ lọc dùng chung của modal đội hình cũng nhận sort này.

## Bốn nhân vật gacha mới

| Nhân vật | Hệ / vai trò | HP | MP | ATK | MAG | DEF | RES | SPD |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Gregory Bennett | Lôi / DPS vật lí | 165 | 65 | 29 | 8 | 16 | 17 | 28 |
| Judy | Lôi / DPS ma pháp | 140 | 110 | 10 | 35 | 15 | 23 | 19 |
| Isabelle D'vorak | Thường / DPS vật lí | 150 | 90 | 28 | 12 | 15 | 19 | 22 |
| Viktor | Lôi / DPS vật lí | 165 | 80 | 28 | 10 | 16 | 17 | 21 |

### Gregory Bennett

Nội tại **Nhanh Hơn Lớp Giáp**: mọi đòn vật lí xuyên 50% DEF, kể cả đánh thường. Cộng với xuyên từ chiêu/gear/Thuốc Súng, tổng cap 100%. Không thay DEF thật, không tự kích Henrris.

- Lao Chớp Giật: 6 MP, 160% ATK đơn mục tiêu.
- Vệt Sét Xé Trời: 12 MP, CD 2, 260% ATK đơn mục tiêu.
- Xung Lao Quyết Định: 16 MP, CD 3, 340% ATK đơn mục tiêu.

Không có tầng hoặc mode; bộ kỹ năng đơn giản, hệ số vừa phải đổi lấy xuyên DEF thường trực. Rank tăng hệ số damage theo luật chung; 50% xuyên giữ cố định.

### Judy

Nội tại **Mọi Tia Sét Đều Hội Tụ**: tối đa 10 Điện Tích, bắt đầu từ 0. Mỗi hit Lôi của phe mình thực sự gây damage trực tiếp HP/khiên cho một kẻ địch qua kỹ năng chủ động hoặc Liên kích tạo 1 tầng. Tính cả chính Judy. Nhiều hit/diện rộng tính từng hit và từng địch. Không tính đánh thường, phản công, Độc, đòn né hoàn toàn hoặc Judy đã gục. Các Liên kích có metadata `reactionKind: follow_up`; không suy luận mọi phản ứng là Liên kích.

- Song Tia Tích Điện: 8 MP, hai hit đơn mục tiêu, mỗi hit 90% MAG.
- Màn Mưa Sấm: 12 MP, toàn địch 100% MAG.
- Tâm Bão Vỡ Òa: 20 MP, CD 2, cần ít nhất 1 tầng và tiêu toàn bộ. Hệ số `220% MAG + 35% MAG/tầng`; 10 tầng = 570% MAG. Lượng tiêu chốt trước chiêu; hit của chính nuke tạo tầng mới cho vòng xoay sau.

Rank tăng cả hệ số gốc và phần mỗi tầng 10% mỗi bậc, đúng một lần.

## Thuốc Súng

Chỉ cần có Isabelle hoặc Viktor trong đội là khởi tạo pool chung của phe: tối đa 6, bắt đầu từ 0. Không phải buff có thể bị xóa. Đồng đội ngoài Mafia cũng được dùng, pool không biến mất khi người cấp đã gục.

Quy tắc data-driven trong định nghĩa resource: `mpPerCharge: 5`, `penetrationPerCharge: 0.1`.

1. Kiểm tra mục tiêu, MP, chi phí riêng trước mọi mutation.
2. Trả MP thực sau giảm chi phí và phần MP phụ trội của Helena.
3. Tự tiêu `min(số viên hiện có, floor(MP thực trả / 5))`. Hết/thiếu đạn vẫn thi triển. Kỹ năng hỗ trợ cũng tiêu; đánh thường và Phòng Thủ 0 MP không tiêu.
4. Mỗi viên xuyên thêm 10% DEF cho vật lí và RES cho phép, áp dụng toàn bộ kỹ năng, không tính riêng từng hit/mục tiêu. Cộng các nguồn xuyên, cap 100%.
5. Chiêu sau đó mới tạo đạn; đạn vừa tạo không trả cho chính chiêu này. Hồi MP sau chiêu không hoàn đạn. Skill ưu tiên tài nguyên riêng thay MP như Sieg, nếu thực trả 0 MP thì không dùng đạn.

MP0 Liên kích/phản công không tự trừ thêm đạn. Mỗi resource có lịch sử tiêu riêng, không lẫn Bằng Chứng Đanh Thép. Snapshot và chế độ giữ trạng thái qua phòng giữ pool; trận độc lập reset.

### Isabelle D'vorak

- Chữ Ký Bằng Chì: 8 MP, đơn mục tiêu vật lí Thường 300% ATK, tạo 2 Thuốc Súng sau chiêu.
- Hoa Hồng Nở Trong Khói: 10 MP, toàn địch 125% ATK, tạo 2 viên sau chiêu.
- Nội tại **Lời Chào Của Hoa Hồng Đen**: sau kỹ năng chủ động công kích của đồng đội khác, tối đa 2 lần mỗi vòng, gộp Vòng Chính/Vòng Phụ. Chọn ngẫu nhiên một địch sống làm tâm; Liên kích 125% ATK vào tâm và 85% ATK hai ô kề. Không nối vòng, không kéo địch khác vào ô trống/chết. Không tự kích từ Isabelle, đánh thường, phản công, kỹ năng hỗ trợ hoặc Liên kích.
- Nếu kỹ năng gốc thực dùng Thuốc Súng: mục tiêu chính của Liên kích nhận thêm 10% xuyên DEF mỗi viên đã trả; mục tiêu kề không nhận bonus này. Tạo 1 Thuốc Súng sau Liên kích. Lượng đạn của kỹ năng gốc được chốt, không đọc số đạn sau khi các hiệu ứng khác tạo thêm. Tạo khi đầy vẫn là sự kiện tạo, pool không vượt 6.

### Viktor

Nội tại **Ba Viên Là Đủ**: +30% damage cho chính kỹ năng mỗi viên thực tiêu, tối đa +90% khi tiêu từ 3. Là bonus nội tại theo hành động, không để lại buff; không cộng tích qua lượt.

- Trong Tầm Ngắm Của Chim Ưng: 10 MP, CD 3, +50% ATK trong 3 lượt chính và tạo 2 viên. Rank tăng buff ATK 5% mỗi bậc.
- Phát Bắn Cảnh Cáo: 6 MP, đơn mục tiêu 150% ATK Lôi.
- Phán Quyết Của Người Hộ Tống: 15 MP, CD 2, đơn mục tiêu 550% ATK Lôi và xuyên 15% DEF, như hệ số burst Lunarmare hiện hành. Không yêu cầu Bằng Chứng; Thuốc Súng là tài nguyên tùy số đang có. Với 3 viên, tổng xuyên từ chiêu và đạn là 45%, native damage +90%.

Các hệ số chủ động tăng theo Rank chung; hệ số Liên kích và nội tại giữ cố định. Dùng VFX chém/nổ và silhouette vai trò sẵn có; HUD Thuốc Súng dùng SVG viên đạn mới, không thêm BGM hoặc nền bàn đấu.
