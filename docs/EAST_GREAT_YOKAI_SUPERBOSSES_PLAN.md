# Đại Yêu Ma · Thảo Phạt Phương Đông — kế hoạch thiết kế

Ngày: **15/11/2026**. Trạng thái: **bản thiết kế ban đầu, đã có bản triển khai**. Xem [trạng thái hiện hành](EAST_GREAT_YOKAI.md) để lấy chỉ số đã tune, capability `pendingFiller` và kiểm thử. Các con số bên dưới là cấu hình đề xuất ban đầu.

Tài liệu này bổ sung hậu kỳ cho [Thảo Phạt Phương Đông](EAST_EXTERMINATION.md). Không sửa Orochi, Miraebolis, công thức tăng trưởng toàn game hoặc phần thưởng đang chạy. Tên, bộ số và vòng chiêu dưới đây là cấu hình khởi đầu; yêu cầu mở khóa, bốn cấp và ba loại trận là yêu cầu sản phẩm đã chốt.

## 1. Phạm vi và mở khóa

- Ba trận Đại Yêu Ma, nằm trong phần **Thảo Phạt Phương Đông → Đại Yêu Ma**, sau tuyến hiện tại; không đưa sang tab Hiểm Ác chung.
- Điều kiện duy nhất bổ sung: hoàn thành và ghi nhận kết quả **Bát Kỳ Xà — Đêm Nuốt Trời** (`east_ke_08`, Yamata no Orochi).
- Dùng cờ hiện có `east_campaign_completed`, vốn được reward handler cấp sau chiến thắng Orochi. Không tạo lại cờ từ việc chỉ mở màn kết quả, không phụ thuộc `illusion.sinister_unlocked` hoặc phải thắng Miraebolis.
- Sau mở khóa, cả ba trận đều có **Lv60 / Lv70 / Lv80 / Lv90**. Cho chọn cả bốn ngay, mặc định Lv60; không tự thêm yêu cầu thắng lần lượt các cấp.
- Mục tiêu độ khó: **mỗi trận khó hơn Miraebolis cùng cấp**, với cùng đội, phân bổ điểm, Rank/Thông Thạo, trang bị và mức hiểu cơ chế. Đây là mục tiêu nghiệm thu, chưa phải kết luận cân bằng.
- Không bắt buộc nhân vật gacha, hệ Nguyệt hoặc một nhân vật cụ thể. Hồn Kiếm có lợi thế hợp bối cảnh nhưng không được biến thành vé vào cửa.

| Trận | Hình thái | Thử thách chính |
| --- | --- | --- |
| **Daidarabotchi — Cự Quỷ Gánh Núi** | Một quái khổng lồ chiếm ba ô | Phá tư thế trước đòn lớn, giữ tài nguyên phòng thủ |
| **Tamamo-no-Mae — Cửu Vĩ Dệt Chú** | Một boss chuyên hiệu ứng bất lợi | Phân phối Hộ Ấn, giải hiệu ứng, quản lý MP và lượt hỗ trợ |
| **Song Quỷ Trấn Môn — Lôi Quỷ & Phong Quỷ** | Hai boss đồng thời | Ưu tiên mục tiêu, ngắt phối hợp và chuẩn bị giai đoạn còn một boss |

Tên dùng cho sáng tác trong game; không đặt thêm yêu cầu nghiên cứu hay mô phỏng chính xác truyền thuyết.

## 2. Mốc so sánh và tăng trưởng

### Dữ liệu hiện tại cần giữ đúng

Miraebolis có chỉ số nền Lv1: HP 3.600, MP 600, ATK 48, MAG 42, DEF 32, RES 35, SPD 18. Ba giai đoạn, giai đoạn cuối hai hành động/lượt; đòn điểm yếu tích Kìm hãm; hai lần chuyển giai đoạn hồi đầy MP cho đồng đội còn sống. Orochi hiện là trận cố định Lv55, HP nền 2.200, ba giai đoạn, có đầu xà phụ và không hồi đầy MP khi chuyển giai đoạn.

Toàn bộ chỉ số mới tiếp tục dùng **mốc nền Lv1**, HP theo **đường siêu trùm của encounter**. Không lấy chỉ số đã scale ở Lv60 làm nền, không nhân thêm hệ số hầm ngục cũ. Theo engine hiện tại, ATK/MAG và DEF/RES dừng tăng sau Lv50; lên Lv60–90 chủ yếu tăng HP, cùng tăng trưởng MP/SPD hiện hành. Không viết mô tả sai rằng mọi chỉ số đều tăng tiếp ở các mốc này.

