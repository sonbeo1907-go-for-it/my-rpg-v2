# Hợp đồng vòng đời chiến đấu

Đối chiếu engine ngày **04/11/2026**, gồm bản sửa Cerise mất lượt vì choáng đang có trong working tree. Đây là contract cho thiết kế, triển khai và review; không phải yêu cầu refactor engine hoặc tự sửa cân bằng. Nếu code và quyết định đã duyệt khác nhau, ghi sai lệch và bổ sung kiểm chứng; không đổi mô tả để hợp thức hóa bug.

Đọc cùng [ENGINE_RULES](ENGINE_RULES.md), [EXTRA_TURNS_AND_RECRUITS](EXTRA_TURNS_AND_RECRUITS.md), [DEVELOPMENT_WORKFLOW](DEVELOPMENT_WORKFLOW.md). Tên hàm dưới đây là bản đồ source hiện tại, không phải API bảo đảm tồn tại mãi.

## 1. Đơn vị thời gian không được dùng lẫn

| Khái niệm | Nghĩa trong engine |
| --- | --- |
| Vòng | Một `battle.round`, gồm pha `main` và pha `extra` nếu có, rồi kết toán cuối vòng một lần |
| Lượt của đơn vị | Một cơ hội hành động đến người đó; vẫn là lượt nếu bị choáng và bỏ hành động |
| Lượt chính | Lượt ở pha `main`; không tính Lượt Thêm ở pha `extra` |
| Lượt Thêm | Quyền vào hàng đợi pha `extra`; không chen ngay vào hàng chính, tối đa một/người/vòng |
| Hành động / lần thi triển | Một lệnh được giải; có thể có nhiều hit, nhiều mục tiêu và phản ứng chen vào |
| Hành động thành công | Lệnh vượt kiểm tra và thực sự được thi triển; khác với bị bỏ lượt hoặc lệnh bị từ chối |
| Hit / lần trúng | Một bước damage của hành động; không phải lượt hoặc lần thi triển riêng |
| Phản ứng / đòn tự động | Counter, FuA, xung triệu hồi… có context riêng nhưng không tự cấp một lượt mới |
| Encounter / phòng / phase | Ranh giới nội dung, không tự đồng nghĩa kết thúc vòng hoặc kết thúc chuyến |

`actionCount`, số damage event, số lượt xuất hiện trong log và thời gian animation **không phải đồng hồ thay thế**. Hiện `actionCount` còn tăng ở nhánh choáng/vận sức; boss có nhiều move trong một lượt.

## 2. Hợp đồng bắt buộc khi thêm cơ chế

Trước khi viết handler, điền các mục sau trong tài liệu chuyên đề hoặc mô tả thay đổi. Đây là bảng quyết định thiết kế, **không phải các field JSON mới để tự thêm vào data**.

| Mục phải chốt | Câu hỏi |
| --- | --- |
| Đơn vị và chủ đồng hồ | Vòng, lượt chính, mọi lượt, lần thi triển, hit hay charge? Của nguồn hay mục tiêu? |
| Điểm bắt đầu | Khi cast, khi thực sự trúng/áp dụng, đầu vòng sau, hay khi rời mode? |
| Lần đầu và thời điểm giảm | Có tính lượt/vòng tạo hiệu ứng? Giảm đầu hay cuối mốc? Hiệu quả còn áp dụng cho hit cuối trước khi hết không? |
| Bỏ lượt / Lượt Thêm | Choáng có giảm? Pha extra có giảm? Người đã gục không tới lượt xử lý theo cách nào? |
| Lệnh thất bại / không có tác dụng | Thiếu MP, target sai, bị từ chối, đánh hụt, khiên/buff không áp được thì tiêu gì? |
| Phản ứng / nhiều move | Có kích từ phản ứng không? Một skill nhiều hit/boss nhiều move tiêu một hay nhiều lần? |
| Làm mới và thay thế | Refresh, cộng stack, thay loại hay bỏ qua? Snapshot hệ số cũ có bị thay không? |
| Kết thúc | Hết hạn, dispel/cleanse, chủ gục, tài nguyên0, thắng/thua: có exit/refund/cleanup nào? Bao nhiêu lần? |
| Carry / lưu | Qua wave, phase boss, encounter Chronicle, reload và trận mới giữ/xóa gì? |
| Điểm cập nhật và chống lặp | Hàm/nhánh nào sở hữu việc tick/reserve/settle? Cách tránh tick hoặc refund hai lần? |

