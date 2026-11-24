# Nguyệt Nhật Hỗn Mang

Triển khai ngày 24/11/2026. Quyết định người dùng thay mức Trăng Tròn đề xuất 40% bằng **60%**. Maria — Phù Thủy Của Tội Lỗi và Nicole — Phù Thủy Vườn Cổ Tích đã ra mắt cùng quyền gọi Chúc Phúc; xem [WITCH_GARDEN](WITCH_GARDEN.md).

## Kích hoạt và nguồn

- ID ổn định: `chaotic_eclipse`; ghép Thủy + Hỏa theo khung hai ô chung. Chỉ nhận từ sát thương thực sự mất HP/khiên của địch, không từ Chúc Phúc tự tạo.
- Đợi toàn hành động và các phản ứng resolve xong rồi kích hoạt; không chen giữa hit, không đợi animation.
- Provider phải khai `moonlightBlessings`. Nội tại chỉ hỗ trợ không tự cấp access. Luna đã có quyền mọi công thức đăng ký nên tự truy cập công thức mới; không thêm một ngoại lệ chặn Luna. Aisha/Hé Lộ không tự cấp quyền.
- MAG = 1,5 × trung bình MAG động của đồng đội Thủy/Hỏa còn sống. Không lấy nguồn Chúc Phúc vào trung bình, không chụp MAG người ra lệnh, không nhân Rank vào chỉ số này.
- Thực thể nguồn riêng ngoài bốn ô; không có lượt, không được chọn làm mục tiêu, không giữ trận khi cả phe gục.

## Đồng hồ 1–2–1

| Vòng tương đối | Pha | Khuếch đại phép Hỏa |
| --- | --- | --- |
| R kích hoạt | Trăng Tàn — Waning Moon | 20% |
| R+1, R+2 | Trăng Tròn — Full Moon | 60% |
| R+3 | Trăng Lên — Waxing Moon | 20% |

Giữ thứ tự đã chốt Trăng Tàn → Trăng Tròn → Trăng Lên. Tính cả vòng kích hoạt dù gọi muộn; pha suy ra từ `startedRound`, không có timer thứ hai. Chuyển pha ở đầu Vòng Chính trước các đợt đầu vòng. Vòng Phụ, Choáng, vận sức, boss nhiều move không đổi pha. Pha Trăng Tròn có hai vòng; HUD hiển thị số vòng của pha và số vòng tổng còn lại.

Hết cuối R+3 sau các đòn hợp lệ thì hết hiệu lực. Không tự làm mới/gọi lại/đổi loại khi còn tồn tại; không tích nguyên tố khi active. Mỗi vòng vẫn chỉ kích hoạt một lần. Provider gục không xóa thực thể đã gọi. Trận độc lập mới khởi tạo trống; kết quả thật không phát thêm lượt/pulse tương lai.

## Hào quang và hiệu lệnh

Không có sát thương tự động khi vào, đầu vòng hoặc cuối vòng: `phases:[]`. Không mô phỏng bằng đòn 0 damage vì sẽ có thể sinh phản ứng giả.

Hào quang theo phe áp lên direct hit **phép có Hỏa** của nhân vật, gồm kỹ năng, Liên kích và phản công. **Mặc định không áp lên sát thương của chính Chúc Phúc**, kể cả hiệu lệnh do nhân vật ra lệnh. Scaling stat có thể là ATK/MAG/HP; loại damage và nguyên tố mới quyết định. Hai nguyên tố chứa Hỏa chỉ nhân một lần. Vật lí Hỏa hoặc chỉ Nguyệt không hưởng. DoT hiện không khai loại vật lí/phép nên không tự suy thành phép Hỏa.

Là nhóm khuếch đại Chúc Phúc riêng, nhân với hệ số hiện có; không phải buff status, không thể dispel, không chiếm charge, không tham gia nhóm buff kỹ năng chỉ lấy lớn nhất. Không nhân hai lần khi nguồn vừa Hỏa vừa Nguyệt. Các amp Luna/gear/điểm yếu vẫn xử lý ở lớp của chúng.

Hiệu lệnh khai:

~~~js
{type:'command_moonlight', blessingId:'chaotic_eclipse',
 targetMode:'selected', multiplier:1.2, hits:3}
~~~

Kỹ năng ra lệnh phải chọn `enemy`. Hệ số/số hit do kỹ năng cấp, có thể opt-in `rankScaling` theo engine hiện hữu. Không tự đặt hệ số phát hành cho Maria/Nicole. Đòn mẫu nguồn `moonlight.chaotic_eclipse` chỉ là mẫu damage nội bộ, không cấp vào bộ kỹ năng nhân vật.

