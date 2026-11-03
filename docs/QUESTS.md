# Bảng nhiệm vụ

Ba tab chia đều ngang: **Thảo Phạt / Truy Nã / Hiểm Ác**. LB/RB đổi tab; LT/RT chọn độ khó ở góc ảnh. Viền màu kèm tên/Level, không chỉ dùng màu. Modal mở chặn phím tắt nền.

- `/quests?tab=extermination`: normal/boss, stable sort theo nhóm50 trước150, không theo nhánh thưởng thực nhận.
- `?tab=bounty`: Truy Nã, mở sau finales Iris/Fiona/Takeshi.
- `?tab=sinister`: siêu trùm; nhiệm vụ khóa không xuất hiện trong search/list/preview, core kiểm tra lại trước xuất chiến. URL cũ type=super vẫn được hiểu.
- Truyện Lữ Hành không vào danh sách này. Chronicle dùng quyền encounter riêng.

## Độ khó và thưởng

Normal/Boss/Truy Nã mặc định **Rất dễ Lv5**, sau đó chọnLv15/25/35/45. Query giữ selected+difficulty khi trở về/đánh lại. Truyện ba chương10/20/30; epilogue Arthur30. Siêu trùm dùng encounter/superLevels, không ép vào năm độ khó.

Normal/boss50% Coin/50% Vụn, mức gốc50/5 và150/15, nhân thưởng độ khó. Truy Nã đã nhận lần đầu ởLv25/35/45:40% Coin/40% Vụn/20% Blueprint1/3/5. Siêu trùm1000 Coin theo policy riêng. EXP Normal40/150/340/615/965, Boss×2, Truy Nã×3; truyện/siêu trùm/Chronicle/Arena không cấp EXP. Xem LEVEL_PROGRESSION và BLUEPRINT_EXCLUSIVES.

## Mở khóa Hiểm Ác

Alice: chronicles.aliceFirstEncounterCleared. Miraebolis: finaleCleared Quyển II hoặc quyền legacy hợp lệ theo quest-catalog. Các encounter khác dùng requires.storyFlag/firstClear/firstClears; fallback super dùng flag legacy illusion.sinister_unlocked.

**Không còn gameplay Ảo Ảnh** để tạo flag mới. Không mở khóa do ghé tab/URL hoặc thắng màn cũ. Đọc quest-catalog.js và chronicle-rules.js; không hướng người chơi vào Ảo Ảnh trong UI mới.

## Hình ảnh

quest-extermination.svg là thung lũng sáng; quest-sinister.svg là hành lang ngục đá; Truy Nã dùng art riêng hiện có. Nền trang dùng quest.svg làm tối. Chữ/tab/action là HTML, không nhúng UI text vào SVG.
