# Heimdall Valmont và Finmel — cấu hình playtest

Hai nhân vật chính thức vào Chiêu Mộ thường, không tự cấp miễn phí. Không có nền bàn đấu, BGM hoặc combatMode mới; dùng VFX vật lí/phép/status sẵn có.

| Nhân vật | Hệ / vai trò | HP | MP | ATK | MAG | DEF | RES | SPD |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Heimdall Valmont | Quang / Đấu sĩ vật lí | 320 | 70 | 18 | 12 | 25 | 24 | 9 |
| Finmel | Thủy / DPS ma pháp | 145 | 110 | 10 | 38 | 15 | 25 | 19 |

## Heimdall Valmont

Thành viên Valmont đầy đủ: được tính cho các nội tại gia tộc đang có.

- Đánh thường: vật lí Quang, 12% HP tối đa, không tốn MP.
- **Gươm Canh Gia Huy**: 9 MP, không CD, đơn mục tiêu, vật lí Quang, 30% HP tối đa.
- **Lời Thề Không Lùi Bước**: 8 MP, CD 2, Khiêu khích và +20% DEF, 2 lượt chính của bản thân.
- **Mạch Sống Gia Tộc**: 12 MP, CD 3, +35% HP tối đa trong 3 lượt chính. Chỉ tăng dung lượng, không tự hồi HP. Dùng lại làm mới, không nhân dồn. Hết/bị xóa sẽ giới hạn HP hiện tại theo Max HP mới, không hồi sinh hay kích hiệu ứng mất HP.
- **Bức Tường Biết Đáp Trả**: tối đa 1 phản đòn mỗi vòng, gộp Vòng Chính/Vòng Phụ. Sau toàn bộ hành động gây sát thương trực tiếp của địch đánh trúng bản thân, nếu còn sống và kẻ tấn công còn sống: phản đòn vật lí Quang qua DEF của địch. Hệ số:

`50% + 150% × min(1, tổng sát thương trước phòng thủ / HP tối đa hiện tại)`

Sát thương dùng để nạp phản đòn lấy sức công phá trước DEF/RES, kháng hệ, giảm sát thương, giảm đòn từ gear, che chắn và khiên; giữ bonus của người tấn công và điểm yếu. Gộp nhiều hit trong cùng kỹ năng, không phản từng hit. Đánh thường cũng kích; đòn né, Độc và các phản ứng khác không kích. Khiên chặn hết vẫn kích. Phản đòn không tốn MP, không tạo vòng lặp phản công.

Ví dụ Max HP 320 và raw damage 90: phản đòn hệ số 92,1875%, sức công phá 295 trước DEF của địch. Buff Max HP lên 432 với cùng đòn 90: sức công phá 351. Khi raw damage đạt Max HP trở lên: cap 200%.

Engine giữ baseline `hpCapacityBase` và cập nhật `stats.maxHp` như bộ đệm dung lượng hiện tại, để thanh máu, khiên/heal theo HP, chi phí HP và kiểm tra sống chết dùng cùng một giá trị. Không sửa dữ liệu nhân vật ngoài trận. Các đơn vị không nhận buff Max HP, gồm cơ chế Oán Hận hiện có, không bị can thiệp.

Rank tăng 10% cho hệ số damage và 5% cho buff DEF/Max HP; phản đòn tự động và hệ số nội tại giữ cố định.

## Finmel

- Đánh thường: phép Thủy 100% MAG.
- **Mũi Băng Tĩnh Lặng**: 6 MP, không CD, phép Thủy đơn mục tiêu, 150% MAG.
- **Tâm Điểm Tuyết Lặng**: 10 MP, CD 3, +30% MAG và +20% RES, 3 lượt chính.
- **Băng Táng Tĩnh Lặng**: 20 MP, CD 2, cần và tiêu toàn bộ 3 Hàn Tinh. Đơn mục tiêu phép Thủy, 280% MAG + 100% MAG mỗi tầng = 580% MAG ở Rank 1.
- **Cộng Hưởng Băng Triều**: bắt đầu từ 0 Hàn Tinh, tối đa 3. Khi đồng đội khác gây sát thương trực tiếp HP/khiên khác hệ Thủy cho địch, +1 tầng cho mỗi hành động. Xét hệ của hit gây sát thương, không xét hệ của nhân vật. Một chiêu hỗn hợp chỉ cần có hit khác Thủy gây sát thương thật. Nhiều hit/diện rộng chỉ +1; phản công và Liên kích của đồng đội là hành động riêng và được tính. Đòn kết liễu vẫn tính. Không tính Finmel, phe địch, Độc, né hoàn toàn hoặc bản thân đã gục; hiệu ứng chặn tích tài nguyên vẫn hoạt động.

Tầng giữ qua wave/phòng khi chế độ giữ tài nguyên; trận độc lập bắt đầu lại từ 0. Rank tăng cả hệ số nuke gốc lẫn mỗi tầng 10% mỗi bậc; buff MAG/RES tăng 5% mỗi bậc.
