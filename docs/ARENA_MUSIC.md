# BGM Đấu Trường

Nhóm nhạc đăng ký ở `data/music.json`; file ở `public/bgm/`.

- `arena_menu.mp3`: màn chọn chế độ, tìm trận và chuẩn bị.
- `arena_start_x.mp3`, `arena_climax_x.mp3`, `arena_finale_x.mp3`: ba đoạn cùng mã của một bản nhạc.

Mỗi trận chọn ngẫu nhiên một mã trong các bộ đã đăng ký đầy đủ cả ba đoạn; hiện có 1 và 2. Mã này cố định đến hết trận, dùng RNG âm thanh riêng, không tiêu RNG chiến đấu. Không chọn lại khi cập nhật UI, hành động, mute/unmute hoặc trở lại cửa sổ.

Trình tự:

1. Bắt đầu trận: Start.
2. Tổng HP hiện tại của cả hai đội <=60% tổng HP tối đa lúc bắt đầu trận: Climax.
3. Có <=4 đơn vị còn đứng vững trên cả bàn: Finale, ưu tiên cao hơn Climax; có thể nhảy thẳng từ Start.

Giai đoạn chỉ tiến lên. Hồi máu/hồi sinh hoặc tăng HP tối đa giữa trận không kéo nhạc quay lại và không đổi mốc HP ban đầu. Khiên không được tính là HP. Nhạc thắng/thua/rời trận vẫn xử lý như trước; nhạc triệu hồi/combatMode không ghi đè nhạc Arena. Các bản nhạc chiến đấu lặp lại; đổi đoạn bắt đầu file mới từ đầu, không triển khai đồng bộ nhịp/crossfade.

Thêm bộ mới: đưa đủ ba file vào `public/bgm/`, đăng ký ba group ID cùng mã trong `data/music.json`, mỗi group chỉ trỏ đến đúng đoạn của bộ đó. Không ghép các mã khác nhau hoặc chọn các bộ thiếu đoạn.

Kiểm thử: các ngưỡng 61%/60%, khác phân bố HP hai đội, còn 5/4/3 người, hồi sinh/hồi máu, không khởi động lại khi publish, mute/volume/ẩn cửa sổ, nhạc menu, chiến thắng và reset ở trận mới.
