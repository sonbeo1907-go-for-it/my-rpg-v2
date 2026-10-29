# Gameplay trong bản mẫu

Vai trò và nguyên tố giữ theo yêu cầu. Chi tiết kỹ năng dưới đây là triển khai thử nghiệm để phát triển tiếp, không xác định thêm canon của nhân vật.

Mọi nhân vật có lệnh Phòng thủ: giảm 40% sát thương đến hết lượt kế tiếp, đồng thời hồi ngay 5% MP tối đa của bản thân, làm tròn lên và không vượt trần MP. Dùng MP tối đa đã cộng trang bị trong snapshot trận; không hồi cho người khác, không hồi HP, không thêm hồi chiêu. Nhật ký và sự kiện `mp_restore` ghi đúng lượng thực hồi. Ví dụ 92 MP tối đa hồi 5, 60 MP hồi 3, đã đầy thì không phát sinh hồi MP. Không thay đổi lượng hồi 20% MP từ Aurora.

Save chỉ mở sẵn Arthur, Iris, Takeshi, Elaine, Garrek và Fiona. Các nhân vật khác có preview, mở qua banner hoặc Shop. Thưởng chiến thắng: thường 50 Coin, boss 150 Coin, siêu trùm 1.000 Coin. Đổi 300 Coin lấy 1 Prisma tím; quay 1/10 tốn 1/10 Prisma (30% gear thấp, 50% gear trung, 15% gear cao, 5% nhân vật; bảo hiểm ở lượt 50 liên tiếp chưa ra nhân vật). Mảnh cũ giữ số dư và đổi tên thành Pure Prisma vàng cam: 120 đổi một nhân vật tự chọn chưa sở hữu. Mỗi người có 3 ô gear; mỗi dupe mở thêm 1 ô đến 6 và cho 10 Pure Prisma. Tổng chỉ số cộng trước nội tại/buff %, áp dụng vào preview và trận mới. Save cũ giữ Coin/Pure Prisma/pity, Prisma thường khởi tạo 0. v1 cấp bù chiến thắng theo mức lịch sử 100 Coin; v2 giữ gear ở ô đầu. Không suy đoán lịch sử dupe cũ để cấp bù ô.

