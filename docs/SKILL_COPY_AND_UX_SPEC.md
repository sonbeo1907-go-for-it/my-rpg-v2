# Northern Prisma — Đặc tả mô tả kỹ năng và nhân vật

Phiên bản 1.0 · 29/10/2026 · Áp dụng từ đợt rà soát 32 nhân vật hiện tại.

## 1. Mục tiêu và phạm vi

Người chơi đọc một thẻ kỹ năng phải trả lời nhanh được: **làm gì, tác động ai, mạnh bao nhiêu, kéo dài bao lâu, phải trả gì**. Chỉ mở thêm khi muốn tra ngoại lệ hoặc thử giả định.

Đây là chuẩn viết và trình bày cho nhân vật, kỹ năng chủ động, nội tại, trạng thái và Trấn Phái. Đợt này là chỉnh nội dung hiển thị và phân lớp thông tin; không cân bằng lại cơ chế, chỉ số, MP, hồi chiêu, xác suất hoặc phần thưởng.

## 2. Đánh giá từ hai góc nhìn

| Trường hợp | Góc nhìn game thủ | Góc nhìn UI/UX | Quyết định |
| --- | --- | --- | --- |
| Hộ ấn bất xâm — Lyon | Phải đọc hai đoạn gần giống nhau để hiểu chỉ chặn một hiệu ứng. “Miễn nhiễm” dễ bị hiểu là chặn toàn bộ chiêu. | Cùng một thông tin xuất hiện ở mô tả và scaling; ngoại lệ chiếm nhiều chỗ hơn tác dụng chính. | Tóm tắt tác dụng một câu; số lần chặn ở thông số; ba ngoại lệ trong mục mở rộng. |
| Trọng kích — Dain | Khó phân biệt chi phí, hệ số và thời điểm tiêu Quyết tâm. | Một đoạn văn đang gánh bốn vai trò. | Chi phí ở đầu thẻ; công thức ở thông số; quy tắc giữ bonus và điểm mới ở chi tiết. |
| Mạch sấm — Aurora | Phải biết ngay “đồng đội khác”, “phép đơn mục tiêu”, “một lần/vòng”. | Điều kiện kích hoạt và phần thưởng nên thành hai dòng riêng, không ghép thành một đoạn luật dài. | Giữ các điều kiện cốt lõi trên mặt thẻ; tách liên kích và hồi MP thành hai thông số. |
| Thiên lôi tụ trận — Gawain | Dễ tưởng mây đánh ngay khi gọi hoặc bonus tồn tại mãi. | Kỹ năng đang giải thích cả nội tại, lịch hồi chiêu và xử lý buff. | Kỹ năng nói khi nào mây đánh; nội tại nói Uy lôi; quy tắc kỹ thuật vào chi tiết. |
| Seraphine | Cần thấy ngay cả ATK lẫn MAG. | Một đoạn kể lại phép tính không dễ so sánh hai chiêu. | Hai dòng hệ số vật lí/phép; quy tắc DEF/RES nêu một lần ở chi tiết và quy ước chung. |
| Lionel | “Cuối lượt” và “cuối vòng” dẫn tới quyết định khác nhau. | Rút gọn quá tay sẽ làm sai cơ chế. | Giữ thời điểm rõ ràng; Lượt Thêm luôn ghi thực hiện trong Vòng Phụ. |
| Mô tả nhân vật | Muốn biết cách chơi trước khi đọc tiểu sử. | Lore, vai trò, nội tại và thông số đang trộn chung. | Một câu giới thiệu vòng chơi; lore riêng trong “Bối cảnh nhân vật”; nội tại có khối riêng. |

## 3. Ba lớp thông tin

### Lớp 1 — Tác dụng chính

- Tên giữ cá tính và chất RPG. Không đổi tên kỹ năng để thay cho việc giải thích cơ chế.
- Mô tả: một câu chủ động, ưu tiên 12–25 từ, tối đa 180 ký tự. Ví dụ: “Dồn toàn bộ Quyết tâm vào một đòn xuyên giáp.”
- Viết động từ trước: tạo khiên, gây độc, nhận đòn thay, tăng MAG, cấp Lượt Thêm.
- Điều kiện tạo ra danh tính lối chơi phải hiện ngay: đồng đội **khác**, phép **đơn mục tiêu**, ngưỡng tài nguyên, thời điểm kích hoạt.
- Không lặp MP, hồi chiêu, hệ số, mục tiêu và thời hạn đã có ở thông số, trừ khi bỏ đi sẽ làm sai cách hiểu.
- Không dùng “rất mạnh”, “cực đau”, “mạnh hơn nhân vật X” để thay thế hệ số.

### Lớp 2 — Thông số để ra quyết định

Thứ tự cố định: **chi phí/hồi chiêu → mục tiêu → tác dụng chính → các thông số hiệu ứng**.

- Chi phí và hồi chiêu ở đầu thẻ; dùng nhãn “Hồi chiêu: 2 vòng”, tránh “Hồi 2 vòng”.
- Chi phí biến thiên phải thể hiện tổng có thể tiêu. Ví dụ Helena: `12–18 MP`; trong combat trần được giới hạn theo MP còn lại.
- Sát thương: `vật lí · Phong · 2 × (70% ATK + 50% SPD)`.
- Hồi phục/khiên: `Khiên: 150% DEF → 57/người`.
- Buff: `+25% ATK · +25% MAG · 2 lượt`.
- Số phẳng và phần trăm phải phân biệt: `+1 DEF nền` khác `+25% DEF`.
- Hiệu ứng cấp cho bản thân trong chiêu chọn đồng đội phải ghi `Bản thân:` trên dòng đó.
- Hiệu ứng tiêu ở đòn kế tiếp phải ghi rõ đòn kế tiếp; `3 lượt` là thời hạn chờ, không phải ba đòn được tăng sức mạnh.
- Hệ số không được ghi thành sát thương cuối. Phòng thủ, điểm yếu và trạng thái của mục tiêu vẫn ảnh hưởng kết quả.
- Mỗi dòng chứa một hiệu ứng hoặc một nhóm hiệu ứng cùng thời hạn. Mục tiêu 2–5 dòng; chiêu nhiều hiệu ứng được dài hơn khi cần. Không cắt chữ hoặc giấu hiệu ứng để đạt số dòng.

### Lớp 3 — Chi tiết cơ chế và giả định

Đặt trong phần mở rộng `Chi tiết cơ chế`. Mỗi gạch đầu dòng là một quy tắc, ưu tiên dưới 120 ký tự.

Ví dụ nên đưa xuống lớp này: không cộng dồn, cách làm mới, sát thương tràn khiên, chốt lượng độc lúc dùng chiêu, xử lý một chiêu gắn nhiều debuff, thứ tự tiêu tài nguyên.

