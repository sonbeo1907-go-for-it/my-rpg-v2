# Thêm nội dung

Nội dung được viết bằng JSON thuần, ID dùng chữ thường và dấu chấm, ví dụ `arthur.light_slash`. Tên hiển thị và mô tả có thể đổi mà không đổi ID.

## Hiển thị trong menu nhân vật

Menu tự đọc `characters.json`. Nhân vật cần `name`, `title`, `element`, `role`, chỉ số và kỹ năng như các definition hiện tại. Đặt `roleGroup` để lọc theo nhóm: `physical_dps`, `magical_dps`, `offensive_support`, `defensive_support`, `tank`, `fighter`. Đây là ID dùng cho lọc; `role` vẫn là tên chuyên môn hiển thị, ví dụ “DPS né / phản công”. Thiếu `roleGroup` vẫn xuất hiện khi chọn tất cả vai trò. `secondaryRoleGroups` là mảng nhóm phụ để người như Aurora xuất hiện trong cả bộ lọc hỗ trợ và DPS; `affiliation` hiển thị nguồn gốc và có thể tìm kiếm. Muốn thêm nhóm, cập nhật `ROLE_GROUPS` trong `src/core/content.js`.

Hệ số skill preview sinh từ `multiplier`, `perResource`, `perStack`, `flat`, `hits`, `penetration` và nội dung status. Không viết lại hệ số vào một bảng UI riêng. Skill dùng `perResource` với chi phí toàn bộ tài nguyên sẽ có thanh chỉnh từ `min` tới giới hạn tài nguyên nhân vật; `consumeStatus` + `perStack` lấy giới hạn từ `maxStacks` của status. Tăng giới hạn bằng upgrade sẽ cập nhật phạm vi preview.

## Nội tại liên kích và hồi MP

**Luật chung bắt buộc cho mọi nhân vật có follow-up:** chỉ kích hoạt từ đòn của đồng đội khác, không tự liên kích từ đòn của bản thân. Handler hiện tại và mọi handler bổ sung phải đi qua `canTriggerFollowUp` trong `src/core/follow-up.js`. Không tạo cờ dữ liệu để bỏ qua luật này. Đòn của bản thân cũng không tiêu hạn mức follow-up. Phản công sau khi né/nhận đòn là loại phản ứng riêng.

Ví dụ dữ liệu Aurora:

```json
{
  "type": "magic_followup_mp",
  "name": "Mạch sấm",
  "resource": "thunder_charge",
  "threshold": 2,
  "mpRestoreRatio": 0.2,
  "followUpAbility": "aurora.follow_up"
}
```

`resource` phải tồn tại trong definition nhân vật, ngưỡng không được lớn hơn giới hạn tài nguyên. `followUpAbility` tham chiếu kỹ năng có `activation: "passive"`, `target: "enemy"` và chỉ có damage ma pháp. Không đưa kỹ năng nội tại vào `abilities` chủ động; menu tự thêm thẻ preview từ tham chiếu này. `mpRestoreRatio` tính theo MP tối đa của từng người nhận. Engine xử lý một lần/vòng và kiểm tra tiêu stack đầu lượt; không dùng cooldown kỹ năng để mô phỏng hai quy tắc này.

## Thêm kỹ năng

Nhân vật có thể dùng nội tại `stat_boost` để tăng chỉ số chiến đấu vĩnh viễn, ví dụ Lisbeth:

```json
{
  "type": "stat_boost",
  "name": "Di sản khế ước",
  "modifiers": { "magic": 0.2 }
}
```

Giữ MAG gốc 42 trong `characters.json`; không ghi sẵn 50,4 rồi thêm nội tại +20%. Resolver, menu và battle engine sẽ dùng `effectiveStat` để áp dụng đúng một lần. Các key hiện hỗ trợ: `attack`, `magic`, `defense`, `resistance`, `speed`; chưa hỗ trợ nội tại tăng dung lượng HP/MP bằng loại này. Modifier vĩnh viễn và modifier status cộng tỷ lệ trên cùng chỉ số cơ bản. Nội tại này không tự hết hạn hoặc bị xóa bằng cleanse.

Thêm một phần tử vào `data/abilities.json`:

