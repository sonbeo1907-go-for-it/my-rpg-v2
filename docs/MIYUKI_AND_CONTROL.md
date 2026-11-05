# Miyuki và Choáng theo chỉ số

Triển khai05/11/2026. Nhân vật chính thức, DPS vật lí Thủy /Hồn Kiếm, thuộc Hội Thợ Săn Yêu Quái. Có gacha thường, dupe/Rank/AI theo luật chung; không có Trấn Phái hoặc truyện riêng. Dùng asset/VFX cơ bản, mode chỉ hiện trên thẻ, không đổi nền/BGM.

## Thông số playtest

HP175 /MP95 /ATK32 /MAG10 /DEF18 /RES20 /SPD20. Đây là cấu hình agent hoàn thiện vì brief chưa có stat/MP/CD cụ thể, không phải kết luận cân bằng.

| Kỹ năng | MP /CD | Rank1 |
| --- | --- | --- |
| Thủy Kiếm — Nhất Tuyến Trừ Yêu |6 /không CD|200% ATK đơn mục tiêu, Thủy +Hồn Kiếm |
| Tẩy Trần — Hồn Kiếm Quy Tâm |10 /CD2|Tạo1 Hồn Kiếm trực tiếp, giải toàn bộ debuff bản thân; tiện ích cố định |
| Bí Kiếm — Lục Hồn Đoạn Thủy |24 hoặc ưu tiên4 Hồn Kiếm /CD2|550% ATK đơn mục tiêu, Thủy +Hồn Kiếm; trúng HP/khiên thì thử Choáng1lượt |

Mỗi hit mang hai nguyên tố, chỉ xét điểm yếu một lần. Tăng tự nhiên theo đội áp sau cast như Tsukiha. Shion nhận biết phần tạo trực tiếp từ Tẩy Trần, không phần tăng tự nhiên. Burst ưu tiên tài nguyên trước MP, trả xong mới xét nội tại; không biến6tầng thành phí vào mode.

## Lục Hồn Khai Kiếm

Native `team_resource_mode`, khai resource/threshold/modeId bằng data. Pool đội đạt ít nhất6, chủ sống và chưa có mode → tự vào **Lục Hồn Thủy Kính**, +25%ATK và Khai Phá Điểm Yếu. Không tiêu Hồn Kiếm. Theo dõi thay đổi tài nguyên, đầu vòng/carry và đầu lượt chủ; hai phe PvP độc lập.

-3**lượt của chính Miyuki**, tính lượt vừa vào dạng nếu cô đang hành động, Lượt Thêm và lượt bị choáng. Đồng đội hành động không trừ. Không dùng clock vòng hoặc chỉ main_turn.
- Khi mode đang hoạt động, tạo thêm/overflow không refresh thời hạn. Resource giảm dưới6 không kết thúc dạng sớm.
- Hết lượt thứ3 thì rời dạng; không tái vào ngay trong cùng lần exit. Đầu lượt kế mà vẫn đủ6 thì vào lại, theo quyết định người dùng. Một thay đổi tài nguyên hợp lệ sau exit cũng có thể kích lại nếu vẫn đủ điều kiện. Không đệ quy trong cùng callback.
- Khai Phá gắn trực tiếp vào mode (`weaknessMultiplier:2`), không là status có clock riêng; rời dạng không để dư buff, không cộng×1,5×2. Không cho gỡ một status riêng rồi mất cơ chế mode.
- Giữ qua wave/phòng như các mode khác; snapshot/forecast không sửa trận thật. KO/kết thúc trận cleanup qua checkCombatMode như luật chung.

## API Choáng theo chỉ số

Trạng thái dùng lại ID `stunned`; thời lượng theo ứng dụng, không tăng Rank. Xác suất là tham số **lần áp**:

```json
{"onHitStatus":{"status":"stunned","duration":1,"chanceScaling":{"stat":"attack","basis":"dynamic","at":160,"cap":0.8}}}
```

Effect status độc lập cũng có thể khai `chanceScaling` cùng dạng. `stat`: maxHp/maxMp/attack/magic/defense/resistance/speed (HP/MP là chỉ số tối đa, không phải số còn lại); `basis`: dynamic (chỉ số đang hiệu lực) hoặc base (căn bản theo baseStatValue, gồm bonus căn bản); `at` là mốc đạt cap, `cap` là xác suất trần0–1. Chance =min(cap,max(0,chỉ số)/at×cap). Miễn nhiễm kiểm trước RNG/HộẤn; sau đó roll, nếu thành công mới tới HộẤn.

Miyuki dùng ATK động:80ATK→40%,160ATK→80%, cao hơn không vượt80%. Buff ATK trong mode/trận được tính. Rank tăng damage, không tăng mốc/xác suất. Không khai chanceScaling thì giữ luật áp chắc chắn trước né/HộẤn của kỹ năng cũ, không thêm RNG vào mọi Choáng.

Choáng1lượt tiêu vào lượt hành động kế tiếp của mục tiêu, kể cả Vòng Phụ, theo status hiện hành. Không đổi clock Choáng toàn game sang main_turn.

## Boss miễn Choáng

`controlImmunities:["stun"]` khai trên enemy template đã phân loại boss; boss scripted có `boss` cũng được miễn. Không suy từ Level, không miễn cho mọi quái trong encounter boss: ví dụ tay sai vua chằn miễn, quỷ lùn đi cùng vẫn có thể Choáng. PvP nhân vật không tự được miễn.

Ngoại lệ người dùng chốt: **Nhện khổng lồ vẫn tự Choáng khi vỡ khiên**. Hook nội tại vỡ khiên đi qua option nội bộ `bypassControlImmunity`, được lưu trên status để skipTurn chạy đúng. Các kỹ năng áp Choáng từ ngoài không được khai bypass bằng data. Đây là cơ chế tự mở cửa sổ tấn công, không phải bỏ miễn nhiễm của boss.

## Kiểm chứng

`test/miyuki.test.js`: vào/tái vào/không refresh mode, turn/extra/skip, snapshot/forecast, hai nhánh phí, x2 điểm yếu, xác suất biên, HộẤn, boss/minion và tự Choáng nhện. Bộ chung Hồn Kiếm kiểm Shion không chọn người ngoài nhóm. E2E kiểm Miyuki trong combat và preview, chấm banner, điều khoản pity riêng/hết hạn.

Trình bày Miyuki dùng `presentationScope:none` như mode tiêu chuẩn của Yufina/Joshua: có nhãn/tóm tắt trên card, không lấy mặt nạ riêng của Lunarmare.

Siêu trùm cũng miễn Choáng: Alice, Miraebolis, Hắc ảnh Arthur. Validator chặn encounter siêu trùm đơn thể nếu template không có miễn Choáng hoặc cơ chế boss scripted. Kiểm thử dùng burst Miyuki với RNG bảo đảm thành công và xác nhận cả ba vẫn miễn, không tiêu Hộ Ấn. Miyuki dùng cùng `presentationScope:none` như Valery/Joshua/Yufina, không có mặt nạ/scene của Selene.
