# Thông Thạo theo mức và đợt Trấn Phái mở rộng

Quyết định người dùng ngày 06/11/2026. Không đổi kit nhân vật khi không mang Trấn. Không đổi hệ số Rank1–5, phạm vi Mastery PvE hoặc ngoại lệ Ogre’s Bane.

## Thông Thạo

| Mức | Sát thương / hồi HP / khiên | Buff chỉ số hợp lệ | Chi phí Original |
| --- | ---: | ---: | ---: |
| Bạc | ×1,12 | ×1,06 | 1 |
| Vàng | tiếp ×1,12 | tiếp ×1,06 | 2 |
| Cầu Vồng | tiếp ×1,15 | tiếp ×1,075 | 3 |

Tổng so Rank5: output ×1,44256; buff chỉ số ×1,20787. Áp dụng lại theo dữ liệu hiện hành cho cả Rank6–8 đã mua, không mất tiến trình hoặc thu thêm phí. `coefficientGrowthByTier` / `statBuffGrowthByTier` trong progressionRules là nguồn chung cho resolver, preview và xác nhận. Skill nhiều nhóm tăng mỗi nhóm đúng một lần.

Giữ nguyên giảm10% MP mỗi mức cho nhóm MP-only, sau sàn Rank5; ceil một lần theo pipeline MP. Damage amp, xuyên, debuff, CD, số hit, thời hạn, tạo tài nguyên và các chiêu fixed không tự tăng. PvP vẫn chỉ hiệu lực tối đa Rank5 hai phe.

## Các Trấn mới

Mỗi mẫu mở vĩnh viễn bằng10 Bản Thiết Kế trong Shop, chế tạo/tái rèn qua Thợ Rèn hiện có. Chỉ sở hữu hoặc mở công thức không cấp hiệu ứng: phải trang bị đúng chủ. Kit gốc và dữ liệu dùng chung không bị mutate. Các giá trị Trấn dưới đây không nhân Rank/Mastery trừ phần skill gốc vốn được nâng.

| Chủ | Trấn Phái | Hiệu ứng |
| --- | --- | --- |
| Iwayn | Quang Thương Bất Thoái | Kỹ năng tấn công: +1,5% ATK mỗi1% chênh lệch **tỷ lệ HP hiện tại**, cap75% ATK. Lấy chênh tuyệt đối, tính riêng mỗi mục tiêu/hit trước hit. Không tính HP thô của boss, không tăng thường/phản công. Giữ native damage bonus tối đa30%. |
| Percival | Hàn Chùy Trấn Hải | Nhất chùy trấn hải giảm40% SPD trong2 lượt như clock cũ; damage ×1,35. Không đổi chiêu Chùy đập sóng ngầm hoặc status chung. |
| Mandred | Chiến Phủ Huyết Sư | Native chuyển HP tối đa sang ATK căn bản từ8% lên15%, trước ATK%. Không cộng thành23%. |
| Kreider | Đũa Chỉ Huy Nghịch Âm | Địch thực nhận debuff: tự nhận25% MAG trong4 lượt, tối đa2 tầng, làm mới thời hạn chung. |
| Logia | Nanh Xà Tử Dạ | Native tăng potency Nọc độc từ25% lên50%, không cộng thành75%; snapshot khi gắn độc. |
| Yufina | Găng Tay Ngày Ra Trường | Trong mode: ba chiêu công kích giảm24% MP thay12%; **không giảm CD**. Người dùng đổi yêu cầu do các chiêu hiện không có CD. |
| Elise | Thánh Điển Mikaielis | Địch thực nhận buff: tự nhận25% MAG trong4 lượt, tối đa2 tầng, làm mới thời hạn chung. |
| Yumia | Lưỡi Kiếm Không Buông | Phản công từ420% lên558,8% ATK. Giữ Hội Tâm và một lần/vòng, không mở Rank cho phản công tự động. |
| Valery | Hắc Phong Xuyên Vân | Xuyên Vân Nhất Tiễn xuyên5% RES mỗi Điểm Ngắm Gió thực tiêu (tối đa30% từ6 tầng). Không tăng theo Rank. |
| Tobin | Búa Rèn Lửa Cội | Native Nhiệt Lò từ8% lên12% ATK mỗi tầng, cap36%; không cộng thành20%/tầng. |
| Rivia | Song Sắc Hoàng Hôn | Ô1/3:45% ATK,10% SPD. Ô2/4:20% ATK,15% DEF,15% RES. Thay tham số thế đứng cũ; vị trí cố định, không nén khi đồng đội gục. |
| Gregory Bennett | Lao Chớp Xuyên Giáp | Thêm25% ATK; giữ xuyên50% DEF native. |
| Judy | Lõi Tụ Điện Bất Ổn | Native thực tạo Điện Tích và còn chỗ:50% thêm1; mỗi thất bại +15 **điểm phần trăm**, cap100%; thành công reset50%. Bonus không tự roll lại. |