Trong trang Nhân vật, thanh thử Sơ hở/Nhiệt/Mảnh Prisma/Uy lôi nằm trong `Chi tiết cơ chế & giả định`. Mặc định lấy **mức tối thiểu hợp lệ**, không mặc nhiên lấy stack tối đa. Kết quả phải có nhãn `Giả định`.

Trong combat, thông tin dùng dữ liệu thật và nhãn `Hiện tại`. Popover là nội dung đọc, không đặt nút/slider bên trong `role=tooltip`; chuột, focus bàn phím, chạm giữ và nút trợ giúp tay cầm phải tiếp cận được cùng nội dung. Không giấu điều kiện thiết yếu sau thao tác hover độc quyền.

## 4. Mẫu chuẩn

### Kỹ năng

```text
Tên kỹ năng                                      8 MP · Hồi chiêu: 2 vòng
[Một đồng đội]

Một câu nói tác dụng chính.

Thông số hiệu ứng 1 · thời hạn
Thông số hiệu ứng 2 · thời hạn

▸ Chi tiết cơ chế
  • Quy tắc ngoại lệ 1.
  • Quy tắc ngoại lệ 2.
```

### Hộ ấn bất xâm sau chỉnh sửa

```text
Hộ ấn bất xâm                                   8 MP · Hồi chiêu: 2 vòng
[Một đồng đội]

Bảo vệ một đồng đội khỏi hiệu ứng bất lợi kế tiếp.

Hộ ấn: 1 lần chặn · đến khi dùng hết

▸ Chi tiết cơ chế
  • Chặn một hiệu ứng, không chặn trọn kỹ năng có nhiều hiệu ứng.
  • Không giải hiệu ứng đã có hoặc chặn hình phạt tự gây.
  • Dùng lại làm mới một lần chặn, không cộng dồn.
```

Không cần lặp lại “Miễn nhiễm hiệu ứng” rồi giải thích thêm một đoạn tương đương. Đây là Hộ ấn có số lần chặn, không phải miễn nhiễm toàn bộ trạng thái.

### Nhân vật và nội tại

- Giới thiệu nhân vật: một câu nêu vòng chơi hoặc điểm khác biệt, tối đa 160 ký tự. Không chép lại toàn bộ nội tại.
- Bối cảnh: nơi xuất thân, tính cách và câu chuyện. Không nhét hệ số combat vào tiểu sử.
- Nội tại: tên → điều kiện/tác dụng ngắn → thông số/giới hạn → quy tắc mở rộng.
- Trấn Phái: câu ngắn nêu điều kiện và lợi ích; chỉ rõ kỹ năng được hưởng. Không cần thêm các câu “không tăng mọi kỹ năng khác” khi danh sách hưởng đã rõ.

## 5. Từ điển và quy ước chung

| Khái niệm | Cách viết |
| --- | --- |
| Nguyên tố | Thường, Hỏa, Thủy, Thổ, Phong, Lôi, Quang, Ám. Không trộn Light/Wind/Thunder vào mô tả tiếng Việt. |
| Loại sát thương | vật lí / phép. Tên chỉ số ATK, MAG, DEF, RES, SPD giữ nguyên. |
| Lượt | Lượt của người mang hiệu ứng. Buff tự dùng tính thời hạn từ lượt kế tiếp theo engine hiện hành. |
| Vòng | Vòng chính cùng Vòng Phụ nếu có. Hạn mức một lần/vòng dùng chung cả hai. |
| Cuối lượt | Khi chính đơn vị đó kết thúc lượt, gồm cả lượt phụ. |
| Cuối vòng | Sau toàn bộ hàng chính và hàng phụ. Không đổi nội tại Cedric thành cuối vòng. |
| Lượt Thêm | Quyền hành động ở Vòng Phụ của vòng hiện tại; không chen lượt chính. |
| Liên kích | Phản ứng theo đòn đồng đội khác; không phải Lượt Thêm. |
| Che chắn | Nhận thay đòn đơn mục tiêu; không đồng nghĩa Khiêu khích. |
| Hộ ấn | Chặn số hiệu ứng bất lợi mới được ghi; không chặn trọn chiêu nhiều hiệu ứng. |
| Thanh tẩy | Giải hiệu ứng bất lợi đã có. Khác với chặn hiệu ứng mới. |
| Khiên | Không cộng dồn; chỉ thay khi khiên mới mạnh hơn. |
| Nền | Chỉ số trước buff phần trăm, có tính trang bị và các nguồn cộng phẳng hợp lệ. |

Các quy ước phổ biến đặt một lần ở trang Nhân vật, không chèn thành đoạn văn ở mọi chiêu: hồi không vượt tối đa, hồi MP theo tỷ lệ làm tròn lên, cùng tên làm mới trừ khi ghi cộng tầng, hệ số sát thương tính trước DEF/RES và điểm yếu.

## 6. Hợp đồng dữ liệu và component

Nguồn thông số duy nhất vẫn là các trường cơ chế trong `data/abilities.json`, `data/statuses.json`, `data/characters.json` và `data/exclusiveGear.json`.

```text
character.description       câu giới thiệu cách chơi
character.biography         bối cảnh, nếu có dữ liệu được xác nhận
ability.description         ý định/tác dụng ngắn
ability.rules[]             ngoại lệ riêng, không chép lại bảng hệ số
exclusive.passive.description lợi ích ngắn
exclusive.passive.rules[]   chi tiết cần giữ để tra cứu

skillPresentation(...)      { summary, facts[], rules[] }
passivePresentation(...)    { name, summary, facts[], rules[] }
SkillBody / PassiveBody     trình bày công khai
RulesDisclosure            phần mở rộng dùng chung
```

Lợi ích Trấn Phái đang trang bị hiện ngay trong thông số của các kỹ năng liên quan; không rải nội tại không liên quan lên mọi chiêu.

`skillPresentation` lấy lượng, nguyên tố, loại sát thương, số hit, tỷ lệ, thời hạn, chi phí và buff đang trang bị từ dữ liệu. Không hardcode bản sao của thông số vào mô tả. Không dùng cắt chuỗi, regex hoặc dấu ba chấm để giấu phần luật bị dài.

Các hàm scaling đầy đủ cũ còn được giữ để so sánh công thức/kiểm thử; UI công khai dùng mô hình phân lớp mới. Khi thêm effect/passive mới, phải bổ sung trình bày tương ứng rồi kiểm tra toàn roster, không để người chơi thấy ID nội bộ, `undefined`, `NaN` hoặc trường tiếng Anh.

