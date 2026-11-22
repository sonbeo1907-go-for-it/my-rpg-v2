# Nguyệt Quang Chúc Phúc — khung tổ hợp và các nhân vật cấp quyền

Cập nhật **20/11/2026**, giờ Việt Nam. Trạng thái: **Noelle đã phát hành chính thức từ 20/11/2026**. Tài liệu này thay đặc tả nháp 0.1 và tên cũ “Không Nguyệt Chúc Phúc”.

## Quyết định mới nhất

- Tên chính thức: **Nguyệt Quang Chúc Phúc**, concept Moonlight Blessing.
- Có bảng hiệu ứng riêng theo phe, cùng vùng trình bày Hồn Kiếm/Thuốc Súng. Khi chờ có hai ô nguyên tố; khi hoạt động hiện tên, chỉ số động và số vòng còn lại.
- Chúc Phúc tự kích hoạt khi đủ hai tầng tương ứng **và toàn bộ chuỗi hành động đang xử lý đã kết toán**, gồm nhiều hit, nhiều mục tiêu, phản công, Liên kích và các phản ứng phát sinh. Không chen vào giữa chiêu, không chờ hết vòng, không phụ thuộc thời lượng VFX.
- Mỗi tổ hợp có chỉ số/công thức riêng. Lôi Sấm Thịnh Nộ dùng ATK; Hạt Giống Bội Thu dùng MAG.
- Noelle, Shashthi và Flynn là nhân vật chính thức trong gacha. Shashthi cấp quyền Hạt Giống Bội Thu; Noelle/Flynn cấp Lôi Sấm Thịnh Nộ. Xem [SHASHTHI_FLYNN](SHASHTHI_FLYNN.md) cho hai nhân vật mới và Hé Lộ Yufina/Astraea.
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
- Hai mốc đầu/cuối vòng thường chỉ dùng hai lần; trần ba không tự thêm đợt đánh thứ ba. Nhân vật khác có thể ra lệnh cho Chúc Phúc Liên kích; Noelle phản hồi cả đợt ra lệnh và dùng chung trần ba/vòng với các đợt tự động. Không Liên kích nếu không còn địch hoặc Noelle đã gục.

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

## 9. Hiệu lệnh Chúc Phúc — 20/11/2026

Đã có effect tái sử dụng `{"type":"command_moonlight","blessingId":"thunder_wrath"}`. Nhân vật ra lệnh không cần tự cấp quyền tổ hợp; cần Chúc Phúc đúng loại đang hoạt động ở phe mình, người ra lệnh còn sống và đợt trước đã kết toán. Gawain (Hé Lộ) và Flynn đã có hiệu lệnh chính thức; Flynn hỗ trợ hệ số chính/còn lại và hiệu lệnh tùy điều kiện.

Đợt theo hiệu lệnh là Liên kích từ chính nguồn Chúc Phúc, giữ chỉ số động, hệ số, nguyên tố, mục tiêu, phòng thủ, VFX và các giới hạn PvP của nó. Không mượn ATK/MAG, Rank hoặc trang bị người ra lệnh. Chi phí và hồi chiêu thuộc kỹ năng ra lệnh; đợt Chúc Phúc và phản hồi của Noelle không trả thêm MP.

Noelle phản hồi **mọi đợt tấn công hợp lệ của Lôi Sấm Thịnh Nộ**, gồm đầu vòng, cuối vòng và Liên kích được ra lệnh. Tất cả dùng chung **tối đa3 lần mỗi vòng**, không phải3 lần mỗi lượt của người ra lệnh và không tách hạn mức cho từng nguồn. Đây là lý do trần3 cao hơn hai đợt tự động thông thường.

Ví dụ: đầu vòng Noelle phản hồi lần1; một hiệu lệnh tạo lần2; cuối vòng tạo lần3. Nếu các hiệu lệnh đã dùng đủ ba lần trước cuối vòng, đợt cuối vòng vẫn đánh nhưng Noelle không phản hồi nữa. Đầu vòng kế tiếp được xét hạn mức mới.

Các bảo đảm của khung:

