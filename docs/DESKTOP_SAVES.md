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

Bản thử trên nhánh test-save dùng [lưu tách file](SPLIT_SAVE_STORAGE.md). Schema campaign/IPC vẫn v7; chỉ thay lưu vật lý.

```text
%LOCALAPPDATA%\NorthernPrisma\
  profiles.json
  saves\
    savedata1.json              # Bản mono gốc giữ lại sau migration
    savedata1/
      manifest.json
      manifest.backup.json
      objects/                 # account / equipment / characters / progression / sessions / session-content / extensions
      backup-objects/          # Bản sao độc lập
      damaged/                 # Byte file lỗi trước restore
    savedata2/                 # Hồ sơ mới dùng split ngay
    backups\
      savedata1.json
      savedata1.damaged-<timestamp>.json
```

Đường dẫn lấy từ API hệ điều hành, không ghép tên người dùng Windows. Native commands chỉ nhận slot ID số nguyên dương; không nhận đường dẫn do frontend cung cấp. Mở thư mục luôn mở đúng `saves`. Đường dẫn được chuẩn hóa sang vị trí vật lý thật trước khi đưa cho Explorer; khi một launcher MSIX chuyển hướng AppData, UI hiện đúng vị trí được chuyển hướng. Bản NSIS chạy độc lập dùng thư mục AppData chuẩn. Single-instance plugin ngăn hai cửa sổ ứng dụng ghi cạnh tranh.

Mỗi lần mở game hoặc bấm Làm mới: liệt kê `savedata<N>.json` và `savedata<N>/`, gộp theo ID, đọc JSON qua validator/migration hiện tại, hiện hồ sơ. File được đặt thủ công vào thư mục cũng được phát hiện; thiếu metadata sẽ có tên mặc định và có thể đổi tên trong game. File backup không xuất hiện thành hồ sơ. Save mới dùng ID lớn hơn ID hiện có; đổi tên không đổi file.

Campaign ghép từ bộ split hoặc `savedata<N>.json` cũ dùng envelope v7, tự chuyển các phiên bản cũ hợp lệ qua game-save.js: campaign, tiền, nhân vật, gear, lịch nhận thưởng, năm đội hình và dữ liệu Thợ Rèn/Trấn Phái, Level, Rank, nhiệm vụ ngày và Chronicle. Tên người chơi lưu riêng trong `profiles.json`. Đổi tên không sửa tên nhân vật Arthur. Âm thanh/tay cầm dùng chung trong localStorage của WebView.

## Ghi dữ liệu và phục hồi

- Tất cả giao dịch chờ native ghi thành công trước khi công bố tiến trình/thưởng/chiêu mộ trên UI.
- Native so revision opaque của manifest (hoặc JSON cũ chưa migrate) để phát hiện thay đổi; nếu lệch, yêu cầu chọn lại hồ sơ, không ghi đè. Kiểm hash từng object trước khi ghép.
- Ghi object compact bất biến, flush dữ liệu, chuẩn bị backup độc lập rồi atomic replace manifest làm một điểm commit cho toàn campaign. Không thay đổi thì tái sử dụng object; no-op giữ nguyên backup/revision. Chi tiết ranh giới lỗi tại SPLIT_SAVE_STORAGE.
- Save hỏng vẫn hiện thành hồ sơ lỗi, không tự reset hoặc ghi đè. Nếu backup đầy đủ hợp lệ, nút Khôi phục yêu cầu xác nhận; file hỏng được giữ riêng trong damaged. Khi split đã có manifest, không tự quay về JSON cũ.
- Trận Quest/dungeon/farm thông thường chỉ ở RAM. Chronicle là ngoại lệ: chronicle-combat.js checkpoint battleSnapshot và RNG trong pending event; lỗi ghi rollback cả lượt. Không dùng câu “mọi trận đều không lưu” cho Chronicle. Đổi hồ sơ yêu cầu xác nhận nếu có trận; chặn khi còn thưởng thắng chưa lưu. Đổi route giữ trận. Đóng ứng dụng/tải lại làm mất trận Quest/dungeon thường; Chronicle phục hồi qua checkpoint riêng, Arena xử thua khi bỏ trận theo ARENA_EXPERIENCE.
- Không có nút Import/Export hoặc route `/save/export`.

## Chuyển từ bản cũ

Trong cùng trình duyệt/WebView, khi chưa có hồ sơ, adapter dò key campaign hiện hành và legacy theo profile-store, rồi chuyển dữ liệu hợp lệ thành hồ sơ đầu tiên. Chỉ đánh dấu bằng hồ sơ đã ghi thành công; giữ nguyên key cũ để có thể phục hồi. Nếu key cũ lỗi, hiện lỗi thay vì tạo save đè.

Tauri không truy cập localStorage của Chrome/Edge khác. Để chuyển một JSON cũ đã có, đóng game, sao chép vào thư mục `saves` với tên `savedata<N>.json` chưa tồn tại rồi mở game. Chọn Tiếp tục xác thực/chuyển schema cũ, rồi lần persist hợp lệ đầu tạo bộ split cùng ID và backup ban đầu; JSON gốc giữ nguyên byte. Không ghi đè slot khác. Nếu dùng bản game cũ làm thay đổi JSON gốc sau đó, bản split báo xung đột thay vì trộn dữ liệu. Khi sao lưu bộ mới cần sao chép cả folder savedata<N>; JSON gốc không phản ánh tiến trình sau migration.

## Kiểm tra

`test/profiles.test.js`: migration một lần, cách ly hồ sơ, lỗi ghi, cạnh tranh, khôi phục và chờ commit native.
`e2e/profiles.spec.ts`: tạo/chọn/đổi tên/tải lại, chuyển hồ sơ, mobile, backup và mock IPC Tauri.
`src-tauri/src/saves.rs` và `split_saves.rs`: kiểm tra file thật trong thư mục tạm, cấp ID, JSON không đổi về dữ liệu/thứ tự lồng nhau/số thực, interruption/retry, object dùng lại, backup độc lập, revision, rename và restore.
Mock IPC không thay thế việc build/chạy ứng dụng Windows thật. Nếu thiếu C++ linker/SDK, frontend vẫn kiểm tra được nhưng chưa thể tạo `.exe`.