```json
{
  "id": "arthur.dawn_cut",
  "name": "Bình minh trảm",
  "description": "Một đòn vật lí Light xuyên một phần giáp.",
  "target": "enemy",
  "cost": { "mp": 8 },
  "cooldown": 1,
  "effects": [
    {
      "type": "damage",
      "damageType": "physical",
      "element": "light",
      "multiplier": 1.8,
      "penetration": 0.25
    }
  ]
}
```

Sau đó thêm ID vào `abilities` của nhân vật, hoặc trao qua upgrade. `description` chỉ hiển thị; gameplay đến từ các field hiệu ứng, không được tự suy ra từ văn bản.

### Mục tiêu

| Giá trị | Ý nghĩa |
|---|---|
| `enemy` | Một địch sống; chịu ràng buộc khiêu khích |
| `all_enemies` | Tất cả địch sống, bỏ qua khiêu khích |
| `ally` | Một người cùng đội, có thể là bản thân |
| `all_allies` | Cả đội còn sống, gồm người dùng |
| `self` | Bản thân |

Một effect có `to: "self"` tác động riêng người dùng, dù kỹ năng đang nhắm địch. Mặc định effect tác động lên nhóm mục tiêu của kỹ năng. Chưa hỗ trợ hồi sinh/nhắm người đã gục.

### Các effect hiện có

| Type | Field chính |
|---|---|
| `damage` | `damageType`, `element`, `multiplier`, `penetration`, `hits` |
| `heal` | `flat`, `multiplier` theo MAG gốc, `emergency` tăng hồi khi mục tiêu ≤35% HP |
| `shield` | `flat`, `multiplier` theo MAG gốc |
| `status` | `status`: ID trong statuses, `duration`: lượt của người mang; bỏ duration nếu status có `persistent: true` |
| `toggle_status` | Bật/tắt một status có `persistent: true`; có thể khai báo `linkedStatuses` để cấp các buff modifier đi kèm |
| `resource` | `resource`, `amount`; riêng `mp` còn hỗ trợ `maxMpRatio` (trên 0 đến 1), hồi theo MP tối đa của người nhận và làm tròn lên |
| `cleanse` | Xóa tất cả status có `kind: "debuff"` |

Damage có thể dùng `perResource` nhân với lượng tài nguyên vừa tiêu, hoặc `consumeStatus` + `perStack` để kích nổ dấu ấn trên từng mục tiêu. `lowHpBonus` tăng hệ số theo phần HP người dùng đã mất. `unavoidable` bỏ qua né.

Đòn vật lí có thể thêm `speedMultiplier` không âm: cộng hệ số này nhân SPD hiệu lực vào sát thương gốc, trước DEF/điểm yếu/buff sát thương. Phần này cộng với nội tại `speed_damage`, không thay thế nội tại và không nhân với `multiplier` ATK. Nhất thiểm dùng `multiplier: 0.7`, `speedMultiplier: 1`; với nội tại Benard `ratio: 0.5` cho tổng `70% ATK + 150% SPD`. Engine và preview dùng chung hàm tính phần cộng SPD.

### Chi phí tài nguyên

Tiêu lượng cố định:

```json
{ "cost": { "resource": { "id": "resonance", "amount": 1 } } }
```

Tiêu toàn bộ, cần ít nhất một điểm:

```json
{ "cost": { "resource": { "id": "resonance", "all": true, "min": 1 } } }
```

Tài nguyên phải được khai báo trong `resources` của nhân vật. Có thể kết hợp MP và tài nguyên trong cùng `cost`.

`cost.resource.consumeAt` nhận `before` (mặc định) hoặc `after`. Engine chốt số điểm dùng khi thi triển; `after` giữ chúng qua mọi effect để nội tại theo stack vẫn có hiệu lực, rồi trừ số đã dùng trước khi xét tích điểm sau đòn đánh. Trọng kích dùng `{"mp":10,"resource":{"id":"resolve","all":true,"min":1,"consumeAt":"after"}}`. Mọi kiểm tra chi phí/mục tiêu diễn ra trước khi thay đổi trạng thái.

