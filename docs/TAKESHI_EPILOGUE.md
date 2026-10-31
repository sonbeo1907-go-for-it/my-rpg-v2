# Thanh gươm vượt biển và vĩ thanh Ogre’s Bane

## Ba chương Takeshi

Các tên chương dùng hình ảnh ngắn, gợi chất thơ; không tuyên bố là bài haiku theo niêm luật. Takeshi bắt buộc tham chiến trong cả ba chương. Mở tuần tự, phần thưởng đặc biệt chỉ nhận lần đầu.

| Chương | Hành trình | Đối thủ | Thưởng lần đầu | Coin |
| --- | --- | --- | --- | ---: |
| Gươm qua bụi đỏ | Lãng khách phương Đông dùng thanh gươm trượng nghĩa cứu đoàn xe | 3 Cướp Tiên phong và 1 Tướng cướp | 1 ô trang bị Takeshi | 50 |
| Kiếm theo gió ngàn | Lang thang qua những cuộc phục kích, tự hỏi ý nghĩa lưỡi kiếm | 3 wave cướp đa dạng | 1 ô trang bị Takeshi | 50 |
| Qua biển, tìm mình | Trước chuyến tàu sang phương Tây, đối diện người kiếm khách đã lạc lối | Tướng Cướp Đồ Tể Ryoga | 1 ô trang bị Takeshi và Tâm nhãn kiếm sĩ | 150 |

Ba ô thưởng dùng chung giới hạn 6 ô với bản trùng; đủ ô không phát bù tiền. Tâm nhãn kiếm sĩ dùng nâng cấp đã có: phản công thành công làm giảm thêm 15% SPD đến hết lượt chính kế tiếp của mục tiêu; vẫn dùng chung giới hạn phản công một lần/vòng.

Chương hai dùng story-waves.js hiện có; giữ HP, MP, trạng thái, khiên, tài nguyên, cooldown và triệu hồi qua wave. Chỉ thắng wave cuối mới nhận thưởng:

1. Tiên phong, Xạ thủ, Tướng cướp.
2. Lực lưỡng, Pháp sư, Tiên phong.
3. Tướng cướp, Xạ thủ, Pháp sư, Lực lưỡng.

## Năm loại cướp

- **Tiên phong:** 130 HP, SPD 21, chuyên chém áp sát.
- **Xạ thủ:** 115 HP, SPD 24, tên Phong xuyên 20% DEF.
- **Lực lưỡng:** 210 HP, SPD 9, chùy Thổ làm giảm 15% DEF trong 2 lượt chính.
- **Pháp sư:** 130 HP, MAG 27, phép Hỏa đơn mục tiêu/diện rộng; không bị né vật lí.
- **Tướng cướp:** 260 HP, ATK 31, đao đơn mục tiêu/diện rộng.

Đều yếu Phong để Takeshi có đất diễn; mỗi loại còn có một điểm yếu phụ khác. Dùng asset/icon cơ bản, là dữ liệu quái có thể tái sử dụng cho encounter về sau; chưa đưa các chương truyện vào pool Quest thường hoặc dungeon.

## Ryoga

HP 1200, MP 100, ATK 40, DEF 24, RES 22, SPD 26, hệ Ám, yếu Phong.

- **Một bước, một mạng:** 6 MP, né 45% đòn vật lí trong 2 lượt. AI ưu tiên khi chưa có thế né.
- **Lưỡi đao sau lưng:** né thành công sẽ phản đao 125% ATK và tích 1 Sơ hở, tối đa 3; chỉ một lần/vòng. Đòn phản công không tạo vòng lặp phản công.
- **Đao qua bụi đỏ:** 6 MP, 140% ATK, giảm 15% SPD trong 2 lượt chính.
- **Đồ tể đoạn lộ:** 10 MP và toàn bộ Sơ hở (ít nhất 1), 160% ATK + 40% mỗi tầng.
- **Đao phong tuyệt lộ:** 9 MP, 85% ATK diện rộng.

Né chỉ áp dụng đòn vật lí; phép vẫn là đường đối phó. Ryoga có đòn diện rộng để trận không chỉ là hai người đứng né nhau; HP thấp hơn Vua Chằn để hạn chế kéo dài do xác suất né.

## Vĩ thanh

**Tên sách:** Một hành trình kết thúc, một hành trình mới mở ra.

**Chương duy nhất:** Câu chuyện đang dang dở...

Chỉ mở khi đã nhận phần thưởng cuối của cả ba truyện:

- iris_story_revenge
- fiona_story_drei
- takeshi_story_horizon

Yêu cầu Arthur tham chiến. Không cần, không cấp và không thay đổi cờ Hiểm Ác cũ; Alice/Miraebolis trên bảng Quest vẫn giữ cổng riêng. Khi sách bị khóa vẫn có thể xem bìa và danh sách điều kiện, nhưng không có nút xuất chiến hoặc thống kê địch. URL trực tiếp, startBattle và claimBattleReward đều kiểm tra điều kiện.

**Bìa:** public/art/story-epilogue.svg. Đại kiếm đen đỏ hình lưỡi liềm, lõi ma lực hồng tím, gai và xích đứt; nền đêm chuyển thành bình minh trên biển, gắn ý nghĩa bước sang hành trình mới. SVG tự dựng theo hình tham chiếu, không nhúng ảnh raster. Có tên và mô tả truy cập được.

