# Luna — Thiếu nữ Mặt Trăng

Quyết định và triển khai ngày 21/11/2026. Nhân vật chính thức #122, hỗ trợ tấn công hệ Thường, vào banner thường/pool phụ rate-up. Không tự tặng nhân vật hoặc đổi save namespace. Tên chuẩn là **Nguyệt Quang Chúc Phúc**; “Không Nguyệt” trong bản đề xuất là cùng cơ chế, không tạo hệ thống thứ hai.

## Bối cảnh và bộ tên

Luna là thiếu nữ bản địa Drageshelmfjall, được Thần Mặt Trăng chọn làm sứ giả khi còn rất nhỏ. Ở tuổi đáng lẽ được tự do, cô bị giữ trong nhà trưởng làng. Dân làng dâng của ngon vật lạ nhưng không thể thay thế điều cô khao khát; Luna ca hát về một cuộc đời ngoài song cửa. Không đồng nhất cô với thánh nữ kế nhiệm Shashthi.

Nội tại **Lời Hát Qua Song Cửa**. Kỹ năng **Nỗi Buồn Dưới Trăng**, **Ước Hẹn Ngoài Song Cửa**, **Khúc Hát Của Trăng Tự Do**. Hành động tự động **Lời Ru Đón Bình Minh** / **Lời Hát Chạm Chân Trời**.

HP300 / MP130 / ATK10 / MAG10 / DEF20 / RES25 / SPD24. Hai chiêu công kích chủ động gây **phép Thường theo HP tối đa động**, không dùng HP còn lại hoặc MAG. Đánh thường là phép Thường thông thường theo MAG.

## Bộ kỹ năng Rank 1

| Kỹ năng | Hiệu ứng | MP / CD |
| --- | --- | --- |
| Nỗi Buồn Dưới Trăng | Toàn địch20% HP tối đa; trúng giảm30% DEF/RES trong3 lượt chính mục tiêu | 10 / 0 |
| Ước Hẹn Ngoài Song Cửa | Toàn địch20% HP tối đa; toàn đội+6 ATK/MAG căn bản trong4 lượt chính từng người; chỉ số cấp gấp đôi nếu Chúc Phúc cùng phe đã hoạt động | 10 / 2 |
| Khúc Hát Của Trăng Tự Do | Vào mode5 vòng, giải toàn bộ debuff và cấp1 Hộ Ấn cho mỗi đồng đội còn sống | 20 / 3 |

Hai chiêu công kích tăng sát thương10%/Rank; buff chỉ số của Ước Hẹn tăng5%/Rank rồi mới nhân đôi. Chiêu mode **chỉ tăng sát thương cuối vòng**: không tăng thời hạn, mức giảm ATK/MAG, mức nhận thêm sát thương, số debuff giải, Hộ Ấn hoặc giảm MP. Rank5 pulse73,205% HP tối đa. Không mở Thông Thạo cho Luna; PvP cap5.

## Nội tại và quyền sử dụng Chúc Phúc

- Phe Luna có quyền dùng mọi định nghĩa Chúc Phúc đã đăng ký. Hiện có Thủy–Lôi, Quang–Thổ và Quang–Ám (Bài Ca Vô Danh, thêm ngày22/11/2026); **Nguyệt Nhật Hỗn Mang chưa triển khai**. Sau này thêm định nghĩa hợp lệ, quyền của Luna tự bao gồm chúng.
- Quyền khởi tạo theo đội giữ khi nguồn gục, như các provider cũ. Không tự tạo nguyên tố hoặc bỏ điều kiện ghép. Nạp/ưu tiên, một Chúc Phúc cùng lúc và deadline3 vòng giữ luật chung.
- Khi Luna còn sống, sát thương thực sự mang Nguyệt của cùng phe (gồm Luna và nguồn Chúc Phúc) tăng10% trước khuếch đại. Tăng hệ số cơ sở trước phòng thủ như quy ước potency hạt giống, không thuộc nhóm damage amp từ buff chỉ lấy mạnh nhất. Nhiều bản không cộng dồn.
- Không tự thêm Nguyệt vào hai chiêu Thường của Luna. DoT vốn có/mang Nguyệt cũng hưởng tăng cơ sở, gear và trường; không biến mọi DoT thành Nguyệt.