- Sát thương phép Hỏa–Nguyệt, tính RES; mặc định không nhận hào quang pha của chính Chúc Phúc. Các bonus Nguyệt khác giữ nguyên theo nguồn.
- Một enemy được chọn, không yêu cầu hạt giống/anchor. Cấm primaryMultiplier/AoE cho công thức này.
- Một action context cho cả chuỗi: một Sơ Hở Hỏa/mục tiêu. Mục tiêu gục thì dừng chuỗi, không chuyển mục tiêu; mục tiêu sai/gục trước command không tiêu tài nguyên điều khiển.
- Không tự gọi thêm command, không gia hạn pha, không dùng slot pulse; chặn lồng command khi đợt trước đang xử lý. Noelle không đáp ứng vì chỉ nghe Lôi Sấm Thịnh Nộ.
- Luna cuối vòng có thể đánh phép Hỏa–Nguyệt khi Chúc Phúc này active: đó là đòn của Luna, không phải pulse tự động Chúc Phúc.

## Carry, đối xứng và trình bày

Dungeon/wave/phase cùng battle giữ startedRound/deadline; sang vòng mới suy pha từ vòng mới, không gọi lại. Encounter độc lập trong Chronicle theo luật adapter chỉ mang HP/MP. Forecast clone không sửa pha/MP/giới hạn trận thật. PvP có state, nguồn, MAG, hào quang và mục tiêu riêng mỗi phe; Rank/Mastery vẫn theo luật Arena.

Bảng hiện đĩa trăng, dòng nước xanh, vành lửa đỏ cam; pha hiện tại được gạch sáng, con số khuếch đại và vòng còn lại lấy cùng dữ liệu engine. Không đổi nền toàn trận/BGM. Hiệu lệnh là hỏa quang hội tụ xuyên đúng ô mục tiêu, không VFX AoE; reduced-motion tắt chuyển động nhưng giữ thông tin. Ba pha nằm đủ trong bảng ở 1440/768/390px.

## Nghiệm thu

`test/chaotic-eclipse.test.js`: activation sau damage, zero auto pulses, tiến trình vòng thực 20/60/60/20/expiry, MAG động/KO, scope Fire magic, command đơn/đa hit, một Sơ Hở, không retarget, chống lặp, forecast, Extra/Choáng, provider KO, carry dungeon, Arena mirror, Luna pulse, validation.

`e2e/chaotic-eclipse.spec.ts`: gọi bằng Luna+Thủy/Hỏa trong combat, phase HUD và remaining, hết hạn, responsive ba kích thước, reduced-motion. Quyền gọi và công thức cũ giữ regression riêng.

## Cập nhật tự khuếch đại — 24/11/2026

Quyết định mới thay phần hiệu lệnh tự hưởng amp của bản đầu. damageAmplification.includeBlessingDamage mặc định false (thiếu trường cũng false). Chỉ source actorKind moonlight bị loại; đòn riêng phép Hỏa của Luna/đồng đội vẫn hưởng, bất kể có thêm Nguyệt.

Hook dùng lại setMoonlightSelfAmplification(battle, team, enabled) cho phép bật/tắt boolean trên active instance, ngoài hào quang của Nicole đã triển khai. Nicole còn sống và cùng phe cấp tự khuếch đại; explicit runtime override được ưu tiên. Switch không sửa content, MAG, phase/deadline, pulse hoặc trạng thái phe kia; carry trong cùng chuyến theo active snapshot, tự mất khi Chúc Phúc kết thúc. Từ chối khi chưa active, hết hạn, outcome hoặc giá trị không boolean. Flag runtime có thể ghi đè cả cấu hình true thành false. Khi bật, Chúc Phúc hưởng amp pha đúng một lần. Không thay amp Nguyệt của Luna/gear hoặc luật Sơ Hở.

Kiểm thử mới: damage command cố định qua 20/60/60/20 khi tắt, bật/tắt trong vòng thật, mặc định thiếu field, reset khi gọi lần sau, đối xứng Arena, forecast không mutate và validation boolean.

## Cập nhật Khu Vườn Phù Thủy — 24/11/2026

Quyết định mới thay các số/nguồn nhân vật cũ tương ứng: Luna nội tại8%, trường12% damage Nguyệt nhận vào. Nicole và Maria đã ra mắt, đều cấp quyền Nguyệt Nhật Hỗn Mang; Nicole sống mở self-amp theo pha và +25% MAG Chúc Phúc, Maria Full +28MAG căn bản/MP×2. Đọc [WITCH_GARDEN](WITCH_GARDEN.md).
