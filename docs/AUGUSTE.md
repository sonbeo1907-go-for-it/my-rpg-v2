# Auguste · Hiệu trưởng Học viện Ma Thuật

Thuật Sư hệ Thường, nhân vật chính thức trong banner thường và mục đổi Pure Prisma. Không mở miễn phí, không đổi phiên bản save hoặc các luật bản trùng/trang bị.

HP170 / MP140 / ATK10 / MAG36 / DEF18 / RES26 / SPD25. Đánh thường là hai hit phép Thường, mỗi hit 60% MAG.

## Bộ kỹ năng

| Kỹ năng | MP | Hồi chiêu hiển thị | Hiệu lực |
| --- | ---: | ---: | --- |
| Đại giảng đường: Khai nguyên | 20 | 6 | Đại Đồ Thức trong 3 vòng, tính cả vòng thi triển; ba ô trống. Cấp một Lượt Thêm cho bản thân theo luật Vòng Phụ hiện có |
| Phản biện thuật thức | 8 | — | Phép Thường đơn mục tiêu 160% MAG; trúng đòn giảm 15% RES trong 2 lượt chính của mục tiêu |
| Hiệu chỉnh luận cứ | 10 | — | Cần ít nhất một dấu: đổi chỗ hai dấu hoặc viết lại một dấu khác loại |
| Đại định lý: Điều phải chứng minh | 36 | Qua điều kiện ma trận | Cần đủ ba dấu. Ba hit phép Thường đơn mục tiêu; sau đó kết thúc Đại Đồ Thức |

Đại định lý: mỗi hit có hệ số `180% + 60% × số vị trí đúng`. Lần lượt 0/1/2/3 vị trí đúng cho tổng 540/720/900/1080% MAG. Đúng cả ba còn xuyên 50% RES. Hệ số được chuẩn hóa để sai số số thực không làm mất một sát thương trước bước làm tròn xuống.

**Tri thức được kế thừa:** mỗi đồng đội khác nhau góp dấu cho +3 MAG căn bản khi dùng Đại định lý, tối đa +9. Chốt một lần cho toàn bộ ba hit, trước buff MAG%. Không tăng vĩnh viễn MAG. Một người góp nhiều dấu chỉ tính một lần. Dấu của bản thân không tính; lịch sử của người góp đã gục vẫn tính.

## Luật ghi dấu

Ba kỹ năng chủ động gần nhất của đồng đội khác được ghi theo thứ tự. Ghi dấu thứ tư sẽ bỏ dấu cũ nhất. Mỗi kỹ năng chỉ ghi một lần, bất kể số hit/mục tiêu. Loại được xác định từ dữ liệu kỹ năng, không phụ thuộc sát thương thực hay việc mục tiêu có chặn debuff:

1. **Kích**: có hiệu ứng sát thương.
2. **Phá**: không gây sát thương, có hiệu ứng gắn debuff lên mục tiêu.
3. **Dẫn**: các kỹ năng hỗ trợ còn lại.

Ưu tiên Kích > Phá > Dẫn; có thể cấu hình `formulaTag` khi cần phân loại tường minh. Công thức mong muốn là **Dẫn → Phá → Kích**. Không ghi đánh thường, Phòng thủ, kỹ năng tự động/nội tại, phản công, Liên kích, hoặc kỹ năng của chính người dựng ma trận. Kỹ năng bị hủy do người thi triển gục giữa hành động không ghi dấu. Nhịp ghi xảy ra sau toàn bộ kỹ năng, trước khi chuyển sang lượt tiếp theo.

## Hiệu chỉnh

Đổi chỗ giữ nguyên nguồn và tên kỹ năng của cả hai dấu. Viết lại thay đúng một dấu, mang nguồn Auguste, do đó không góp MAG từ nội tại của chính ông. Không được tự khai báo nguồn khác từ client. Mọi lựa chọn được kiểm tra ở engine trước khi tiêu MP. Không chấp nhận ô trống/ngoài phạm vi, đổi cùng một ô hoặc viết lại thành đúng loại hiện có.

