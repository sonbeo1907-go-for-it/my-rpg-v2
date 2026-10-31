# Sylva, Drake và điều chỉnh Chloe

Hai nhân vật chính thức thuộc lớp Thuật Sư; có trong Chiêu Mộ thường và đổi Pure Prisma. Mặc định chưa sở hữu, mức bản trùng 0, không đổi phiên bản save.

| Nhân vật | Hệ | HP | MP | ATK | MAG | DEF | RES | SPD |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Sylva | Hỏa | 155 | 115 | 10 | 32 | 14 | 25 | 21 |
| Drake | Thổ | 215 | 120 | 12 | 28 | 24 | 24 | 12 |

## Sylva — Tiếng nói của muông thú

Cô bé được Hội Thợ Săn giữ lại vì có thể nói chuyện với thú dữ. Azurius là phi long khế hữu, không phải vật hiến tế hoặc một ô nhân vật thứ năm.

| Dạng thường | Chi phí | Tác dụng |
|---|---|---|
| Đốm lửa dẫn đường | 6 MP | 150% MAG Hỏa, một địch |
| Bàn tay nhỏ dịu dàng | 6 MP | Hồi 110% MAG + 8 HP, một đồng đội |
| Lời thì thầm hoang dã | 8 MP | Bản thân +25% MAG, 2 lượt chính |
| Azurius, đến bên tớ! | 18 MP, CD 5 | Gọi Azurius ngay; ở lại 3 vòng tính cả vòng gọi |

Azurius hiện diện: **+6 MAG căn bản**, ba chiêu thường đổi thành:

| Kỹ năng phối hợp | Chi phí | Tác dụng |
|---|---|---|
| Azurius: Hơi thở rạng đông | 12 MP | AoE Hỏa, 220% MAG mục tiêu chính / 110% MAG địch khác |
| Azurius: Đôi cánh chở che | 10 MP, CD 2 | Khiên toàn đội 100% MAG + 8 |
| Azurius: Vút qua tầng mây | 14 MP, CD 2 | 320% MAG Hỏa đơn mục tiêu |

Đánh thường và Phòng thủ vẫn dùng được. Lệnh gọi Azurius ẩn khi đang có phi long. Hết vòng thứ ba, hoặc Sylva gục/kết thúc trận, Azurius rời sân; khôi phục bộ kỹ năng thường. Không hoàn MP khi rời sân. Khiên đã cấp vẫn theo quy tắc khiên thông thường.

## Drake — Tảng đá bất động

Trước khi lên giáp, các kỹ năng được thay bằng **Thổ Địa Vũ Trang**. Phòng thủ vẫn khả dụng, tránh kẹt Lượt Thêm lúc giáp chưa hoàn tất; không dùng đánh thường hoặc kỹ năng giáp trước khi chuyển dạng.

**Thổ Địa Vũ Trang:** 12 MP, dùng một lượt chuẩn bị. Đầu vòng toàn cục kế tiếp lên giáp, **+5 DEF và +5 RES căn bản**, cấp khiên bản thân bằng **100% HP tối đa hiện tại** (có tính trang bị). Giữ khiên mạnh hơn nếu đã có. Duy trì đến hết trận/chuyến; không mất dạng khi khiên bị phá. Không tạo lại khiên ở mỗi vòng hoặc khi sang phòng mới.

| Kỹ năng sau khi lên giáp | Chi phí | Tác dụng |
|---|---|---|
| Bức tường nham thạch | 10 MP | Khiên toàn đội 100% DEF + 12 |
| Thành trì địa mạch | 10 MP, CD 3 | Toàn đội +25% DEF và RES, 3 vòng toàn cục tính cả vòng dùng |
| Thạch Vệ, thức tỉnh! | 18 MP, CD 5 | Golem xuất hiện đầu vòng sau, tồn tại 3 vòng |
| Trọng áp địa tầng | 6 MP | 180% MAG Thổ một địch, giảm 15% ATK trong 2 lượt chính |

**Thạch Vệ:** mỗi đầu vòng và cuối vòng (sau Vòng Phụ), Liên kích vật lí Thổ toàn địch bằng **100% DEF hiện tại của Drake**. Ba vòng đầy đủ cho tối đa 6 lần. Không tiêu lượt/MP của Drake, không chiếm ô đội hình, không có HP/aggro riêng. Không hưởng hoặc tiêu buff đòn kế, không kích hoạt chuỗi phản ứng hay Liên kích khác.

Đây là Liên kích theo đồng hồ vòng; không phải phản ứng theo đòn của Drake. Quy tắc phản ứng thông thường vẫn cấm tự kích hoạt từ đòn bản thân. Khi Drake gục, hủy cả Golem đang chờ và đang hoạt động. Không thể gọi chồng khi Golem còn trên sân hoặc đang chờ.

## Chloe

**Chăm chút bằng chân mèo:** giữ 6 MP, hồi 160% MAG + 10 HP. Đồng thời cấp **+15% ATK, DEF và SPD trong 2 lượt chính của người nhận**, kể cả khi đã đầy HP. Dùng lại làm mới, không cộng tầng.

## Engine / UX

- `combatModes.lifetime`: `resource` (Astoria giữ nguyên), `rounds` (Azurius), `permanent` (giáp Drake).
- `prepare_mode`: lịch chuyển dạng gắn chủ sở hữu, chỉ xử lý ở đầu vòng sau; Lượt Thêm không đẩy nhanh thời điểm này.
- `normalAbilities` / `commandAbilities` / `preModeAbility`: tập lệnh thay đổi theo dạng; engine chặn ID cũ ngoài UI.
- `companions`: định nghĩa đòn đầu/cuối vòng; `companionStates` lưu mốc bắt đầu/hết hạn và quota mỗi mốc trước khi gây sát thương.
- Modes, lịch chờ và Golem đi qua phòng cùng actor, giữ mốc vòng tuyệt đối. Không cấp lại bonus, khiên hoặc gia hạn. Đổi phase Miraebolis không thay actor và không reset các trạng thái này.
- Kết thúc trận cuối hoặc chủ sở hữu gục: dọn mode/lịch chờ/Golem. Chiến thắng phòng giữa chuyến giữ lại đúng thời hạn còn lại.
- Golem có thể kết liễu địch ở mốc vòng; engine xử lý kết quả/đổi phase trước khi phát lượt kế tiếp.
- SVG riêng: Azurius trên rừng hoàng hôn, giáp nham thạch khắc ấn, Golem Thạch Vệ. Các lớp và banner hiển thị độc lập, không che trạng thái Monica/Auguste. Không cần nhạc mới; giữ nhạc trận hiện tại, Magnamut vẫn có quyền ưu tiên BGM khi cùng xuất hiện.
- Reduced motion tắt nhịp sáng; cảnh không chặn thao tác, mô tả trạng thái và thời hạn vẫn hiện bằng chữ.

Quy ước CD giữ nguyên engine: CD N khóa N vòng kế tiếp; ví dụ CD 2 dùng vòng 1 thì sẵn lại vòng 4. Đây là bộ số khởi điểm để tune bằng battle log.