Không tự hiểu “3 lượt” là “3 lần cast”. Nếu tài liệu không đủ xác định đồng hồ, ghi điểm chưa chốt và làm rõ trước khi chọn hành vi. Giữ contract cũ đã duyệt; không áp mặc định mới lên mọi status/mode.

## 3. Các đồng hồ đang có

| Loại hiện hành | Nơi cập nhật | Điều phải giữ |
| --- | --- | --- |
| Status không khai `durationClock` | `finishStatuses` | Giảm theo lượt thực tế đủ điều kiện, gồm lượt phụ; nhánh choáng cũng gọi. Không thay bằng luật main_turn |
| Status `main_turn` | `finishStatuses`, bỏ tick ở `phase=extra` | Bỏ lượt chính vì choáng vẫn tính; lượt phụ không giảm thời hạn |
| Status `round` | `expireRoundEffects` | Deadline `expiresAfterRound`; kiểm tra đầu/cuối vòng, không tick lại tại cuối mỗi lượt |
| Độc / DoT | `beginTurn` | Tick và giảm remaining trước hồi phục; không giảm thêm ở `finishStatuses`. Hiện chạy ở lượt thực tế, kể cả extra, trước khi xét choáng |
| Status persistent / charges | `applyStatus` và hook tiêu tương ứng | Không giảm thời gian nếu persistent/remaining=null. Tiêu charge theo điều kiện riêng, không theo lượt tự động |
| Damage buff `damageUses` | `captureDamageBuffs` / `settleDamageBuffs` | Một charge mỗi hành động có direct damage hợp lệ, không mỗi hit/địch. Buff yếu vẫn tiêu nếu thuộc tập đủ điều kiện |
| CD kỹ năng | Gán khi thi triển hoặc mode exit; giảm ở `startRound` | CD2 cast ởR khóaR+1/R+2, dùng lạiR+3. Lượt Thêm không giảm CD |
| CD gear / proc theo vòng | `gear-effects.js` | Ready tại `R + cooldownRounds`; khác quy ước CD kỹ năng. Chỉ reserve/tiêu khi điều kiện kích hoạt thỏa theo hook |
| Mode `rounds` | `enterCombatMode` / `checkCombatMode` | Deadline vòng, tính vòng gọi; không gia hạn do nhiều lượt hoặc chuyển phòng |
| Mode `turns` | `spendModeTurn` và exit check | Mọi lượt của chủ, kể cả lượt gọi, lượt phụ và choáng; không giảm khi người khác hành động |
| Mode tài nguyên | `checkCombatMode` | Theo `resource`/`team_resource` và reason được khai báo; không tự đổi thành CD hay deadline vòng |
| Trường / companion / Oán Hận | Module riêng | Deadline/hook riêng; không gọi tick status để mô phỏng chúng |

`finishStatuses` chỉ xử lý các instance thuộc `oldStatuses` đã chụp. Instance mới hoặc refresh được `applyStatus` thay thế trong chính hành động không bị trừ ngay như instance cũ. Đừng đổi sang so mỗi ID mà không kiểm tra lại hành vi refresh.

### Hồi sinh và Che chắn (không dùng đồng hồ riêng)

- Effect `revive` chạy ngay khi effect được giải; không có clock, không thêm lượt. Người đã gục được đặt lại HP/MP đầy và không nằm trong queue của vòng đang diễn ra — queue vòng kế mới dựng lại theo `startRound`. Status mang `healingDebt` (Kế Ước Thế Chấp) bị xóa và nợ HP được trả sạch; status `healingReceivedReduction` (Vết Thương Sâu) **được giữ lại** nhưng lần hồi sinh vẫn đưa HP về 100% vì lượng hồi được thiết kế đủ lớn. Người đã gục mất các status khác; người còn sống giữ debuff không thuộc hai loại trên. Cooldown của kỹ năng hồi sinh đi theo bảng CD kỹ năng ở trên.
- Khi gục, engine chỉ xóa **Kế Ước Thế Chấp cùng nợ HP** (`clearLifeDebt`), đóng `combatMode`/formula và giữ cooldown; **buff/debuff khác không bị xóa**, vẫn nằm trên status của người gục. Việc dọn hoàn toàn do effect hồi sinh quyết định (hiện giữ Vết Thương Sâu, xóa phần còn lại).
- Che chắn đổi mục tiêu tại `resolveHit`, không tạo hành động mới. `cover` chỉ áp cho đòn đơn mục tiêu; `coverArea`/`coverReactions` mở thêm cho đòn diện rộng và phản ứng (Liên kích/phản công). `coverTeam` gắn status lên **chính người bảo hộ** và biến nó thành hào quang che cả đội: thời hạn trôi theo lượt chính của người bảo hộ (Vòng Phụ không trừ, lượt choáng Vòng Chính vẫn trừ), đồng đội hành động không ảnh hưởng. Nguồn Che chắn phải còn sống, và đòn nhắm chính người chắn không bị đổi; người bảo hộ gục thì hào quang tắt ngay.
- Giảm đòn Che chắn: hệ số `cover_guard` (nội tại) và giảm đòn Trấn Phái nhân riêng, chặn tổng ở 70%; không tính là status giảm sát thương nên không cộng vào trần 75% của `damageReduction`.