## 7. Quy trình thiết kế nội dung mới

1. Viết một câu trả lời “người chơi dùng chiêu này để làm gì?”.
2. Khai báo cơ chế bằng dữ liệu: đối tượng, chi phí, hiệu ứng, thời hạn, giới hạn và điều kiện.
3. Để formatter sinh thông số. Nếu cần viết lại số trong văn, kiểm tra xem đang trùng lớp 2 hay chưa.
4. Chọn điều kiện cốt lõi phải thấy ngay. Đưa ngoại lệ riêng vào `rules` dưới dạng gạch đầu dòng.
5. Đọc thử như game thủ: có phân biệt buff/đánh thường, biết trả gì và được gì không?
6. Rà như UI/UX: có một thông tin xuất hiện hai lần, đoạn dài hoặc thành phần lệch thứ tự không?
7. Kiểm tra trường hợp biên: tự dùng, đồng đội khác, nhiều mục tiêu, nhiều hit, hết MP, đã có buff, Vòng Phụ, thay Trấn Phái.
8. Xem desktop, màn hình hẹp 390 px, bàn phím và điều khiển tay cầm. Không cố định chiều cao hoặc line-clamp nội dung luật.

## 8. Điều kiện nghiệm thu

- Mọi nhân vật hiện có đều được rà; mô tả nhân vật ngắn và tiểu sử còn truy cập được.
- Hộ ấn của Lyon chỉ có một mô tả tác dụng và một dòng số lần chặn trên mặt thẻ; ba ngoại lệ mở được bằng chuột/bàn phím/tay cầm.
- Aurora vẫn thấy “đồng đội khác”, “đơn mục tiêu” và “một lần/vòng”.
- Lionel vẫn ghi rõ Vòng Phụ, cuối vòng và chọn cả bản thân trong quy tắc nội tại.
- Dain không mất thông tin tiêu điểm sau sát thương; Gawain không bị mô tả thành đánh ngay lúc gọi mây.
- Benard vẫn hiển thị phần SPD gồm nội tại; Seraphine vẫn có hai phần ATK/MAG; khiên vẫn lấy đúng DEF/MAG.
- Số liệu và cơ chế combat trước/sau biên tập phải giống nhau. Thay đổi cân bằng phải thành một yêu cầu riêng.
- Không có chữ lỗi UTF-8, ID thô, `NaN`, `undefined`; không tràn ngang; vùng mở rộng không bị cắt nội dung.

## 9. Phụ lục rà soát toàn bộ nội dung

Phần dưới là bản chụp câu chữ và thông số mặc định trong đợt này, để đọc và đối chiếu. Cân bằng về sau lấy từ dữ liệu game, không lấy số cố định trong phụ lục làm nguồn thứ hai.

### Arthur

**Vòng chơi:** Tích Cộng hưởng qua Kiếm quang rồi giải phóng sức mạnh Ogre’s Bane.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Kiếm quang | Chém ánh sáng và tích Cộng hưởng. | Không tốn MP · Một kẻ địch · vật lí · Quang · 110% ATK; Bản thân: Tạo 1 Cộng hưởng |
| Giải phóng | Tiêu toàn bộ Cộng hưởng để tăng sức mạnh đòn chém. | Toàn bộ Cộng hưởng (ít nhất 1) · Một kẻ địch · vật lí · Quang · 100% ATK + 65% ATK/Cộng hưởng; Giả định: 165% ATK |
| Ogre’s Bane — Bất kham | Tung đòn chém cực mạnh, sau đó rơi vào Kiệt sức. | 8 MP · 3 Cộng hưởng · Một kẻ địch · vật lí · Quang · 420% ATK; Bản thân: Không tích tài nguyên · 1 lượt kế tiếp |
| Ogre’s Bane — Kiểm soát | Giải phóng Ogre’s Bane có kiểm soát, sau đó chịu Dư chấn. | 8 MP · 3 Cộng hưởng · Một kẻ địch · vật lí · Quang · 420% ATK; Bản thân: −10% ATK · 1 lượt kế tiếp |
| Giải phóng một phần | Dùng một phần Cộng hưởng, giữ lại phần còn lại. | 1 Cộng hưởng · Một kẻ địch · vật lí · Quang · 170% ATK |

### Iris

**Vòng chơi:** Cường hóa đòn đánh, tích Dữ liệu rồi mở đợt tổng công kích.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Công thức cường hóa | Cường hóa đòn tấn công tiếp theo của một đồng đội. | 7 MP · Một đồng đội · +40% sát thương · 3 lượt · đòn tấn công kế tiếp; Bản thân: Tạo 1 Dữ liệu |
| Hiệu chỉnh thuật thức | Tăng sức tấn công vật lí và phép cho một đồng đội. | 8 MP · Một đồng đội · +20% ATK · +20% MAG · 2 lượt; Bản thân: Tạo 1 Dữ liệu |
| Kế hoạch tổng công kích | Dùng Dữ liệu để cường hóa đòn tấn công tiếp theo của cả đội. | 12 MP · 3 Dữ liệu · Hồi chiêu: 2 vòng · Toàn đội · +40% sát thương · 3 lượt · đòn tấn công kế tiếp |

### Takeshi

**Vòng chơi:** Thu hút đòn vật lí để né, phản công và tích Sơ hở cho Hoàn kiếm.

**Phản kiếm:** Né thành công đòn vật lí sẽ phản công và tích Sơ hở. Phản công: 85% ATK · +1 Sơ hở · 1 lần/vòng.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Thế né | Vào thế né đòn vật lí và thu hút địch tấn công. | 5 MP · Bản thân · +70% né vật lí · 1 lượt kế tiếp; Khiêu khích · 1 lượt kế tiếp |
| Phong trảm | Chém một kẻ địch bằng kiếm Phong. | Không tốn MP · Một kẻ địch · vật lí · Phong · 115% ATK |
| Hoàn kiếm | Tiêu toàn bộ Sơ hở để tung đòn kết liễu. | Toàn bộ Sơ hở (ít nhất 1) · Một kẻ địch · vật lí · Phong · 120% ATK + 80% ATK/Sơ hở; Giả định: 200% ATK |

### Fiona

**Vòng chơi:** Gắn Mảnh Prisma lên từng kẻ địch rồi kích nổ cả chiến trường.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Hắc tinh | Gây phép Ám và gắn Mảnh Prisma lên một địch. | 5 MP · Một kẻ địch · ma pháp · Ám · 110% MAG; +1 Mảnh Prisma · tối đa 3 tầng · 4 lượt |
| Khúc xạ | Gây phép Ám và rải Mảnh Prisma lên toàn địch. | 11 MP · Mọi kẻ địch · ma pháp · Ám · 60% MAG; +1 Mảnh Prisma · tối đa 3 tầng · 4 lượt |
| Sụp đổ Prisma | Tiêu Mảnh Prisma trên từng địch để tăng sát thương diện rộng. | 12 MP · Hồi chiêu: 1 vòng · Mọi kẻ địch · ma pháp · Ám · 25% MAG + 80% MAG/Mảnh Prisma; Giả định: 25% MAG |

