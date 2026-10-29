# Màn chơi

Chọn tại trang **03 / Chọn trận & Chiến đấu**. Có 27 màn. Thưởng chiến thắng: màn thường 50 Coin, boss 150 Coin và siêu trùm 1.000 Coin. Quỷ lùn tập kích trong rừng có thưởng nhân vật lần đầu; Thử thách tay sai vua chằn có nâng cấp Arthur lần đầu. Chơi lại không nhận lại thưởng đặc biệt.

| Màn | Đối thủ | Điểm yếu |
|---|---|---|
| Quỷ lùn tập kích trong rừng | Hai quỷ lùn nhỏ, mỗi con 65 HP | Mọi hệ; lần đầu nhận Kai và một bản trùng Arthur/Garrek |
| Tuần tra rừng biên giới | Hai quỷ lùn do thám và một ếch già | Quỷ lùn: mọi hệ; ếch: Hỏa |
| Thử thách tay sai vua chằn | Một tay sai vua chằn và một quỷ lùn | Tay sai: Quang/Ám; quỷ lùn: mọi hệ. Lần đầu nhận Arthur · Kiểm soát Ogre’s Bane |
| Hang quỷ lùn | Hai quỷ lùn thường và một thầy mo | Quỷ lùn thường: mọi hệ; thầy mo: Quang |
| Vô Sắc Long — Bá Chủ Hoang Nguyên | Phi long vảy mỏng | Thường |
| Băng Long — Chúa Tể Vĩnh Đông | Phi long sợ lửa | Hỏa |
| Hỏa Long — Nộ Diễm Phần Thiên | Phi long khô hạn | Thủy |
| Lôi Long — Thiên Lôi Giáng Thế | Phi long vảy nứt | Thổ |
| Sa Long — Bạo Chúa Biển Cát | Phi long cánh rách | Phong |
| Thủy Long — Hung Thần Biển Sâu | Phi long vảy ướt | Lôi |
| Hắc Long — Bóng Đêm Tận Thế | Phi long bóng đêm | Quang |
| Thánh Long — Phán Quyết Thiên Giới | Phi long ánh ngày | Ám |
| Thiết Giáp Long — Pháo Đài Thép | Phi long vảy cứng | Mọi đòn phép, bất kể hệ |
| Kết Giới Long — Cấm Vực Ma Pháp | Phi long vảy mềm | Mọi đòn vật lí, bất kể hệ |
| Bầy sói rừng sâu | Một sói đầu đàn và ba sói săn mồi | Cả bầy yếu Hỏa |
| Hang tê tê khổng lồ | Một tê tê khổng lồ | Thổ |
| Siêu trùm — Alice, Hắc Thánh Kiếm | Dark Holy Blade Alice, 2.400 HP, RES 90 | Quang |
| Siêu trùm — Miraebolis, Hắc Long Thiêu Thành | Miraebolis, 3.600 HP, ba giai đoạn | Thủy / Quang / Lôi; kháng Hỏa 30% |
| Ổ nhện khổng lồ | Nhện khổng lồ, 1.100 HP, khiên 140 | Ám; vỡ khiên mất một lượt và nhận thêm 100% sát thương đến khi dựng lại khiên |

## Chiêu thức và chỉ số thử nghiệm

Nhạc nền: màn tập kích, tuần tra rừng và hang quỷ lùn dùng ngẫu nhiên `bt1` hoặc `bt2`; vua chằn, bầy sói đầu đàn và tê tê dùng `boss_1`; mười Phi long dùng `boss_wyvern`; Alice dùng `spboss_alice`; Miraebolis dùng `spboss_miraebolis`. Cấu hình theo `bgm` của từng màn và `data/music.json`, không suy luận từ tên hiển thị. Miraebolis có luật riêng về giai đoạn và Kìm hãm trong [tài liệu chi tiết](MIRAEBOLIS.md).

Màn tập kích là màn nhập môn, đứng đầu danh sách. Lần đầu thắng, Kai gia nhập; một bản trùng Arthur và một bản trùng Garrek mỗi bản mở thêm 1 ô gear (tối đa 6) và cho 10 mảnh. Đã đủ ô vẫn nhận mảnh. Cờ nhận thưởng lưu trong save v3 và đi cùng Import/Export, lỗi ghi save giữ nguyên quyền nhận để thử lại. Kai không nằm trong banner; Benard được thêm vào banner thường.

