# Artesia — Ngôi sao mang tên mình

Ba chương Lv10/20/30, không yêu cầu sở hữu Artesia. Cần hoàn thành Iris/Fiona/Takeshi và mở chương tuần tự. Thưởng I/II: 5 Pure Prisma + 500 Coin; III: 5 Pure Prisma + 1 Original Prisma. Chương II mở công thức Chiêm Tinh Cầu. Không cấp EXP, không đưa vào pool farm Quest/dungeon.

Đốm Sao Lạc, Tinh Bàn Rạn Vỡ, Dư Ảnh Tinh Vân dùng SPD13–19; tái sử dụng Đồng Hồ Cát Bất Ổn ở chương II. Boss Orbis — Thiên Cầu Lạc Quỹ (Lv30), yếu Ám/Thổ, SPD18, một hành động mỗi vòng, BGM boss.

Tam Trùng Màn Sao: buff ba tầng khi vào trận; mỗi tầng giảm 25%, tổng75%. Người tấn công đang có ít nhất một buff còn hiệu lực bỏ qua riêng lớp này, kể cả đánh thường, Liên kích và phản công. Không cần bản thân kỹ năng có hiệu ứng cấp buff; debuff/mode/tài nguyên không phải buff. Mỗi hit xét buff đang còn hiệu lực của người tấn công; không tự phá tầng. Có thể xóa buff theo luật chung. `initialStatuses` và `bypassedByBuffedAttacker` là cấu hình reusable.

Chiêm Tinh Cầu: loại `defend_adjacent_support`. Thay hồi MP3% thành5%; mỗi đồng minh sống ở hai ô kề nhận Ánh Sao Hộ Mệnh: giảm20% sát thương nhận trong một lượt chính. Nối vòng1↔4, không tính bản thân/ô trống, không cộng thành8%. Buff có thể bị Phong Ấn chặn; hồi MP vẫn được thực hiện. Hành động Phòng thủ Vòng Phụ vẫn kích hoạt, buff không giảm thời hạn theo Vòng Phụ.
