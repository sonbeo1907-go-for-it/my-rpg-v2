# Phe phái, slug và nhãn hiển thị

Chuẩn hóa 04/11/2026. `affiliation` trong `data/characters.json` là **slug ổn định** (chữ thường, `a-z0-9_`), không phải chuỗi hiển thị. Nhãn người chơi thấy nằm duy nhất trong `AFFILIATION_LABELS` của [src/core/catalog.js](../src/core/catalog.js); UI luôn đi qua `affiliationLabel()`.

## Luật

- Thêm phe mới: thêm slug vào `characters.json` **và** nhãn tiếng Việt vào `AFFILIATION_LABELS`. Thiếu nhãn thì UI sẽ lộ slug thô; `test/affiliations.test.js` chặn trường hợp này.
- Không đổi slug đã phát hành chỉ để sửa chữ; sửa nhãn là đủ. Đổi slug cần cập nhật test và ghi chú migration vì tìm kiếm/tài liệu dùng chung.
- Không dựng ngoại lệ theo tên nhân vật ở engine; affiliation chỉ là nhãn + khóa tìm kiếm, không cấp chỉ số hay mở khóa.
- Nhân vật chưa xác định phe thì bỏ trống trường, không ghi "Khác" giả.

## Danh sách hiện hành

| Slug | Nhãn | Số | Thành viên |
| --- | --- | --- | --- |
| `capital_knights` | Kị sĩ đoàn Thủ đô | 17 | Albedo, Benard, Cerise, Charlemagnes, Gahallad, Gawain, Iwayn, Lanceveil, Lionel, Mandred, Percival, Rivia, Roland, Sandra, Sieg, Valery, Victorina |
| `hunters_guild` | Hội Thợ Săn | 19 | Bennett, Brant, Chloe, Dain, Ember, Flammelapis, Freya, Galliard, Henrris, Iris, Joshua, Judy, Karin, Logia, Rowan, Sylva, Takeshi, Tywin, Yumia |
| `northern_village` | Làng Phía Bắc | 8 | Armie, Arthur, Astraea, Elaine, Fiona, Garrek, Kai, Tobin |
| `magic_academy` | Học viện Ma pháp | 9 | Artesia, Auguste, Aurora, Drake, Finmel, Fran, Kreider, Lumine, Monica |
| `house_valmont` | Gia tộc Valmont | 5 | Cedric, Heimdall, Lucien, Lyon, Seraphine |
| `house_ranoc` | Gia tộc Ranoc | 4 | Helena, Kyle, Leonardo, Lisbeth |
| `vertosse_clan` | Gia tộc Vertosse | 4 | Genevieve, Noctis, Selene, Simon |
| `hunters_guild_magic_academy` | Hội Thợ Săn / Học viện Ma pháp | 2 | Amelia, Yufina |
| `black_rose_mafia` | Băng đảng Mafia Hoa Hồng Đen | 2 | Isabelle, Viktor |
| `rhett_research_facility` | Viện Nghiên Cứu Tự Xưng của Rhett | 3 | Amaryllis, Arden, Rhett |
| `mikaielis_order` | Giáo đoàn Mikaielis | 1 | Elise |
| `mage_circle` | Giới pháp sư | 1 | Aldric |
| `time_travelers` | Lữ khách thời không | 1 | Astoria |
| `expedition_corps` | Kị sĩ Sư đoàn Viễn Chinh | 5 | Patricia, Vilgard, Ardelia, Belochkin, Chen |
| `destiny_heralds` | Sứ giả Định Mệnh | 1 | Chelsea |
| `wanderer` | Lãng khách | 1 | Mori |
| `drageshelmfjall_merchants` | Hội Thương Nhân Drageshelmfjall | 1 | Myonne |
| `keijo_shrine` | Đền Keijo | 3 | Amiya, Kaguya, Tsukiha |
| `northern_forest` | Khu rừng phương Bắc | 1 | Minerva |

96/97 nhân vật đã có phe. Verena chưa xác định gia tộc/phe phái nên để trống theo luật ở trên. Rhett đứng tên "viện" của chính mình cùng Arden và Amaryllis; Fran thuộc Học viện Ma pháp — "Học viện Phép Thuật" là một trong các cách viết cũ đã gộp vào slug `magic_academy`, nhãn hiển thị thống nhất là "Học viện Ma pháp".

## Vì sao có tên "Viện Nghiên Cứu Tự Xưng của Rhett"

Bản tiếng Anh là *Rhett's self-proclaimed research facility*. Chọn "tự xưng" để giữ sắc thái tự phong của Rhett thay vì dịch thành một học viện ngang hàng Học viện Ma pháp. Slug `rhett_research_facility` giữ trung tính nếu sau này đổi nhãn.

## Mặc định trang danh sách nhân vật

`/characters` mở với `ownership=owned`, `sort=level`, `direction=desc`: chỉ người đã sở hữu, Level cao nhất trước. Người chơi đổi được mọi lựa chọn; chọn "Tất cả" ghi `ownership=all` xuống URL để không bị mặc định kéo lại. Nhãn "Sở hữu" không có trong bộ chọn đội hình vì màn đó đã giới hạn theo quyền sở hữu.

## Kiểm chứng

- `test/affiliations.test.js`: slug hợp lệ, nhãn tiếng Việt đầy đủ, thành viên năm phe vừa bổ sung/điều chỉnh, ngữ nghĩa `owned`/`all`/`locked`.
- `e2e/roster-defaults.spec.ts`: mặc định sở hữu + Level giảm dần, chuyển "Tất cả" thì thấy nhân vật chưa mở khóa và giữ được sau reload.
- `npm.cmd run validate`, `npm.cmd run typecheck`, `npm.cmd test`.

Bổ sung: `keijo_mountains` — Núi Keijo (Izuna); `youkai_hunters` — Hội Thợ Săn Yêu Quái (Shion, Miyuki). Cả hai thuộc cơ chế Hồn Kiếm nhưng có phe riêng.

Bổ sung05/11: Eri thuộc `magic_academy` (Học viện Ma pháp); Chiyoko thuộc `youkai_hunters_guntai` (Hội Thợ Săn Yêu Quái / Quân đội Keijo), tags `youkai_hunters` và `guntai`. Đây là nhãn kép, không đổi phe của thành viên đã có.

Bộ lọc nguyên tố Hồn Kiếm trong characterCatalog nhận diện tag `sword_soul`, nên giữ được hệ chính của nhân vật (ví dụ Tsukiha vẫn thuộc Hỏa). Cùng hàm dùng cho danh sách và modal chọn đội; vẫn kết hợp sở hữu, vai trò và thứ tự.
