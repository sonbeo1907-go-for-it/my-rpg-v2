# Đấu Trường — nền móng prototype

## Phạm vi

Đấu tập 4v4 với AI, chưa có online/xếp hạng, banlist hoặc app admin; đã có lớp luật PvP, soft cap và AI theo nhân vật. Monica được phép xuất hiện và dùng cùng chính sách AI chung; không có danh sách cấm cố định trong mã.

Tavern: Đấu Trường thay vị trí Chiêu Mộ ở cột bên phải. Chiêu Mộ chuyển thành banner SVG góc trái dưới. Profile mở menu gồm đổi tên và đổi hồ sơ.

## Engine

- `createArenaBattle(content, campaign, teamId, seed, options)` là điểm vào. Hai loadout được resolve độc lập trước khi đổi sang ID trận.
- Định danh: `party:slot:characterId` / `enemy:slot:characterId`. `definitionId` và `characterId` giữ ID dữ liệu gốc. PvE vẫn giữ các ID cũ.
- `actorKind: character` cho phép phe đối thủ dùng Rank kỹ năng thực. Quái PvE vẫn Rank 1.
- Trấn Phái, Gear IV, nâng cấp truyện, điểm phân bổ và hào quang đội dùng cùng đường resolve ở cả hai phe. Không thay số liệu PvE.
- Vị trí cố định 4 ô mỗi phe. Ô trống hoặc người gục không nén đội hình; đồng đội kề nối vòng 1–4, lan sang địch không nối vòng.
- Tài nguyên chung được khóa theo team: `battle.teamResources.party` và `.enemy`. Mọi tham chiếu source/target dùng ID đơn vị.
- Thêm Lượt, phản công, Liên kích và trường thứ tự lượt dùng cùng engine cho hai bên. Một Thêm Lượt/người/vòng và chống phản ứng dây chuyền vẫn áp dụng.
- Giới hạn 40 vòng đầy đủ, bao gồm Vòng Phụ, sau đó hòa. RNG seed được giữ khi đánh lại.

## Bộ đội AI

Ảnh gương sao chép toàn bộ đội và loadout của người chơi. Bốn đội mẫu dùng cấp trung bình đội người chơi, Rank 1, không trang bị. Chúng phục vụ kiểm tra cơ chế, không phải chuẩn cân bằng cuối cùng.

AI chấm điểm các hành động hợp lệ bằng thông tin công khai: tấn công, hồi phục, khiên, buff, biến đổi, tài nguyên, xóa buff và cấp lượt. Không có chỉ dẫn riêng cho Monica. AI có cấu hình chiến thuật theo nhân vật, thử các hành động hợp lệ trên bản sao trận; Monica dùng AI chung. Xem `PVP_RULES_AI.md`.

## Hiển thị

Mọi combatMode được chuẩn hóa thành nhãn trong ô nhân vật. Không đổi nền/BGM, không có nền do đối thủ ghi đè; cơ chế mode không thay đổi. Trường Monica vẫn có chỉ báo thanh lượt. Auguste vẫn có bảng dữ liệu công thức, nhưng không đổi nền.

Nhãn phe và ô cố định giúp phân biệt mirror. Log ghi rõ đối thủ. Cả hai phe có bảng Bằng Chứng và Thuốc Súng riêng. VFX công kích vẫn chạy; phép vũ trụ chọn đúng đội bị đánh, hiệu ứng công thức chọn đúng chủ sở hữu.

## Cô lập tiến trình

Tạo trận dùng bản sao campaign, không lưu HP/MP hoặc loadout trận vào save. Runtime không nhận thưởng; core cũng từ chối claim thưởng PvE khi `battle.arena` tồn tại. Không nhận EXP, first-clear, Coin, nhiệm vụ ngày hoặc tiêu lượt dungeon.

## Kiểm tra

Kiểm thử mirror ID/loadout/Rank/Trấn, tài nguyên riêng, adjacency qua ô trống, Gear IV đối thủ, Lionel/Monica, Aurora, phản công, giới hạn vòng và thưởng. AI được chạy qua 70 nhân vật chính thức ở cả hai bên. Kiểm thử UI gồm bố cục tavern, menu profile, 8 đơn vị, 4 bảng tài nguyên, mode Yufina và desktop/mobile.

## Hai chế độ

`/arena` chọn Tìm Trận hoặc Luyện Tập. `/arena/match` tạo đội AI ngẫu nhiên bốn nhân vật chính thức và chuẩn hóa hai bên Lv50/Rank5, không gear. `/arena/practice` giữ Ảnh gương và bốn đội mẫu. Luật PvP áp dụng cho cả hai chế độ; dữ liệu PvE gốc không bị sửa.
