# Hạt Giống Bội Thu / Bianca — đo trước và sau, 24/11/2026

Đã áp dụng: MAG nguồn 150% → 120% trung bình MAG động **chỉ đồng đội Quang/Thổ còn sống**; đòn tự động cuối vòng150% →180% MAG; hiệu lệnh Bianca Rank1 380% →300% (Rank5 556,358% →439,23%). Không đổi các buff Shashthi/Luna, thời hạn, số tầng, nguồn sát thương hoặc quy tắc một Sơ Hở cho cả chuỗi.

## Điều kiện đo

Đội: **Shashthi – Luna – Bianca – Lisbeth**, tất cả Lv50/Đột Phá3/6 ô gear. Ba nhân vật mới Rank5 toàn bộ; Lisbeth Rank5 Thông Thạo3, Hé Lộ đã bật, Quang Trượng Phán Quyết roll tối đa +10 MAG. Ba nhân vật mới chưa có Trấn Phái trong dữ liệu. Không dùng consumable hoặc nội tại chưa ra mắt.

Phân bổ hợp lệ49 điểm: Bianca/Shashthi/Lisbeth +17 MAG, +34 MP, +75 HP; Luna +85 HP, +34 MP, +15 DEF. Script gọi normalizeLevelState, validateCharacterSkillRanks và assertValidEquipment; không gán thẳng chỉ số công kích lên actor để giả max build.

Gear T4 chỉ số là godroll dòng chính/phụ cùng MAG (+8/món), hoặc HP (+40/món) cho Luna. Build thuần chỉ số dùng sáu món MAG cho ba pháp sư. Luna luôn mang Nguyệt Ước Chung Lòng để cấp +8 MAG căn bản toàn đội; không cộng nhiều bản hào quang.

Build hỗn hợp tối ưu **MAG nguồn cho hiệu lệnh Bianca** bằng duyệt 614 phương án gear qua resolver thật cho mỗi trạng thái HP; giữ Song Nguyệt Đồng Tâm trên Bianca để nhận25% khuếch đại đòn do cô ra lệnh. Không tuyên bố tối ưu mọi đội hình, tổng DPS, thời gian giết boss hoặc mọi lịch thi triển. Cấu hình thắng được giữ nguyên giữa hai phiên bản để chỉ đo tác động bản vá; mục tiêu MAG không đổi thứ hạng khi nhân hệ số nguồn từ1,5 xuống1,2.

Bia thử lấy RES **44 từ Miraebolis Lv90 thật của engine**, nhưng bỏ kịch bản boss, ngưỡng HP chuyển phase và điểm yếu/kháng tự nhiên; HP1 tỷ để không cắt hit. Địch chỉ chờ, không gây sát thương. Đây là đo sát thương tối đa có điều kiện, **không phải kết quả đánh bại Miraebolis**. Có thêm đối chứng RES0 và ba mục tiêu giống nhau trong JSON.

## Kết quả một mục tiêu, RES44

Số dưới đây là **ba hit hiệu lệnh Chúc Phúc ở Lượt Thêm R6**, không gồm đòn120% MAG riêng của Bianca.

| Build | Trước | Sau | Thay đổi |
| --- | ---: | ---: | ---: |
| Thuần gear chỉ số | 22.386 | 14.100 | -37,01% |
| Hỗn hợp · đầy HP | 36.540 | 23.031 | -36,97% |
| Hỗn hợp · HP69% | 37.671 | 23.745 | -36,97% |

Ở build hỗn hợp đầy HP: MAG ba người được tính lần lượt **337,52 / 368,06 / 386,79**; MAG Chúc Phúc **546,18 → 436,95**. Luna hệ Thường không nằm trong mẫu số.

| Thành phần · hỗn hợp đầy HP | Trước | Sau | Thay đổi |
| --- | ---: | ---: | ---: |
| Một hit hiệu lệnh Bianca · R6 | 12.180 | 7.677 | -36,97% |
| Đòn riêng Bianca · R6 | 1.692 | 1.692 | 0% |
| Cả chiêu: đòn riêng + ba hit lệnh · R6 | 38.232 | 24.723 | -35,33% |
| Đợt tự động mạnh nhất trong rotation · R4 | 1.735 | 1.665 | -4,03% |
| Tổng sát thương đội trong rotation6 vòng | 149.531 | 107.387 | -28,18% |

