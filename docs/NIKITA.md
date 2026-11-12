# Nikita — Lưỡi Dao Sau Vương Miện

Nhân vật chính thức #107, Kị sĩ đoàn Thủ đô, cận vệ công chúa Mirabelle và sát thủ hoàng gia. Không mở miễn phí; có trong banner thường và danh sách xoay từ 12/11/2026. Không tự mở Thông Thạo hay Trấn Phái.

HP150 / MP100 / ATK10 / MAG35 / DEF15 / RES22 / SPD20. DPS phép Phong, dùng dao, sát thương phép scale MAG.

| Kỹ năng | Rank 1 | Chi phí |
| --- | --- | --- |
| Màn Gió — Hộ Giá | Một địch 120% MAG; sau đòn nhận +35% MAG trong 3 lượt chính và 1 Ám Phong | 10 MP, CD2 |
| Phong Nhận — Vô Thanh | Một địch 200% MAG; nhận 1 Ám Phong | 6 MP, không CD |
| Mật Lệnh — Xóa Dấu | Một địch 850% MAG; cần đủ và tiêu cả 4 Ám Phong | 0 MP, CD3 |

Nội tại: kỹ năng chủ động đánh trúng điểm yếu Phong gây thêm 60% sát thương và xuyên 50% RES. Sơ Hở Phong cũng thỏa điều kiện; chỉ yếu loại phép không đủ. Không tự cấp Khai Phá Điểm Yếu: hệ số mặc định vẫn ×1,5, buff Khai Phá từ nguồn khác dùng luật mạnh nhất. Không áp dụng Đánh thường, Liên kích, phản công hoặc tự động. Tái sử dụng `element_weakness_skill`, mở tùy chọn xuyên theo loại sát thương; Kanade giữ nguyên ×2 và không có xuyên mới.

## Vòng đời

- Ám Phong tối đa4, bắt đầu0, không tự trôi theo lượt. Hai kỹ năng tạo tầng sau khi thi triển, không yêu cầu mất HP; né không hoàn phí. Đủ tầng vẫn dùng được nhưng không vượt trần.
- Burst kiểm đủ4, mục tiêu, MP và CD trước khi thanh toán. Lệnh thất bại không mất tầng hoặc lượt; lệnh hợp lệ tiêu tầng trước damage, không hoàn tầng khi né/hạ mục tiêu. CD3 cast vòngR dùng lạiR+4. Không đánh lan hoặc tái kích.
- Buff MAG: tính từ sau đòn Hộ Giá, không tăng chính đòn vừa dùng. Giảm ở cuối3 lượt chính tiếp theo của Nikita, kể cả lượt Choáng; Lượt Thêm không giảm. Dùng lại làm mới, không cộng dồn. Có thể bị xóa/chặn theo luật buff chung. CD2 dùng lạiR+3, nên duy trì liên tục trong vòng xoay thông thường.
- Rank1–5 tăng damage và buff MAG ở nhóm hợp lệ; không tăng nội tại, tạo tầng, thời hạn hoặc CD. Hai phe Arena có tài nguyên riêng, Rank hiệu lực tối đa5.
- Dùng carry tài nguyên/status/CD chuẩn của engine; không có reset hay hook riêng cho wave, phòng, phase. Trận độc lập bắt đầu0. Forecast clone không tiêu tầng trận thật.
- Dùng asset vai trò và VFX phép Phong chung, không ghi đè bàn đấu hoặc BGM.

Kiểm chứng: `test/nikita.test.js`, hồi quy Marquis/điểm yếu, phe Kị sĩ, toàn bộ engine; UI danh sách và kỹ năng trên desktop/mobile.


## Trấn Phái hoàng gia — 12/11/2026

- Geoffrey: **Vương Thuẫn Hộ Quốc**, ID `geoffrey.royal_bulwark`. Sau kỹ năng đầu `geoffrey.rampart`, mỗi đồng đội còn sống, kể cả Geoffrey, nhận +6 DEF/RES **căn bản** trong3 lượt chính riêng của người nhận. Áp sau khi kỹ năng đã tạo Khiên, không tăng ngược lượng Khiên vừa tạo. Lần kế tiếp hưởng chỉ số mới; hào quang35% và các buff phần trăm nhân sau phần căn bản.
- Tái sử dụng `after_skill_status`, thêm tham số `baseStatModifiers` được kiểm tra schema; `applyStatus` lưu vào instance. Không mutate stats gốc hoặc template. Buff có thể bị xóa, Phong Ấn chặn theo từng người; nguồn gục không xóa sớm buff đã cấp. Dùng lại refresh3, không stack. Vòng Phụ không giảm; lượt chính bị Choáng vẫn giảm. Không thêm cấp Rank/Thông Thạo cho con số6. Carry/xóa theo quy tắc status chung của từng nội dung, không có hook riêng.
- Nikita: **Dao Thề Dưới Vương Miện**, ID `nikita.silent_oath`. `nikita.dagger` có thêm1 Ám Phong sau kỹ năng (tổng2, cap4), không đổi chiêu tạo tầng khác. Dùng bundle `skill_resource_bonus` + `skill_on_hit_dispel`: đòn gây sát thương HP hoặc Khiên xóa1 buff sau damage. Né/sát thương0 không xóa buff; tạo tầng vẫn theo thi triển thành công như kỹ năng gốc. Không xóa trước để tăng chính đòn vừa đánh. Không thêm hit hoặc lượt; không hoàn phí khi không có buff để xóa.
- Cả hai mở công thức bằng10 Bản Thiết Kế tại Shop, không tặng gear. Chế tạo/tái rèn/ô Trấn/chỉ số ngẫu nhiên giữ luật Thợ Rèn hiện tại. Chỉ có hiệu lực khi trang bị đúng người. Hai phe Arena xử lý đối xứng, không chia sẻ buff/tài nguyên. Savev7 giữ tương thích, không tự cấp sở hữu/công thức.
- UI dùng khung/icon Trấn có sẵn, hiển thị hiệu ứng trong preview kỹ năng. Test: `royal-exclusives.test.js`, E2E `royal-exclusives.spec.ts`, bộ hồi quy Trấn/chỉ số/thời hạn.