### Bộ chỉ số nền đề xuất

| Đơn vị | HP | MP | ATK | MAG | DEF | RES | SPD | Hệ | Điểm yếu |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| Cự Quỷ Gánh Núi | 4.800 | 620 | 55 | 36 | 36 | 30 | 12 | Thổ | Phong, Thủy, Hồn Kiếm |
| Cửu Vĩ Dệt Chú | 4.200 | 700 | 20 | 49 | 26 | 40 | 23 | Ám | Hỏa, Quang, Hồn Kiếm |
| Lôi Quỷ | 2.600 | 380 | 53 | 28 | 33 | 28 | 20 | Lôi | Thổ, Thủy, Hồn Kiếm |
| Phong Quỷ | 2.400 | 420 | 30 | 48 | 28 | 34 | 22 | Phong | Hỏa, Lôi, Hồn Kiếm |

Chưa áp kháng nguyên tố riêng trong bản thử đầu. Cả bốn đơn vị miễn Choáng từ người chơi theo luật boss/siêu trùm; cửa sổ cơ chế được điều khiển bằng trạng thái riêng, không lách luật bằng Choáng.

HP thực tế tính bằng helper tăng trưởng hiện tại, làm tròn từng đơn vị:

| Cấp địch | Miraebolis | Cự Quỷ | Cửu Vĩ | Lôi Quỷ + Phong Quỷ |
| --- | ---: | ---: | ---: | ---: |
| 60 | 9.558 | 12.744 | 11.151 | 6.903 + 6.372 |
| 70 | 12.235 | 16.314 | 14.275 | 8.837 + 8.157 |
| 80 | 15.662 | 20.883 | 18.273 | 11.312 + 10.442 |
| 90 | 21.049 | 28.065 | 24.557 | 15.202 + 14.033 |

Các số này chỉ xác nhận phép scale, **không chứng minh độ khó**. Trận song trùm có tổng HP nền 5.000 nhưng khả năng nhận AoE và mất hành động khi một boss chết cũng phải tính vào ngân sách sức mạnh.

Không tự gắn thêm Phong Ấn Hồn Kiếm 12–24 lớp của tuyến cũ lên các boss mới. Nếu cần sau playtest, phải ghi riêng; tránh cộng cả lớp giảm sát thương cũ vào mọi cơ chế dưới đây.

## 3. Cự Quỷ Gánh Núi — một thân hình, ba ô

### Quy ước đơn vị

**Một actor, một HP/MP, một tập status, một vị trí trong hàng lượt.** Hình ảnh và vùng chọn trải qua ba cột liên tiếp của đội địch, căn giữa. Ba vùng thân không phải ba actor hoặc ba bộ phận có HP riêng. Không thêm quái phụ vào trận thử đầu.

- Bấm bất kỳ phần thân nào đều chọn cùng đơn vị; khung bốn góc ôm toàn bộ thân hình.
- Mỗi hit AoE chỉ trúng boss một lần. Đòn nhiều hit giữ đúng số hit; đòn ngẫu nhiên chọn theo số đơn vị sống, không theo số ô thân chiếm.
- Đòn lan không tìm thấy hai “mục tiêu phụ” giả trên cùng thân hình. Nhánh chia hệ số theo số địch chỉ đếm một địch.
- Sơ Hở, xuyên giáp, Liên kích, hút máu, tạo tài nguyên, hiệu ứng gear và chiến công hạ địch đều tính đúng một đơn vị.
- Hiệu ứng đơn mục tiêu neo vào thân; hiệu ứng toàn đội địch neo vào trung tâm đội hình. Không cho hình khổng lồ đè lên thanh lượt hoặc hàng đồng đội.

### Cơ chế: Ba Trụ Sơn Thế

Cự Quỷ có ba dấu **Sơn Thế**, hiển thị trên thanh cơ chế, không phải buff có thể xóa. Khi chuẩn bị chiêu lớn, ba dấu sáng và có một Vòng Chính đầy đủ để phản ứng.

