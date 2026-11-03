# Cân bằng: trường thời gian, Astraea và Hội Tâm

- Đảo lộn thời không: PvE giữ ưu tiên phe. Trong Arena, là trường `speed_shift`, +15% SPD phe thi triển và −15% SPD đối phương; không xếp toàn bộ một phe trước phe kia. Giữ nguyên MP/CD/thời hạn và Trấn Phái. Đồng hồ trường vẫn hiện, vạch chia phe chỉ dùng cho hiệu ứng ưu tiên PvE.
- SPD được tính từ modifier bàn đấu riêng, không thêm status. Không thể giải bằng cleanse/dispel, không tính vào số buff/debuff cho các nội tại đếm trạng thái. Áp dụng đối xứng theo phe thi triển, chỉ sắp lại những lượt chưa hành động. Hết trường xóa modifier; đổi chủ trường thay thế hoàn toàn.
- Astraea: dữ liệu nội tại `excludeDefend: true`; Phòng thủ không kích Liên kích và không tiêu lượt kích hoạt. Khiên, hồi phục, buff và kỹ năng hỗ trợ không gây damage vẫn hợp lệ. Giữ giới hạn bình thường/trong vườn.
- Yufina: `presentationScope: none` cho Quang quyền bừng sáng ở cả PvE/PvP. Hiện nhãn mode trong card như Arena; không tạo banner/scene toàn bàn. Giữ ATK/SPD, chi phí, uptime và hồi MP khi kết thúc. Mode có `bypassEvasion: true`, mất Hội Tâm của mode khi rời dạng.
- Gahallad: trạng thái cưỡi ngựa Hắc kị xuất trận có `bypassEvasion: true`. Gắn Hội Tâm trực tiếp vào trạng thái đang dùng, không tạo buff Hội Tâm rời có thể lưu lại sau xuống ngựa.

Hội Tâm chỉ bỏ qua né tránh, không bỏ qua DEF/RES, khiên hay soft cap. Các nguồn Hội Tâm khác vẫn có hiệu lực nếu mode/trạng thái nói trên kết thúc.