- Hiệu lệnh không đánh dấu hoặc tiêu slot đợt tự động đầu/cuối vòng, không nạp nguyên tố, không kích hoạt lại hoặc làm mới thời hạn.
- Không có Chúc Phúc, sai tổ hợp hoặc đã hết hạn: kỹ năng bị chặn trước chi phí MP/hồi chiêu.
- Khi một đợt Chúc Phúc và các phản ứng của nó đang giải, không nhận lệnh đệ quy vào chính đợt đó. Khóa tạm giải phóng bằng finally, không trở thành trạng thái duy trì hay clock mới.
- Noelle đã gục: Chúc Phúc còn hiệu lực vẫn nhận hiệu lệnh, nhưng không tạo phản hồi của Noelle. Đòn kết liễu cuối cùng dừng chuỗi theo kết quả thật.
- Forecast dùng trial clone; không tiêu MP, quota hoặc slot của trận thật. Hai phe có thể ra lệnh cho Chúc Phúc của phe mình, không điều khiển phe đối thủ.

Đường gọi: `applyEffect → commandMoonlight → performMoonlightAttack`; đợt tự động cũng dùng `performMoonlightAttack`. Hook phản hồi Noelle nằm ở đường chung, không gắn riêng vào vòng lặp đầu/cuối vòng. Test hồi quy: `test/moonlight-command.test.js`.

## 10. Nguyệt Quang Hé Lộ và Aisha — 20/11/2026

### Mở khóa và cấu hình

Nguyệt Quang Hé Lộ là nội tại bổ sung của Rhett, Gawain, Tywin, Yufina và Astraea, không thay nội tại gốc. Mỗi người mở một lần bằng **30 Pure Prisma** ở tab Kỹ Năng, mặc định bật sau khi mua; bật/tắt sau đó miễn phí. Phải sở hữu nhân vật. Không đổi khi đang chiến đấu, trong chuyến hầm ngục hoặc phiên pháo đài. Giao dịch dùng bản sao và chỉ công bố sau khi lưu thành công; không trừ tiền khi thất bại.

Save v7 có thêm `moonlightRevelations[id]={unlocked:true,enabled:boolean}`. Save thiếu trường nhận `{}`, không tự mở hoặc thu phí. Resolver chốt `moonlightRevelationEnabled` vào build trận. Roster mượn không tự được nâng cấp tài khoản; PvP dùng snapshot của từng phe và Rank tối đa 5 như trước.

Người có Hé Lộ **không có `moonlightBlessings`**, không tạo bảng/tổ hợp khi đi riêng. Chúc Phúc tương ứng cùng phe đang hoạt động mới mở hiệu quả: Lôi Sấm Thịnh Nộ cho Rhett/Gawain/Tywin; Hạt Giống Bội Thu cho Yufina/Astraea (kèm mode). Hiệu quả mất ngay khi Chúc Phúc kết thúc, không tạo buff status có thể xóa hoặc bị Phong Ấn. Giữ trạng thái mua/bật qua save; hiệu quả trong trận và deadline Chúc Phúc theo cơ chế carry đã có.

| Nhân vật | Khi Lôi Sấm Thịnh Nộ đang tồn tại |
| --- | --- |
| Rhett | +30% ATK. Ka-Boom! vẫn trả MP và tiêu Điện tích một lần. Mỗi Điện tích thực tiêu tạo thêm một đợt vật lí Lôi–Nguyệt 70% ATK vào toàn bộ mục tiêu; 2 Điện tích = 2 đợt, 3 = 3. Đủ 3 thì đợt chính cũng thêm Nguyệt. Các đợt thêm không tăng theo Rank hoặc Thông Thạo; là các hit cùng kỹ năng, không phải cast hay Liên kích mới. |
| Gawain | Sau Thiên phạt trọng trảm, ra lệnh Chúc Phúc đánh một đợt với **180% ATK động của Chúc Phúc**. Hệ số này cố định, không lấy ATK/Rank/gear Gawain. Noelle phản hồi và tính chung giới hạn 3 lần/vòng. Không có Chúc Phúc thì kỹ năng gốc vẫn dùng bình thường. |
| Tywin | +25% ATK. Nhất Kiếm — Thủy Nguyệt mang thêm Nguyệt và có thêm một hit vật lí Thủy–Nguyệt 250% ATK. Hit thêm giữ Hội Tâm, không tăng theo Rank hoặc Thông Thạo và cùng lần trả MP/CD. |

