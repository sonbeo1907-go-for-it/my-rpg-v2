# Biên Niên Ký — Quyển I

Nguồn: GDD v1.4, các quyết định cấp độ và đường dẫn `art` được người thiết kế chốt ngày 01/11/2026.
https://docs.google.com/document/d/1UcpBvJziMTSKEbUeNz8mYVkiT8K_k8kvBtF-JpfSgR8

## Nội dung và giao diện

- Tavern → Biên Niên Ký (`/chronicles`) → Mái Nhà Giữa Gió Bắc (`/chronicles/book1`).
- Kệ sách dùng phong cách bìa Lữ hành; một quyển căn giữa. Chỉ đếm 10 intro công khai.
- Trình duyệt hai cột gồm tranh địa điểm và danh sách 10 địa điểm. Mobile chuyển một cột, danh sách cuộn riêng.
- Cảnh tương tác gồm nền SVG, đạo cụ ghép, hành động và tường thuật. Hết trận trở về đoạn hậu chiến, sau đó mới hoàn thành và nhận thưởng.
- 10 intro cố định và 40 sự kiện Thăm lại, gồm 10 sự kiện ẩn. ID intro nằm trong namespace `book1.intro.*`, sự kiện trong `book1.*` để không nhầm F01 intro với F01 tại ruộng.
- 35 SVG nằm trong `public/art/chronicles/book1/`, URL `/art/chronicles/book1/`. Không có chữ cốt truyện, chân dung người hoặc nhân vật bí mật vẽ cứng trong SVG.

Tái tạo artwork: `node scripts/generate-chronicle-art.mjs`. Các đạo cụ inline dùng cùng nguồn vector với file SVG độc lập, không có script SVG hoặc yêu cầu ảnh bên ngoài. Có 10 cảnh, 4 biến thể sau F10, 19 đạo cụ, 1 bìa, 1 lớp cảnh quan J04.

## State machine

`data/chronicles.json` định nghĩa quyển và địa điểm; `data/chronicleEvents.json` định nghĩa điều kiện, các bước, thao tác và encounter. `chronicle-rules.js` xác thực DAG, quyền vào và lịch tuần; `chronicles.js` xử lý lựa chọn sự kiện, bước và thưởng.

Ưu tiên: intro chưa xong → tiếp tục pending → hidden đủ điều kiện → pool thường. J04 là tương tác cảnh quan riêng, không tham gia roll thường và không tự bật boss. Hidden A04–I04 đã hợp lệ được ưu tiên ngay lần thăm kế tiếp. Event thường chưa hoàn thành ×3 trọng số; sau hai lượt thường hoàn thành mà không gặp event mới, lần chọn thường tiếp theo lấy event chưa hoàn thành. Không lặp ngay event trước nếu còn ứng viên khác.

Mỗi địa điểm tối đa một pending. RNG sự kiện, bảng thưởng, seed combat và cấp được chốt khi tạo instance; bỏ dở/reload không quay lại. Mọi thao tác yêu cầu đúng instance/step/action hiện tại; thao tác cũ không thể hoàn thành hoặc nhận thưởng lại.

## Cấp độ và combat

- Intro/combat thường: `min(40, floor(sum(levels) / số thành viên có mặt))`. Không tính ô trống. Cấp giữ nguyên trong instance, các wave và retry.
- Alice J04: cố định Level1, cùng template và skill gốc; không dùng stat profile suy yếu.
- Alice Hiểm Ác: allowlist 60/70/80/90, dùng đúng scaling engine. HP tiếp tục tăng; ATK/MAG/DEF/RES giữ quy tắc freeze sau50. MP/SPD theo engine hiện tại. Không thêm hệ số riêng.
- Sự kiện độc lập bắt đầu HP/MP đầy. Các wave trong cùng sự kiện giữ actor HP/MP, khiên, status, mode, tài nguyên và cooldown theo engine multi-wave hiện hành.
- `chronicle-combat.js` tạo/checkpoint/khôi phục trận. Snapshot giữ trạng thái RNG cùng Set/Map và actor state; không chứa content hoặc function.
- Mỗi lệnh và lượt địch được thực thi trên bản thử. Chỉ thay trạng thái live sau khi ghi checkpoint thành công; lỗi ghi rollback cả lượt và RNG.
- Chỉ một trận hoạt động. Có thể rút về địa điểm, giữ sự kiện và quyền retry; khi bắt đầu lại trận, seed/cấp đã chốt được giữ.