## 4. Bản đồ luồng thực thi

### Đầu vòng: `startRound`

Tăng round, vào main, khởi tạo quyền extra của vòng; kiểm tra giới hạn vòng; xử lý hết hạn trường/các hiệu ứng vòng, gear và summon đầu vòng; kiểm tra kết quả. Sau đó tạo queue theo đơn vị còn sống/SPD, giảm cooldown kỹ năng, vào `beginTurn`.

Không reset các limiter/resource tùy tiện khi vào extra hoặc đổi phase boss. Hạn mức mỗi vòng phải cùng nhìn một `battle.round`.

### Đầu lượt: `beginTurn`

Kiểm tra mode đầu lượt; đánh dấu extra đã dùng nếu có. DoT chạy trước regen/hồi phục và trước kiểm tra choáng. Nếu DoT làm chủ gục, xử lý trạng thái sống/chết và chuyển tiếp; không hồi sinh bằng regen phía sau. Gear/nội tại/regen và đòn tự động đầu lượt có điều kiện riêng, có thể vẫn chạy trước khi lượt chủ động bị choáng.

**Choáng chặn hành động chủ động, không mặc định tắt mọi nội tại.** Không đưa việc trừ toàn bộ thời hạn lên đầu lượt để “tiện bắt choáng”, vì có thể làm hiệu ứng biến mất trước mốc cần hưởng.

### Hành động thường: `executeAction` → `resolveAction`

Kiểm tra quyền lệnh, MP/tài nguyên/CD và target trước chi phí. Giải effect/hit, context, gear, status và các phản ứng theo thứ tự hiện hữu; cuối hành động có `spendModeTurn` rồi kiểm tra mode. Khi `endTurn=true`, chạy passive cuối lượt và `advance`.

Nhánh hợp lệ này không bao phủ mọi lượt. Lệnh bị từ chối không tự chuyển queue/tick thời hạn; nếu muốn thêm cơ chế xử phạt lệnh lỗi phải được thiết kế riêng.

### Choáng mất lượt: nhánh `skipTurn` trong `beginTurn`

Hiện gọi `finishStatuses`, tăng actionCount, `spendModeTurn`, kiểm tra mode, passive cuối lượt rồi `advance`. Không có cast/MP/lựa chọn của người chơi. Nhánh này phải được đối chiếu với cuối lượt hành động thường khi thêm cơ chế đếm lượt.

Bản sửa Cerise hiện đã bổ sung tick mode tại đây. Không ghi lỗi cũ thành hành vi dự định hoặc xóa nhánh chỉ vì không đi qua `executeAction`.

### Boss nhiều move, vận sức và forecast

- `executeBossTurn` gọi `resolveAction({endTurn:false})` cho từng move rồi tự kết thúc lượt ngoài vòng lặp. Nhiều move vẫn là một lượt boss.
- Enemy có `windup` có nhánh đặt `preparedMove` và tự gọi status/passive/advance, không nhất thiết đi qua resolveAction ngay ở lần vận sức.
- `forecastBattleAction` cũng gọi `resolveAction({endTurn:false})`, nhưng trên trial clone; không được tiêu clock, RNG, limiter hoặc reward của trận thật.
- Counter/FuA/xung summon thường gọi hit/applyEffect/context riêng, không gọi một lượt chủ động mới.

**Engine hiện chưa có một `finishTurn` chung** cho mọi nhánh. `endTurn:false` không đủ để kết luận “không có effect”, và `resolveAction` không đủ để kết luận “vừa hết một lượt”. Hook `spendModeTurn` hiện vẫn nằm trong resolveAction; nếu tái dùng mode-turn cho boss nhiều move phải kiểm chứng không tiêu mỗi move. Tài liệu này không tuyên bố trường hợp đó đã được triển khai hoặc kiểm thử.

