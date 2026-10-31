# Truy Nã và Gear IV hiệu ứng

## Điều kiện và phần thưởng

Tab **Truy Nã** nằm cạnh Thảo phạt / Hiểm Ác. Mở sau khi nhận thưởng chương cuối cả ba truyện Iris, Takeshi, Fiona. Danh sách, bắt đầu trận và nhận thưởng đều kiểm tra điều kiện; thay URL không vượt khóa. Giữ nguyên khóa Hiểm Ác hiện có.

Năm boss là encounter `rewardTier: boss`, một hành động mỗi lượt, không có phase. Thắng nhận thưởng boss hiện hành: 50% 150 Coin / 50% 15 Vụn Prisma. Không đưa chúng vào pool ngẫu nhiên của Hầm Ngục Hiểm Nguy. Hoàn thành Truy Nã được tính là quest boss cho Ủy Thác Hằng Ngày.

Thắng lần đầu mở nhóm công thức dưới đây. Đánh lại vẫn farm thưởng boss nhưng không nhận bản sao công thức hay gear miễn phí. Trạng thái mở công thức suy ra từ `claimedFirstClearRewards`; không tăng phiên bản save. Hồ sơ cũ đã hoàn thành ba truyện sẽ tự thấy tab mở.

| Boss | Công thức mở lần đầu |
| --- | --- |
| Thạch Vệ Khóa Chuông | Giáp Lót Phản Chấn; Lá Chắn Bền Vững; Móc Xuyên Khiên |
| Du Kiếm Khách Áo Tro | Lá Bùa Sinh Mệnh; Hương Trầm Tĩnh Tâm; Nhẫn Thợ Săn; Lưỡi Đao Kết Liễu |
| Phù Thủy Lầy Muối | Gương Kháng Thuật; Tinh Thể Mạch Nguồn; Thấu Kính Dẫn Mana; Chuông Tịnh Dưỡng |
| Hỏa Ngưu Thép Xỉ | Thạch Tâm Bất Khuất; Bình Dược Cấp Cứu; Đinh Găm Phá Giáp |
| Giáo Sĩ Hắc Văn | Kính Nứt Ma Thuật; Trắc Quang Kính; La Bàn Nhược Điểm; Huy Chương Quan Trắc |

Batch 18 công thức dùng giá phổ thông hiện tại: **2.400 Vụn + 12.000 Coin + 1 Gear T3 chưa trang bị**. Giá, hiệu ứng, hook và nguồn mở nằm trong dữ liệu. Bốn công thức trước giữ điều kiện cũ, kể cả Bùa Hộ Vệ. Các tên gear khác được đề xuất trong GDD boss không thêm ngoài batch người chơi đã chốt.

## Luật kích hoạt

- Chiêu chủ động: kỹ năng do nhân vật thi triển bằng lượt của mình; loại trừ Đánh thường, Phòng thủ, Liên kích, phản đòn và đòn tự động đầu/cuối vòng. Áp dụng cho các gear ghi “chiêu/kỹ năng tấn công”, Bình Dược Cấp Cứu và Chuông Tịnh Dưỡng.
- Gear nhận sát thương trực tiếp và Móc Xuyên Khiên xét mọi hit trực tiếp, gồm đòn thường và phản ứng; không xét Độc, trừ HP làm chi phí. Lá Bùa Sinh Mệnh xét cả Độc và chi phí HP nếu còn sống.
- Hồi chiêu N vòng: kích hoạt vòng R, sẵn sàng lại từ R+N. Một lần mỗi vòng tính chung Vòng Chính và Vòng Phụ.
- Một lần mỗi trận: không reset khi boss đổi phase hoặc qua wave của cùng chương truyện. Reset khi vào phòng hầm ngục tiếp theo, kể cả phòng lặp cùng encounter; reset khi đánh lại trận độc lập.
- Nhẫn Thợ Săn **không có giới hạn lần đầu**. Nhẫn và Lưỡi Đao Kết Liễu chụp HP% mục tiêu ở đầu chiêu; mọi hit cùng chiêu dùng cùng ngưỡng. Không áp dụng cho AoE/splash/ngẫu nhiên.
- Gương/Giáp Lót giảm 20% sát thương cuối cùng của một hit hợp lệ; hit né không tiêu hồi chiêu. Lá Chắn Bền Vững cộng 10 điểm phần trăm vào giảm sát thương Phòng thủ: 40% → 50%, vẫn chịu trần giảm sát thương chung 75% trước các hệ số giảm riêng.
- Thạch Tâm xét **HP mất + lượng khiên thực tế đã hấp thụ trong một hit**, không cộng nhiều hit. Tạo khiên sau xử lý vỡ khiên gốc; không hồi sinh.
- Móc Xuyên Khiên tăng riêng phần khiên đã hấp thụ, làm tròn xuống. Với sát thương gốc D, khiên S: HP tràn vẫn là `max(0,D-S)`; phần khiên mất tối đa S. Ví dụ D=100/S=200: mất 125 khiên/0 HP; D=100/S=80: mất 80 khiên/20 HP.
- Khiên từ gear dùng quy tắc chung: lấy mức lớn hơn, không cộng dồn. Không tiêu proc tạo khiên nếu khiên hiện tại đã dày hơn.
- Đinh/Kính Nứt chỉ cần một hit gây sát thương HP, rồi áp debuff **sau toàn bộ chiêu**, không giúp các hit còn lại của chiêu đó. AoE chỉ chọn một đối thủ: ưu tiên mục tiêu chính hợp lệ, nếu không có thì đối thủ hợp lệ đầu tiên. Debuff tồn tại 1 lượt chính của mục tiêu; Vòng Phụ không tiêu thời hạn.
- La Bàn roll một lần sau chiêu đơn mục tiêu có sát thương, không roll từng hit. Chỉ gắn nếu địch chưa yếu hệ của đòn; yếu loại sát thương vẫn cho phép gắn Sơ hở hệ. Tỷ lệ 50%, Hộ ấn có thể chặn; chỉ bắt đầu CD nếu gắn thành công. Không tăng sát thương chiêu vừa gắn. Sơ hở tuân thủ cơ chế chung: chỉ một loại, tối đa 3 tầng, tiêu tối đa một tầng mỗi chiêu/đối thủ.
- Trắc Quang Kính tính cả sát thương bị khiên hấp thụ và đòn hạ địch. Tối đa một proc mỗi chiêu rồi chờ CD.
- Bình Dược chọn tỷ lệ HP **trước khi hồi**; AoE chọn một đồng minh hợp lệ thấp nhất, không phụ thuộc thứ tự đội hình. Phải hồi HP thực tế. Phần hồi thêm là hồi từ gear, không kích hoạt Chuông Tịnh Dưỡng. Chuông cũng không nhận từ tự hồi, hồi theo thời gian hay nội tại.
- Thấu Kính Dẫn Mana nhận từ buff cấp thành công cho người khác cùng đội, kể cả làm mới buff. Một chiêu buff nhiều người vẫn chỉ hồi 2 MP một lần/vòng.
- Huy Chương tính đồng đội bất kỳ, gồm người mang, đánh trúng điểm yếu và gây sát thương HP hoặc khiên; kể cả đòn thường, Liên kích, phản đòn.
- Hồi MP dùng làm tròn lên và giới hạn MP tối đa; hồi HP/khiên dùng làm tròn gần nhất. Hiệu ứng hồi MP không tiêu proc khi MP đã đầy.

