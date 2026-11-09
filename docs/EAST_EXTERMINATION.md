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

`east_ke_01 → east_ke_02 → east_ke_03 → nhóm 1 → east_ke_04 → nhóm 2 → east_ke_05 → nhóm 3 → east_ke_06 → nhóm 4 → east_ke_07 → nhóm 5 → east_ke_08`.

Mỗi nhóm yêu cầu đủ 5 first-clear. Thứ tự hoàn thành trong nhóm tùy ý.

## Dữ liệu

Các record Phương Đông nằm trong [src/core/east-campaign.js](../src/core/east-campaign.js), được hợp nhất với `data/enemies.json`, `data/encounters.json`, `data/music.json` bởi:

- `scripts/load-content.mjs` cho test/Node.
- `src/runtime/content.ts` cho web bundle.

Cách này giữ dữ liệu Phương Đông tách khỏi danh sách cũ, tránh sửa trực tiếp các collection lớn và giữ nguyên ID cũ.

## Giới hạn hiện tại

- Khung boss/phase, wave, difficulty, unlock, BGM và weakness đã chạy.
- Các cơ chế **đặc thù từng boss** trong spec gốc (telegraph hỏa hoạn, Hàn Khí, phá tơ, summon đầu xà, v.v.) hiện mới ở mức mô tả/khung phase dùng chung, **chưa phải script riêng đầy đủ cho từng encounter**.
- Chưa chạy benchmark 30 seed × 6 đội × 3 difficulty như mục acceptance của spec; chưa có báo cáo PASS/FAIL từng encounter.

## Kiểm chứng

`test/east-campaign.test.js` khoá:

- đúng 8 Key + 25 hunt, 5 nhóm;
- level 35/45/55 và fixed Key Event;
- BGM Phương Đông;
- HP/phase/weakness boss;
- unlock chain;
- first-clear không cần reward;
- wave kế tiếp giữ difficulty.