- Trong cửa sổ này, một hành động đánh đúng điểm yếu và thực sự gây sát thương HP hoặc khiên phá một dấu; tối đa một dấu mỗi lần thi triển vào boss, không theo hit.
- Phản công/Liên kích hợp lệ được tính như một hành động riêng. Độc và sát thương không có nguồn hành động trực tiếp không phá dấu.
- Phá đủ ba: hủy **chính đòn lớn đang chuẩn bị**, boss vào **Vỡ Thế**, nhận thêm 20% sát thương đến hết lượt chính tiếp theo của boss. Không xóa toàn bộ lượt hoặc các đòn nhẹ còn lại.
- Không phá đủ: boss vẫn ra chiêu. Mỗi dấu đã phá giảm 15% sát thương của riêng chiêu đó; người chơi có thể kết hợp phá một phần với Phòng Thủ/khiên/Che Chắn.
- Hết chiêu hoặc bị hủy: kết toán dấu một lần. Lần chuẩn bị sau trở lại ba dấu; không tái tạo liên tục giữa các hit.

### Bộ chiêu và nhịp trận đề xuất

| Chiêu | Hiệu ứng gốc | MP / CD |
| --- | --- | --- |
| Bàn Tay Lấp Thung | 140% ATK vật lí Thổ, đơn mục tiêu | 0 / 0 |
| Bước Chân Chôn Lối | 90% ATK vật lí Thổ toàn đội, giảm 15% SPD trong hai lượt chính người nhận | 10 / 1 |
| Đá Tảng Xuyên Mây | 180% ATK vật lí Thổ đơn mục tiêu, báo người bị nhắm | 12 / 2 |
| Núi Đổ Không Trời | 200% ATK vật lí Thổ toàn đội; dùng cửa sổ Sơn Thế | 24 / 3 |

Hai giai đoạn, chuyển tại 50% HP. Trên 50% dùng một hành động/lượt; dưới 50% dùng hai, tối đa một đòn lớn/lượt. Vòng chiêu cơ bản: Bàn Tay → Bước Chân → chuẩn bị Núi Đổ → giải phóng khi đủ thời gian cảnh báo → Đá Tảng. Giai đoạn hai thêm Bàn Tay vào ô hành động thứ hai; không nhân đôi chiêu lớn.

Chuyển giai đoạn hủy chuẩn bị cũ, không hồi HP/MP hai bên, không reset giới hạn theo vòng. Không lập tức giải phóng Núi Đổ mới ngay tại ngưỡng. Khó hơn Miraebolis nhờ áp lực vật lí diện rộng và tài nguyên phòng thủ, thay vì kéo dài trận bằng lớp giáp bất khả xâm phạm.

## 4. Cửu Vĩ Dệt Chú — áp lực status có thể đọc được

### Luật chung

Boss không gây Choáng, khóa toàn đội liên tục, rút sạch MP tức thì hoặc phạt người chơi vì đã giải hiệu ứng. Sự khó chịu đến từ việc phải chọn **chặn, giải, chịu hay dành MP cho phản công**.

Tái sử dụng các status hiện có: Phong Ấn, Nhiễu Ma Lực, Vết Thương Sâu, Rạn Khiên. Không đổi chúng thành debuff riêng không thể giải; Hộ Ấn và cleanse hoạt động đúng luật. Mỗi kỹ năng áp tối đa hai status bất lợi khác loại lên mỗi người, không đếm số hit để nhân số lần áp.

### Cơ chế: Chú Văn và Bách Chú Quy Tâm

Ở đầu vòng cảnh báo, đánh dấu nghi thức sẽ giải phóng vào lượt boss **vòng sau**. Trong toàn bộ vòng cảnh báo, người chơi thấy dự báo sức mạnh theo từng thành viên.

- Khi giải phóng, mỗi người nhận 130% MAG phép Ám, tăng thêm 15% sát thương cho mỗi **loại debuff còn hiệu lực do chính Cửu Vĩ áp** trên người đó, tối đa ba loại (+45%).
- Tính lại ngay trước damage; giải một loại trong cửa sổ chuẩn bị giảm sức mạnh thực tế. Debuff của đồng đội, tự phạt và Khế Ước không bị lấy làm đầu vào.
- Hộ Ấn ngăn debuff mới nhưng không tự giải loại cũ. Phong Ấn tiêu từng buff nhận mới, không vô hiệu mọi kỹ năng hỗ trợ.
- Không thêm đợt áp debuff ngay trong chính hành động Bách Chú rồi dùng nó để tăng sát thương ngược trở lại.
- Nghi thức không xóa sạch debuff sau khi đánh; từng status tiếp tục hết hạn theo đồng hồ đã khai báo.

