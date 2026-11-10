# Thảo Phạt Phương Đông — triển khai cấu trúc

## Phạm vi đã triển khai

- **8 Key Event** và **25 Thảo Phạt** = **33 encounter**.
- 5 nhóm Thảo Phạt, mỗi nhóm 5 màn.
- Category riêng: `east_key` và `east_hunt`; không trộn với Thảo Phạt/Truy Nã cũ.
- Tab **Thảo Phạt Phương Đông** tại `/quests?tab=east`.
- Difficulty:
  - Key Event dùng cấp cố định 35 / 45 / 55.
  - Thảo Phạt chỉ nhận `east_35`, `east_45`, `east_55`.
  - `createBattle()` từ chối độ khó/cấp không khớp.
- Mọi encounter Phương Đông dùng BGM ID chứa `east`; track dùng các file `/bgm/*_east.mp3` hiện có.
- Boss có HP nền Lv1 trong dải 1.400–2.200; boss dùng phase 2 giai đoạn, có đòn dự phòng miễn phí.
- Weakness Hồn Kiếm cho toàn bộ boss Phương Đông trừ Chiyoko.
- First-clear Phương Đông được ghi nhận kể cả encounter không có `firstClearRewards`.
- KE8 thắng và nhận thưởng ghi flag `east_campaign_completed`.

## Luồng mở khóa

Điều kiện mở tab: thắng **Hắc Ảnh Arthur — Dễ** (`epilogue_shadow_easy`) và nhận kết quả trận. Khi đó game cấp `eastern_hunts_unlocked`, mở `arthur.eastern_hunts` và cho phép vào KE1.

`east_ke_01 → east_ke_02 → east_ke_03 → nhóm 1 → east_ke_04 → nhóm 2 → east_ke_05 → nhóm 3 → east_ke_06 → nhóm 4 → east_ke_07 → nhóm 5 → east_ke_08`.

Mỗi nhóm yêu cầu đủ 5 first-clear. Thứ tự hoàn thành trong nhóm tùy ý.

## Dữ liệu

Các record Phương Đông nằm trong [src/core/east-campaign.js](../src/core/east-campaign.js), được hợp nhất với `data/enemies.json`, `data/encounters.json`, `data/music.json` bởi:

- `scripts/load-content.mjs` cho test/Node.
- `src/runtime/content.ts` cho web bundle.

Cách này giữ dữ liệu Phương Đông tách khỏi danh sách cũ, tránh sửa trực tiếp các collection lớn và giữ nguyên ID cũ.

## Cơ chế boss

Mỗi boss có **2–3 kỹ năng riêng** trong `src/core/east-boss-kit.js`, xoay theo phase:

- Một đòn áp lực nhẹ, thường kèm debuff.
- Một đòn nặng có `windup` báo trước 1 lượt, buộc người chơi phòng thủ, che chắn, giải hiệu ứng hoặc dồn sát thương để rút ngắn cửa sổ.
- Phase 1 xoay đòn cơ bản + 2 kỹ năng; phase 2 tại 50% HP dùng rotation kỹ năng, sát thương ×1,25 và **không hồi đầy MP miễn phí** khi chuyển phase.

Ví dụ:

| Boss | Áp lực nhẹ | Đòn nặng có báo trước |
| --- | --- | --- |
| Thuyền Trưởng Hải Tặc | Hải pháo dọc mạn · giảm SPD | Dấu cướp trên boong · Vết Thương Sâu |
| Jorōgumo | Mạng tơ khép lối · giảm SPD | Nanh chủ nhân mạng tơ · Vết Thương Sâu |
| Đại Tengu | Phong nhận Keijo · giảm SPD | Mũi giáo hộ pháp · giảm DEF |
| Chiyoko | Áp lực quân kỷ · giảm ATK/MAG | Tổ Kiếm Trấn Quân · đòn nặng một mục tiêu |
| Yuki-onna | Bão tuyết trắng · giảm SPD | Hàn Khí bám đường · Vết Thương Sâu |
| Yamata no Orochi | Sóng đầu xà · giảm ATK/MAG | Đêm nuốt trời · đòn nặng một mục tiêu |

### Phong Ấn Hồn Kiếm

Mọi boss Phương Đông bắt đầu với **Phong Ấn Hồn Kiếm**:

- Giảm **50% sát thương nhận** khi còn lớp.
- Số lớp: **12–18**; Chiyoko có **24**.
- **Không thể bị xóa bởi hiệu ứng xóa buff**; chỉ bị bóc lớp bởi đòn đánh.
- Mỗi cast chỉ xử lý một lần, kể cả đòn nhiều hit:
  - Đòn không hệ Hồn Kiếm: −1 lớp.
  - Đòn hệ Hồn Kiếm: −2 lớp.
  - Đòn tiêu Hồn Kiếm: −(số Hồn Kiếm đã tiêu + 2).
- Khi hết lớp: áp **Phong Ấn Vỡ**, nhận thêm **25% sát thương** trong 2 lượt chính.
- Boss vẫn yếu Hồn Kiếm hệ số ×1,5.

Đội Hồn Kiếm bóc ấn nhanh hơn nhờ đòn Hồn Kiếm và chi phí Hồn Kiếm, nhưng không còn cơ chế “một đòn phá ấn” như trước. Vì vậy ưu thế 55–60% cũ không còn được bảo đảm; cần benchmark lại.

## Cơ chế đặc thù đã triển khai

- **Hàn Khí tích tầng**: `east_chill` tối đa 3 tầng, mỗi tầng −10% SPD và −5% ATK; dùng lại làm mới thời hạn.
- **Tổ Kiếm của Chiyoko**: `to_kiem` tối đa 3; `Áp Lực Quân Kỷ` tạo 1; phase có `resourceBurst` tiêu 3 để dùng `Tổ Kiếm Trấn Quân · Quyết`.
- **Khiên Bạch Quỷ**: `Bạch Quỷ Trấn Sơn` tạo khiên 260; khi khiên vỡ, boss nhận `Giáp Quỷ Vỡ` (−20% DEF/RES, +15% sát thương nhận).
- **Tơ Jorōgumo**: `Mạng Tơ Khép Lối` áp `Tơ Trói`; `Nhện Con Bủa Tơ` gọi anchor `web_anchor`; hạ anchor cuối cùng xóa toàn bộ Tơ Trói trên đội.
- **Summon**:
  - Thuyền Trưởng gọi tối đa 2 lính.
  - Jorōgumo gọi tối đa 2 nhện anchor.
  - Orochi gọi tối đa 3 đầu xà; mỗi đầu bị chém làm boss nhận `Đầu Xà Bị Chém`.

## Mechanic của 17 hunt không boss

Mỗi hunt có một **anchor enemy** mang mechanic riêng; anchor nằm trong wave đầu:

| Encounter | Mechanic |
| --- | --- |
| `east_e_01` | Kasa-obake che mưa · tăng DEF/RES cả tổ |
| `east_e_02` | Bake-danuki ảo ảnh · tăng né vật lí |
| `east_e_03` | Kappa rút nước · Nhiễu Ma Lực |
| `east_e_04` | Rokurokubi · giảm ATK/MAG |
| `east_e_06` | Nhện giăng tơ · giảm SPD |
| `east_e_07` | Kamaitachi liên hoàn · windup + Vết Thương Sâu |
| `east_e_08` | Noppera-bō · giảm ATK/MAG |
| `east_e_09` | Bùa hộ Torii · tăng DEF/RES |
| `east_e_11` | Giáp lò rèn · tăng DEF/RES |
| `east_e_12` | Onibi · Lửa Ma gây sát thương theo lượt |
| `east_e_13` | Kiệu khiêng · tăng DEF/RES |
| `east_e_16` | Hàn Khí · giảm SPD/ATK |
| `east_e_17` | Bão tuyết · windup + Hàn Khí |
| `east_e_19` | Tường băng · tăng DEF/RES |
| `east_e_21` | Xà linh · giảm DEF/RES |
| `east_e_22` | Bách quỷ dạ hành · giảm ATK/MAG |
| `east_e_23` | Phong ấn miếu · Nhiễu Ma Lực |

`east_ke_02` cũng có anchor **Youkai Hậu Cần** tăng DEF/RES cho tổ.

## Giới hạn hiện tại

- Các mechanic nhiều bước chính đã có: Hàn Khí stack, Tổ Kiếm, khiên Bạch Quỷ, tơ + anchor, summon lính/đầu xà.
- Chưa chạy benchmark 30 seed × 6 đội × 3 difficulty như mục acceptance; chưa có báo cáo PASS/FAIL từng encounter.
- Add summon chưa có UI/art riêng; dùng template hiện có và hành vi runtime.

## Kiểm chứng

`test/east-campaign.test.js` khoá:

- đúng 8 Key + 25 hunt, 5 nhóm;
- level 35/45/55 và fixed Key Event;
- BGM Phương Đông;
- HP/phase/weakness boss;
- unlock chain;
- first-clear không cần reward;
- wave kế tiếp giữ difficulty.