| Nhân vật | Nguyên tố / vai trò | Đã hoạt động |
|---|---|---|
| Arthur | Light / DPS vật lí | Cộng hưởng, giải phóng, Kiệt sức, thay kỹ năng và mở kỹ năng qua mốc truyện |
| Iris | Plain / hỗ trợ tấn công | Buff sát thương một lần, tăng ATK/MAG, Dữ liệu và cường hóa toàn đội |
| Takeshi | Wind / DPS vật lí né phản công | Thế né có khiêu khích, phản công giới hạn theo vòng, tích Sơ hở |
| Fiona | Dark / DPS ma pháp | Prisma riêng trên mục tiêu, tối đa 3 mảnh, gieo diện rộng và kích nổ |
| Elaine | Water / hỗ trợ phòng thủ | Khiên cá nhân/toàn đội, kháng phép, hồi ít HP khi khiên bị phá |
| Garrek | Earth / tank | Đỡ đòn thay đơn mục tiêu, tự giảm sát thương, phối hợp bảo vệ và giảm sát thương |
| Dain | Plain / đấu sĩ | Mỗi Quyết tâm +15% ATK; Gồng mình tích điểm khi chịu đòn hoặc tấn công; Trọng kích xuyên giáp, tiêu điểm sau khi đánh |
| Rowan | Wind / DPS cung | Chuẩn bị Điểm ngắm, bắn xuyên giáp, liên xạ |
| Freya | Fire / DPS ma pháp | Tích Nhiệt, xả sát thương diện rộng, tiêu Nhiệt hồi MP |
| Arden | Earth / hỗ trợ phòng thủ | Hồi phục theo lượt, tăng DEF/RES cá nhân, hồi theo lượt toàn đội |
| Rhett | Thunder / DPS vật lí | Nạp và tiêu Điện tích, đạn đơn mục tiêu và quá tải diện rộng |
| Galliard | Water / tank | Khiêu khích, giảm sát thương và tăng DEF toàn đội |
| Armie | Water / hỗ trợ phòng thủ | Hồi HP tức thời, giải debuff, hồi mạnh hơn cho người nguy cấp |
| Fran | Dark / hỗ trợ phá phòng thủ | Giảm DEF, giảm RES, lời nguyền diện rộng kết hợp được với hai loại trên |
| Aurora | Thunder / hỗ trợ tấn công, Sub DPS | Buff MAG, phép đơn mục tiêu/diện rộng, liên kích một lần/vòng để tích Lôi ấn, hồi MP toàn đội đầu lượt khi đủ 2 ấn |
| Lisbeth Ranoc | Light / DPS ma pháp đơn mục tiêu | MAG nền 42, nội tại +20% MAG, tự buff MAG, phép đơn mục tiêu hệ số và chi phí MP cao; 110 HP |
| Kai | Thổ / độc và hỗ trợ phòng thủ | Cậu bé ngưỡng mộ Garrek; độc 3 đầu lượt, khiên nhỏ, +15% DEF toàn đội, giảm 6% sát thương tự nhận; thưởng lần đầu màn tập kích |
| Benard | Phong / sát thương vật lí đơn mục tiêu | Kị sĩ thủ đô dùng song kiếm; mỗi nhát thêm 50% SPD, chém đôi, trọng kích và +40% SPD; có trong banner thường |
| Lanceveil | Hỏa / đấu sĩ, hỗ trợ phòng thủ | Kị sĩ thủ đô cầm thương và khiên; hai đòn vật lí đơn mục tiêu, giảm sát thương toàn đội; có trong banner thường |
| Gahallad | Ám / DPS vật lí phá khiên | Thống soái Hắc Kị; cưỡi ngựa +15% ATK và Phá Thành; tự phá khiên cường hóa đòn kế tiếp ×2; có trong banner thường |
| Gawain | Lôi / DPS vật lí đa mục tiêu | Kĩ sĩ đoàn trưởng dùng đại kiếm; mây giông đánh đầu lượt, tích 10%/20% ATK đến khi mây tan; có trong banner thường |
| Lucien Valmont | Thường / DPS phép đa mục tiêu | Hai phép diện rộng, +25% RES toàn đội 2 lượt; mỗi Valmont khác trong đội +2 MAG căn bản |
| Seraphine Valmont | Thường / Đấu sĩ | 200 HP; đánh thường 60% ATK + 60% MAG; Kiếm quyết 100% ATK + 100% MAG, 5 MP; Ấn kiếm 200% ATK + 200% MAG, 15 MP, hồi 2 vòng; tự buff cả hai +30% trong 3 lượt; mỗi Valmont khác +1 ATK/MAG căn bản |
| Lyon | Thổ / tank vật lí | Khiên toàn đội 150% DEF, +25% DEF đội 2 lượt, Hộ ấn chặn một debuff mới; mỗi Valmont kể cả Lyon cấp +1 DEF/RES căn bản cho mọi Valmont |
| Cedric | Phong / hỗ trợ vật lí | +25% ATK/MAG đội 2 lượt, hồi HP đội bằng 8 + 100% ATK; cuối lượt bản thân hồi 2% MP tối đa cho đồng đội còn sống, 4% với Valmont |

## Đội Valmont

Bốn nhân vật có trong banner thường, mặc định khóa như các nhân vật bổ sung khác. Lyon/Cedric có tag Valmont dù tên không chứa họ. Bonus đội hình là chỉ số căn bản cộng trước buff %, gồm trang bị; chốt lúc bắt đầu trận và không mất khi đồng đội gục. Đội đủ bốn: Lucien 42 MAG, Seraphine 34 ATK/33 MAG, mỗi người +4 DEF/RES từ Lyon. Lyon 38 DEF tạo 57 khiên/người; sau buff +25% DEF tạo 71 khiên/người. Cedric ATK 25 hồi 33 HP/người, sau buff +25% ATK hồi 39 HP/người.