### Bộ chiêu và nhịp trận đề xuất

| Chiêu | Hiệu ứng gốc | MP / CD |
| --- | --- | --- |
| Hồ Hỏa Lạc Hồn | 110% MAG phép Ám, đơn mục tiêu | 0 / 0 |
| Lời Mời Dưới Mặt Nạ | 65% MAG phép Ám toàn đội; Phong Ấn một lần/người | 12 / 2 |
| Sợi Chỉ Trói Phép | 140% MAG phép Ám một người; một Nhiễu Ma Lực | 10 / 2 |
| Hương Chú Mòn Thân | 70% MAG phép Ám toàn đội; Vết Thương Sâu và Rạn Khiên trong hai lượt chính người nhận | 18 / 3 |
| Bách Chú Quy Tâm | Đòn nghi thức phía trên, có cảnh báo | 24 / 3 |

Rotation xác định, không quay ngẫu nhiên trúng ba lần anti-heal: Lời Mời → Sợi Chỉ → Hương Chú → chuẩn bị nghi thức → giải phóng → Hồ Hỏa. Việc chuẩn bị dùng một ô hành động và không trừ MP trước; MP/CD tính khi giải phóng, không đủ thì dùng đòn miễn phí và hủy nghi thức.

Hai giai đoạn tại 50% HP. Một hành động/lượt ở đầu; hai ở cuối, nhưng ô thứ hai chỉ dùng Hồ Hỏa, tối đa một chiêu áp hiệu ứng hoặc nghi thức/lượt. Hương Chú không được giải phóng cùng lượt với Bách Chú. Chuyển giai đoạn không hồi MP, không làm mới các debuff đã áp và không xóa lượt đáp trả đã hứa cho người chơi: hủy nghi thức cũ rồi cảnh báo lại đầy đủ nếu cần.

Đây là trận cần hỗ trợ giải hiệu ứng/miễn hiệu ứng hoặc phương án dồn sát thương có tính toán; không yêu cầu đúng một healer mới. Phải thử cả tuyến nhân vật cũ có Thông Thạo, không chỉ đội chống status tối ưu.

## 5. Song Quỷ Trấn Môn — hai boss, một kế hoạch phối hợp

### Đơn vị và ngân sách lượt

Lôi Quỷ và Phong Quỷ là hai actor độc lập: hai HP/MP, hai bộ status/CD, hai ô hàng lượt. Không dùng chung thanh HP. Tổng ban đầu **hai hành động mỗi vòng**, mỗi boss một; không vô tình cấp hai hành động cho từng boss ngay từ đầu.

- Lôi Quỷ thiên vật lí và áp lực khiên; Phong Quỷ thiên phép và bảo vệ đồng bọn.
- Cơ chế phối hợp do một controller của encounter sở hữu; không để hai boss tự tạo hai bản nghi thức.
- Chỉ thắng khi cả hai thực sự gục. Hạ một boss vẫn cho trigger hạ địch thông thường đúng một lần, chưa phát thưởng trận.
- Không bắt buộc hạ trong ba vòng, không hồi sinh vô hạn. Tránh lặp lại bài toán Tam Đầu ở Khúc Ca Ngoài Sử Sách.

### Bộ chiêu đề xuất

| Chủ | Chiêu | Hiệu ứng gốc | MP / CD |
| --- | --- | --- | --- |
| Lôi Quỷ | Chùy Sấm Giáng Môn | 140% ATK vật lí Lôi, đơn mục tiêu | 0 / 0 |
| Lôi Quỷ | Lôi Chấn Phá Trận | 90% ATK vật lí Lôi toàn đội, Rạn Khiên hai lượt chính | 12 / 2 |
| Phong Quỷ | Phong Nhận Trấn Môn | 140% MAG phép Phong, đơn mục tiêu | 0 / 0 |
| Phong Quỷ | Màn Gió Hộ Huynh | Khiên cho hai boss bằng 180% RES hiện tại của Phong Quỷ | 14 / 3 |
| Cả hai | Thiên Môn Lôi Bạo | Một đợt 110% ATK vật lí Lôi và một đợt 110% MAG phép Phong lên toàn đội, có cảnh báo | Mỗi boss 16 / chu kỳ phối hợp bốn vòng |