### Elaine

**Vòng chơi:** Bảo vệ đội bằng khiên và kháng phép; hồi HP khi khiên vỡ.

**Dư âm thủy hộ:** Khi khiên do mình tạo bị phá, hồi HP cho người mang khiên. Hồi 35% MAG.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Thủy thuẫn | Tạo khiên cho một đồng đội. | 8 MP · Một đồng đội · Khiên: 180% MAG → 54 |
| Màn nước | Tăng kháng phép cho toàn đội. | 12 MP · Toàn đội · +50% RES · 2 lượt |
| Thánh vực thủy triều | Tạo khiên cho toàn đội. | 18 MP · Hồi chiêu: 2 vòng · Toàn đội · Khiên: 110% MAG → 33/người |

### Garrek

**Vòng chơi:** Nhận đòn đơn mục tiêu thay đồng đội và tự giảm sát thương.

**Bền bỉ:** Bền bỉ trước mọi đòn đánh. Giảm 12% sát thương nhận.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Che chắn | Nhận đòn đơn mục tiêu thay một đồng đội. | 4 MP · Một đồng đội · Nhận đòn thay · 2 lượt |
| Thủ thành | Giảm mạnh sát thương nhận vào bản thân. | 6 MP · Hồi chiêu: 1 vòng · Bản thân · Giảm 60% sát thương nhận · 1 lượt kế tiếp |
| Ý chí người gác làng | Nhận đòn thay đồng đội và tăng khả năng chịu đòn của bản thân. | 10 MP · Hồi chiêu: 3 vòng · Một đồng đội · Nhận đòn thay · 2 lượt; Bản thân: Giảm 30% sát thương nhận · 2 lượt kế tiếp |

### Dain

**Vòng chơi:** Tích Quyết tâm để tăng ATK, rồi dồn toàn bộ vào Trọng kích.

**Ý chí đấu sĩ:** Mỗi Quyết tâm tăng sức tấn công. Mỗi điểm: +15% ATK · tối đa 45%.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Đánh chắc | Giáng một đòn chắc tay vào kẻ địch. | Không tốn MP · Một kẻ địch · vật lí · Thường · 120% ATK |
| Gồng mình | Giảm sát thương nhận và tích Quyết tâm khi chịu đòn hoặc tấn công. | 5 MP · Bản thân · Giảm 25% sát thương nhận · 3 lượt kế tiếp; Mỗi hit chịu đựng: +1 Quyết tâm; Sau tấn công: 50% nhận +1 Quyết tâm |
| Trọng kích | Dồn toàn bộ Quyết tâm vào một đòn xuyên giáp. | 10 MP · Toàn bộ Quyết tâm (ít nhất 1) · Tiêu sau khi thi triển · Một kẻ địch · vật lí · Thường · 120% ATK + 80% ATK/Quyết tâm; Xuyên 30% DEF; Giả định: 200% ATK |

### Rowan

**Vòng chơi:** Tích Điểm ngắm để bắn xuyên giáp, hoặc dùng Liên xạ đánh nhiều địch.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Lấy điểm ngắm | Chuẩn bị Điểm ngắm cho những phát bắn kế tiếp. | Không tốn MP · Bản thân · Tạo 2 Điểm ngắm |
| Xuyên điểm yếu | Dùng Điểm ngắm để bắn xuyên giáp một địch. | 4 MP · 1 Điểm ngắm · Một kẻ địch · vật lí · Phong · 210% ATK; Xuyên 60% DEF |
| Liên xạ | Bắn tên vào toàn bộ kẻ địch. | 9 MP · Mọi kẻ địch · vật lí · Phong · 90% ATK |

### Freya

**Vòng chơi:** Tích Nhiệt bằng Hỏa cầu; đổi Nhiệt lấy sát thương diện rộng hoặc MP.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Hỏa cầu | Phóng Hỏa cầu và tích Nhiệt. | 5 MP · Một kẻ địch · ma pháp · Hỏa · 130% MAG; Bản thân: Tạo 1 Nhiệt |
| Biển lửa | Tiêu toàn bộ Nhiệt để thiêu đốt toàn địch. | 12 MP · Toàn bộ Nhiệt (ít nhất 1) · Mọi kẻ địch · ma pháp · Hỏa · 80% MAG + 40% MAG/Nhiệt; Giả định: 120% MAG |
| Điều hòa | Chuyển Nhiệt thành MP cho bản thân. | 1 Nhiệt · Bản thân · Hồi 12 MP |

### Arden

**Vòng chơi:** Duy trì hồi phục theo lượt và tăng phòng thủ cho đồng đội.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Thuốc đắp | Đắp thuốc giúp một đồng đội hồi HP mỗi đầu lượt. | 6 MP · Một đồng đội · Đầu lượt: hồi 12% HP tối đa · 3 lượt |
| Dược phòng | Tăng phòng thủ vật lí và kháng phép cho một đồng đội. | 6 MP · Một đồng đội · +25% DEF · +25% RES · 3 lượt |
| Dược liệu dự phòng | Giúp toàn đội hồi HP mỗi đầu lượt. | 16 MP · Hồi chiêu: 3 vòng · Toàn đội · Đầu lượt: hồi 12% HP tối đa · 2 lượt |

### Rhett

**Vòng chơi:** Nạp Điện tích rồi xả qua đạn Lôi hoặc vụ nổ diện rộng.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Nạp điện | Nạp Điện tích cho vũ khí. | Không tốn MP · Bản thân · Tạo 2 Điện tích |
| Phóng đạn điện | Dùng Điện tích để bắn một địch. | 1 Điện tích · Một kẻ địch · vật lí · Lôi · 190% ATK |
| Ka-Boom! | Xả toàn bộ Điện tích thành vụ nổ Lôi diện rộng. | 8 MP · Toàn bộ Điện tích (ít nhất 2) · Hồi chiêu: 2 vòng · Mọi kẻ địch · vật lí · Lôi · 80% ATK + 55% ATK/Điện tích; Giả định: 190% ATK |

### Galliard