### Chuyển tiếp và kết thúc

`advance` kiểm tra kết quả, đi qua các ô gục bằng `isAlive`, rồi gọi beginTurn hoặc finishPhase. Hết main có quyền extra thì tạo hàng extra, kể cả trường hợp quyền đã cấp nhưng người nhận đều gục; cuối vòng kết toán sau toàn bộ extra.

`finishMainRound` có guard `endOfRoundResolvedRound`, chạy summon cuối vòng/expiry/mode, nội tại cuối vòng và hết hạn các trường/trạng thái vòng rồi mới vòng sau. Giữ thứ tự cụ thể trong source khi thêm hook; không coi hết main là đã hết vòng.

Khi kết quả thật đã chốt, không chạy thêm vòng/lượt tương lai để hồi MP hoặc trả thưởng. Mode/refund/cleanup đi qua `checkCombatMode`/`leaveCombatMode`; phải idempotent. Victory giữa chuyến và boss đổi phase không tự là kết thúc trận thật. UI/VFX hoàn thành muộn không được kích cleanup gameplay lần nữa.

## 5. Ma trận nghiệm thu theo trường hợp

Với cơ chế mới, chọn các dòng liên quan và ghi expected trước khi chạy test. Dòng không áp dụng cần lý do; không bắt mọi sửa copy/CSS chạy toàn ma trận.

| Trường hợp | Câu hỏi phải xác nhận |
| --- | --- |
| Tự tạo hiệu ứng trong lượt | Lượt tạo có tính không; thời điểm hết có đúng không? |
| Đồng đội cấp trước lượt / hết lượt mục tiêu rồi mới cấp | Mốc đầu khác nhau thế nào; dùng clock nguồn hay người nhận? |
| Choáng ở main / choáng ở extra | Có tick và exit đúng một lần theo clock, kể cả remaining cuối cùng? |
| Được cấp Lượt Thêm khi đang active | Có tính theo clock đã chọn; không giảm CD vòng thêm lần nữa? |
| Chỉ Phòng thủ / đánh thường / kỹ năng | Clock có phụ thuộc sai vào một loại lệnh? |
| Lệnh thiếu MP / sai target / đang CD | Không mất tiền/tài nguyên/thời hạn hoặc chuyển lượt ngoài thiết kế? |
| Né / khiên chặn / damage0 / áp buff bị chặn | Có tiêu charge, hạn mức hay tạo resource theo điều kiện thực tế? |
| Nhiều hit / AoE / lan / random | Đúng số lần trên mỗi cast, mục tiêu và hit; không tick lượt theo damage event? |
| Counter / FuA / pulse đầu-cuối vòng | Không sinh lượt giả hoặc đệ quy; quota được reserve đúng lúc? |
| Boss nhiều move / chỉ vận sức | Số hành động không bị nhầm thành số lượt; đường không cast vẫn được rà soát? |
| Gục vì DoT đầu lượt / gục trước lượt / Oán HậnHP0 | Không tick/hồi sai, không coi mọi HP0 là chết; cleanup đúng trạng thái? |
| Thắng từ phản ứng / đòn cuối vòng | Không chạy lượt hoặc kết toán tương lai sau outcome, không reward/exit hai lần? |
| Wave/phòng, boss phase, encounter Chronicle | Giữ/reset đúng từng loại nội dung; không khởi tạo lại hạn mức giữa một vòng? |
| Forecast / save fail / checkpoint reload | Trial không sửa live; rollback không mất timer/RNG, resume không tự tặng thời hạn? |
| PvP mirror và hai phe | Dùng actor ID, team và vị trí tương đối nguồn, không hardcode party? |

Lưu ý carry: dungeon/story wave giữ actor theo adapter; phase Miraebolis cùng battle; gặp combat mới trong phiên pháo đài chỉ mang HP/MP, status/CD mới. Chronicle có checkpoint state/RNG, khác Quest/dungeon thường chỉ ở RAM. Xem ENGINE_RULES để tránh gộp ba ranh giới.

## 6. Ví dụ chuẩn: Cerise3 lượt

Contract hiện tại: `lifetime:turns`, `durationTurns:3`; tính lượt thi triển, mọi lượt của Cerise kể cả extra/choáng; không tính phản ứng hoặc lượt người khác. Không có refund khi mode hết; gục/kết thúc thật dùng cleanup mode.

