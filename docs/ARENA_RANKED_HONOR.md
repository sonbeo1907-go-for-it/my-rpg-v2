# Đấu Trường: Danh Dự và Đấu Hạng

Quyết định đã duyệt ngày 06/11/2026. Đây là prototype AI offline; không có ghép người thật, máy chủ, mùa giải, app admin hay banlist ngoài EXE.

## Luồng và điều kiện

- `/arena` chọn Tìm Trận hoặc Luyện Tập. `/arena/match?mode=normal|ranked` chọn Đấu Thường / Đấu Hạng.
- Đấu Thường: bốn người hiện tại; hai bên Lv50, Rank5, không trang bị/Trấn, mở nâng cấp truyện và phân bổ điểm như prototype cũ.
- Đấu Hạng: cần **16 nhân vật chính thức đã sở hữu**, không tính Astoria. Không yêu cầu 16 người đạt một cấp cụ thể. Dùng cấp, phân bổ, ô đồ, Trấn và kỹ năng thật của người chơi. Thông Thạo chỉ có hiệu lực đến Rank5 trong mọi PvP, không sửa save PvE.
- Luyện Tập giữ ảnh gương và preset; không nhận thưởng, không tăng điểm hay mốc thắng.
- Tìm đối thủ khoảng2,4giây → thông báo đã tìm được trận → Đấu Hạng cấm chung → chọn/cấm → chỉnh thứ tự → tải5–8giây → chiến đấu. Đấu Thường bỏ qua chọn/cấm. Màn chuyển trận hiển thị username VS username.
- Sau kết quả, Tìm trận mới tạo ID/seed/đối thủ mới, giữ lựa chọn thường/hạng. Không tự đánh lại đội trước.

## Chọn, cấm và thứ tự

Trước khi chọn có modal **Cấm trước khi chọn**, mặc định hiển thị toàn bộ91 nhân vật chính thức, gồm chưa sở hữu; Astoria không tham gia. Tái sử dụng tìm kiếm, lọc hệ/vai trò/sở hữu và sắp xếp tên/cấp/chỉ số, tăng/giảm. Chọn một người rồi xác nhận; không cấm ngay khi chỉ focus hoặc đổi sort.

- Đồng/Bạc: **cả trận2 lượt cấm**, mỗi bên1.
- Vàng/Kim Cương/Prisma: **cả trận4 lượt cấm**, mỗi bên2.
- Người chơi cấm trước, rồi AI, luân phiên từng người. AI chờ1,2–1,9giây; cả hai đều thấy danh sách đã cấm. Nhân vật bị cấm chung không xuất hiện trong pool chọn của bên nào. Không cấm trùng.
- Đóng/Escape/B mở xác nhận rời trận, không bỏ qua bước. Giữ luật pending/forfeit cũ. Khi hoàn tất mới chuyển đến lượt chọn đầu tiên như cũ; cấm chung không thay lượt cấm cuối sau khi chọn5.
- Hạng và số lượt cấm chốt theo pending.rankAtEntry. Config ở economy.arena.preBansPerSide. Không đổi điều kiện16 người; lựa chọn AI không được lấy mất số người tối thiểu người chơi còn cần chọn.

Mỗi bên chọn5; thứ tự1–2–2–2–2–1, bên đi đầu do seed quyết định. Nhân vật đã chọn không còn trong pool của cả hai. Người chơi chỉ chọn người sở hữu; AI chọn người chính thức. Không có bước bảo vệ và không có cấm mặc định Monica.

Mỗi bên cấm một trong năm nhân vật đã chọn của đối phương, còn4. AI chọn/cấm sau1,2–1,9giây. Ban AI dựa trên giá trị mất đi của đội: vai trò còn lại, tài nguyên phe phái, phá liên kết và khắc chế né tránh; quyết định không nhìn vào lựa chọn cấm của người chơi. Đội hình cuối có thể đổi chỗ trước khi xuất chiến. Các kỹ năng kề bên và ô chẵn/lẻ dùng bốn vị trí cuối, không phải thứ tự năm lượt chọn.

## Điểm và build AI — cấu hình playtest

| Hạng | Điểm bắt đầu | Cấp AI | Rank kỹ năng | Ô gear/người | Trang bị |
|---|---:|---|---|---:|---|
| Đồng |0|18–28|1–2, theo trần cấp|3|T1/T2|
| Bạc |100|32–44|2–3|3|T2, một T3|
| Vàng |250|50|4–5|4|T2/T3, mở nâng cấp truyện|
| Kim Cương |450|50|5|5|T3, một T4, Trấn nếu có mẫu|
| Prisma |700|50|5|6|T4 tối ưu theo chỉ số, hiệu ứng phù hợp, Trấn nếu có mẫu|

Thắng+20, thua−10, hòa0, sàn0. Rời trận hạng cũng−10. Hạng AI chốt lúc tìm được trận, không đổi giữa chọn/cấm hoặc khi qua ngày.

Prisma không phải bộ giải tối ưu toàn cục: tối ưu tham lam có giới hạn49 bước phân bổ điểm, thử49 cặp dòng T4/ô trên chỉ số đã giải qua `resolveCharacter`; trọng số theo loại scale/role/chuyển đổi chỉ số, chọn Hội Tâm khi gặp né và hồi MP cho hỗ trợ. Mọi gear, ô và Rank phải qua validator save hiện tại. Không cấp stat ẩn. Build cùng seed tái tạo được. Trọng số, giới hạn và chất lượng AI cần tiếp tục playtest bằng đội thật.