**Vòng chơi:** Khiêu khích địch và củng cố khả năng chịu đòn của toàn đội.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Khiêu khích | Thu hút các đòn đơn mục tiêu về bản thân. | 4 MP · Bản thân · Khiêu khích · 2 lượt kế tiếp |
| Tường khiên | Giảm sát thương nhận cho toàn đội. | 10 MP · Hồi chiêu: 2 vòng · Toàn đội · Giảm 20% sát thương nhận · 2 lượt |
| Giữ đội hình | Tăng phòng thủ vật lí cho toàn đội. | 9 MP · Toàn đội · +30% DEF · 2 lượt |

### Armie

**Vòng chơi:** Hồi HP tức thời, thanh tẩy và cấp cứu đồng đội bị thương nặng.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Sơ cứu | Hồi HP ngay cho một đồng đội. | 7 MP · Một đồng đội · Hồi HP: 180% MAG → 58 |
| Điều trị | Thanh tẩy rồi hồi HP cho một đồng đội. | 8 MP · Một đồng đội · Giải toàn bộ hiệu ứng bất lợi; Hồi HP: 60% MAG → 19 |
| Cấp cứu | Hồi HP, hiệu quả mạnh hơn khi đồng đội nguy kịch. | 13 MP · Hồi chiêu: 2 vòng · Một đồng đội · Hồi HP: 220% MAG → 70; Mục tiêu ≤35% HP: hồi ×1,6 → 112 HP |

### Fran

**Vòng chơi:** Giảm DEF và RES để đồng đội dễ xuyên thủng phòng tuyến.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Mòn giáp | Giảm phòng thủ vật lí của một địch. | 6 MP · Một kẻ địch · −35% DEF · 3 lượt |
| Rạn thuật | Giảm kháng phép của một địch. | 6 MP · Một kẻ địch · −35% RES · 3 lượt |
| Đêm không che chở | Giảm DEF và RES của toàn địch. | 16 MP · Hồi chiêu: 3 vòng · Mọi kẻ địch · −20% DEF · −20% RES · 2 lượt |

### Aurora

**Vòng chơi:** Tăng MAG, liên kích theo phép đơn mục tiêu của đồng đội và tiếp MP cho cả đội.

**Mạch sấm:** Liên kích theo phép đơn mục tiêu của đồng đội khác để tích Lôi ấn và tiếp MP cho đội. Liên kích: 80% MAG · Lôi · 1 lần/vòng · Đầu lượt đủ 2 Lôi ấn: tiêu hết → hồi 20% MP toàn đội.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Tia sét | Phóng một tia sét vào kẻ địch. | 5 MP · Một kẻ địch · ma pháp · Lôi · 100% MAG |
| Truyền dẫn ma lực | Tăng sức mạnh phép cho một đồng đội. | 8 MP · Một đồng đội · +25% MAG · 2 lượt |
| Giông sét | Gọi giông sét đánh toàn địch. | 14 MP · Hồi chiêu: 2 vòng · Mọi kẻ địch · ma pháp · Lôi · 100% MAG |
| Sét cộng hưởng (tự động) | Liên kích vào mục tiêu vừa nhận phép đơn mục tiêu của đồng đội khác. | Không tốn MP · Một kẻ địch · ma pháp · Lôi · 80% MAG |

### Lisbeth Ranoc

**Vòng chơi:** Tự tăng MAG rồi dồn phép Quang đơn mục tiêu; sát thương cao, hao MP và ít HP.

**Di sản khế ước:** Nhận sức mạnh thường trực từ nội tại. +20% MAG.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Kiêu hãnh Ranoc | Giải phóng ma lực Ranoc để tự tăng MAG. | 12 MP · Hồi chiêu: 3 vòng · Bản thân · +50% MAG · 3 lượt kế tiếp |
| Quang thương | Phóng quang thương vào một địch. | 16 MP · Một kẻ địch · ma pháp · Quang · 190% MAG |
| Phán quyết kiêu hãnh | Dồn ma lực thành đòn phép Quang cực mạnh. | 28 MP · Hồi chiêu: 2 vòng · Một kẻ địch · ma pháp · Quang · 280% MAG |

### Kai

**Vòng chơi:** Bào mòn địch bằng độc, hỗ trợ đội bằng khiên nhỏ và phòng thủ.

**Học theo người gác làng:** Bền bỉ trước mọi đòn đánh. Giảm 6% sát thương nhận.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Rắc bột độc | Gây độc, làm địch mất HP mỗi đầu lượt. | 6 MP · Một kẻ địch · Độc: 4 + 35% ATK → 12 HP/đầu lượt · 3 lượt |
| Khiên gỗ vụng về | Dựng khiên gỗ cho một đồng đội. | 7 MP · Một đồng đội · Khiên: 90% MAG + 8 → 26 |
| Tập giữ hàng | Tăng phòng thủ vật lí cho toàn đội. | 10 MP · Hồi chiêu: 2 vòng · Toàn đội · +15% DEF · 2 lượt |

### Benard

**Vòng chơi:** Tự tăng SPD để tung những nhát song kiếm mạnh hơn vào một mục tiêu.

**Kiếm theo gió:** Tốc độ tăng sức mạnh cho từng nhát đánh vật lí. Mỗi hit: +50% SPD vào sát thương gốc.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Song kiếm cuồng phong | Chém liên tiếp hai nhát vào một địch. | 5 MP · Một kẻ địch · vật lí · Phong · 2 × (70% ATK + 50% SPD) |
| Nhất thiểm | Lướt kiếm lấy tốc độ làm sức mạnh. | 14 MP · Hồi chiêu: 2 vòng · Một kẻ địch · vật lí · Phong · 70% ATK + 150% SPD |
| Nhịp gió | Tăng tốc để di chuyển và ra kiếm nhanh hơn. | 10 MP · Hồi chiêu: 3 vòng · Bản thân · +40% SPD · 3 lượt kế tiếp |

### Lanceveil

**Vòng chơi:** Dồn thương Hỏa vào một đối thủ, dựng hàng khiên khi đội cần bảo vệ.

**Ý chí người bảo hộ:** Bền bỉ trước mọi đòn đánh. Giảm 8% sát thương nhận.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Hỏa thương | Đâm thương bọc lửa vào một địch. | 5 MP · Một kẻ địch · vật lí · Hỏa · 135% ATK |
| Liệt hỏa phá trận | Dùng hỏa thương xuyên giáp một địch. | 13 MP · Hồi chiêu: 2 vòng · Một kẻ địch · vật lí · Hỏa · 220% ATK; Xuyên 25% DEF |
| Khiên lửa hộ quân | Dựng hàng khiên giảm sát thương cho cả đội. | 12 MP · Hồi chiêu: 3 vòng · Toàn đội · Giảm 15% sát thương nhận · 2 lượt |

### Gahallad

