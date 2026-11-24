# Quy tắc engine cần bảo toàn

Đối chiếu source ngày 03/11/2026. Đây là bản tóm tắt contract; cơ chế riêng vẫn phải đọc dữ liệu/handler và test tương ứng. Không suy rộng một ngoại lệ thành luật toàn game.

Đặc tả clock, các nhánh không cast và ma trận nghiệm thu: [COMBAT_LIFECYCLE_CONTRACT](COMBAT_LIFECYCLE_CONTRACT.md).

## Lượt và đồng hồ

- Vòng Chính (`phase=main`) → Vòng Phụ (`extra`) nếu có quyền → cuối vòng → vòng chính kế tiếp. round chỉ tăng ở vòng chính. Mỗi người tối đa một Lượt Thêm/vòng, không chen ngay vào queue, không tạo chuỗi quyền vô hạn trong pha phụ.
- Cooldown kỹ năng giảm ở đầu vòng chính. Cast CD 2 ở R khóa R+1/R+2, sẵn sàng R+3. Lượt Thêm không giảm CD. Một số mode bắt đầu CD khi **rời dạng**, không khi vào (Selene).
- Mode có thể đếm theo **vòng** (`lifetime: rounds` + `durationRounds`) hoặc theo **lượt của chính người mang** (`lifetime: turns` + `durationTurns`). Mode theo lượt trừ ở cuối lượt của người mang, tính cả lượt thi triển **và lượt bị bỏ qua vì choáng**; không trừ khi đồng đội/địch hành động, nhưng Lượt Thêm của chính người mang vẫn tính, trừ mode khai rõ `durationClock:main_turn` (Flynn): chỉ trừ lượt chính, vẫn tính lượt chính Choáng. Rời dạng xử lý như mode hết hạn bình thường.
- `durationClock=main_turn`: chỉ lượt chính người mang trừ thời hạn. Clock mặc định có thể giảm theo lượt thực tế, gồm lượt phụ; không viết “mọi buff đều không giảm ở lượt phụ”. `round`: deadline vòng tuyệt đối; DoT có nhịp riêng. Status mới trong chính hành động không bị trừ ngay. Tra applyStatus/finishStatuses/round-effects và test.
- Gear CD là cơ chế riêng: kích hoạt R với CD 3 có thể kích lại R+3; không dùng công thức CD kỹ năng cho gear.
- Thứ tự theo SPD; trường Monica PvE ưu tiên phe, Arena +15%SPD phe mình/−15% phe địch. Trường không phải buff/debuff. Đổi thứ tự không cho người đã hành động đi lại. UI animate theo queue engine, không tự sort.

## Chỉ số, sát thương và kết quả

- Lv nhân vật không tự tăng stat. Resolver cộng phân bổ/gear/Trấn/bonus căn bản theo handler, rồi các modifier %. Không cộng lại nội tại trên stat đã resolve. “Căn bản” thường gồm gear/phân bổ, không gồm buff% tạm; các conversion cần đọc đúng hàm baseStatValue/evasionBaseSpeed.
- scalingStat và damageType độc lập: Yufina scale ATK gây phép; Lumine scale MAG gây vật lí. Vật lí qua DEF, phép qua RES; hybrid có nhiều phần trong cùng hành động, không gộp phòng thủ thành một.
- Hệ không có bảng tương khắc mặc định. Điểm yếu là dữ liệu/tạm thời, mặc định × 1,5; Khai Phá Điểm Yếu thay thành× 2, không × 1,5 × 2. Weakness nguyên tố và loại đòn không nhân lặp.
- Hội Tâm bỏ qua né, không bỏ khiên/DEF/RES/soft cap. Né thường cap 85%; passive có rule riêng, Chelsea có thể đạt 100%, không cap 90% toàn game.
- Dùng đường hit chung cho direct damage; DoT có đường riêng. amount là HP mất, absorbed là khiên hấp thụ. Không suy damage từ HP trước/sau vì có phản ứng hồi máu chen vào. Trần giảm sát thương thông thường 75% theo engine, không tự áp lên mọi công thức riêng.

## Cộng dồn và tiêu thụ

