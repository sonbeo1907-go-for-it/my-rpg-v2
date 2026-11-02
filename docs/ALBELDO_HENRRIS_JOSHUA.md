# Finmel, Albeldo, Henrris và Joshua — cấu hình playtest

## Sửa Finmel

Hàn Tinh vẫn bắt đầu từ 0 và tối đa 3. Điều kiện mới: **đồng đội khác gây sát thương trực tiếp khác hệ Thủy**. Xét hệ của hit, không xét hệ nhân vật. Một kỹ năng nhiều hit/diện rộng chỉ tạo một tầng, chỉ cần một hit khác Thủy thực sự gây sát thương HP/khiên. Hit Thủy, né hoàn toàn, Độc và đòn của Finmel không tạo tầng. Liên kích/phản công của đồng đội là hành động riêng, vẫn được tính. Không thay các hệ số, MP hay hồi chiêu hiện có.

## Nhân vật mới

Ba nhân vật vào Chiêu Mộ thường; không tự cấp miễn phí. Dùng bộ VFX sẵn có, không có nền bàn đấu hoặc BGM mới.

| Nhân vật | Hệ / vai trò | HP | MP | ATK | MAG | DEF | RES | SPD |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Albeldo Dragun | Phong / Thủ Hộ | 270 | 85 | 17 | 10 | 27 | 22 | 24 |
| Henrris | Phong / DPS vật lí | 155 | 85 | 30 | 10 | 16 | 18 | 24 |
| Joshua | Hỏa / DPS vật lí | 195 | 80 | 32 | 10 | 18 | 18 | 17 |

### Albeldo — kị sĩ thủ đô

- **Gió Lặng Sau Hàng Khiên**: toàn đội, kể cả bản thân, giảm sát thương vật lí theo `min(30%, SPD căn bản / 90 × 30%)`. Albeldo phải còn sống. Tính chỉ số phẳng từ phân bổ/trang bị và cộng căn bản, không tính buff/debuff SPD %. Nhiều nguồn cùng loại lấy mức lớn nhất. Áp dụng theo từng hit, trong lớp giảm sát thương hiện có, với trần tổng 75%. Không giảm phép hoặc Độc.
- **Nhịp Gió Tiền Quân**: 10 MP, CD 2; toàn đội +30% SPD và +15% DEF trong 3 lượt chính của người nhận.
- **Phong Bích Hộ Trận**: 12 MP, CD 2; chọn một đồng đội làm chính, tạo khiên toàn đội. Chỉ số scale = `(DEF + SPD)/2`. Mục tiêu chính nhận 200%, các thành viên còn lại nhận 120%. Khiên không cộng dồn; chỉ thay khi khiên mới mạnh hơn.
- **Giữ Vững Lối Gió**: 6 MP, CD 2; bản thân Khiêu Khích và +20% RES trong 2 lượt chính.

Rank tăng 10% cho cả hai hệ số khiên, 5% cho DEF/RES; SPD giữ cố định theo quy tắc Rank hiện tại của game. Shield chính/phụ dùng chung `primaryMultiplier`, mở rộng data-driven từ damage sang shield AoE. Người chết bị bỏ qua, không chuyển ưu tiên sang người khác.

### Henrris — cung thủ high elf của hội thợ săn

- **Mắt Thấy Kẽ Hở**: +50% sát thương trực tiếp nếu DEF hiện tại của mục tiêu khác DEF căn bản. Tính cả tăng và giảm DEF, xét lại mỗi hit. Xuyên DEF chỉ thay công thức hit, không thay DEF của mục tiêu, do đó không tự kích hoạt nội tại.
- **Mũi Tên Xé Giáp**: 10 MP, CD 3; 120% ATK vật lí Phong, trúng đòn giảm 35% DEF trong 4 lượt chính. Hit mở đầu xét DEF trước khi gắn debuff.
- **Ba Tiếng Gió Đoạn Mệnh**: 18 MP, CD 3; 3 hit cùng mục tiêu, mỗi hit 180% ATK vật lí Phong.
- **Mũi Tên Xuyên Vỏ**: 9 MP, không CD; 200% ATK vật lí Phong, xuyên 20% DEF.