**Vòng chơi:** Lên ngựa để phá khiên; tận dụng đà phá vỡ cho đòn đánh kế tiếp.

**Sát uy dư chấn:** Tự đánh vỡ khiên địch sẽ cường hóa đòn tấn công kế tiếp. Đòn kế: sát thương ×2.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Hắc kỳ giáng thế | Lên hoặc xuống ngựa. Khi cưỡi, tăng ATK và nhận Phá Thành. | Không tốn MP · Bản thân · +15% ATK; Địch có khiên: sát thương ×2 |
| Thiết kị nghiền trận | Thúc chiến mã nghiền qua một địch. | 6 MP · Một kẻ địch · vật lí · Ám · 135% ATK |
| Vạn vó chôn quân | Dồn khí thế kị binh vào một đòn chém Ám cực mạnh. | 14 MP · Hồi chiêu: 2 vòng · Một kẻ địch · vật lí · Ám · 240% ATK |

### Gawain

**Vòng chơi:** Gọi mây Lôi đánh đầu lượt, tích Uy lôi rồi quét đại kiếm qua toàn địch.

**Uy lôi:** Mây càng tồn tại, ATK càng tăng; mây tan sẽ mất toàn bộ bonus. Mỗi đầu lượt có mây: +10% ATK · tối đa 20%.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Thiên lôi tụ trận | Gọi mây giông đánh toàn địch ở đầu các lượt kế tiếp. | 12 MP · Hồi chiêu: 3 vòng · Bản thân · Đầu lượt: 60% ATK · Lôi · toàn địch · 3 lượt kế tiếp |
| Lôi đình phá trận | Quét đại kiếm Lôi qua toàn địch. | 9 MP · Mọi kẻ địch · vật lí · Lôi · 90% ATK |
| Thiên phạt trọng trảm | Giáng đại kiếm Lôi xuống toàn chiến trường. | 16 MP · Hồi chiêu: 2 vòng · Mọi kẻ địch · vật lí · Lôi · 145% ATK |
| Lôi vực giáng lâm (tự động) | Mây giông tự đánh toàn địch vào đầu lượt Gawain. | Không tốn MP · Mọi kẻ địch · vật lí · Lôi · 60% ATK |

### Lucien Valmont

**Vòng chơi:** Gây phép diện rộng, tăng RES cho đội và nhận thêm MAG từ đồng đội Valmont.

**Truyền thừa Valmont:** Nhận thêm chỉ số từ mỗi đồng đội Valmont khác. +2 MAG nền/người.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Ấn thuật truy săn | Rải ấn thuật lên toàn địch. | 8 MP · Mọi kẻ địch · ma pháp · Thường · 105% MAG |
| Thiên trận Valmont | Triển khai đại trận phép lên toàn địch. | 16 MP · Hồi chiêu: 2 vòng · Mọi kẻ địch · ma pháp · Thường · 165% MAG |
| Kết giới gia huy | Tăng kháng phép cho toàn đội. | 12 MP · Hồi chiêu: 2 vòng · Toàn đội · +25% RES · 2 lượt |

### Seraphine Valmont

**Vòng chơi:** Kết hợp kiếm và phép trong từng đòn; mạnh hơn khi sát cánh cùng Valmont.

**Huyết mạch người thừa kế:** Nhận thêm chỉ số từ mỗi đồng đội Valmont khác. +1 ATK nền/người · +1 MAG nền/người.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Ý chí người thừa kế | Tự tăng sức mạnh kiếm thuật và ma pháp. | 10 MP · Hồi chiêu: 3 vòng · Bản thân · +30% ATK · +30% MAG · 3 lượt kế tiếp |
| Kiếm quyết Valmont | Kết hợp kiếm và phép tấn công một địch. | 5 MP · Một kẻ địch · vật lí · Thường · 100% ATK; ma pháp · Thường · 100% MAG |
| Ấn kiếm truy hồn | Dồn kiếm thuật và ma pháp vào một đòn truy kích. | 15 MP · Hồi chiêu: 2 vòng · Một kẻ địch · vật lí · Thường · 200% ATK; ma pháp · Thường · 200% MAG |

### Lyon

**Vòng chơi:** Tạo khiên theo DEF, củng cố phòng tuyến và chặn hiệu ứng bất lợi bằng Hộ ấn.

**Gia huy bất khuất:** Mỗi thành viên Valmont trong đội giúp tăng chỉ số cho mọi người cùng gia tộc. +1 DEF nền/người · tính cả bản thân · +1 RES nền/người · tính cả bản thân.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Thành lũy gia tộc | Tạo khiên toàn đội dựa trên DEF của Lyon. | 14 MP · Hồi chiêu: 2 vòng · Toàn đội · Khiên: 150% DEF → 51/người |
| Hàng khiên bất khuất | Tăng phòng thủ vật lí cho toàn đội. | 12 MP · Toàn đội · +25% DEF · 2 lượt |
| Hộ ấn bất xâm | Bảo vệ một đồng đội khỏi hiệu ứng bất lợi kế tiếp. | 8 MP · Hồi chiêu: 2 vòng · Một đồng đội · Hộ ấn: 1 lần chặn · đến khi dùng hết |

### Cedric

**Vòng chơi:** Tăng sức tấn công, hồi HP và duy trì MP; tiếp sức tốt hơn cho Valmont.

**Hậu cần gia tộc:** Cuối lượt của bản thân, tiếp MP cho toàn đội. Hồi 2% MP tối đa · Valmont: 4%.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Hiệu lệnh gia tộc | Tăng sức tấn công vật lí và phép cho cả đội. | 12 MP · Toàn đội · +25% ATK · +25% MAG · 2 lượt |
| Tiếp viện chiến trường | Hồi HP toàn đội dựa trên ATK của Cedric. | 16 MP · Hồi chiêu: 2 vòng · Toàn đội · Hồi HP: 100% ATK + 8 → 33/người |
| Lệnh truy săn | Ra lệnh truy săn, đánh một địch bằng sức mạnh Phong. | 5 MP · Một kẻ địch · vật lí · Phong · 130% ATK |

### Helena Ranoc

**Vòng chơi:** Đổi thêm MP lấy những đợt phép Thủy diện rộng mạnh hơn.

