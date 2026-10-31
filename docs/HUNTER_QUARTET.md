# Yufina, Karin, Elise, Yumia và đổi Original Prisma

Bốn nhân vật chính thức trong Chiêu Mộ và đổi Pure Prisma, mặc định chưa sở hữu, bản trùng 0. Giữ save v6; `shopDaily` là dữ liệu bổ sung tùy chọn, save cũ tự nhận hạn mức chưa dùng.

| Nhân vật | Hệ / Vai trò | HP | MP | ATK | MAG | DEF | RES | SPD |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Yufina | Quang / DPS ma pháp | 170 | 100 | 33 | 22 | 17 | 23 | 22 |
| Karin | Thường / DPS vật lí diện rộng | 225 | 75 | 33 | 8 | 16 | 14 | 18 |
| Elise | Thủy / DPS ma pháp | 145 | 110 | 9 | 35 | 13 | 28 | 19 |
| Yumia | Ám / DPS vật lí phản đòn | 175 | 85 | 32 | 12 | 17 | 20 | 23 |

## Yufina — Quang quyền tân tinh

Tân cử nhân Học Viện Ma Pháp gia nhập Hội Thợ Săn với lòng nhiệt huyết. **Mọi đòn đánh dùng ATK nhưng gây sát thương phép Quang**: tính RES, không né vật lí, có thể kích hoạt Liên kích phép đơn mục tiêu của Aurora.

- **Quang quyền khai thức** — 4 MP, 150% ATK, đơn mục tiêu. Lựa chọn tiết kiệm.
- **Quyền phá kết giới** — 12 MP, 260% ATK, xuyên 25% RES. Lựa chọn xuyên kháng phép.
- **Chấn quang phong thuật** — 9 MP, 160% ATK, giảm 20% MAG trong 2 lượt chính của địch. Lựa chọn bảo vệ đội trước pháp sư.
- **Quang quyền bừng sáng** — 12 MP, CD 2 theo quy ước engine, combatMode 3 vòng tính cả vòng dùng: +35% ATK, +20% SPD, giảm 12% MP cho ba chiêu công kích trên. Không thể gọi chồng khi đang ở dạng này. Ba kỹ năng công kích không có CD. Dùng chuyển dạng ở vòng 1: dạng hết cuối vòng 3, dùng lại ngay lượt kế tiếp ở vòng 4; không có vòng nghỉ bắt buộc.
- **Ngọn lửa ngày ra trường** — khi dạng kết thúc, hồi 20% MP tối đa, một lần theo sự kiện rời dạng.

Chi phí giảm làm tròn lên: 4 → 4, 12 → 11, 9 → 8 MP. Không giảm chi phí chuyển dạng, đánh thường hoặc Phòng thủ. CombatMode tăng **35% ATK**, trực tiếp tăng sát thương quyền thuật. MAG không bị tăng; sát thương vẫn thuộc loại ma pháp Quang và tính qua RES. ATK buff từ đồng đội cộng theo quy tắc chỉ số hiện có.

## Karin — Cuồng đao tuyệt lộ

- **Hoành kiếm liều mạng** — 7 MP, toàn địch: 90% ATK + tối đa 80% ATK theo tỷ lệ HP đã mất.
- **Cuồng trảm tuyệt lộ** — 14 MP, CD 2, toàn địch: 140% ATK + tối đa 140% ATK theo tỷ lệ HP đã mất.
- **Huyết thệ cuồng đao** — 6 MP và 20% HP tối đa (làm tròn lên): +25% sát thương trong 2 lượt chính. Cần HP hiện tại lớn hơn chi phí; không thể tự hạ gục. Khiên không trả thay chi phí này.
- **Cơn cuồng chiến** — sát thương trực tiếp tăng `60% × tỷ lệ HP đã mất`, cộng với buff tăng sát thương khác. HP xét trước từng hit.

Chi phí HP không phải bị địch tấn công, không kích hoạt Yumia hoặc hiệu ứng khiên vỡ. Đây là chủ động chấp nhận rủi ro, không được làm thành sát thương tự đánh có thể gây vòng phản ứng.

