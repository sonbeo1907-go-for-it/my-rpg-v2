# Nguyệt Quang Chúc Phúc — Noelle và khung tổ hợp

Cập nhật **19/11/2026**, giờ Việt Nam. Trạng thái: **đã triển khai, bản playtest**. Tài liệu này thay đặc tả nháp 0.1 và tên cũ “Không Nguyệt Chúc Phúc”.

## Quyết định mới nhất

- Tên chính thức: **Nguyệt Quang Chúc Phúc**, concept Moonlight Blessing.
- Có bảng hiệu ứng riêng theo phe, cùng vùng trình bày Hồn Kiếm/Thuốc Súng. Khi chờ có hai ô nguyên tố; khi hoạt động hiện tên, chỉ số động và số vòng còn lại.
- Chúc Phúc tự kích hoạt khi đủ hai tầng tương ứng **và toàn bộ chuỗi hành động đang xử lý đã kết toán**, gồm nhiều hit, nhiều mục tiêu, phản công, Liên kích và các phản ứng phát sinh. Không chen vào giữa chiêu, không chờ hết vòng, không phụ thuộc thời lượng VFX.
- Mỗi tổ hợp có chỉ số/công thức riêng. Lôi Sấm Thịnh Nộ dùng ATK; Hạt Giống Bội Thu dùng MAG.
- Noelle là nhân vật chính thức, vào gacha ngay. Hạt Giống Bội Thu có engine và cấu hình nhưng **chưa có nhân vật cấp quyền**, không thêm Developer Option cho tổ hợp này.
- Lôi Sấm Thịnh Nộ gây **vật lí Lôi–Nguyệt**. Hạt Giống Bội Thu gây **phép Thổ–Nguyệt**.
- Ba vòng tính cả vòng kích hoạt. Thực thể đã gọi tồn tại khi người cấp quyền bị hạ; không giữ trận tiếp tục nếu cả đội gục.

## 1. Khung dữ liệu dùng lại

Ba lớp độc lập:

| Lớp | Nơi lưu | Nội dung |
| --- | --- | --- |
| Định nghĩa tổ hợp | `data/moonlightBlessings.json` | Cặp nguyên tố, chỉ số, hệ số lấy chỉ số, thời hạn, mốc đánh, cách chọn mục tiêu và kỹ năng tự động |
| Quyền truy cập | `character.moonlightBlessings` | Danh sách ID mà nhân vật cho phép cả phe dùng; không suy quyền từ hệ nhân vật |
| Trạng thái trận | `battle.moonlight[team]` | Tổ hợp được phép, hai ô nạp, tổ hợp hoạt động, vòng kích hoạt gần nhất, revision và hạn mức đã xử lý |

Các cặp hợp lệ của khung là **Thủy–Lôi, Thủy–Hỏa, Quang–Thổ, Quang–Ám**. Hiện chỉ hai cặp Thủy–Lôi và Quang–Thổ có định nghĩa hiệu ứng. Không tự tạo hiệu ứng cho hai cặp chưa thiết kế.

Quyền của phe là hợp của những tổ hợp được khai báo trên đội hình. Hai người cấp cùng một tổ hợp không nhân đôi thực thể. Có quyền Thủy–Lôi và Quang–Thổ không tự mở Thủy–Thổ. Đối thủ và người chơi có trạng thái, nguồn damage và limiter riêng.

### Thực thể “thứ 5”

Chúc Phúc có ID nguồn riêng `moonlight_<team>`, chỉ số và hành động riêng, nằm trong `sourceActors`. Nó **không thêm một slot vào bốn ô đội hình**, không có lượt chủ động, không bị chọn mục tiêu và không được tính vào số đồng đội/gia tộc/vị trí kề. HP nội bộ của nguồn chỉ để đi qua resolver, không phải thanh HP của một đơn vị có thể đánh.

Không tự nhận buff, trang bị, Trấn Phái, Rank hoặc Thông Thạo của Noelle. Những nguồn tăng ATK/MAG của thành viên lấy mẫu đã nằm trong công thức động; không cộng lần thứ hai lên Chúc Phúc. Đợt đánh dùng kỹ năng tự động fixed Rank1; Liên kích của Noelle dùng Rank kỹ năng 1 của chính cô.

## 2. Nạp và kích hoạt

Các quy tắc vận hành cụ thể của bản playtest:

