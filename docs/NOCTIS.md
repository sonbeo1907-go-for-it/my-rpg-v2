# Noctis và điều chỉnh Lunarmare

> **Ghi chú phiên bản:** tài liệu chuyên đề theo đợt triển khai. Các con số trận mẫu là ảnh chụp, không tự áp lên mọi Level/Rank. Luật chung hiện hành ở [ENGINE_RULES](ENGINE_RULES.md), thông số thô ở JSON/[catalog](CHARACTER_CATALOG.md); thay đổi mới hơn được ưu tiên. Save ứng dụng hiện v7. Không triển khai lại tính năng đã gỡ từ mô tả lịch sử.

Noctis là DPS vật lí hệ Ám, thuộc phe Vertosse, không mang họ Vertosse. Nhân vật vào pool Chiêu Mộ thường; không tự cấp miễn phí. Chỉ cần có Noctis trong đội là tạo bảng Bằng Chứng Đanh Thép dùng chung, cùng định nghĩa với Selene, Simon và Genevieve.

| HP | MP | ATK | MAG | DEF | RES | SPD |
| --- | --- | --- | --- | --- | --- | --- |
| 155 | 75 | 32 | 12 | 16 | 18 | 27 |

## Kỹ năng Rank 1

- **Bàn Tay Sau Bức Màn** — 6 MP, CD 2. Không gây sát thương. Cướp 10% ATK căn bản hiện tại của một địch, tổng lượng Noctis đang giữ tối đa +5. Tạo 1 Bằng Chứng kể cả khi đã đạt trần hoặc đòn cướp bị Hộ Ấn chặn. Utility cố định, không nâng Rank.
- **Lưỡi Dao Tắt Đèn** — 7 MP, không CD. Vật lí Ám đơn mục tiêu, 160% ATK, trúng đòn gắn 1 Sơ Hở Ám. Sơ Hở mới chỉ dùng từ chiêu kế tiếp.
- **Mật Lệnh — Không Nhân Chứng** — 18 MP, CD 3. Tiêu toàn bộ Bằng Chứng đội đang có, tối thiểu 4. Hệ số: 200% ATK + 60% ATK/Bằng Chứng: 440% / 500% / 560% ở mức 4 / 5 / 6. Khi tiêu đủ 6: +30% sát thương và xuyên 25% DEF.
- **Mật Lệnh Của Lunarmare** — nội tại. Kỹ năng của bản thân có trả Bằng Chứng nhận +35% ATK cho cả kỹ năng. Đây là cộng thêm vào hệ số buff ATK khi tính chiêu, không phải cộng 35 điểm ATK, tăng 35% damage hay nhân số tầng đã tiêu. Không để lại buff.

## Quy tắc engine

`cost.teamResource` hỗ trợ chi phí cố định `{id, amount}` hoặc chi phí toàn bộ `{id, all:true, min}`. Kiểm tra mục tiêu và khả năng trả đầy đủ trước mọi mutation. Chốt lượng trả một lần, trừ trước damage, dùng snapshot cho toàn bộ hit. Simon phản ứng một lần/kỹ năng; Genevieve nhận lượng tiêu thật. Chiêu né vẫn trả tài nguyên.

`spentTeamResourceScaling` khai báo phần hệ số theo tài nguyên đã trả và ngưỡng nhận bonus damage/penetration. Rank tăng 10% mỗi bậc cho cả hệ số gốc lẫn phần theo Bằng Chứng, đúng một lần; +30% damage, xuyên DEF và nội tại +35% ATK giữ nguyên. Bonus +30% thuộc kỹ năng, cộng trong nhóm bonus damage nội tại hiện tại của engine, không bị luật lấy buff damage amp lớn nhất loại bỏ.

Cướp chỉ số dùng `steal_base_stat` và status có `baseStatShift`, với số phẳng lưu ở `baseStatModifiers`. Không thay dữ liệu level, trang bị, `stats` hoặc `baseStats` gốc. Trừ/cộng số phẳng trước mọi buff phần trăm. Hộ Ấn chặn debuff thì cũng không nhận phần cướp. Buff nhận và debuff mất tồn tại độc lập, có thể bị xóa riêng. Mỗi trạng thái giữ tối đa 5; không rút thêm từ một mục tiêu đã đạt trần mất ATK. Không cướp từ mục tiêu đã gục.

Hiệu lực giữ qua wave/phòng nếu chế độ đó giữ trạng thái; snapshot giữ nguyên số phẳng. Trận mới tạo lại actor, không giữ hiệu lực. Không thêm VFX bàn đấu hoặc BGM; dùng bộ chém vật lí và hiệu ứng status hiện có.

## Lunarmare

**Phán Quyết Dưới Trăng** giữ 12 MP, CD 2; chi phí đổi 2 → 3 Bằng Chứng, hệ số 500% → 550% ATK và thêm xuyên 15% DEF. Đòn dùng hết Bằng Chứng vẫn hưởng dạng Lunarmare; chỉ rời dạng sau khi xử lý xong kỹ năng và Liên kích. CD biến hình 2 vòng vẫn bắt đầu khi rời dạng.
