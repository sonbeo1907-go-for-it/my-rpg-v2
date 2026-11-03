# Mori / Sandra / Tywin — cấu hình playtest

Ba nhân vật chính thức trong pool thường; khóa với save mới và save cũ cho đến khi sở hữu. Dùng icon vai trò/VFX vật lí, phép cơ bản; không có background riêng.

Mori:175HP/70MP,30ATK/10MAG/17DEF/16RES/32SPD. Chuyển25% SPD căn bản thành ATK căn bản, cap25 tại100SPD; tính gear và phân bổ, không tính buff SPD%. Mở rộng stat_conversion với cap, không đổi đường tính Mandred cũ. Đơn200%/8MP, giảm20%DEF2lượt; Lôi Kiếm Vô Câu24MP/CD3 cấp Hộ Ấn cả đội, tự40%ATK2lượt chính và Lượt Thêm; AoE280%/20MP/CD3, chậm15%SPD2lượt và xóa2buff mỗi địch. Theo clock hiện tại: castR1, buff hết sau lượt chínhR3, R4 là downtime, dùng lạiR5. Lượt Phụ không tiêu thời hạn buff hay giảm CD.

Sandra:155HP/130MP,10ATK/34MAG/15DEF/27RES/18SPD. Nội tại+30% sát thương nếu mục tiêu không có buff, xét từng hit. Sắc Lệnh24MP/CD6 xóa toàn bộ buff trước rồi cấp2 Phong Ấn mỗi địch; Phán Quyết340%MAGAoE/22MP/CD1; Nhiễu150%MAGAoE/14MP khôngCD và cấp1 Nhiễu Ma Lực. Số lần được cấp qua effect.charges, không dùng stack; mỗi người có charges riêng, tái cấp làm mới số lần, không cộng dồn. Rank không tăng số lần.

Tywin:180HP/65MP,33ATK/12MAG/18DEF/18RES/25SPD. Nội tại Tĩnh Tâm Như Thủy tăng20%RES. Thương Lưu180%/8MP kèm Vết Thương Sâu2lượt chính. Tẩy Trần10MP/CD2 giải toàn bộ debuff cho mình và một đồng đội khác (excludeSelf, không nhận xác chết). Thủy Nguyệt350%/16MP/CD2 có Hội Tâm riêng cho đòn này, không cấp Hội Tâm lâu dài. Không tự thêm hồi máu.

Rank: hệ số damage tăng10%/rank, buff ATK tăng5% tương đối/rank; debuff, dispel, charges và lượt thêm giữ nguyên. Ai chung dùng forecast hiện tại và hồ sơ chiến thuật của từng người, cùng luật cho hai bên Arena.

Balance patch: Sandra chuyển sang Thuật Sư, profile AI/silhouette/icon theo roleGroup. CD có sẵn giảm1 (Sắc Lệnh7→6, Phán Quyết2→1), Nhiễu giữ khôngCD. Sắc Lệnh có presentation edict_interdict: một sách lệnh trên đội hình đích và một dấu cấm trên mỗi mục tiêu, kể cả khi không xóa được buff; không gây thêm damage hoặc đổi background. VFX dùng targetIds/ID đơn vị, hoạt động đối xứng PvE/Arena; nhanh và giảm chuyển động dùng timeline hiện có.
