# Flammelapis — Người giữ kiếm cổ

> **Ghi chú phiên bản:** nhân vật mới, triển khai 04/11/2026 theo yêu cầu thiết kế. Số liệu là bản đầu tiên cần playtest, không phải kết luận cân bằng. Luật chung ở [ENGINE_RULES](ENGINE_RULES.md), vòng đời ở [COMBAT_LIFECYCLE_CONTRACT](COMBAT_LIFECYCLE_CONTRACT.md); thông số thô lấy từ JSON.

## Định danh

Thành viên **Hội Thợ Săn**, chuyên khảo sát kiếm cổ. Trong dữ liệu: `affiliation: "hunters_guild"`, tag nhóm `hunter_guild`. Slug phe và nhãn hiển thị theo [AFFILIATIONS](AFFILIATIONS.md).

## Chỉ số thô

Water / physical_dps · HP172 / MP95 / ATK36 / MAG9 / DEF15 / RES16 / SPD19.

MP 95 là mức trung bình-cao để duy trì 3 kỹ năng đều dưới 15 MP; ATK 36 tương đương nhóm DPS vật lí hiện có. SPD 19: không phải đơn vị mở màn.

## Kỹ năng

| Kỹ năng | MP / CD | Hiệu ứng |
| --- | --- | --- |
| Trảm Thủy `flammelapis.slash` | 10 / không CD | Đơn mục tiêu 150% ATK Thủy, vật lí |
| Kiếm Ấn Phá Thành `flammelapis.edict` | 8 / không CD | Một đồng đội nhận **Phá Thành** 2 lượt |
| Triều Kiếm Bạo Phá `flammelapis.tidebreak` | 15 / CD2 | Mục tiêu chính 260% ATK, hai ô kề 150% ATK, Thủy; mỗi mục tiêu trúng nhận **Rạn Khiên 3 lượt chính** |

Damage Rank ×1,1 mỗi Rank. Kiếm Ấn dùng `growthProfile: output_buff_mp`: Rank **giảm MP** (8 → 6 MP ở Rank 5 theo làm tròn engine) chứ không tăng hiệu lực buff — đúng quy tắc output buff trong [SKILL_RANKS](SKILL_RANKS.md).

Phá Thành (`siegebreaker`) là buff persistent có sẵn của dữ liệu, `+100% sát thương lên mục tiêu còn khiên`; kỹ năng này chỉ **cấp thời hạn 2 lượt**, không tạo status mới.

Rạn Khiên (`shield_fracture`) là debuff có sẵn: giảm **35%** lượng khiên mới nhận, `durationClock: main_turn` nên đếm **lượt chính của người trúng** — Lượt Thêm không làm giảm thời hạn. Triều Kiếm gắn 3 lượt cho **mọi mục tiêu bị đánh trúng** (mục tiêu chính và hai ô kề), không riêng mục tiêu chính; gắn lại làm mới thời hạn, không cộng tầng. Đòn vào khiên vẫn tính là trúng nên vẫn gắn Rạn Khiên.

`target: "ally"` theo quy ước engine **gồm cả bản thân** (giống các kỹ năng hồi máu đồng đội). Muốn loại trừ bản thân cần thêm `excludeSelf` và kiểm lại danh sách mục tiêu trên UI; hiện chưa làm.

## Nội tại · Cổ Kiếm Thức Tỉnh

`type: enemy_shield_mode`, `modeId: ancient_sword`.

Mỗi **vòng** một lần: khi một kẻ địch dùng kỹ năng **chủ động có chứa hiệu ứng tạo khiên**, Flammelapis vào dạng **Cổ Kiếm Phá Thành** 2 lượt.

Hợp đồng vòng đời (theo mục 2 của [COMBAT_LIFECYCLE_CONTRACT](COMBAT_LIFECYCLE_CONTRACT.md)):

