# Lưu hồ sơ thành nhiều file — nhánh thử test-save

Cập nhật 21/11/2026. Đây là thay đổi **định dạng vật lý trong Tauri**, không thay schema campaign v7 hoặc quy tắc gameplay. Module: src-tauri/src/saves.rs và split_saves.rs. Browser preview vẫn dùng localStorage như trước.

## Ranh giới dữ liệu

| Phần | Nội dung |
| --- | --- |
| account | Version campaign, tiền/vật phẩm, gacha, lịch ngày, lượt hầm ngục, Danh Dự |
| equipment | Kho gear/Trấn Phái, kết quả tái rèn chờ nhận, revision Thợ Rèn |
| characters | Nhân vật, ownership, đội hình, slot, tham chiếu gear đang mặc, Hé Lộ |
| progression | Cờ truyện, chiến thắng, thưởng lần đầu, độ khó đã qua, Khúc Ca |
| sessions | Tiến trình Chronicle, giải đấu đang chơi và schema Ảo Ảnh cũ |
| session-content | Snapshot luật/build/kit đã chốt của giải đấu; tách để không ghi lại theo từng lượt |
| extensions | Trường root chưa biết; bảo toàn ở lớp lưu, không tự cấp quyền hỗ trợ schema game tương lai |

Native ghép đủ các phần thành một campaign JSON trước khi trả qua IPC. Frontend vẫn gọi decodeGameSave/encodeGameSave và validator hiện có, gồm kiểm tra tham chiếu giữa gear và người mặc. Không dùng từng phần trực tiếp trong UI/core. Không đổi ID gear, nhân vật, hồ sơ hoặc tên người chơi.

## Cấu trúc trên đĩa

~~~text
NorthernPrisma/
  profiles.json
  saves/
    savedata1.json                 # Bản gốc trước migration, nếu có; không ghi tiếp
    savedata1/
      manifest.json                # Con trỏ commit hiện tại
      manifest.backup.json         # Commit dự phòng đầy đủ
      objects/
        account-<sha256>.json
        equipment-<sha256>.json
        ...                        # Đúng bảy phần được manifest tham chiếu
      backup-objects/
        ...                        # Bản sao vật lý độc lập
      damaged/recovery-<unique>/   # Giữ byte file lỗi trước khi khôi phục
    backups/savedata1.json         # Backup mono cũ, nếu có
~~~

Manifest chứa format the-prisma-origin.split-save, storageVersion 1, profileId, generation, legacyHash và bảy digest. Tên object được suy ra từ section cố định + SHA-256; không nhận đường dẫn từ frontend. Mỗi object chứa storageVersion, section, data. JSON compact; giữ thứ tự khóa lồng nhau và số thực qua serde_json preserve_order + float_roundtrip. Đây là yêu cầu tương thích: validator replay giải đấu hiện có so JSON.stringify của các record.

## Giao dịch ghi

1. Kiểm tra revision và campaign bằng đường lưu hiện có. Revision split là chuỗi opaque split:<hash của manifest>; frontend không phân tích nó.
2. Chia campaign thành bảy phần; object không đổi được dùng lại. Ghi và flush object mới trước, chưa công bố tiến trình.
3. Chuẩn bị bản sao độc lập của commit trước trong backup-objects. Sau khi đủ file, atomic replace manifest.backup.json.
4. Kiểm tra manifest hiện tại chưa đổi; atomic replace manifest.json là **điểm commit duy nhất**. UI chỉ nhận thành công sau commit.
5. Dọn object cũ thuộc đúng mẫu tên do game quản lý, sau commit. Giữ bảy object hiện tại và bảy backup; file ngoài mẫu không bị xóa. Object mồ côi do ghi dở được dọn ở commit thành công sau.

Không đổi nội dung thì không tăng revision và không thay backup hữu ích. Atomic replace dùng file tạm cùng thư mục + sync_all + tempfile::persist như đường lưu trước. Single-instance plugin và Mutex native tiếp tục tuần tự hóa ghi trong app; đây không phải cơ chế khóa chống mọi chương trình ngoài sửa file đồng thời, hay cam kết chống hỏng ổ cứng.

Lớp lưu vẫn truyền/validate cả campaign qua IPC; mục tiêu ở bản thử này là giảm phần ghi lại trên đĩa và chia miền dữ liệu, chưa tối ưu toàn bộ chi phí serialize/validate RAM. Tổng dung lượng thư mục có cả backup độc lập và bản gốc migration, không thể so với kích thước một JSON đơn lẻ.

