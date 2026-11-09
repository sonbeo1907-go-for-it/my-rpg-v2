# Kreider Rank5 và Lisbeth Rank5 · Thông Thạo3

Đo ngày 06/11/2026 bằng engine trước bản giảm hệ số Mastery, `node scripts/compare-kreider-lisbeth.mjs`. Đây là so một nuke, không phải DPS cả vòng xoay hay tỷ lệ thắng.

## Điều kiện

- Cùng Lv50, Đột Phá3, phân bổ MAG tối đa hợp lệ và ba món T3 MAG+5; không Trấn, GearIV, đồng đội buff, điểm yếu hoặc debuff từ kẻ địch.
- Kreider tất cả kỹ năng Rank5. Lisbeth tất cả kỹ năng Rank5 · Thông Thạo3, gồm Kiêu hãnh Ranoc. Nghĩa là Lisbeth đầu tư thêm6 Original cho nuke, thêm6 cho self-buff; không phải so hai nhân vật bằng nhau về tổng chi phí.
- Kreider MAG sau allocation/gear73. Lisbeth88,8 sau nội tại20%; khi đã self-buff, MAG động148,6600.
- Địch đủ HP để không bị cắt sát thương do overkill; RES30 hoặc100, trung tính. RNG0,5. Đo trực tiếp từ `executeAction` và damage event.
- “Tự chuẩn bị”: mỗi bên dùng một lượt, Kreider gắn giảm35% RES (một debuff), Lisbeth tự buff MAG. “Đủ3debuff”: thêm giảm ATK và MAG địch để Kreider đạt+90% damage; hai debuff phụ không làm giảm RES thêm.

## Kết quả với Mastery hiện tại20%/10%

| RES gốc địch | Trạng thái | Kreider | Lisbeth | Lisbeth/Kreider |
| ---: | --- | ---: | ---: | ---: |
| 30 | Chưa chuẩn bị | 304 | 612 | 2,01 |
| 30 | Tự chuẩn bị | 402 | 1.036 | 2,58 |
| 30 | Kreider đủ3debuff, Lisbeth tự buff | 588 | 1.036 | 1,76 |
| 100 | Chưa chuẩn bị | 265 | 574 | 2,17 |
| 100 | Tự chuẩn bị | 370 | 998 | 2,70 |
| 100 | Kreider đủ3debuff, Lisbeth tự buff | 541 | 998 | 1,84 |

Kreider Cao trào26MP/CD2, scale gốc300%; Lisbeth Phán quyết28MP/CD2, scale gốc280%. Rank5 ×1,4641 làm nuke Kreider439,23%; Mastery3 hiện tại làm Lisbeth708,39%. Lisbeth có native MAG20% và self-buff mạnh hơn sau Mastery. Kreider có giảm RES giúp cả đội; lợi ích ấy không được tính thành damage riêng trong bảng.

**Kết luận:** Lisbeth M3 vượt rõ burst Kreider R5 ở phép đo này, kể cả khi Kreider đủ3debuff. Không đủ bằng chứng để tự buff/nerf Kreider hoặc kết luận toàn roster cân bằng. Cần đo nhiều vòng, uptime/debuff kháng hoặc bị giải, MP, đội hình thực và chi phí Original. Chưa chỉnh kit Kreider trong đợt này.

## Đề xuất mới: Bạc/Vàng12% sát thương,6% buff; Cầu Vồng15%/7,5%

Phần này là phân tích toán học, **đã được duyệt và áp dụng ở bản cập nhật tiếp theo trong cùng ngày**. Tăng lũy tiến trên mức trước, không cộng thẳng vào Rank5. Damage/heal/shield dùng cùng nhóm tăng output; chỉ buff chỉ số vốn được phép tăng mới nhận nhóm buff. Damage amp, debuff, xuyên, CD, thời hạn, tài nguyên và Liên kích cố định không tự tăng. Nhánh chỉ giảm MP vẫn giữ luật riêng đã chốt, không âm thầm đổi thành6%.

| Mức | Damage/heal/shield hiện tại so Rank5 | Đề xuất | Buff hiện tại so Rank5 | Đề xuất |
| --- | ---: | ---: | ---: | ---: |
| Bạc | +20% | +12% | +10% | +6% |
| Vàng | +44% | +25,44% | +21% | +12,36% |
| Cầu Vồng | +72,8% | +44,256% | +33,1% | +20,787% |

Ở M3, hệ số output mới thấp hơn cũ16,52%, hệ số tăng buff thấp hơn9,25%. Đây là giảm hệ số tăng trưởng, **không đồng nghĩa mọi đòn trong engine giảm đúng16,52%**: công thức còn trừ phòng thủ, làm tròn và tương tác stat buff. Ví dụ nuke Lisbeth ở M3 sẽ có hệ số591,39% thay708,39% trước phòng thủ, và self-buff MAG sẽ nhỏ hơn; kết quả đo mới nằm ở phần bổ sung cuối trang.

**Khuyến nghị dùng đề xuất cho playtest tiếp theo.** Nó giảm cú nhảy hệ số trên nhóm đầu roster và giảm hiệu ứng kép của kỹ năng/self-buff cùng được nâng. Cầu Vồng vẫn có bước tăng lớn hơn để phân biệt với Vàng. Tuy nhiên nó không sửa nhân vật có vòng xoay/tài nguyên yếu hoặc kỹ năng chủ đạo vốn fixed; đừng mở tăng trưởng cho các hiệu ứng đó chỉ để “bù”.

Chi phí1/2/3 Original vẫn có thể giữ làm mốc playtest. M3 tốn3 Original để nhận15%/7,5%, hiệu suất thấp hơn M1; đây là lựa chọn tối ưu nhân vật yêu thích, không nên quảng bá là bắt buộc. Khi áp dụng cần dùng bảng hệ số theo từng mức trong data, validator/preview/combat cùng đọc một nguồn; không thêm phép nhân riêng trong UI.

Mastery chỉ PvE, mọi PvP tối đa Rank5. Ogre’s Bane không Mastery, chỉ Rank1–5 sau Hắc Ảnh Arthur Lv60.

## Nghiệm thu đợt triển khai
Validate và typecheck hợp lệ; production web build thành công; 1.336/1.336 unit test qua. Các kiểm tra trình duyệt Arthur/Mastery/Rank/Takeshi đã qua, gồm preview, thanh toán, lỗi lưu, khóa trước màn Khó, ba cấp hiển thị và thắng đủ ba phase. Không dùng các test phần thưởng ép outcome để tuyên bố độ khó cân bằng; phép đo damage ở trên dùng cast thật. Chưa build EXE trong đợt này.

## Đo lại sau khi áp dụng hệ số mới

Cùng điều kiện phía trên, không Trấn Phái (không bao gồm Trấn Kreider mới).

| RES | Trạng thái | Kreider R5 | Lisbeth M3 | Tỷ lệ |
| ---: | --- | ---: | ---: | ---: |
| 30 | Chưa chuẩn bị | 304 | 508 | 1.67 |
| 30 | Tự chuẩn bị | 402 | 829 | 2.06 |
| 30 | Kreider đủ3debuff | 588 | 829 | 1.41 |
| 100 | Chưa chuẩn bị | 265 | 470 | 1.77 |
| 100 | Tự chuẩn bị | 370 | 791 | 2.14 |
| 100 | Kreider đủ3debuff | 541 | 791 | 1.46 |

Đây vẫn là một nuke với đầu tư Mastery không ngang nhau. Không suy kết luận cân bằng Trấn Kreider mới hoặc DPS nhiều vòng từ bảng này.