Nghi thức đầu tiên cảnh báo ở đầu vòng 3, hai đợt giải phóng tại lượt của từng boss ở vòng 4, thay hành động thường của chúng. Không tạo hành động ngoài hàng lượt; thứ tự hai đợt theo SPD thực tế.

Trong vòng cảnh báo, đòn đánh điểm yếu gây damage phá một dấu **Liên Kết**, tối đa một dấu/lần thi triển/boss; cần hai dấu trên **cùng một boss** để hủy phần nghi thức của boss đó. Mỗi boss có hai dấu riêng, có thể ngắt một hoặc cả hai. Phản ứng trực tiếp được tính, DoT không. Phần bị ngắt thay bằng đòn miễn phí đơn mục tiêu; không biến cả vòng thành đứng yên.

Hạ một boss hủy ngay phần nghi thức còn chờ của cả cặp. Nếu phần của boss kia đã ra thì không hoàn tác damage, không giải phóng thêm phần của người đã chết. Khiên đã tạo giữ nguyên luật khiên thông thường, không tự nhân đôi hoặc biến thành miễn nhiễm.

### Khi chỉ còn một boss

Hiện cảnh báo **Độc Giữ Thiên Môn** ngay khi đồng bọn gục. Boss sống sót nhận hai hành động/lượt **từ đầu Vòng Chính kế tiếp**, không thêm hành động hồi tố vào vòng đang chạy; tăng 15% sát thương đầu ra, không hồi đầy HP/MP. Vòng chiêu còn lại luân phiên đòn miễn phí và chiêu áp lực của bản thân; không tiếp tục nghi thức hai người.

Tổng số hành động tối đa mỗi vòng vẫn là hai. Giết Phong Quỷ trước loại lớp khiên/phép nhưng để lại Lôi Quỷ đánh vật lí dồn dập; giết Lôi Quỷ trước giảm áp lực vật lí nhưng để lại Phong Quỷ có khiên và phép. AoE và đơn mục tiêu đều có lý do sử dụng.

## 6. Đồng hồ, cảnh báo và kết thúc

Áp dụng [COMBAT_LIFECYCLE_CONTRACT](COMBAT_LIFECYCLE_CONTRACT.md):

| Thành phần | Chủ đồng hồ và kết toán |
| --- | --- |
| Cửa sổ phản ứng chiêu lớn | Cảnh báo chính thức tại đầu Vòng Chính R, giải phóng không sớm hơn lượt boss ở R+1. Nếu một hành động giữa vòng R mới chuẩn bị thì cảnh báo ở đầu R+1, giải phóng ở R+2. Không lấy thời gian animation làm đồng hồ |
| MP/CD chiêu lớn | Chuẩn bị tốn ô hành động; trả MP và bắt đầu CD khi thực sự giải phóng. Hủy không trả hai lần. Chiêu CD3 dùng ở R thì sớm nhất R+4 dùng lại |
| Sơn Thế / Liên Kết | Charge trong một nghi thức, chỉ thay đổi bởi hành động hợp lệ. Tối đa một kết toán trên mỗi boss mỗi cast; hủy/giải phóng/nguồn gục đều cleanup một lần |
| Vỡ Thế | Áp ngay lúc phá dấu cuối; còn hiệu lực đến hết lượt chính kế tiếp của Cự Quỷ, không hết sớm vì có hai move hoặc người chơi nhận Lượt Thêm |
| Debuff hai lượt chính | Đồng hồ người nhận; lượt bị bỏ vẫn trôi, Lượt Thêm không trừ. Phong Ấn/Nhiễu Ma Lực là charge, không gán thời hạn hai lượt cho chúng |
| Đếm loại debuff của Cửu Vĩ | Truy nguồn status còn hiệu lực; không đếm hai stack cùng loại thành hai loại, không đếm debuff trên người đã gục |
| Độc Giữ Thiên Môn | Controller ghi nhận mất đồng bọn một lần; kích hoạt đầu vòng kế tiếp; tồn tại đến hết trận, không thể xóa như buff thường |
| Chuyển phase | Không là encounter mới; giữ HP/MP, buff, debuff, mode, tài nguyên, CD và quota của người chơi. Hủy cảnh báo cũ có log rõ ràng; không hoàn MP hoặc kích mode-exit nếu mode chưa rời sân |
| Thua / bỏ / Đánh lại | Kết thúc và dọn controller/hiệu ứng một lần; Đánh lại tạo trận mới hoàn toàn. Không mang dấu nghi thức sang lần sau |