## Elise — Tông đồ Mikaielis

- **Thủy kinh Mikaielis** — 6 MP, 170% MAG đơn mục tiêu.
- **Rửa tội những đặc ân** — 10 MP, 140% MAG rồi xóa 1 buff cũ nhất còn trên mục tiêu.
- **Thánh triều phán quyết** — 16 MP, CD 2: 240% MAG + 40% MAG mỗi loại buff trên địch, tối đa 3 loại (360% MAG).
- **Phán xét những đặc ân** — +20% sát thương/loại buff địch, tối đa +60%.

Đếm các loại trạng thái buff khác nhau đang hoạt động, không đếm số tầng hoặc số chỉ số trong cùng một buff. Khiên, combatMode và hiệu ứng bàn đấu không tính như buff trạng thái. Đếm lại trước mỗi hit. Xóa buff có thể làm giảm bonus ở chiêu sau; chiêu Rửa tội gây sát thương trước rồi mới xóa.

`dispel` chỉ xóa trạng thái buff; không tác động debuff, khiên hay mode. Xóa trạng thái gốc cũng gỡ buff đi kèm của nó theo cơ chế linked buffs hiện có. Hộ Ấn không chặn việc bị xóa buff. Chiêu thuần xóa buff ghi dấu Phá cho Auguste; chiêu có sát thương vẫn ưu tiên dấu Kích.

## Yumia — Người chẳng chịu buông tay

- **Đừng rời khỏi tầm mắt** — 6 MP, 120% ATK đơn mục tiêu, giảm 25% SPD trong 2 lượt chính của địch.
- **Không ai che chở ngươi** — 10 MP, xóa toàn bộ buff của một đối thủ.
- **Ở lại bên tôi** — 8 MP, CD 3, toàn đội +15% RES trong 3 lượt chính của từng người.
- **Đừng chạm vào người của tôi** — sau một kỹ năng địch gây sát thương trúng ít nhất một đồng đội khác, phản đòn **420% ATK Ám** vào kẻ tấn công; tối đa 1 lần/vòng. Đây là hệ số cao nhất trong kit.

Đợi toàn bộ hit và hiệu ứng của chiêu xử lý xong; AoE hoặc nhiều đồng đội bị đánh vẫn chỉ phản đòn một lần. Tính sát thương vào HP hoặc khiên, kể cả đồng đội đó gục. Bỏ qua đánh thường, đòn chỉ đánh Yumia, né hoàn toàn, debuff thuần, độc và đòn phản ứng. Yumia và người tấn công phải còn sống lúc phản đòn. Vòng Chính/Vòng Phụ dùng chung quota; không cấp lượt, không tiêu MP và không sinh chuỗi phản đòn/Liên kích.

## Shop — Original Prisma hằng ngày

Trong tab **Chuyển đổi Prisma**, thêm thẻ **Đổi Original Prisma**: 10 Pure Prisma → 1 Original Prisma, tối đa 3 lần/ngày/hồ sơ, có xác nhận.

- Làm mới 00:00 `Asia/Ho_Chi_Minh`, dùng cùng đồng hồ ngày với hầm ngục và ủy thác.
- Lưu `{day, originalExchanges}` trong `shopDaily`. Save cũ thiếu trường này nhận ledger rỗng; không đổi phiên bản save.
- Tiền và hạn mức nằm trong cùng giao dịch: chỉ cập nhật UI sau khi ghi thành công. Lỗi lưu cho phép thử lại, không trừ tiền/đếm lượt trước.
- Giữ hạn mức khi quay lùi đồng hồ. Mở modal trước nửa đêm vẫn dùng ngày hiện tại tại thời điểm xác nhận.
- Không đổi pity, không tiêu Prisma thường hoặc Coin. 30 Pure Prisma đổi tối đa 3 Original Prisma/ngày, độc lập nguồn Original từ Ủy Thác.

Các số là cân bằng khởi điểm để tune bằng battle log. CD N giữ quy ước engine: dùng vòng 1, CD 2 sẵn lại vòng 4.
