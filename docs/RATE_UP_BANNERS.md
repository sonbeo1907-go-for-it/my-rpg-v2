# Chiêu Mộ tăng cơ hội theo phe

Cập nhật 05/11/2026. `src/core/rate-up.js` sinh lịch; cấu hình nằm tại `data/banners.json → standard.rateUpRotation`. UI: `rate-up-banner.tsx`, `recruitment.tsx`, `rateup.css`. Dữ liệu PvE và pool thường giữ nguyên.

## Lịch và hàng đợi

- Giờ Việt Nam, đổi đợt lúc 00:00. Thứ Hai–Tư: một banner; thứ Năm–Bảy: một banner thuộc nhóm khác đợt đầu tuần. Chủ Nhật: hai banner thuộc hai nhóm khác nhau. **Mỗi banner luôn có ba nhân vật: một chính, hai phụ.** Quy tắc Chủ Nhật hai người đã được người dùng thay bằng ba người.
- Năm nhóm: Hội Thợ Săn, Học viện Ma pháp, Kị sĩ đoàn Thủ đô, Liên minh quý tộc (Valmont/Vertosse/Ranoc/Hoa Hồng Đen gộp chung), Hồn Kiếm. Phe kép Hội Thợ Săn/Học viện thuộc cả hai nhóm. Hồn Kiếm xét tag, không xét nguyên tố chính hoặc tên.
- Chính + một phụ thuộc nhóm. Với xác suất 50%, phụ còn lại lấy từ ngoài nhóm; nếu không, lấy trong nhóm. Mọi lựa chọn không trùng và đều là nhân vật gacha chính thức. Không tự đưa Astoria, nhân vật khởi đầu hoặc Tobin vào.
- FIFO chung giữ **15 ID nhân vật**, không phải 15 banner hay 15 ngày. Chọn ba người khi hàng đợi cũ vẫn còn nguyên, sau đó nối vào cuối và bỏ đầu dư. Không dequeue trước để lấy lại người cũ ngay trong cùng đợt. Hai banner Chủ Nhật xét nối tiếp, nên không thể trùng nhau. Hàng đợi tính từ lịch, không từ việc người chơi có đăng nhập hoặc quay hay không.
- Chỉ chọn nhóm còn ít nhất ba ứng viên chưa trong queue; không phá luật chống lặp nếu nhóm nhỏ chưa đủ người. Không đảm bảo mỗi nhóm xuất hiện đều nhau; Hồn Kiếm hiện có ít thành viên hơn, có thể vắng nhiều đợt.

## Lịch offline tái lập

Mốc thứ Hai 02/11/2026, seed và roster cố định trong cấu hình phiên bản1. Replay các đợt đến ngày hiện tại tạo cùng lịch trên mọi hồ sơ, kể cả nhiều ngày không mở game. Cache chỉ là tối ưu bộ nhớ, không phải nguồn sự thật; dữ liệu trả ra được clone. Không dùng RNG chiến đấu hoặc RNG phần thưởng để lập lịch.

`roster` được chốt riêng: thêm nhân vật vào pool thường không âm thầm viết lại lịch quá khứ. Muốn đổi roster/phe/seed phải thiết kế revision lịch và mốc hiệu lực; không sửa seed hoặc epoch giữa đợt rồi tuyên bố lịch vẫn bất biến. Bản này chưa có scheduler máy chủ hay công cụ quản trị lịch. Đồng hồ hệ điều hành quyết định ngày; chưa chống chỉnh giờ trong game offline.

Trang đang mở cập nhật khi qua nửa đêm, trở lại tab hoặc focus cửa sổ. Xác nhận đổi Coin bị đóng khi banner đổi; tầng transaction kiểm lại banner đang hiệu lực trước RNG/chi phí để thao tác cũ không mua nhầm đợt.

## Tỷ lệ và bảo hiểm

Tất cả banner: 30% gear thấp /50% trung /18,5% cao /1,5% nhân vật. Phần 3,5% chuyển từ nhân vật sang Cấp III, giữ tỷ lệ chuyên biệt:đa dụng 4:1 (14,8% và 3,7%). Điều kiện đã ra nhân vật:

| Nhánh | Xác suất có điều kiện | Mỗi lượt cơ bản |
| --- | ---: | ---: |
| Nhân vật chính | 25% | 0,375% |
| Phụ 1 | 12,5% | 0,1875% |
| Phụ 2 | 12,5% | 0,1875% |
| Ngoài ba người trên, chia đều | 50% tổng | 0,75% tổng |

50% tăng cơ hội chia 50% chính /25% phụ1 /25% phụ2. Nhánh ngoài không chứa ba nhân vật đang tăng cơ hội. Pity chỉ bảo đảm **nhân vật**, không bảo đảm thắng rate-up. Không có 50/50 bảo hiểm sau khi lệch.

