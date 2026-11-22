# Bài Ca Vô Danh — Nguyệt Quang Chúc Phúc

Triển khai22/11/2026. Tổ hợp Quang–Ám, ID nameless_song. Luna cấp quyền qua allBlessings; không tự cấp tổ hợp mới cho Noelle/Shashthi hoặc người chỉ có Hé Lộ. Nguyệt Nhật Hỗn Mang vẫn chưa triển khai.

## Quy luật chung

Hai ô nạp từ sát thương thật theo Quang/Ám; ghép sau khi toàn bộ hành động và phản ứng đã resolve. Trong khi active không nạp nguyên tố hoặc gọi tổ hợp khác. Tồn tại3 vòng tính cả vòng kích; chỉ đánh **cuối vòng chung**, sau Main và Extra, trước hết hạn. Không đánh khi mới gọi hoặc đầu vòng, không tick theo từng nhân vật. Khóa pulse theo round và attackInProgress giữ đường chung. Nguồn gọi gục không tự làm Chúc Phúc đã gọi biến mất; cả đội gục không được duy trì trận. Qua wave/phòng giữ deadline theo adapter; không tự gọi lại; encounter Chronicle mới giữ luật nội dung hiện hành.

## ATK động

A = trung bình ATK động của các nhân vật Quang/Ám cùng phe còn sống. D = tổng số **loại debuff đang hiệu lực trên từng địch còn sống**. Hai địch cùng mang một loại được tính2; một debuff3 tầng trên một địch chỉ tính1. Debuff hết hạn/tầng0, buff và trạng thái không phải debuff không tính. Tái dùng debuffTypeCount và isAlive chuẩn (không tự viết hp>0 trong runtime).

ATK Chúc Phúc = A × min(1,2; 0,5 + 0,1 × D). Không có thành viên hợp lệ thì0. ATK cập nhật khi xem snapshot và trước mỗi đợt đánh, không chốt vĩnh viễn khi activation.

## Đợt tấn công

Mỗi địch nhận min(3, số loại debuff của địch đó) hit, mỗi hit100% ATK nguồn Chúc Phúc, **vật lí Ám–Nguyệt**. Địch không có debuff nhận0 hit; cả đội địch không có debuff thì không tạo hit/damage giả. Chốt số hit từng địch và ATK một lần trước cả đợt. Dùng một attack context cho toàn đợt: mọi hit lên một địch chỉ reserve/tiêu1 Sơ Hở Ám; không tự consume theo hit. Vẫn qua DEF, khiên, né, điểm yếu, soft cap và phản ứng chuẩn. Mục tiêu đã gục dừng nhận hit.

Luna native/mode, Song Nguyệt Đồng Tâm và các modifier Nguyệt giữ lớp riêng. Nguồn damage độc lập moonlight_<team>, không chiếm slot đội hình hoặc lượt. Cùng đường hiệu lệnh có thể tái dùng về sau; hiện chưa thêm nhân vật có skill ra lệnh cho Bài Ca. Noelle chỉ phản hồi đúng Lôi Sấm Thịnh Nộ, không tự phản hồi Bài Ca.

## UI và nghiệm thu

Bảng riêng có biểu tượng trăng/khuông nhạc, ATK động, còn vòng và footer vật lí Ám/Nguyệt tối đa3 hit. Damage timeline lấy hitIndex, trình bày theo nguồn Chúc Phúc. Luna mode cuối vòng tự dùng vật lí Ám–Nguyệt khi Bài Ca đang active.

Data debuffScaling:{perDebuff:0.1,maxRatio:1.2}, debuffHits:{max:3}; validator kiểm kiểu/giới hạn. test/nameless-song.test.js kiểm activation, ATK/cap/count, hit/Sơ Hở, Main+Extra/expiry, zero damage, forecast, provider death/carry/PvP và aspect Luna. e2e/luna.spec.ts kiểm bảng thực tế. Không đổi schema/namespace save.
