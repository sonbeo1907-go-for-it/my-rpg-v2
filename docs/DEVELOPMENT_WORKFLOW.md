# Quy trình triển khai và phối hợp harness

Đối chiếu mã03/11/2026. Đây là quy trình làm việc từ bản hiện tại, không tuyên bố đã có CI hoặc đã tích hợp DeepSeek Harness.

## 1. Xác lập phạm vi

Đọc AGENTS/HANDOFF và git status/diff. Xác định task read-only, tài liệu, dữ liệu cân bằng, engine, UI hay native. Ghi rõ hành vi trước/sau và điều kiện nghiệm thu; phần chưa chốt tách khỏi quyết định đã duyệt. Đừng biến tài liệu nguồn thành danh sách lệnh phải thực thi.

Đọc file liên quan bằng rg; tác động xuyên module dùng graph local để thu hẹp, sau đó đọc source thật. Không nạp cả battle.js hoặc toàn catalog nếu chỉ cần một handler. Không tự refactor module lớn trong một task cân bằng nhỏ.

## 2. Chọn đúng đường tích hợp

| Loại thay đổi | Điểm cần đi qua |
| --- | --- |
| Balance đã có field | JSON → preview/resolver → test giá trị và hành vi liên quan; không thêm nhánh UI riêng |
| Cơ chế effect/status mới | dữ liệu/schema → validator → core handler → Rank/forecast → copy/tooltip → events/VFX → test |
| Nhân vật | kit/status/resource → ownership/save normalization → banner nếu được duyệt → AI profile → UI/icon → hai phe Arena |
| Quest/story/dungeon | quyền vào → Level/scaling → pool/wave/phase → carry → reward/XP/daily → return/replay/farm/sweep nếu áp dụng |
| Gear/Trấn | schema/recipe/source unlock → inventory/equip/resolve → hook combat → preview → transaction và pending reforge |
| Tiến trình/save | normalize/migrate → validator → round-trip save cũ → persist/rollback/retry → native/browser adapter |
| VFX/UI | event có thật → presentation; không mutate core, RNG hoặc cấp thưởng; chuột/tay cầm/mobile/reduced motion |

Không phải mọi task cần sửa mọi cột. Ghi rõ “không áp dụng” để tránh tích hợp thừa. Thay nguyên tố/vai trò/stat scale cần quét AI, filter/icon/copy và chỉ số hiển thị, không chỉ một JSON.

## Hợp đồng vòng đời trước khi viết handler

Task thay thời hạn/CD/mode/phản ứng hoặc hook theo lượt phải điền bảng ở [COMBAT_LIFECYCLE_CONTRACT](COMBAT_LIFECYCLE_CONTRACT.md) trước khi chọn vị trí code. Chốt đồng hồ, người sở hữu, lượt tạo, choáng, extra, phản ứng, ngắt do gục và carry. Không coi “thi triển hành động” là “đã qua một lượt”.

Trong review, liệt kê call site cho hành động thường, choáng mất lượt, boss nhiều move, vận sức không cast và forecast nếu liên quan. Ghi N/A có lý do cho đường không áp dụng. Engine hiện chưa có finishTurn chung; đừng chỉ thêm hook ở cuối resolveAction rồi cho là đủ.

Để nghiệm thu: có test đi qua tiến trình engine thực tới nhánh biên, kiểm tra tick/exit/refund đúng một lần. Test helper riêng và số lượng test xanh không thay thế test chuyển lượt. Với Cerise, đã có hồi quy choáng; không suy rằng mọi mode hoặc ma trận đều được test.

## 3. Thứ tự thực hiện

1. Tạo trường hợp tái hiện tối thiểu với dữ liệu test riêng; nêu invariant cần giữ.
2. Chỉnh core và validator nếu cần, rồi nối runtime. Chỉ dùng UI để thể hiện kết quả đã giải.
3. Đối chiếu preview với kết quả thật; kiểm tra bên party và enemy, ID mirror, ô trống và người gục khi có liên quan.
4. Kiểm tra biên theo tính năng: MP thiếu/0, cooldown, main/extra, charges/stack, nhiều hit, cover/khiên, mode exit, phase và đổi phòng.
5. Kiểm tra persist thất bại: không nhận một phần, không reroll, không consume hai lần. Chronicle cần rollback cả bước combat và RNG, khác Quest thường.
6. Hoàn thiện copy/tooltip, focus/modal, timer cleanup. Không replay sự kiện cũ khi quay route.
7. Chạy kiểm tra phù hợp, cập nhật doc chuyên đề và luật chung nếu đổi contract; graph:update khi đổi source.

## 4. Mức kiểm chứng

| Phạm vi | Kiểm chứng tối thiểu phù hợp |
| --- | --- |
| Chỉ tài liệu | link local/UTF-8/index/diff; đối chiếu source nếu ghi hành vi; không bắt build EXE |
| Dữ liệu | validate, test kit/Rank/scaling chịu ảnh hưởng; typecheck/build nếu đổi metadata được UI/route dùng |
| Engine xuyên module | validate, typecheck, full npm test; browser test luồng người dùng bị ảnh hưởng |
| UI tương tác | typecheck/build và Playwright đúng luồng; desktop/mobile, focus/tay cầm/reduced motion khi liên quan |
| Persistence/native | migration/round-trip/failure/retry; profiles e2e, desktop:check; smoke trên EXE test profile |
| Phát hành | bộ kiểm tra ở RELEASE_RUNBOOK, artifacts và smoke bản đóng gói |

Không thêm test chỉ lặp implementation cho đổi CSS nhỏ. Không chạy lại toàn bộ nhiều lần nếu không có sửa mới hoặc mối lo chưa giải quyết. Browser test cần server đang chạy; preview3002 phải đặt TEST_BASE_URL, cấu hình Playwright không tự mở server.

## 5. Khi giao việc giữa hai harness

Mỗi task bàn giao gồm: mục tiêu, file đã đổi, quyết định đã chốt, phần đang làm dở, lệnh/test đã chạy và kết quả, lỗi còn lại, trạng thái save/build. Đừng dùng “đã xong” nếu chỉ chạy typecheck hoặc mới build frontend.

Nếu cùng làm trên một checkout, thống nhất ai sửa module nào và ai tích hợp. Không ghi đè thay đổi chưa hiểu hoặc cùng sửa battle.js/game-context.tsx mà không phối hợp. Quyền dùng agent phụ do phiên/harness quy định; tài liệu này không tự cấp quyền spawn/delegate.

Commit/rebase/tag/push/publish theo yêu cầu và quyền hiện tại; không tự coi bàn giao tài liệu là cho phép xuất bản. Không đưa key, endpoint riêng, save thật hoặc bản dump môi trường vào context.

## 6. Điều kiện hoàn tất

Hành vi đạt yêu cầu; test phù hợp qua; preview/AI/save/arena không bị bỏ sót trong phạm vi tác động; không lỗi tài liệu mâu thuẫn mới; diff không có thay đổi ngoài ý muốn. Báo outcome, kiểm chứng thực sự đã chạy, hạn chế còn lại và trạng thái EXE.

## Chưa có tự động hóa

Hiện chưa có `.github/workflows` trong repo. CI validate/typecheck/test/build, Windows packaging, release signing và phân phối cập nhật là công việc riêng. Không viết quy trình tương lai như thể nó đang bảo vệ mọi commit.