## Thưởng và save

Save v7 bổ sung trường tùy chọn `chronicles`, schema nội bộ version1. Save cũ tự có state rỗng, giữ nguyên tiền, trang bị, đội hình và tiến trình khác.

28 lượt nhận thưởng Thăm lại mỗi tuần, chung toàn quyển/hồ sơ, reset Thứ Hai 00:00 giờ Việt Nam. Chốt tuần tại thời điểm hoàn thành, không phải lúc bắt đầu. Pending và rewardRoll không đổi khi qua tuần. Hết quota vẫn hoàn thành và mở cờ.

NPC/combat dùng cùng bảng: 75% Coin100–200, 20% Vụn10–20, 5% Pure Prisma1; các khoảng quay đều. Nhận tự động; không hiển thị kết quả trước hoàn thành. Intro thử nghiệm nhận25Coin một lần, không tốn quota. J04 không có thưởng tiền tệ. Cờ, xóa pending, quota và tiền được lưu chung một giao dịch; ghi lỗi giữ nguyên bước cuối để thử lại.

Không cộng chồng thưởng Quest, EXP hoặc Ủy Thác; encounter Chronicle bị loại khỏi Quest catalog, picker độ khó và pool Dungeon. Bản Hiểm Ác Alice không cấp tiền, Pure hoặc EXP lặp. `victories` và các thưởng thông thường ngoài Chronicle giữ hành vi hiện tại.

## Alice và tương thích

J04 yêu cầu F10 cùng chuỗi điều kiện nội bộ. Hotspot không được render/focus khi chưa hợp lệ; khi hợp lệ chỉ có hành động quan sát trung tính, không có tên boss, chấm than hoặc nhạc nhận diện trước trận. Mouse, touch, bàn phím và Xbox dùng cùng hitbox/thao tác.

Thắng trận intro chưa kết thúc event: phải trở về đoạn hậu chiến và hoàn tất. Giao dịch cuối đặt `aliceFirstEncounterCleared`, sau đó Quest Hiểm Ác mới có Alice. Không thêm thông báo mở boss. Miraebolis tiếp tục dùng điều kiện cũ, không được mở theo Alice.

Không suy diễn đã gặp Alice từ `illusion.sinister_unlocked`. Chỉ migrate quyền Alice nếu save có receipt chiến thắng riêng `alice_superboss`; save chỉ có cờ chung giữ quyền Miraebolis và đi theo tuyến khám phá mới đối với Alice.

## Kiểm tra

Core: đầy đủ50 sự kiện/DAG; migration; cấp trung bình/cap40; snapshot/roundtrip/RNG; multi-wave; bước lỗi/stale; quota/reset tuần; event mới và hidden gating; tách Quest/Dungeon/EXP; Alice intro và cả bốn cấp public.

UI: kệ sách/desktop/mobile; bắt đầu/rời/tiếp tục; lỗi ghi save; combat thực tế và reload; quay về hậu chiến; hết quota vẫn có cờ; quan sát bí mật; rút lui; thắng Alice intro thật rồi hiện đúng một boss; Xbox/bàn phím; lỗi checkpoint không đổi lượt/RNG.

Đây là cấu hình playtest. Kiểm thử chức năng và smoke test không thay thế đánh giá độ khó, thời lượng và độ dễ nhận biết manh mối với người chơi mới.