Màn vua chằn nhận nâng cấp `arthur.control_training`: thay Ogre’s Bane — Bất kham bằng bản Kiểm soát, mở Giải phóng một phần. Không cần Arthur trong đội và không còn nút nhận ở Chuẩn bị. Cấp story flag/nâng cấp/cờ nhận/coin trong cùng lần lưu; lỗi ghi không cấp một phần. Giữ nguyên nâng cấp đã có trong save cũ; nếu đã sở hữu thì không nhân đôi kỹ năng. Lượt thắng sau chỉ nhận 150 Coin.

- **Thầy mo quỷ lùn:** 210 HP, 90 MP; dùng Đốm lửa đơn mục tiêu và Bùa bóng tối diện rộng. Hai quỷ lùn thường giữ bộ chỉ số/chiêu cũ.
- **Mười phi long:** cùng 750 HP, 140 MP, ATK 38, MAG 30, DEF 25, RES 25, SPD 17; cùng hệ Phong và dùng chung Cắn xé (vật lí đơn), Vỗ cánh (vật lí diện rộng), Hơi thở cuồng phong (phép diện rộng). Chỉ khác điểm yếu; không tăng độ khó theo số thứ tự.
- **Sói đầu đàn:** 330 HP; Vồ mồi và Cắn liên hoàn hai nhát. **Sói săn mồi:** 105 HP/con, dùng Ngoạm chân. Cả bầy nhanh, khuyến khích giảm số lượng bằng đòn diện rộng.
- **Tê tê khổng lồ:** 800 HP, 100 MP, DEF 75, RES 18, SPD 8; dùng Lăn nghiền diện rộng và Quật đuôi đơn mục tiêu. Điểm yếu Thổ không xuyên giáp; có thể dùng phép, xuyên giáp hoặc làm yếu phòng thủ.
- **Nhện khổng lồ:** boss thường, 1.100 HP, 100 MP, ATK 32, MAG 22, DEF 26, RES 22, SPD 15, hệ Thổ và yếu Ám. Ưu tiên Kén tơ sắt khi không có khiên: 140 khiên, 10 MP, hồi 2 vòng. Nanh nghiền gây 135% ATK Thường đơn mục tiêu (4 MP); Tơ siết gây 80% ATK Thổ diện rộng (8 MP, hồi 2 vòng). Khi khiên bị đánh vỡ, còn sống thì nhận Choáng 1 lượt và Vỡ kén (+100% sát thương nhận, gồm cả độc) đến lúc nhận khiên mới. Hit phá khiên chưa hưởng Vỡ kén, các hit tiếp theo/liên kích có hưởng. Choáng bỏ một lượt hành động bình thường, không tạo vòng riêng. Nhạc `boss_1.mp3`, thưởng 150 Coin, không thưởng nhân vật lần đầu. Không bắt buộc có Gahallad; Fiona và các nguồn sát thương khác vẫn phá được kén.
- **Dark Holy Blade Alice:** 2.400 HP, 800 MP, ATK 46, MAG 42, DEF 32, RES 90, SPD 18, hệ Ám và chỉ yếu Quang. Ba phép diện rộng: Lời nguyền hắc kiếm (85% MAG Ám, −20% ATK/MAG trong 2 lượt, 14 MP, hồi 1 vòng); Xiềng đêm vĩnh cửu (95% MAG Ám, −25% SPD trong 2 lượt, 16 MP, hồi 2 vòng); Thánh phán đọa lạc (110% MAG Quang, −35% DEF/RES trong 2 lượt, 24 MP, hồi 3 vòng). Hắc thánh kiếm là đòn vật lí Ám đơn mục tiêu 200% ATK, 10 MP. Giảm tốc cập nhật thứ tự từ vòng sau. Mọi bất lợi đều giải được bằng Điều trị của Armie; cùng loại chỉ làm mới thời hạn, khác loại có thể tồn tại đồng thời. Kháng phép cao là chỉ số RES, không phải miễn phép; điểm yếu Quang vẫn áp dụng cho cả vật lí lẫn phép. AI dùng chung luật chọn chiêu có đủ MP/hết hồi chiêu, không có pha cưỡng chế. Thắng nhận 1.000 Coin, chưa có thưởng lần đầu riêng. Chỉ số siêu trùm là mức thử nghiệm cho đội đã có trang bị.

