# Hướng dẫn viết cảnh truyện theo tính cách nhân vật

Áp dụng cho Câu Chuyện Lữ Khách, Biên Niên Ký và cảnh sự kiện. Văn bản hiển thị ưu tiên tiếng Việt tự nhiên theo [GLOSSARY](GLOSSARY.md). Cảnh truyện không tự tạo luật chiến đấu, phần thưởng hoặc cờ tiến trình.

## 1. Chốt nguồn tính cách trước khi viết

Đọc yêu cầu mới nhất đã được người dùng chốt, biography và tài liệu riêng của nhân vật. Phân biệt ba loại thông tin: **đã chốt**, **suy luận để dựng cảnh**, **đề xuất mới cần duyệt**. Biography do agent bổ sung không tự trở thành bằng chứng rằng người dùng đã chốt chi tiết đó. Khi mâu thuẫn, ghi rõ thay vì âm thầm sửa tính cách.

Lập phiếu ngắn cho mỗi người xuất hiện: điều họ muốn trong cảnh; điều khiến họ khó chịu; cách nói và thói quen hành động; quan hệ với người đối thoại; giới hạn kiến thức; chi tiết nào mới là suy luận. Không suy tính cách từ role, nguyên tố hoặc bộ kỹ năng đơn thuần.

## 2. Dựng cảnh bằng lựa chọn và phản ứng

Mỗi cảnh cần một tình huống cụ thể, một va chạm nhỏ và một thay đổi nhìn thấy được. Thể hiện tính cách qua việc nhân vật làm khi bị cản trở, không qua lời kể nhắc lại nhãn “nóng tính”, “gương mẫu”. Không bắt mọi người lần lượt phát biểu để điểm danh. Người vắng mặt vẫn cần có vai trò trong toàn tuyến.

Thử che tên người nói: có phân biệt được giọng và mục đích không? Nếu ai cũng có thể nói câu đó, sửa lại. Tránh lạm dụng câu cửa miệng, diễn thuyết đạo lý hoặc biến một đặc điểm thành trò đùa duy nhất. Người kiêu ngạo vẫn có lúc đúng; người nóng tính vẫn có thể hợp tác mà chưa hết nóng tính.

Quan hệ phải có bước trung gian: bất đồng → thương lượng cụ thể → thử thay đổi → kết quả. Không cho cả đội đột nhiên hòa thuận sau một câu khuyên. Không xóa tính cạnh tranh hay khuyết điểm chỉ để kết truyện đẹp.

## 3. Cảnh phải đúng trạng thái chơi

- Chỉ khẳng định kết quả, đối thủ, người ra sân hoặc hành động chiến đấu khi hook có dữ liệu chứng minh. Thành viên dự bị vẫn có thể bàn chiến thuật, nhưng không được kể là đã ra sân.
- Cảnh dùng chung phải phù hợp cả thắng lẫn thua đã chấp nhận. Không mặc định người chơi vừa thua, suýt chết, dùng sai chiến thuật hay được một nhân vật cứu.
- Nếu cần phản ứng theo kết quả, đặc tả rõ điều kiện và phương án mặc định trước khi thêm biến thể; renderer/validator chưa hỗ trợ thì ghi là việc tương lai, không tự thêm trường JSON bị bỏ qua.
- Cảnh nghỉ có thể lặp: không buộc bước phát triển quan hệ chỉ xảy ra một lần vào hook nghỉ lặp lại. Không tự tăng cờ hay tài nguyên bằng đoạn văn.
- Hướng dẫn “Chơi lại”, seed, nhận thưởng và thao tác nút thuộc UI. Kết thúc truyện phải đứng vững nếu người chơi không chơi lại. Nhánh rút lui cần cảnh phù hợp, không dùng lời kể khẳng định vừa thua trận.

## 4. Nhịp đọc và giới hạn nội dung

Một đoạn tập trung một nhịp; ưu tiên 2–4 đoạn ngắn mỗi cảnh nháp. Dùng động tác có chủ đích thay cho mô tả dài. Không đưa key, enum, bình luận triển khai hoặc chỉ dẫn coi thường người chơi vào lời thoại. Tên riêng và thuật ngữ đã chốt giữ nhất quán.

Không tình dục hóa nhân vật học sinh hoặc chưa rõ tuổi. Những quan hệ ngưỡng mộ có thể thể hiện bằng sự lúng túng, muốn được công nhận hoặc quan tâm; không chuyển mô tả không phù hợp thành lời thoại gợi dục.

## 5. Phiếu giọng nhân vật lớp 7A

| Nhân vật | Điểm đã chốt | Cách thể hiện trong cảnh đề xuất | Tránh |
| --- | --- | --- | --- |
| Luka | Nhiệt huyết tuổi trẻ, tinh thần rock-and-roll, vai chính | Gõ nhịp, chủ động rủ rê, muốn cả đội làm điều nổi bật | Chỉ đứng trầm ngâm hoặc đọc bài học đoàn kết |
| Gairyu | Dễ nóng, có nét bắt nạt, thích áp đảo | Giành quyền hành động, nói cộc; học cách báo trước thay vì đổi hẳn tính | Biến thành người hiền hoặc vắng mặt cả tuyến |
| Ariel | Hình tượng idol học viện | Quen phản ứng trước đám đông, có sức hút | Tự coi mọi phẩm chất lãnh đạo dịu dàng là canon |
| Charlotte | Ganh đua, đố kỵ spotlight của Luka | Phản bác, giành tiếng nói, vẫn muốn chứng tỏ năng lực | Chỉ phụ họa Luka; hết ganh đua ngay sau một cảnh |
| Clark | Học sinh gương mẫu | Chuẩn bị, nhắc điều lệ, xử lý bất đồng bằng việc cụ thể | Chỉ làm người thuyết giảng không có phản ứng riêng |
| Mariel | Ngưỡng mộ Ariel, thường xung phong chịu nguy hiểm | Lúng túng khi được chú ý, nhiệt tình quá mức | Gợi dục hoặc thu gọn thành một trò đùa |

Thói quen gõ nhịp, cuốn sổ, găng tay và việc Ariel nối lời trong các cảnh giải đấu là **chi tiết dựng cảnh đề xuất**, không phải thông tin tiểu sử đã được người dùng chốt. Chưa tự ghi ngược chúng vào biography.

## 6. Checklist nghiệm thu

1. Đối chiếu nguồn tính cách, quan hệ và tên; đánh dấu suy luận mới.
2. Đọc liền toàn tuyến: mỗi người có động cơ và ít nhất một hành động riêng; thay đổi quan hệ đã được chuẩn bị.
3. Kiểm tra các nhánh thắng/thua, dự bị, lặp cảnh, rút lui và chơi lại. Không kể sai trải nghiệm người chơi.
4. Đọc thành tiếng, cắt câu giải thích lặp; kiểm tra tiếng Việt và giọng nhân vật.
5. Giữ ID/hook/schema; chạy validator và test collection liên quan. Qua test chỉ chứng minh dữ liệu hợp lệ, không thay cho duyệt văn học.

Các cảnh giải học viện hiện vẫn draft/data_only. Chưa có trình diễn cảnh hoặc lựa chọn thoại hoạt động trong game.
