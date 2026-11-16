# Đại Yêu Ma — báo cáo playtest 15/11/2026

## Phạm vi

1.440 trận: 30 seed × 3 đội × 4 cấp × 4 encounter. Seed từ `2026111501` đến `2026111530`, ghép cặp cùng seed/build cho ba boss mới và Miraebolis. Dùng chính `planAutoBattleTurn` hiện hành; không viết chiến thuật AI riêng cho từng boss.

Mỗi nhân vật Lv50, phân điểm hợp lệ, sáu món T3 (bốn dòng sức mạnh và hai HP), Rank 5 hoặc Thông Thạo 3 nếu đã phát hành. Mở khóa truyện được giả lập trên fixture; không dùng Trấn Phái, T4 hoặc vật phẩm tiêu hao. Đây không phải kiểm chứng người chơi mới hay đội hình ngân sách tối thiểu. Không đọc hoặc sửa save AppData.

## Tỷ lệ thắng tổng hợp

Mỗi ô là số trận thắng / 90; ba đội được tính trọng số ngang nhau.

| Encounter | Lv60 | Lv70 | Lv80 | Lv90 |
| --- | ---: | ---: | ---: | ---: |
| Miraebolis (đối chứng) | 84/90 | 80/90 | 66/90 | 61/90 |
| Cự Quỷ Gánh Núi | 59/90 | 30/90 | 30/90 | 12/90 |
| Cửu Vĩ Dệt Chú | 60/90 | 60/90 | 57/90 | 28/90 |
| Song Quỷ Trấn Môn | 37/90 | 30/90 | 29/90 | 27/90 |

## Theo đội và cấp

Mỗi dòng gồm 30 trận. Trung vị vòng chỉ tính các trận thắng; “—” nghĩa là không có trận thắng.

### Arthur / Iris / Takeshi / Elaine

| Cấp | Encounter | Thắng | Trung vị vòng thắng | Lỗi engine |
| ---: | --- | ---: | ---: | ---: |
| 60 | Miraebolis (đối chứng) | 24/30 | 14 | 0 |
| 60 | Cự Quỷ Gánh Núi | 0/30 | — | 0 |
| 60 | Cửu Vĩ Dệt Chú | 0/30 | — | 0 |
| 60 | Song Quỷ Trấn Môn | 0/30 | — | 0 |
| 70 | Miraebolis (đối chứng) | 20/30 | 19 | 0 |
| 70 | Cự Quỷ Gánh Núi | 0/30 | — | 0 |
| 70 | Cửu Vĩ Dệt Chú | 0/30 | — | 0 |
| 70 | Song Quỷ Trấn Môn | 0/30 | — | 0 |
| 80 | Miraebolis (đối chứng) | 6/30 | 24 | 0 |
| 80 | Cự Quỷ Gánh Núi | 0/30 | — | 0 |
| 80 | Cửu Vĩ Dệt Chú | 0/30 | — | 0 |
| 80 | Song Quỷ Trấn Môn | 0/30 | — | 0 |
| 90 | Miraebolis (đối chứng) | 1/30 | 33 | 0 |
| 90 | Cự Quỷ Gánh Núi | 0/30 | — | 0 |
| 90 | Cửu Vĩ Dệt Chú | 0/30 | — | 0 |
| 90 | Song Quỷ Trấn Môn | 0/30 | — | 0 |

### Chiyoko / Shion / Amiya / Kaguya

