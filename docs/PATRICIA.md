# Patricia — Nhà Nghiên Cứu Địa Tầng

DPS ma pháp Thổ, **Kị sĩ Sư đoàn Viễn Chinh** (`expedition_corps`), release 94. Bộ kỹ năng xoay quanh Khiên đồng đội: Khiên vừa bảo vệ vừa cộng hưởng thành MAG cho Patricia.

## Chỉ số nền

HP140 / MP100 / ATK9 / MAG36 / DEF16 / RES22 / SPD16.

## Nội tại — Cộng Hưởng Khiên Đá

`shielded_ally_magic`, `ratio: 0.15`.

- Mỗi **thành viên còn sống trong đội đang có Khiên** cộng thêm **15% MAG** cho Patricia.
- Khiên từ bất kỳ nguồn nào đều tính, gồm Khiên do chính Patricia tạo và Khiên của bản thân cô.
- Tối đa 4 thành viên → **+60% MAG**. Hiệu ứng luôn hoạt động, không cần bật/tắt.
- MAG động dùng cho sát thương, hồi/khiên và tỉ lệ Choáng đều tính aura này.
- Khiên hấp thụ hết hoặc hết hạn thì thành viên đó không còn được tính.

## Kỹ năng

| Kỹ năng | MP / CD | Hiệu ứng |
| --- | --- | --- |
| Lớp Chắn Địa Tầng `patricia.bedrock` | 10 / CD1 | Khiên toàn đội bằng **65% MAG** hiện tại |
| Quét Sóng Địa Chấn `patricia.survey` | 5 / không CD | **180% MAG** toàn địch |
| Khoan Phá Lõi Đá `patricia.core` | 18 / CD3 | **480% MAG** một địch; có cơ hội Choáng 1 lượt chính |

### Tỉ lệ Choáng

`chance = min(80%, MAG động / 160 × 80%)`.

- Đạt **80% tại 160 MAG động**.
- MAG động gồm aura Khiên và các buff MAG đang hiệu lực, không dùng MAG căn bản.
- Dưới 160 MAG thì tuyến tính; ví dụ 80 MAG → 40%.

## Trấn Phái — Thấu Kính Địa Tầng

`patricia.geode`, mở công thức bằng **10 Bản Thiết Kế** tại Shop, chế tạo tại Thợ Rèn.

- Cuối vòng, hồi **2% MP tối đa** cho Patricia với **mỗi thành viên còn sống trong đội đang có Khiên**, gồm bản thân.
- 3 người có Khiên → 6% MP; 4 người → 8% MP. Hồi theo MP tối đa hiện tại và không vượt trần.
- Đếm trước khi Khiên hết hạn ở bước kết thúc vòng.

## Kiểm chứng

`test/patricia.test.js`: chỉ số/phe/banner/AI, đếm aura theo từng Khiên, aura áp vào sát thương và kỹ năng Khiên, tỉ lệ Choáng theo MAG động và trần 80%, Trấn hồi MP cuối vòng, mua công thức/chế tạo. UI dùng chung `skill-copy` và `validateContent`; Trấn xuất hiện trong Shop và Thợ Rèn qua dữ liệu `exclusiveGear`.