Effect `command_moonlight` có thêm `multiplier` tùy chọn (giới hạn hợp lệ 0 < x ≤ 10). Bỏ trống dùng hệ số gốc của Chúc Phúc; hiệu lệnh không sửa definition, pulse tự động hoặc thời hạn. Đợt 180% của Gawain không biến các đợt sau thành 180%.

### Aisha #118

Nhân vật chính thức thuộc khu nghiên cứu Rhett, vào banner thường và pool phụ rate-up từ 20/11/2026. Hỗ trợ tấn công hệ Thủy; đòn đánh dùng ATK và gây vật lí. HP150, MP120, ATK36, MAG6, DEF18, RES14, SPD24. Cô bé thiên tài thích đồ ngọt, người chế tác và bạn của Noelle. Không tự cấp quyền Chúc Phúc.

- **Tiếp Năng Dưới Trăng:** cuối vòng, khi Lôi Sấm Thịnh Nộ cùng phe còn hoạt động, hồi 8% MP tối đa (làm tròn lên) cho mọi người Thủy/Lôi còn sống, gồm bản thân. Aisha phải còn sống. Kết toán sau đợt cuối vòng, trước Chúc Phúc hết hạn; vòng cuối vẫn có hồi. Một lần/vòng, không thêm ở Vòng Phụ hoặc mỗi hit. Choáng không chặn nội tại vòng.
- **Kẹo Nổ Phá Giáp:** 8 MP, CD2; một địch nhận 120% ATK, giảm 40% DEF trong 3 lượt chính người nhận. Debuff bị Hộ Ấn/cleanse theo luật thường, không tăng độ giảm theo Rank.
- **Phát Minh Nhỏ, Tiếng Nổ Lớn:** 8 MP, CD0; một địch nhận 180% ATK.
- **Xưởng Kẹo Sấm:** 20 MP, CD3 từ lúc thi triển; vào mode5 vòng tính cả vòng tạo, rồi đánh toàn địch 80% ATK ngay. Trong mode, người Thủy/Lôi cùng phe nhận +25% ATK, gấp đôi thành +50% khi Chúc Phúc còn tồn tại; gồm Aisha, cập nhật động khi Chúc Phúc vào/rời. Đây là aura mode, không phải status buff. Nguồn gục/rời mode thì aura mất; không cộng riêng một buff tự thân lần nữa. Mode đang chạy không thể thi triển lại.
- Từ đầu vòng kế tiếp, máy đánh toàn địch 50% ATK mỗi đầu vòng. Không đánh riêng ở đầu lượt Aisha hoặc Vòng Phụ. Rank Xưởng Kẹo Sấm tăng sát thương vào dạng/pulse theo luật10%, aura ATK theo luật5%. Không có asset/scene đổi nền hay BGM; dùng hiển thị mode tiêu chuẩn ở ô Aisha.

CD3 theo engine: thi triển R khóa R+1/R+2/R+3, sẵn sàng R+4; mode5 vòng vẫn khóa việc gọi lại đến khi rời ở cuối R+4. Có thể triển khai lại lượt kế tiếp khi hết mode. Wave/phòng giữ actor mode và deadline vòng; encounter mới trong phiên pháo đài chỉ mang HP/MP. Không ghi mode đang đánh vào tiến trình nhân vật vĩnh viễn.

### Bằng chứng kiểm thử

`test/moonlight-revelation.test.js` kiểm mua/bật/tắt/save cũ, không tự cấp tổ hợp, điều kiện active, ATK, 2/3 Điện tích, sát thương thêm cố định qua Rank/Thông Thạo Rhett/Tywin, hệ số180%, Noelle response, forecast không sửa trận thật, PvP hai phe, aura Aisha chỉ đúng hệ, pulse vòng/Extra/expiry, hồi MP ở vòng cuối và khi nguồn gục. `e2e/revelation.spec.ts` kiểm giao dịch và reload hồ sơ thật trên trình duyệt, copy kỹ năng Aisha, bố cục1440/768/390px.