Điểm yếu tăng sát thương 50% trước hấp thụ khiên. Khớp hệ và loại đòn vẫn chỉ tăng 50% một lần. Chỉ số là cấu hình thử nghiệm trong `data/enemies.json`; chiêu nằm trong `data/abilities.json`, đội hình quái nằm trong `data/encounters.json`. Chưa có nhiều đợt quái trong một trận. Save không đổi schema; ID của quái/màn cũ được giữ, chỉ Việt hóa tên hiển thị.


# Quái thường và Quest dễ

Mười loại quái dùng cơ chế engine hiện có. Có thể dùng ID trong `encounter.enemies`, lặp ID để thêm nhiều cá thể. Tất cả tám Quest mới dùng `rewardTier: normal`, `bgm: normal`, nhận 50 Coin mỗi chiến thắng; không có thưởng lần đầu riêng.

| ID | Quái | HP | Điểm yếu | Đặc điểm |
| --- | --- | ---: | --- | --- |
| `wild_boar` | Lợn rừng | 135 | Phong, Hỏa | Húc đơn mục tiêu; chậm |
| `forest_rat` | Chuột rừng | 65 | Hỏa, Thổ | Nhanh, ít máu và ít giáp |
| `giant_beetle` | Bọ cánh cứng | 115 | Hỏa, Lôi | DEF 24, RES 5; tự tạo 20 khiên, hồi 2 vòng |
| `cave_bat` | Dơi hang | 80 | Quang, Lôi | Cắn hai nhịp nhẹ, SPD 20 |
| `marsh_snake` | Rắn đầm lầy | 95 | Hỏa, Phong | Cắn gắn Nhiễm độc trong 2 lượt; không cộng dồn |
| `pond_crab` | Cua đồng | 110 | Lôi, Thổ | Mai cứng, RES thấp, chậm |
| `forest_spider` | Nhện rừng | 75 | Quang, Hỏa | Hai nhát cắn Ám nhẹ; không phải Nhện khổng lồ |
| `wild_mushroom` | Nấm độc | 105 | Hỏa, Phong | Phấn phép Thổ diện rộng nhẹ, không gắn độc kéo dài |
| `ember_wisp` | Đốm lửa | 85 | Thủy | Phép Hỏa, ít DEF; đòn cơ bản cũng là phép |
| `moss_slime` | Nhầy rêu | 125 | Hỏa, mọi đòn vật lí | Ít DEF, RES khá; trùng điểm yếu vẫn chỉ tăng 50% một lần |

## Quest có sẵn

| ID | Tên | Đội quái |
| --- | --- | --- |
| `boar_field` | Lợn rừng phá ruộng | 1 lợn rừng + 2 chuột rừng |
| `granary_rats` | Kho thóc náo loạn | 3 chuột rừng |
| `beetle_orchard` | Bọ phá vườn rau | 2 bọ cánh cứng |
| `bat_roost` | Dơi quấy hang đá | 3 dơi hang |
| `riverbank_pests` | Bờ suối xôn xao | 2 cua đồng + 1 nhầy rêu |
| `marsh_trail` | Lối mòn đầm lầy | 1 rắn đầm lầy + 1 nhện rừng |
| `mushroom_grove` | Bụi nấm bên đường | 2 nấm độc + 1 chuột rừng |
| `flickering_woods` | Đốm lửa lạc trong rừng | 2 đốm lửa + 1 nhầy rêu |

Kiểm tra cân bằng: năm seed mỗi Quest với đội mặc định Arthur/Iris/Elaine/Garrek, không gear, không nâng cấp truyện, chỉ đánh thường. Cả 40 trận phải thắng trong tối đa 10 vòng, không ai gục; nhận đúng 50 Coin và không nhận thưởng lại trên cùng một trận. Đây là mức tham chiếu đội bốn người, không phải bảo đảm mọi đội solo hoặc đội thiếu thành viên đều thắng.
