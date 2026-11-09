# Verena — Người Giữ Những Bình Minh

Triển khai 04/11/2026. DPS vật lí Hỏa, nữ quý tộc dành tuổi thanh xuân gây quỹ cho trẻ em mồ côi. Chưa xác định gia tộc/phe phái: để trống affiliation, không tự gán phe. Nhân vật chính thức trong Chiêu Mộ thường, không miễn phí mở khóa, chưa có Trấn Phái/truyện riêng. Dùng VFX Hỏa vật lí có sẵn, không đổi nền.

## Bộ kỹ năng Rank 1

HP190 / MP85 / ATK32 / MAG10 / DEF17 / RES18 / SPD19. Đánh thường 100% ATK vật lí Hỏa.

| Chiêu | Chi phí | Hiệu ứng |
| --- | --- | --- |
| Ngọn Lửa Vì Ngày Mai | 10 MP, không CD | 180% ATK chính / 120% ATK mọi địch còn lại. Đủ Thế Chấp bằng 10% HP tối đa thì tiêu lượng nợ đó thay toàn bộ MP. |
| Đặt Cược Cả Thanh Xuân | 8 MP / CD3 | Tự nhận nợ bằng 40% HP tối đa (trần chung 50%); tăng 30% ATK trong 3 lượt chính. |
| Tất Cả Cho Những Bình Minh | 14 MP / CD3, cần có nợ | Tiêu toàn bộ nợ một lần; 240% ATK mọi địch rồi hồi HP bản thân bằng 75% khoản đã tiêu. |

Nội tại **Một Lời Hứa Chưa Trả**: có nợ thì +15% sát thương. Khi còn nợ, mọi hồi HP từ nguồn khác bị chặn hoàn toàn, không trả nợ; chỉ tự hồi phục được nhận. Khiên, hồi MP, cleanse hoạt động bình thường. Không thay đổi Khế Ước/Sinh Mệnh Thế Chấp của nhân vật khác.

## Hợp đồng engine

- Nợ là `debtHp` của `life_mortgage`, không phải stack. Không mất HP khi vay/tiêu nợ. Tự áp không bị Hộ Ấn của chính mình chặn; nợ vẫn là debuff có thể giải. Không có thời hạn, qua phòng/phase theo luật chung [LIFE_MORTGAGE](LIFE_MORTGAGE.md).
- `cost.preferLifeDebtRatio` dùng ceil(HP tối đa hiện tại × ratio), chỉ thay MP nếu đủ toàn khoản. Thiếu nợ thì dùng MP và giữ nợ; thiếu cả MP thì từ chối. Chi phí bằng nợ không tiêu Nhiễu Ma Lực/Thuốc Súng tính theo MP thực trả. Không tăng chi phí nợ theo Rank.
- `cost.consumeAllLifeDebt` cần `requiresLifeDebt`; vẫn trả MP của chiêu. Snapshot lượng nợ trước sát thương, xóa bằng thao tác tiêu nợ (event `life_debt_spent`, khác hồi phục `life_debt_paid`). Toàn bộ mục tiêu dùng chung snapshot, không tiêu lại mỗi hit.
- `heal.spentLifeDebtRatio` dùng snapshot nợ đã tiêu để hồi cho self, sau các hit. Vết Thương Sâu giảm hồi bình thường. Nếu phản ứng giữa đòn tạo nợ mới, hồi phục vẫn trả nợ mới trước; nếu đã gục thì không tự hồi sinh. Né/không gây damage vẫn mất chi phí đã trả và vẫn tự hồi nếu sống.
- Bonus sát thương native snapshot đầu hành động trước tiêu nợ, áp dụng cả đòn tiêu phần nợ cuối và toàn bộ tất toán. Cộng cùng nhóm native bonus hiện hành, không phải buff khuếch đại status. Phản ứng mới snapshot trạng thái tại thời điểm bắt đầu của chính nó.
- Chặn hồi tại healHp dùng source actor ID: regen của đồng đội vẫn bị chặn kể cả người đó đã gục; hút máu/gear tự hồi/source chính mình được phép, trả nợ trước rồi hồi HP. Nguồn không xác định không được coi là tự hồi. Hồi đầy toàn đội/hồi sinh của Amaryllis cũng không hồi HP hoặc xóa nợ của Verena còn sống; phần hồi MP vẫn có hiệu lực. Verena đã gục mất nợ nên được hồi sinh bình thường. Chặn không tạo heal hoặc trả nợ giả, không kích hoàn MP cho người chữa. Gear hồi cấp cứu không chọn mục tiêu đang bị chặn.
- Buff ATK giảm cuối lượt chính của người nhận, choáng vẫn giảm, Lượt Thêm không giảm. CD3 khóa ba vòng sau cast, sẵn sàng R+4. Lượt Thêm dùng chi phí nợ riêng, không giảm CD. Nợ không tự giảm khi bỏ lượt.
- Lệnh bị từ chối không tiêu MP/nợ/CD. Forecast chỉ sửa clone, snapshot lưu nguyên nợ, PvP hai phe dùng cùng helper/ID riêng. Gục và kết thúc thật xóa nợ; tiếp wave/phase giữ theo engine.
- Rank: sát thương/hồi phục ×1.1 mỗi cấp, buff ATK ×1.05; lượng vay 40%, trần 50%, giá nợ 10%, nội tại 15% và CD giữ nguyên.

Kiểm chứng: `test/verena.test.js`, `e2e/verena.spec.ts`. AI dùng forecast có tính nợ/thanh toán/chặn hồi; profile riêng ưu tiên chuẩn bị và tự cứu khi HP thấp. Test không chứng minh cân bằng.