Boss miễn Choáng. Không mở lại ngoại lệ tự Choáng của Nhện Khổng Lồ cho các boss này. Nếu điều khiển thứ tự lượt/SPD làm lịch boss thay đổi, deadline cảnh báo vẫn giữ theo vòng và UI phải cập nhật vị trí hành động.

## 7. UI, âm thanh và phần thưởng

- Trong Phương Đông có nhóm **Đại Yêu Ma** sau Orochi. Trước mở khóa hiện một mục khóa với điều kiện rõ, không để route trực tiếp bỏ qua kiểm tra core.
- Thẻ giới thiệu từng trận cho biết loại damage, điểm yếu, cơ chế chính và bốn mức Lv60/70/80/90. Trinh sát dùng chỉ số đã scale, không lấy số nền Lv1 để trưng bày.
- Mọi boss đang sống có thanh HP và cảnh báo riêng. Thanh cơ chế song trùm có hai phần tên rõ ràng; không lấy boss đầu tiên trong mảng làm đại diện cho cả trận.
- Cảnh báo ưu tiên: tên chiêu, ai đang chuẩn bị, mục tiêu, vòng giải phóng, cách giảm nguy cơ. Ví dụ: **“Núi Đổ Không Trời · giải phóng vòng tới · Sơn Thế 2/3”**. Không chỉ dùng flash/màu hoặc log có thể đang bị tắt.
- Di chuyển target bằng chuột/tay cầm theo đơn vị thực; Cự Quỷ ba ô chỉ là một điểm focus. Layout nhỏ giữ icon, HP và cảnh báo đọc được, không làm ba cột tràn ngang.
- BGM đề xuất ba ID riêng: `east_great_mountain`, `east_great_fox`, `east_great_twins`; chưa khẳng định có file. Chưa có asset thì dùng track boss Phương Đông hiện hữu qua mapping hợp lệ. Không restart nhạc mỗi phase hoặc lúc một boss song trùm chết.
- VFX: Cự Quỷ dùng bụi/địa chấn, Cửu Vĩ dùng bùa và hồ hỏa, Song Quỷ dùng hai màu lôi/phong. Luôn giữ lớp trạng thái và dự báo damage phía trên; hỗ trợ giảm chuyển động.
- Đề xuất bản đầu giữ luật siêu trùm hiện hành **1.000 Coin/trận**, không EXP; không tự thêm farm Pure/Original, Blueprint hoặc Trấn mới. First-clear/chiến tích riêng theo từng cấp là phần có thể bổ sung sau, chưa có phần thưởng mới được chốt.

## 8. Khoảng trống engine và thứ tự triển khai

Các tên field/module mới trong phần này là **đề xuất**, không phải API đã có.

### Bước 1 — dữ liệu, mở khóa và cấp

- Tách module dữ liệu Đại Yêu Ma khỏi 33 encounter hiện tại; nối chung hai content loader như `east-campaign.js` đang làm.
- Đề xuất category `east_super`, ID `east_super_mountain`, `east_super_fox`, `east_super_twins`; mở rộng validator, catalog, trinh sát và router tương ứng. Không gán cứng `east_55` cho nhóm mới.
- Khai báo `rewardTier: super`, `hpScalingProfile: superboss`, `referenceLevel: 1`, `hpReferenceLevel: 1`, `superLevels: [60,70,80,90]`, cờ `east_campaign_completed`.
- Hiện validator `content.js` giới hạn `superLevels` theo một số ID/trial: phải đổi thành kiểm tra capability có điều kiện, không thêm liên tiếp ngoại lệ ID.
- `encounterReturnPath()` hiện ưu tiên `superLevels` về tab Hiểm Ác: sửa thứ tự/metadata route để Đại Yêu Ma luôn trở lại Phương Đông và giữ cấp đang chọn. Không làm mất đường về của Alice/Miraebolis cũ.
- Ghi nhận thắng Orochi bằng handler hiện hữu, idempotent; save cũ đã có cờ mở được ngay. Nếu gặp hồ sơ có receipt Orochi nhưng thiếu cờ, chuẩn hóa từ receipt hợp lệ một lần, không tặng thưởng lại.