Đòn lai của Seraphine gồm hai phần liên tiếp trong cùng hành động: ATK vật lí tính DEF, MAG ma pháp tính RES; mỗi phần tự xét điểm yếu, né và khiên. Phần phép có thể kích hoạt liên kích Aurora theo hạn mức chung một lần/vòng. Nếu phần vật lí đã hạ mục tiêu thì không đánh tiếp phần phép. Buff tự thân tăng cả hai phần; MP/hồi chiêu chỉ tính một lần cho hành động.

Hộ ấn bất xâm: 8 MP, hồi 2 vòng, một đồng đội; chặn đúng một debuff mới từ địch, không chặn sát thương hoặc cả gói nhiều debuff, không giải debuff cũ và không xóa hình phạt tự gây. Giữ đến khi tiêu hết hoặc hết trận, dùng lại không cộng dồn. Nội tại Cedric làm tròn MP lên, giới hạn tối đa; bị choáng vẫn kích hoạt, gục thì không; không hồi cho đồng đội đã gục.

## Gawain

185 HP, 80 MP, ATK 33, MAG 10, DEF 22, RES 18, SPD 15. Thiên lôi tụ trận: 12 MP, hồi 3 vòng, tạo Mây giông trong 3 lượt tiếp theo của bản thân. Lôi đình phá trận: 90% ATK vật lí Lôi toàn địch, 9 MP. Thiên phạt trọng trảm: 145% ATK vật lí Lôi toàn địch, 16 MP, hồi 2 vòng. Lôi vực giáng lâm là đòn tự động từ mây: 60% ATK vật lí Lôi toàn địch, không tốn MP/lượt, không chọn thủ công.

Nội tại Uy lôi tăng 10% ATK nền gồm gear ở mỗi đầu lượt còn mây, tối đa 20%, tính trước sát thương mây và cộng tỷ lệ với buff/debuff ATK khác. Mây hết ở cuối lượt hành động thứ ba sau khi gọi, xóa ngay toàn bộ bonus. Khi Gawain gục, mây bị xóa; độc đầu lượt có thể hạ anh trước khi mây đánh. Khi choáng nhưng vẫn sống, mây vẫn đánh ở đầu lượt rồi lượt chủ động bị bỏ qua, thời hạn giảm một lần như thường lệ.

| Vòng, khi gọi lại ngay và đủ MP | Mây | ATK nội tại |
|---|---|---|
| 1 | Gọi mây; chưa có đòn tự động | 0% |
| 2 | Đầu lượt đánh lần 1 | +10% |
| 3 | Đầu lượt đánh lần 2 | +20% |
| 4 | Đầu lượt đánh lần 3; mây tan sau hành động | +20%, rồi về 0% |
| 5 | Gọi lại đã hết hồi chiêu; chưa đánh | 0% — một vòng downtime |
| 6 | Mây mới đánh lần 1 | +10% |

Cooldown ghi 3 nghĩa là không dùng ở vòng 2/3/4, dùng lại từ vòng 5 theo engine hiện tại. Điều này bảo đảm một vòng gián đoạn khi gọi lại đúng hạn; thiếu MP, bị choáng vào lượt gọi hoặc tự trì hoãn có thể làm gián đoạn lâu hơn. Mỗi lần gọi mới bắt đầu tích lại từ 0, không giữ 20% của mây trước.

Đòn mây là sát thương tự động diện rộng, dùng DEF để giảm, hưởng điểm yếu và buff chỉ số thông thường. Không hưởng hoặc tiêu buff dành cho đòn kế tiếp như Công thức cường hóa/Sát uy dư chấn, không kích hoạt liên kích Aurora hay phản công dây chuyền. Gawain vẫn hành động bình thường sau đòn mây; nếu mây kết liễu địch cuối, trận kết thúc ngay. Mây Lôi có thể tích Kìm hãm Miraebolis, một lần mỗi đợt đánh, và chuyển phase theo các quy tắc HP/MP chung.

## Gahallad

180 HP, 65 MP, ATK 34, MAG 8, DEF 20, RES 17, SPD 17. Hắc kỳ giáng thế là lệnh bật/tắt thế cưỡi ngựa, không tốn MP nhưng tốn một lượt. Khi bật, `black_cavalry` tăng 15% ATK nền (gồm gear) và cấp buff riêng **Phá Thành** (`siegebreaker`): +100% sát thương lên mục tiêu có khiên. Trạng thái duy trì đến khi tắt hoặc hết trận, không cộng dồn. Thiết kị nghiền trận: 135% ATK Ám, 6 MP; Vạn vó chôn quân: 240% ATK Ám, 14 MP, hồi 2 vòng. Cả hai là vật lí đơn mục tiêu.