| Mục | Quyết định |
| --- | --- |
| Đơn vị / chủ đồng hồ | Mode đếm **lượt của Flammelapis** (`lifetime: turns`, `durationTurns: 2`). Phá Thành đếm theo lượt của **người nhận** (clock mặc định của status) |
| Điểm bắt đầu | Sau khi kỹ năng địch được giải xong (`resolveAction`), xét **danh sách effect của kỹ năng** có `type: "shield"` hay không. Không phụ thuộc kết quả: khiên yếu hơn khiên cũ, khiên bị Oán Hận/từ chối, hay mục tiêu đã đầy khiên đều vẫn kích hoạt |
| Lần đầu / thời điểm giảm | Vào dạng giữa lượt địch nên chưa tiêu lượt nào; lượt Flammelapis kế tiếp là lượt thứ nhất. Mode trừ ở `spendModeTurn` cuối lượt cô; Phá Thành trừ ở `finishStatuses` cùng mốc nên hai bên hết cùng lúc |
| Bỏ lượt / Lượt Thêm | Lượt bị choáng vẫn gọi `finishStatuses` + `spendModeTurn`, nên vẫn tính. Lượt Thêm của chính cô cũng tính. Không trừ khi đồng đội/địch hành động |
| Lệnh thất bại | Không kích: lệnh bị từ chối (thiếu MP, sai target, đang CD) không vào `resolveAction` nên không tiêu hạn mức. Kỹ năng đã thi triển mà khiên không áp được vẫn tính |
| Phản ứng / nhiều move | Chỉ kỹ năng chủ động: bỏ qua `$defend`, `$attack`, kỹ năng `activation: passive`, phản công/Liên kích và đòn tự động. Boss nhiều move có nhiều lần thi triển trong cùng vòng vẫn chỉ một lần nhờ `procAvailable`/`markProc` theo `battle.round` |
| Làm mới / thay thế | Đang ở dạng thì bỏ qua (không refresh, không cộng dồn). Rời dạng rồi mới có thể vào lại ở vòng khác. Kiếm Ấn làm mới thời hạn Phá Thành, không cộng tầng |
| Kết thúc | Hết 2 lượt → `leaveCombatMode` + hết hạn Phá Thành; không hồi MP, không refund. Gục hoặc kết thúc trận đi qua cleanup mode |
| Carry / lưu | Mode nằm trên actor như mode khác: giữ qua wave/phòng dungeon và phase boss trong cùng battle; trận mới đặt lại; Quest/dungeon thường không serialize battle |
| Điểm cập nhật / chống lặp | `battle.js::triggerShieldModeRouse` (gọi cuối `resolveAction`, sau khi effect chạy), hạn mức bằng `procRounds`; không có hook nào khác được ghi hạn mức |

Ghi chú phạm vi: chỉ effect `shield` **trực tiếp trong danh sách effect của kỹ năng** mới tính. Kỹ năng chỉ vào mode mà mode đó có `entryEffects` khiên (nếu sau này có) không được tính là "kỹ năng tạo khiên" theo luật này; hiện chưa có kỹ năng nào rơi vào trường hợp đó ngoài `drake.ward` vốn đã có effect khiên trực tiếp.

## Dạng · Cổ Kiếm Phá Thành

`lifetime: turns`, `durationTurns: 2`; `statModifiers: { attack: 0.35 }`; `entryEffects` cấp `siegebreaker` 2 lượt.

- +35% ATK và Phá Thành; không đổi nền/BGM (`presentationScope: none`), chưa có VFX riêng — phần nhận diện còn thiếu nếu muốn theo chuẩn lớp Thuật Sư.
- Được vào dạng ngoài lượt của mình nên "2 lượt" là hai cơ hội hành động kế tiếp, không phải hai vòng.
- Chỉ vào dạng khi **chưa** ở dạng; đang ở dạng thì bỏ qua tín hiệu mới.

## Chiêu Mộ

Đã có trong pool banner `standard` — "Tiếng gọi Prisma" (`data/banners.json`, 67 nhân vật), cùng tỉ lệ `characterWeight: 5` và pity `characterAt: 50` như phần còn lại. Không thêm vào pool nào khác vì dữ liệu chỉ có một banner.

## Phần chưa làm

- Chưa có VFX/background riêng cho dạng; hiện dùng trình bày chung của mode.
- AI Đấu Trường đã có profile (`setupAbilities` Kiếm Ấn, `burstAbilities` Triều Kiếm) nhưng chưa chạy playtest cân bằng.

## Kiểm chứng

`test/flammelapis.test.js` phủ: định danh/chỉ số, trần 15 MP và CD, kích cả khi khiên không mạnh hơn khiên cũ, kích từ kỹ năng khiên thật trong content, không kích từ kỹ năng sát thương hoặc khiên phe mình, hết dạng sau 2 lượt của cô, buff đồng đội 2 lượt, Rank giảm MP, lan mục tiêu chính + ô kề (kể cả ô biên) kèm Rạn Khiên 3 lượt, AI profile, banner pool và `validateContent` rỗng.

Bốn regression vòng đời đi qua chuyển lượt/vòng thật (không gán `battle.round`, không tự gọi tick):

| Ca | Cách đi qua engine | Điều được chốt |
| --- | --- | --- |
| Giới hạn mỗi vòng | Đánh `$defend`/kỹ năng khiên qua hàng đợi thật tới khi vòng tự tăng | Vào dạng lần hai chỉ ở vòng sau; `procRounds` bằng đúng vòng kích |
| Bị choáng | Đẩy `stunned` rồi để lượt trước hành động, `advance` vào lượt cô | Lượt choáng trừ đúng một lượt mode, vẫn còn dạng |
| Lượt Thêm | Lionel dùng `lionel.encore`, chờ Vòng Phụ của cô | Vòng Phụ trừ đúng một lượt; rời dạng đúng một lần khi hết lượt cuối |
| Trùm nhiều hành động | Trùm thử `actionsPerTurn: 2` với rotation hai kỹ năng khiên | Hai lần thi triển trong một lượt chỉ tạo một lần vào dạng |
| PvP mirror | `createArenaBattle` với Flammelapis + Elaine hai bên | Bản sao chỉ phản ứng với kỹ năng khiên của phe đối diện; mode và ATK không rò sang bên kia |

Ngoài ra chạy `npm.cmd run validate`, typecheck và toàn bộ unit test.