Nội tại `resource_stat_boost` có `resource`, `stat` (ATK/MAG/DEF/RES/SPD theo ID nội bộ), `ratio` dương. Dain dùng `resource: "resolve", stat: "attack", ratio: 0.15`. `effectiveStat` lấy chỉ số nền gồm gear nhân `1 + ratio × số điểm + tỷ lệ buff/debuff`; không ghi giá trị tạm vào stats hoặc save. Preview Trọng kích dùng thanh giả định số điểm để hiện cả ATK từ nội tại.

## Thêm status

```json
{
  "id": "focused",
  "name": "Tập trung",
  "kind": "buff",
  "consumeOnAttack": true,
  "modifiers": { "damageBonus": 0.25 }
}
```

Các modifier đang hỗ trợ: `attack`, `magic`, `defense`, `resistance`, `speed`, `damageBonus`, `damageReduction`, `evasion`, `damageVsShielded`, `damageTakenBonus`. Các modifier chỉ số là tỷ lệ cộng, ví dụ `defense: -0.35` giảm DEF 35%.

`damageVsShielded: 1` nhân đôi sát thương hit nếu mục tiêu có khiên tại đầu hit. Hệ số này nhân riêng với buff `damageBonus`, áp dụng cả phần vào khiên và phần tràn HP; kiểm tra lại mỗi hit. `damageTakenBonus: 1` nhân đôi sát thương nhận sau phòng thủ, trước giảm sát thương/khiên; cũng áp dụng cho độc. Các giá trị mới phải hữu hạn và không âm. Không gắn điều kiện nhân vật cụ thể; có thể tái dùng status trên bất kỳ người nhận nào.

`persistent: true` cho phép bỏ duration để duy trì, battle state dùng remaining null. Nếu effect cấp duration nguyên dương, bản buff đó vẫn hết hạn theo duration. `expiresOnShieldGain: true` gỡ status khi nhận một khiên mới mạnh hơn khiên hiện có. `skipTurn: true` bỏ qua một lượt hành động của người mang, sau độc/hồi phục/nội tại đầu lượt, rồi giảm thời hạn trạng thái như một lượt không tấn công. Không cho status persistent vừa skipTurn hoặc damageOverTime để tránh khóa lượt vô hạn. UI ghi trạng thái duy trì/đòn kế tiếp thay vì hiển thị null.

Buff **Phá Thành** có ID `siegebreaker`, chỉ chứa `damageVsShielded: 1`, không chứa ATK của Gahallad. Ví dụ cấp độc lập: `{"type":"status","status":"siegebreaker","duration":2}`. Mode dùng `{"type":"toggle_status","status":"black_cavalry","linkedStatuses":["siegebreaker"]}`. Trạng thái chính giữ danh sách buff đi kèm; `activeStatuses` tổng hợp qua ID, không tạo trạng thái con cần dọn riêng. Khi mode tắt, buff đi kèm biến mất; bản độc lập nếu có vẫn giữ thời hạn, không nhân đôi modifier khi cùng tồn tại. Linked status phải là buff modifier persistent, không có trigger/consume/expiry riêng; trạng thái chính không có duration hoặc tiêu theo đòn đánh.

Nội tại `shield_break_attack_buff` khai báo `statusId` trỏ tới buff persistent, consumeOnAttack, có `modifiers.attackMultiplier` dương. Gahallad dùng `cavalry_momentum` với hệ số 2. Engine chốt multiplier ở đầu hành động, ghi nhận các lần chính người đánh làm vỡ khiên rồi cấp buff sau toàn bộ hành động. Đòn nhiều hit chỉ tạo lại một buff; một đòn vừa dùng buff cũ vừa phá khiên nhận buff mới cho lần sau. Hệ số nhân riêng với damageBonus, không cộng thành +100% vào cùng nhóm. Phản ứng có context riêng và tiêu multiplier một lần cho cả phản ứng; không đổi quy tắc của buff Công thức cường hóa cũ.

Nhện dùng nội tại `shield_break_status`, có `statuses: [{"id":"stunned","duration":1},{"id":"shell_exposed"}]`. Engine chỉ kích hoạt khi một hit thực sự hấp thụ khiên và làm khiên về 0, người mang còn sống. Hiệu ứng được gắn sau sát thương của hit phá khiên, trước liên kích. Status thường cần duration nguyên dương; status persistent không cần. Hồi khiên gỡ Vỡ kén nhưng không tự giải Choáng.

