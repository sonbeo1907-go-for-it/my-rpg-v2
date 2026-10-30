# Sieg và Minerva

Cả hai là nhân vật chính thức trong banner thường và mục đổi Pure Prisma; ban đầu bị khóa, dùng lại quy tắc bản trùng và trang bị. Không đổi phiên bản save.

## Sieg · Kiếm sĩ Ngân Triều

Elf, Kị sĩ đoàn Thủ đô. Thủy, Đấu sĩ. HP235 / MP80 / ATK29 / MAG10 / DEF30 / RES24 / SPD6.

Kiếm Kĩ: bắt đầu 0, tối đa 4. Tích theo lần thi triển kỹ năng, không theo số mục tiêu/hit; đánh thường không tích. Nếu người thi triển bị hạ giữa đòn thì không nhận tầng sau đó. Né/giết mục tiêu vẫn nhận tầng nếu hoàn thành kỹ năng. Kiệt sức chặn việc tích tài nguyên theo luật chung.

| Kỹ năng | Chi phí | Hồi chiêu hiển thị | Hiệu lực |
| --- | --- | ---: | --- |
| Thủy kiếm: Khai thức | 5 MP | — | Đơn mục tiêu, vật lí Thủy 160% ATK; +1 Kiếm Kĩ |
| Kết giới Ngân Triều | 24 MP | 4 | Khiên toàn đội = 200% DEF hiện tại của Sieg; toàn đội +30% DEF/RES; +2 Kiếm Kĩ |
| Triều kiếm: Phá thế | 8 MP | 2 | Đơn mục tiêu 180% ATK; trúng đòn giảm 15% ATK trong 2 lượt chính của mục tiêu; +1 Kiếm Kĩ |
| Bí kiếm: Tịch Hải | Ưu tiên 4 Kiếm Kĩ; thiếu tầng thì 24 MP | 2 | Đơn mục tiêu 360% ATK; trúng đòn giảm 15% SPD trong 2 lượt chính của mục tiêu |

**Tĩnh tâm trong sóng:** khi bản thân còn khiên, +8% sát thương. Nhận khiên từ nguồn nào cũng được. Xét trước mỗi hit, cộng với bonus sát thương cùng nhóm, không tăng ATK hoặc cộng hệ số kỹ năng.

### Cửa sổ bảo hộ

Cả khiên và buff DEF/RES tồn tại 3 vòng toàn cục, tính cả vòng thi triển, hết sau mọi Vòng Phụ. Ví dụ dùng ở vòng 1: còn trong vòng 1–3, mất ở vòng 4–5, dùng lại được ở vòng 6. Đây là đúng 2 vòng trống; không lệ thuộc SPD hoặc lượt phụ.

Engine hiện hiển thị hồi chiêu bằng số vòng chờ sau vòng thi triển: đặt cooldown 4 để có chu kỳ dùng lại cách 5 vòng. Không thay cách đếm của kỹ năng cũ.

Khiên được tính **trước** buff DEF/RES cùng kỹ năng: chỉ số gốc tạo 60 khiên. Chỉ khiên mới mạnh hơn mới ghi đè, không cộng dồn. Khi ghi đè phải thay cả nguồn và hạn khiên. Khiên tự hết hạn không tính là bị đánh vỡ, không kích hoạt hồi HP/MP từ vỡ khiên. Khiên mạnh hơn không có thời hạn từ nguồn khác xóa hạn cũ; khiên yếu hơn không kéo dài hạn.

### Ưu tiên cách trả

`cost.preferResource` là cơ chế dùng lại. Khi thi triển, đủ 4 tầng thì bắt buộc chọn tầng và trả 0 MP, kể cả khi MP còn nhiều. Chưa đủ thì trả MP và giữ nguyên tất cả tầng. Không đủ cách trả tương ứng thì không thi triển. Không được tránh hồi chiêu bằng cách đổi tiền trả. Chốt cách trả một lần trước các hiệu ứng; tầng tiêu sau thi triển theo cấu hình. Không trừ đồng thời MP và tầng. Mục tiêu không hợp lệ không làm mất tài nguyên.

## Minerva · Cô gái mang lời nguyền

Sống trong rừng, được Gahallad che chở. Thổ, hỗ trợ phòng thủ. HP160 / MP110 / ATK8 / MAG28 / DEF15 / RES28 / SPD24.

| Kỹ năng | MP | Hồi chiêu hiển thị | Hiệu lực |
| --- | ---: | ---: | --- |
| Hộ ấn rừng lặng | 10 | 2 | Cấp Hộ Ấn cho toàn đội, một lần chặn/người |
| Gột lời nguyền | 6 | 1 | Giải mọi debuff đang có trên đồng đội còn sống |
| Dược cỏ dưới trăng | 4 | — | Hồi 90% MAG HP cho một đồng đội; cơ bản 25 HP, không có hệ số cấp cứu |

**Đồng cảm lời nguyền:** khi đồng đội thực nhận debuff từ kẻ địch, hồi 50% MAG của Minerva cho người đó, cơ bản 14 HP. Tối đa một lần/người/vòng, gồm bản thân. Vòng Chính và Vòng Phụ chung hạn mức. Cả nguồn và người nhận phải còn sống. Đang đầy HP không tiêu hạn mức.

Debuff bị Hộ Ấn chặn không kích hoạt. Debuff tự gây, sát thương thuần, và thao tác giải debuff không kích hoạt. Làm mới debuff từ địch được tính như một lần nhận mới nhưng vẫn chịu hạn mức. Hộ Ấn chặn từng hiệu ứng, không chặn toàn bộ kỹ năng nhiều debuff; dùng lại chỉ làm mới một lần chặn, không cộng dồn. Minerva hồi máu yếu, ưu tiên phòng ngừa và giải hiệu ứng; không có hồi HP diện rộng chủ động.

## Hợp đồng engine

- `durationClock: round`: mốc hết hạn tuyệt đối; hết sau Vòng Phụ, không bị trừ theo lượt từng người. Vòng thi triển được tính. Sang phòng chốt lại số vòng còn lại từ mốc cũ, không cộng thêm thời hạn.
- Khiên `durationRounds`: giữ `shieldExpiresAfterRound` trên khiên đang được trang bị. Chỉ khi ghi đè thật mới thay hạn; hết hạn là sự kiện riêng với bị đánh vỡ.
- `shielded_damage_bonus`: điều kiện theo khiên ở đầu mỗi hit.
- `debuff_received_heal`: phản ứng sau khi debuff thực sự được gắn, dùng hạn mức trên người nhận theo nguồn và vòng; đặt sau kiểm tra miễn nhiễm để không hồi nhầm khi Hộ Ấn đã chặn.
- Tài nguyên trận, thời hạn, khiên và hạn mức phản ứng không nằm trong save tiến trình. Dùng lại snapshot/chuyển phòng hiện có; không đổi luật hầm ngục khác.
