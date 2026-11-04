# Hướng dẫn thêm nội dung

JSON thuần, ID ổn định; đổi tên hiển thị không đổi ID. Đọc scripts/load-content.mjs, src/core/content.js và validator chuyên biệt trước khi thêm field. [Ví dụ nguyên mẫu](archive/CONTENT_GUIDE_PROTOTYPE.md) được lưu để tham khảo, không phải schema hiện hành.

## Nhân vật và kỹ năng

- characters.json có tên, nguyên tố, role/roleGroup, stats, abilities, passive và các trường đặc thù được hỗ trợ. roleGroup gồm physical_dps, magical_dps, offensive_support, defensive_support, tank, fighter, sorcerer. secondaryRoleGroups, affiliation và tags có ý nghĩa riêng.
- `affiliation` là slug ổn định (vd `hunters_guild`), không phải chuỗi hiển thị; nhãn tiếng Việt nằm duy nhất trong `AFFILIATION_LABELS` của `src/core/catalog.js`. Thêm phe thì thêm cả slug lẫn nhãn, xem [AFFILIATIONS](AFFILIATIONS.md); thiếu nhãn là lỗi UI.
- Stats là giá trị thô trước passive. Không ghi sẵn bonus rồi áp thêm lần hai. scalingStat và damageType độc lập: scale ATK vẫn có thể gây sát thương phép.
- Ability/status dùng ID tham chiếu, target, cost, cooldown và effect được validator hỗ trợ. Cơ chế mới cần handler, validator, preview và test; không chỉ thêm một field JSON.
- Skill Rank khai báo skillLineId/growthProfile/growthGroups/rankable; fixed có fixedReason. Mọi nhóm hợp lệ cùng tăng: damage/heal/shield ×1,1 mỗi Rank; stat buff hợp lệ ×1,05. Damage amp giữ nguyên, kỹ năng output buff có quy tắc giảm MP riêng. Replacement cùng skill line giữ Rank.
- Nhân vật mới chính thức: cập nhật pool khi được duyệt, AI profile, preview và asset vai trò. Save cũ thêm state khóa, không tự mở. Astoria không vào pool chính thức; Monica dùng AI chung.

## Status và phản ứng

Thời hạn, CD, mode và hook phản ứng mới phải có [hợp đồng vòng đời](COMBAT_LIFECYCLE_CONTRACT.md): đơn vị/người sở hữu, lượt tạo, choáng, extra, nhiều hit/move, carry và exit. Không tự thêm các field của bảng contract vào JSON nếu validator/engine chưa hỗ trợ.


Tái sử dụng type/hook, không so tên hiển thị. [ENGINE_RULES](ENGINE_RULES.md), [RECIPIENT_STATUSES](RECIPIENT_STATUSES.md) và [WEAKNESS_MECHANICS](WEAKNESS_MECHANICS.md) giải thích stack/charges/clock. effect.charges cấp số lần riêng, không nhân Rank.

Liên kích từ đồng đội dùng canTriggerFollowUp; phản công/truy kích theo mode là hook riêng. Chặn đệ quy, reserve hạn mức trước side effect. Dùng actor-life.isAlive trong handler chung. Phe/ô tính tương đối nguồn; actor ID trận không phải character ID trong Arena.

Buff damage amp chỉ mức lớn nhất đủ điều kiện có hiệu lực; charge của buff yếu vẫn tiêu khi đủ điều kiện. Mode/background/tài nguyên không tự tính là buff. Đừng thêm ngoại lệ theo tên nhân vật để chiều một rotation mới.

## Che chắn, hồi sinh và Rank hồi chiêu

- `cover` chỉ chắn đòn đơn mục tiêu. Muốn chắn thêm đòn diện rộng hoặc Liên kích/phản công phải bật `coverArea`/`coverReactions` trên chính status (validator đòi `cover: true`). Thêm `coverTeam` để biến status trên người bảo hộ thành hào quang che cả đội; khi đó thời hạn trôi theo lượt chính của **người bảo hộ**, không theo người được che. Đây là cơ chế dùng chung cho mọi nhân vật sau này — chỉ cần status riêng + kỹ năng self-cast, không sửa engine. Nguồn Che chắn phải còn sống; đòn nhắm chính người chắn không bị đổi mục tiêu; mỗi đòn chỉ một người chắn.
- Nội tại `cover_guard` chỉ giảm đòn khi Che chắn thực sự đổi mục tiêu sang người mang; nhân riêng với giảm đòn Che chắn của Trấn Phái, tổng hệ số giảm bị chặn ở 70%.
- Hồi sinh dùng effect `revive` **chỉ** trên `all_allies`, `hpRatio`/`mpRatio` trong (0,1]. Người đã gục trở lại đầy HP/MP, được làm sạch status **trừ Vết Thương Sâu**; không chen vào lượt đang diễn ra; event `revive` dùng VFX chung. Trên người còn sống, hồi sinh xóa status có `healingDebt` (Kế Ước Thế Chấp) và trả sạch nợ HP nhưng **giữ `healingReceivedReduction`** (Vết Thương Sâu) cùng debuff khác. Lượng hồi của hồi sinh luôn đặt về 100% HP, đủ vượt Vết Thương Sâu cho lần hồi đó.
- Che chắn và Khiêu Khích đi cùng nhau phải dùng **cùng clock** (`main_turn`) để không lệch ở Vòng Phụ; Khiêu Khích riêng của Brant là `brant_taunt`, không dùng status `taunt` chung.
- `growthProfile: cooldown` (giảm hồi chiêu theo Rank) **đã gỡ** cùng với việc bỏ nâng Rank của Kinh Cầu Hồi Sinh; không thêm lại nếu chưa có quyết định thiết kế mới.
- Kỹ năng cần khóa đầu trận dùng `initialCooldown` (1–10). Engine lưu +1 và giảm ở đầu mỗi Vòng Chính: `initialCooldown: 6` = không dùng được trong vòng 1–6, mở từ vòng 7 (giống `aldric.reservoir`); giá trị này độc lập với `cooldown` sau khi dùng.
- Nội tại hồi máu → MP dùng `heal_mp_regen` (`ratio`, `cap` **mỗi người được hồi**); tính trên lượng hồi chủ sở hữu tạo ra, trước giảm hồi/overheal của người nhận; heal AoE tính theo đầu người, không gộp tổng.