AI có thể khai báo `priorities: [{"abilityId":"enemy.spider_cocoon","when":"unshielded"}]` dưới `ai`. Hiện hỗ trợ điều kiện unshielded và kỹ năng tự tạo khiên; khi đủ MP/hết hồi chiêu, dùng trước bộ chọn đòn ngẫu nhiên thông thường. AI không bỏ qua choáng hoặc yêu cầu chi phí kỹ năng.

Các hành vi đặc biệt hiện có: `regen`, `taunt`, `cover`, `blockResourceGain`, `onDamagedResource`, `maxStacks`, `consumeOnAttack`. Chúng là khả năng engine đã biết xử lý; đặt một key mới vào JSON không tự tạo ra luật mới.

Status buff có `turnStartAbility: "gawain.cloud_pulse"` sẽ gọi một ability passive, target all_enemies, chỉ có damage, không cost/cooldown/windup. Status phải có duration hữu hạn; thời hạn giảm cuối hành động người mang, không giảm riêng khi tự đánh. Engine xử lý sau độc/hồi phục đầu lượt và trước choáng. Đòn tự động có context riêng, bỏ qua các buff consumeOnAttack và không làm mất lượt chủ động; vẫn dùng pipeline giáp, điểm yếu, khiên, vỡ khiên và phase. Người mang gục thì các status kiểu này bị xóa.

Nội tại `field_growth` tham chiếu `statusId`, `stat`, `ratio`, `maxStacks`. Ví dụ Gawain: storm_cloud, attack, 0.1, 2. Mỗi đầu lượt còn status, tăng `status.growth` đến trần rồi mới gây sát thương tự động. `effectiveStat` đọc growth từ status còn sống, nên khi status hết hoặc bị xóa bonus mất ngay, không giữ bộ đếm bên ngoài. Nội dung định nghĩa cloud và passive qua dữ liệu, không kiểm tra ID Gawain trong engine.

Status có thể khai báo `onAttackResource: {"resource":"resolve","chance":0.5,"amount":1}`. Khi người mang dùng hành động chủ động có damage, xét một lần sau mọi effect và chi phí tài nguyên trả sau, trước khi giảm thời hạn buff. Điểm nhận được không tăng sát thương của hành động vừa thi triển. Chỉ người còn sống được tích; kiểm tra trần và `blockResourceGain` qua helper chung. Không xét riêng trên từng hit, phản công hoặc liên kích. Cơ chế không yêu cầu đòn đánh trúng, nên hành động bị né vẫn được xét xác suất. Tài nguyên phải tồn tại trên người sử dụng; xác suất trên 0 đến 1, amount nguyên dương. Không thêm status này cho người khác nếu họ không có tài nguyên tương ứng.

## Nâng cấp Arthur qua cốt truyện

Mẫu đang hoạt động trong `data/upgrades.json`:

```json
{
  "id": "arthur.control_training",
  "characterId": "arthur",
  "name": "Kiểm soát Ogre’s Bane",
  "order": 10,
  "requires": { "storyFlag": "arthur_completed_sword_training" },
  "changes": [
    {
      "type": "replace_ability",
      "from": "arthur.ogres_bane",
      "to": "arthur.ogres_bane_controlled"
    },
    { "type": "unlock_ability", "ability": "arthur.partial_release" }
  ]
}
```

Trong quest/dialogue controller tương lai, gọi:

```js
import { completeStoryEvent } from './src/core/progression.js';

completeStoryEvent(campaign, content, 'arthur_completed_sword_training');
```

Đường dẫn import phụ thuộc vị trí module gọi. Hàm này chỉ nên được gọi từ hệ thống điều khiển tiến trình, sau khi sự kiện thật hoàn thành. Nút ở màn thử đang đóng vai trò đó.

Các thao tác nâng cấp hiện hỗ trợ:

- `unlock_ability`: thêm kỹ năng nếu chưa có.
- `replace_ability`: thay ID kỹ năng cũ bằng ID mới.
- `resource_max`: đổi giới hạn tài nguyên, ví dụ `{ "type": "resource_max", "resource": "resonance", "max": 4 }`.