Rank tăng 10% cho damage; phần giảm DEF, xuyên DEF và bonus nội tại giữ cố định.

### Joshua — ma cà rồng của hội thợ săn

**Ta Còn Kế Hoạch B**: Khiêu Khích là trạng thái nội tại được suy ra, luôn hiện ngoài dạng và không mất do xóa buff. Nhận sát thương HP khiến HP dưới 50% và vẫn sống thì tự kích hoạt Kế Hoạch B nếu hết thời gian chờ. Chỉ đòn vào khiên không kích. Độc có thể kích nếu sống sót. Chi phí HP không phải sát thương, không kích.

**Kế Hoạch B**:

- Bỏ các Khiêu Khích đang có; bản thân nhận +85% ATK, duy trì 3 vòng, tính cả vòng kích hoạt.
- Lập tức nhận 1 Lượt Thêm theo luật chung: tối đa một/người/vòng, thực hiện trong Vòng Phụ; không cấp tiếp nếu đang trong Vòng Phụ.
- Nhận Bất Tử đến hết vòng kích hoạt, kể cả Vòng Phụ: sát thương HP không thể đưa HP dưới 1. Không cứu đòn chí mạng ban đầu. Có thể bị xóa buff. Hit đầu trong chuỗi nhiều hit có thể kích dạng, từ hit sau Bất Tử có hiệu lực.
- Mỗi kỹ năng chủ động công kích bắt đầu khi đã ở dạng sẽ tạo đúng một Liên kích **Bữa Tiệc Kế Hoạch B**: vật lí Hỏa 320% ATK mục tiêu chính, 200% ATK hai ô địch kề, không nối vòng. Chính bị hạ vẫn đánh các ô kề sống. Không tự tìm mục tiêu chính mới.
- Đây là ngoại lệ tự kích hoạt được chỉ định riêng bởi `vampire_contingency`. Không thay luật no-self-trigger của Aurora, Simon hoặc nhân vật khác. Không kích từ đánh thường, Phòng thủ, Độc, phản công hoặc Liên kích; Liên kích không gọi lại chính nó. Nếu mode vừa được kích bởi phản đòn trong một chiêu khởi đầu ở dạng thường, chiêu đó không được truy kích hồi tố.
- Hút máu 25% tổng sát thương HP thực gây ra bởi Liên kích, hồi một lần sau toàn bộ đòn. Không tính khiên hoặc overkill; không hồi sinh. Làm tròn như hàm heal chung.
- Hết dạng ở cuối vòng R: Khiêu Khích tự trở lại, không thể kích lại ở R+1 và R+2; sớm nhất R+3 sau một lần nhận sát thương HP mới hợp lệ. Vẫn Khiêu Khích trong downtime, nên cần bảo vệ hoặc hồi máu.

Các kỹ năng chủ động đều đơn mục tiêu, vật lí Hỏa:

| Kỹ năng | Chi phí | Hệ số / hiệu ứng |
| --- | --- | --- |
| Nanh Lửa Chào Khách | 7 MP | 150% ATK, hút máu 25% sát thương HP thực |
| Vũ Điệu Bên Miệng Chén | 10 MP | 200% ATK, trúng giảm 15% ATK trong 2 lượt chính |
| Lời Chúc Cuối Bữa Tiệc | 16 MP, CD 2 | 300% ATK |

Rank tăng 10% cho các chiêu chủ động. +85% ATK, điều kiện 50% HP, Liên kích 320%/200%, hút máu 25% và cooldown mode giữ cố định. Mode, deadline và cooldown đi theo snapshot/phòng nếu chế độ giữ trạng thái; trận mới reset. Kế Hoạch B chỉ có nhãn cục bộ, không tạo VFX ghi đè bàn đấu.
