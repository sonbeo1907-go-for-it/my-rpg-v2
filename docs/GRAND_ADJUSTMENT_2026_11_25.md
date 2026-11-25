# Điều chỉnh kỹ năng và sát thương — 25/11/2026

## Kỹ năng và đồng hồ

| Kỹ năng | CD mới |
| --- | --- |
| Chiyoko: Tổ Kiếm — Hợp Mạch | 2 vòng (dữ liệu cũ chưa khai CD) |
| Chiyoko: Tuyệt Thức — Vạn Ảnh Quy Kiếm | 2 vòng |
| Chiyoko: Nhị Thức — Đoạn Không | 1 vòng |
| Nikita: Mật Lệnh — Xóa Dấu | 2 vòng |
| Cyrus: Lật Trang — Gió Xé Kết Giới | 0 vòng |
| Charlotte: Hào Quang Thuộc Về Chúng Ta! | 3 vòng |

Giữ đồng hồ CD theo vòng chung: CD N thi triển ở R, dùng lại R+N+1. Lượt Thêm không giảm CD; bỏ lượt vẫn đi qua vòng như cũ. Không thay thời hạn mode Chiyoko hoặc tạo reset tài nguyên. Dữ liệu đi qua resolver/preview/AI hiện hữu.

Quân Lệnh của Anabel: 6 lượt chính của bản thân, không tính lượt mới cấp buff; Extra không trừ, Choáng ở lượt chính vẫn trừ. Thi triển R1 → Phán Quyết R2 → CD3 sẵn sàng R6, buff còn hiệu lực cho cả hai lần Phán Quyết và Liên kích. Làm mới không cộng dồn. Dispel bình thường; carry giữ theo adapter wave/phòng/phase, trận mới reset.

Siesta giữ thiết kế rend → howl → ravage → ravage khi có 3 tầng và đủ mục tiêu sống. Các bước tự động bỏ qua MP/CD, không thay CD đang có; mỗi mắt xích tối đa 1 lần/vòng kể cả Extra, không lặp vô hạn. Thiếu MP/CD của chiêu người chơi bấm vẫn bị từ chối trước chi phí. Choáng chặn lượt chủ động, không thêm lượt giả cho chuỗi phản ứng.

## Phân loại sát thương

Mỗi hit sau biến đổi nguyên tố và mỗi damage event có các cờ phân loại: effectDamage nếu hệ chính hoặc phụ có moon; đòn không có loại đặc biệt mặc định normalDamage. Các cờ khác được khai báo rõ và giữ nguyên. Đây là phân loại độc lập với vật lí/phép, kỹ năng/đánh thường/Liên kích/DoT và phe. Hồn Kiếm tự nó vẫn là normalDamage. Không quyết định theo nhân vật có quyền gọi Chúc Phúc: đòn chỉ chuyển loại khi thực sự mang Nguyệt. Không đổi thành sát thương chuẩn, không thay đường HP tối đa của Oán Hận, kháng, né hoặc soft cap.

## Hai công thức Cấp IV phổ thông

- Ấn Võ Tâm: ATK +20%; xác suất = clamp(ATK căn bản/150, 0, 1).
- Ấn Thuật Tâm: MAG +20%; xác suất = clamp(MAG căn bản/150, 0, 1).

Kích hoạt cộng 50% sát thương cơ sở trước trừ DEF/RES và mọi khuếch đại. Không thuộc nhóm damage amp lấy lớn nhất. Một lần xét mỗi gear/nguồn/hành động tại hit normalDamage đầu tiên trúng; cả chuỗi đa hit/AoE/random dùng chung kết quả. Hit Nguyệt không roll và không hưởng dù cùng hành động có hit thường. Liên kích/phản công là hành động riêng; DoT xét mỗi lần tick, giữ potency snapshot như cũ. Không làm tăng hồi/khiên hoặc phí tự mất HP. Mỗi gear cùng nhóm chỉ tính một; hai loại khác nhau có thể cùng kích và cộng tổng +100% cơ sở. Buff ATK/MAG theo phần trăm trong trận không tăng xác suất; căn bản dùng baseStatValue hiện hữu (gear phân bổ, chỉ số cộng phẳng căn bản được tính).

Forecast xét trên trial clone/RNG riêng, không tiêu RNG hoặc quota thật. Không có đồng hồ/CD/quota vòng mới, không có state proc cần lưu qua trận; chỉ cache theo attackContext. PvP cùng luật gear, tăng cơ sở trước soft cap. Chúc Phúc/hiệu lệnh mang Nguyệt không hưởng gear của nguồn hay người ra lệnh.

Giá rèn phổ thông và nguyên liệu T3 hiện hữu; không đổi save schema, không cấp miễn phí. Dùng UI công thức/Túi đồ/so sánh trang bị hiện có, tên và mô tả thuần Việt.

## Nghiệm thu

- validateContent: không lỗi; 43 công thức Gear IV.
- 2.118/2.118 kiểm thử Node qua, gồm13 trường hợp mới: flags/hệ phụ, rèn và save round-trip, ngưỡng xác suất/chỉ số căn bản, nhiều hit/AoE, hai gear, thay hệ Nguyệt lúc cast, DoT, forecast/lệnh lỗi, Arena, buff Anabel qua lượt thật và chuỗi Siesta có CD.
- TypeScript và production frontend build qua.
- Playwright qua luồng chọn công thức → nguyên liệu → xác nhận → modal kết quả → lưu gear, reload/mobile không tràn ngang hoặc lỗi trang.
- Không dùng save thật; bản EXE chưa đóng gói cho lần thay đổi này.

## Điều kiện kích gear theo cờ sát thương — quyết định mới 25/11/2026

Bỏ hoàn toàn ngoại lệ theo nhân vật. Gear chỉ kích nếu normalDamage:true và không có cờ phân loại sát thương nào khác bật, kể cả effectDamage hay cờ tương lai. Các cờ nằm trong damageFlags hoặc boolean có hậu tố Damage; không lẫn với area/reaction/automatic/target/VFX. Cờ false không phải hiệu ứng đang bật. Nguyệt chính/phụ luôn ép effectDamage:true và normalDamage:false; cờ đặc biệt khai báo trên hit được giữ nguyên qua resolve và event. Một hành động có nhiều loại hit kiểm riêng từng hit; cache xác suất không cho phép hit đặc biệt mượn kết quả từ hit thường.

Flynn/Bianca không có ngoại lệ riêng: phần đánh thực mang Nguyệt và mọi hiệu lệnh Chúc Phúc không hưởng proc; đòn thuần thường trước khi biến đổi vẫn hợp lệ như mọi nhân vật khác. Chỉ số ATK/MAG +20% luôn theo luật trang bị cũ, có thể ảnh hưởng trung bình Chúc Phúc. DoT cũng giữ các cờ khai báo và phân loại sau chuyển Nguyệt. Forecast dùng cùng quy tắc, không tiêu RNG thật.

Test normal-damage-flags.test.js thay bộ test khóa theo tên nhân vật: kiểm đòn thường/Nguyệt thực tế Flynn/Bianca, cả hai phe mirror, cờ đặc biệt tương lai, nhiều cờ đồng thời, forecast và giữ chỉ số trang bị.

Nghiệm thu quy tắc theo cờ: 2.127/2.127 kiểm thử engine qua, gồm cờ tương lai và packet nhiều cờ; validate và TypeScript qua. Không build lại EXE trong lượt này.