## Hợp đồng mode

- Mode `moon_song`, clock vòng toàn cục, deadline R+4 khi dùng ởR; tính cả vòng gọi. CD3 bắt đầu khi cast, sẵn sàng từR+4 nhưng không dùng lại trong dạng; nếu không bị kết thúc sớm thì dùng lại từR+5.
- Mode là trường theo phe, **không phải debuff**: toàn địch−20% ATK/MAG, nhận thêm30% sát thương từ đòn mang Nguyệt. Không bị Hộ Ấn chặn hoặc giải/xóa bằng status. Nhiều nguồn cùng loại lấy mạnh nhất, không cộng dồn.
- Entry giải toàn bộ debuff trước, cấp Hộ Ấn sau. Đầu mỗi vòng kế tiếp giải1 debuff/người rồi cấp Hộ Ấn1 charge. Không cộng charge qua các vòng; còn Phong Ấn thì việc cấp buff vẫn chịu quy tắc chặn buff.
- Choáng không dừng hook đầu/cuối vòng. Lượt Thêm không gọi lại hook, không giảm riêng thời hạn hoặc CD. Hook reserve unit/vòng trước side effect, không lặp do render/restore.
- Cuối vòng, nếu có Chúc Phúc cùng phe: Luna gây50% HP tối đa lên toàn địch, bằng nguồn Luna. Lôi Sấm Thịnh Nộ→vật lí Lôi–Nguyệt; Hạt Giống→phép Thổ–Nguyệt; Bài Ca Vô Danh→vật lí Ám–Nguyệt. Chỉ `chaotic_eclipse`→phép Hỏa–Nguyệt còn là khía cạnh dự phòng, chưa có định nghĩa/quyền kích.
- Không có Chúc Phúc thì không có đòn cuối vòng; trường giảm chỉ số và bảo vệ vẫn hoạt động. Đổi Chúc Phúc không chốt cứng loại đòn lúc vào mode.
- Thứ tự cuối vòng: pulse Chúc Phúc hiện hữu → nội tại hồi MP Chúc Phúc → pulse Luna → mode Luna hết hạn → Chúc Phúc hết hạn. Mode giữ đủ vòng cuối để ảnh hưởng pulse cuối. Không đổi đồng hồ/hook thoát của mode cũ.
- Nguồn gục hoặc trận thật kết thúc: mode/aura/BGM/nền dừng qua lifecycle chuẩn. Victory còn wave tiếp theo giữ mode/deadline, không phát lại entry. Phase boss cùng trận không reset, không hoàn MP giả. Encounter Chronicle chỉ giữ HP/MP theo adapter nội dung như trước.
- Forecast chạy clone; không tiêu MP/CD hoặc chạy tương lai trên trận thật. PvP hai phe đối xứng, Rank tối đa5, VFX toàn bàn và BGM vẫn ẩn theo quy tắc Arena chung.

## Hai gear hiệu ứng T4

Người dùng ghi “3 gear” nhưng chỉ mô tả2: chỉ triển khai2, không tự tạo mẫu thứ ba. Công thức phổ thông sẵn có, chi phí/dismantle theo T4 hiện hành.

| Gear | Hiệu ứng |
| --- | --- |
| Song Nguyệt Đồng Tâm (`moonlit_duet`) | ATK/MAG+15%; khi Chúc Phúc cùng phe hoạt động tăng thành+30%, đòn Nguyệt của người mặc và đòn Chúc Phúc Liên kích do chính người mặc ra lệnh có thêm25% khuếch đại |
| Nguyệt Ước Chung Lòng (`moonlit_covenant`) | HP+25% luôn hoạt động; khi có Chúc Phúc cùng phe và người mặc còn sống, toàn đội+8 ATK/MAG căn bản |

