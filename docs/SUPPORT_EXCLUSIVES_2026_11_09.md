# Trấn Phái hỗ trợ — Amelia, Minerva, Amaryllis (09/11/2026)

## Amelia — Gương Băng Hộ Giá

`amelia.mirror`, mở bằng 10 Bản Thiết Kế.

- **Màn Khiên Tập Thể:** khi bất kỳ thành viên còn sống nào của đội có Khiên, toàn đội giảm **20% sát thương nhận vào**.
- **Liên Kích 140%:** `amelia.echo` dùng hệ số **1,4 MAG** thay vì 0,65.
- **Xóa Một Buff:** mỗi mục tiêu trúng liên kích bị xóa **1 buff có lợi** sau khi đòn gây sát thương HP hoặc Khiên.
- Không đổi kỹ năng chủ động; hiệu ứng giảm sát thương chỉ còn khi Amelia còn sống và đội còn ít nhất một Khiên.

## Minerva — Rừng Lặng Bảo Hộ

`minerva.silent_forest`, mở bằng 10 Bản Thiết Kế.

- Sau khi dùng **Hộ Ấn Rừng Lặng**, tạo Khiên toàn đội bằng **120% MAG**.
- Lượng Khiên tăng theo **Rank của Hộ Ấn Rừng Lặng**; kỹ năng này được chuyển sang dạng tăng Rank chỉ phục vụ lượng Khiên Trấn, không thêm hiệu ứng nền khác.
- Khiên tạo sau khi Hộ Ấn được áp; Khiên mạnh hơn đang có không bị thay bằng Khiên yếu hơn.

## Amaryllis — Đèn Dầu Phục Sinh

`amaryllis.litany_lamp`, mở bằng 10 Bản Thiết Kế.

- **Kinh Cầu sẵn sàng từ đầu trận** khi Trấn được trang bị từ đầu; sau khi dùng vẫn hồi chiêu 10 vòng.
- Sau khi dùng Kinh Cầu, tạo Khiên toàn đội bằng **350% MAG**; lượng Khiên tăng theo Rank của Kinh Cầu.
- Khiên tạo sau hồi sinh, không cấp thêm Lượt Thêm.

## Balance Patch — Kinh Cầu Hồi Sinh

- Chuyển sang `growthProfile: output_buff_mp`, **chỉ tăng Rank để giảm MP**.
- **Tối đa Rank 5**, không mở mastery; hồi chiêu vẫn **10 vòng**, `initialCooldown: 6` khi không có Trấn.
- MP rank 1 = 20; rank 5 giảm theo hệ số output MP hiện hành.

## Kiểm chứng

`test/ardelia-exclusives.test.js`: giảm sát thương đội có Khiên, liên kích 140%, xóa buff, Khiên 120% MAG của Minerva và tăng theo Rank, Kinh Cầu sẵn sàng + Khiên 350% MAG + MP giảm theo Rank. `test/amaryllis.test.js` kiểm tra trần Rank 5 và cooldown không đổi.

## Hiển thị trong UI

Khi Trấn được trang bị, mô tả kỹ năng của **Hộ Ấn Rừng Lặng** và **Kinh Cầu Hồi Sinh** hiển thị **số Khiên thực tế** theo Rank hiện tại của kỹ năng, dùng cùng công thức với handler khi cast: ound(stat × ratio × rankFactor). Ví dụ Minerva Rank 1 = 34 Khiên, Rank 5 = 49 Khiên; Amaryllis Rank 1 = 140 Khiên, Rank 5 = 205 Khiên với MAG/RES nền tương ứng.

