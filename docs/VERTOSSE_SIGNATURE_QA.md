# Nghiệm thu ba Trấn Phái Vertosse

Ngày 28/11/2026. Phạm vi: Trấn Selene, Simon, Genevieve; không đổi bộ kỹ năng khi chưa trang bị Trấn. Đọc cùng [VERTOSSE](VERTOSSE.md).

## Test case tự động

File: test/vertosse-signatures.test.js. Fixture dùng save riêng tạo trong bộ nhớ, không đọc hoặc sửa hồ sơ AppData.

| Mã | Tình huống | Kết quả cần đạt |
| --- | --- | --- |
| VT01 | Mở từng công thức và rèn, encode/decode save | Mỗi công thức tốn 10 Bản Thiết Kế; chưa mở không được rèn; save giữ đúng ba món |
| VT02 | Selene cộng Crit với gear và điểm yếu | +20 điểm phần trăm; hai gear lấy cao nhất; tổng không vượt 100%; Nguyệt không Crit |
| VT03 | Selene vào/rời Lunarmare, resolve nhiều lần | Mode tổng +18 ATK căn bản; rời dạng mất bonus; dữ liệu gốc vẫn +10, không cộng lặp |
| VT04 | Simon hỗ trợ và Liên kích qua tiêu Bằng Chứng | Hai chiêu CD1; sẵn sàng lại R+2; Liên kích thực gắn 3 Sơ Hở Thủy; tooltip đúng |
| VT05 | Genevieve đầu vòng, Vòng Phụ, hết vòng và nguồn gục | Mỗi vòng tạo đúng 1; buff +6 DEF/RES căn bản giữ qua Vòng Phụ rồi hết; nguồn gục không cấp vòng mới |
| VT06 | Bằng Chứng đầy, nguồn Choáng và người nhận gục | Trần vẫn 6; đầy vẫn ghi nhận tạo; Choáng không chặn đầu vòng; không cấp buff cho người gục |
| VT07 | Snapshot và chuyển wave | Load không tái kích vòng hiện tại; wave vào vòng mới tăng một lần; mode không bị cộng bonus lần nữa |
| VT08 | PvP mirror, phía AI tiêu Bằng Chứng | ID riêng, tài nguyên/buff đúng phe; AI Simon cũng áp 3 Sơ Hở |
| VT09 | Cấu hình sai loại mode/status/giá trị | Validator từ chối, không chấp nhận cấu hình hiệu ứng thiếu hoặc sai |
| VT10 | Selene đánh thật có/không Trấn, cùng roll | Trấn cho phép Crit ở roll 0,19 không điểm yếu; bỏ Trấn không Crit |
| VT11 | Simon Liên kích vào địch có Hộ Ấn | Hộ Ấn chặn Sơ Hở, tiêu đúng một charge; không xuyên miễn hiệu ứng |
| VT12 | Forecast và thi triển thiếu MP | Forecast thấy Liên kích nâng cấp nhưng không đổi trạng thái/RNG thật; lệnh lỗi không tiêu một phần |
| VT13 | Miraebolis chuyển phase trong cùng vòng | Không tạo lại Bằng Chứng, không cấp thêm hay kéo dài buff đầu vòng |

## Kiểm tra giao diện

Trên bản static export dùng cùng dữ liệu với EXE, kiểm tra tooltip Selene/Simon và mô tả Trấn Genevieve ở desktop/mobile, không lỗi JavaScript hay tràn ngang. Test ở e2e/vertosse-signatures.spec.ts.

## Đóng gói

Chạy validate, typecheck, toàn bộ npm test, desktop:check và desktop:build. Build desktop đã bao gồm frontend. Ghi kết quả và hash/timestamp của EXE + bộ cài vào manifest kiểm chứng riêng; không ghi bộ cài cũ thành bản mới và không tự sửa hồ sơ người chơi.

## Kết quả chạy ngày 28/11/2026

- 13/13 test case Trấn Vertosse qua; toàn bộ 2.182/2.182 unit test qua.
- Validate, typecheck và 14/14 kiểm thử native qua.
- 2/2 test giao diện trên static export qua, gồm desktop/mobile và modal mở công thức.
- Desktop build thành công; giữ bản cũ tại E:\MyRPG\vertosse-release. Manifest/hash: E:\MyRPG\vertosse-release\manifest.json.
- EXE: src-tauri/target/release/northern-prisma.exe; bộ cài: src-tauri/target/release/bundle/nsis/The Prisma Origin_2.0.0_x64-setup.exe. Không mở bản đóng gói vào hồ sơ người chơi để smoke; phần frontend được kiểm tra qua static export, phần native qua test store riêng.
