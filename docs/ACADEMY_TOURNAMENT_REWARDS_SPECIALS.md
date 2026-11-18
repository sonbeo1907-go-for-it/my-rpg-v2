# Giải học viện — bước 7 và 8

## Cập nhật nhận lớp7A — 18/11/2026

Luật giải là trang `/chronicles/academy/rules`, trình bày thông báo của trường. Phải xác nhận đã đọc trước khi đăng ký mùa mới (kiểm ở core, không chỉ UI). Xác nhận lần đầu nhận Luka; First Clear nhận Clark miễn phí. Hồ sơ đã clear được nhận bù Clark khi vào trang giải hoặc xác nhận thông báo. Nhận lại không tặng dupe/tiền bù. Cờ `rulesAccepted` và `rewardClaims` giữ qua replay, có mặc định cho save cũ; không ngắt trận đang chơi.

Shop có hai hàng vĩnh viễn: mỗi ô Luka/Clark giá100 Huy Hiệu, mỗi người tối đa3 lượt, không reset theo tuần. Cần sở hữu nhân vật, tổng ô vẫn cap6; giao dịch mở ô và trừ tiền cùng lúc. Original Prisma vẫn cuối danh mục. Gairyu/Ariel/Charlotte/Mariel đã vào banner thường và pool rate-up từ18/11/2026, Luka/Clark không vào gacha. Đọc `academy-enrollment.js`, `academy-event-economy.js` và tests tương ứng.


Ngày 18/11/2026, ruleset `academy-3.0.0`. Quyết định mới thay phần thưởng v1 trong các mục lịch sử: shop riêng, tiền riêng, làm mới hạn mức mỗi tuần. Người dùng đã chốt bộ số playtest bên dưới.

## Huy Hiệu Học Viện và shop

- Thắng trận giải, kể cả phân hạng: 20 Huy Hiệu, chỉ phát khi xác nhận kết quả. Không phát từ bản nháp kết quả, thử lại, tải lại hoặc trận AI–AI.
- Mỗi mùa: vượt vòng bảng +40; vào chung kết +60; vô địch +100. Các mốc cộng dồn, mỗi mốc một lần/mùa. Rút giải không phát thêm thưởng, không lấy lại tiền đã kiếm.
- Tiền nằm ở `campaign.tournaments.wallet`, không đổi sang Danh Dự hay Prisma. Giữ tiền qua chơi lại, qua tuần và First Clear. Không tự tặng lớp 7A.
- Shop ở `/chronicles/academy/shop`, đi từ trang giải; không gộp shop tavern. Giao diện quầy sự kiện: số dư, bảng nguồn nhận, lưới vật phẩm, số lượng còn, giá và xác nhận mua nhiều.
- Làm mới stock **thứ Hai 00:00 giờ Việt Nam**, theo hồ sơ. Đổi tuần chỉ reset purchases; không reset tiền hoặc cờ giải. Quay đồng hồ về tuần cũ không cấp stock lại. Đây vẫn là game offline, không có bảo đảm chống sửa đồng hồ/save.

| Vật phẩm / mỗi lượt đổi | Giá Huy Hiệu | Hạn mức tuần |
| --- | ---: | ---: |
| 1.000 Coin | 20 | 20 |
| 100 Vụn Prisma | 30 | 10 |
| 1 Pure Prisma | 30 | 15 |
| 3 Nhật Ký cấp trung | 20 | 10 |
| 1 Nhật Ký cấp cao | 20 | 5 |
| 1 Original Prisma | 200 | 1 |

Original Prisma đứng cuối danh mục. Giá/stock tại `tournaments.eventShop`, mốc thưởng tại `tournamentRewards`. Giao dịch trừ tiền, thêm vật phẩm, tăng stock và revision trong một bản campaign bất biến; runtime lưu thành công rồi mới công bố.

`rewardReceipts` thuộc run, khóa match ID/milestone; wallet thuộc hồ sơ. Chỉ mùa mới dùng cấu hình mới. Snapshot mùa cũ thiếu `eventEconomy` không tự phát bù; các trường mới mặc định an toàn khi đọc save cũ. Giữ nguyên namespace/save v7.

## Thử thách siêu trùm hiếm

