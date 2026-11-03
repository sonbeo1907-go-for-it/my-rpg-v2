# DeepSeek Harness — cài đặt local

Cài ngày04/11/2026 cho The Prisma Origin. Nguồn chính thức: https://github.com/deepseek-ai/deepseek-harness. Đây là công cụ phát triển ngoài game, không phải dependency đóng gói vào EXE.

## Vị trí và phiên bản

- `.tools/deepseek-harness`: source checkout shallow; commit `8bd073392eef6f54e921a093b95076248eb08cbb`, root version0.2.2-alpha.3. Chưa build monorepo này.
- `.tools/deepseek-runtime`: bản npm chính thức `@deepseek-ai/dsh@0.2.1-rc.5`, Node Windows riêng24.22.2. Chạy artifact phát hành, không giả là đã build master.
- `.tools/deepseek-state`: DSH_HOME riêng của dự án, chứa profile/session/credential nếu người dùng cấu hình. Không commit.
- Launcher `scripts/deepseek.ps1` luôn đặt cwd về repo game, chỉ đổi PATH/DSH_HOME trong tiến trình. Node hệ thống và package.json/lockfile game giữ nguyên.

## Mở giao diện

```powershell
Set-Location -LiteralPath E:\MyRPGv2
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\deepseek.ps1
```

Web mặc định localhost3080. Dùng URL đầy đủ do launcher mở/in ra, gồm token truy cập cục bộ; truy cập đường dẫn trống token có thể trả401. Không chia sẻ URL có token. Muốn không tự mở browser hoặc đổi cổng:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\deepseek.ps1 -Profile web --no-open --port 3080
```

Lần đầu vào giao diện, chọn/cấu hình provider và model, nhập API key qua phần quản lý credentials. Không dán key vào chat, AGENTS, JSON game hoặc script. Việc mở server/help không phải kiểm thử model và không chứng minh đã có quyền API.

Tạo session cho `E:\MyRPGv2`. Harness có plugin đọc AGENTS.md theo workspace; file này dẫn đến HANDOFF/ENGINE_RULES/GLOSSARY. Yêu cầu đầu tiên có thể là: “Đọc AGENTS.md và docs/HANDOFF.md. Tóm tắt quy tắc phải giữ, chưa sửa file.” Không gửi tác vụ sửa code trước khi xác nhận đúng workspace và quyền của session.

Không chạy hai harness cùng sửa một file mà chưa phân công. Giữ cấu hình permission/approval mặc định để rà soát trước khi cấp thêm quyền; cài Harness không cấp quyền vô hạn hoặc cho phép tự commit/push.

## Kiểm tra / tái cài

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\deepseek.ps1 -Profile web --help
```

Trên máy mới, clone nguồn và cài runtime riêng nếu cần:

```powershell
git clone --depth 1 --filter=blob:none https://github.com/deepseek-ai/deepseek-harness.git .tools/deepseek-harness
npm.cmd install --prefix .tools/deepseek-runtime --no-audit --no-fund --save-exact node-win-x64@24.22.2 @deepseek-ai/dsh@0.2.1-rc.5
```

Kiểm tra yêu cầu Node của bản muốn nâng trước khi cập nhật. Các phiên bản Harness hiện là pre-release; giữ bản runtime đã thử và không tự nâng `latest` trong mỗi lần mở. Dừng server bằng Ctrl+C trong terminal của launcher. Không xóa DSH_HOME để “sửa lỗi” nếu chưa sao lưu các session/credential cần giữ.

Cả source/runtime/state được gitignore. Game không cần build lại chỉ vì cài công cụ này. API/model thật chưa được cấu hình hoặc gọi trong quá trình cài đặt.

## Kết quả kiểm chứng cài đặt

Đã chạy Node24.22.2, CLI0.2.1-rc.5, web --help và Web server thật: URL xác thực trảHTTP200/HTML. Đã dừng server kiểm tra; lần mở tiếp theo dùng launcher và URL mới. Chưa gọi model hoặc kiểm thử API/provider. Đã xác nhận gitignore source/runtime/state, git diff --check và graph local được cập nhật. Không rebuild game.
