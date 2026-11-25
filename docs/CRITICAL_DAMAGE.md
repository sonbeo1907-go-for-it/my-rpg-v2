# Sát thương thường, sát thương hiệu ứng và Bạo Kích

Quyết định hiện hành ngày 25/11/2026. Thay thế phần phân loại và hai Ấn trong GRAND_ADJUSTMENT_2026_11_25.

## Phân loại

Sau mọi đổi hệ từ mode/Hé Lộ/kỹ năng, đòn mang Nguyệt ở hệ chính hoặc phụ là sát thương hiệu ứng (effectDamage). Mọi đòn khác là sát thương thường (normalDamage), gồm Hồn Kiếm không kèm Nguyệt. Đây là phân loại độc lập với vật lí/phép, đánh thường/kỹ năng/Liên kích/phản công/định kỳ và phe.

Hai boolean luôn được chuẩn hóa từ nguyên tố thực tế. Metadata/cờ khác được giữ qua packet, event và gear Liên kích nhưng không thay phân loại; không blacklist nhân vật. Không thay cơ chế xuyên HP tối đa của Oán Hận, kháng hoặc né.

## Lớp Bạo Kích

- Ấn Võ Tâm giữ ATK +20%; tỷ lệ Bạo Kích = clamp(ATK căn bản / 150, 0, 1).
- Ấn Thuật Tâm giữ MAG +20%; tỷ lệ Bạo Kích = clamp(MAG căn bản / 150, 0, 1).
- Cả hai áp dụng cho mọi sát thương thường của người mang, không giới hạn vật lí/phép hay chỉ số scale. Sát thương hiệu ứng không xét tỷ lệ, không tiêu RNG và không hưởng kết quả của hit thường cùng chiêu.
- Bạo Kích nhân 1,5 sau DEF/RES, khuếch đại và giảm sát thương hiện có, trước soft cap PvP và chia khiên/HP. Làm tròn sát thương trước và sau lớp này. Không thuộc nhóm damage amp lấy lớn nhất, không cộng 50% vào hệ số cơ sở.
- Nếu mang cả hai Ấn, lấy tỷ lệ cao hơn và chỉ nhân 1,5 một lần. Tỷ lệ dùng baseStatValue hiện hành (trang bị, phân bổ và cộng phẳng căn bản); buff phần trăm trong trận không tăng tỷ lệ.
- Một phép thử trên nguồn/hành động ở hit thường đầu tiên trúng, dùng chung cho đa hit, lan, AoE và ngẫu nhiên. Liên kích/phản công dùng hành động riêng; sát thương định kỳ xét mỗi tick. Forecast không tiêu RNG thật. Không tăng heal, khiên hoặc chi phí tự mất HP.
- Gear sinh Liên kích sao chép loại sát thương/nguyên tố, không sao chép kết quả critical. Bản sao xét Bạo Kích theo nguồn của nó. Lưỡi Cắt Dư Âm vẫn 20% sức mạnh.

## Trình bày

Engine phát critical:true và criticalMultiplier:1.5 trên damage event thực sự Bạo Kích; UI không tự thử xác suất. Số sát thương lớn hơn, vàng nhạt và có “BẠO KÍCH!” phía trên, kể cả bị khiên hấp thụ toàn bộ. Né/0/heal không giả nhãn. Giữ nhịp từng hit, không thêm rung hoặc hạt riêng; giảm chuyển động vẫn đọc được nhãn/số.

Tooltip mỗi Ấn chỉ ghi chỉ số, Bạo Kích +50% và mốc xác suất. Quy tắc chung đặt ở Quy ước chiến đấu; không lặp giải thích gear trên từng kỹ năng. Bớt chú thích kỹ thuật nhưng giữ điều kiện, giới hạn theo phe và chi phí có ảnh hưởng quyết định.

## Tích hợp và kiểm tra

critical.js quản lý tỷ lệ/lớp nhân; damage-kind.js chuẩn hóa phân loại; battle.js gọi sau đổi hệ; combat-effects.tsx chỉ đọc event. ID martial_insight/arcane_insight và effectId trong save giữ nguyên, không cần migration. Trận đang lưu dở có recipe normal_damage_chance được đọc như nguồn Bạo Kích mới, giữ HP/MP và build đã khóa. Kiểm tra bằng test/critical.test.js, normal-damage-flags, gear-echo-flags, grand-adjustment và browser critical-feedback.