- Chỉ run tạo **sau First Clear**. Không chèn vào mùa giới thiệu vừa vô địch.
- Khi tạo run, RNG encounter riêng tung **15%**, tối đa một đối thủ, chọn đều Rotary/Monica/Lumine/Eri. Kết quả được lưu, không tung lại khi mở trang, retry hoặc reload.
- Lời mời xuất hiện ở khoảng nghỉ sau trận vòng bảng đầu tiên đã xác nhận. Không bắt buộc; có thể để sau hoặc bỏ qua. Nếu kết thúc/rút mùa trước khi đánh, lời mời khép lại.
- Bản enemy riêng, Lv40, base stat Lv1, HP curve superboss; không sửa kit playable/đội NPC thông thường. Không hiện trong Quest, gacha hay nguồn nhận nhân vật.
- Dùng roster/build đã khóa. Mỗi lần bắt đầu hoặc thử lại hồi đầy HP/MP và reset hiệu ứng/CD/tài nguyên. Không carry từ trận tỷ thí hoặc về trận kế tiếp. Thử lại giữ combat seed.
- Thắng xác nhận nhận **100 Huy Hiệu** một lần/run; thua nhận0. Không đổi bảng điểm, fixture, thống kê vô địch, First Clear, EXP, nhiệm vụ ngày, Danh Dự hay phần thưởng Quest.
- Checkpoint/RNG/pending outcome riêng. Khi đang đánh không mở trận giải hoặc đổi lineup. Có thể trở về trang giải rồi tiếp tục, không xử thua. Thua có thể retry hoặc xác nhận rời thử thách. Giới hạn60 vòng: còn boss thì thất bại, không so số người 4v1.

| Đối thủ | Chủ đề thử thách | Điểm yếu |
| --- | --- | --- |
| Rotary — Búp Bê Không Ngủ | Phong Ấn diện rộng, khiên/Màn Chỉ Rối, hai nhịp phép Ám | Quang |
| Monica — Nhịp Chuông Ngoài Thời Gian | Giảm SPD, trường ưu tiên phe, hai nhịp phép Phong xuyên RES | Hỏa/Thổ |
| Lumine — Điều Lệ Cuối Cùng | MAG gây vật lí Thủy, khiên/Hội Tâm, đòn xuyên DEF diện rộng | Lôi/Thổ |
| Eri — Sắc Màu Ngoài Khung Vẽ | Giảm RES, tăng MAG, ba nhát phép Thổ dồn mục tiêu | Phong/Thủy |

Cả bốn có đòn mạnh vận sức một vòng: log, event `enemy_windup` và khung cảnh báo sẵn có hiển thị kỹ năng + mục thời gian; chỉ giải vào lượt chính kế tiếp đủ điều kiện. Đi qua đường enemy rotation/preparedMove, không qua AI Arena (AI Arena có thể bỏ qua bước vận sức). Boss miễn Choáng ngoại sinh. Status dùng main_turn khi khai báo, lượt bị bỏ cũng tick, Extra không tick main_turn. Trường Monica sống2 vòng và dùng cleanup/serialization engine có sẵn. Không thêm đồng hồ song song.

## Điểm vào và nghiệm thu

- `academy-event-economy.js`: wallet/migration/shop/settlement.
- `academy-special.js`: chọn, mở, checkpoint, kết thúc/retry và validator trạng thái.
- `academy-special-content.js`: bốn bộ enemy/ability/status/encounter chỉ ghép trong scoped content; BGM boss có sẵn.
- `tournament-session.js`: snapshot cấu hình, ledger khi confirm, reveal lời mời.
- `tournament-combat.js`: adapter riêng cho thử thách, vẫn dùng combat/result renderer chung.
- `academy-event-shop.tsx`: shop riêng; `academy-tournament.tsx`: lời mời, trinh sát, resume/result.
- Test qua save envelope thực, ranh giới tuần VN, stale revision, overspend, duplicate confirm, gameplay windup thực, RNG reload, retry không thưởng, thắng không sửa fixture, timeout và gate.

Các con số là cấu hình playtest đã duyệt, chưa phải kết luận cân bằng. Không dùng lượt AI mô phỏng để tự chứng minh boss cân bằng với build tài khoản.