| Cơ chế | Quy tắc |
| --- | --- |
| Cùng status ID | Mặc định refresh; stack chỉ khi có cấu hình. Không mặc định cộng mọi modifier |
| modifierGroup | Lấy độ lớn mạnh nhất trong nhóm theo stat-values; khác nhóm có thể cộng |
| Damage amp từ buff kỹ năng | Chỉ giá trị đủ điều kiện lớn nhất có hiệu lực; các buff vẫn hiện và các charge hợp lệ vẫn tiêu theo hành động. Passive/gear/weakness/damage-taken không tự gộp chung |
| damageUses | Một charge/lần gây direct damage, không mỗi hit/mục tiêu; xem charged-buffs |
| Khiên | Lấy giá trị mạnh hơn, không cộng dồn; giữ nguồn để xử lý vỡ khiên. Khiên bản thân không mặc định là buff status |
| Hộ Ấn | Chặn từng debuff mới từ địch theo charges; không cleanse, không chặn damage/hình phạt tự gây |
| Phong Ấn | Chặn từng buff status mới theo charges, không xóa buff cũ; tái cấp refresh. Mode/tài nguyên không phải buff. effect.charges cho phép cấp số lần riêng, dùng chung mọi nhân vật |
| Vết Thương Sâu / Rạn Khiên | Giảm hồi HP 40% / khiên mới 35%; khác nguồn lấy mạnh nhất; không giảm MP/khiên cũ |
| Nhiễu Ma Lực | +50% MP sau điều chỉnh, ceil; chỉ tiêu khi cast hợp lệ trả MP, không tiêu ở 0 MP/tài nguyên thay thế |
| Sơ Hở nguyên tố | Tối đa 3, chỉ một hệ trên mỗi đơn vị; một tầng/mục tiêu/lần thi triển; đa hit/hybrid không tiêu mỗi hit. On-hit mới không lợi cho phần còn lại của chính cast |

Sơ hở tài nguyên riêng của Takeshi và Sơ Hở nguyên tố là hai cơ chế khác. Debuff cùng tên dịch gần giống không chứng minh cùng ID hoặc nhóm modifier.

## Phản ứng và phạm vi

- Handler Liên kích **từ hành động đồng đội** dùng canTriggerFollowUp: nguồn khác chủ, cùng phe, chủ/mục tiêu hợp lệ; không tự kích. Không để phản ứng đệ quy. Phản công khi bị địch đánh/né và truy kích riêng từ chính skill (ví dụ Joshua hoặc Anabel với survivingTargetRepeat) là hook khác, không xóa chúng bằng cách áp luật Aurora máy móc.
- Hạn mức theo round dùng chung cả pha chính/phụ, không reset khi đổi phase boss. Cần reserve trước khi tạo tài nguyên để tránh vòng lặp; Arena còn loopGuards riêng.
- Nội tại `enemy_support_counter` (Cerise): địch dùng kỹ năng chủ động **không có hiệu ứng sát thương** (bỏ qua Phòng thủ và kỹ năng tự động) thì chủ nội tại giải toàn bộ debuff của bản thân rồi phản đòn. Hạn mức tính theo vòng qua `cooldownRounds`, dùng chung Vòng Chính/Phụ, và không đệ quy từ phản ứng.
- Đội hình bốn vị trí cố định, không nén ô trống/người gục. Kề đồng đội nối 1↔4 khi skill khai báo; lan địch không nối vòng. Tag/phe quyết định gia tộc, không suy từ tên.
- Bằng Chứng, Thuốc Súng và Hồn Kiếm tách theo đội. Có bất kỳ nhân vật khai báo tài nguyên là mở pool, không cần “nhân vật trung tâm” còn sống. Bằng Chứng đầy 6 vẫn phát event tạo để nội tại nhận biết; không thực cộng quá 6.

## Carry-over: không dùng một luật cho tất cả

| Ranh giới | Hành vi hiện tại |
| --- | --- |
| Trận độc lập mới / lượt farm mới | Snapshot mới, hồi HP/MP theo khởi tạo, trạng thái trận cũ không mang sang |
| Wave/phòng trong cùng dungeon | Giữ snapshot actor, HP/MP, trạng thái, khiên, tài nguyên, mode và CD; vòng/queue mới theo engine; không resolve loadout lần nữa |
| Wave truyện | Theo story-waves và cấu hình; không phát thưởng/lần đầu mỗi wave; kết quả tổng ở cuối |
| Phase Miraebolis | Cùng battle; giữ mode/tài nguyên, hồi MP toàn đội theo phase reward; không giả mode exit/refund |
| Encounter khác trong phiên pháo đài | Chỉ HP/MP giữ; trạng thái/khiên/CD tạo mới. Đội/gear khóa. Một lần nghỉ quân y/phiên hồi đầy cả người gục |
| Đóng/reload | Quest/dungeon thường không serialize battle; Chronicle có checkpoint state + RNG và khôi phục qua chronicle-combat.js; Arena bỏ trận xử thua. Không cấp farm offline |

