# Clark — Điểm tựa lớp 7A

Triển khai 17/11/2026. Hỗ trợ phòng thủ hệ Thổ, Học viện Ma pháp (`magic_academy`, `class_7a`), ID `clark`, release115. Tiếp tục dạng dữ liệu chưa mở nguồn nhận của nhóm7A: không gacha, rate-up hay đổi vé; save cũ thêm tiến trình khóa. Không có Trấn/Thông Thạo mới.

## Bộ kỹ năng

Chỉ số playtest (người dùng chưa chỉ định): HP180, MP120, ATK10, MAG32, DEF22, RES24, SPD18. Đánh thường phép Thổ theo MAG.

| Kỹ năng | MP / CD | Hiệu quả |
| --- | --- | --- |
| Sơ Cứu Chuẩn Mực | 8 / 0 | Hồi180% MAG cho một đồng đội rồi gắn1 Hộ Ấn |
| Chấn Chỉnh Thuật Thức | 10 / 0 | Toàn địch giảm20% ATK/MAG trong3 lượt chính của người nhận |
| Giờ Nghỉ An Toàn | 20 / 3 | Toàn đội có Regen25% HP tối đa đầu lượt và giảm15% sát thương nhận vào, duy trì3 vòng |

Chiêu hồi tăng10% lượng hồi mỗi Rank theo luật chung. Hộ Ấn giữ1 lần. Hai chiêu tiện ích còn lại cố định: debuff20%, Regen25% và giảm đòn15% không tự tăng theo Rank, như các hiệu ứng tiện ích phần trăm hiện hữu. MP/CD là cấu hình playtest. Không áp buff căn bản hoặc damage amp ở đây.

## Nội tại — Chu Toàn Đến Cùng

Khi **Clark** hồi trực tiếp cho đồng đội và người ấy đầy HP sau hồi, giải đúng1 debuff. Tính cả người đã đầy HP trước đó và cả bản thân. Không đòi actual HP gained >0; không kích nếu yêu cầu hồi bằng0, hồi bị chặn, mục tiêu gục/Oán Hận, Clark gục, khác phe hoặc HP sau hồi chưa đầy.

- Trừ giảm hồi/Vết Thương Sâu, thanh toán Khế Ước rồi mới xét HP đạt đầy. Không giải trước để tránh tăng lượng hồi của chính lần đang xử lý.
- Hồi bị Khế Ước của Verena chặn không giải, kể cả HP đầy. Không hồi sinh người gục bằng nội tại.
- **Không tính Regen**: status.regen và hồi trì hoãn đầu lượt được đánh dấu periodic. Không suy từ tên/label của hiệu ứng.
- Không có hạn mức mỗi vòng. Mỗi lần hồi trực tiếp đủ điều kiện giải1, theo thứ tự debuff thực đang lưu; không gỡ status ảo từ combatMode, không gỡ buff. Không còn debuff thì không phát sự kiện nội tại/cleanse giả.
- Kỹ năng hồi trước rồi cấp Hộ Ấn: nội tại giải sau hồi, trước bước cấp Hộ Ấn. Hộ Ấn vẫn chỉ chặn debuff mới, không thay cho cleanse.
- Nguồn hồi trực tiếp khác không được mượn nội tại Clark. Hồi trực tiếp do gear của Clark được quy về nguồn Clark theo đường healHp chung; Regen vẫn bị loại.

## Thời hạn và vòng đời

Chiêu bảo vệ dùng clock **round** để bảo đảm downtime1 vòng độc lập tốc độ/lượt phụ. Dùng vòngR: duy trìR..R+2, hết sau toàn Vòng Phụ ởR+2; vòngR+3 không có, CD hết ở đầuR+4. Ví dụR1 → hiệu lực1/2/3, trống4, dùng lại5. Dùng lại làm mới deadline, không cộng thêm tỷ lệ.

Regen tuân nhịp đầu lượt hiện tại, gồm lượt chính/lượt phụ và trước kiểm tra Choáng; không phải hồi ngay lúc cast. Được cấp trước lượt thì có thể hồi ở đầu lượt sắp tới. Mỗi lần hồi theo25% HP tối đa hiện tại, qua giảm hồi/nợ như thường. Vòng Phụ không trừ deadline round, cũng không giảm CD. Clark gục không tự xóa buff đã cấp; Regen tiếp tục nhưng không kích nội tại.

Debuff dùng clock3 main_turn người nhận: Extra không trừ, Choáng ở lượt chính vẫn trừ. Hộ Ấn là charge1, không theo lượt. Wave/phòng cùng chuyến giữ actor/status/CD/deadline; phase boss cùng trận không reset; encounter pháo đài mới chỉ HP/MP theo adapter. Trận độc lập/Đánh lại sạch state. Snapshot/forecast không sửa live/RNG hoặc cleanse thật.

## Tích hợp và nghiệm thu

`healHp` nhận cờ periodic riêng ở tham số cuối; Regen không bị nhận nhầm thành hồi trực tiếp chỉ vì dùng cùng helper. Native cấu hình `full_hp_heal_cleanse`, count hợp lệ1..5; Clark dùng1. Không sửa cơ chế Amaryllis, gear healer hay cleanse toàn bộ của nhân vật khác. Hai phe Arena dùng source/target/team tương đối, không hardcode party. AI dùng forecast chung để thấy HP, debuff được giải và buff bảo vệ.

`test/clark.test.js` kiểm tra đầy sẵn/đạt đầy/chưa đầy, nguồn hồi khác, bản thân, Regen/Extra, thời hạn thật qua Choáng, downtime, giảm hồi/Khế Ước, Hộ Ấn, Rank, lệnh lỗi, mirror Arena, carry/snapshot và copy. E2E dùng save giả để xem kỹ năng và hồi trong trận; không sửa save thật.

Nghiệm thu17/11: 1.729/1.729 kiểm thử engine qua (18 ca Clark), validate và TypeScript qua;2/2 E2E production qua ở1440/768/390px. Đã xem ảnh kỹ năng mobile và hồi vào người đầy HP trong trận; không tràn ngang. Graph code cập nhật cục bộ, không semantic/cloud.
