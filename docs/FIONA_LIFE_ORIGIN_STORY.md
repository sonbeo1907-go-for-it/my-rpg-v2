# Cội nguồn của sự sống — Fiona

## Chương và mở khóa

Fiona bắt buộc tham chiến cả ba chương. Hoàn thành theo thứ tự; phần thưởng đặc biệt chỉ nhận lần đầu, ô trang bị dùng chung giới hạn 6 ô với bản trùng. Nếu đã đủ ô, không phát ô vượt giới hạn hay đổi thành tiền.

| Chương | Đối thủ | Thưởng lần đầu | Coin mỗi lần thắng toàn chương |
| --- | --- | --- | --- |
| Eins | 3 đợt: 2 quỷ lùn + pháp sư quỷ lùn; 2 chiến binh quỷ lùn + pháp sư; chiến binh chằn + chiến binh quỷ lùn + quỷ lùn | Khúc xạ hoàn thiện, +1 ô Fiona | 50 |
| Zwei | 2 đợt: 2 chiến binh chằn; chiến binh chằn + tay sai vua chằn | Hội tụ Prisma, +1 ô Fiona | 50 |
| Drei | Vua Chằn, 2 giai đoạn, yếu Ám | Tia sáng le lói, +1 ô Fiona | 150 |

Các nâng cấp cũ được giữ nguyên: Khúc xạ hoàn thiện thêm 2 Prisma lên mục tiêu đã mang dấu, 1 lên mục tiêu chưa có; tối đa 3. Hội tụ Prisma là chiêu kích nổ đơn mục tiêu. Nâng cấp nhận sau khi thắng, có hiệu lực khi bắt đầu trận mới.

## Tia sáng le lói

- Schema nội tại: detonation_base_growth; statusId prisma; stat magic; increment 2; cap 10.
- Dùng **chung** tiến độ cho Sụp đổ Prisma và Hội tụ Prisma.
- Một lần thi triển thực sự tiêu ít nhất 1 Prisma: tăng +2 MAG căn bản, tối đa +10; áp dụng ngay cho toàn chiêu đó, trước buff MAG%.
- Diện rộng, nhiều mục tiêu, nhiều dấu: vẫn chỉ tăng một lần mỗi chiêu. Chốt điều kiện trước khi đánh để kết quả không lệ thuộc thứ tự mục tiêu.
- Không tăng vì đặt dấu, đánh thường, phản ứng, thao tác không hợp lệ hoặc kích nổ khi không có dấu. Không tăng MAG của các chiêu khác.
- Giữ tiến độ qua các đợt trong cùng chương/chuyến và các giai đoạn boss; bắt đầu trận/chương độc lập đặt lại về 0.
- Preview trực tiếp tính mức tăng của lần sắp thi triển, không sửa actor hay tiêu dấu. Thẻ Fiona hiện tiến độ +N/10 MAG.

## Luật nhiều đợt

Encounter gốc chứa waves, enemies phải khớp đợt đầu. story-waves.js tạo snapshot đội/trang bị khi xuất phát, tiếp tục dùng actor đã đánh: HP, MP, khiên, tài nguyên, trạng thái, cooldown, nội tại, combatMode và hiệu ứng bàn đấu. Sang đợt bắt đầu vòng kế tiếp; đồng hồ vẫn trôi theo luật combat bình thường, không hồi đầy hay reset hồi chiêu.

Địch có ID riêng theo đợt; giữ nguồn hiệu ứng cũ. Không cleanup triệu hồi ở thắng trung gian. Thắng cuối/đội bị hạ/draw vẫn cleanup như trận thông thường. UI có tiến độ và nút tiếp tục nếu cần thử lại chuyển đợt; không hiện nhận thưởng trung gian.

Chỉ thắng đợt cuối mới cộng Coin, một chiến thắng, nâng cấp và ô trang bị. Lưu thất bại không đánh dấu đã nhận, được thử lại. Truyện không vào danh sách Quest công khai, pool Mỏ Vàng/Hiểm Nguy, bộ đếm ủy thác Quest thường hay hạn mức dungeon.

## Vua Chằn

HP 1800, MP 180, ATK 48, MAG 26, DEF 30, RES 26, SPD 14; yếu Ám (+50%). Loại boss phased tái sử dụng, không cần cơ chế Kìm hãm của Miraebolis.

- Giai đoạn 1: Uy quyền dưới lòng đất; giai đoạn 2: Cơn thịnh nộ của vua chằn, tại 50% HP.
- Một hành động mỗi lượt cả hai giai đoạn. Giai đoạn 2 tăng 15% sát thương.
- Không thể bỏ qua giai đoạn bằng một đòn quá mạnh. Chuyển giai đoạn giữ trạng thái đội và không hồi MP miễn phí; Miraebolis vẫn giữ luật hồi MP cũ.
- Vương chùy: 115% ATK, miễn MP; Búa đá khai sơn: 160% ATK, 10 MP, -20% DEF 2 lượt chính; Chấn địa vương quyền: 75% ATK toàn địch, 10 MP; Thiên băng địa liệt: 110% ATK toàn địch, 14 MP, báo trước một vòng.

## Kiểm tra cân bằng ban đầu

Mô phỏng 5 seed với chính engine, đội Fiona/Iris/Elaine/Takeshi, chính sách đơn giản tạo dấu–kích nổ, buff, dựng khiên và né/phản công; nâng cấp Fiona đúng tiến độ, không dùng nội tại nhận sau Drei:

| Trang bị | Tay sai vua chằn | Vua Chằn | Alice |
| --- | --- | --- | --- |
| Không gear | Thắng 5/5, 6–8 vòng | Thắng 5/5, 20–23 vòng, có trường hợp mất người | Thua 5/5 |
| Fiona +9 MAG (3 gear T2) | Thắng 5/5, 6 vòng | Thắng 5/5, 12 vòng | Thua 5/5 |

Đội thay Takeshi bằng Garrek có sát thương thấp hơn và dễ thiếu MP ở Zwei/Drei; +9 MAG vượt Zwei 5/5, Drei 3/5. Đây là smoke test vị trí độ khó, không chứng minh cân bằng với mọi đội, gear và chiến thuật.

## Nghiệm thu

test/fiona-story.test.js kiểm tra cổng mở khóa/đội bắt buộc, thưởng cuối chuỗi, lưu lỗi và nhận lại, cap gear, save roundtrip, carry trạng thái/triệu hồi, cộng MAG chung/giới hạn/preview, boss chuyển phase/telegraph và validator. e2e/fiona-story.spec.ts kiểm tra trinh sát/xác nhận trên desktop/mobile, đánh thực tế 3 wave Eins nhận thưởng và giao diện boss hai giai đoạn. Các kiểm thử Miraebolis, Iris và triệu hồi cũ phải tiếp tục pass.
