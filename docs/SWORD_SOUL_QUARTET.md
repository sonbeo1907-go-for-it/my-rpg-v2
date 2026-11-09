# Izuna, Shion, Amiya, Kaguya — Hồn Kiếm

Triển khai 05/11/2026 trên cơ chế [Hồn Kiếm](SWORD_SOUL.md). Cả bốn là nhân vật chính thức trong Chiêu Mộ thường, gacha/dupe/Rank/save cũ theo luật chung, AI có profile riêng. Không có Trấn Phái hoặc truyện riêng; dùng asset/VFX cơ bản theo hệ, không đổi nền/BGM trận.

## Cấu hình playtest Rank 1

| Nhân vật | HP | MP | ATK | MAG | DEF | RES | SPD | Phe |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Izuna | 155 | 110 | 10 | 36 | 13 | 24 | 23 | Núi Keijo |
| Shion | 180 | 100 | 28 | 12 | 19 | 21 | 22 | Hội Thợ Săn Yêu Quái |
| Amiya | 165 | 125 | 10 | 28 | 15 | 25 | 21 | Đền Keijo |
| Kaguya | 280 | 110 | 12 | 24 | 28 | 30 | 13 | Đền Keijo |

Nguyên tố nhân vật lần lượt Lôi/Thổ/Quang/Ám; các kỹ năng sát thương mang thêm nguyên tố Hồn Kiếm, xét điểm yếu một lần. Đánh thường 100% theo loại đòn chính, chỉ mang hệ nhân vật. Thành viên Hồn Kiếm nhận diện bằng tag, không suy từ hệ chính.

### Izuna — DPS ma pháp

- Cánh Nhỏ Gọi Giông: 8 MP, không CD; 100% MAG AoE Lôi/Hồn Kiếm, +25% MAG bản thân 1 lượt chính.
- Tiếng Sáo Trên Đỉnh Núi: 10 MP, CD2; tạo 1 Hồn Kiếm, Khai Phá Điểm Yếu 3 lượt chính. Cố định, không Rank.
- Ngũ Lôi Trùng Tấu: 24 MP hoặc ưu tiên 4 Hồn Kiếm, CD2; 5 hit ×75% MAG AoE Lôi/Hồn Kiếm.
- Native: kỹ năng thực tiêu Hồn Kiếm xuyên 50% RES. Ngũ Lôi trực tiếp hạ ít nhất một địch → lặp nguyên kỹ năng dưới dạng Liên kích, tối đa 1 lần/vòng. MP/CD không trả thêm, không có sự kiện tiêu Hồn Kiếm thật; context coi như đã dùng 4 để xét native. Không nâng chỉ số hay cộng miễn phí tài nguyên cho Tsukiha.
- Đây là **ngoại lệ truy kích của chính kỹ năng**, như Joshua; không bỏ luật Liên kích đồng đội khác ở các nhân vật khác. Không tự nối từ reaction/automatic, không tạo hạn mức tự nhiên, không kích Shion. Cần chủ còn sống và còn địch hợp lệ. Kết liễu do phản đòn/Độc của người khác không được nhận; vào Oán Hận ở 0 HP chưa phải chết. Hạn mức dùng chung main/extra, reserve trước khi lặp. Giữ Rank kỹ năng; 5 hit áp dụng cho từng địch còn sống sau cast nguồn.

### Shion — Hỗ trợ tấn công vật lí

- Rạn Thế Yêu Ma: 9 MP, **không hồi chiêu**; 120% ATK AoE Thổ/Hồn Kiếm, trúng HP/khiên giảm 15% DEF/RES 2 lượt chính.
- Song Kiếm Đồng Hành: 28 MP, CD2; tạo 1 Hồn Kiếm, bản thân và một đồng đội khác nhận Lượt Thêm. Ưu tiên thành viên Hồn Kiếm sống ở ô nhỏ nhất; nếu không có thì chỉ bản thân nhận Lượt Thêm; không chọn người ngoài Hồn Kiếm. Ô cố định, không nén người gục. Đã có quyền thì không đổi người để né giới hạn; pha phụ bỏ cấp quyền nhưng phần tạo/chi phí vẫn hoạt động.
- Phục Ma Song Trảm: 20 MP hoặc ưu tiên 3 Hồn Kiếm, CD2; AoE 2 hit ×150% ATK Thổ/Hồn Kiếm; sau đòn, mỗi địch còn sống thực nhận HP/khiên nhận **một Phong Ấn**, không một mỗi hit. Né cả hai hit thì không áp.
- Native: đồng đội khác dùng kỹ năng tạo tài nguyên **trực tiếp** → tạo thêm 1 Hồn Kiếm, +40% ATK bản thân trong **3 vòng**, tính cả vòng kích. 1 lần/vòng, reserve trước tạo; overflow vẫn tính. Không kích từ tự nhiên, đầu vòng, bản thân, nội tại/auto/reaction hoặc tăng bổ sung của chính Shion. Không phụ thuộc lượng trực tiếp tạo là 1 hay2; một cast chỉ một lần. Native không tăng theo Rank.

### Amiya — Hỗ trợ tấn công ma pháp