Nếu một upgrade thay kỹ năng do upgrade trước mở, tác giả phải bảo đảm sự kiện trước đã xảy ra và đặt `order` phù hợp. Hiện chưa có cây dependency nâng cấp tự động. Chưa có operation đổi class, nguyên tố, nội tại hay tăng stat qua upgrade; thêm handler và validation tương ứng nếu cần, không chỉ ghi field mới.

## Thêm cuộc chạm trán

Tạo definition trong `enemies.json`, sau đó tham chiếu ID trong `encounters.json`. Có thể lặp ID địch nhiều lần; engine tạo instance riêng cho mỗi con.

Siêu trùm có kịch bản dùng `boss.type: "three_phase_dragon"`, metadata ba phase với ngưỡng HP, số hành động, rotation và suppression. Đây là handler riêng, chưa phải máy trạng thái tùy ý. Encounter loại này phải có đúng một địch. Khai báo chiêu vận sức bằng `windup: {"rounds":1,"message":"..."}`; `bossHeavy: true` tránh xếp hai chiêu lớn cùng lượt. Xem [Miraebolis](MIRAEBOLIS.md) trước khi thêm hoặc đổi loại boss; thêm key JSON không tự tạo cơ chế mới.

Khai báo điểm yếu có sẵn bằng `weaknesses`, ví dụ:

```json
{ "weaknesses": ["light", "dark"] }
```

Khi nguyên tố đòn đánh trùng một phần tử, mục tiêu nhận thêm 50% sát thương (hệ số `1.5`), áp dụng cả vật lí và ma pháp, kể cả sát thương vào khiên. Hệ số chung là `WEAKNESS_MULTIPLIER` trong `src/core/content.js`. Không có hoặc dùng `[]` nghĩa là không có điểm yếu. Chỉ dùng 8 ID nguyên tố đã hỗ trợ, không lặp. Goblin khai báo cả 8 ID, gồm `plain`, để yếu với tất cả hệ.

`resistances` vẫn có thể đặt trên enemy để nhân thêm hệ số sát thương nhận: `0.7` nhận 70%, mặc định `1`. Nếu cùng một hệ có cả kháng và yếu, hai hệ số nhân nhau, ví dụ `0.7 × 1.5 = 1.05`; không khai báo kháng cũ nếu muốn đúng 150%. Ba loại địch mẫu đã bỏ các hệ số cũ Fire/Thunder/Wind. Không có quan hệ Fire–Water cố định được ngầm áp dụng.

Điểm yếu theo loại sát thương dùng `damageTypeWeaknesses: ["magical"]` hoặc `["physical"]`, có thể gồm cả hai nếu cần. Đây là thuộc tính của đòn, độc lập nguyên tố. Một phi long yếu ma pháp sẽ nhận thêm 50% từ mọi đòn phép, gồm Thường/Quang/Ám, nhưng không từ đòn vật lí cùng hệ. Nếu khớp cả `weaknesses` và `damageTypeWeaknesses`, chỉ nhân `1.5` một lần, không nhân thành `2.25`. Áp dụng chung cho đánh thường, kỹ năng, diện rộng, nhiều nhát, phản công và liên kích. Hai danh sách chỉ nhận ID hợp lệ, không trùng; thiếu hoặc `[]` nghĩa là không có điểm yếu thuộc loại đó. Điểm yếu không bỏ qua DEF/RES.

`ELEMENT_NAMES`/`DAMAGE_TYPE_NAMES` trong `content.js` là tên tiếng Việt để hiển thị trên khung chiến đấu và nhật ký. ID tiếng Anh trong JSON giữ ổn định để tương thích save và tham chiếu nội dung.

## Kinh tế và banner