Mỗi người chỉ mang một gear cùng effectGroup. Hào quang+8 không cộng dồn giữa nhiều người mang; người cuối cùng gục hoặc Chúc Phúc hết thì tắt. +8 cộng căn bản trước buff%. Static gear áp theo loadout như gear cùng hệ thống; phần tăng có điều kiện tính từ baseline đã chốt, không tích lũy qua nhiều activation. Phần tăng25% là hiệu ứng gear riêng, không xóa/tiêu charge của buff khuếch đại kỹ năng.

## Trình bày, nhạc và code

Nền SVG `/art/luna-moonfield.svg`: vòng trăng cuộn trên biển hoa xanh, dây hoa rủ và vách đá; không có nhân vật vẽ giả. Giữ panel đủ tối để đọc HP/MP/skill/target trên màn nhỏ. Có reduced-motion. BGM `song_of_the_moon` dùng file người dùng thêm `/bgm/song_of_the_moon.mp3`; hết mode trả về nhạc trận qua controller có sẵn. Khi nhiều mode có nhạc, giữ quy tắc ưu tiên hiện hành, không tự đổi thứ tự toàn game.

`lunar-support.js` giữ permission, aura, potency, gear conditional, aspect và hooks. `rankedModePulse` nối nguồn Rank cho mode có đòn cuối vòng; authored pulse vẫn fixed, không mutate content. `validateLunarSupport`/gear schema kiểm field/cost/source. `test/luna.test.js` kiểm vòng đời/gear/các nguồn; `e2e/luna.spec.ts` kiểm thẻ kỹ năng, túi đồ, scene thật và ba độ rộng.

### Cập nhật Song Nguyệt Đồng Tâm — 21/11/2026

25% khuếch đại cũng áp dụng cho sát thương Nguyệt từ hiệu lệnh của người mặc (Flynn, Bianca, Gawain Hé Lộ và các `command_moonlight` về sau). Giữ nguồn sát thương Chúc Phúc độc lập; chỉ truyền ID người ra lệnh trong context của đợt đó. Không đổi ATK/MAG của Chúc Phúc, không truyền sang pulse tự động, hiệu lệnh của người khác hoặc Noelle phản hồi. Đòn nhiều hit và từng mục tiêu đều nhận đúng một lần; nội tại Luna và tăng hiệu quả hạt giống vẫn là lớp riêng. Hai phe xử lý tương đối theo người ra lệnh; không lưu bonus lên nguồn Chúc Phúc để tránh rò sang đợt tiếp theo.

### Hoạt ảnh Luna — 22/11/2026 (quyết định mới nhất)

Chỉ **mở mắt** trên lớp background, không phủ đen/khép iris toàn màn hình. Oval ngang có Gaussian blur22 đơn vị SVG; mở3,2s với 45% đầu lim dim rồi tăng tốc. Ảnh giữ cover theo viewport, HUD không bị mask. Không phát lại mỗi action/render; rời mode gỡ nền ngay. Reduced-motion hiện đầy đủ ngay và tắt mọi hoa/rung.

24 cánh hoa nền xuất phát hơi phía trong mép dưới ellipse tại đúng thời điểm mở. Tọa độ emitter dùng cùng keyframe bán kính; bay chậm hơn giai đoạn mở nhanh, scale0,25→2,6 để tạo chiều sâu. Khi tới vùng đáy955–973/1000, giảm tốc, lượn nhẹ lên sang trái/phải rồi tan dần; bay6,5–7,4s, toàn lớp dọn sau11,2s. Camera nền rung3 đơn vị/1000 rất chậm, không rung panel hoặc kéo target. Cả emitter và đoạn chạm đáy/lượn đều nằm trong SVG nền (z0).

Lớp hoa thường xuyên riêng (z2, không nhận pointer):10 cánh desktop/6 mobile, góc30° xuống phải; nguồn ở70% phía trên cạnh trái và50% phía trái cạnh trên, chu kỳ38–46s lệch pha. Lớp này được phép qua thẻ combat, nhẹ và thưa vừa. Timer chỉ của trình bày, hủy khi unmount; không thêm thời gian, lượt, sát thương hoặc sự kiện engine.
