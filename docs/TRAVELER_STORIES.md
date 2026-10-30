# Câu chuyện lữ hành

## Nội dung hiện có

- `/stories`: kệ sách, 3 bìa/trang trên desktop, 1 bìa/trang dưới 700px. Trang đang xem nằm trong URL.
- `/stories/iris`: ba chương chơi tuần tự. Hai chương đầu mở mỗi chương một ô trang bị, tối đa 6; không cấp thêm Pure Prisma. Chương cuối yêu cầu Iris thực sự tham chiến và mở Đúc kết thực địa.
- `/stories/takeshi` và `/stories/fiona`: bìa và trang chờ nội dung. Không có màn chiến đấu hay tự cấp nâng cấp.

## Thêm truyện và chương

1. Khai báo sách trong `data/travelerStories.json`: `id`, `characterId`, `name`, `subtitle`, `description`, `art`, `order`, `chapters`.
2. Thêm encounter bình thường trong `data/encounters.json`, gắn `travelerStory` bằng ID sách. `chapters` quyết định thứ tự.
3. Từ chương thứ hai đặt `requires.firstClear` bằng ID chương ngay trước. Engine kiểm tra trước khi tạo trận; URL không bỏ qua được khóa.
4. Đặt `requiredPartyIds` nếu một nhân vật phải tham chiến. Phần thưởng xét đội đã chiến đấu, kể cả nhân vật bị hạ gục; không xét đội đang chỉnh sau trận.
5. `firstClearRewards` hỗ trợ `gear_slot` với `characterId`, hoặc `upgrade` với `upgradeId`. Dùng giao dịch lưu thưởng hiện có; chỉ nhận một lần sau khi lưu thành công.
6. Chương truyện không tham gia bảng Quest thường hay pool Mỏ Vàng/Hiểm Nguy. Cùng engine combat và BGM hiện có; kết quả dẫn về đúng trang truyện.

## Nâng cấp đã dựng, chưa mở trong nội dung chơi

| Nâng cấp | Cờ cốt truyện |
| --- | --- |
| Fiona: Khúc xạ hoàn thiện | `fiona.refraction_story_cleared` |
| Fiona: Hội tụ Prisma | `fiona.origin_story_cleared` |
| Takeshi: Tâm nhãn kiếm sĩ | `takeshi.overseas_story_cleared` |

Chỉ gắn các nâng cấp này vào phần thưởng khi có chương truyện tương ứng. Hiện không tự thêm cờ cho save mới hoặc save cũ.

## Các khả năng engine dùng lại

- Upgrade `set_passive`: thay nội tại qua tiến trình, lưu bằng `upgradeIds` và cờ truyện hiện có; không đổi schema save.
- Status effect `extraStacksIfPresent`: xét snapshot trước toàn bộ chiêu, thêm tầng trên từng mục tiêu; tôn trọng `maxStacks` và miễn nhiễm hiệu ứng.
- Ability `requiresTargetStatus`: lọc mục tiêu hợp lệ và chặn chiêu trước khi tiêu MP. Hội tụ cần ít nhất một mảnh; hệ số 50% + 100% MAG/mảnh, 12 MP, cooldown 1. Theo engine, dùng vòng 1 thì dùng lại vòng 3.
- Nội tại `buffed_ally_mp`: cấu hình `statusIds`, `amount`, `weaknessBonus`. Kiểm tra đúng nguồn buff và đồng đội khác còn sống; sát thương vào khiên và đòn kết liễu hợp lệ. Đòn nhiều hit/AoE xét cả hành động; phản công, Liên kích và Vòng Phụ dùng chung hạn mức vòng chính. Không tự tạo Dữ liệu. Hiện áp dụng cho sát thương đòn đánh, không áp dụng tick độc.
- Nội tại `dodge_counter.counterAbility`: gọi một ability bị động từ dữ liệu khi né thành công; giữ giới hạn một phản công/Sơ hở mỗi vòng. Bản nâng cấp thêm Kiếm áp -15% SPD, cộng với Percival.
- Status `durationClock: main_turn`: Vòng Phụ không trừ thời hạn. Kiếm áp mới gắn trong đòn địch tồn tại đến hết lượt chính kế tiếp của địch. Hàng đợi chính không đổi giữa vòng; Vòng Phụ vẫn sắp lại theo SPD lúc vào phase.
- AI ưu tiên: `unshielded`, `ally_unshielded`, `ally_hp_below` + `ratio`, `missing_status` + `statusId`. Kiểm tra tài nguyên, hồi chiêu và mục tiêu trước khi chọn; hỗ trợ hồi phục phe địch trong trận đấu đội.

## Kiểm tra khi bổ sung nội dung

Chạy `npm.cmd run validate`, `npm.cmd test`, `npm.cmd run build`, và các kiểm thử Playwright. Kiểm tra thứ tự chương, thưởng không lặp, lưu thất bại, save cũ, vai trò bắt buộc, đường trở về và phân trang mobile.