**Mỗi banner luân phiên có pity riêng theo ID đợt**, kể cả hai banner Chủ Nhật. Hết hạn thì về0, không chuyển sang banner khác hoặc đợt kế; `standard` có bộ đếm riêng không hết hạn. Điều khoản này hiện ngay dưới các nút quay, không chỉ trong phần thu gọn. Lượt50 ra nhân vật, reset cả bản trùng. X10 xét tuần tự; không đổi cơ chế dupe, Pure Prisma và mở slot. Standard vẫn có thể chọn ở trang Chiêu Mộ.

## Save và lịch sử

Không đổi save v7/namespace/đường dẫn. Save dùng key `rateup_YYYY-MM-DD_slot`. Counter hết hạn bị loại khi normalize/lần giao dịch kế; UI chỉ đọc key đang hiệu lực nên không tái sử dụng counter cũ. Key thử nghiệm chung `rate_up` được bỏ khi migration, không phân phát sang banner mới. `lastSummon.bannerId` giữ base `standard`; thêm `rateUp` snapshot `{id,groupId,featured,startDate,endDate,version}` để lịch sử không lệ thuộc banner hôm nay. Normalize kiểm snapshot và pool, giữ nguyên khi load lại; xem lại kết quả không grant thưởng lần nữa. Result UI ghi đúng tên nhóm đã quay.

## Hình và thao tác

Năm SVG gốc: rừng/cung, thiên văn/sách, thành lũy/cờ, mặt nạ/nhung, torii/hồ. Dùng silhouette theo role đang có cho ba người được chọn; đây là hình tượng vai trò, chưa phải chân dung riêng. Bố cục phân cấp lấy cảm hứng banner Arknights, không sao chép artwork của trò chơi đó. Giữ palette/font/Prisma của dự án.

Tavern luôn hiện splash theo đợt. Chủ Nhật carousel trượt sau mỗi10giây, có chấm chọn trực tiếp (chấm đang xem tô đậm) và dừng, dừng khi hover/focus/tabẩn và tôn trọng reduced-motion. Click mở đúng banner; đổi banner trong Chiêu Mộ không tiêu tiền. Nhân vật và tỷ lệ lấy cùng dữ liệu với transaction. Danh sách đầy đủ nằm trong disclosure, cuộn riêng để hạn chế trang dài trên điện thoại. Art không che chữ/nút.

## Balance Hồn Kiếm cùng bản

- Amiya: đầu vòng +1; ít nhất **3** thành viên Hồn Kiếm gồm bản thân → +2 và hồi **3% MP tối đa toàn đội còn sống**, floor theo engine, không vượt MP tối đa. Tính theo thành phần đội, gồm thành viên đã gục; Amiya phải sống, choáng không chặn nội tại. Vòng1 có áp dụng; Vòng Phụ không kích thêm. Không tăng theo Rank.
- Tsukiha: burst từ200% còn175% mỗi hit, vẫn3hit trả MP /4hit trả4Hồn Kiếm. Nhất Kiếm đơn lẻ giữ200%.
- Bỏ dòng “Linh hỏa trước cổng Keijo”. Khi đội có native mở rộng trần của Kaguya, nhãn bảng thành **Hồn Kiếm Chúc Phúc**, không đổi ID tài nguyên/nguyên tố hoặc tên cơ chế khác.

## Kiểm chứng

`test/rate-up.test.js`: lịch Việt Nam,100tuần FIFO, nhóm Chủ Nhật, xác suất biên, pity riêng/x10/save/đợt hết hạn. `test/soul-quartet.test.js`: hồi MP qua tiến trình vòng thật, choáng, KO, không kích ở Extra Turn; `test/sword-soul.test.js`: scale mới. `e2e/rate-up.spec.ts`: desktop/tablet/mobile, link Tavern, carousel10s, giao dịch/lịch sử và xác nhận quá nửa đêm. Bộ summon cũ chọn rõ `standard` để không nhầm lane pity mới.

Miyuki thêm vào pool thường ngay; `rosterAdditions` cho phép cô vào danh sách chọn rate-up từ09/11/2026, không viết lại đợt đang mở. Cấu hình này là cách bổ sung roster theo ngày hiệu lực thay vì sửa lịch quá khứ.

06/11/2026: Về Chiêu Mộ từ kết quả/reveal dùng bannerId (hoặc rateUp.id trong snapshot). Banner thường trở về `?banner=standard`; banner rate-up còn hoạt động trở về đúng đợt. Pity 50 không đổi.

## Vé Chiêu Mộ — 06/11/2026
Mỗi 300 lượt quay **rate-up** mới nhận 1 Vé Chiêu Mộ. `gacha.rateUpMileage` cộng dồn qua mọi banner/đợt, không reset khi ra nhân vật hoặc banner hết hạn; banner thường không tính. Save cũ thiếu trường này mặc định0, không trả vé theo totalPulls lịch sử. Vé cộng cùng giao dịch quay, không cấp khi xem lại kết quả. Một vé chọn một nhân vật chưa sở hữu trong pool Shop, thay hoàn toàn nguồn đổi120Pure; không nhận bản trùng, không thay pity. Vé ở Túi đồ có khung cầu vồng/lấp lánh và link dùng tại Shop.
