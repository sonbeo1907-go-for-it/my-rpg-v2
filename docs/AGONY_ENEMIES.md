# Vong hồn Người giữ đèn

Màn Thảo Phạt: Drageshelmfjall — Những ngọn đèn chưa tắt (drageshelmfjall_lost_lamps), hai lampkeeper_revenant. Nhạc drageshelmfjall chọn ngẫu nhiên bt1_drageshelmfjall.mp3 hoặc bt2_drageshelmfjall.mp3 theo hệ thống BGM hiện hành.

Quái thuộc group agony, hệ Ám, yếu Nguyệt (+50%). Chưa thêm nhân vật Nguyệt. HP nền140 tại Lv1, MP55 ATK20 MAG18 DEF14 RES16 SPD14, scaling và phần thưởng quest thường giữ hệ thống chung.

HP về0 -> vào Oán Hận, vẫn sống/được chọn/được xếp lượt. Kết thúc cuối vòng tiếp theo, sau Vòng Phụ và đòn cuối vòng. Trong trạng thái này cộng30% giảm sát thương trực tiếp theo nhóm reduction hiện hữu; DoT cũng bị giảm30%. Mọi damage chuyển sang trừ HP tối đa; số nguyên dương tối thiểu1. Không nhận hồi HP hoặc khiên; khiên cũ bị gỡ khi vào trạng thái nhưng không kích hoạt nội tại vỡ khiên.

Hết hạn đặt HP bằng HP tối đa còn lại. Đây là sự kiện trở lại riêng, không phải heal, không cấp MP, lượt, cleanse hoặc reset cooldown. Có thể kích hoạt lại không giới hạn; HP tối đa mất giữ suốt encounter. HP tối đa bằng0 là chết hẳn và kích hoạt thưởng hạ địch đúng một lần.

Oán Hận chỉ là trạng thái riêng, không phải hệ sát thương. Chỉ khi đang Oán Hận, sát thương mới trừ HP tối đa và vẫn tính DEF/RES, kháng và reduction. Ở dạng thường, các đòn Ám dùng quy tắc HP/khiên bình thường. Đòn đầu đưa HP về 0 chỉ kích hoạt trạng thái, không chuyển sát thương dư; các hit sau của cùng kỹ năng có thể đánh vào HP tối đa. Nguyệt vẫn là điểm yếu +50%, không tự bỏ qua pha Oán Hận.

actor-life.js là nguồn chung về sống/chết và chuyển HP. Battle, AI, targeting, FuA, khiên, mode, formula, gear và turn order dùng isAlive; không giả lập bằng cách giữ1HP. Trạng thái Oán Hận không phải buff/debuff có thể Dispel/Cleanse.

Màn giới thiệu chỉ ở Quest Thảo Phạt, cấu hình dungeonEligible=false để không tự chèn quái vùng mới vào wave Mỏ Vàng hiện hữu.
