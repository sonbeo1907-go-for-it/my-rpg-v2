# Akane — Ưng Nhãn Săn Yêu

Triển khai05/11/2026. DPS vật lí Phong, dùng cung, họ hàng Shion; thuộc Hội Thợ Săn Yêu Quái, mang dấu Hồn Kiếm. Nhân vật chính thức trong Chiêu Mộ thường, có AI riêng; save cũ được bổ sung trạng thái khóa, không tặng miễn phí. Rate-up bắt đầu xét từ09/11 cùng nhóm mới, giữ nguyên lịch banner hiện tại.

## Kit Rank1

Chỉ số nền Lv1 playtest: HP165 / MP95 / ATK33 / MAG10 / DEF16 / RES19 / SPD25. Bộ chỉ số và MP dưới đây là lựa chọn triển khai khi yêu cầu chưa chỉ định.

| Kỹ năng | Chi phí / CD | Hiệu quả |
|---|---|---|
| Phong Tiễn — Xuyên Diệp |6 MP, không CD |200% ATK một địch |
| Liên Tiễn — Rạch Gió |12 MP, CD2 |150% ATK mục tiêu chính,100% mọi địch còn lại; mục tiêu thực nhận sát thương HP/khiên chịu Vết Thương Sâu trong2 lượt chính |
| Bí Tiễn — Ưng Nhãn Đoạt Mệnh |24 MP hoặc ưu tiên4 Hồn Kiếm, CD2 |450% ATK mục tiêu chính,300% mọi địch còn lại |

Đòn kỹ năng mang đồng thời Phong/Hồn Kiếm; xét điểm yếu một lần. Đánh thường100% ATK Phong theo chuẩn chung. Vết Thương Sâu dùng status chung, giảm40% HP hồi nhận gồm hút máu; né không gắn, Hộ Ấn chặn, dùng lại làm mới. Thời hạn2 lượt chính là cấu hình playtest.

Nhịp CD theo Tsukiha/Miyuki: chiêu1 không CD, chiêu2/3 CD2; cast ởR, khóaR+1/R+2, dùng lạiR+3. Không tự thêm kỹ năng cấp Lượt Thêm hoặc hiệu ứng tạo Hồn Kiếm trực tiếp vào kit. Natural growth vẫn áp dụng với các kỹ năng chủ động theo luật đội.

## Nội tại — Mũi Tên Đón Gió

**Quyết định người dùng:** kích ngay đầu Vòng Phụ, không chờ đến Lượt Thêm của Akane.

- Khi chuyển Main→Extra, engine chốt queue của những người sống đang có quyền Lượt Thêm. Akane nằm trong queue → tạo2 Hồn Kiếm và cấp buff+50% ATK đến hết vòng hiện tại.
- Một lần mỗi Akane/unit/vòng; kể cả quyền được cấp nhiều lần vẫn chỉ một Lượt Thêm theo luật chung. Mỗi phe Arena xét riêng theo unit ID, không theo character ID.
- Hook chạy sau sự kiện bắt đầu Vòng Phụ, trước `beginTurn` của người nhanh nhất. Đồng đội đi trước Akane có thể dùng tài nguyên vừa tạo. Không cấp ngay khi nhận quyền trong Main.
- Choáng không tắt nội tại: nếu còn sống ở ranh giới phase và có quyền thì vẫn nhận; hành động Extra có thể bị bỏ qua. Đã gục trước ranh giới thì không nằm trong queue, không nhận. Không có quyền riêng thì dù đồng đội có Extra cũng không kích.
- DoT ở đầu lượt Akane diễn ra sau hook đầu phase. Nếu DoT hạ cô, tài nguyên đã tạo không bị thu hồi; đây là hệ quả thời điểm đầu phase đã chốt.
- Buff là status thông thường `akane_tailwind`, clock `round`, duration1, deadline bằng vòng hiện tại. Không hết sau hành động của Akane; xóa ở kết toán cuối vòng sau mọi Extra. Có thể bị Phong Ấn chặn hoặc bị xóa buff theo luật chung. Tài nguyên và buff là hai hiệu quả riêng.
- +2 là tạo từ nội tại, không phải kỹ năng trực tiếp: không kích Shion/Yukino, không dùng natural-growth quota. Vẫn tính sự kiện tạo Hồn Kiếm cho các nội tại nghe mọi nguồn như Tsukiha, kể cả khi pool đầy; cap6/10 giữ nguyên.
- Native+50% không tăng theo Skill Rank. Rank chỉ tăng sát thương các kỹ năng10%/cấp theo quy tắc compound hiện hành.

## Runtime, save và trình bày

`extra_phase_resource_buff` là native tái sử dụng: resource, amount, statusId, duration1. `finishPhase` dựng Extra queue rồi gọi `triggerExtraPhasePassives`. Hạn mức reserve trong `actor.procRounds` trước tạo tài nguyên/cấp buff. Không đẩy logic sang renderer hoặc vào từng lần cast.

Snapshot giữa Main giữ quyền chưa sử dụng: khi thật sự vào Extra mới kích. Snapshot đã ở Extra giữ quota/pool/status, reload không gọi lại hook hoặc cấp lần hai. Qua wave/phase/chuyến tiếp tục chính sách carry hiện hữu; native không tự kích do boss đổi phase hoặc chỉ tải lại trạng thái. Trận mới có quota mới.

Forecast hành động dùng clone; không tiêu quyền/quota/RNG của trận thật. Forecast một cast không giả định các lượt còn lại sẽ kết thúc để chạy hook phase; không hứa mô phỏng chuỗi tương lai đó trong điểm AI.

Dùng asset vai trò và VFX vật lí Phong chung. Không có combatMode, đổi nền hoặc BGM. UI mô tả native lấy lượng buff và tên tài nguyên từ dữ liệu.

Kiểm thử: `test/akane.test.js`, `e2e/akane.spec.ts`, skill-copy và toàn regression. Các ca chính: Main/Extra thật, đồng đội nhanh hơn, Choáng/KO, expiry cuối vòng, overflow, không kích Shion/Yukino, hit/né/Hộ Ấn, chi phí MP/Soul, Rank, reload/forecast và Arena đối xứng.