1. Sát thương từ đơn vị trong đội hình lên phe đối địch, thực sự làm mất HP/HP tối đa hoặc khiên, mới nạp nguyên tố. Né hoặc không có thiệt hại không nạp. Đánh thường, kỹ năng, Liên kích, phản công và DoT có nguồn hợp lệ đều có thể nạp; thực thể Chúc Phúc không tự nạp.
2. Chỉ nhận nguyên tố thuộc một tổ hợp phe có quyền dùng. Nạp loại đã có không thêm tầng; tối đa hai ô, mỗi loại một tầng.
3. Ô đầu giữ nguyên khi gặp nguyên tố không thể ghép thành một tổ hợp được phép. Ví dụ đội được phép Thủy–Lôi/Quang–Thổ, đã nạp Thủy rồi nhận Quang: bỏ Quang, giữ Thủy. Các tầng chờ giữ đến khi ghép hoặc encounter thật kết thúc.
4. Thứ tự không đổi công thức: Lôi rồi Thủy vẫn là Thủy–Lôi. Đòn nhiều hệ có thể nạp cả hai nếu thỏa một tổ hợp; xử lý theo thứ tự nguyên tố của đòn và giữ cặp đầu tiên hoàn thành, không lưu ô thứ ba.
5. Khi đủ cặp, các ô chờ đến ranh giới kết toán toàn chuỗi. Tại đó tiêu cả hai, ghi mốc đã kích, khóa nạp và tạo thực thể trong một bước trước khi phát sự kiện kích hoạt.
6. Tối đa một lần kích hoạt mỗi vòng cho cả phe. Khi đang hoạt động không nhận thêm nguyên tố, không làm mới và không gọi tổ hợp khác. Giới hạn vòng không reset bởi Lượt Thêm, phase boss, UI render hay đổi phòng.
7. Chỉ kích hoạt nếu trận chưa kết thúc và cả hai phe còn người sống. Không tạo Chúc Phúc sau đòn kết liễu cuối cùng.

Chiêu làm đủ nguyên tố **chưa hưởng hiệu ứng mới**. Ví dụ Noelle đánh Lôi trong lúc đã có Thủy Nguyệt: mọi hit và phản ứng của chiêu hiện tại kết toán trước, sau đó mới gọi Lôi Sấm Thịnh Nộ. Các đòn Noelle gây ra sau mốc kích hoạt mới có thêm Nguyệt.

## 3. Chỉ số động

| Tổ hợp | Chỉ số thực thể | Đợt đánh |
| --- | --- | --- |
| Lôi Sấm Thịnh Nộ | Trung bình ATK động của thành viên Lôi/Thủy còn sống | 100% ATK, vật lí Lôi–Nguyệt, toàn bộ địch |
| Hạt Giống Bội Thu | 150% trung bình MAG động của thành viên Quang/Thổ còn sống | 150% MAG, phép Thổ–Nguyệt, mỗi mục tiêu có hạt |

Tập lấy mẫu chỉ gồm nhân vật còn sống thuộc phe trong đội hình thực; không gồm chính thực thể, quái hoặc nguồn đã rời đội. Tính lại trước mỗi đợt đánh, chốt một giá trị cho toàn bộ đợt để phản ứng giữa các mục tiêu không thay sức mạnh trong cùng đợt. Nếu không còn thành viên hợp lệ, chỉ số bằng 0, không tự lấy chỉ số Noelle làm dự phòng. Phần làm tròn/minimum damage đi theo resolver chung.

UI lấy snapshot chỉ số từ engine dùng cùng đường stat với combat, không tự tính lại một công thức thiếu aura. Các buff/debuff, gear hoặc conversion của thành viên được lấy mẫu tác động gián tiếp qua giá trị động.

Một hit Lôi–Nguyệt hoặc Thổ–Nguyệt vẫn là **một hit hai nguyên tố**, không nhân điểm yếu hai lần và không chia thành hai nguồn damage. Stat scale và loại phòng thủ độc lập; Lôi Sấm Thịnh Nộ qua DEF, Hạt Giống qua RES. Thuộc tính Nguyệt không tự cho phép bỏ qua phòng thủ hoặc gây damage HP tối đa.

## 4. Vòng đời

