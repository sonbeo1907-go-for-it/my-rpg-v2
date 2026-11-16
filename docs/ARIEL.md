# Ariel — Sân Khấu lớp 7A; giới hạn Sơ Hở của Rotary

Triển khai 16/11/2026. Quyết định người dùng chốt: Ariel **chỉ thêm dữ liệu, chưa mở nguồn nhận**, không vào gacha/rate-up/đổi vé. ID `ariel`, release #113, Học viện Ma pháp (`magic_academy`), tag `class_7a`; Hỗ trợ tấn công hệ Thủy. Save cũ thêm tiến trình khóa, không tự cấp sở hữu.

## Bộ kỹ năng

Chỉ số/MP chưa được chỉ định dùng cấu hình playtest: HP165, MP125, ATK10, MAG34, DEF15, RES23, SPD23. Đánh thường phép Thủy theo MAG. Không thêm Trấn hay Thông Thạo.

| Kỹ năng | MP / CD | Hiệu quả Rank 1 |
| --- | --- | --- |
| Khúc Ca Thanh Xuân | 16 / 3 vòng | Toàn đội +20% ATK và MAG trong 6 lượt chính người nhận |
| Tâm Điểm Ánh Đèn | 10 / 1 vòng | Một đồng đội nhận buff cho **một kỹ năng phép hợp lệ kế tiếp**, cộng sát thương bằng 120% MAG hiện tại của Ariel lúc cấp |
| Sân Khấu — Thanh Xuân Rực Rỡ | 18 / 2 vòng | Sân Khấu riêng theo phe trong 4 vòng; toàn đội +20% SPD |

Nội tại **Cùng Nhau Tỏa Sáng**: khi Ariel còn sống và Sân Khấu của mình còn hiệu lực, kỹ năng phép ngoài Quang/Ám của phe mình được khuếch đại 20%. Tính cả bản thân và Liên kích kỹ năng; không tính đánh thường, phản công, DoT, tự động không phải kỹ năng hoặc sát thương vật lí. Xét hệ của từng hit; hit mang hệ bị loại không hưởng khuếch đại. Không phụ thuộc hệ nhân vật hay chỉ số dùng để scale — Luka scale ATK vẫn được hưởng khi gây phép Phong.

Nội tại là lớp nhân ×1,2 riêng, không phải buff damage amp cạnh tranh theo quy tắc lấy lớn nhất. Không tăng theo Rank.

## Tâm Điểm Ánh Đèn: hợp đồng sát thương

- Chốt **MAG động của người cấp** lúc áp buff thành `flatSkillBonus`. Ariel gục hoặc thay MAG về sau không đổi lượng đã cấp. Cùng status dùng lại làm mới, không cộng hai lần. Phong Ấn chặn cấp, xóa buff loại bỏ bình thường.
- Buff một lần, không có thời hạn lượt. Kỹ năng công kích phép hoặc Liên kích kỹ năng hợp lệ có thể tiêu; đánh thường, Phòng thủ, phép hỗ trợ, vật lí, phản công, DoT và gear echo không tiêu. Không tự dùng ngay trong chiêu vừa cấp khi buff chưa nằm trong snapshot đầu cast.
- Chia tổng lượng cộng theo **số hit phép được khai trên toàn kỹ năng**; không chia cho số địch. Chiêu phép AoE hai hit: mỗi hit trên mỗi địch nhận nửa lượng cộng. Chiêu lai chỉ đếm hit phép. Với hit chỉ đánh mục tiêu chính, địch phụ chỉ nhận phần ứng với hit thực sự đánh vào họ; phần thiếu/né/gục sớm không phân bổ lại.
- Cộng vào sát thương nền trước RES, khuếch đại, điểm yếu, kháng, giảm sát thương, khiên và soft cap PvP. Không nhân thêm hệ số kỹ năng hoặc Rank của người nhận lên phần cộng. Rank của **chiêu cấp buff** tăng lượng cộng 10%/rank.
- Buff tiêu một lần sau toàn cast có hit phép gây sát thương HP/khiên, không tiêu theo từng hit/mục tiêu. Né hoàn toàn giữ buff. Skill nhiều phần vật lí/phép: chỉ phần phép nhận bonus và có thể tiêu.
- Không loại Quang/Ám ở buff này: giới hạn hệ chỉ thuộc nội tại Sân Khấu. Một kỹ năng phép Quang/Ám vẫn có thể dùng Ánh Đèn.
- Chuỗi Gairyu: Ánh Đèn được tiêu cho chiêu phép hợp lệ đầu tiên, không lại cộng vào cả hai Liên kích; các Liên kích vẫn hưởng Sân Khấu nếu đủ điều kiện.

Ví dụ Rank1, Ariel34MAG: bonus40,8. Luka dùng180%ATK ở34ATK, địch0RES: sát thương nền61,2+40,8=102; có Sân Khấu thành122 sau làm tròn. Nếu Luka tăng Rank, chỉ phần61,2 tăng theo Rank Luka; bonus dựa trên Rank của chiêu Ariel.

