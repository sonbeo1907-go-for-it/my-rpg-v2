# Rà soát scaling #32–#92 — 06/11/2026

Đọc characters/abilities/statuses và quy tắc Rank tại thời điểm review. Bỏ Astoria #33; số thứ tự giữ theo dữ liệu. Đây là review tĩnh trước quyết định mở thêm Thông Thạo, không phải bảng DPS mô phỏng.

**Cập nhật sau review:** người dùng đã chỉ định mở Mastery cho Sylva, Monica, Logia, Tywin, Tobin, Lumine, Rivia và Elise; các nhận xét dưới giữ làm bối cảnh, không còn là tuyên bố phạm vi chưa triển khai. Kit/DoT/utility vốn fixed vẫn giữ nguyên. Xem [SKILL_MASTERY](SKILL_MASTERY.md) và [phép đo Kreider/Lisbeth](KREIDER_LISBETH_MASTERY_REVIEW.md).

## Ưu tiên xem lại

| Nhân vật | Bằng chứng và nguyên nhân | Hướng thử nghiệm, chưa triển khai |
| --- | --- | --- |
| #46 Sylva | Gọi Azurius dùng một hành động, dạng3vòng tính cả vòng gọi; CD5. Chỉ còn hai vòng thường để tận dụng dạng trước khi hết. +6MAG căn bản và cơ chế gọi fixed; đòn dạng vẫn có Rank nhưng sức mạnh/chi phí chuẩn bị chưa theo kịp nhiều DPS mới. | Xem lại nhịp gọi/dạng trước khi chỉ cộng hệ số. |
| #43 Logia | Các chiêu damage rankable, nhưng Độc xà dùng status DoT45%ATK/tầng và passive+25%; phần Độc cốt lõi không tăng theo Rank kỹ năng. Độc vẫn tăng theo ATK, không phải “không có scaling”. | Cần adapter tăng DoT theo nguồn thi triển nếu muốn nâng Rank buff đúng lối chơi; phải kiểm thử snapshot, refresh, stacking, boss. |
| #74 Tywin | Thủy Nguyệt350%ATK/CD2 có Hội Tâm; chiêu còn lại deep wound/cleanse. Nội tại chỉ+20%RES. Giá trị ở khắc chế/hỗ trợ, không phải trần DPS thuần. | Chốt vai trò đấu sĩ khắc chế hay DPS; tăng hệ số đại trà có thể làm quá mạnh matchup hồi máu/né. |
| #53 Tobin | Chậm SPD11; hammer140%, cần nuôi forge_heat, quench100%+80%/tầng; mỗi tầng chỉ+8%ATK. Đội càng kết thúc nhanh, giá trị tích lũy càng thấp. | Có yếu có chủ đích vì free/kit vụng về; thử độ dài trận trước khi mở Mastery. |

## Nhóm cần đối chiếu đúng bối cảnh

- #38 Lumine: scaleMAG nhưng gây vật lí không phải lỗi. Có nội tại+15%MAG, tự buff35%MAG, Hội Tâm và nuke280%/20%DEFpenetration. Có dấu hiệu trần nuke thấp hơn Eri/Chiyoko, nhưng không kết luận từ một hệ số; nên thử địch DEFcao/RESthấp và đội buffMAG.
- #49 Karin: phải nhận rủi ro HPthấp để lấy lowHpBonus và passive; vấn đề ngân sách rủi ro so với DPS an toàn mới. Ở75%HPđãmất, last_stand có hệ số(1,4+1,4×0,75)=2,45 trước passive; không được đánh giá chỉ bằng140%ghi gốc.
- #50 Elise: nuke240%+40%/buff, tối đa3; passive+20%/buff tối đa60%. Khi đủ3buff, kết hợp hai nguồn đã lớn hơn nhiều so với240%gốc. Mất đất diễn khi địch không buff là matchup, chưa phải scaling sai.
- #60 Rivia: đơn360% hoặc AoE200% theo vị trí, còn stance/selfbuff. Có thể cần thêm lợi thế rõ cho đánh theo vị trí, nhưng không phải lỗi lấyATK/MAG.
- #35 Charlemagnes:720% tổng ở đòn4hit nhưng chọn mục tiêu ngẫu nhiên; nội tại giảmMP sau hạ địch ít tác dụng ở bossđơn. Nhược ở một matchup không tương đương thiếu sát thương nền.
- #68 Bennett: xuyên50%DEF ở mọi đòn. Trần trung bình là thiết kế được yêu cầu; không so340%gốc với người không có xuyên rồi gọi yếu.

## Chưa có cơ sở buff theo tuổi ra mắt

#32 Lionel, #34 Monica, #36 Kreider, #37 Roland, #39 Victorina, #40 Sieg, #41 Minerva, #42 Auguste, #44 Amelia, #45 Chloe: giá trị còn đến từ lượt, phản ứng, bảo vệ, debuff/đội và Trấn. Không đánh đồng damage multiplier thấp với thiếu sức mạnh hỗ trợ.

#47 Drake cần xem DPS golem theo DEF và bảo vệ, #48 Yufina scaleATK/phép là chủ ý, #51 Yumia có counter mạnh. #52Chelsea, #54Astraea, #55Artesia và các nhóm Vertosse/Mafia có bộ khuếch đại/tài nguyên/nhịp đội mạnh, chưa đề xuất mở Mastery theo đợt này.

#59Aldric, #61Valery, #62Noctis, #63Heimdall, #64Finmel, #65Albedo, #66Henrris, #67Joshua, #69Judy, #70Isabelle, #71Viktor, #72Mori, #73Sandra, #75Cerise, #76Flammelapis, #77Amaryllis, #78Brant, #79Ember, #80Myonne, #81Verena có điều kiện/độ bao phủ riêng; không tìm thấy cơ sở từ review tĩnh để buff cả nhóm. Riêng conditional AoE/counter phải đo số hành động và uptime thực, không chỉ hệ số một skill.

#82–#92 Hồn Kiếm dùng tài nguyên chung, đòn hai hệ, nhiều hit và hỗ trợ lẫn nhau. Chưa mở Thông Thạo. Đây là cohort so sánh sức mạnh đầu tư tương đương, không dùng làm chuẩn hệ số cho mọi nhân vật cũ.

Mốc ưu tiên playtest: **Sylva → Logia → Tywin → Tobin**, sau đó Lumine/Karin/Rivia. Không kết luận có bug engine từ khác biệt vai trò; việc scale theo MAG gây vật lí hoặc theo ATK gây phép là thiết kế hợp lệ.