| Mốc | Hành vi |
| --- | --- |
| Kích hoạt ở vòng R | `startedRound=R`, `expiresAfterRound=R+2`; không tự đánh ngay chỉ vì vừa gọi |
| Đầu vòng | Sau các nguồn tự động hiện hữu và trước dựng hàng lượt, kết toán trạng thái, chạy đợt đầu vòng của Chúc Phúc hợp lệ |
| Cuối vòng | Sau pha phụ và các nguồn cuối vòng hiện hữu, kết toán trạng thái, chạy đợt cuối vòng rồi kết thúc nếu đến hạn |
| Hết hạn | Đợt cuối và phản ứng của nó hoàn tất trước khi xóa Chúc Phúc; trả về hai ô trống |
| Lượt Thêm/Choáng | Không thêm hoặc đóng băng tick vòng; Noelle còn sống vẫn có thể Liên kích khi bị Choáng vì đây là phản ứng |
| Người cấp quyền bị hạ | Thực thể đang hoạt động vẫn tiếp tục; người đã gục không được lấy mẫu chỉ số hoặc Liên kích |
| Cả phe bị hạ / hết địch | Dừng theo kết quả trận thật, không giải các đợt tương lai |
| Đổi wave/phòng dungeon, wave truyện/Chronicle | Mang state và nguồn theo snapshot, giữ mốc vòng tuyệt đối; không gọi lại hoặc tặng thêm thời hạn |
| Phase Miraebolis | Cùng battle, không khởi tạo lại |
| Encounter mới trong phiên pháo đài | Theo contract encounter mới: chỉ HP/MP carry, Chúc Phúc bắt đầu từ trạng thái mới |
| Checkpoint | State thuần dữ liệu; resume không chạy lại mốc đã reserve. Forecast dùng clone, không sửa trận thật |

Kích giữa vòng R cho Lôi Sấm Thịnh Nộ còn **năm đợt**: cuối R, đầu/cuối R+1, đầu/cuối R+2. Hạt Giống còn **ba đợt cuối vòng**. Nếu kích trong chuỗi đầu vòng trước mốc đánh Chúc Phúc, có thể đánh tại mốc đầu vòng đó; không phát lại mốc đã qua.

## 5. Noelle Model 4.0

**#117 · Hỗ trợ phòng thủ · Lôi · Khu Nghiên Cứu Rhett.**

Mẫu người máy tân tiến nhất do Aisha chế tác tại khu nghiên cứu tự xưng của Rhett. Noelle vừa là người bạn của Aisha, vừa chăm sóc cô như một bảo mẫu.

| HP | MP | ATK | MAG | DEF | RES | SPD |
| --- | --- | --- | --- | --- | --- | --- |
| 200 | 100 | 35 | 5 | 24 | 24 | 20 |

### Người Bạn Không Ngủ — nội tại

- Cấp cả phe quyền Thủy–Lôi, gọi **Lôi Sấm Thịnh Nộ**.
- Khi Lôi Sấm Thịnh Nộ hoạt động, mọi nguồn damage của Noelle mang thêm Nguyệt.
- Mỗi đợt Chúc Phúc tấn công gọi một Liên kích bằng **Mạch Sét Dẫn Lối**, không trả MP. Tối đa ba lần mỗi vòng, tính chung pha chính/phụ.
- Một AoE Chúc Phúc chỉ gọi một Liên kích, không gọi theo từng hit/địch. Phản ứng reserve hạn mức trước khi giải; không cho Noelle tự gọi lại Chúc Phúc hoặc nối vô hạn.
- Hai mốc đầu/cuối vòng thường chỉ dùng hai lần; trần ba không tự thêm đợt đánh thứ ba. Không Liên kích nếu không còn địch hoặc Noelle đã gục.

### Kỹ năng

| Tên | MP | CD | Tác dụng Rank1 |
| --- | --- | --- | --- |
| Mạch Sét Dẫn Lối | 8 | 0 | Vật lí Lôi toàn bộ địch 150% ATK; gắn hai Sơ Hở Lôi, thời hạn ba lượt theo luật status hiện hành |
| Vòng Tay Bảo Hộ | 10 | 1 | Khiên toàn đội 100% ATK; giảm 15% sát thương nhận vào trong ba vòng |
| Chăm Sóc Tận Tâm | 10 | 1 | Hồi HP một đồng đội 150% ATK |

Khiên đi theo luật khiên chung, không cộng dồn; chưa có hạn tự mất riêng. Sát thương/khiên/heal theo Rank1–5 hiện hành; giảm sát thương và số tầng Sơ Hở giữ nguyên. Noelle chưa mở Thông Thạo. CD1 dùng ở R, khóa R+1, dùng lại R+2.

Noelle có trong banner thường; được thêm vào lịch rate-up qua `rosterAdditions` từ **19/11/2026**, không sửa lại roster lịch sử. Chưa có Trấn Phái, cốt truyện nhận hoặc Developer Option riêng. Không thay save version hoặc sửa AppData.

## 6. Hạt Giống Bội Thu