## Hắc ảnh Arthur

Siêu trùm hệ Ám, yếu Quang. HP 3000, MP 180, ATK 46, MAG 24, DEF/RES 32, SPD 19. Cộng hưởng tối đa 3.

| Giai đoạn | Ngưỡng HP | Đặc tính |
| --- | ---: | --- |
| Thanh kiếm chưa thuần | 3000–2000 | Burst Bất kham 360% ATK đơn mục tiêu, tự Kiệt sức |
| Bóng tối mang tên ta | 2000–1000 | Sát thương ×1,1; burst đơn mục tiêu 420% ATK |
| Bình minh sau lưỡi kiếm | 1000–0 | Sát thương ×1,2; burst 280% ATK toàn địch, sau đòn nhận +20% ATK không cộng dồn |

Mỗi giai đoạn một hành động/lượt. Kiếm quang tàn lụi (110% ATK đơn mục tiêu, không MP) và Dư ảnh ngang trời (65% ATK diện rộng, 6 MP) đều tạo 1 Cộng hưởng. Khi đủ 3 tầng và đủ MP, AI ưu tiên burst của phase: báo trước một vòng, đến lúc thực sự đánh mới tiêu 10 MP và 3 tầng. Đòn đã báo trước chiếm lượt kế tiếp, không cộng thêm hành động.

Không thể bỏ qua phase bằng một chiêu quá mạnh. Chuyển phase giữ Cộng hưởng, MP và hiệu ứng; hủy telegraph cũ rồi cần báo trước lại nếu chuẩn bị burst mới. Không tự hồi MP toàn đội như luật riêng của Miraebolis. Buff phase ba có thể bị xóa và được cấp lại sau burst tiếp theo.

## Phần thưởng

Thắng cuối trận: 1000 Coin. Lần đầu cấp nâng cấp arthur.complete_control qua cờ arthur.full_control_story_cleared, mở cả:

- **Ogre’s Bane — Kiểm soát hoàn toàn:** 10 MP + 3 Cộng hưởng, 600% ATK đơn mục tiêu, bỏ Dư chấn, sau đòn tự tăng 20% ATK đến hết trận, không cộng dồn và có thể cấp lại sau dispel.
- **Ogre’s Bane — Thiểm Quang Kiếm:** 10 MP + 3 Cộng hưởng, 280% ATK toàn địch.

Không tự mở qua migration, đăng nhập, thắng các chương trước hoặc đánh lại các quest cũ. Lưu thưởng thất bại có thể thử lại; không phát trùng nâng cấp. Actor trong trận vừa kết thúc giữ kit cũ, trận mới lấy kit đã nâng cấp.

## Khung tái sử dụng

- Encounter requires.firstClears: mọi encounter trong danh sách đều phải được ghi nhận đã thắng. Có validator cho ID thiếu, rỗng, trùng và tự phụ thuộc.
- storyPrerequisites: dữ liệu danh sách điều kiện để dựng sách khóa/checklist, không lưu thêm cờ phái sinh có thể lệch tiến trình.
- Boss phase resourceBurst: ID kỹ năng ưu tiên khi abilityAvailability xác nhận dùng được; vẫn tuân theo hàng telegraph, MP, tài nguyên và số hành động phase. Các boss không khai báo thuộc tính này giữ rotation cũ.
- Ryoga dùng dodge_counter và schema resource hiện có; không thêm cơ chế phản công riêng theo ID boss.

## Kiểm tra cân bằng ban đầu

Mô phỏng 5 seed bằng engine, chính sách đơn giản, không dùng nhân vật gacha/Trấn Phái. Takeshi đi với Fiona/Iris/Elaine; epilogue dùng Arthur/Iris/Elaine/Takeshi với nâng cấp truyện đã nhận, chưa có hai chiêu thưởng Arthur:

| Màn | Không gear | Mỗi người 3 gear T2 đúng chỉ số (+9) |
| --- | --- | --- |
| Gươm qua bụi đỏ | Thắng 5/5, 6 vòng | Thắng 5/5, 4–5 vòng |
| Kiếm theo gió ngàn | Thắng 5/5, 22–24 vòng cho cả ba wave | Thắng 5/5, 12–15 vòng |
| Ryoga | Thắng 5/5, 15–26 vòng | Thắng 5/5, 11–18 vòng |
| Hắc ảnh Arthur | Thua 5/5, boss còn 223–581 HP | Thắng 3/5 ở vòng 20; hai lần thua boss còn 391 HP |

Đây là smoke test độ khó và khả năng hoàn thành, không phải tỷ lệ thắng đại diện cho mọi người chơi. UI test dùng trang bị mạnh hơn để kiểm tra trọn ba phase, nhận thưởng/lưu và hiện hai kỹ năng mới; không dùng kết quả đó để kết luận cân bằng.

BGM: hai chương đầu Takeshi dùng `bt1_east.mp3`; Ryoga dùng `boss_ryoga.mp3`; hắc ảnh Arthur dùng `spboss_ogrebane.mp3`. Cả ba nhóm nhạc lặp lại trong trận.