Modal chỉ chọn cách sửa và xem trước công thức mới; xác nhận modal chưa thi triển, chưa tiêu MP và chưa đổi bảng. Người chơi thực hiện kỹ năng bằng nút chiến đấu như thường. Tay cầm X mở modal; điều hướng A/B dùng hệ thống modal có sẵn. Đóng/hủy modal giữ nguyên bàn đấu.

## Vòng đời và tương tác

- Thời hạn tuyệt đối 3 vòng, gồm vòng mở; hết sau mọi Vòng Phụ. Lượt thêm không kéo dài thời hạn.
- Mở lại khi ma trận còn hoạt động bị chặn, không làm mới dấu hoặc cấp thêm lượt.
- Lượt Thêm tuân theo tối đa một/người/vòng. Mở trong Vòng Phụ không tạo thêm một Vòng Phụ khác.
- Đại định lý chốt dấu, độ đúng, xuyên RES và MAG nội tại ngay khi thi triển. Phản ứng trong các hit không sửa snapshot này.
- Dùng Đại định lý luôn đóng ma trận, kể cả khi mục tiêu gục trước hit cuối. Không hoàn MP.
- Chủ ma trận gục hoặc trận kết thúc thật sẽ đóng ma trận. Một phòng hầm ngục chưa phải phòng cuối được giữ lịch sử và mốc hết hạn; sang phòng không tặng thêm thời hạn hoặc lượt phụ.
- Chuyển phase Miraebolis không mở lại hoặc đặt lại ma trận.
- Bảng là trạng thái riêng trên actor; độc lập với `turnOrderField` của Monica và `activeMode` của Astoria. Không thay BGM của trận hoặc Magnamut.
- Trạng thái chiến đấu không đi vào save tiến trình.

## UI và VFX

Bảng ba ô luôn hiện loại dấu, nguồn, kỹ năng gốc, vị trí đúng/sai, số vòng còn lại, nguồn MAG nội tại và hệ số Đại định lý. Các kỹ năng đồng đội có nhãn Dẫn/Phá/Kích; khi chọn hoặc xem chi tiết sẽ dự báo hàng dấu sau hành động. Đánh thường/Phòng thủ không có nhãn giả.

Màn chi tiết nhân vật có giả định số dấu đúng và số đồng đội góp dấu, bắt đầu ở 0 thay vì mặc định kết quả tốt nhất.

SVG học viện dùng xanh mực, trắng ngà và vàng cổ: sách mở, cột vòm, đồ hình và ba mệnh đề. Đây là lớp riêng trong bàn đấu để cùng tồn tại với Magnamut. VFX trang sách và vòng đồ hình giới hạn một hiệu ứng đang chạy, tối đa ba trang, không dùng vòng lặp hạt mỗi frame. ID hình ảnh ổn định theo hành động để cập nhật React không phát lại hiệu ứng cũ; bộ nhớ chống lặp giới hạn 64 ID. Tôn trọng tốc độ chiến đấu và giảm chuyển động.

## Ví dụ sử dụng

Sắp nhịp Auguste → Iris → Fran → Lisbeth. Auguste mở giảng đường; Iris buff tạo Dẫn; Fran giảm RES tạo Phá; Lisbeth dùng một kỹ năng sát thương tạo Kích. Trong Vòng Phụ, Auguste có thể chốt 1080% MAG, xuyên 50% RES và +9 MAG căn bản.

Nếu Fran đi trước Iris thì hàng là Phá → Dẫn → Kích. Có thể trả 10 MP và một hành động để đổi hai ô, rồi đợi lượt sau để chốt. Viết lại có thể sửa công thức nhưng giảm lợi ích của nội tại. Cần cân nhắc thời hạn ma trận, thời hạn buff/debuff, MP và nguy cơ người dựng bị hạ.
