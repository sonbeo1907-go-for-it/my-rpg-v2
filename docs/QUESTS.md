# Danh mục nhiệm vụ

- `/quests` hoặc `?tab=extermination`: Thảo phạt, chỉ tier `normal` và `boss`. Mặc định xếp thưởng Coin tăng dần (50 trước 150), giữ thứ tự dữ liệu trong cùng nhóm.
- `?tab=sinister`: Hiểm Ác, chỉ tier `super` (1.000 Coin). URL cũ `?type=super` được hiểu là Hiểm Ác.
- Hai nút chuyển nhóm ở góc trên trái khung minh họa. Có nền SVG riêng, hỗ trợ LB/RB; bộ lọc/nhiệm vụ chọn được nhớ riêng theo tab trong trang, vị trí cuộn riêng trong sessionStorage.
- Nhiệm vụ khóa không xuất hiện trong tìm kiếm, danh sách, preview hoặc mục tiêu xuất chiến. Runtime kiểm tra trước khi thay trận, core `createBattle` cũng kiểm tra; Đánh lại dùng cùng đường tạo trận.

## Mở khóa từ Hầm Ngục Ảo Ảnh

Flag dùng chung: `illusion.sinister_unlocked`, trong `campaign.storyFlags`. Save v4 đã hỗ trợ chuỗi flag, không cần tăng phiên bản. Save cũ không có flag tiếp tục ẩn siêu trùm, giữ nguyên chiến thắng và thưởng đã nhận.

Quest có thể khai báo yêu cầu trong `data/encounters.json`:

```json
{"requires":{"storyFlag":"illusion.sinister_unlocked"}}
```

Tier `super` chưa khai báo yêu cầu cũng mặc định cần flag trên. Có thể dùng `requires.storyFlag` khác để mở riêng từng quest về sau.

Khi triển khai mốc mở khóa trong Ảo Ảnh, dùng `completeStoryEvent(next, content, SINISTER_UNLOCK_FLAG)` trong transaction lưu campaign. Chỉ công bố mở khóa sau khi ghi save thành công. Không tự cấp flag bằng việc ghé tab, tìm kiếm, sửa URL hay thắng quest cũ.

Ảo Ảnh hiện vẫn đóng; lần cập nhật này chỉ chuẩn bị điều kiện mở khóa, không tự triển khai roguelike hoặc tự cấp flag cho người chơi.

## Hình ảnh

- `public/art/quest-extermination.svg`: thung lũng xanh, cây cổ thụ, tháp đá và người lữ hành.
- `public/art/quest-sinister.svg`: hành lang ngục đá hẹp, song sắt, xiềng và đèn tàn.
- `QuestIllustration.header` nhận nút chuyển nhóm riêng; các màn hầm ngục dùng chung component vẫn giữ bố cục cũ.