| Cấp | Encounter | Thắng | Trung vị vòng thắng | Lỗi engine |
| ---: | --- | ---: | ---: | ---: |
| 60 | Miraebolis (đối chứng) | 30/30 | 11 | 0 |
| 60 | Cự Quỷ Gánh Núi | 29/30 | 13 | 0 |
| 60 | Cửu Vĩ Dệt Chú | 30/30 | 11 | 0 |
| 60 | Song Quỷ Trấn Môn | 30/30 | 10 | 0 |
| 70 | Miraebolis (đối chứng) | 30/30 | 14 | 0 |
| 70 | Cự Quỷ Gánh Núi | 30/30 | 17 | 0 |
| 70 | Cửu Vĩ Dệt Chú | 30/30 | 19 | 0 |
| 70 | Song Quỷ Trấn Môn | 30/30 | 13 | 0 |
| 80 | Miraebolis (đối chứng) | 30/30 | 19 | 0 |
| 80 | Cự Quỷ Gánh Núi | 30/30 | 17 | 0 |
| 80 | Cửu Vĩ Dệt Chú | 27/30 | 23 | 0 |
| 80 | Song Quỷ Trấn Môn | 29/30 | 16 | 0 |
| 90 | Miraebolis (đối chứng) | 30/30 | 25 | 0 |
| 90 | Cự Quỷ Gánh Núi | 12/30 | 34 | 0 |
| 90 | Cửu Vĩ Dệt Chú | 27/30 | 24 | 0 |
| 90 | Song Quỷ Trấn Môn | 27/30 | 22 | 0 |

### Anabel / Artesia / Minerva / Geoffrey

| Cấp | Encounter | Thắng | Trung vị vòng thắng | Lỗi engine |
| ---: | --- | ---: | ---: | ---: |
| 60 | Miraebolis (đối chứng) | 30/30 | 5 | 0 |
| 60 | Cự Quỷ Gánh Núi | 30/30 | 19 | 0 |
| 60 | Cửu Vĩ Dệt Chú | 30/30 | 10 | 0 |
| 60 | Song Quỷ Trấn Môn | 7/30 | 19 | 0 |
| 70 | Miraebolis (đối chứng) | 30/30 | 9 | 0 |
| 70 | Cự Quỷ Gánh Núi | 0/30 | — | 0 |
| 70 | Cửu Vĩ Dệt Chú | 30/30 | 11 | 0 |
| 70 | Song Quỷ Trấn Môn | 0/30 | — | 0 |
| 80 | Miraebolis (đối chứng) | 30/30 | 9 | 0 |
| 80 | Cự Quỷ Gánh Núi | 0/30 | — | 0 |
| 80 | Cửu Vĩ Dệt Chú | 30/30 | 13 | 0 |
| 80 | Song Quỷ Trấn Môn | 0/30 | — | 0 |
| 90 | Miraebolis (đối chứng) | 30/30 | 13 | 0 |
| 90 | Cự Quỷ Gánh Núi | 0/30 | — | 0 |
| 90 | Cửu Vĩ Dệt Chú | 1/30 | 34 | 0 |
| 90 | Song Quỷ Trấn Môn | 0/30 | — | 0 |

## Diễn giải và giới hạn

- Không có lỗi chạy engine trong 1.440 trận. Tỷ lệ thắng tổng hợp của cả ba encounter mới đều thấp hơn Miraebolis ở cả bốn cấp trong bộ fixture này.
- Nhóm Arthur/Iris/Takeshi/Elaine không thắng boss mới ở cấu hình thử này. Nội dung nhắm hậu kỳ; chưa thể kết luận mọi nhân vật cũ có một build đủ để thắng, hoặc đội miễn phí tối thiểu đã được nghiệm thu.
- Hồn Kiếm có thể thắng nhanh hơn Miraebolis: Song Quỷ Lv60 có trung vị 10 vòng so với 11 vòng của Miraebolis; Lv80 Cự Quỷ và Song Quỷ cũng nhanh hơn đối chứng. Khó hơn không đồng nghĩa mọi đội đều mất nhiều vòng hơn; sự khác biệt theo đội và khả năng phá nghi thức cần tiếp tục được playtest thủ công.
- Đội có giải hiệu ứng/bảo hộ thắng Cửu Vĩ Lv60–80 ổn định nhưng gặp áp lực lớn ở hai encounter còn lại. Đây là dấu hiệu cơ chế có phân hóa, chưa phải chứng minh cân bằng hoàn chỉnh.
- Không thêm tăng trưởng riêng vượt engine để tạo khó giả; không sửa Miraebolis. Chỉ số nền Lv1, đường HP superboss và cấp thực được dùng khi chạy.

## Kiểm tra kỹ thuật

