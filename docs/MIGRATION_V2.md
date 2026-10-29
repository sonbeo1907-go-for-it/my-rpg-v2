# Migration sang React + Next.js

Ngày: 28/10/2026. Nguồn: E:\MyRPG. Đích: E:\MyRPGv2.

## Những gì được giữ

Toàn bộ luật trong src/core, character IDs, ability/status IDs, save migrations cũ, RNG trận, bộ kit nhân vật, boss nhiều phase, luật liên kích, cộng hưởng Valmont, dupe, gacha và thưởng lần đầu. Copy toàn bộ JSON nội dung và bảy MP3. Tên gear đổi ở presentation và definition; ID và chỉ số không đổi.

## Những gì thay thế

DOM adapters, bộ ẩn/hiện screen và static HTTP server cũ được thay bằng React components, Next.js routing và server asset tích hợp. Kiểm thử DOM giả/static server cũ thay bằng e2e browser; các kiểm thử core giữ nguyên. Không copy metadata Git, save riêng hay credential từ project cũ.

## Save v4

Envelope v4 chứa các field save v3 cộng partyPresets (đúng 5 mục) và activePartyPresetId. Đội chưa dùng có slots=null. Đội đang dùng phải khớp campaign.party, thành viên phải đã sở hữu, 1–4 người không trùng, vị trí trống là null. Việc đổi đội và thay slot là transaction thuần; không tự đổi trang bị.

Adapter game-save.js chuẩn hóa nội dung bằng serializer/validator engine v3 để tái sử dụng toàn bộ contract đã được kiểm thử, sau đó xuất envelope v4. UI luôn đọc/ghi qua adapter này. Save cũ không bị sửa; người chơi Export/Import nếu đổi origin.

## Session và điều hướng

GameProvider nằm tại layout gốc, giữ campaign và battle runtime khi dùng Next Link. Runtime có RNG function nên không structuredClone toàn battle: chỉ copy các actor/queue/log cho React. Command được gửi từ event handler, có khóa chống lặp; không thực hiện gacha/thưởng khi route mount hoặc prefetch.

Vào URL con khi chưa Start sẽ trở về màn khởi động. sessionStorage giữ trạng thái đã Start trong tab; sau reload có thể vào lại route nhưng trận dang dở không được khôi phục. Modal là dialog native với focus trap, Escape và trả focus. Filter/sort lưu ở query string, vị trí cuộn của từng route và Quest được giữ trong phiên.

## Ngoài phạm vi

Chưa có gameplay hầm ngục, tài khoản/server save, multiplayer hoặc khôi phục battle qua F5. Trang Hầm ngục là placeholder rõ ràng. Giao diện không tạo thêm loại tiền, stamina, tỷ lệ banner hoặc yêu cầu nhiệm vụ giả.