Phá Thành kiểm tra theo từng hit, nhân riêng sau buff sát thương chung và trước khiên; gồm cả sát thương tràn vào HP. Có thể cấp trực tiếp `siegebreaker` cho nhân vật khác trong một số lượt hoặc duy trì. Xuống ngựa chỉ kết thúc Phá Thành do mode cấp, không xóa bản buff độc lập. Hai nguồn cùng ID không cộng thành hai lần sát thương. Save cũ tự thêm hồ sơ khóa; mở qua banner/đổi mảnh, bản trùng theo luật gear slot hiện có.

Nội tại **Sát uy dư chấn** (`shield_break_attack_buff`): khi chính Gahallad đánh vào kẻ địch có khiên và làm khiên về 0, sau toàn bộ hành động nhận `cavalry_momentum`. Đòn tấn công kế tiếp nhân sát thương ×2, kể cả mọi hit của kỹ năng, nhân riêng với Công thức cường hóa, Phá Thành và Vỡ kén. Buff mới không tăng các hit còn lại của chính hành động phá khiên. Phòng thủ/bật tắt mode giữ buff; tấn công bị né vẫn tiêu buff. Nếu đòn đang được cường hóa tiếp tục phá khiên, tiêu buff cũ rồi cấp một buff mới. Không cần cưỡi ngựa để kích hoạt; hạ gục mục tiêu trong cùng đòn phá khiên vẫn cấp buff. Phản công/liên kích nếu có thể nhận buff cũng dùng một lần cho toàn bộ phản ứng. Mỗi lần tạo lại chỉ làm mới, không tích tầng, không mang sang trận tiếp theo.

## Dain

Quyết tâm vẫn tối đa 3. Nội tại Ý chí đấu sĩ tăng 15% ATK nền mỗi điểm, tối đa +45%; tính trên ATK gồm trang bị và cộng tỷ lệ với buff/debuff ATK. ATK nền 35 trở thành 40,25 / 45,5 / 50,75 ở 1 / 2 / 3 điểm. Điểm chỉ thuộc trận, không lưu vào campaign.

Gồng mình tốn 5 MP, giảm 25% sát thương và kéo dài 3 lượt hành động tiếp theo của Dain. Mỗi hit chịu đựng (kể cả vào khiên) vẫn tạo 1 điểm. Khi buff còn hiệu lực, mỗi hành động tấn công chủ động có 50% cơ hội tạo 1 điểm sau khi đánh, xét một lần cho cả hành động thay vì mỗi hit; dùng Phòng thủ/hỗ trợ không tạo điểm từ cơ chế này. Tank có thể nhận đòn thay mà Dain vẫn tích điểm qua tấn công. Không tạo thêm khi đã đủ 3.

Trọng kích tốn 10 MP và toàn bộ điểm hiện có, yêu cầu ít nhất 1. Hệ số 120% ATK + 80% ATK mỗi điểm, xuyên 30% DEF. ATK vẫn nhận đủ nội tại theo số điểm khi gây sát thương; sau toàn bộ hiệu ứng mới trừ số điểm đã dùng. Sau đó Gồng mình có thể tạo 1 điểm mới, giữ cho đòn kế tiếp. Với 3 điểm: 360% của ATK đã tăng 45%, tương đương 522% ATK nền trước DEF và các hệ số khác. Không có trang bị/buff, đánh tay sai vua chằn DEF 27 gây 172 sát thương. Điểm mới không tăng ngược sát thương của chính đòn vừa đánh.

## Lanceveil

