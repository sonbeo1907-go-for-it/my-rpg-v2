# Vòng Phụ, nhân vật và Trấn Phái — 29/10/2026

Triển khai theo hai bản thiết kế Helena → Lionel / 13 Trấn Phái và Vòng Phụ v4. Hầm Ngục Ảo Ảnh vẫn đóng; không bổ sung gameplay hầm ngục đó trong đợt này.

## Vòng Phụ

- `grant_extra_turn` là effect dùng lại được cho cả hai phe. Cấp quyền trong lượt chính; không chen vào hàng hiện tại.
- Mỗi người tối đa một lượt phụ mỗi vòng. Các nguồn cấp trùng chỉ bỏ qua effect cấp quyền, không bỏ toàn bộ kỹ năng.
- `battle.phase` là `main` hoặc `extra`. `battle.round` chỉ tăng khi sang vòng chính kế tiếp. Hàng phụ dùng SPD hiệu lực lúc vào pha, hòa giữ thứ tự actor gốc.
- Có quyền đã cấp thì luôn đi qua pha phụ, kể cả khi mọi người nhận đã gục. Người gục bị bỏ qua, không chuyển quyền sang người khác hoặc vòng sau.
- Trong pha phụ, riêng effect cấp quyền bị bỏ qua; chi phí, hồi chiêu, damage, buff và những effect còn lại vẫn thực hiện.
- Đầu/cuối lượt, độc, hồi phục và thời hạn trạng thái xử lý theo lượt thực tế. Cooldown chỉ giảm ở đầu vòng chính. Boss nhiều move vẫn tính là một lượt của boss.
- Các hạn mức một lần/vòng dùng chung `round` trong hai pha. Không reset liên kích, phản công, làm mới Trò quậy hoặc nội tại Trấn Phái khi vào pha phụ.
- “Cuối Vòng” chỉ chạy một lần sau cả hai hàng. Lionel xét cả bản thân, chọn tỷ lệ MP thấp nhất, hòa theo thứ tự đội hình, hồi `ceil(10% maxMP)`. Cedric vẫn hồi ở cuối lượt riêng như trước.
- Thắng/thua dừng ngay, không chạy pha hoặc hiệu ứng cuối vòng tương lai. Save chiến dịch không chứa trạng thái giữa trận; không thay chính sách lưu này.

## Nhân vật

Thêm Helena, Leonardo, Kyle, Iwayn, Percival, Mandred, Lionel. Cả bảy ban đầu khóa và có trong banner thường, mỗi người có ba kỹ năng chủ động. Save cũ tự bổ sung bản ghi nhân vật, không tự mở khóa.

Các quy tắc bổ sung được chọn khi tài liệu còn mở:

- Helena: trần MP thêm là `ceil(50% MP gốc)`, chỉ trả phần có thể trả sau chi phí gốc. Bonus tỷ lệ với phần thực trả, một lần mỗi cast. Áp dụng theo điều kiện kỹ năng chủ động có MP và damage, không dựa tên/ID.
- Kyle: Trò quậy 3 lượt mục tiêu; mỗi hit trúng gắn một tầng. Mỗi mục tiêu làm mới tối đa một lần/vòng khi nhận phép từ phe của người gắn dấu; vừa tạo dấu không tiêu quyền làm mới. Kyle chỉ hỗ trợ MAG cho đồng đội khác, theo từng hit và mục tiêu có dấu.
- Iwayn: người chơi xác nhận dùng chênh lệch HP% tuyệt đối, tối đa +30%, nhân riêng vào sát thương trước làm tròn.
- Percival: hồi HP thực nhận phải dương và nguồn là đồng đội khác. Hồi phục theo lượt của đồng đội được tính. Hai debuff SPD lấy mức mạnh nhất trong cùng nhóm, không cộng thành −40%.
- Mandred: 8% maxHP gồm trang bị cộng vào ATK nền trước ATK%; preview và combat dùng cùng công thức, không quy đổi hai lần.
- Lionel: người chơi xác nhận bản thân nằm trong danh sách chọn hồi MP. Kỹ năng cấp lượt có thể nhắm chính mình như quy tắc chọn đồng đội chung.

## 13 Trấn Phái

Catalog `data/exclusiveGear.json`: 12 mẫu chế tạo và một mẫu thưởng nhiệm vụ. Giữ nguyên chi phí, ô riêng, quyền sở hữu một lần, tái rèn có kết quả chờ và lựa chọn giữ cũ/dùng mới.

Các nội tại được chọn bằng loại hook cùng ID kỹ năng/trạng thái trong dữ liệu, không so sánh tên hiển thị. `exclusive-hooks.js` kiểm tra schema. Chỉ nội tại đang trang bị có hiệu lực; chỉ số phẳng và nội tại là hai phần độc lập.

- Arthur: Kiếm quang ×1,08; hai Bane thêm 25% xuyên DEF; hai Giải phóng cấp giảm sát thương 20% qua hết lượt kế tiếp.
- Iris: Công thức thêm một Dữ liệu một lần/vòng khi còn chỗ; Hiệu chỉnh cấp thêm 10% SPD trong hai lượt.
- Takeshi: né vật lí hồi 6% maxHP một lần/vòng; Hoàn kiếm tiêu ít nhất hai Sơ hở thêm 25% xuyên DEF.
- Fiona: Hắc tinh vào địch chưa có mảnh trước cast gắn thêm một mảnh một lần/vòng; Sụp đổ tiêu mảnh trên ít nhất hai địch khác nhau hồi 8 MP một lần sau cast.
- Elaine: lượng hồi vỡ khiên ×1,5; Màn nước kéo dài ba lượt, không tăng RES hoặc khiên thêm.
- Garrek: chỉ Cover thực sự nhận thay mới nhân sát thương ×0,85; Thủ thành đặt một lần hồi 6% maxHP đầu lượt thực tế kế tiếp, có thể là lượt phụ. Độc hạ gục trước đó không được cứu sống.

## Quest nhập môn Tobin

`giant_boar_trial`: boss Lợn rừng khổng lồ, 780 HP, yếu Hỏa/Phong, BGM boss thường, thưởng 150 Coin.

Thắng lần đầu cấp Dấu rèn khởi hành **ATK +5 cố định**, một bản trùng Arthur, Iris và Takeshi. Áp dụng luật bản trùng hiện có (mở ô và Pure Prisma). Toàn bộ phần thưởng cùng ghi nhận lần đầu được commit chung; ghi đĩa lỗi không cấp một phần. Đánh lại chỉ nhận 150 Coin. Nếu đã có món Trấn Phái đó thì giữ nguyên chỉ số đã tái rèn, không cấp thêm bản sao. Món thưởng có thể tái rèn nhưng không thể chế tạo tại lò.

Quest tự tham gia pool boss của Hầm Ngục Hiểm Trở; thắng một phòng hầm ngục vẫn không cấp thưởng quest/lần đầu.

## Kiểm tra

Các test mới: `test/extra-turn.test.js`, `test/new-knights-ranoc.test.js`, `test/exclusive-combat.test.js`, `e2e/new-roster.spec.ts`. Các test cũ được cập nhật theo số lượng catalog và sự kiện cuối vòng mới.