## AI boss

- Thạch Vệ ưu tiên dựng giáp khi không có khiên. Yếu Lôi và mọi đòn phép dùng chung một hệ số yếu ×1,5.
- Du Kiếm Khách ưu tiên duy trì buff né vật lý 20%, không có phản đòn tự động. Phép không chịu né vật lý.
- Phù Thủy chỉ được dùng hồi HP khi **dưới 35%**, áp dụng ở cả điều kiện dùng chiêu và AI.
- Giáo Sĩ ưu tiên Đinh Ám lên mục tiêu có Sơ hở Ám; nếu không có mục tiêu hợp lệ thì ưu tiên khắc Sơ hở. Mọi lựa chọn vẫn tuân theo khiêu khích/che chắn. Khắc Mạch Ám gắn sau sát thương, Hộ ấn và giải hiệu ứng hoạt động bình thường.
- Tất cả có đòn miễn MP để tiếp tục khi thiếu MP hoặc chiêu đang hồi.

## UI và cấu trúc mở rộng

`data/gearEffects.json` chứa 22 công thức (4 cũ + 18 mới). `gear-effects.js` cung cấp hook tại đầu vòng, đầu lượt chính, trước/sau hit, cấp buff, hồi HP, sau hành động và sau chiêu. `gear-effect-schema.js` kiểm tra cấu trúc và xuất nhãn hồi chiêu/điều kiện mở dùng chung.

Rèn Hiệu Ứng có phân trang 12 công thức desktop / 6 mobile, LT/RT. Card có icon nhẫn, sắc tím và viền ánh cầu vồng, glint CSS; tắt chuyển động khi người dùng chọn giảm chuyển động. Card khóa ghi rõ boss và đường dẫn. Kết quả trận báo công thức vừa mở và có liên kết Thợ Rèn.

## Kiểm chứng cân bằng ban đầu

Chạy `node scripts/bounty-balance.mjs 20`: 5 boss × 2 đội × 3 mức gear × 20 seed = 600 trận. Đội Arthur hoặc Fiona + Iris/Garrek/Elaine, đã có nâng cấp từ ba truyện bắt buộc và Arthur Kiểm soát; mỗi người đúng 0 hoặc 3 gear phù hợp, không Trấn/Gear IV. Dùng chính sách tự động cố định, không đại diện người chơi tối ưu.

- 600/600 thắng, không hòa 60 vòng, không ai bị hạ trong mô phỏng này.
- Không gear: khoảng 11–40 vòng tùy đối chứng. Fiona đánh Phù Thủy kháng phép là đối chứng chậm nhất.
- T2: khoảng 8–17 vòng trung bình; T3: khoảng 8–13 vòng.
- Script xuất số vòng, MP cuối trận, tổng HP/khiên mất và số người gục cho từng tổ hợp. Đây là kiểm tra khả năng hoàn thành và nguy cơ stall; vẫn cần playtest cảm giác chơi và độ khó tương đối.

Regression bao gồm ngưỡng biên, nhiều hit, tách HP/khiên, chặn bởi Hộ ấn, hồi AoE, lượt phụ, room/phase, lưu hồ sơ và retry ghi save lỗi. UI kiểm tra khóa URL, điều hướng, phân trang, chế tạo/lưu và layout mobile.