## Sân Khấu: hợp đồng thời gian

- `performance_stage` tạo state trên actor nguồn, `expiresAfterRound = vòng tạo + 4 − 1`. Vòng tạo tính là vòng đầu; hết sau toàn Vòng Phụ của vòng cuối. Choáng/lượt thêm/boss nhiều move không làm trôi thêm clock. Dùng lại làm mới, SPD không cộng dồn; nhiều nguồn cùng phe lấy mạnh nhất.
- Không phải status/buff/đòn đánh hoặc combatMode. Không bị Phong Ấn, xóa buff hoặc làm tăng các nội tại đếm buff. Không ghi đè Monica/Auguste, không đổi nền/BGM, Arena không có overlay đối thủ.
- Tăng SPD cho cả phe, gồm Ariel. Reorder chỉ những ô chưa hành động, giữ lịch sử và ô hiện tại. Không tự cấp lượt hoặc lặp người đã đi. Hết hạn trả đúng SPD cũ ở vòng kế.
- Ariel gục: nội tại khuếch đại ngừng ngay; SPD của Sân Khấu vẫn tồn tại đến deadline đã hẹn. Hồi sinh trong deadline có thể hưởng lại nội tại; không tự tạo lại sân khấu đã hết.
- Wave dungeon/truyện giữ actor và deadline tuyệt đối, không gia hạn; phase boss cùng battle không reset. Encounter khác trong phiên pháo đài theo adapter HP/MP-only nên không giữ Sân Khấu. Trận mới/Đánh lại sạch state. Snapshot/forecast clone được, không sửa live/RNG.
- Buff Khúc Ca Thanh Xuân đếm 6 **lượt chính người nhận**, gồm lượt chính được Rotary chuyển; Extra không trừ, Choáng lượt chính vẫn trừ. Lượt cấp mới không bị trừ ngay.
- CD theo luật chung: CD1 castR sẵn sàngR+2; CD2 sẵn sàngR+3; CD3 sẵn sàngR+4. Sân Khấu4 vòng cho phép làm mới trước khi hết. Buff6 lượt có thể còn3 lượt khi CD3 vừa hết nếu nhịp một lượt chính/vòng thông thường.

## Rotary: kết quả rà soát

Trước sửa, `bound_exposure` chỉ đọc `ally.element`, không đọc `additionalElements` hoặc tag Hồn Kiếm. Vì vậy Tsukiha (hệ chính Hỏa, đòn Hỏa/Hồn Kiếm) vốn khiến Rotary tạo Sơ Hở Hỏa, **không** Hồn Kiếm. Roster hiện chưa có ai dùng `sword_soul` làm hệ chính.

Tuy nhiên handler cũ chưa cấm tường minh: nếu người nhận có hệ chính Hồn Kiếm, nó sẽ tìm được `exposure_sword_soul`. Đã thêm data `excludedElements:["sword_soul"]` cho Kim Châm và kiểm tra trong handler/validator/tooltip. Hệ không hợp lệ không tạo hoặc thay Sơ Hở cũ, không chặn sát thương Ám của Kim Châm. Không thay quy tắc của người tự hành động trong lượt Rotary chuyển.

## Reusable và kiểm chứng

- `performance-stage.js`: stage/expiry/relative team, bonus hit, predicate kỹ năng phép, snapshot total và validator. `performanceModifiers` tách khỏi status và trường thời gian.
- Status `flatMagicSkill:true`, `damageUses:1`, persistent; effect status khai `flatSkillScaling:{stat:"magic",multiplier:1.2}`. Rank resolver tăng hệ số; applyStatus lưu snapshot; charged-buffs chỉ tiêu khi context ghi nhận hit phép hợp lệ. Cơ chế dùng chung, không kiểm tên Ariel.
- AI dùng cùng forecast, hiểu trường Sân Khấu độc lập và ưu tiên buff phẳng cho người có kỹ năng phép, không đặt lên đồng đội chỉ đánh vật lí.
- Giao diện hiển thị Sân Khấu và số vòng còn lại tại card nguồn; tooltip buff ghi nguồn/snapshot, số lần. Không phải VFX dành riêng lớp Thuật Sư.
- Test: `test/ariel.test.js`, `test/rotary.test.js`; full suite, validate/typecheck và browser fixture production. Không chỉnh save thật hoặc mở khóa nhân vật chỉ để nghiệm thu.

Kiểm tra cuối: 1.686/1.686 test engine qua (23 ca Ariel/Rotary mới), validate và TypeScript qua; 2/2 E2E production qua ở 1440/768/390 px. Đã xem ảnh card Sân Khấu và trang kỹ năng, không tràn ngang. Graph code cập nhật cục bộ; không dùng semantic/cloud extraction.

Bản desktop đã build thành công: release EXE và NSIS installer; tên EXE/namespace save cũ được giữ nguyên để tương thích.
