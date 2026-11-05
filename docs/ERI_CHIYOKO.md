# Shimoe Eri và Chiyoko

Chốt triển khai 05/11/2026. Hai nhân vật chính thức có trong pool Chiêu Mộ; không thay đổi trạng thái thử nghiệm của Astoria. Đợt banner đang chạy giữ nguyên, hai ID tham gia chọn rate-up từ 09/11/2026. Đây là cấu hình playtest, chưa phải kết luận cân bằng.

## Shimoe Eri — Nét vẽ mang linh hồn

DPS ma pháp Thổ, học sinh Học viện Ma pháp. Các kỹ năng chủ động gây đồng thời Thổ + Hồn Kiếm; khớp điểm yếu chỉ áp dụng một lần. Chỉ số Lv1: HP110, MP120, ATK8, MAG42, DEF10, RES25, SPD16; theo mẫu Lisbeth, riêng MP120.

| Kỹ năng | Hiệu quả Rank1 | Chi phí / CD |
| --- | --- | --- |
| Nét Cọ — Chấm Sơn | Một địch, 220% MAG | 8 MP / không CD |
| Song Sắc — Vẽ Núi | Một địch, 2 đòn ×180% MAG; tạo trực tiếp 1 Hồn Kiếm | 14 MP / CD1 |
| Đại Họa — Giang Sơn Nhập Mộng | Một địch, 3 đòn ×240% MAG | Ưu tiên6 Hồn Kiếm, thiếu dùng32 MP / CD3 |

**Sắc Màu Của Những Linh Hồn:** đầu vòng, đếm Hồn Kiếm phe mình thực sự đã tiêu ở vòng liền trước. Mỗi tầng cho Eri +20% MAG, tối đa +100%, hết hiệu lực cuối vòng hiện tại sau toàn bộ Vòng Phụ. Không tiêu thêm tài nguyên, không cộng dồn MAG đã resolve; vòng không tiêu thì vòng sau không có phần tăng. Lượng tạo, tràn trần và tiêu ảo của Liên kích không được tính. Chỉ kích nếu Eri còn sống tại đầu vòng; Choáng không chặn nội tại. Giữ số liệu qua snapshot/carry trong cùng battle, không chuyển giữa hai trận độc lập. Tài nguyên và phần tăng tách riêng từng phe Đấu Trường.

## Chiyoko — Tổ kiếm hợp mạch

DPS ma pháp Ám dùng Tachi và scale ATK; **sát thương qua RES**, không qua DEF. Thuộc Hội Thợ Săn Yêu Quái đồng thời có biên chế quân đội Keijo (`youkai_hunters_guntai`, tags riêng `youkai_hunters`/`guntai`). Chỉ số Lv1: HP185, MP110, ATK40, MAG12, DEF18, RES22, SPD16. ATK40/SPD16 theo yêu cầu; phần còn lại là cấu hình playtest.

| Lệnh | Hiệu quả Rank1 | Chi phí / CD |
| --- | --- | --- |
| Đánh thường | Hai đòn ×80% ATK, phép Ám + Hồn Kiếm | 0 MP |
| Nhất Thức — Ảnh Trảm | Một địch, 220% ATK | 6 MP / không CD |
| Nhị Thức — Đoạn Không | Hai đòn: mỗi đòn 250% ATK mục tiêu chính, 175% hai địch kề bên; không nối vòng; tạo trực tiếp1 Hồn Kiếm | 16 MP / CD2 |
| Tổ Kiếm — Hợp Mạch | Vào dạng đến hết trận; thay chính lệnh này bằng Tuyệt Thức | Bắt buộc6 Hồn Kiếm, không dùng MP thay thế; tốn một hành động |
| Tuyệt Thức — Vạn Ảnh Quy Kiếm | Năm đòn diện rộng ×120% ATK, sau đó một đòn180% ATK chỉ vào mục tiêu chính; đòn cuối xuyên100% RES | Ưu tiên6 Hồn Kiếm, thiếu dùng28 MP / CD3; chỉ trong dạng |

Mọi đòn gây sát thương, kể cả đánh thường, mang Ám + Hồn Kiếm. Trong dạng: +10 ATK căn bản, +30% ATK và xuyên25% RES với sát thương phép, đồng thời duy trì Thăng Tiến. Tổng xuyên không quá100%; đòn cuối không thành125%. Nếu mục tiêu chính đã gục trước đòn thứ sáu, bỏ đòn cuối, không đổi mục tiêu. Chọn sai mục tiêu không trả chi phí.