- Linh Đăng Khai Lộ: 8 MP, không CD; 80% MAG chính /50% còn lại, Quang/Hồn Kiếm. Hit hợp lệ gắn 2 Sơ Hở Hồn Kiếm chính /1 còn lại; bị né không gắn, Hộ Ấn chặn nguyên lần cấp. Sơ Hở mới không có lợi cho chính cast ấy.
- Hai Ngọn Đèn Chờ Người: 10 MP, CD1; tạo 2 Hồn Kiếm. Cố định.
- Kiếm Hồn Đồng Tâm: 18 MP, CD3; mọi **đồng đội Hồn Kiếm khác** nhận +30% ATK/MAG trong 4 lượt chính và giảm 1 vòng các cooldown kỹ năng đang có (floor0). Không tự giảm CD của Amiya. Không có mục tiêu thì unavailable, không tiêu MP/CD. Buff bị Phong Ấn chặn vẫn xử lý phần giảm CD riêng.
- Native: đầu mỗi vòng, kể cả vòng1, tạo 1 Hồn Kiếm; có ít nhất 3 thành viên tag Hồn Kiếm trong đội, gồm Amiya, thì tạo2 và hồi 3% MP tối đa cho toàn đội còn sống. Xét thành phần đội gồm người gục; chủ native phải sống. Không tiêu hạn mức tăng trưởng tự nhiên và không kích Shion. Sẵn sàng lại theo round, không phải lượt/thêm lượt.

### Kaguya — Thủ Hộ

- Lặng Tiếng Binh Đao: 10 MP, CD1; 110% MAG AoE Ám/Hồn Kiếm, trúng đòn giảm 20% ATK/MAG 3 lượt chính.
- Lời Ru Bên Hồ Tĩnh: 12 MP, CD1; hồi toàn đội 160% MAG HP và tạo1 Hồn Kiếm. Cả đội đầy HP vẫn tạo tài nguyên. Hồi phục qua pipeline chung Thế Chấp/Vết Thương Sâu.
- Cổng Đền Bất Hoại: 18 MP, CD3; khiên toàn đội =180% trung bình DEF và RES, Chúc Phúc3 lượt chính. Chúc Phúc là buff riêng +20% DEF/RES và giảm25% sát thương, không phải thuộc tính khiên. Khiên không cộng dồn; buff vẫn có thể cấp dù khiên yếu hơn. Không tự Khiêu Khích.
- Native nâng trần **riêng đội** từ6 lên10 khi khởi tạo/carry. Definition pool vẫn6 để đồng nhất các khai báo; state.max lấy mức cao nhất từ native của đội. Snapshot trần không giảm khi chủ gục, tránh mất tài nguyên; không nhân nhiều Kaguya. Bảng10 chia2 hàng×5, 4–10 vẫn anh đào, không đổi scene.
- Khi một hay nhiều người mang Chúc Phúc, kể cả Kaguya, nhận sát thương HP/khiên từ một hành động trực tiếp → tạo1, tối đa2 lần/vòng. Gộp mọi hit/người trong context; phản công/Liên kích là context khác và có thể tiêu cơ hội thứ hai. Không tính Độc/mất HP chi phí/né. Không cần còn khiên sau đòn; cần có Chúc Phúc lúc hit và Kaguya sống lúc kết toán. Native vẫn có thể chạy khi Kaguya choáng. Reserve trước tạo, main/extra dùng chung quota.

## Luật chung và tái sử dụng

- CD2 và buff3 (Izuna/Shion) đồng nhịp Tsukiha. Amiya CD3/buff4 để không có lượt hành động thiếu buff khi tự xoay; hỗ trợ giảm CD có thể làm sớm hơn. CD1 khóa một vòng sau cast. Không biến “3 vòng” của Shion thành3 lượt.
- Rank: damage/heal/shield tăng10%/cấp; stat buff dương tăng5%; giảm nhận25%, xuyên50%, Sơ Hở, Phong Ấn, số hit, giá tài nguyên/MP/CD/thời hạn và giảm cooldown giữ nguyên. Các hiệu ứng tiện ích không tự có Rank.
- Khả năng mới khai bằng data/native type: `team_spend_penetration`, `ally_team_creation`, `round_team_resource`, `blessed_team_resource`; `targetTag`/`excludeSelf`, `grant_extra_turn.selectAlly`, `reduce_cooldowns`, `onHitStatus.primaryStacks`, `status.requiresDamageHit`. Đường execution, AI/forecast, preview và validator đều cần hiểu cùng field. Không hardcode ID nhân vật trong hook.
- Snapshot/forecast clone resource/proc/context; replay cùng RNG không tiêu state thật. PvP dùng actor ID và team tương đối; luật áp dụng cả hai bên. Qua wave/phase cùng contract giữ state/round offset, không reset quota tùy tiện. Trận mới reset pool rồi áp native đầu vòng1.

Các MP, chỉ số và hệ số Kaguya chưa được brief chốt là cấu hình playtest hoàn thiện của agent, chưa phải kết luận cân bằng. Kiểm chứng: `test/soul-quartet.test.js`, `e2e/soul-quartet.spec.ts`, toàn bộ regression + validate/typecheck/build.