### Bước 2 — footprint và controller trận

- Bổ sung footprint trình bày ba cột, định danh actor không đổi. Các selector mục tiêu vẫn dựa actor; vùng hình ảnh/neo VFX được ánh xạ riêng.
- Controller encounter quản lý nghi thức nhiều chủ, deadline vòng, hủy và kết quả; `bossState` theo actor hiện có vẫn quản lý phase/rotation từng boss.
- Hiện validator chặn encounter nhiều scripted boss. Mở hỗ trợ theo capability sau khi audit các đường chọn boss/UI/forecast/victory; không chỉ xóa dòng kiểm tra rồi cho chạy.
- Thử controller với hai dummy boss trước khi ghép boss thật. Mọi diễn biến có thứ tự quyết định được và dùng RNG của battle nếu cần; không dùng timer UI để quyết định cơ chế.
- Controller và telegraph phải được clone/snapshot cho forecast; nếu có luồng khôi phục trận hiện hành phải giữ deadline và dấu. Không tự hứa thêm chức năng lưu trận mới.

### Bước 3 — ba trận và UI

1. Cự Quỷ: xác minh footprint/AoE trước, rồi Sơn Thế và chuyển giai đoạn.
2. Cửu Vĩ: tái sử dụng status, thêm theo dõi nguồn Chú Văn và dự báo theo từng mục tiêu.
3. Song Quỷ: hai boss thực, nghi thức chung, xử lý chết giữa chuỗi phản ứng và giai đoạn còn một boss.
4. Ghép trinh sát, điều khiển, nhạc fallback và cảnh báo luôn hiện; kiểm tra trong browser trước khi đóng gói.

### Bước 4 — cân bằng và xuất bản

Chạy đối chứng với Miraebolis, tune từng trục thay vì sửa công thức level chung. Sau gameplay/source changes chạy validation, test liên quan, cập nhật graph và tài liệu chuyên đề. Chỉ build EXE sau khi triển khai và kiểm chứng; đợt lập kế hoạch ban đầu chưa sửa gameplay.

## 9. Ma trận kiểm thử và điều kiện nghiệm thu

### Hồi quy chức năng bắt buộc

- Mở khóa: chưa thắng Orochi bị chặn ở UI lẫn core; đã nhận thắng mở cả ba và cả bốn cấp; nhận kết quả hai lần không cộng thưởng/cờ hai lần.
- Cấp: từ chối cấp ngoài tập; HP đúng đường superboss và mốc Lv1; trinh sát bằng battle; không nhân hai lần.
- Cự Quỷ: AoE một lần/hit, random/multihit đúng count, đòn lan không tạo địch giả, chia damage theo số địch đếm một; chọn ba vùng cùng actor. Kiểm tra Remulia, Yukino, Chiyoko, Anabel, Siesta cùng gear Liên kích/đánh lan.
- Dấu nghi thức: đánh hụt, không gây damage, chỉ chặn debuff, nhiều hit, Liên kích, phản công, DoT; charge không mất/tạo gấp đôi; action bị từ chối không đổi state.
- Status: Hộ Ấn chặn từng debuff, cleanse đúng nguồn/loại, Phong Ấn không xóa buff cũ, Nhiễu Ma Lực không ăn vào chiêu trả tài nguyên; anti-heal gồm hút máu, Rạn Khiên không giảm khiên cũ.
- Đồng hồ: đi qua `beginTurn`/bỏ lượt/vận sức/kết vòng thực tế, Vòng Phụ, thay SPD, chuyển phase giữa phản công; không chỉ gọi trực tiếp helper tick.
- Song trùm: hai thứ tự hạ; cùng gục trong AoE; một boss gục trước phần nghi thức; đồng bọn gục khi survivor đã đi hoặc chưa đi; thêm hành động chỉ từ vòng kế. Không reward sớm hoặc mắc kẹt hàng lượt có người chết.
- Tương tác phase/mode: Astoria, Sylva, Drake, Monica, Auguste và mode tiêu tài nguyên không bị reset, exit/refund hai lần hoặc miễn phí tái triệu hồi.
- Forecast/clone không tiêu dấu hay MP của trận thật; snapshot giữ state; Đánh lại không thừa dấu. AI nhận cùng kiểm tra kỹ năng/mục tiêu, không gian lận biết random tương lai.
- UI/E2E: độ rộng màn hình nhỏ, tay cầm, target ba ô, hai thanh HP, cảnh báo khi Battle Logs tắt, trở về giữ cấp và đúng nhóm.

