# Gear IV bảo hộ và Liên kích — 12/11/2026

Tám công thức phổ thông mở sẵn ở Rèn Hiệu Ứng, giá 2.400 Vụn + 12.000 Coin + 1 Gear III chưa trang bị. Mỗi người chỉ mang một món cùng nhóm/tên. Giữ ID instance, lưu v7, ô trang bị và luật chế tạo hiện hành; không tặng miễn phí.

| Gear | Chỉ số thường trực | Hiệu ứng |
| --- | --- | --- |
| Ấn Ước Thành Lũy | DEF/RES+15% | Sau kỹ năng tạo Khiên: toàn đội giảm15% sát thương trực tiếp hết vòng sau |
| Di Vật Tiếp Khiên | HP+15% | Khi địch phá Khiên đồng đội: Khiên mới35% MaxHP của người mặc, 1 lần/người/vòng |
| Đồng Hồ Tái Thiết | HP+15% | Đầu lượt chính: giảm1 CD của chiêu hồiHP/tạoKhiên có CD còn lại dài nhất |
| Huy Hiệu Toàn Vẹn | ATK/MAG+15% | ĐầyHP: tổng tăng30% |
| Huy Hiệu Quyết Tử | ATK/MAG+20% | Dưới70%HP: tổng tăng40% |
| Lưỡi Cắt Dư Âm | ATK/MAG+12% | Chiêu đơn mục tiêu: Liên kích85% sức mạnh chiêu vào tối đa2 địch khác, 1 lần/vòng |
| Lăng Kính Ách Nạn | MAG+15% | Liên kích90%MAG vào địch có2 loại debuff; từ4 loại là180%MAG |
| Khúc Hòa Ca Hồi Sinh | MAG+15% | HồiHP thực bằng kỹ năng/nội tại:6MP toàn đội, người được hồi giảm10% sát thương hết vòng;1 lần/phe/vòng |

## Đồng hồ, nhận sát thương và cooldown

Ấn Ước kích theo kỹ năng chủ động có effectshield, kể cả Khiên không thay được Khiên đang mạnh hơn; không từ Đánh thường/Phòng thủ/phản ứng/tự động. Buff theo clockround, castR tồn tại đến hếtR+1, tính cả Vòng Phụ. `directDamageReduction` chỉ tham gia resolveHit (vật lí/phép, Đánh thường/Liên kích/phản công), không giảm Độc/DoT/chi phíHP. Cộng vào lớp giảm sát thương chung, chịu trần75%. Dùng lại làm mới, không cộng nhiều bản cùng status; có thể bị Phong Ấn/xóa buff theo luật chung. Chủ gục không xóa sớm buff đã cấp.

Di Vật xét Khiên thực bị địch đưa về0 sau hit, người nhận phải còn sống; xét cả chính người mặc như đồng đội. Không kích vì hết hạn, tự xóa Khiên hoặc thân thiện. Hoàn tất nội tại vỡ Khiên cũ (Elaine/Victorina/nhện) trước khi tạo Khiên mới. Khiên dựa MaxHP hiện tại của chủ gear, nguồn là chủ gear, chịu Rạn Khiên và luật mạnh nhất. Mỗi chủ có hạn mức riêng, main/extra chung vòng; reserve trước tạo. Không hồi sinh, Oán Hận vẫn chặn Khiên. Nhiều hit có thể đánh tiếp vào Khiên mới, không cấp lại trong cùng vòng bởi cùng chủ.

Đồng Hồ xử lý ở đầu lượt chính sau DoT, trước kiểm tra Choáng; chủ đã gục không kích. Giảm đúng1 kỹ năng có CD còn lại lớn nhất trong số kỹ năng đang có effectheal/shield và CD>0. Hòa chọn theo thứ tự abilities. Không giảm chiêu utility/biến hình/Đánh thường/hồi sinh thuần; không giảm trong Extra. Có thể đưa CD về0 để dùng ngay lượt đó. Không nhân Rank/Thông Thạo, không cộng thêm lần do nhiều người hành động.

## Chỉ số theo HP

Điều kiện được tính lại theo HP/MaxHP hiện tại ở mỗi lần đọc chỉ số, không tạo buff có thời hạn, không thể dispel. Toàn Vẹn đầyHP nhận30%, mất dù1HP về15%; Quyết Tử đúng70% vẫn20%, dưới70% lên40%. Chỉ phần tăng của chính món được nhân đôi, không nhân buff/gear khác. Lưu phần bonus căn bản để đổi điều kiện không bake/chồng stat nhiều lần; phần trăm buff chiến đấu áp sau như các chỉ số gear hiện tại. Chuẩn bị giả định đầyHP, hai phe Arena giống nhau.

## Liên kích