Mode không đếm vòng/lượt: không hết vì Choáng, Lượt Thêm hoặc Hồn Kiếm về0; gục/kết thúc trận thật thì dọn theo lifecycle hiện hành. Không tự cấp Lượt Thêm khi biến hình. Giữ mode qua wave/phòng cùng battle và phase boss; encounter khác trong phiên pháo đài chỉ giữ HP/MP theo luật chung. Không đổi nền/BGM; nhãn dạng nằm trong card như Yufina/Joshua.

## Thăng Tiến — cơ chế tái sử dụng

Status `escalation`, loại buff, `hitDamageGrowth:0.05`; mặc định2 lượt chính người mang. Lượt Phụ không trừ, lượt chính bị Choáng vẫn trừ theo `main_turn`. Nguồn cấp bình thường chịu luật xóa/chặn buff chung.

Mỗi hit tiếp theo trên cùng mục tiêu trong một hành động nhân sát thương ×1,05 so với hệ số tăng của hit trước: `1; 1,05; 1,1025; …`. Tính vào sát thương cơ sở sau phần công/thủ, trước mọi lớp khuếch đại sát thương và soft cap PvP. Không phải damage amp: không tham gia quy tắc chọn buff khuếch đại lớn nhất, không bị amp khác thay thế; hai lớp nhân nối tiếp, chỉ làm tròn ở kết quả cuối. Snapshot sát thương trước phòng thủ cho phản công cũng tính phần tăng này. Chuỗi tách theo mục tiêu dự định và từng hành động, không theo từng effect; né vẫn là một hit đã thực hiện. Phản ứng dùng context mới. Đòn cuối Chiyoko vào cùng mục tiêu là hit thứ6, nhận `1,05^5`; không tự tăng hệ số riêng của nội tại hoặc tài nguyên.

`combatModes[mode].boundStatuses` cấp buff ảo trong activeStatuses, không chèn instance vô hạn vào save. Với Chiyoko, Thăng Tiến gắn chặt mode nên không bị xóa/chặn riêng, không bị giảm theo lượt; rời mode là mất. Tooltip phân biệt “duy trì cùng dạng” với bản buff theo lượt. `combatModes[mode].penetration` là cấu hình xuyên theo damageType có validator.

## Rank, tài nguyên và AI

Damage các kỹ năng tăng10% mỗi Rank theo quy tắc hiện hành; cap nội tại, số hit, xuyên, tài nguyên, Thăng Tiến và chi phí không tự tăng. Biến hình fixed Rank. Natural Soul vẫn có quota theo đội; tiêu rồi kỹ năng tạo +1 tự nhiên là hành vi chung, không phải hoàn trả miễn phí. Eri skill2 và Chiyoko Đoạn Không mỗi chiêu có một lần tạo trực tiếp nên có thể kích Shion/Yukino; tăng tự nhiên không kích.

AI dùng availability/cost/target chung: Eri ưu tiên burst khi đủ điều kiện; Chiyoko chuẩn bị dạng rồi dùng finale. Mục tiêu chính của finale được AI xét riêng dù năm hit đầu là AoE. Hai phe dùng ID và tài nguyên tương đối, forecast chạy bản sao không trả chi phí thật.

## VFX và nghiệm thu

Chiyoko: SVG đường rút kiếm, tàn ảnh kiếm, giao thoa tổ kiếm tông xanh lạnh/trắng. Đánh thường và mọi kỹ năng có `iaido_*`; animation đọc damage/dodge event, không sinh damage hay tác động bàn đấu. AoE có một signature/nhịp hit ở đội hình địch; hit cuối trở về card mục tiêu chính. Không nhân signature theo số địch; timer/portal được dọn khi hết cast, đổi trận, ẩn trang hoặc đổi reduced motion. Reduced motion bỏ chuyển động, giữ dấu hiệu ngắn.

Kiểm tra: `test/eri-chiyoko.test.js` (cost, Rank, lượt thật, Choáng, KO, đa hit/lan/primary, restore, forecast, Arena mirror và timeline), `e2e/eri-chiyoko.spec.ts` (mobile, tooltip, thức tỉnh, VFX cleanup/reload). Full engine suite, validate, TypeScript và web build phải qua trước bàn giao. Kiểm thử cơ chế không chứng minh cân bằng DPS trên tất cả đội hình.
