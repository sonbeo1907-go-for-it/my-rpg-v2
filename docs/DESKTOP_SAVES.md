# Tauri và hồ sơ lưu tự động

## Chạy / đóng gói trên Windows

Yêu cầu Node.js 22+, Rust stable MSVC, Microsoft C++ Build Tools (Desktop development with C++, Windows SDK), và WebView2 Runtime. Người chơi chỉ cần bộ cài đã build, không cần Node hoặc Rust.

```powershell
npm.cmd ci
npm.cmd run desktop:dev
# Bộ cài NSIS và executable release:
npm.cmd run desktop:build
# Kiểm tra Rust (bao gồm đọc file / ghi an toàn / khôi phục):
npm.cmd run desktop:check
```

`src-tauri/target/release/bundle/nsis` chứa bộ cài. `src-tauri/target/release/northern-prisma.exe` là ứng dụng release. `npm run build` xuất toàn bộ frontend sang `out`, gồm các route nhân vật/trang bị/hầm ngục sinh từ data; không chạy Next.js server bên trong game.

Bản xem trước trong trình duyệt: `npm run dev`, hoặc `npm run build` rồi `npm run preview` (cổng 3002). `next start` không dùng với static export. Preview có hồ sơ riêng trong localStorage và không mở AppData; đây không phải bản lưu file Windows.

## Vị trí dữ liệu

```text
%LOCALAPPDATA%\NorthernPrisma\
  profiles.json
  saves\
    savedata1.json
    savedata2.json
    backups\
      savedata1.json
      savedata1.damaged-<timestamp>.json
```

Đường dẫn lấy từ API hệ điều hành, không ghép tên người dùng Windows. Native commands chỉ nhận slot ID số nguyên dương; không nhận đường dẫn do frontend cung cấp. Mở thư mục luôn mở đúng `saves`. Đường dẫn được chuẩn hóa sang vị trí vật lý thật trước khi đưa cho Explorer; khi một launcher MSIX chuyển hướng AppData, UI hiện đúng vị trí được chuyển hướng. Bản NSIS chạy độc lập dùng thư mục AppData chuẩn. Single-instance plugin ngăn hai cửa sổ ứng dụng ghi cạnh tranh.

Mỗi lần mở game hoặc bấm Làm mới: liệt kê `savedata<N>.json`, đọc JSON qua validator/migration hiện tại, hiện hồ sơ. File được đặt thủ công vào thư mục cũng được phát hiện; thiếu metadata sẽ có tên mặc định và có thể đổi tên trong game. File backup không xuất hiện thành hồ sơ. Save mới dùng ID lớn hơn ID hiện có; đổi tên không đổi file.

`savedata<N>.json` giữ nguyên cấu trúc save v4: campaign, tiền, nhân vật, gear, lịch nhận thưởng và năm đội hình. Tên người chơi lưu riêng trong `profiles.json`. Đổi tên không sửa tên nhân vật Arthur. Âm thanh/tay cầm dùng chung trong localStorage của WebView.

## Ghi dữ liệu và phục hồi

- Tất cả giao dịch chờ native ghi thành công trước khi công bố tiến trình/thưởng/chiêu mộ trên UI.
- Native so revision với nội dung file để phát hiện sửa file từ ngoài; nếu lệch, yêu cầu chọn lại hồ sơ, không ghi đè.
- Ghi file tạm cùng thư mục, flush dữ liệu và dùng atomic replace. File cũ được giữ trong backups trước khi thay thế.
- Save hỏng vẫn hiện thành hồ sơ lỗi, không tự reset hoặc ghi đè. Nếu backup hợp lệ, nút Khôi phục yêu cầu xác nhận; file hỏng được giữ riêng.
- Trận đấu / chuyến hầm ngục đang diễn ra vẫn chỉ ở RAM. Đổi hồ sơ yêu cầu xác nhận nếu có trận; chặn khi còn thưởng thắng chưa lưu. Đổi route giữ trận, đóng ứng dụng hoặc tải lại kết thúc trận dở dang.
- Không có nút Import/Export hoặc route `/save/export`.

## Chuyển từ bản cũ

Trong cùng trình duyệt/WebView, khi chưa có hồ sơ, adapter tự chuyển key campaign v1–v4 đang có thành hồ sơ đầu tiên. Chỉ đánh dấu bằng hồ sơ đã ghi thành công; giữ nguyên key cũ để có thể phục hồi. Nếu key cũ lỗi, hiện lỗi thay vì tạo save đè.

Tauri không truy cập localStorage của Chrome/Edge khác. Để chuyển một JSON cũ đã có, đóng game, sao chép vào thư mục `saves` với tên `savedata<N>.json` chưa tồn tại rồi mở game. Chọn Tiếp tục sẽ chuyển schema cũ và giữ bản trước chuyển đổi trong backups. Không ghi đè slot khác.

## Kiểm tra

`test/profiles.test.js`: migration một lần, cách ly hồ sơ, lỗi ghi, cạnh tranh, khôi phục và chờ commit native.
`e2e/profiles.spec.ts`: tạo/chọn/đổi tên/tải lại, chuyển hồ sơ, mobile, backup và mock IPC Tauri.
`src-tauri/src/saves.rs`: kiểm tra file thật trong thư mục tạm, cấp ID, JSON không đổi, backup, revision, rename và restore.
Mock IPC không thay thế việc build/chạy ứng dụng Windows thật. Nếu thiếu C++ linker/SDK, frontend vẫn kiểm tra được nhưng chưa thể tạo `.exe`.