Magnamut: kết thúc ở resource 0 tại đầu lượt/ cuối vòng; đầu lượt không skip action. Hoàn tất toàn cast trước exit check. Refund 35% MP gắn **sự kiện rời dạng đúng một lần**, không gắn render/cuối vòng/đổi phòng. Phòng dungeon giữa giữ dạng+rifts, phase Miraebolis không rời dạng. Trận thật kết thúc/gục xử lý lifecycle theo combat-modes.

## Presentation và giao dịch

VFX đọc event, không sửa combat. Phân biệt nguồn đang act, hit, status badge và mode. VFX dấu Phong Ấn biến mất sau cast; debuff vẫn tồn tại. Cleanup timer/portal khi hết timeline, đổi session/unmount; reduced-motion không đổi kết quả.

Save app v7, không xóa key legacy. Quest/dungeon thường không lưu battle RNG/queue; Chronicle có adapter checkpoint riêng, rollback nếu persist lỗi. Mọi thưởng, gear, Rank, mở khóa, quota đi qua persist trước publish. Failed-save retry không reroll; UI không tự cấp/nhận lại do mount/replay/skip animation. Test bằng save riêng.

Hồn Kiếm: hai hạn mức tăng tự nhiên theo đội/vòng, dùng chung main/extra; không tính basic/Defend/phản ứng. Tsukiha dùng nguyên tố nhân vật Hỏa và hit Hỏa + Hồn Kiếm: điểm yếu chỉ một hệ số, một tầng Sơ Hở/cast. Xem [SWORD_SOUL](SWORD_SOUL.md).

## Thăng Tiến và Hồn Kiếm vòng trước (05/11/2026)

`escalation.hitDamageGrowth` tăng sát thương cơ sở trước mọi damage amp (không thuộc nhóm amp chỉ lấy lớn nhất), nhân mỗi hit sau trên cùng mục tiêu trong một hành động; mặc định ×1,05, reset từng action/target. Buff thường theo2 lượt chính; Chiyoko duy trì bản boundStatuses cùng mode permanent, không dispel riêng. Mode penetration khai báo theo damageType. Eri đọc spentRound/spent của phe mình ở đầu vòng, chỉ vòng liền trước và cap+100% MAG. Xem [ERI_CHIYOKO](ERI_CHIYOKO.md).

## Mastery PvE và Arthur — 06/11/2026
Mastery là tiến trình PvE: mọi trận có opponentCampaign/PvP rules clamp actor skillRanks và resolver tối đa5 cả hai phe; cache/override không được vượt. Ogre có masteryEligible:false, gateRank sau HardArthur, tối đa5 kể cả previewoverride. PassiveArthur mới cấp3 tài nguyên ở trận độc lập, không ở carry/phase; sauKiếmQuang dùng baseATK/150 cho +1, không từ skip. Xem ARTHUR_COMPLETE_CONTROL/SKILL_MASTERY.

Mastery hiện dùng bảng theo mức: output1,12/1,12/1,15; stat buff1,06/1,06/1,075. Trấn native_passive_override thay tham số trên clone loadout, không mutate data hoặc cộng lại nội tại. Quan sát trạng thái chỉ từ apply thành công, không từ bị chặn, và có guard phản ứng. Xem EXCLUSIVE_BALANCE_2026_11_06.

Voodoo/Rotary: queue giữ chủ ô gốc, activeActor là người thực hiện được chốt trong delegatedTurn. Mỗi lượt chính người nhận (tự nhiên hoặc chuyển) trừ một thời hạn Voodoo; lượt phụ không trừ. Nguồn bị Choáng vẫn chuyển lượt, nguồn gục xóa liên kết. Đầu vòng cấp một Lượt Thêm cho nguồn nếu liên kết còn hiệu lực. Xem ROTARY.md; không tự suy người đang hành động từ queue[cursor].