Định hướng 70% tấn công / 30% phòng thủ là tỷ trọng vai trò, không phải hệ số tự nhân sát thương. Chỉ số nền: 225 HP, 60 MP, ATK 32, MAG 12, DEF 26, RES 20, SPD 16. Nội tại giảm 8% sát thương tự nhận. Hỏa thương: 135% ATK Hỏa, 5 MP; Liệt hỏa phá trận: 220% ATK Hỏa, xuyên 25% DEF, 13 MP, hồi 2 vòng; Khiên lửa hộ quân: cả đội giảm 15% sát thương nhận trong 2 lượt mỗi người, 12 MP, hồi 3 vòng. Cùng buff không cộng dồn, dùng lại làm mới. Không có khiêu khích hoặc nhận đòn thay, nên phòng thủ chủ động nhẹ hơn Garrek/Galliard. Save cũ thêm hồ sơ Lanceveil ở trạng thái khóa; chiêu mộ hoặc đổi mảnh để mở.

## Kai và Benard

Kai: 185 HP, 65 MP, ATK 24, MAG 20, DEF 23, RES 18, SPD 17. Độc 6 MP, 3 đầu lượt, lượng cơ bản 12 HP/lần; khiên 7 MP, 26 điểm; Tập giữ hàng 10 MP, +15% DEF toàn đội trong 2 lượt, hồi 2 vòng. Không có hồi HP hoặc đỡ đòn thay. Sát thương độc dùng ATK, hỗ trợ dùng MAG nên cần chọn ưu tiên trang bị.

Benard: 160 HP, 65 MP, ATK 27, MAG 10, DEF/RES 15, SPD 30. Song kiếm cuồng phong 5 MP, 70% ATK × 2 hit; Nhất thiểm 14 MP, 70% ATK + 100% SPD, hồi 2 vòng; Nhịp gió 10 MP, +40% SPD trong 3 lượt tiếp theo, hồi 3 vòng. Mỗi hit vật lí cộng thêm 50% SPD hiệu lực từ nội tại, nên Nhất thiểm có tổng 150% SPD; không có né/phản công như Takeshi hoặc đòn diện rộng.

Mốc cân bằng Nhất thiểm: bốn gear SPD +3 cho ATK 27/SPD 42; Nhịp gió tăng SPD lên 58,8. Trước Phi long cánh rách DEF 25, yếu Phong, có Công thức cường hóa (+40% sát thương) gây 196 sát thương; thêm Hiệu chỉnh (+20% ATK) gây 203. Đây là mốc theo đội hình/buff cụ thể, không cố định sát thương lên mọi địch. Bốn gear ATK +3 trong điều kiện Nhịp gió + Công thức gây 160. Chỉ Nhất thiểm đổi hệ số, đánh thường và Song kiếm giữ nguyên.

## Lisbeth Ranoc — Di sản khế ước

Quý tộc nhà Ranoc có tổ tiên lập khế ước với quỷ để nhận sức mạnh ma pháp vượt trội. Lisbeth kiêu ngạo, tsundere; lore không đổi nguyên tố Light của cô.

Chỉ số thử nghiệm: 110 HP, 90 MP, ATK 8, MAG cơ bản 42, DEF 10, RES 25, SPD 16. Nội tại **Di sản khế ước** tăng 20% MAG vĩnh viễn, thành 50,4. Menu hiển thị cả giá trị này và MAG gốc 42. Không làm tròn MAG thành số nguyên trước khi tính sát thương.

- **Kiêu hãnh Ranoc:** 12 MP, tự +50% MAG cơ bản trong 3 hành động tiếp theo, hồi 3 vòng. Nội tại và buff cộng tỷ lệ trên cùng nền: `42 × (1 + 0.2 + 0.5) = 71.4 MAG`.
- **Quang thương:** 16 MP, 190% MAG, ma pháp Light đơn mục tiêu.
- **Phán quyết kiêu hãnh:** 28 MP, 280% MAG, ma pháp Light đơn mục tiêu, hồi 2 vòng.

Không có AoE hoặc cơ chế tích stack riêng. Thao tác chính là tự buff rồi chọn phép mạnh theo MP và hồi chiêu. Nội tại không tốn lượt, không phải status có thời hạn và không được áp dụng lặp khi tải save hoặc tạo trận mới. Phép của Lisbeth có thể kích hoạt follow-up của đồng đội như Aurora theo luật chung.

## Aurora — Mạch sấm