## Danh Dự và đổi thưởng

| Kết quả | Danh Dự |
|---|---:|
| Thắng |20|
| Thua / hòa |5|
| Bỏ trận / thoát giữa chọn-cấm |0|

Trần chung Đấu Thường + Đấu Hạng:100/ngày. Phần vượt trần bị bỏ. Thắng vẫn tính mốc ngay cả khi Danh Dự đã đầy. Không cấp EXP, Coin hay tiến độ quest/PvE từ Arena.

Mốc thắng ngày1/3/5 nhận lần lượt1/1/2 Pure Prisma, bấm nhận ở trang Tìm Trận. Độc lập với trần Danh Dự, không tự nhận và không nhận hai lần.

Shop có đúng bốn tab: **Đổi thông thường → Đổi danh dự → Công thức Trấn Phái → Chiêu Mộ**. Đổi thông thường giữ Prisma, Phá Giới, sách; Original Prisma ở cuối. Link cũ books/original tiếp tục vào nhóm thông thường.

-20 Danh Dự →1 Pure Prisma;35 lượt/tuần.
-300 Danh Dự →1 Original Prisma;1 lượt/tuần.
- Ngày mới00:00 Việt Nam. Tuần mới thứ Hai00:00 Việt Nam. Số dư không reset. Hạn mức theo hồ sơ, không theo cửa sổ hay tab.
- Danh Dự xuất hiện trong Túi đồ, trang Đấu Trường và tab đổi, không thêm vào header vốn đã chật.

## Lưu và rời trận

Save v7 thêm field tùy chọn `honor`, `arenaProgress`. Save cũ mặc định0; không đổi namespace/AppData. `arenaProgress` giữ rating, tổng thắng/thua/hòa, bucket ngày/tuần, pending và receipt kết quả gần nhất. Không lưu đối tượng engine/RNG/actor vào campaign.

Tìm được trận phải lưu pending trước khi chuyển chọn/cấm hoặc tải. Trong thời gian pending, không thay hồ sơ build, quay gacha, mua/rèn hay bắt đầu nội dung khác. Tìm kiếm chưa tìm được đối thủ có thể hủy miễn phí.

Kết quả được ghi qua một transaction: điểm, Danh Dự, thắng ngày và clear pending cùng commit. Chỉ hiện “Đã lưu” sau khi ghi thành công. Retry cùng ID không cộng lần hai. Save lỗi giữ pending và nút “Lưu lại kết quả”; chưa được tìm trận mới. Kết toán dùng thời điểm kết thúc đã chốt, không dùng thời điểm retry để chuyển thưởng sang ngày khác.

Thoát giữa trận/chọn-cấm tính thua. Khi mở lại hồ sơ có pending chưa kết toán, xử thua đúng một lần, không nhận Danh Dự. Sau khi receipt đã lưu, marker localStorage cũ không được lật một chiến thắng thành thua. Đây không phải cơ chế resume combat.

## Source và kiểm thử

- Cấu hình: `data/economy.json.arena`, metadata tiền tệ `data/items.json`.
- Core: `arena-progression.js` (thuần clone/validate), `arena-draft.js` (state chọn/cấm), `arena-ranked.js` (build và tạo trận).
- UI: `arena.tsx`, `arena-experience.tsx`, `arena-draft.tsx`, `arena-honor.tsx`, `arena.css`. Core không phụ thuộc UI/timer.
- Runtime: pending ghi trước, kết quả ghi sau qua profile store; thu hồi khi thoát/reload trong `game-context.tsx`. Giữ đường luyện tập/marker cũ tương thích.
- Regression: `test/arena-ranked.test.js`, các test Arena/AI/PvP hiện có, `e2e/arena-ranked.spec.ts` và `e2e/arena.spec.ts`. Kiểm tra migration, idempotency, profile isolation, cap, giao ngày/tuần, pool16, chọn/cấm không trùng, build hợp lệ cả roster, Mastery không leak PvP và thứ tự đội hình.

UI dùng hướng data-terminal của taste skill nhưng giữ typography/palette JRPG. Ngoại lệ có chủ ý: nền võ đài và username VS ở màn chuyển trận là art direction của game; không áp gradient trang trí cho bảng Danh Dự/chọn nhân vật. Kiểm tra ở1440/768/390, giảm chuyển động theo hệ thống và không tràn ngang.


## Bổ sung soft cap hai ngưỡng
Luật arena-0.3.0 áp dụng toàn bộ PvP, gồm Thường/Hạng/Luyện Tập, không thay PvE. Tổng sau cap đầu vượt T2 thì phần vượt lại nhân25%; T2 gấp đôi T1 và cả hai ngân sách AoE/random được chia trước. Đòn đơn1.000 còn231 sau làm tròn, không phải306 hoặc325. Xem [PVP_RULES_AI](PVP_RULES_AI.md). Các test preban/cap ở test/arena-preban-caps.test.js; UI được bổ sung vào arena-ranked.spec.ts.