## Footprint và nghi thức nhiều boss — 15/11/2026

- Footprint chiếm nhiều ô chỉ thay vùng trình bày; mục tiêu, AoE, đòn lan/random, hit và trigger vẫn tính theo actor duy nhất. Không tạo thêm actor thân giả.
- Trận nhiều boss có kịch bản phải khai controller/capability hợp lệ, giữ clock/CD/status từng actor và chỉ thắng khi hết địch sống. Song trùm Đại Yêu Ma giữ tổng hai hành động/vòng: mỗi người một, hoặc survivor hai từ đầu vòng sau.
- Nghi thức báo ở đầu R không giải phóng trước lượt boss R+1; chuẩn bị giữa vòng R thì cảnh báo đầu R+1 và giải phóng từ R+2. Due move chiếm ô hành động, không thêm ô. Chiêu lớn cùng đến hạn phải giữ phần bị hoãn, không bỏ mất. Capability `pendingFiller` đóng băng rotation khi giải phóng và dùng đòn nhẹ cho ô còn lại.
- Vỡ Thế của Cự Quỷ đếm lượt chính boss, không đếm move; gây trong chính lượt boss không hết ngay. Phản ứng là cast riêng khi phá dấu, DoT không tạo dấu. Chi tiết/source-of-truth: [Đại Yêu Ma](EAST_GREAT_YOKAI.md).

- [Ariel / Sân Khấu](ARIEL.md): hiệu ứng riêng theo phe không ghi đè Monica/Auguste. Sát thương phép phẳng cộng trước RES/khuếch đại, chốt MAG người cấp, chia số hit phép và tiêu một lần/chiêu hợp lệ. Rotary chủ động loại Hồn Kiếm khỏi Sơ Hở sao chép theo hệ chính.

- [Charlotte](CHARLOTTE.md): status effect `baseStatModifiers` cộng căn bản trước buff%; Rank tăng5%/rank. `linkedPassiveGrowth` tăng damage của nội tại từ Rank chiêu được chỉ định (10%/rank). `consumeDamageType` giới hạn loại sát thương trực tiếp tiêu charge; không thay quy tắc amp lớn nhất.

- [Clark](CLARK.md): `full_hp_heal_cleanse` xét HP sau hồi trực tiếp, kể cả actual heal0 khi đã đầy. Regen đánh dấu periodic và không kích. Không biến mọi hồi0 thành native trigger: yêu cầu hồi dương, nguồn/cùng phe còn sống, không bị chặn.

- [Mariel](MARIEL.md): hào quang chỉ cho người có khiên, +RES căn bản trước %, tắt khi hết khiên/nguồn gục. Hit phá khiên còn hưởng; hit kế tiếp xét lại. `snapshotScaling:true` chỉ chốt scaling cho effect heal/shield khai opt-in; `cleanse.count` giới hạn số debuff mỗi người, không khai giữ giải toàn bộ.


Nguyệt Nhật Hỗn Mang: ngoại lệ Chúc Phúc không auto pulse, vòng kích hoạt20% → hai vòng60% → vòng cuối20% phép Hỏa. Chu kỳ suy từ common round, Extra/Choáng không tick riêng. Hiệu lệnh luôn selected enemy, một Sơ Hở cho cả chuỗi; không retarget khi gục. Không gộp hào quang vào strongest-only buff amp. Đọc CHAOTIC_ECLIPSE.md.

## Thuật thức theo pha trăng — 24/11/2026

resolveBattleAbility chọn nhánh theo trạng thái trận trước cast rồi mới resolve Rank. Không dùng preview tĩnh để chốt nhánh thật. secondaryAllyTarget yêu cầu allyTargetId hợp lệ cùng phe, kiểm trước trả phí; AI/forecast/UI dùng cùng contract. Kéo dài buff chỉ tăng thời hạn còn hạn, không tăng charges hoặc kéo dài persistent/mode. Status untilMoonlightWaningEnd có marker startedRound riêng, hết cuối đúng Waning sau Vòng Phụ, không tick theo cast/Extra/Choáng. Maria Full +28MAG căn bản và MP×2; Nicole sống mới tăng MAG nguồn25% và mở self-amp. Đọc WITCH_GARDEN.md.
