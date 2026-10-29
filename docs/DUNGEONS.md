# Khám phá hầm ngục

| Loại | Trạng thái | Lượt nhận thưởng/ngày | Mức độ và thưởng |
| --- | --- | ---: | --- |
| Mỏ vàng | Dễ, Trung bình và Khó đã mở | 3, dùng chung mọi độ khó | Dễ 1.000 Coin; Trung bình 2.000 Coin; Khó 3.000 Coin |
| Hiểm trở | Dễ, Trung bình và Khó đã mở | 1 | Dễ 1, Trung bình 3, Khó 5 Pure Prisma |
| Ảo ảnh | Tạm đóng | Chưa triển khai | Roguelike và Original Prisma sẽ bổ sung sau |

Mỗi cửa chiếm một phần ba hàng trên desktop, có SVG riêng. Điện thoại xếp dọc. Trang độ khó dùng `QuestLayout`/`QuestIllustration`, bộ class Quest và xác nhận xuất phát như màn chọn trận.

## Wave Mỏ vàng

- Dễ: 3 Quest có `rewardTier: normal`, HP ×1,1; MP ×1,5; ATK/MAG ×1.
- Trung bình: 4 Quest có `rewardTier: normal`, HP ×1,75; MP ×2,25; ATK/MAG ×1,25.
- Khó: 4 Quest có `rewardTier: normal`, HP ×1,9; MP ×2,25; ATK/MAG ×1,6.
- Giữ hệ số MP đã có ở Dễ/Trung bình; mức Khó dùng cùng MP với Trung bình.
- Chọn không trùng trong một chuyến, chọn lại ngẫu nhiên khi bắt đầu chuyến mới. Không đổi nội dung hoặc stats gốc của Quest.
- DEF, RES và SPD giữ nguyên. Các chỉ số sau nhân làm tròn về số nguyên; mỗi nhóm quái mới vào ở đầy chỉ số đã scale.
- Mọi trạng thái của đồng đội được sao chép từ wave vừa xong; không resolve lại gear/nội tại và không lấy đội hình đang sửa ngoài trận. Giữ người đã gục ở 0 HP.
- Sang wave là bắt đầu một vòng mới: cooldown giảm theo engine; buff/debuff không tự hết giữa màn, độc/HoT/passive chạy ở lượt thật của nhân vật.
- Quái mới có ID theo số wave, nguồn gây hiệu ứng cũ được giữ riêng ngoài danh sách mục tiêu sống.
- Tự chuyển wave, vẫn có nút tiếp tục nếu chuyển màn cần thử lại. Chỉ wave cuối phát nhạc chiến thắng và nhận thưởng.

## Lượt và lưu tiến trình

Reset lúc 00:00 giờ Việt Nam. Ba lượt Mỏ vàng là ba chuyến hoàn thành có nhận thưởng, không phải ba wave. Thất bại, hòa hoặc bỏ dở không cấp thưởng và không tiêu lượt. Hoàn thành sau nửa đêm tính vào ngày nhận thưởng. Lùi đồng hồ không làm reset thêm lượt trước mốc ledger hiện tại.

Coin, số lượt ngày và số chiến thắng ghi cùng lúc, sau đó mới đánh dấu run đã nhận. Nếu ghi save lỗi, giữ kết quả để thử Nhận thưởng lại; không cấp một phần hoặc lặp thưởng.

Save v4 có thêm trường tùy chọn `dungeonDaily: {day, clears}`; save cũ khởi tạo `{day:null, clears:{}}`. Lượt đã nhận tồn tại qua tải lại và các file save JSON. Trạng thái chiến đấu không nằm trong save: tải lại trang sẽ kết thúc chuyến dở dang; đi qua các route trong cùng phiên vẫn tiếp tục được.

Phân rã, Vụn Prisma, công thức exclusive và Blacksmith không thuộc lần triển khai này.

## Hiểm trở: xem trước phòng trùm

- Dễ: 1 phòng, HP/MP ×1,2; ATK/MAG ×1; thưởng 1 Pure Prisma.
- Trung bình: 2 phòng, HP/MP ×1,6; ATK/MAG ×1,25; thưởng 3 Pure Prisma.
- Khó: 2 phòng, HP/MP ×2; ATK/MAG ×1,5; thưởng 5 Pure Prisma.
- Chọn không trùng từ encounter tier boss (nhóm Quest 150 Coin); không chọn thường hoặc siêu trùm.
- UI dùng Phòng 1, Phòng 2 thay tên Quest. Trinh sát nằm trong modal xác nhận xuất phát, không còn khối dài dưới trang. Hiện toàn bộ địch, số lượng, hệ, điểm yếu nguyên tố/loại sát thương, chỉ số sau scale, chiêu thức và nội tại. Nội dung cuộn trong modal; Chỉnh đội hình, Hủy và Bắt đầu thám hiểm luôn ở footer cố định.
- Danh sách trinh sát được nhớ trong sessionStorage theo hồ sơ, độ khó và ngày Việt Nam. Đổi route, đổi đội/gear, chuyển độ khó rồi quay lại và tải lại trong cùng cửa sổ không đổi boss. Không lưu trận đang chơi vào save.
- Bắt đầu dùng đúng danh sách đã xem; không tự roll lại. Preview hết ngày hoặc sai pool bị từ chối. Chỉnh đội hình có đường quay lại đúng độ khó.
- Trạng thái đội tiếp tục giữa các phòng như Mỏ vàng. BGM lấy theo encounter của mỗi phòng. Không nhận Coin hay thưởng Quest lần đầu ở từng phòng.
- Một lượt nhận thưởng/ngày dùng chung ba độ khó; chỉ trừ sau phòng cuối và ghi Pure Prisma thành công. Lỗi lưu giữ thưởng để nhận lại, không phát trùng.