Aurora là pháp sư mới tốt nghiệp Magic Academy. Nhóm lọc chính `offensive_support`, nhóm phụ `magical_dps`. Chỉ số và hệ số hiện tại là baseline thử nghiệm:

- Tia sét: 100% MAG Thunder đơn mục tiêu, 5 MP.
- Truyền dẫn ma lực: +25% MAG cho một đồng đội, 2 lượt người nhận, 8 MP.
- Giông sét: 100% MAG Thunder diện rộng, 14 MP, hồi 2 vòng.
- Sét cộng hưởng (nội tại): 80% MAG Thunder, không tốn MP/lượt chủ động, không thể chọn như kỹ năng chủ động.

Khi đồng đội khác gây sát thương phép đơn mục tiêu lên kẻ địch vẫn còn sống, Aurora liên kích vào chính người nhận sát thương thực tế và tích 1 Lôi ấn. Đòn của Aurora (gồm phép cơ bản) không tự kích hoạt nội tại và không tiêu lần liên kích của vòng. Đây là luật chung cho mọi nhân vật có follow-up, không phải ngoại lệ riêng Aurora. Giới hạn một lần mỗi vòng chung, kể cả kỹ năng có nhiều hit. Đánh vào khiên vẫn tính là gây sát thương; đòn chính kết liễu không tạo liên kích hoặc stack. Nếu đòn liên kích kết liễu, Aurora vẫn nhận stack. AoE không đủ điều kiện dù chỉ còn một địch. Phản công và các đòn liên kích không kích hoạt liên kích tiếp theo.

Lôi ấn có giới hạn 2 ở dữ liệu hiện tại. Đầu lượt Aurora, nếu có ít nhất 2, tiêu toàn bộ để hồi 20% MP tối đa của từng đồng đội còn sống, gồm bản thân. Lượng hồi được làm tròn và chặn tại MP tối đa. Đầy MP vẫn tiêu stack; không hồi cho người đã gục. Tiêu stack không đặt lại giới hạn liên kích trong vòng đó. Stack và dấu ghi nhận đã liên kích thuộc battle state, không lưu vào campaign.

## Những phần cố ý đơn giản hóa

- Iris tích Dữ liệu khi dùng kỹ năng hỗ trợ, chưa nghe sự kiện mọi đồng đội dùng kỹ năng. Chưa có accuracy/critical.
- Takeshi có xác suất né, chưa có chọn thế theo từng loại đòn. Hoàn kiếm dùng được lên bất kỳ địch hợp lệ, chưa khóa vào người bị phản công.
- Garrek có thể duy trì cover trên nhiều người nếu thời hạn còn; chưa giới hạn một liên kết duy nhất, chưa tự cứu đồng đội khỏi đòn chí mạng.
- Elaine hiện chỉ tăng kháng phép, chưa có cơ chế kháng trạng thái riêng.
- Freya chưa có phạt quá nhiệt; giới hạn tài nguyên và MP đang giữ nhịp.
- Arden chưa có inventory dược liệu, chống độc riêng hoặc phối dược.
- Rhett dùng hồi chiêu cho Quá tải, chưa có pha làm nguội khóa toàn bộ thiết bị.
- Galliard chưa có vị trí/hàng trước–sau, đẩy lùi hay giảm sát thương riêng cho multi-hit.
- Fran hiện có kỹ năng giảm thêm phòng thủ, chưa khuếch đại trực tiếp thời hạn/cấp độ lời nguyền cũ.
- Đòn đánh thường, hồi MP và các chỉ số mới chỉ là baseline thử nghiệm. Chưa đánh giá cân bằng dài hạn hoặc powercreep.

Không đưa các khả năng này vào mô tả UI như đã tồn tại. Khi triển khai thêm, bổ sung dữ liệu và handler có kiểm thử tương ứng.

Điều chỉnh HP: Gawain 185, Takeshi 165, Gahallad 180, Rowan 160. Trang Chi tiết nhân vật hiển thị tổng chỉ số và phần cộng trực tiếp từ gear ở từng chỉ số; gear bonus lấy từ resolver, không tính đội hình/nội tại phần trăm thành gear.
