# Lớp 7A — Luka và Gairyu

Triển khai 16/11/2026. Hai nhân vật chỉ được thêm vào dữ liệu, **chưa có nguồn nhận**, không nằm trong banner thường, lịch rate-up hoặc đổi Vé Chiêu Mộ. Luka được định hướng nhân vật miễn phí; Gairyu chưa phát hành gacha. Save cũ thêm trạng thái khóa, không tự cấp sở hữu. ID phát hành #111 Luka, #112 Gairyu, không đổi ID đã có.

## Chỉ số và nguồn sát thương

Các chỉ số/MP/CD chưa được người dùng ấn định dùng bộ số playtest sau. Không tự mở Thông Thạo hoặc tạo Trấn.

| Nhân vật | HP | MP | ATK | MAG thô | DEF | RES | SPD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Luka | 170 | 100 | 34 | 12 | 16 | 21 | 22 |
| Gairyu | 150 | 110 | 10 | 35 | 14 | 20 | 18 |

Cả hai thuộc `magic_academy`, tag `class_7a`. Luka Phong, toàn bộ damage (kể cả đánh thường) scale ATK nhưng gây phép, tính RES. Gairyu Hỏa, kể cả đánh thường đều gây phép scale MAG; nội tại +30% MAG là modifier vĩnh viễn, không cộng thành MAG căn bản hoặc áp hai lần. MAG trước các buff khác là 45,5.

## Luka — Nhịp gió tuổi trẻ

Nhịp Điệu: tối đa 5, khởi đầu 0.

- Mỗi kỹ năng chủ động hợp lệ của Luka tạo 1 tầng **sau khi giải kỹ năng**. Cộng riêng với tầng ghi trên chiêu. Không tính Đánh thường/Phòng thủ, lần cast bị từ chối, phản công hoặc Liên kích của bản thân.
- Đồng đội khác gây sát thương phép bằng kỹ năng hoặc Liên kích, ngoài Quang/Ám, tạo 1 tầng mỗi hành động. Nhiều hit/AoE không nhân tầng. Tính sát thương HP hoặc khiên và đòn kết liễu; né hoàn toàn, DoT, đánh thường, phản công, địch và nguồn tự động không hợp lệ không tính. Xét hệ đòn, không xét hệ nhân vật; hit đồng thời mang hệ bị loại cũng không tính.
- Liên kích phép hợp lệ là hành động riêng. Ví dụ Đánh thường Luka có thể gọi Aurora; chính Đánh thường không tạo tầng nhưng Liên kích Lôi của Aurora có thể tạo 1 tầng.

| Kỹ năng | MP / CD | Hiệu quả Rank 1 |
| --- | --- | --- |
| Nhịp Nổi Loạn | 10 / 2 | +25% ATK trong 3 lượt chính, tạo 2 tầng; cộng nội tại thành 3 |
| Hợp Âm Xé Gió | 6 / 0 | 180% ATK phép Phong đơn mục tiêu, tạo 1 tầng; cộng nội tại thành 2 |
| Khúc Cao Trào | 16 / 2 | 320% ATK chính / 200% hai ô kề; mỗi tầng tiêu tăng hệ số thêm 20%/12% ATK |

Khúc Cao Trào chốt/tiêu toàn bộ tầng trước hit, dùng được khi 0 tầng. Đủ 5: 420% chính / 260% kề, rồi nhận 1 tầng nội tại sau chiêu. Đòn lan không nối hai đầu; không trả MP/tầng nếu né. Rank tăng mọi hệ số damage (kể cả phần mỗi tầng) 10%/rank, buff ATK tăng 5%/rank; lượng tầng/CD không tăng.

Buff đếm lượt chính của Luka, không giảm trong Vòng Phụ; lượt tạo không trừ ngay. Choáng ở lượt chính vẫn giảm thời hạn. CD2 dùng R thì sẵn sàng R+3. Gục không tạo thêm tầng.

## Gairyu — Ngọn lửa ngang tàng

| Kỹ năng | MP / CD | Hiệu quả Rank 1 |
| --- | --- | --- |
| Hỏa Khí Bốc Đồng | 6 / 0 | 150% MAG Hỏa AoE |
| Đừng Chọc Giận Ta! | 14 / 1 | 250% MAG Hỏa AoE; thử 50% Liên kích bằng Hỏa Khí Bốc Đồng |
| Thiêu Rụi Tất Cả! | 24 / 3 | 420% MAG Hỏa AoE; thử 50% Liên kích bằng Đừng Chọc Giận Ta! |

Chuỗi được duyệt: **420 → 250 → 150**. Mỗi nhánh thử riêng, dùng chung một trạng thái bảo đảm trên actor:

