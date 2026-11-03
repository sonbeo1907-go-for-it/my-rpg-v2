# Build, nghiệm thu và rollback Windows

Đối chiếu03/11/2026. Runbook thủ công; chưa có CI release, updater hoặc live banlist. Version sản phẩm khác version schema save.

## Chuẩn bị bản phát hành

- Xác nhận repo `E:\MyRPGv2`, git diff và phạm vi thay đổi; không reset/clean thay đổi người khác.
- Dùng Node >=22 và dependency lockfile; máy build cần Rust MSVC, C++ Build Tools/Windows SDK, WebView2. Dùng scripts/tauri.mjs qua npm script để chuẩn bị PATH, không sửa PATH hệ thống theo phỏng đoán.
- Nếu phát hành version mới, kiểm tra tính đồng bộ package.json/package-lock.json, src-tauri/tauri.conf.json và Cargo.toml/Cargo.lock. Không đổi identifier, tên binary hoặc AppData chỉ vì đổi tên game. Không tăng save version nếu không có thay đổi schema yêu cầu migration.
- Giữ artifact cũ và một bản sao dữ liệu test trước khi mở bản mới. Không tự chép hoặc sửa save người dùng đang chơi. Đóng game trước khi build đè; chưa đóng thì hoàn thiện kiểm tra độc lập và báo file đang bị khóa.

## Kiểm tra và build

```powershell
Set-Location -LiteralPath E:\MyRPGv2
npm.cmd run validate
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

Browser kiểm tra ở terminal riêng:

```powershell
npm.cmd run preview
# Terminal khác:
$env:TEST_BASE_URL='http://127.0.0.1:3002'
npm.cmd run test:e2e
```

Chạy e2e theo vùng tác động hoặc toàn bộ khi phạm vi phát hành cần; ghi đúng phần đã chạy. Kiểm tra không tự mở server. Tauri:

```powershell
npm.cmd run desktop:check
npm.cmd run desktop:build
```

desktop:build tự gọi build frontend qua beforeBuildCommand, rồi Rust và NSIS. Việc frontend build qua chưa chứng minh EXE/bộ cài đã có. Nếu chỉ sửa docs thì không cần toàn bộ chuỗi này.

## Xác nhận artifact

EXE: `src-tauri/target/release/northern-prisma.exe`. Bộ cài NSIS: `src-tauri/target/release/bundle/nsis/The Prisma Origin_<version>_x64-setup.exe`.

Kiểm tra log kết thúc, timestamp/size của cả hai, và có thể ghi SHA256 bằng Get-FileHash cho artifact phát hành. Không dẫn một bộ cài cũ như bản mới khi Rust/NSIS lỗi. Sau build, chạy smoke bằng hồ sơ test; kiểm tra chọn hồ sơ, lưu/tải, một combat có kết quả/thưởng, màn đã sửa và âm thanh/asset local. Nếu sửa migration/native, kiểm tra save cũ/backup/revision và khôi phục trên bản sao test.

Ghi manifest bàn giao: product version, revision/commit (hoặc diff chưa commit), phạm vi, tests thực chạy, artifact path/hash, schema đọc/ghi và hạn chế. Không tạo commit/tag/push hoặc upload khi chưa được giao.

## Khi build lỗi

| Dấu hiệu | Hướng kiểm tra |
| --- | --- |
| npm không nhận trong beforeBuildCommand | Đang chạy đúng desktop script? Kiểm tra desktop-env.mjs/tauri.mjs và Node local; không thay PATH toàn máy ngay |
| Thiếu link.exe/SDK | Kiểm tra toolchain C++ đã cài; đây là lỗi máy build, không phải JSX |
| Không thay được northern-prisma.exe | Game/process đang khóa file; cần kết thúc phiên chơi an toàn trước build đè |
| Next route/asset thiếu ở EXE | Kiểm tra static export out/, generateStaticParams và asset local; không sửa bằng next start |
| Native lưu lỗi nhưng preview chạy | Browser dùng storage riêng; kiểm tra IPC, revision và native adapter, không kết luận save đã tốt từ mock |

Giữ lỗi gốc trong log, không tự bỏ kiểm tra để tạo artifact. Không reroll reward hay reset save để che lỗi đọc.

## Rollback

1. Dừng sử dụng bản lỗi, giữ log và bản sao trạng thái sau lỗi để điều tra; không ghi đè save đang có.
2. Xác định bản mới đã migrate/ghi schema hoặc thêm ID nội dung chưa. EXE cũ có thể từ chối save mới dù chỉ tăng schema tùy chọn hoặc catalog.
3. Chỉ chạy binary cũ với save đã xác minh tương thích, hoặc phục hồi **bản sao trước nâng cấp** sau xác nhận. Không tự hạ trường version, xóa gear/nhân vật/flag để ép load.
4. Nếu không có đường rollback dữ liệu an toàn, giữ save hiện tại và sửa bằng bản hotfix/migration có kiểm thử. Backup native không mặc định là backup đúng thời điểm trước release.

Runbook này không cam kết tương thích save ngược. Mỗi thay đổi persistence phải ghi rõ đọc được phiên bản nào, ghi ra phiên bản nào và cách kiểm chứng.
