# Amaryllis — Người giữ đèn nhà thờ

> **Ghi chú phiên bản:** nhân vật mới, triển khai 04/11/2026 theo yêu cầu thiết kế. Số liệu là bản đầu tiên cần playtest, không phải kết luận cân bằng. Luật chung ở [ENGINE_RULES](ENGINE_RULES.md); thông số thô lấy từ JSON.

## Định danh

Cô gái hiền từ của nhà thờ Thủ đô; một đêm tuổi mới lớn đi chơi rồi lạc vào khu cơ sở hạ tầng của Rhett và ở lại đó. Trong dữ liệu: `affiliation: "rhett_research_facility"`, tag `rhett_lab`, hệ **Thổ**, `roleGroup: defensive_support`, nhãn vai trò "Hỗ trợ sinh tồn".

Cô chỉ làm một việc: hồi máu — và hồi rất nhiều theo MAG.

## Chỉ số thô

Earth / defensive_support · HP150 / MP150 / ATK7 / MAG40 / DEF13 / RES26 / SPD18.

MP 150 đủ để duy trì heal liên tục; DEF thấp nên cô cần được che chắn, không tự trụ được.

## Kỹ năng

| Kỹ năng | MP / CD | Hiệu ứng |
| --- | --- | --- |
| Lời Cầu Dịu Êm `amaryllis.mend` | 10 / không CD | Hồi một đồng đội 180% MAG |
| Vòng Tay Che Chở `amaryllis.blessing` | 16 / không CD | Hồi toàn đội 80% MAG mỗi người |
| Kinh Cầu Hồi Sinh `amaryllis.litany` | 20 / CD10 | Hồi sinh toàn đội về 100% HP và hồi toàn đội 100% MP |

Hai kỹ năng hồi máu dùng `growthProfile: heal` — Rank ×1,1 mỗi cấp. **Kinh Cầu là kỹ năng cố định**: không có cấp nâng, hồi chiêu giữ nguyên **10 vòng**; việc nâng Rank đã bị bỏ theo quyết định 04/11/2026. Quy tắc chung ở [SKILL_RANKS](SKILL_RANKS.md).

## Nội tại · Đèn Dầu Không Tắt

`type: heal_mp_regen`, `ratio: 0.1`, `cap: 10`.

Mỗi lần cô hồi máu, cô hồi thêm **10% lượng hồi cô tạo ra cho từng người** thành MP, tối đa **10 MP mỗi người được hồi**.

- Tính trên **lượng hồi Amaryllis tạo ra**, trước giảm hồi của người nhận và trước trần HP: mục tiêu đầy HP vẫn tính, Vết Thương Sâu trên người nhận không làm giảm MP nhận được.
- **Heal toàn đội tính theo đầu người**: mỗi người được hồi cộng riêng 10% lượng hồi của chính người đó, trần 10 MP/người — không gộp tổng lượng heal rồi mới tính. Heal 4 người đủ lớn có thể hồi tới 40 MP.
- MP đầy vẫn kích hoạt bình thường ("kể cả ở Max MP") nhưng phần vượt bị chặn ở MP tối đa.
- Chỉ tính phần hồi từ **kỹ năng của chính cô**; hồi máu từ đồng đội, regen, hút máu hoặc Độc không kích hoạt.

## Hồi sinh

`amaryllis.litany` dùng effect `revive` (dùng chung, không riêng Amaryllis):

- Mọi người cùng đội: người đã gục trở lại với **100% HP tối đa** và **100% MP tối đa**; người còn sống cũng được hồi đầy HP/MP.
- **Xóa Kế Ước Thế Chấp** (kèm nợ HP) trên toàn đội, kể cả người chưa gục. **Không xóa Vết Thương Sâu** — Vết Thương Sâu vẫn nằm trên người mang và tiếp tục giảm các lần hồi sau.
- **Lượng hồi của hồi sinh luôn đủ lớn để vượt Vết Thương Sâu**: HP được đặt thẳng về 100%, nên dù còn Vết Thương Sâu thì lần hồi sinh này vẫn đầy HP.
- Người đã gục được làm sạch mọi hiệu ứng bất lợi khác khi trở lại; người còn sống giữ nguyên các debuff khác.
- **Cái chết không xóa buff/debuff**: khi gục, Kế Ước bị xóa cùng nợ HP, còn các status khác (kể cả Vết Thương Sâu) vẫn nằm trên người gục. Vì vậy Vết Thương Sâu vẫn còn đó lúc hồi sinh và lần hồi sinh vẫn phải vượt qua nó. Xem thêm [hợp đồng vòng đời](COMBAT_LIFECYCLE_CONTRACT.md).
- Người hồi sinh **không hành động trong vòng đang diễn ra**; vòng kế tiếp mới được xếp lượt.
- Không hồi sinh kẻ địch, không hồi sinh người ngoài đội, không cấp Lượt Thêm.
- Hồi sinh không tính là "hồi máu" cho nội tại Đèn Dầu Không Tắt.

### VFX dùng chung

Engine phát event `revive` cho từng người; timeline và `combat-effects` vẽ một hiệu ứng **Hồi sinh** duy nhất (glyph vòng sáng + số HP), dùng chung cho mọi kỹ năng `revive` sau này — không cần presentation riêng theo nhân vật. Có nhánh reduced-motion.

## Chiêu Mộ

Đã có trong pool banner `standard` ("Tiếng gọi Prisma") cùng toàn bộ nhân vật chính thức khác.

## Phần chưa làm

- Chưa có VFX heal riêng; dùng glyph hồi máu mặc định.
- Chưa chạy playtest cân bằng số heal ở Lv50.

## Kiểm chứng

`test/amaryllis.test.js`: định danh/chỉ số, heal 180%/80% theo MAG, không CD, trần 10 MP và trạng thái MP đầy, MP vẫn hồi khi mục tiêu đầy HP, hồi sinh toàn đội + xóa Kế Ước/giữ Vết Thương Sâu + hồi chiêu, Kinh Cầu cố định không nâng Rank và CD luôn 10, sống/chết không xóa buff-debuff, pool Chiêu Mộ. Ngoài ra chạy `validate`, typecheck và toàn bộ unit test.