## Hợp đồng trigger và lifecycle

Kreider/Elise quan sát status **sau khi áp thành công**. Hộ Ấn/Phong Ấn chặn thì không kích; refresh/cấp lại thành công vẫn tính. Mỗi buff/debuff khác trong chiêu tính riêng, AoE có thể đạt cap2 ngay. Tăng tầng hoặc cấp lại ở cap làm mới chung4 lượt; chưa có buff không được “cộng sẵn” từ số debuff/buff địch đầu trận.

Buff Trấn là buff thường: bị Phong Ấn chặn, bị dispel xóa, trôi theo **mọi lượt của chính người mang**, cả Lượt Thêm và lượt Choáng bị bỏ qua. Refresh trong chính hành động không mất ngay một lượt do oldStatuses. Khi gục không nhận mới. Buff phản ứng do observer tạo **không kích observer Trấn khác**, tránh vòng lặp Elise đối xứng hai phe. Không gộp vào hạn mức Liên kích hoặc tự thêm lượt.

Judy roll theo mỗi lần native nhận tài nguyên thành công từ hit/mục tiêu hợp lệ, không theo một skill duy nhất. Đánh thường/phản công/Độc không hợp lệ theo native. Nếu base grant đầy trần10 thì không roll tầng phụ; đầy/nguồn không hợp lệ không tăng failure hoặc reset. Thất bại không mất tầng cơ bản. Trạng thái failure nằm trên actor, riêng từng phe/đơn vị; giữ qua wave/phòng/phase, gục không tự reset, trận độc lập mới đặt lại. Forecast dùng clone và không đổi RNG/tài nguyên/bộ đếm thật.

Các thay native/mode được apply vào clone loadout trước tính stats; không sửa native toàn cục hoặc resolve lại snapshot giữa chuyến. Mọi hiệu ứng Trấn vẫn hoạt động đối xứng trong PvP; chỉ **Mastery** bị tắt ở PvP. Luật giảm damage Arena hiện hành vẫn áp dụng sau các bước này.

## Source và nghiệm thu

- `skill-rules.js`, `skill-resolver.js`: hệ số theo mức.
- `exclusive-specials.js`, `exclusive-loadout.js`: override clone, HP%, status và penetration.
- `exclusive-runtime.js`, `battle.js`: observer thành công và chance bonus.
- `exclusiveGear.json`, `statuses.json`: công thức, nội dung và status stacking.
- `test/exclusive-balance.test.js`, `test/mastery.test.js`: số học, actual casts, áp bị chặn, refresh/expiry/Choáng/Extra, snapshot, PvP mirror, anti-loop và schema.
- `e2e/exclusive-balance.spec.ts`, `e2e/mastery.spec.ts`: xác nhận12/6 rồi15/7,5; tiêu Original tuần tự; preview native; mua công thức và reload với save test.

Test chức năng không phải kết luận roster cân bằng. Báo cáo Kreider/Lisbeth có số đo sau đổi Mastery nhưng chưa trang bị Trấn Kreider mới.

Nghiệm thu: 1.351/1.351 unit test, 5/5 browser test, validate, typecheck và production web build đều thành công. Graph local đã cập nhật. Chưa đóng gói EXE trong đợt này.