1. Chưa có bảo đảm: RNG 50%; thất bại gắn bảo đảm.
2. Lần thử hợp lệ kế tiếp chắc chắn thành công, không cần RNG; thành công xóa bảo đảm.
3. Nếu 250 được gọi từ 420, vẫn thử nhánh 150. Vì vậy sau một lần bảo đảm thành công, nhánh tiếp theo có thể thất bại và gắn bảo đảm mới.

Không giới hạn một lần/vòng; Vòng Phụ dùng cùng trạng thái, không reset khi đổi vòng hoặc đổi kỹ năng. Không có địch sống, chủ gục hoặc chạm quota PvP thì không thử/không mất bảo đảm. Thất bại không phải hành động tự động thực thi, không tiêu quota PvP. Hết MP/CD của **chiêu chủ động** chặn cast trước mọi thay đổi.

Liên kích dùng Rank hiện tại của **chiêu được gọi**, không trả MP/HP/tài nguyên, không đặt hoặc xóa CD của chiêu đó và không tạo thêm lượt. Các hit đi qua engine chung: điểm yếu, RES, khiên, né, charges, gear và soft cap PvP. Chuỗi giải trước khi tick thời hạn buff cuối lượt; buff một lượt cuối vẫn tác dụng lên cả chuỗi. Đây là truy kích từ chính kỹ năng được khai báo, không nới quy tắc “đồng đội khác” của Aurora/Yukino.

## Reusable data và vòng đời

- Native `skill_magic_charge`: `resource`, `amount` cho hành động phép đồng đội, `skillAmount` cho kỹ năng chủ động của chủ, `excludedElements`. Context của hit giữ Set chống cộng tầng theo hit/địch. Hook sau cast tạo phần của chủ. Không đụng hook Finmel/Judy.
- Ability `chanceFollowUp:{abilityId,chance}`: tham chiếu chiêu thuộc chính actor; validator đòi đòn công kích phù hợp và đồ thị không chu trình, tối đa 8 nhánh. Đòn đích chỉ chứa damage, không lén bỏ qua chi phí tài nguyên hoặc ghép loại chain khác. Actor `stat_boost` có thể khai `followUpGuarantee:true` để dùng lần bảo đảm chung.
- `skillFollowUpState.guaranteed` nằm trên actor, clone/serialize được; không dùng biến module/timer. Không tick khi Choáng hoặc chỉ Phòng thủ. Forecast chạy trên clone, không đổi RNG/bảo đảm thật.
- `primaryPerResource` cho phép hệ số cộng mỗi tầng khác nhau giữa chính/kề; helper dùng chung cho combat và cả preview đầy đủ/thu gọn; Rank tăng đúng cả hai phần.
- `cost.resource:{all:true,min:0}` cho phép tiêu hết số đang có mà không đòi một tầng tối thiểu. Không thay luật tài nguyên bắt buộc ở các chiêu cũ có `min>0`.
- Wave dungeon/truyện và phase boss giữ state actor theo adapter hiện hành. Combat mới trong phiên pháo đài chỉ mang HP/MP; trạng thái mới. Trận độc lập/đánh lại reset Nhịp Điệu và bảo đảm; không mở thêm chức năng lưu trận thường.
- Arena mirror dùng unit ID/phe tương đối; hai Gairyu có hai trạng thái bảo đảm, hai Luka có hai tài nguyên riêng. Anti-loop/soft cap hiện hành vẫn áp dụng. AI profile đã có cho cả hai; chưa viết chiến thuật boss riêng.

## Nghiệm thu

`test/academy-seven.test.js`: 25 regression qua public cast/progression, gồm skill/buff cộng tầng, 0/5 tầng, Rank/scaling preview, nhiều hit/khiên/né, Light/Dark/physical/basic exclusions, liên kích Aurora, chuỗi/bảo đảm, MP/CD, buff cuối lượt, Choáng thật, Extra, snapshot/forecast, wave/fresh battle và PvP mirror.

`e2e/academy-seven.spec.ts`: render kỹ năng qua profile tổng hợp có sở hữu để kiểm tra route production/điện thoại. Đây chỉ là fixture, không cấp nhân vật trong save thật. Chưa chứng nhận cân bằng theo đội/độ khó từ số test chức năng.

Kết quả kiểm tra: validate/typecheck qua; 25 regression riêng, tổng suite 1.663 test qua; 2 E2E production qua ở 1440/768/390 px. Đã cập nhật graph code cục bộ; không bật semantic extraction. Dùng asset cơ bản của DPS ma pháp, VFX phép gió/lửa chung, không thêm scene hoặc combatMode.
