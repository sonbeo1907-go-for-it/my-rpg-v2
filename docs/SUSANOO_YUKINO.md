# Susanoo và Yukino — Hồn Kiếm

Triển khai 05/11/2026. Chỉ số nền Lv1, Rank dùng quy tắc engine hiện tại. Hai nhân vật chính thức thuộc Hội Thợ Săn Yêu Quái, mang dấu Hồn Kiếm, có trong Chiêu Mộ thường và AI. Không tự mở khóa trong save cũ. Lịch rate-up bắt đầu xét họ từ 09/11 để giữ nguyên lịch đang chạy.

## Susanoo — cơ bắp thắng suy nghĩ

Đấu sĩ Lôi. HP210 / MP90 / ATK32 / MAG10 / DEF25 / RES23 / SPD13 là bộ số playtest.

- Nội tại: cộng vào ATK căn bản `min(25, (DEF hiện tại + RES hiện tại)/2 × 0,25)`, trước buff ATK. Tính lại theo buff/debuff DEF/RES, không ghi cộng vĩnh viễn vào save. Preview chuẩn bị cũng có phần cộng từ phòng thủ sẵn có.
- Một Đấm Khai Sơn: 6 MP, 240% ATK đơn mục tiêu, Lôi / Hồn Kiếm, không CD.
- Thân Thép Chấn Sơn: 8 MP, +20% DEF/RES bản thân trong 3 lượt chính, tạo1 Hồn Kiếm trực tiếp; CD2. Vòng Phụ không giảm thời hạn, bỏ lượt chính vì Choáng vẫn giảm. Buff mới không mất một lượt ngay khi cấp. Có thể dùng lại ở lượt chính kế sau khi buff hết.
- Lôi Quyền — Khỏi Cần Nghĩ!: 28 MP hoặc ưu tiên4 Hồn Kiếm, 750% ATK đơn mục tiêu, Lôi / Hồn Kiếm, CD3. Rank tăng damage, không tăng cap nội tại hoặc tài nguyên.

## Yukino — tiếng đáp của Tuyết Nữ

DPS phép Thủy. HP160 / MP120 / ATK10 / MAG35 / DEF15 / RES26 / SPD19 là bộ số playtest.

- Nội tại: kỹ năng chủ động của **đồng đội khác** tạo Hồn Kiếm trực tiếp → Liên kích100% MAG Thủy / Hồn Kiếm lên địch còn nhiều HP nhất rồi tạo1 Hồn Kiếm. Hòa HP chọn thứ tự đội hình. Tối đa1 lần/vòng, chung Vòng Chính/Phụ; chủ phải còn sống, Choáng không tắt nội tại. Tạo khi đầy vẫn tính. Không kích từ chính Yukino, đánh thường, Phòng thủ, tăng trưởng tự nhiên, nội tại hoặc Liên kích. Reserve hạn mức trước đòn và tài nguyên; Shion không kích từ lượng Hồn Kiếm nội tại tạo thêm.
- Tuyết Vũ Qua Rừng: 8 MP,150% MAG toàn địch; mục tiêu trúng sát thương HP/khiên bị −15% SPD trong2 lượt chính của mục tiêu. Không CD. Thời hạn2 là lựa chọn playtest vì đề bài chưa chỉ định.
- Ngàn Hoa Tuyết Tụ Hồn: 12 MP,120% MAG toàn địch; +1 Hồn Kiếm/mục tiêu thực nhận sát thương HP/khiên, tối đa3 mục tiêu. Tính cả đòn kết liễu, không tính né, gộp nhiều hit cùng người. CD2: khóa2 vòng sau cast; đây là cách hiểu downtime2 cho hiệu ứng tức thời. Lượng tạo này là trực tiếp, có thể kích Shion/Yukino đồng đội theo quota riêng.
- Bạch Dạ — Vạn Hồn Quy Tuyết: 28 MP; nếu có ít nhất4 Hồn Kiếm thì tiêu **toàn bộ** thay MP. Tổng600% MAG chia đều cho số địch sống khi bắt đầu giải effect; không chia lại sau từng mục tiêu. Mỗi Hồn Kiếm thực tiêu vượt4 cộng10% MAG **cho riêng chiêu này**, trước khi nhân hệ số. Không tạo buff lâu dài. MP fallback không cho phần cộng. CD2 là số playtest. Rank nhân hệ số600%, không nhân hệ số cộng MAG.

Mọi đòn dùng hit chung: DEF/RES, né, khiên, điểm yếu kép chỉ nhân một lần, Hộ Ấn, phản ứng và soft cap Arena giữ luật hiện hành. Dùng asset công kích chung, không thêm nền bàn đấu.

## Vòng đời, tương thích và khung tái sử dụng

- `defense_average_conversion`: tính ở effectiveStat/preparation và bù chênh lệch phòng thủ tạm ở battleStat; không cộng hai lần khi đã resolve loadout.
- `preferTeamResource {all:true,min:4}`: kiểm tra ngưỡng trước chi phí; đủ thì trả hết một lần, không đồng thời trả MP. `spentTeamStatBonus` chỉ dùng số thực trả đã chụp, trước tăng trưởng cuối hành động.
- `divideAmongTargets` chia multiplier trước vòng lặp hit. `team_resource.perHitTarget/maxTargets` gom các mục tiêu đã gây sát thương trong cast trước khi tạo tài nguyên.
- `ally_creation_followup`: hook sau hiệu ứng và tăng trưởng của kỹ năng nguồn, kiểm tra explicit creation của hành động nguồn; phản ứng tạo thêm không ghi vào tập nguồn. PvP sử dụng đội tương đối và quota riêng theo unit ID.
- Save trận/forecast dùng trạng thái actor/pool/quota sẵn có; forecast clone không tiêu RNG/pool thật. Qua wave/phase/encounter tiếp tục dùng chính sách carry hiện hữu, không thêm trường tồn tại toàn chiến dịch. Trận mới reset limiter theo engine; bản thân conversion luôn là giá trị dẫn xuất.

Kiểm thử: `test/susanoo-yukino.test.js`, các bộ Sword Soul/quartet/Miyuki, skill-copy và toàn suite. Các giá trị playtest chưa do người dùng chỉ định (chỉ số, MP, SPD debuff duration, CD burst Yukino) được nêu trên để cân bằng sau.