## Chuyển đổi và tương thích

- Liệt kê đồng thời savedata<N>.json và savedata<N>/, gộp theo ID. Việc mở danh sách không tự migrate save.
- Sau khi frontend đọc và xác thực save cũ, lần persist hợp lệ đầu tiên tạo bộ split; giữ nguyên byte JSON gốc, kể cả BOM/định dạng. Backup đầu tiên là campaign trước commit đó, generation 0; current bắt đầu generation 1.
- Hồ sơ mới tạo thẳng split. Folder dang dở chưa có manifest không được coi là hồ sơ đã tạo, nhưng ID được giữ để tránh đè file mồ côi.
- Khi một trong hai manifest đã tồn tại, bộ split là nguồn chính. Không âm thầm quay lại JSON gốc nếu split lỗi hoặc mất current pointer.
- legacyHash phát hiện bản game cũ đã sửa JSON gốc sau migration, hoặc một file mono khác trùng ID. Báo xung đột; không tự trộn hoặc lùi tiến trình. Bản game cũ không đọc được tiến trình split mới.
- Không chạy luân phiên hai bản game cùng hồ sơ để so sánh. Nếu thử lại bản mono, dùng bản sao hồ sơ riêng. Muốn sao lưu tiến trình split, sao chép **cả folder savedata<N>**, không chỉ manifest hoặc JSON gốc. profiles.json bổ sung tên hồ sơ; mất index vẫn phát hiện dữ liệu.

## Hỏng dữ liệu và khôi phục

| Tình huống | Hành vi |
| --- | --- |
| Dừng trước commit thường | Current vẫn là toàn bộ commit cũ; không ghép tiền mới với kho/build cũ |
| Lần migrate đầu dừng trước backup manifest | JSON cũ vẫn đọc được |
| Lần migrate đầu đã có backup manifest, thiếu current | Hiện hồ sơ cần phục hồi; cho khôi phục snapshot cũ sau xác nhận |
| Mất/sửa object, sai hash/profile/schema, manifest không UTF-8 | Hiện lỗi; không ghi đè hoặc tự reset |
| Backup đầy đủ và hợp lệ | UI cho khôi phục sau xác nhận, lưu byte current lỗi vào damaged rồi tái tạo current |
| Object current không đổi bị hỏng | Backup vẫn dùng bản sao vật lý độc lập, không dùng chung file lỗi |
| Backup cũng lỗi | Không phục hồi từng phần; giữ nguyên bằng chứng lỗi |
| Revision thay đổi | Từ chối ghi/khôi phục bằng revision cũ; yêu cầu tải lại |

Giới hạn logic 10 MB giữ nguyên; object/manifest được kiểm tra kích thước. Từ chối đường dẫn liên kết; không đọc đường dẫn từ JSON manifest. Hash kiểm toàn vẹn, không phải chữ ký chống gian lận.

## Kiểm thử và nghiệm thu

- npm.cmd run desktop:check -- --offline: filesystem thật trong tempdir; migration, interruption ở các ranh giới publish, retry, hash/manifest lỗi, khôi phục non-UTF8, tham chiếu tiền–gear–build nhất quán, revision, ID/tên, no-op, GC và backup độc lập.
- Native test nested_object_order_and_f64_precision_survive_serialization bảo vệ thứ tự record và số thực.
- test/profiles.test.js: IPC vẫn nhận campaign ghép, revision opaque, validator tham chiếu trước khi ghi, lỗi native không công bố campaign mới.
- e2e/profiles.spec.ts: tạo/chọn/đổi tên/tải lại, browser fallback và mock IPC Tauri. Mock không thay kiểm thử file native.
- Native có fixture tùy chọn chỉ dành cho test: PRISMA_TEST_SAVE_FIXTURE trỏ bản sao JSON, PRISMA_TEST_SAVE_OUTPUT xuất kết quả ghép để decodeGameSave phía JS so sánh. Không trỏ output vào save thật. Không đưa save cá nhân vào Git.
- Đã thử bản sao save thực tế 1.229.392 byte: bản ghép compact 668.809 byte; thay Coin chỉ đổi 1/7 phần. Phải kiểm tra cả JSON lẫn campaign decode phía JS, không chỉ Value phía Rust.

Không tự migrate AppData trong bước build/test. Chuyển đổi hồ sơ thật diễn ra khi người dùng mở bản mới và chọn tiếp tục.
