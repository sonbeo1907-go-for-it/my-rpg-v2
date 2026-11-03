# Gia tộc Vertosse — cấu hình playtest

> **Ghi chú phiên bản:** tài liệu chuyên đề theo đợt triển khai. Các con số trận mẫu là ảnh chụp, không tự áp lên mọi Level/Rank. Luật chung hiện hành ở [ENGINE_RULES](ENGINE_RULES.md), thông số thô ở JSON/[catalog](CHARACTER_CATALOG.md); thay đổi mới hơn được ưu tiên. Save ứng dụng hiện v7. Không triển khai lại tính năng đã gỡ từ mô tả lịch sử.

Bốn nhân vật gacha: Selene (Thủy, DPS vật lí), Simon (Thủy, hỗ trợ tấn công), Genevieve (Ám, hỗ trợ phòng thủ theo ATK), Noctis (Ám, DPS vật lí; xem NOCTIS.md). Không thêm nội dung truyện hoặc công thức Trấn.

Simon chỉ mang tên Simon; affiliation và tag Vertosse thể hiện phe phái, không phải họ của anh.

## Bằng Chứng Đanh Thép

Chỉ cần một người khai báo tài nguyên, gồm Selene, Simon, Genevieve hoặc Noctis trong đội là tài nguyên chung được khởi tạo, không bắt buộc có Selene. Bắt đầu 0/6; giữ qua các wave, phase và snapshot của cùng trận/chuyến. Trận độc lập bắt đầu lại. Mọi sự kiện tạo ghi cả số yêu cầu và thực nhận; đầy vẫn ghi nhận tạo cho nội tại Selene. Tiêu đúng chi phí một lần mỗi kỹ năng, kiểm tra trước khi trừ MP. Không phải buff, không bị dispel. Chủ nguồn gục không xóa tài nguyên đội.

Mỗi Bằng Chứng được tạo hoặc tiêu cho Selene một tầng +15% ATK, tối đa 3 tầng; làm mới cả cụm 2 lượt chính. Tạo 3 bằng chứng khi biến hình có thể tạo 3 tầng dù đã đầy. Lunarmare nhận +10 ATK căn bản và chỉ có ba đòn biến hình cùng Phòng thủ. Hết bằng chứng: rời dạng sau khi toàn bộ đòn và Liên kích kết thúc; lượt tiếp theo trở lại bộ thường, không mất lượt. VFX chỉ trong thẻ Selene. Dạ Yến Không Tên không bắt đầu hồi chiêu khi thi triển; chỉ khi rời Lunarmare mới bắt đầu CD2. Theo quy tắc engine, rời dạng ở vòng R thì không biến hình lại trong hai vòng R+1/R+2, sẵn sàng từ R+3. Lượt Thêm không giảm CD.

Simon Liên kích sau mỗi kỹ năng của đồng đội khác thực tiêu Bằng Chứng; 160% ATK Thủy vào địch có HP tuyệt đối lớn nhất, hòa theo đội hình, gắn 2 Sơ Hở Thủy nếu trúng. Không tự kích, không đệ quy, không thêm giới hạn mỗi vòng ngoài số kỹ năng đủ điều kiện.

Genevieve cuối vòng hồi 4% MP/Bằng Chứng thực tiêu cùng vòng, tối đa 12%, cho mỗi người còn sống nếu cô còn sống. Bao gồm tiêu trong Vòng Phụ, chỉ kết toán một lần. Khiên/hồi máu và DEF/RES chốt số Bằng Chứng trước khi kỹ năng tạo thêm.

## Số liệu Rank 1

- Selene: HP175 MP70 ATK29 MAG10 DEF17 RES18 SPD25. Bộ thường 80–90% ATK, utility nhỏ, tạo 1 Bằng Chứng, 4–5 MP. Biến hình 8 MP, tạo 3 Bằng Chứng. Dạng Lunarmare: 240% đơn/6 MP/1 Bằng Chứng; 120% diện rộng/8 MP/1 Bằng Chứng; 550% đơn, xuyên 15% DEF/12 MP/3 Bằng Chứng/CD2.
- Simon: HP165 MP105 ATK25 MAG12 DEF17 RES24 SPD23. ATK+30%, SPD+15%, 3 lượt chính, 10 MP/CD2. Khuếch đại+30% cho 2 lần sát thương riêng người nhận, tạo1, 8 MP/CD1. Khai Phá Điểm Yếu 3 lượt chính, tiêu1, 10 MP/CD2.
- Genevieve: HP170 MP120 ATK28 MAG12 DEF20 RES26 SPD17. Khiên toàn đội (120%+15% mỗi Bằng Chứng) ATK, tạo1, 14 MP/CD2. Hồi HP toàn đội (100%+15% mỗi Bằng Chứng) ATK, tạo1, 16 MP/CD2. DEF/RES toàn đội (20%+2,5% mỗi Bằng Chứng), 3 lượt chính, 12 MP/CD2.

CD2 của engine bỏ qua hai vòng sau thi triển, sẵn sàng ở R+3; đủ duy trì buff 3 lượt chính trong thứ tự ổn định. Rank tăng damage/heal/shield 10% tương đối, stat buff 5% (SPD giữ nguyên); phần hệ số tăng theo Bằng Chứng của Genevieve cũng tăng theo nhóm tương ứng. Khuếch đại giữ nguyên, Rank giảm MP. Khai Phá Điểm Yếu dùng chung status main_turn để mô tả Kính Săn Điểm Yếu và hiệu lực Simon thống nhất.