Lưỡi Cắt kích khi thi triển kỹ năng chủ động đơn mục tiêu có damage, kể cả đòn gốc bị né; Ách Nạn cần mục tiêu thực nhận sát thươngHP hoặc Khiên; không từ Đánh thường, Độc, Phòng thủ, phản công, Liên kích hoặc xung tự động. Liên kích gear là ngoại lệ tự truy kích theo trang bị, không thay predicate FuA từ đồng đội. Reserve hạn mức trước hit; dùng PvP automatic budget và soft cap phản ứng như nguồn khác, không tự tạo lượt/thu tài nguyên/MP/CD.

Lưỡi Cắt chụp phần damage đã resolve Rank/nguồn scale/tài nguyên của từng hit mục tiêu chính. Gói thuần damage dùng85% hệ số, kế thừa loại sát thương, nguyên tố (gồm đa hệ) và xuyên đã có trên damageeffect. Không copy debuff, buff, giải/xóa buff, hồi/tài nguyên, triệu hồi hay utility. Không copy sát thương cuối sau DEF/RES, giảm sát thương hoặc overkill. Tối đa2 địch khác còn sống gần ô mục tiêu chính nhất, hòa theo thứ tự ô, không nối vòng, không thêm RNG. Có thể kích sau khi mục tiêu chính gục; không có địch khác thì không tiêu hạn mức. Một chiêu nhiều hit chỉ tạo một đợt Liên kích, chứa gói damage từng hit; mỗi địch tự tính DEF/RES/né/điểm yếu/Khiên. Không đệ quy.

Ách Nạn xét từng địch còn sống thực nhận damage, sau chiêu gốc. Đếm **loại** debuff khác nhau, không đếm stack, xét cả debuff vừa gắn; chiêu nhiều hit chỉ một Liên kích/địch. Có2–3 loại:90%MAG; từ4:180%MAG. Loại sát thương và hệ lấy từ hit đầu hợp lệ trên địch đó, luôn scaleMAG. Không có hạn mức vòng ngoài chống lặp/PvP chung; không nhân Rank vì đây là hệ số gear cố định. Hai gear có thể cùng kích từ một chiêu, không kích lẫn nhau.

## HồiHP → MP, kiểm tra Elaine

Chỉ HP thực tăng mới được tính sau giảm hồi, trả nợ, chặn hồi và capHP; không tính hồi0/overheal, trả Khế Ước mà chưa tăngHP, hồi sinh, hút máu hoặc hồi riêng từ gear. Xét kỹ năng heal và nội tại hồiHP (Elaine vỡ Khiên, Minerva phản ứng debuff). Xét cả bản thân nếu nằm trong phạm vi hồi.

Hạn mức **phe + effectGroup + battle.round**. Nguồn hồi đầu tiên thành công trong vòng giữ quyền cho lần hồi đó:6MP toàn đội một lần, kể cả người không được hồiHP; mỗi người chịu capMP riêng. Tất cả người thực được hồi trong cùng hành động đó nhận giảm10%, không chỉ người đầu tiên. Theo tokenhànhđộng: AoE/heal nhiều hit và nhiều Khiên vỡ từ cùng AoE địch dùng chung token, không phụ thuộc thứ tự actor. Nguồn khác hoặc lần hồi sau trong cùng vòng không kích lại, kể cả Extra. Buff hết cuối vòng hiện tại, không kéo đến lượt cá nhân kế. Chặn buff không hoàn hạn mức, MP đầy vẫn cho phép kích để cấp giảm sát thương. Reserve trước sideeffect, không vòng lặp MP→heal.

Nội tại Elaine có thể kích ngoài lượt cô: khi Khiên do cô tạo bị phá, healHp truyền context của đòn địch tới hook gear. Vì thế AoE phá nhiều Khiên hồiMP một lần nhưng bảo vệ mọi người thực được hồi. Chủ gear phải còn sống. Gear không đòi cast thêm hành động chủ động và không quét log để đoán nội tại.

## Carry và nghiệm thu

Stat, limiter theo snapshot xuất phát/carry hiện hành. Wave/phase cùng trận giữ hạn mức của vòng, không tự reset do thayphase; trận độc lập có hạn mức mới. Forecast clone toàn state, không tiêu ngân sách trận thật. Không thay save cá nhân, nền hay BGM.

`test/guardian-gear.test.js`: conditional stat/ngưỡng70%, hạn buff, Khiên vỡ, main/extra cooldown, copy multi-hit/đếm debuff, healer chủ động Armie/Ardelia/Cedric, nội tại Elaine, AoE/overheal/nợHP/forecast/hai phe. Full engine + validate/typecheck. E2E công thức và inventory cùng component T4 hiện hành, desktop/mobile; reduced motion dùng hệ thống sẵn có.
