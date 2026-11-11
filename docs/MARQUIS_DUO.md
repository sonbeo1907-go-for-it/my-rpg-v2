# Kanade Hanasato và Wilson Marquis

Triển khai 11/11/2026. Hai nhân vật chính thức, `releaseId` 102/103, cùng phe `house_marquis` (Gia tộc Marquis). Kanade giữ tên và nguồn gốc Hanasato; hôn ước với Wilson là liên kết chính trị Đông–Tây.

## Chỉ số nền playtest

| Nhân vật | Hệ / vai trò | HP | MP | ATK | MAG | DEF | RES | SPD |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Kanade | Thổ / DPS ma pháp | 150 | 110 | 10 | 40 | 14 | 24 | 17 |
| Wilson | Thổ / Hỗ trợ tấn công | 170 | 115 | 14 | 32 | 18 | 23 | 21 |

Wilson chưa có nguyên tố/chỉ số trong brief: cấu hình playtest dùng Thổ và scale MAG để đồng bộ bộ kỹ năng. Các chi phí chưa được chỉ định cũng là giá trị playtest, không phải kết luận cân bằng.

## Kanade

**Hoa Nở Trên Kẽ Đá** (`element_weakness_skill`): khi kỹ năng chủ động đánh trúng điểm yếu Thổ, mục tiêu đó nhận hệ số điểm yếu ×2 thay cho ×1,5 và thêm 50% sát thương từ nội tại.

- Xét riêng từng mục tiêu, kể cả trong một chiêu AoE. Sơ Hở Thổ hợp lệ cũng thỏa điều kiện; chỉ yếu ma pháp hoặc yếu hệ khác không thỏa.
- Không áp dụng đánh thường, Liên kích, phản công hoặc đòn tự động. Không tạo một buff duy trì trên Kanade hoặc giữ hiệu quả cho chiêu sau.
- Khai Phá Điểm Yếu từ nhiều nguồn lấy mức cao nhất, không nhân đôi. +50% là bonus nội tại trong nhóm bonus sát thương; các buff khuếch đại kỹ năng vẫn theo luật chỉ lấy buff mạnh nhất. Ví dụ không giáp: 40 MAG × 200% × 2 điểm yếu × (1 + 50%) = 240 sát thương; có thêm buff khuếch đại 40% thì là 304, không phải 336.
- Tính trước soft cap PvP. Không đổi cơ chế của nhân vật khác.

| Kỹ năng | MP / CD | Hiệu ứng Rank 1 |
| --- | --- | --- |
| Hoa Nở Nơi Đất Khách | 18 / 3 | +35% MAG trong **4 lượt chính**, nhận Lượt Thêm |
| Địa Mạch — Hoa Chạm Đá | 8 / không CD | 200% MAG một địch, giảm 20% RES trong 2 lượt chính |
| Hanasato — Vườn Hoa Khép Lối | 22 / 3 | 320% MAG toàn địch, áp 1 lần Phong Ấn mỗi mục tiêu |

CD theo bộ Mori hiện tại: tự buff/AoE CD3, đơn mục tiêu không CD. Buff MAG dùng 4 lượt chính để phủ khoảng tái sử dụng CD3: dùng R1, duy trì R2–R4, làm mới ở lượt chính R5. Lượt Thêm không trừ thời hạn và không giảm CD. Choáng mất lượt chính vẫn trừ thời hạn; bị xóa buff hoặc không thể tái thi triển có thể làm gián đoạn uptime. Không bảo đảm miễn gián đoạn.

## Wilson

**Hoa Nối Nhịp Đồng Hành** (`element_skill_echo`): tối đa **2 lần mỗi vòng**, sau khi một đồng đội **Thổ khác** hoàn tất kỹ năng:

- Nếu kỹ năng không có effect damage: kích hoạt dù hồi HP/buff không làm tăng giá trị thực vì mục tiêu đã đầy/đã có hiệu ứng.
- Nếu kỹ năng có damage: phải thực sự gây sát thương **phép Thổ** lên HP hoặc Khiên của ít nhất một địch. Không kích chỉ từ việc gây debuff, bị né toàn bộ, sát thương vật lí Thổ hoặc phép hệ khác.
- Liên kích toàn bộ kẻ địch còn sống bằng **Hoa Đất Mở Đường** ở Rank hiện tại, gồm cả phần gắn Sơ Hở; không tiêu MP và không thay đổi CD của kỹ năng đó. Chiêu đầu vẫn dùng được chủ động theo MP/CD bình thường.
- Một kỹ năng nhiều hit/nhiều mục tiêu chỉ xét một lần. Không tự kích từ chính Wilson; không kích từ đánh thường, Phòng thủ, Độc, phản công, Liên kích hoặc đòn tự động. Không gọi lại vòng cast chủ động để tránh chuỗi lặp.
- Hạn mức được giữ trước khi giải phản ứng, dùng chung Vòng Chính/Vòng Phụ; vòng mới được phép kích lại. Qua wave hoặc phase trong cùng vòng không cho thêm lượt kích hoạt.
- Wilson phải còn sống; Choáng chỉ chặn hành động chủ động, không tắt nội tại. Nếu không còn kẻ địch sống thì không tiêu hạn mức. Arena tính phe tương đối, hai Wilson ở hai đội giữ hạn mức độc lập và chịu budget phản ứng/soft cap hiện hành.

| Kỹ năng | MP / CD | Hiệu ứng Rank 1 |
| --- | --- | --- |
| Hoa Đất Mở Đường | 12 / 2 | 120% MAG toàn địch; mỗi mục tiêu trúng nhận 2 Sơ Hở Thổ |
| Lời Hẹn Trên Địa Mạch | 10 / không CD | 120% MAG toàn địch; giảm 20% RES trong 2 lượt chính |
| Mùa Hoa Chưa Hẹn | 12 / không CD | Hồi toàn đội 75% MAG |

Giảm RES của Wilson và Kanade dùng chung status `marquis_res_break`: làm mới, không cộng thành −40%. Rank tăng sát thương/hồi máu 10% và buff MAG 5% mỗi cấp theo luật chung; không tăng số Sơ Hở/Phong Ấn, giảm RES, thời hạn hay hệ số nội tại. Chưa mở Thông Thạo cho hai nhân vật mới.

## Chiêu Mộ, UI và save

- Có trong pool thường và phần ngoài rate-up ngay. Thêm vào roster rate-up từ **12/11/2026**, thuộc pool quý tộc chung; giữ các featured lineup trước ngày thêm. Không tạo banner riêng.
- Không tặng miễn phí. Save cũ được thêm state khóa khi load; không đổi namespace/schema, không đổi ID nhân vật cũ.
- Dùng card, silhouette, icon, glyph phép/hồi máu/hiệu ứng sẵn có theo vai trò/hệ. Có mô tả nội tại tiếng Việt, preview Rank và chỉ dẫn AI riêng.
- Không thêm Trấn Phái ngoài yêu cầu.

## Kiểm chứng

`test/marquis.test.js`: gacha/save, điều kiện nội tại từng mục tiêu, native weakness/Sơ Hở, không nhân đôi Khai Phá, thứ tự refresh Sơ Hở sau chiêu nguồn, Rank của Liên kích, bỏ qua MP/CD, hạn mức chung main/extra, tự kích/vòng lặp, stun/death, duy trì buff qua lượt thực, status dùng chung, heal và PvP hai phía. `e2e/marquis.spec.ts`: tìm hai nhân vật, mở chi tiết/kỹ năng, copy nội tại và layout mobile không tràn ngang.