| Chuỗi kiểm tra | Kết quả mong đợi |
| --- | --- |
| Cerise vào dạng |3→2 sau lượt thi triển |
| Một đồng đội hoặc địch hành động | Vẫn2, trừ khi có cơ chế riêng tác động mode |
| Cerise bị choáng ở lượt kế |2→1 dù không cast |
| Lượt kế Cerise Phòng thủ |1→0 và exit đúng một lần |
| Thay lượt giữa bằng extra của Cerise | Cũng giảm một lần theo contract mọi lượt |
| Phản đòn của Cerise chen giữa lượt người khác | Không tiêu thêm lượt mode |

`test/cerise.test.js` hiện có test choáng qua `executeAction` của người trước → `advance` → `beginTurn` của Cerise; không chỉ gọi `spendModeTurn` trực tiếp. Test đó kiểm chứng nhánh đã sửa, **không chứng minh toàn bộ ma trận trên đã được bao phủ**.

## 7. Chuẩn test và review

Test unit của phép tính có thể gọi helper. Nhưng chứng minh lifecycle phải có ít nhất một test đi qua chuyển lượt/pha thực tế từ public entrypoint, tới nhánh mà bug có thể xảy ra. Có thể setup queue để cô lập ca, nhưng đừng gán remaining/round sau bước cần kiểm chứng hoặc tự gọi tick rồi assert đúng giá trị vừa gán.

Đối chiếu trước/sau: remaining/deadline, trạng thái active, số event exit/refund, MP/resource, queue/phase/round và outcome khi liên quan. Dùng RNG kiểm soát; không sửa save thật. `validateContent` trả mảng lỗi: kiểm tra mảng rỗng, không dùng doesNotThrow thay cho nội dung kết quả.

Reviewer phải trả lời: **các đường không cast đã được kiểm tra chưa; phần nào cập nhật đúng một lần; test có đi qua đường đó không?** Số test qua không thay cho câu trả lời. Nếu tách lifecycle sang helper chung sau này, kiểm tra từng call site cũ trước khi bỏ nhánh, không refactor toàn engine chỉ để đáp ứng mẫu tên hàm trong tài liệu.

## 8. Bản đồ source/test

| Chủ đề | Nơi đọc |
| --- | --- |
| Round/turn/skip/action/boss/forecast | [battle.js](../src/core/battle.js): startRound, beginTurn, resolveAction, finishStatuses, executeBossTurn, executeEnemyTurn, advance, finishPhase, finishMainRound |
| Mode enter/tick/exit | [combat-modes.js](../src/core/combat-modes.js), [combat-summons.js](../src/core/combat-summons.js), [summon-rules.js](../src/core/summon-rules.js) |
| Round status/shield deadline | [round-effects.js](../src/core/round-effects.js), [turn-order.js](../src/core/turn-order.js) |
| Charge và gear | [charged-buffs.js](../src/core/charged-buffs.js), [status-policies.js](../src/core/status-policies.js), [gear-effects.js](../src/core/gear-effects.js) |
| Sống/chết/Agony | [actor-life.js](../src/core/actor-life.js) |
| Wave/phiên/persistence | [dungeon.js](../src/core/dungeon.js), [story-waves.js](../src/core/story-waves.js), [chronicle-combat.js](../src/core/chronicle-combat.js), [game-context.tsx](../src/runtime/game-context.tsx) |
| Test khởi điểm | [cerise.test.js](../test/cerise.test.js), [extra-turn.test.js](../test/extra-turn.test.js), [summon.test.js](../test/summon.test.js), [recipient-statuses.test.js](../test/recipient-statuses.test.js) |

Những tên file này là điểm bắt đầu, không giới hạn coverage. Khi sửa contract hoặc call site, cập nhật trang này và chuyên đề chịu ảnh hưởng.


## Sinh Mệnh Thế Chấp

`life_mortgage` dùng lượng `debtHp`, không phải đồng hồ lượt hay stack. Hồi phục sau giảm hồi nhận thanh toán nợ trước khi giới hạn theo HP thiếu; chỉ phần HP thực tăng kích hook hồi HP. Choáng/Lượt Thêm không làm hết nợ. Gục hoặc kết thúc thật xóa nợ; victory tiếp wave/phòng và phase giữ nguyên. Snapshot/forecast lưu trong status instance. Xem [hợp đồng và test](LIFE_MORTGAGE.md).
