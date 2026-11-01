# Quyển II — Những Phiên Gác Không Yên

Nguồn: [GDD Fortress Session + Chelsea v1.2](https://docs.google.com/document/d/1UNubGkLCd9weZJcm_DrEZb6HjzWCBm9lNQ24avZ4-Bs/edit?tab=t.0).

## Luồng và phạm vi

Kệ sách → xác nhận → phiên pháo đài → di chuyển giữa 10 khu → rời qua cổng sau xác nhận. Đổi URL, Back, đóng game và trận thắng không kết thúc phiên. Quyển I giữ cơ chế pending theo địa điểm. Quyển II có duy nhất một activeEvent; dịch vụ giấy tờ, vật tư và đối chiếu không bốc sự kiện mới.

10 intro, 30 hoạt động thường, 10 tương tác điều kiện và 1 finale. Chỉ intro tính tiến độ bìa. Bí mật không nằm trong pool hay DOM trước điều kiện; Ghi chép và Túi đồ chỉ hiển thị thông tin đã tìm thấy. Miraebolis không được nhắc trước khi giao chiến. Finale dùng nguyên template Miraebolis Lv1; hậu chiến mới mở quyền thử Miraebolis Hiểm Ác. Alice và cờ quyền cũ giữ riêng.

## Quyết định tích hợp

- Dùng `/art/chronicles/book2/`, theo yêu cầu trực tiếp trước đây của người dùng “arts bỏ s đi”. Không đổi prefix hay di chuyển asset Quyển I. Đây là khác biệt có chủ ý so với `/arts/` trong GDD.
- Save v7/Chronicle v1 được mở rộng theo cách cộng thêm: `books.book2`, `inventory`, `activeSession`, `nextSessionId`. Save thiếu các trường này được bổ sung mặc định; dữ liệu Book1, quota và quyền Alice không bị xóa.
- Mỗi thao tác clone state, kiểm tra session token và điều kiện, rồi persist trước khi công bố thành công. Move cũng tăng revision nhưng không dùng RNG. Chance chỉ chốt một lần/instance, không đổi khi reload hoặc ra vào cổng.
- Rời cổng chuyển nguyên activeEvent sang suspendedEvent; vật tư chưa giao chuyển custody `stored`. Khi quay lại nhận đúng lô bằng dịch vụ ở kho/quân y. Bản ghi đã bàn giao vẫn ở hồ sơ, không nhân lại.
- Một số việc hành chính có thể kiểm tra lại; không sinh thưởng, giấy tờ hoặc vật tư trùng. Lệnh xuất kho chỉ có scope lô bảo dưỡng pháo. Chelsea không thay thẩm quyền quân sự. Thiếu nhân vật chuyên biệt vẫn có đường thủ tục.

## Hỗ trợ

Pháo: giao thùng + thay linh kiện + khôi phục báo hiệu + hiệu chuẩn. Quân nhu: giao thùng thuốc + đối chiếu bản kê. Không cần các sự kiện ẩn để bật hỗ trợ.

Các trận `category:chronicle`, `bookId:book2`, `chronicleKind:fortress_defense` nhận snapshot modifier. Pháo ATK/MAG +20%; quân nhu ATK/RES +10%; cộng cùng nhóm thành ATK +30%, MAG +20%, RES +10%. Modifier nằm ngoài status, không dispel và không đếm là buff. Không áp dụng nội chiến/tỷ thí, Quest, Dungeon hoặc Hiểm Ác. Giữ qua pha và snapshot, không cập nhật giữa trận.

Các trận độc lập bắt đầu HP/MP đầy. Thua/rút lui giữ instance và seed để thử lại. Không thưởng EXP, nhiệm vụ ngày hay tiền tệ từ combat Chronicle. Thưởng hoạt động thường chỉ khi kết thúc scene; quota 28/tuần dùng chung toàn bộ Chronicle, chốt theo tuần lúc hoàn thành.

## Artwork và kiểm thử

35 SVG gốc: bìa, 10 cảnh, 4 biến thể, 19 đạo cụ, 1 overlay. Không nhân vật vẽ cố định; không script, text nhúng, ảnh hay tham chiếu mạng ngoài. Nút và chữ là HTML, tương thích chuột, bàn phím và tay cầm. LB/RB di chuyển lựa chọn khu; B về kệ nhưng giữ phiên.

`test/fortress.test.js` kiểm tra phiên, scope, nhiều nhánh G01, dịch vụ, suspend/custody, idempotency, migration, quota, battle snapshot và hỗ trợ qua pha. Bộ UI test kiểm tra kệ/xác nhận, move không bốc event, drawer/focus, reload, thủ tục kho, ra cổng và mobile. Cân bằng hệ số quân nhu vẫn là cấu hình playtest như GDD.