### Playtest độ khó so với Miraebolis

Dùng cùng ít nhất **30 seed ghép cặp** cho từng boss/cấp/build, sau đó tăng 100 seed cho ca lệch hoặc trận dựa né/proc. Seed tái hiện đầy đủ, không bỏ seed thua/chạm giới hạn vòng. Ghi cả thắng, thua, bỏ cuộc và chạm giới hạn riêng.

Các nhóm đội: đội miễn phí Arthur/Iris/Takeshi/Fiona/Senya với hỗ trợ phù hợp; nhân vật đời đầu Rank5/Thông Thạo3; Hồn Kiếm; đội gacha khác như Vertosse; đội đơn mục tiêu, AoE và chống hiệu ứng. Không bắt mỗi đội nguyên xi phải thắng cả ba boss; giữ ngân sách build tương đương khi đổi người để đáp ứng cơ chế.

Mỗi fixture ghi Level và điểm phân bổ thực, Rank/Thông Thạo từng chiêu, ô trang bị, Trấn/T4/dòng phụ, mở khóa nội tại, buff chuẩn bị, thứ tự đội và policy. Không coi “đều Lv50” là cùng sức mạnh; không dùng toàn gear godroll làm điều kiện ngầm cho Lv60.

Mục tiêu ban đầu để tune, không phải cam kết kết quả:

- Trên các fixture đủ sức thắng Miraebolis cùng cấp từ 70% seed trở lên, đội đã thích nghi với cơ chế mới nên khó hơn khoảng **10–25 điểm phần trăm tỉ lệ thắng**, hoặc đòi hỏi dùng thêm công cụ chiến thuật rõ ràng. Không ép fixture vốn đã thua Miraebolis trở thành thước đo duy nhất.
- Đội chuẩn bị tốt vẫn có phương án thắng Lv60 với nhân vật miễn phí/đời đầu và đầu tư cuối game hợp lý. Lv90 dành cho build và thực thi tối ưu; không yêu cầu mọi đội starter thắng.
- Nhắm thời lượng thắng trung vị khoảng **12–22 vòng**; dài hơn phải xem có phải HP/DR thừa không. Không tăng HP chỉ để đạt chữ “khó”.
- Ghi sát thương nhận vào, MP còn, số người gục, lượt Phòng Thủ, nghi thức bị ngắt/ăn trọn, cleanse/Hộ Ấn thực sự phát huy. Một boss bị vô hiệu hoàn toàn bởi vòng lặp khiên–Phòng Thủ hoặc chỉ thắng bằng né may mắn chưa đạt.
- Không có đòn báo trước nhưng người chơi thực tế không nhận được lượt đáp trả, không có mất trận do UI giấu mục tiêu hoặc boss nhận thêm hành động ngoài ngân sách.

Chỉ công bố “khó hơn Miraebolis” sau khi các ca ghép cặp và playtest tay xác nhận. Nếu Cửu Vĩ chỉ tăng độ khó cho đội không cleanse, hoặc song trùm bị AoE xóa nhanh hơn Miraebolis, phải tune cơ chế đó thay vì lấy tổng HP làm bằng chứng.

## 10. Ranh giới của bản kế hoạch

Đã cụ thể hóa: điều kiện Orochi, bốn cấp, ba loại trận, quy tắc thân ba ô, ngân sách hành động, cửa sổ cơ chế, đường tăng trưởng, các điểm engine phải mở rộng và bộ kiểm chứng.

Chưa được nghiệm thu: số cân bằng, asset/BGM mới, phần thưởng đặc biệt. Đợt lập kế hoạch ban đầu không đổi schema hoặc hồ sơ thật. Bản triển khai và báo cáo playtest đã được tách sang tài liệu hiện hành; không coi mọi con số đề xuất trong bản lưu này là cơ chế đã phát hành.
