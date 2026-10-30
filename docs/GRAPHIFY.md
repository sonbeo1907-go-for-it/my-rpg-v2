# Graphify local cho The Prisma Origin

Graphify là công cụ điều hướng code cho agent, không phải dependency của game. Cài chính thức `graphifyy[mcp]==0.9.97` trong `.tools/graphify/venv`, dùng Python managed riêng; không thay PATH hệ thống. File chạy và graph không đi vào bộ cài Tauri.

## Cài hoặc dựng lại trên Windows

Tại `E:\MyRPGv2`:

```powershell
npm.cmd run graph:setup
npm.cmd run graph:build
```

Setup tải uv portable từ kho chính thức Astral và Python managed, sau đó cài Graphify từ PyPI. Version được ghim trong script/requirements. Chỉ cần tải ở lần setup đầu hoặc khi cập nhật công cụ.

## Sử dụng

```powershell
npm.cmd run graph:update
npm.cmd run graph:query -- "resolveAction applyEffect"
npm.cmd run graph:explain -- "combatTimeline"
npm.cmd run graph:path -- "resolveAction" "resolveHit"
npm.cmd run graph:affected -- "resolveHit" --depth 2
npm.cmd run graph:stats
```

Query mặc định giới hạn 1200 token; có thể truyền `--budget 2000`. Exit 3 là tên trùng và exit 4 là không có kết quả: dùng tên hàm/file chính xác từ code, hoặc `rg` để tìm. Không coi các exit này là lỗi game.

`graph:build` dùng `extract . --code-only --max-workers 4`, rồi `cluster-only . --no-label` để tạo báo cáo và HTML; lần sau tận dụng cache. `graph:update` cập nhật code và báo cáo không dùng LLM. Nếu chủ động xóa/refactor nhiều code và Graphify chặn việc giảm số node, kiểm tra diff rồi dùng `npm.cmd run graph:update -- --force`.

Kết quả ở `graphify-out/`: mở `graph.html` bằng trình duyệt để xem đồ thị; agent dùng query/path/explain thay vì đọc toàn bộ `graph.json`. `GRAPH_REPORT.md` phục vụ xem kiến trúc chung.

## Phạm vi và giới hạn

- Phân tích AST local cho JS/TS/TSX, Rust và định dạng cấu hình được Graphify hỗ trợ. Lần chạy thực tế cho thấy các JSON gameplay được scan nhưng extractor chưa tạo symbol cho chúng. Các quan hệ ID trong character/skill/status vẫn phải đọc trực tiếp, không xem graph là bản đồ đầy đủ của dữ liệu gameplay.
- Chế độ code-only không phân tích ngữ nghĩa tài liệu, hình ảnh hay âm thanh, không gọi model/API key. Tài liệu thiết kế vẫn đọc trực tiếp.
- `.graphifyignore` loại dependency, native/web build, asset, save, `.env`, file khóa và công cụ phân tích. `.gitignore` cũng loại `.tools/graphify/` và `graphify-out/`.
- Không cài git hooks, watcher hay server nền. Gói MCP đã sẵn sàng nếu sau này cần tích hợp; phiên này sử dụng CLI local qua các lệnh npm.
- `AGENTS.md` hướng dẫn agent dùng graph để định vị, sau đó đọc source và test. Graph không thay thế engine/test và không chứng minh cân bằng game.

Chưa benchmark tiết kiệm token. Lần index đầu có chi phí cài và dựng graph; lợi ích cần đo trên nhiều task thực tế, gồm cả chi phí cập nhật index.
