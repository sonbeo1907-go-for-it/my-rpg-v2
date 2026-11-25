# Charlotte — Ánh chớp tranh ngôi

> Cập nhật 25/11/2026: Hào Quang Thuộc Về Chúng Ta! CD3. Xem [điều chỉnh](GRAND_ADJUSTMENT_2026_11_25.md).

Triển khai 17/11/2026. Nhân vật Hỗ trợ tấn công hệ Lôi thuộc Học viện Ma pháp, lớp 7A (`magic_academy`, `class_7a`), release #114. Chỉ thêm dữ liệu, chưa mở nguồn nhận; không có trong gacha, rate-up hoặc đổi vé. Save cũ tự bổ sung tiến trình khóa, không cấp sở hữu. Không thêm Trấn/Thông Thạo.

## Bộ kỹ năng và cấu hình playtest

HP160, MP120, ATK10, MAG32, DEF15, RES23, SPD24. Đánh thường phép Lôi theo MAG. Tài nguyên cá nhân **Tham Vọng**, tối đa5, bắt đầu0.

| Kỹ năng | MP / CD | Rank1 |
| --- | --- | --- |
| Màn Chào Sấm Sét | 10 / 0 | 120% MAG Lôi toàn địch, giảm25% RES trong3 lượt chính người nhận; tạo2 Tham Vọng |
| Tài Năng Không Thể Lu Mờ | 14 / 3 | Đồng đội ngoài hệ Quang/Ám, gồm bản thân: +8 ATK/MAG căn bản trong4 lượt chính; tạo3 Tham Vọng |
| Hào Quang Thuộc Về Chúng Ta! | 28 / 3 | Bản thân và một đồng đội khác ngoài Quang/Ám: +35% sát thương phép cho2 lần gây sát thương, cả hai nhận Lượt Thêm |

MP/CD và các chỉ số không được người dùng chỉ định là cấu hình playtest. CD3 dùng ở vòngR sẵn sàngR+4. Kỹ năng gán Lượt Thêm tuân thủ hàng đợi Vòng Phụ, tối đa1/người/vòng, không cấp tiếp trong Vòng Phụ. Không có mục tiêu hợp lệ thì từ chối nguyên hành động, không cấp nửa buff cho bản thân.

## Nội tại — Đến Lượt Tôi Tỏa Sáng!

- Đồng đội **khác** ngoài hệ Quang/Ám thực hiện kỹ năng không có hiệu ứng damage: +1 tầng. Không tính đánh thường, Phòng thủ, kỹ năng của chính Charlotte hoặc phản ứng tự động. Chiêu có sát thương nhưng né hết vẫn không trở thành chiêu hỗ trợ.
- Khi đồng đội khác gây sát thương phép hợp lệ: tiêu1 tầng để dùng **Ánh Chớp Giành Sân**, 120% MAG Lôi **toàn địch**, tối đa3 lần/vòng. Cả hệ nhân vật nguồn và hệ hit đều phải ngoài Quang/Ám; hit đa hệ có Quang/Ám bị loại. Đánh thường phép đủ điều kiện cũng kích.
- Xét sau toàn chiêu; nhiều hit hoặc nhiều mục tiêu vẫn chỉ1 lần. Sát thương vào khiên tính; né toàn bộ hoặc không gây sát thương không tính. Đòn kết liễu có thể gọi Liên kích vào những địch còn sống; không còn địch thì không tiêu tầng/quota.
- Không kích từ Charlotte, Liên kích, phản công hoặc sát thương tự động/Độc. Charlotte phải còn sống, có tầng và còn hạn mức. Khóa quota trước khi thực hiện tác dụng; Vòng Chính/Vòng Phụ dùng chung. Bộ chặn tự động PvP từ chối thì không tiêu tầng.
- Chiêu riêng tạo2/3 tầng độc lập với nội tại; không tự nhận thêm1. Tạo quá5 giữ5. Kỹ năng hỗ trợ của đồng đội không giới hạn riêng số lần tạo; vẫn chịu cap tài nguyên.

## Rank và buff

Rank chiêu2 tăng **cả** lượng ATK/MAG căn bản 5%/rank và hệ số Liên kích 10%/rank, theo luật tăng mọi nhóm hợp lệ. R5: +9,72405 ATK/MAG căn bản và175,692% MAG Liên kích. Chiêu1 tăng damage10%; RES debuff và lượng tầng giữ nguyên. Chiêu3 chỉ giảm MP theo luật buff khuếch đại; 35% và2 lần giữ nguyên. PvP chỉ lấy đếnRank5.

`baseStatModifiers` trên effect status lưu lượng đã rank vào instance lúc cấp, cộng trước buff phần trăm; không sửa prepared stats. Buff4 lượt đếm lượt chính người nhận, gồm lượt Rotary chuyển, kể cả Choáng; Extra không trừ. Chiêu đang cấp mới không trừ ngay. Dùng lại làm mới, không cộng nhiều bản cùng status. Phong Ấn có thể chặn và xóa buff có thể gỡ; lượng tài nguyên tạo riêng vẫn tính.

Hào Quang Chung là status hai lượt dùng, **chỉ tiêu theo cast có hit phép trực tiếp gây sát thương HP/khiên**, một lần/cast bất kể số hit/địch. Vật lí, hỗ trợ và né hoàn toàn giữ lần dùng. Có thể dùng cho đánh thường phép/Phản công/Liên kích phép; DoT không dùng. Buff khuếch đại đủ điều kiện lấy lớn nhất, những buff yếu hơn vẫn tiêu lượt dùng. Charlotte nhận buff trước khi được đồng đội kích Liên kích thì Liên kích có thể tiêu phần của riêng cô.

## Vòng đời, AI và hiển thị

Tầng, quota theo vòng và buff giữ qua wave cùng chuyến; không gia hạn thời hạn. Boss phase cùng trận không reset. Encounter độc lập mới và Đánh lại sạch state; phiên pháo đài theo adapter HP/MP-only. Snapshot/forecast không sửa live state/RNG. PvP dùng ID đơn vị riêng, phản ứng và mục tiêu tương đối theo phe.

Module `support-charge.js` cung cấp predicate/child rank/validator, không sửa rank của skill tự động trong data. `excludedTargetElements` lọc đồng đội theo hệ; `consumeDamageType` định nghĩa loại hit tiêu lượt buff. AI dùng forecast chung và định giá buff căn bản/amp phép. Dùng asset phép/Liên kích cơ bản; không có combatMode hoặc overlay bàn đấu mới.

Kiểm chứng: `test/charlotte.test.js` bao phủ nguồn kích hoạt, bộ lọc hệ, AoE, quota, typed amp, Rank, lượt Choáng/Extra, carry, PvP đối xứng, snapshot, validation và copy. E2E dùng save giả trong trình duyệt, không sửa save thật.

Nghiệm thu17/11: 1.711/1.711 kiểm thử engine qua, gồm25 ca Charlotte; validate và TypeScript qua;2/2 E2E production qua ở1440/768/390px. Đã xem ảnh trang kỹ năng và trận đấu mobile, không tràn ngang. Preview nâng Rank và thẻ Liên kích tự động cùng đọc Rank chiêu2. Graph code cập nhật cục bộ.
