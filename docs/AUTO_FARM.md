# Tự động chiến đấu và farm lặp lại

## Trải nghiệm

Nút xuất chiến ở bảng Quest và hầm ngục chia làm hai phần: thao tác thủ công hiện có và Farm lặp lại. Modal nhập 1–999 lượt, nút +/− và chọn nhanh 1/10/100/999; từ chối số lẻ, 0 và vượt giới hạn. Một lượt hầm ngục là cả chuỗi phòng, không phải từng wave. Hầm có trinh sát tái sử dụng danh sách phòng trong modal; lượt có giới hạn được hiển thị, không tiêu Thẻ Quét.

Trong combat PvE thông thường có nút Tự động, bật/tắt để giao hoặc nhận lại điều khiển. Farm dừng ngay việc tự chọn hành động/replay khi người chơi yêu cầu; trận đang chơi vẫn có thể tiếp tục thủ công. Không đánh Arena hoặc tự điều khiển phiên Biên Niên Ký. Câu chuyện Lữ Hành không có nút farm lặp ở trang truyện.

Phiên farm hiển thị số lượt hoàn thành, thắng/thua/hòa, tổng tiền tệ và EXP từng nhân vật đã lưu. Không bung trang kết quả/giật focus sau từng chiến thắng khi phiên còn tiếp tục; kết quả đầy đủ hiện ở cuối phiên. Chỉ chạy khi ứng dụng còn mở, không khôi phục hàng đợi hay cấp thưởng offline khi đóng game. Rời màn hình chiến đấu dừng phiên.

## AI dùng chung

`src/core/battle-ai.js` chứa planner dùng chung; `arena-ai.js` giữ exports tương thích. PvE gọi `planAutoBattleTurn`, sử dụng cùng API kiểm tra kỹ năng/mục tiêu, hồ sơ chiến thuật và dự báo như Arena. Forecast không tiêu RNG thật. Không gắn luật PvP, soft cap hoặc chuẩn hóa Lv/Rank/gear vào PvE; quái giữ AI được thiết kế của chúng.

Tái sử dụng `runBattle` để thực thi một lệnh thật, phát sự kiện/VFX, xử lý phản ứng, lượt thêm, phase và wave như chơi tay. Không có vòng mô phỏng nhanh để phát thưởng. Không có chờ suy nghĩ 2 giây/báo chiêu 1 giây dành riêng Arena; vẫn giữ thời lượng VFX đã chọn và nhường event loop giữa hành động. Planner hiện là chiến thuật một bước, không đảm bảo thắng các boss có cơ chế đặc thù.

## Lưu thưởng và lặp

`farm-session.js` kiểm tra 1–999, ghi nhận kết quả theo ID trận và chỉ nhận chiến thắng khi `rewardClaimed` đã được commit. Runtime gọi đường nhận thưởng gốc; tính tổng từ chênh lệch ví thực tế trước/sau giao dịch và `xpAwards.accepted`. Bao gồm tiền tệ thưởng lần đầu, không cộng lại khi nhấn nhận thưởng nhiều lần.

Chỉ tạo trận/chuyến tiếp theo sau `persist` thành công. Dùng campaign mới nhất để giữ XP, nâng cấp/mở khóa và phần thưởng; giữ lựa chọn quest/độ khó/cấp siêu trùm, dùng seed chiến đấu mới mỗi lượt. Mỗi quest mới hồi HP/MP như xuất chiến thủ công; trong một chuyến dungeon HP/MP/trạng thái theo luật carry của dungeon hiện tại.

Tự dừng khi đủ số lượt, thua/hòa, hết quota dungeon, lỗi AI/chiến đấu, không thể bắt đầu lượt mới hoặc lỗi ghi thưởng. Lỗi ghi thưởng không tự retry hay mở lượt tiếp. Người chơi có thể nhận thưởng lại thủ công; chỉ commit một lần và không tự bật lại farm. Quota được kiểm tra lại bằng giờ Việt Nam trước mỗi chuyến, các lượt Rèn Luyện vẫn dùng cơ chế hồi lượt gốc.

Không đổi schema save. Tiến độ hàng đợi farm là trạng thái runtime; phần thưởng từng trận đã commit thuộc save game bình thường. Tiến trình nhiệm vụ ngày, lần đầu, Blueprint, EXP và hạn mức vẫn đi qua các hàm gốc.

## Kiểm chứng

Unit: giới hạn đầu vào, kết quả idempotent, phần thưởng sau commit, thua/hòa, planner không thay state/RNG và một trận F2P thật. UI: modal ba kích thước, hai quest liên tục với F2P Lv1, dừng thủ công, dungeon chỉ còn một lượt, thua không có thưởng và lỗi ghi save rồi retry thủ công không lặp tiếp.
