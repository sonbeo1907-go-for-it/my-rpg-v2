# Trấn Arthur — Ánh Đèn Qua Đêm Dài

- ID mới: arthur.lamplight. Giữ nguyên các Trấn Arthur đã có; chỉ Trấn đang trang bị có hiệu lực.
- Nhận miễn phí khi thắng toàn bộ **Đêm Không Yên Dưới Mái Trọ** (north_ke_02, Lv50), có Arthur trong đội hình tham chiến. Không yêu cầu Arthur còn sống ở cuối trận. Dùng snapshot đội trong trận, không dùng đội hình hồ sơ có thể thay đổi sau khi xuất phát.
- Chỉ trao một lần, nhận sẵn **10 ATK căn bản**. Không tự trang bị hoặc đổi Trấn đang mặc, không cần Bản Thiết Kế/chế tạo. Có thể tái rèn theo quy tắc Trấn hiện hành.
- Thưởng độc lập biên nhận first-clear: đã thắng trước bản cập nhật hoặc thắng mà thiếu Arthur vẫn nhận được khi đánh lại đúng điều kiện. Không tự trao theo cờ hoàn thành cũ vì chưa chứng minh đã dùng Arthur.
- Không trao giữa đợt, khi thua, ở dungeon/quét/Arena hoặc khi ghi thưởng thất bại. Lượt đánh lại không nhân bản và không đặt lại chỉ số đã tái rèn.
- Nội tại: **+10 điểm phần trăm tỷ lệ Bạo Kích**, cộng nguồn điểm yếu/gear và chặn ở100%. **+20 điểm phần trăm hệ số sát thương Bạo Kích**, mặc định1,5 →1,7. Dùng adapter dữ liệu critical_damage_bonus, không hardcode Arthur trong hit engine.
- Mọi nguồn tăng sát thương Bạo Kích cộng qua stackCriticalDamageBonuses; tổng hệ số chặn ở2,0 (200%, bao gồm150% mặc định). criticalDamageMultiplier gom Trấn cùng buff modifiers.criticalDamageBonus, gồm appliedModifiers và modifiersPerStack; bỏ buff hết hạn/0 tầng, có xử lý linkedStatuses. Buff mới không dùng quy tắc chỉ lấy damage amp lớn nhất và không thay đổi tỷ lệ Bạo Kích.
- Buff sát thương Bạo Kích hiện hỗ trợ thời hạn hoặc persistent theo lifecycle status đã có; chưa mở buff theo số lượt gây sát thương (damageUses/consumeOnAttack) để tránh bỏ sót cơ chế tiêu thụ.
- Chỉ áp dụng cho sát thương đủ điều kiện Bạo Kích hiện hành (sát thương thường). Sát thương Nguyệt/hiệu ứng không Bạo Kích. Không có giới hạn theo vòng, không tăng theo Rank/Thông Thạo. Áp dụng đối xứng cả hai phe, gồm PvP theo lớp luật hiện tại.
- Giao diện Quest và Thợ Rèn ghi điều kiện nhận, link về đúng tab Phương Bắc. Battle Result báo Trấn trong phần thưởng đặc biệt và cho tới Thợ Rèn.