**Cái giá của sự kiêu hãnh:** Kỹ năng công kích dùng thêm MP để tăng sát thương. Tiêu thêm tối đa 50% MP gốc → tối đa +50% sát thương.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Mưa rơi trên găng ren | Gọi mưa phép Thủy lên toàn địch. | 12–18 MP · Mọi kẻ địch · ma pháp · Thủy · 95% MAG; MP nội tại: tối đa +6 · sát thương tối đa ×1,5 |
| Chiếc ô ren mỏng manh | Dựng ô ma lực thành khiên bảo vệ bản thân. | 12 MP · Hồi chiêu: 2 vòng · Bản thân · Khiên: 150% MAG → 53 |
| Vũ hội sau màn mưa | Nhấn chìm toàn địch trong vũ hội mưa phép. | 36–54 MP · Hồi chiêu: 2 vòng · Mọi kẻ địch · ma pháp · Thủy · 180% MAG; MP nội tại: tối đa +18 · sát thương tối đa ×1,5 |

### Leonardo Ranoc

**Vòng chơi:** Bảo vệ đồng đội bằng kháng phép, nhận đòn thay và thanh tẩy.

**Trách nhiệm người anh cả:** Nhận sức mạnh thường trực từ nội tại. +20% RES.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Cứ nấp sau lưng anh | Nhận đòn thay một đồng đội và tự tăng kháng phép. | 6 MP · Một đồng đội · Nhận đòn thay · 2 lượt; Bản thân: +30% RES · 2 lượt kế tiếp |
| Mái nhà anh gìn giữ | Dựng kết giới kháng phép cho cả đội. | 18 MP · Hồi chiêu: 3 vòng · Toàn đội · +25% RES · 3 lượt |
| Anh sẽ không để ai gục ngã | Thanh tẩy toàn bộ hiệu ứng bất lợi của cả đội. | 35 MP · Hồi chiêu: 2 vòng · Toàn đội · Giải toàn bộ hiệu ứng bất lợi |

### Kyle Ranoc

**Vòng chơi:** Gắn Trò quậy để giảm RES và tăng sức mạnh phép của đồng đội khác.

**Ai bảo em không biết gì?:** Đồng đội khác đánh địch có Trò quậy được tăng MAG cho hit đó. +15% MAG.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Em có làm gì đâu! | Đánh ba hit, mỗi hit gắn thêm một tầng Trò quậy. | 20 MP · Hồi chiêu: 4 vòng · Một kẻ địch · ma pháp · Phong · 3 × (35% MAG); −12% RES/tầng · 3 lượt; +1 Trò quậy · tối đa 3 tầng · 3 lượt |
| Tại gió đấy chứ! | Đánh phép Phong vào một địch. | 6 MP · Một kẻ địch · ma pháp · Phong · 105% MAG |
| Bắt được em rồi hẵng nói! | Gọi gió phép quét qua toàn địch. | 14 MP · Hồi chiêu: 2 vòng · Mọi kẻ địch · ma pháp · Phong · 75% MAG |

### Iwayn

**Vòng chơi:** Xuyên DEF bằng quang thương; tăng sát thương theo chênh lệch tỷ lệ HP.

**Ý chí không lùi bước:** Chênh lệch tỷ lệ HP giữa bản thân và mục tiêu làm tăng sát thương. Bonus = chênh lệch HP% tuyệt đối · tối đa +30%.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Quang thương tiến bước | Đâm quang thương xuyên giáp một địch. | 5 MP · Một kẻ địch · vật lí · Quang · 110% ATK; Xuyên 10% DEF |
| Lời thề của kị sĩ trẻ | Lập lời thề, tăng ATK bản thân. | 10 MP · Hồi chiêu: 3 vòng · Bản thân · +25% ATK · 3 lượt kế tiếp |
| Thương quang quyết thắng | Dồn sức vào một đòn quang thương xuyên giáp. | 18 MP · Hồi chiêu: 2 vòng · Một kẻ địch · vật lí · Quang · 250% ATK; Xuyên 10% DEF |

### Percival

**Vòng chơi:** Làm chậm địch, tự hồi HP và nhận thêm MP khi được đồng đội hồi phục.

**Thân thể như dòng nước:** Thực nhận HP từ đồng đội khác sẽ hồi thêm MP. Hồi 8% MP tối đa · 1 lần/vòng.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Chùy đập sóng ngầm | Đập chùy Thủy, làm chậm một địch. | 6 MP · Một kẻ địch · vật lí · Thủy · 135% ATK; −15% SPD · 2 lượt |
| Bất động giữa dòng xiết | Giảm sát thương nhận và tự hồi HP mỗi đầu lượt. | 10 MP · Hồi chiêu: 2 vòng · Bản thân · Giảm 10% sát thương nhận · 2 lượt kế tiếp; Đầu lượt: hồi 10% HP tối đa · 2 lượt kế tiếp |
| Nhất chùy trấn hải | Giáng trọng chùy, làm chậm một địch. | 18 MP · Hồi chiêu: 2 vòng · Một kẻ địch · vật lí · Thủy · 220% ATK; −25% SPD · 2 lượt |

### Mandred

**Vòng chơi:** Chuyển HP tối đa thành ATK, dùng chiến phủ đánh một hoặc nhiều địch.

**Huyết lực cuồng sư:** Thể lực tối đa chuyển thành sức mạnh tấn công. +8% HP tối đa vào ATK nền.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Chiến phủ nghiền đất | Bổ chiến phủ Thổ vào một địch. | 5 MP · Một kẻ địch · vật lí · Thổ · 145% ATK |
| Sư tử quét trận | Quét chiến phủ Thổ qua toàn địch. | 12 MP · Mọi kẻ địch · vật lí · Thổ · 95% ATK |
| Đứa nào dám cản ta?! | Tăng ATK và khả năng chịu đòn của bản thân. | 12 MP · Hồi chiêu: 3 vòng · Bản thân · +20% ATK · Giảm 15% sát thương nhận · 2 lượt kế tiếp |

### Lionel

**Vòng chơi:** Cường hóa đồng đội, cấp Lượt Thêm và tiếp MP cho người cần nhất cuối vòng.

**Người dẫn lối không mỏi mệt:** Cuối vòng, tiếp MP cho đồng minh có tỷ lệ MP thấp nhất. Hồi 10% MP tối đa · tính cả bản thân.

| Kỹ năng | Mô tả ngắn | Thông số chính |
| --- | --- | --- |
| Lời thề người dẫn đường | Cường hóa sức tấn công vật lí và phép cho một đồng đội. | 8 MP · Một đồng đội · +25% ATK · +25% MAG · 2 lượt |
| Tiến lên một lần nữa! | Cấp một Lượt Thêm, thực hiện trong Vòng Phụ của vòng này. | 36 MP · Hồi chiêu: 4 vòng · Một đồng đội · Lượt Thêm: 1 · Vòng Phụ hiện tại |
| Ánh nước soi đường | Chiếu ánh nước tấn công một địch. | 6 MP · Một kẻ địch · ma pháp · Thủy · 115% MAG |

### Trấn Phái — 13 nội tại đã rà