Với ba mục tiêu, đợt tự động mạnh nhất tương ứng **5.205 → 4.995**. Hiệu lệnh Bianca vẫn chỉ đánh mục tiêu đã chọn, không tăng ba lần theo số địch. Hệ số các lệnh khác, ví dụ Lisbeth350%, không bị nerf riêng nhưng dùng MAG Chúc Phúc thấp hơn20%.

Trước phòng thủ/làm tròn, chuỗi Bianca còn (1,2/1,5) × (300/380) = **63,1579%**, tức giảm **36,8421%**. Đòn tự động còn (1,2/1,5) × (180/150) = **96%**, tức giảm **4%**. Phòng thủ/làm tròn gây chênh lệch nhỏ trong bảng thực đo.

## Gear hỗn hợp được chọn

Đầy HP, cả Bianca/Shashthi/Lisbeth: **Huy Hiệu Toàn Vẹn + Huy Hiệu Quyết Tử + Song Nguyệt Đồng Tâm + ba T4 MAG/MAG**. Quyết Tử vẫn cấp20% MAG cơ sở khi chưa thấp máu; không tính nhầm40% ở đầy HP. Mỗi nhóm hiệu ứng chỉ có một món trên mỗi người.

HP69%: Bianca/Shashthi **Quyết Tử + Song Nguyệt + bốn T4 MAG/MAG**; Lisbeth **Quyết Tử + Khúc Hòa Ca Hồi Sinh (15% MAG) + Song Nguyệt + ba T4 MAG/MAG**. Tên chính xác theo ID nằm trong JSON. HP thấp là điều kiện giả định có chủ đích, không tự xem là trạng thái duy trì an toàn trong boss thật.

Luna: **Nguyệt Ước Chung Lòng, Song Nguyệt Đồng Tâm, Chén Sinh Khí, Di Vật Tiếp Khiên và Đồng Hồ Tái Thiết, một T4 HP/HP**. Danh sách ID và trạng thái lúc đo có trong JSON; các hiệu ứng hồi máu/khiên không được giả kích nếu rotation không dùng.

## Rotation và giới hạn nghiệm thu

R1 Shashthi buff bản thân; Luna Ước Hẹn; Bianca tự buff; Lisbeth đánh thường tạo Quang. R2 Shashthi vào Đại Lễ, Luna vào mode, Bianca mở Sơ Hở/kích Chúc Phúc rồi tiêu3 tầng trong Vòng Phụ; Lisbeth tự buff. R3 tiếp tục mở Sơ Hở/tiêu3, Luna giảm RES, Lisbeth Phán Quyết. R4 Shashthi buff Bianca, Luna làm mới Ước Hẹn khi Chúc Phúc còn hoạt động, Bianca làm mới tự buff. R5 ghép lại Chúc Phúc, tiêu3 ở Vòng Phụ; Lisbeth Phán Quyết. R6 Lisbeth làm mới Kiêu Hãnh, Bianca mở Sơ Hở rồi tiêu3 ở Vòng Phụ. Tất cả đi qua activeActor/executeAction, CD và Main/Extra thật, không cấp tầng hoặc MP miễn phí.

R6 không phải đợt tự động mạnh nhất: buff/mode có thể hết ở ranh giới cuối vòng. Vì vậy báo riêng đợt tự động mạnh nhất (R4) và lưu cả pulse R6 trong JSON, không dùng MAG tại lúc ra lệnh để giả tính pulse cuối vòng.

Kết luận: bản vá giảm rõ sức mạnh dồn sát thương của Bianca trong khi gần giữ vai trò đợt đánh tự động. Build này vẫn rất mạnh ở điều kiện đầy buff; các con số không chứng minh cân bằng tổng thể hoặc khả năng sống sót trước boss.

Tái lập: `node scripts/seed-balance.mjs`. Dữ liệu chi tiết: [SEED_BALANCE_2026_11_24.json](SEED_BALANCE_2026_11_24.json). Script chỉ tạo tài khoản trong bộ nhớ, không đọc/ghi save AppData.

Lưu ý lịch sử: các số trong báo cáo này được đo trước bản giảm Luna 10% → 8% và trường 30% → 12% ngày 24/11. Chạy script với dữ liệu hiện tại sẽ phản ánh cả bản vá Luna; không so trực tiếp với bảng lịch sử để quy toàn bộ chênh lệch cho Hạt Giống.