## Encounter, nhạc và trình bày

Enemy/encounter referenceLevel=1. HP curve theo encounter, không từng enemy. Preview/trinh sát/combat cùng enemy-scaling; không scale actor hai lần. Normal/boss/bounty mặc định very_easy; truyện10/20/30, cùng Level trong mọi wave/phase của chương.

rewardTier, category, travelerStory và bgm là các lớp độc lập. Cờ mở khóa/thưởng lần đầu dùng requires/ledger/transaction, không phát ở component mount. BGM tham chiếu music.json; Arena dùng start/climax/finale cùng mã bản nhạc.

**Định hướng lớp Thuật Sư:** khi thiết kế nội dung mới, dành VFX nhận diện riêng cho cơ chế chủ đạo. Có thể là trường/đạo cụ tương tác trên bàn, triệu hồi, hiệu ứng tại nhân vật hoặc hoạt ảnh kỹ năng riêng. Không đồng nhất với việc bắt buộc thay background hay cấp combatMode. Ví dụ: Astoria/Magnamut, Monica/trường thời gian, Auguste/ma trận, Sylva/Azurius, Drake/giáp và Golem, Astraea/vườn hoa, Sandra/sách lệnh và phong ấn.

PvE cho phép ảnh hưởng bàn đấu theo dữ liệu presentation được thiết kế. Arena giữ mode cục bộ trong card, không ghi đè nền/BGM; VFX công kích vẫn chọn đúng mục tiêu. Nhân vật lớp khác có thể có VFX riêng khi được chỉ định, nhưng không tự nhận overlay chỉ vì có combatMode. Thuật Sư mới chưa có thiết kế VFX cần ghi là phần còn thiếu, không âm thầm coi glyph mặc định đã hoàn thành yêu cầu.

VFX chỉ đọc event. presentation riêng không mặc định tạo combatMode hoặc scene overlay. Không RNG, hồi MP hay chuyển phase trong renderer. Dọn hiệu ứng sau timeline, giữ status badge nếu debuff còn; hỗ trợ reduced motion và hai phe Arena.

## Gear, kinh tế và save

Gear là instance ID duy nhất; ô thường3→6, Trấn ô riêng. Hook Trấn chỉ hiệu lực khi trang bị. Gear IV cần nhóm hiệu ứng và CD riêng; không dùng CD kỹ năng thay CD gear. Tái rèn lưu kết quả chờ, không roll lại khi reload hoặc retry.

App save v7; thêm trường phải normalize/validate và giữ migration. Đổi/xóa ID đã phát hành cần migration rõ ràng. Không sửa save thật, không đổi namespace vì đổi tên game. Persist trước publish, thưởng RNG độc lập combat RNG.

## Nghiệm thu

1. Validate tham chiếu/schema; test PvE và hai phe Arena nếu cơ chế chung.
2. Kiểm tra hit/AoE/lan/random, né/Hội Tâm/cover/khiên/gục, MP0/thiếu MP, vòng chính/phụ, hạn mức, Hộ Ấn/Phong Ấn khi liên quan.
3. Kiểm tra carry đúng ranh giới dungeon, boss phase và Chronicle; mode exit/refund đúng một lần.
4. Đối chiếu preview/Rank/forecast với engine; definition không bị mutate.
5. Save cũ/retry/ledger/quota không cấp một phần. UI cần browser test responsive, reduced motion và tay cầm theo phạm vi thay đổi.
6. Cập nhật chuyên đề; thay quyết định chung thì cập nhật HANDOFF/ENGINE_RULES. Source đổi thì graph:update.

## Nghiệm thu ngôn ngữ

Chữ người chơi nhìn thấy ưu tiên thuần Việt, độc lập ngôn ngữ implementation. Quét cả tooltip, trạng thái khóa, lỗi, xác nhận, nhật ký và kết quả, không chỉ tiêu đề. Tái dùng thuật ngữ trong GLOSSARY. Giữ tên riêng/ký hiệu có chủ ý; không lộ key, enum, tên handler hoặc exception thô. Mô tả hiển thị mới còn tiếng Anh ngoài các ngoại lệ đã chốt được tính là chưa hoàn thiện; không thay ID để dịch giao diện.

- Sinh Mệnh Thế Chấp dùng effect `{type:"status",status:"life_mortgage"}`; có thể thêm `debtMaxHpRatio:0.15` cho diện rộng. Không khai duration/stack/charge; không tăng nợ theo Rank. Xem [LIFE_MORTGAGE](LIFE_MORTGAGE.md).

- Hỗ trợ nguyên tố: `targetElement` giới hạn người nhận buff theo hệ; `element_ally_followup`/`element_ally_weakness_mp` là nội tại theo kỹ năng của đồng đội khác. Damage có `onHitDispelCount` xóa buff chỉ khi gây sát thương, trên người thực sự trúng. Xem [ELEMENT_SUPPORTS](ELEMENT_SUPPORTS.md).