## 11. Shashthi / Flynn / Hé Lộ Hạt Giống

Đã triển khai chính thức; hợp đồng nhân vật, hệ số, đồng hồ và kiểm chứng nằm tại [SHASHTHI_FLYNN](SHASHTHI_FLYNN.md). command_moonlight có primaryMultiplier cho mục tiêu chính và optional:true cho hiệu lệnh đi kèm đòn cá nhân: thiếu Chúc Phúc vẫn trả chi phí và đánh phần cá nhân, bỏ riêng hiệu lệnh. Không đổi tính bắt buộc của hiệu lệnh thuần cũ.

### Hiệu lệnh Flynn tăng Rank — 21/11/2026
command_moonlight có rankScaling:true tùy chọn trong data. Resolver của người ra lệnh cấp rankDamageFactor một lần; hiệu lệnh truyền factor sang damage của nguồn Chúc Phúc, trước phòng thủ/soft cap. Hai nhánh Flynn cùng nhận tăng10%/Rank1–5. Pulse tự động và hiệu lệnh không khai opt-in (Gawain) giữ nguyên. Không đổi nguồn ATK, quota Noelle, clock, chi phí, thứ tự chuỗi hoặc carry. Preview/tooltip cùng factor; PvP clamp Rank5 trước khi tạo hiệu lệnh. Không thay definition Chúc Phúc hoặc data gốc.


## Hiệu lệnh hạt giống theo mục tiêu — 21/11/2026

Bianca #121 là provider Quang–Thổ thứ hai. `moonlight_activation_resource` cấp tài nguyên cá nhân khi activation thực sự hoàn tất. `command_moonlight` có thể khai `targetMode:selected` (chỉ anchored blessing) và `spendResource:{id,max}`; số tầng trả thành số hit cùng một Liên Kích. Chỉ chọn địch còn sống có anchor của chính phe, không fallback sang địch khác. Pulse tự động vẫn đánh mọi anchor hợp lệ và giữ clock cũ. Runtime tách factor Rank, số hit, targetMode và MAG/ATK của nguồn; không mutate pulse definition. Xem [BIANCA](BIANCA.md).


## Luna / quyền toàn tổ hợp — 21/11/2026

Luna #122 dùng native moonlight_hymn/allBlessings: moonlightAccess trả mọi định nghĩa đã đăng ký, không thêm tổ hợp chưa triển khai. Hiện Luna tự cấp quyền Thủy–Lôi/Quang–Thổ, vẫn phải nạp sát thương thật theo hai ô. Shashthi nhận diện Luna là provider để nhân đôi buff. Native10% Nguyệt ảnh hưởng cả nguồn Chúc Phúc; trường và gear của Luna theo phe, không thay định nghĩa pulse hoặc ưu tiên ghép. Xem [LUNA](LUNA.md).

Song Nguyệt Đồng Tâm (21/11/2026): đợt `command_moonlight` giữ nguồn độc lập nhưng nhận 25% khuếch đại Nguyệt từ gear của người ra lệnh, đúng một lần. Context theo cast, không ảnh hưởng pulse tự động/Noelle/hiệu lệnh khác; xem LUNA.md.

## Bài Ca Vô Danh — 22/11/2026

Quang–Ám được triển khai chính thức trong khung Chúc Phúc, Luna tự cấp quyền. ATK động50% trung bình Quang/Ám +10 điểm phần trăm mỗi loại debuff cộng qua từng địch còn sống, cap120%. Cuối vòng chung mỗi địch nhận0–3 hit vật lí Ám–Nguyệt theo debuff, cùng context nên chỉ tiêu1 Sơ Hở Ám/địch. Xem [NAMELESS_SONG](NAMELESS_SONG.md) cho đầy đủ clock, snapshot, nguồn, carry và nghiệm thu.