Đã có định nghĩa Quang–Thổ nhưng chưa có provider chính thức; không thể truy cập bằng đội hình game hiện tại. Test cấp quyền trên fixture riêng, không sửa roster phát hành.

- Khi kích hoạt, ghi ID của mỗi địch còn sống làm điểm neo hạt. Đây là **một Chúc Phúc có nhiều điểm neo**, không phải N nhân vật mới.
- Cuối mỗi vòng, mỗi mục tiêu còn sống thuộc tập neo nhận một hit 150% MAG. Mỗi hạt không gây AoE thêm lần nữa; N địch tương ứng N hit, không N×N.
- Tất cả hạt dùng cùng MAG động đã chốt cho đợt. Tổng hệ số trước phòng thủ tương đương 225% MAG trung bình Quang/Thổ trên mỗi mục tiêu mỗi cuối vòng.
- Neo theo ID, không theo vị trí. Địch mới được triệu hồi không có hạt; người gục không nhận hit. Nếu cùng ID trở lại sống trước khi Chúc Phúc hết hạn, điểm neo vẫn tồn tại và được xét lại. Không chuyển hạt sang người khác hoặc sang địch của wave mới.
- Sát thương phép Thổ–Nguyệt có VFX nảy mầm riêng; mục tiêu sống có dấu hạt trên khung.

## 7. UI, VFX và điểm tích hợp

- Bảng chờ dùng SVG thiên thể xanh/tím dựa trên ảnh người dùng: trăng cuộn, mây, sao và hai ô nguyên tố. Không đổi background toàn trận.
- Khi Lôi Sấm Thịnh Nộ hoạt động, biểu tượng chuyển thành mây giông/sét; bảng hiện ATK động và số vòng còn lại.
- Đợt đánh Lôi Sấm Thịnh Nộ và Mạch Sét Dẫn Lối có VFX sét riêng. Hạt Giống có glyph và VFX riêng trên từng mục tiêu, đồng bộ thời điểm feedback damage của timeline chung.
- UI cùng tồn tại với Bằng Chứng, Thuốc Súng, Hồn Kiếm và các trường khác; hai phe hiện bảng riêng. Không thêm ô đội hình, không thay hàng lượt.
- VFX đọc event, không thực hiện cơ chế. Reduced-motion giữ số hit/kết quả, bỏ chuyển động. Các timer dùng cleanup của CombatEffects.

| File | Trách nhiệm |
| --- | --- |
| `data/moonlightBlessings.json` | Hai định nghĩa tổ hợp |
| `src/core/moonlight-blessings.js` | Validator, state theo phe, nạp/kết toán, công thức động, đợt đánh, kết thúc |
| `src/core/battle.js` | Hook sát thương, quiescent boundaries, đầu/cuối vòng, source/context, Liên kích và snapshot UI |
| `src/core/dungeon.js`, `story-waves.js`, `chronicle-combat.js` | Carry giữa các wave/phòng và checkpoint |
| `src/components/moonlight-board.tsx`, `src/app/moonlight.css` | Bảng theo phe, hai ô, chỉ số và dấu hạt |
| `src/ui/combat-timeline.js`, `src/components/combat-effects.tsx` | VFX dùng chung timeline hit |
| `public/art/moonlight-blessing.svg` | Khung thiên thể |

PvP giữ hai phe đối xứng. Đợt tự động đi qua soft cap/loop guard hiện tại, không được miễn cap vì có nguồn thứ năm. AI Noelle có cấu hình hỗ trợ khiên/hồi phục và công kích để nạp Lôi.

## 8. Nghiệm thu

Các bài kiểm tra mới nằm ở `test/moonlight.test.js`, `test/moonlight-extra.test.js`, `e2e/moonlight.spec.ts`.

Phạm vi đã có test: gacha/stats, tầng và kết toán nhiều hit, Noelle không hưởng Nguyệt hồi tố, đợt đầu/cuối vòng và Liên kích theo AoE, chỉ số động, người cấp quyền gục/cả đội thua, snapshot/forecast, mirror hai phe, Hạt Giống N hit cho N mục tiêu, ATK support scaling, Choáng/Extra Turn, carry dungeon, phase Miraebolis, hạn một kích hoạt/vòng, không nạp từ damage0 và VFX theo hit.

Kiểm tra UI qua chiến đấu thật: trang kỹ năng Noelle, hai ô chờ, kích hoạt mây giông, chỉ số hiển thị và màn 1440/768/390px. Toàn bộ suite và build ghi kết quả trong bàn giao task; tài liệu này không thay bằng chứng cân bằng thực chiến.
