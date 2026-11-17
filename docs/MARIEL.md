# Mariel — Tấm khiên lớp 7A

Triển khai17/11/2026. Thủ Hộ hệ Thường, thành viên Học viện Ma pháp/lớp7A (`magic_academy`, `class_7a`), ID `mariel`, release116. Chưa vào gacha/rate-up/đổi vé; save cũ thêm tiến trình khóa. Chưa có nguồn nhận, Trấn hoặc Thông Thạo mới. Mô tả trong game tập trung vào vai trò xung phong chắn đòn và quan hệ đồng đội với Ariel.

## Bộ kỹ năng

Chỉ số playtest: HP270, MP110, ATK12, MAG15, DEF22, RES34, SPD14. Đánh thường phép Thường theo MAG. Chỉ số, MP và hồi chiêu chiêu tạo khiên chưa được người dùng chỉ định là cấu hình playtest.

| Kỹ năng | MP / CD | Rank1 |
| --- | --- | --- |
| Kết Giới Không Bỏ Ai | 14 / 1 | Khiên toàn đội bằng150% RES; giải1 debuff trên mỗi người |
| Ôn Tập Kết Giới | 12 / 3 | Toàn đội +35% RES trong4 lượt chính của từng người nhận |
| Cứ Để Tôi Đứng Trước | 12 / 1 | Bản thân Khiêu Khích và Che Chắn toàn đội, +75% RES trong3 lượt chính của Mariel |

Khiên tăng10% mỗi Rank; hai buff RES tăng5% mỗi Rank. Hạn mức giải1 và nội tại +9/15% giữ nguyên. CD theo luật chung: CD1 castR sẵn sàngR+2; CD3 castR sẵn sàngR+4. Lượt Thêm không giảm CD.

## Nội tại — Có Tôi Ở Đây

Người dùng chốt **chỉ người đang có khiên** được +9 RES căn bản và giảm15% sát thương phép; gồm Mariel. Khiên bất kỳ nguồn nào đều tính. Không cần người đó cùng hệ, không cộng theo số đồng đội có khiên. Mariel phải còn sống, Choáng không tắt hào quang. Nếu có nhiều nguồn cùng loại, lấy mạnh nhất cho từng chỉ số/giảm đòn, không cộng lặp.

- +9 cộng vào căn bản trước buff/debuff RES%; không sửa prepared/baseStats, không cộng lại sau mỗi lần đồng bộ. Ví dụ RES34 +9 rồi buff35% là58,05.
- Xét điều kiện trước từng hit. Hit phá khiên hưởng RES/giảm đòn trên toàn hit, gồm phần tràn HP; hit kế tiếp không còn khiên thì mất cả hai. Khiên được cấp lại làm hiệu quả trở lại.
- 15% áp dụng cho sát thương phép trực tiếp, kể cả Liên kích/phản công. Vật lí không nhận giảm đòn này; Độc theo cơ chế DoT hiện hành không phải hit phép. Giảm đòn đi vào nhóm giảm sát thương thông thường, vẫn chịu trần75%.
- Không phải buff/status, không bị Phong Ấn/xóa buff trực tiếp và không tính thêm một buff cho các nội tại đếm buff. Nguồn gục tắt ngay; khiên đã cấp vẫn còn theo quy tắc khiên.
- Hai phe Arena độc lập. Không có nguồn ở phe nào thì không để lại field hào quang rỗng trên actor của phe đó.

## Chốt lượng khiên và giải hiệu ứng

Effect khiên khai `snapshotScaling:true`: chốt RES động của nguồn **trước khi effect áp lên người đầu tiên**, rồi dùng cùng lượng scaling cho cả nhóm. Không tự tăng lượng khiên của các đồng đội đi sau chỉ vì Mariel vừa nhận khiên và bật +9 RES trong chính effect đó.

Ví dụ Rank1, chưa ai cấp khiên cho Mariel, không buff: cả đội nhận51 khiên từ34RES. Sau đó Mariel có43 RES căn bản; lần cast sau có thể tạo65 khiên, hoặc87 nếu đã có buff35% RES. Khiên vẫn lấy mạnh hơn, không cộng dồn; lượng thực nhận có thể khác nếu từng người có Rạn Khiên hoặc khiên cũ mạnh hơn.

Sau effect tạo khiên, `cleanse` có `count:1` giải đúng một debuff thực có trên **mỗi người còn sống**, theo thứ tự đang lưu. Buff không bị gỡ, người gục/địch không bị tác động. Khiên yếu không thay được khiên cũ vẫn thực hiện cleanse. Không có debuff thì không phát cleanse giả; log báo0 hiệu ứng được giải. Nếu `count` không khai thì giữ hành vi giải toàn bộ của các kỹ năng cũ. Clark dùng cùng helper lấy1 debuff, không đổi điều kiện hồi đầy HP của anh ấy.

## Che Chắn, thời hạn và carry

Che Chắn là buff trên Mariel với `coverTeam`, `coverArea`, `coverReactions`: nhận đòn nhắm đồng đội, gồm diện rộng/Liên kích/phản công, như cơ chế Brant hiện hành. Không tự thêm15% giảm đòn chung của Brant/Geoffrey; chỉ có75% RES theo yêu cầu và nội tại phép nếu Mariel đang có khiên. Đồng đội có khiên không chuyển bonus của chính họ sang người nhận thay: đòn xét trạng thái **người thực sự nhận**.

Khiêu Khích/Che Chắn/+75% RES cùng một status,3 lượt chính Mariel; dùng lại làm mới, không cộng dồn. Xóa buff gỡ cả gói. Nguồn phải còn sống để che. +35% RES toàn đội dùng4 lượt chính của từng người, không đếm lượt Mariel thay cho cả đội. Choáng ở main vẫn trừ, Extra không trừ, status mới/refresh không trừ ngay khi cấp.

Wave/phòng cùng chuyến và phase boss giữ khiên/buff/CD theo actor carry; hào quang được tính lại, không biến+9 thành chỉ số vĩnh viễn. Encounter độc lập/Đánh lại sạch state; combat khác trong phiên pháo đài theo adapter HP/MP-only. Snapshot/forecast không sửa live/RNG, không cộng lặp căn bản.

## Tích hợp và kiểm chứng

`shield-guard.js` cung cấp đồng bộ hào quang, lấy debuff theo số lượng và validation; hook đồng bộ hiện hữu chạy ở tính chỉ số/hit/kết toán. Field `shieldGuardBaseBonuses` chỉ là kết quả dẫn xuất, được cộng đúng một lần trong `baseStatValue`. `snapshotScaling` opt-in, không đổi hành vi scaling của kỹ năng cũ. `effect.count` chỉ đổi cleanse khi khai rõ; validate từ1..20.

AI dùng forecast chung, nhận biết khiên/giải debuff/buffRES/Che Chắn. Sử dụng asset Thủ Hộ, khiên và buff hiện có; không có combatMode hoặc nền riêng. Test `test/mariel.test.js` bao phủ nguồn khiên bất kỳ, mất khiên giữa nhiều hit, KO/Choáng, Rank, thời hạn thật, cleanse hạn mức, hồi chiêu, PvP, carry/forecast, copy và malformed data. E2E dùng save giả; không chỉnh save thật.

Nghiệm thu17/11:1.749/1.749 kiểm thử engine qua, gồm20 ca Mariel; validate và TypeScript qua.2/2 E2E production qua ở1440/768/390px; đã xem ảnh kỹ năng desktop và trận có khiên mobile, không tràn ngang. Graph code cập nhật cục bộ.