- Toàn bộ suite engine: **1.638/1.638 qua**, gồm **27 regression Đại Yêu Ma**.
- Kiểm tra nội dung và TypeScript: qua. Native save: **3/3 qua**. Build production và bộ cài Windows: thành công.
- Browser mới: **6/6 qua trên dev và 6/6 qua trên static production đã dùng để đóng gói EXE**. Bao gồm 1440/768/390 px, tắt Battle Logs vẫn thấy cơ chế, hai boss có hai thanh trạng thái, ba ô thân chỉ một target, RT Xbox và hồi quy chọn cấp Miraebolis.
- Một lần chạy mở rộng các E2E cũ có **10 ca thất bại / 6 ca qua**. Có fixture pháo đài không hợp lệ ngay tại encode save và kỳ vọng ba tab cũ trong khi HEAD đã có năm tab. Không sửa các suite ngoài phạm vi hoặc coi chúng là đã qua; xem log cục bộ `.taste-skill/yokai/browser-legacy.log` để phân loại tiếp.

## QA hình ảnh

Dùng design-taste-frontend cho app screen, direction True-black flat, seed `521722906`, giữ palette/type JRPG hiện hữu. Cảnh báo mới dùng panel phẳng và thông tin từ state thật; SVG mới có ngôn ngữ hình ảnh riêng cho từng boss. Giữ các chi tiết thương hiệu đã có (navy/vàng, serif, chữ nhỏ trên HUD, viền/ánh sáng/trang trí) thay vì áp toàn bộ quy tắc dashboard lên game. Source lint component cảnh báo: không lỗi/cảnh báo. Bộ inspector toàn trang còn bắt các chi tiết JRPG có sẵn; đã kiểm tra ảnh trực tiếp và không coi đó là chứng chỉ accessibility toàn game.

## Tái lập

```powershell
node scripts/great-yokai-playtest.mjs --seeds=30 --teams=old_mastery,sword_soul,cleanse_guard --out=.taste-skill/yokai/final-raw.json
npx.cmd playwright test e2e/east-superbosses.spec.ts --workers=1 --output=.taste-skill/yokai/e2e-production
```

Bản kết quả gọn kèm seed, outcome, vòng, HP/MP còn lại: [EAST_GREAT_YOKAI_PLAYTEST_RESULTS.json](EAST_GREAT_YOKAI_PLAYTEST_RESULTS.json). Raw cục bộ giữ cả campaign tổng hợp; bản đi kèm chỉ giữ stat fixture và kết quả để tránh phình tài liệu.


## Kiểm tra bản đóng gói

Inspector cuối trên DOM production: 0 FAIL / 0 WARN với các ngoại lệ JRPG đã nêu (`micro-label`, `gradient`, `text-shadow`, `button-fx`, `tiny-text`, `heavy-borders`, `app-title-size`). Font production tải đúng; lỗi fallback ở capture cũ đã được loại bằng cách giải URL theo stylesheet gốc. Đã xem lại ảnh 1440/768/390 px.

Tự chấm theo rubric của skill: thiết kế 7/10, khả dụng 7/10, sáng tạo 7/10, nội dung 8/10 (7,1/10). Điểm mạnh là cảnh báo theo state, phân biệt hai nghi thức và hình thân ba ô. Điểm còn hạn chế là mật độ HUD cũ và cần cuộn nhiều trên điện thoại; không nâng điểm chỉ vì inspector qua.

Graph code đã cập nhật; chỉ dùng trích xuất code cục bộ. Không bật semantic extraction hoặc tải dữ liệu lên dịch vụ ngoài.

- `src-tauri/target/release/northern-prisma.exe`: 233,376,256 byte, SHA-256 `31d58bf40110bbcc638752c1996d6cde2d2893ad65a4525fdff1dad2955cc863`.
- `src-tauri/target/release/bundle/nsis/The Prisma Origin_2.0.0_x64-setup.exe`: 190,643,715 byte, SHA-256 `488356c92268967e4271a1bc808fa27767a899643fc34ababb3cdf201c7c0388`.