| Mẫu | Nội tại ngắn |
| --- | --- |
| Dấu rèn khởi hành | Kiếm quang gây thêm 8% sát thương. |
| Khế ước bất kham | Hai biến thể Ogre’s Bane xuyên thêm 25% DEF. |
| Lời thề dư quang | Sau Giải phóng hoặc Giải phóng một phần, giảm 20% sát thương nhận đến hết lượt kế tiếp. |
| Bút ký vạn tượng | Công thức cường hóa tạo thêm 1 Dữ liệu, tối đa một lần/vòng. |
| La bàn hiệu chuẩn | Hiệu chỉnh thuật thức còn tăng 10% SPD trong 2 lượt. |
| Vạt áo vô ảnh | Né thành công đòn vật lí sẽ hồi 6% HP tối đa, tối đa một lần/vòng. |
| Kiếm ý nhất thiểm | Hoàn kiếm tiêu từ 2 Sơ hở trở lên sẽ xuyên thêm 25% DEF. |
| Lăng kính nguyên sơ | Hắc tinh vào địch chưa có mảnh sẽ gắn thêm 1 Mảnh Prisma, tối đa một lần/vòng. |
| Vương miện vạn sắc | Sụp đổ Prisma tiêu mảnh trên ít nhất 2 địch khác nhau sẽ hồi 8 MP sau chiêu. |
| Thánh tích giếng xưa | Tăng 50% lượng hồi HP từ nội tại vỡ khiên: 35% → 52,5% MAG. |
| Thủy kính thánh đường | Màn nước kéo dài 3 lượt thay vì 2. |
| Gia huy người gác cổng | Giảm thêm 15% sát thương khi thực sự nhận đòn thay đồng đội qua Che chắn. |
| Giáp trấn bắc | Dùng Thủ thành: hồi 6% HP tối đa một lần vào đầu lượt kế tiếp, kể cả lượt phụ. |

### Kỹ năng địch — cùng chuẩn trình bày

Các mô tả ngắn sẵn rõ được giữ lại; những đoạn trộn hệ số/ngoại lệ được tách lớp. Trinh sát tiếp tục cho phép đọc cơ chế trước khi xuất chiến.

| Kỹ năng | Mô tả ngắn |
| --- | --- |
| Chém lén | Chém lén một đối thủ. |
| Sóng nước | Gọi sóng nước đánh toàn đội đối phương. |
| Quật hai nhịp | Quật một đối thủ hai nhịp. |
| Đập nát | Đập mạnh một đối thủ và làm suy yếu ATK. |
| Chấn địa | Chấn động mặt đất, đánh toàn đội đối phương. |
| Đốm lửa | Ném một đốm lửa vào kẻ địch. |
| Bùa bóng tối | Gieo bùa chú lên mọi kẻ địch. |
| Cắn xé | Ngoạm mạnh một kẻ địch. |
| Vỗ cánh | Dùng sức gió và đôi cánh quật vào mọi kẻ địch. |
| Hơi thở cuồng phong | Phun một luồng gió phép vào mọi kẻ địch. |
| Vồ mồi | Lao tới cắn mạnh một kẻ địch. |
| Cắn liên hoàn | Cắn một kẻ địch hai lần liên tiếp. |
| Ngoạm chân | Cắn vào chân một kẻ địch. |
| Lăn nghiền | Cuộn mình lăn qua mọi kẻ địch. |
| Quật đuôi | Dùng chiếc đuôi nặng quật một kẻ địch. |
| Lời nguyền hắc kiếm | Gieo lời nguyền Ám, làm yếu sức tấn công toàn đội đối phương. |
| Xiềng đêm vĩnh cửu | Gây phép Ám và làm chậm toàn đội đối phương. |
| Thánh phán đọa lạc | Gây phép Quang, phá DEF và RES toàn đội đối phương. |
| Hắc thánh kiếm | Chém một kẻ địch bằng thanh thánh kiếm nhuốm bóng tối, gây sát thương vật lí Ám mạnh. |
| Nanh đen | Cắn một mục tiêu, gây sát thương vật lí Thường. |
| Quét đuôi | Quét đuôi qua cả đội, gây sát thương vật lí Thường. |
| Hỏa cầu hắc long | Phun một hỏa cầu vào một mục tiêu. |
| Hơi thở thiêu thành | Vận sức rồi phun lửa ma pháp lên cả đội. |
| Hỏa tức quét thành | Vận sức rồi quét lửa ma pháp qua cả đội. |
| Vảy thép nghiền nát | Nghiền một mục tiêu bằng hai đòn vật lí liên tiếp. |
| Hỏa cầu bạo liệt | Báo trước mục tiêu rồi phun hỏa cầu mạnh vào lượt sau. |
| Bạch hỏa liên hoàn | Phun hai đợt lửa phép lên toàn đội đối phương. |
| Tâm diệt thành | Vận sức rồi tung đại chiêu Hỏa diện rộng. |
| Kén tơ sắt | Dựng kén khiên, khép lại điểm yếu lộ ra khi vỡ kén. |
| Nanh nghiền | Cắn một mục tiêu bằng đôi nanh lớn, gây sát thương vật lí Thường. |
| Tơ siết | Kéo căng lưới tơ quất cả đội, gây sát thương vật lí Thổ. |
| Húc sườn | Lợn rừng lao vai vào một đối thủ. |
| Gặm chân | Chuột rừng cắn nhanh một đối thủ. |
| Khép vỏ cứng | Khép vỏ cứng thành khiên bảo vệ bản thân. |
| Hàm kẹp | Bọ cánh cứng dùng hàm kẹp một đối thủ. |
| Cắn chớp nhoáng | Dơi hang sà xuống cắn một đối thủ hai nhịp nhẹ. |
| Nanh rỉ độc | Cắn một đối thủ và gây độc. |
| Càng kẹp | Cua đồng dùng chiếc càng cứng kẹp một đối thủ. |
| Nanh đôi | Nhện rừng cắn một đối thủ bằng hai nhát nhẹ liên tiếp. |
| Bụi phấn độc | Rũ phấn gây phép Thổ lên toàn đội đối phương. |
| Tia lửa nhỏ | Đốm lửa phóng một tia lửa phép vào một đối thủ. |
| Va mình | Nhầy rêu nảy người va vào một đối thủ. |
| Nanh húc xé giáp | Húc nanh, làm giảm DEF của một đối thủ. |
| Đại náo ruộng đồng | Càn quét toàn đội đối phương. |

**Độ phủ:** 32 nhân vật, 100 kỹ năng của nhân vật (gồm nâng cấp/tự động), 44 kỹ năng địch và 13 Trấn Phái.
