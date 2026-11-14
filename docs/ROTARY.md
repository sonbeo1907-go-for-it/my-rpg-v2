# Rotary — Voodoo và chuyển lượt chính

Nhân vật chính thức #110, `magic_academy`, khoa Sinh học, Câu lạc bộ Thần Bí Học. Thuật Sư hệ Ám. Có trong Chiêu Mộ thường và roster bổ sung theo phe từ 13/11/2026; save cũ thêm tiến trình khóa, không tự tặng nhân vật. Không thêm Trấn hay Thông Thạo.

## Bộ kỹ năng

| Kỹ năng | Hiệu quả Rank 1 | Chi phí playtest |
| --- | --- | --- |
| Voodoo — Sợi Chỉ Đồng Mệnh | Chọn một đồng đội khác, liên kết Voodoo trong 5 lượt chính của người nhận | 18 MP, không CD |
| Búp Bê Hộ Mệnh | Khiên 180% MAG và 1 Hộ Ấn cho đồng đội mang Voodoo của mình | 10 MP, không CD |
| Kim Châm — Dấu Ấn Giao Cảm | 220% MAG phép Ám một địch; nếu gây sát thương HP/khiên, tạo 1 Sơ Hở theo nguyên tố của đồng đội Voodoo | 8 MP, không CD |

Nội tại: người mang Voodoo +25% ATK/MAG. Đầu vòng có liên kết còn hiệu lực, Rotary nhận 1 Lượt Thêm theo giới hạn chung một lượt/người/vòng.

Chỉ số Lv1 playtest: HP 165, MP 135, ATK 10, MAG 33, DEF 16, RES 25, SPD 19. Người dùng chốt cơ chế và hệ số, chưa chỉ định bộ chỉ số hay MP/CD; các giá trị còn lại là cấu hình triển khai để thử nghiệm. Khiên và đòn phép tăng theo Rank thông thường. Voodoo chỉ giảm MP theo Rank, không tăng nội tại 25% hay thời hạn. Hộ Ấn dùng status chung, tồn tại đến khi tiêu hoặc kết thúc theo luật chung.

## Hợp đồng lượt được duyệt

- Voodoo có một người nhận khác Rotary tại một thời điểm. Gắn thành công cho người mới xóa liên kết cũ; làm mới cùng người trở lại 5 lượt. Nếu buff mới bị Phong Ấn chặn, giữ liên kết cũ. Dùng quy tắc buff thường về xóa buff/Phong Ấn; không phải combatMode hay trường toàn bàn.
- Chỉ thay **lượt chính** của Rotary. Người nhận giữ lượt tự nhiên và quyền Lượt Thêm của mình. Các lần hành động được chuyển vẫn là lượt chính: DoT, đầu lượt, thời hạn theo lượt chính, mode theo lượt và cuối lượt chạy trên người thực sự hành động.
- Voodoo giảm ở cuối mỗi lượt chính của người nhận, gồm cả lượt tự nhiên và lượt Rotary chuyển sang; lượt chính bị Choáng cũng giảm. Không giảm do lượt phụ hoặc phản ứng. Liên kết mới không bị trừ ngay trong hành động của Rotary.
- Đầu vòng xét liên kết một lần để cấp Lượt Thêm cho Rotary. Thi triển Voodoo giữa vòng không tự cấp lượt phụ ngay. Quyền đã được cấp vẫn còn nếu liên kết hết sau đó; vòng kế không cấp khi liên kết đã hết. Các nguồn cấp lượt khác dùng chung trần một Lượt Thêm, không cộng thêm.
- Rotary bị Choáng vẫn chuyển lượt. Ô lượt gốc vẫn xử lý DoT, hồi phục, đầu lượt, thời hạn và mode của Rotary; không đóng băng các hiệu ứng trên cô. Sau bước này mới bắt đầu lượt của đồng đội. Lượt phụ của Rotary vẫn tuân theo Choáng như thường.
- Người nhận bị Choáng khi bắt đầu lượt chuyển sẽ mất lượt đó, không trả lượt về Rotary. Nếu người nhận đã gục trước khi đến ô lượt Rotary: Voodoo mất và Rotary hành động. Nếu người nhận gục vì DoT đầu chính lượt được chuyển thì lượt đã bắt đầu bị mất như lượt bình thường, không cấp lượt bù.
- Rotary gục, kể cả do DoT ở ô lượt gốc: xóa Voodoo ngay, không chuyển lượt từ nguồn đã gục. Người nhận gục cũng xóa Voodoo. Hồi sinh không khôi phục liên kết cũ.
- Không chuyển tiếp đệ quy qua nhiều người. Một ô lượt chỉ có một người hành động được chốt; trạng thái hết ở cuối lượt thứ năm không làm đổi ngược người đang thực hiện lệnh.

## Engine, giao diện và lưu trận

`turn-delegation.js` là module dùng chung: `bind_turns`, `bound_exposure`, `turnDelegation` và nội tại `turn_delegate`. Không hardcode tên nhân vật trong luật lượt. Giữ `queue` và SPD theo chủ ô gốc; `delegatedTurn` lưu chủ ô/người hành động/vòng/pha/con trỏ. `activeActor` và kiểm tra lệnh dùng người hành động. Không ghi đè kỹ năng, tài nguyên hay ID đơn vị của người nhận.

`beginTurn` chọn chủ ô, xử lý vòng đời nguồn, chốt người nhận rồi gọi `beginActorTurn`; `advance` xóa phép thay người của ô vừa kết thúc. `skipStunnedTurn` dùng chung cho lượt bình thường và lượt chuyển. `onActorDefeated`/`checkOutcome` dọn liên kết mất nguồn. Forecast clone không đổi trạng thái thật.

Thanh thứ tự dùng `turnOrderEntries`: key theo chủ ô, hiển thị người thực hiện + nguồn Rotary. Hai ô cùng người nhận có key khác nhau nên không mất ô hoặc lỗi React. VFX búp bê và chỉ ma thuật chỉ gắn vào card người mang status, không đổi nền/BGM; mất status thì VFX mất. Reduced motion giữ dấu nhận diện tĩnh.

Mirror Arena dùng actor ID riêng, phe tương đối với nguồn; buff/tài nguyên/kỹ năng/Rank và soft cap vẫn theo người thực sự hành động. AI biết triển khai liên kết, ưu tiên đồng đội có đầu ra tấn công và không làm mới liên tục khi còn thời hạn.

Qua wave/phòng dùng actor carry hiện hành: giữ status và thời hạn còn lại; ranh giới vòng mới xét quyền phụ một lần. Phase boss trong cùng battle không tự cấp lượt hay reset liên kết. Snapshot Chronicle lưu cả `delegatedTurn` và quyền phụ; restore không gọi lại đầu lượt/đầu vòng. Encounter mới trong phiên pháo đài chỉ giữ HP/MP theo adapter chung, không mang Voodoo sang.

Kiểm chứng: `test/rotary.test.js` chạy luồng engine thật cho chuyển lượt, 5 lượt chính, quyền phụ, Choáng hai phía, Độc giết nguồn, người nhận gục, đổi/chặn liên kết, Ward/Sơ Hở, save/forecast/snapshot và hai phe. Bổ sung kiểm tra giao diện cho ô lượt trùng người nhận, VFX cục bộ, thao tác lượt chuyển và các kích thước màn hình.