- `economy.json` chứa bản ghi `default`: sáu starter, thưởng thắng, giá quay 1/10, mảnh trùng, giá đổi nhân vật và `gearStats`. Giá/thưởng là số nguyên dương; mỗi chỉ số có scale quy đổi điểm.
- `gearTypes.json` định nghĩa `points` và `statCount`; hai chỉ số của gear đa dụng phải khác nhau. Giá trị đã roll được lưu trong instance; thay đổi công thức điểm/scale cần migration gear cũ vì validator kiểm tra giá trị theo định nghĩa hiện tại.
- `banners.json` khai báo pool nhân vật rõ ràng, không trùng ID và không gồm starter; nhân vật trong pool có trọng số bằng nhau. `gearWeight`/`characterWeight` chọn nhánh; `gearRates` chọn tier có điều kiện khi nhánh gear trúng. Trọng số là số nguyên dương, không bắt buộc tổng 100. Nhân vật mới không tự được thêm vào pool.
- Không dùng bản sao nhân vật để tăng chỉ số. Trùng cộng mảnh; chỉ mở nhân vật còn khóa trong pool khi đổi đủ mảnh.
- Mở thêm nhân vật bằng truyện về sau có thể gọi `unlockCharacter(campaign, content, id)`; hàm không cấp trùng quyền sở hữu. Preview không đồng nghĩa đã sở hữu.
- Kiểm tra cả định nghĩa và save khi đổi kinh tế; ID hoặc giá trị gear đã tồn tại cần migration tương ứng.
- Save v3: `campaign.equipment` ánh xạ character ID → mảng gear ID/null giữ vị trí từng ô. `extraGearSlots` ánh xạ character ID → số ô mở thêm (0–3). `baseGearSlots`/`maxGearSlots` trong economy mặc định 3/6. Mỗi dupe mở 1 ô cho chính nhân vật đó đến trần, vẫn cộng mảnh. Dùng `equipGear`/`unequipGear` với `slot` (index 0-based, mặc định 0) và commit sau khi lưu. Một instance không thể xuất hiện ở nhiều ô; chưa có giới hạn nghề/nguyên tố.
- Gear cộng flat trước nội tại và buff %. Nếu thêm loại chỉ số gear mới, cập nhật validator, resolver và bảng so sánh; không thêm modifier vào dữ liệu nhân vật mỗi lần equip. Không sửa trực tiếp actor của trận đang diễn ra.

## Quy trình sửa nội dung

Nhạc trận khai báo bằng `encounter.bgm`: `normal`, `boss` hoặc `wyvern`, mặc định `normal` khi bỏ trống. Nhóm nằm trong `data/music.json`, mỗi nhóm có `tracks` là mảng đường dẫn `/bgm/tên_file.mp3` cục bộ, không rỗng/trùng. Tên file dùng chữ Latin, số, `_` hoặc `-`. Trận thường có hai bài được chọn đều một lần khi bắt đầu; các nhóm boss có một bài. Có thể thêm nhóm mới qua dữ liệu mà không kiểm tra tên encounter trong runtime. Thay `bgm` không đổi chỉ số hoặc phần thưởng của màn.

Nhóm `victory` dùng `/bgm/victory.mp3`, `loop: false` để phát một lần khi thắng. `loop` là boolean tùy chọn, mặc định true cho nhạc trận. Nhóm chiến thắng được chọn theo kết quả trận, không gán vào `encounter.bgm`. Trạng thái đã phát xong giữ riêng trong phiên để không phát lại khi xem kết quả. Màn `alice_superboss` dùng nhóm `alice` → `/bgm/spboss_alice.mp3`, phát lặp theo mặc định.

Hai cơ chế thêm:

- Nội tại `speed_damage` có `ratio` dương, hiện Benard dùng `0.5`. Cộng `ratio × SPD hiệu lực` vào mỗi hit vật lí trước DEF và các hệ số, kể cả đánh thường. Dùng `speedDamageBonus` cho cả preview và engine.
- Status debuff `damageOverTime` có `flat`, `scalingStat` (`attack` hoặc `magic`) và `multiplier`. Khi effect status áp dụng, snapshot `round(flat + stat × multiplier)` (ít nhất 1) vào potency. Duration là số lần đầu lượt còn tick; không tái dùng duration của buff thông thường cho tick cuối lượt.

Encounter có `firstClearRewards: [{"type":"character","characterId":"kai"},{"type":"duplicate","characterId":"arthur"}]`. ID phải tồn tại; danh sách có thể bỏ qua cho màn chỉ thưởng coin. Không lưu cờ nhận trong definition: dùng ledger campaign và `claimBattleReward` để nhận một lần, tự lưu cùng mọi thay đổi. Nếu bản nhân vật đã sở hữu, vẫn xử lý là dupe theo helper chung. Muốn thưởng kiểu khác phải thêm handler/validator rõ ràng.

