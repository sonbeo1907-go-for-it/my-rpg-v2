# The Prisma Origin

JRPG theo lượt, giao diện tiếng Việt, nội dung data-driven. React + Next.js App Router xuất tĩnh; Tauri 2 đóng gói Windows. Arena hiện đấu đội AI offline, chưa có multiplayer hoặc máy chủ quản lý luật.

**Điểm bắt đầu cho người/harness mới:** [Bàn giao](docs/HANDOFF.md) → [Quy tắc engine](docs/ENGINE_RULES.md) → [Mục lục tài liệu](docs/INDEX.md). Đây là tài liệu hiện hành, thay mô tả tổng quan Northern Prisma cũ. ID, namespace save và tên executable cũ vẫn giữ để tương thích.

## Phát triển và kiểm tra

```powershell
Set-Location -LiteralPath E:\MyRPGv2
npm.cmd ci
npm.cmd run dev          # http://localhost:3001
npm.cmd run validate
npm.cmd run typecheck
npm.cmd test
npm.cmd run build        # static export: out/
npm.cmd run preview      # http://127.0.0.1:3002
# Terminal khác, sau khi preview đã chạy:
$env:TEST_BASE_URL='http://127.0.0.1:3002'
npm.cmd run test:e2e
```

Node >=22; phiên bản dependency cụ thể nằm trong package.json/package-lock.json. Không dùng `next start` cho bản xuất tĩnh.

## Windows

```powershell
Set-Location -LiteralPath E:\MyRPGv2
npm.cmd run desktop:dev
npm.cmd run desktop:build
npm.cmd run desktop:check
```

Build cần Rust MSVC, C++ Build Tools, Windows SDK và WebView2. Script `scripts/tauri.mjs` chuẩn bị môi trường; không thay bằng lệnh npm/cargo tự chế khi chưa kiểm tra script.

- EXE: `src-tauri/target/release/northern-prisma.exe`.
- Bộ cài: `src-tauri/target/release/bundle/nsis/The Prisma Origin_2.0.0_x64-setup.exe` (version theo cấu hình build).
- Đóng game trước khi build đè trên Windows. Người chơi không cần Node/Rust.
- Save v7: `%LOCALAPPDATA%\NorthernPrisma\saves\savedata<N>.json`; tên hồ sơ trong profiles.json. Không đổi thư mục vì đổi thương hiệu. UI không có Import/Export.

## Hệ thống đang có

Đội hình bốn vị trí, năm preset; Level/Đột Phá/phân bổ và Rank kỹ năng; Quest Thảo Phạt/Truy Nã/Hiểm Ác; Câu chuyện Lữ Hành; Biên Niên Ký I/II; bốn dungeon Mỏ vàng/Hiểm trở/Rèn Luyện/Phá Giới; Thẻ Quét, tự động chiến đấu/farm; Chiêu Mộ, Shop, Thợ Rèn T4/Trấn Phái; Ủy Thác Hằng Ngày. Hầm Ngục Ảo Ảnh đã bị gỡ, chỉ còn tương thích dữ liệu lịch sử.

Không dùng số lượng roster/quest trong README để kiểm tra tính đầy đủ. [Catalog](docs/CHARACTER_CATALOG.md) là ảnh chụp có ngày; JSON hiện tại là nguồn số liệu. Xem [kiến trúc](docs/ARCHITECTURE.md), [hướng dẫn nội dung](docs/CONTENT_GUIDE.md), [trạng thái gameplay](docs/GAMEPLAY_STATUS.md).

## Bảo toàn dữ liệu

Giao dịch clone → kiểm tra → persist → công bố. Lỗi lưu không cấp thưởng một phần; retry không quay lại RNG hoặc nhận trùng. Trận dùng snapshot, UI/VFX không quyết định kết quả. Không dùng save thật để test. Không đưa `.env`, credential, save, node_modules, out, target hoặc graph sinh tự động lên Git; theo .gitignore hiện tại.