Thưởng nâng cấp dùng `{"type":"upgrade","upgradeId":"arthur.control_training"}`. Handler đọc story flag từ định nghĩa upgrade rồi gọi `completeStoryEvent` dùng chung trong `story-events.js`, không sửa ability trực tiếp hoặc viết điều kiện tên màn vào engine. Màn `ogre_trial` cấp nâng cấp này thay nút luyện kiếm cũ. Save đã có upgrade giữ nguyên; ledger đã nhận upgrade phải khớp tiến trình nhân vật khi Import/Load.

1. Sửa JSON, giữ ID ổn định.
2. Chạy `npm.cmd run validate` để kiểm tra tham chiếu và cấu trúc được hỗ trợ.
3. Nếu thay luật core, chạy `npm.cmd test`, thêm kiểm thử cho hành vi mới.
4. Tải lại trang để đọc dữ liệu mới; bắt đầu trận mới để tạo snapshot mới.
5. Thử kỹ năng với mục tiêu ít HP, hết MP, khiên, đỡ đòn thay và địch nhiều mục tiêu nếu có liên quan.

Validator hiện là kiểm tra bằng code, chưa phải JSON Schema đầy đủ hoặc editor nội dung. Thêm cơ chế mới cần cập nhật đồng thời handler, validator và tài liệu.

## Bonus gia tộc và miễn nhiễm hiệu ứng

`tags: ["valmont"]` xác định thành viên gia tộc; không suy ra từ tên hoặc `affiliation`. Các gia tộc khác có thể dùng tag riêng với cùng handler:

```json
{"type":"team_flat_self","name":"Truyền thừa Valmont","tag":"valmont","excludeSelf":true,"modifiers":{"magic":2}}
```

`team_flat_self` cộng cho bản thân theo số người đúng tag; `excludeSelf` là boolean bắt buộc. `team_flat_aura` cộng cho mọi người đúng tag theo số thành viên tag trong đội; `countSelf` là boolean bắt buộc. Ví dụ Lyon dùng `countSelf: true`, `modifiers: {"defense":1,"resistance":1}`. Chỉ hỗ trợ số nguyên dương trên attack/magic/defense/resistance/speed. Bonus được tính flat cùng gear trước modifier %, không lưu vào save.

`{"type":"end_turn_mp_regen","name":"Hậu cần gia tộc","ratio":0.02,"tag":"valmont","tagMultiplier":2}` hồi MP cuối lượt nguồn cho đồng đội còn sống; đúng tag nhận gấp đôi. Tỷ lệ hữu hạn, dương, tích ratio × multiplier không vượt 1; làm tròn lên và chặn ở MP tối đa.

Effect heal/shield nhận `scalingStat` tùy chọn: attack/magic/defense/resistance, mặc định magic để tương thích nội dung cũ. Ví dụ khiên Lyon: `{"type":"shield","scalingStat":"defense","multiplier":1.5}`; hồi Cedric: `{"type":"heal","scalingStat":"attack","flat":8,"multiplier":1}`. Trận tính cả buff/debuff chỉ số, preview tính chỉ số chuẩn bị.

Đánh thường tùy biến dùng `character.basicAttack`: mảng không rỗng các effect damage gồm đúng `type`, `damageType`, `element`, `multiplier` dương. Ví dụ Seraphine dùng một phần physical Plain 0.6 và một phần magical Plain 0.6. `basicAbility` dùng dữ liệu này cho cả preview và trận, không cần kiểm tra ID nhân vật; bỏ trường này để giữ đòn cơ bản cũ. Kỹ năng lai dùng hai effect damage tương ứng trong `abilities.json`. Mỗi phần qua DEF hoặc RES theo damageType, cùng chung một action context, MP/cooldown và lượt hành động. Preview và nhật ký phân biệt hai loại sát thương.

Status buff tái sử dụng: `{"id":"effect_ward","name":"Hộ ấn","kind":"buff","persistent":true,"effectImmunity":{"charges":1,"hostileOnly":true}}`. Gắn bằng effect status thông thường; không gắn qua linkedStatuses. Charges là số nguyên dương. Mỗi debuff mới bị chặn tiêu một charge, dùng lại làm mới chứ không cộng, không cleanse; `hostileOnly` giữ lại hình phạt tự gây. Không cần nhánh riêng theo nhân vật hoặc loại debuff.
