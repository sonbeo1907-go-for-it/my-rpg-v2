# Northern Prisma v2

React + Next.js App Router + Tauri 2, giao diện tiếng Việt, gameplay data-driven từ MyRPG. Bản Windows tự đọc/ghi hồ sơ JSON trong AppData. Không cần tài khoản hoặc dịch vụ bên ngoài.

## Chạy ứng dụng

Bản Windows cần Node.js 22+, Rust MSVC, Microsoft C++ Build Tools + Windows SDK và WebView2 để phát triển/build. Người chơi dùng bộ cài, không cần Node/Rust.

```powershell
cd E:\MyRPGv2
npm.cmd ci
npm.cmd run desktop:dev
# Đóng gói bộ cài Windows:
npm.cmd run desktop:build
```

Bản xem trước trình duyệt: `npm run dev` ở http://localhost:3001; hoặc `npm run build` rồi `npm start` ở http://127.0.0.1:3002. Frontend xuất tĩnh vào `out`; không dùng Next.js server cho bản desktop.

## Hồ sơ và tiến trình

Khởi động tự quét `%LOCALAPPDATA%\NorthernPrisma\saves\savedata<N>.json`, chọn hành trình hoặc tạo mới. Save dùng JSON v5, tự chuyển từ v4, gồm tiền, nhân vật, gear, nâng cấp Arthur, thưởng lần đầu, lịch hầm ngục và năm đội hình. Tên người chơi nằm trong `profiles.json`; bấm khung người chơi ở quán trọ để đổi tên. Có nút Mở thư mục lưu dữ liệu game thay cho Import/Export.

Chờ ghi file thành công trước khi công bố tiến trình. Tự giữ backup, phát hiện file thay đổi bên ngoài, phục hồi có xác nhận và không tự reset save hỏng. Trận đang diễn ra chỉ ở RAM, không được lưu trong JSON. Đổi hồ sơ kết thúc trận dở dang sau xác nhận.

Trong cùng trình duyệt/WebView, save localStorage cũ được chuyển tự động một lần khi chưa có hồ sơ; key cũ vẫn được giữ. Tauri không đọc được localStorage của trình duyệt khác. JSON đã có có thể được đặt vào thư mục saves với tên slot chưa dùng rồi game tự nhận diện. Chi tiết và cách build: [docs/DESKTOP_SAVES.md](docs/DESKTOP_SAVES.md).

## Các màn hình

| Route                        | Nội dung                                                 |
| ---------------------------- | -------------------------------------------------------- |
| `/`                          | Tự tải danh sách hồ sơ, chọn hoặc tạo hành trình          |
| `/home`                      | Quán trọ SVG và các liên kết chính                       |
| `/party`                     | Bốn slot, modal đồng đội sở hữu, năm đội hình            |
| `/characters`                | Grid nhân vật, tìm kiếm và các bộ lọc                    |
| `/characters/[id]`           | Hồ sơ, nội tại, kỹ năng và hệ số                         |
| `/characters/[id]/equipment` | Lắp/tháo/chuyển đồ, so sánh chỉ số, lọc và sort asc/desc |
| `/inventory`                 | Trang bị / Vật phẩm, lọc và sắp xếp                       |
| `/recruitment`               | Quay 1/10 bằng Prisma, thông tin quay phía dưới banner   |
| `/shop`                      | Chuyển Coin thành Prisma, chiêu mộ bằng Pure Prisma       |
| `/recruitment/reveal`        | Mặt sau thẻ, mở từ dưới lên; bỏ qua đến kết quả          |
| `/recruitment/results`       | Kết quả đã lưu, xem lại và chi tiết phần thưởng          |
| `/quests`                    | 27 nhiệm vụ, gồm tám Quest dễ mới thưởng 50 Coin          |
| `/battle`                    | Trận đang diễn ra, nhật ký, Đánh lại và trở về Quest     |
| `/dungeon`                   | Ba cửa hầm ngục SVG; Mỏ vàng đã mở cả ba mức độ          |
| `/dungeon/[id]`              | Bảng ba độ khó dùng chung bố cục Quest                   |

Hồ sơ/Trang bị không có nút trực tiếp trên đại sảnh. Route hồ sơ truy cập từ danh sách nhân vật hoặc nút Chi Tiết của đội hình. Trang Chi tiết không có sort hoặc nút chuyển nhân vật trước/sau.

## Cấu trúc mã

- `src/core`: engine JS độc lập DOM; giữ nguyên các luật gameplay. `game-save.js` thêm envelope v5/presets và dữ liệu Thợ Rèn, dùng lại validator/migration v1-v3 đã kiểm thử; version nội bộ của engine vẫn là 3, file save dùng version 5.
- `src/components`: React TSX cho các màn và component dùng chung: card, stats, filter, sort, modal, kỹ năng, trang bị, combatant và icon SVG.
- `src-tauri`: ứng dụng Windows và lớp quản lý file save Rust.
- `src/runtime`: profile-store, nội dung JSON, GameProvider, adapter runtime→snapshot React. Engine giữ RNG riêng, React nhận snapshot mới sau mỗi hành động.
- `src/app`: route/layout, CSS và font Noto Serif tự host có đầy đủ tiếng Việt.
- `data`: 25 nhân vật, 121 kỹ năng, 41 trạng thái, 31 quái và 27 encounter. Mười quái thường mới có thể ghép lại cho các Quest tiếp theo; tra ID tại `docs/COMMON_MONSTERS.md`.
- `public/art`: SVG quán trọ, Prisma, bản đồ. `npm.cmd run art` sinh lại từ seed cố định.
- `public/bgm`: tám MP3 local, gồm nhạc quán trọ `tavern.mp3`. Audio controller giữ vị trí khi chuyển route, xử lý autoplay và tab ẩn.
- `test`: kiểm thử core, save, preset và sort bằng Node.
- `e2e`: kiểm thử trình duyệt cho migration, giao diện, chiến đấu và giao dịch.

## Kiểm tra

```powershell
npm.cmd run validate
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
```

Để chạy kiểm thử trình duyệt, khởi động ứng dụng ở terminal khác rồi chạy `npm.cmd run test:e2e`. Cấu hình mặc định dùng Microsoft Edge đã cài trên Windows, headless, dữ liệu test riêng biệt. Có thể đổi `channel` trong `playwright.config.ts` trên hệ điều hành khác; không dùng save thật của trình duyệt đang mở.

Các luật bảo toàn: ghi save thành công trước khi công bố gacha/equip/thưởng; lỗi lưu có thể thử lại; không nhận thưởng trùng; thay đội/gear không sửa trận đang diễn ra. Animation theo events, có giảm chuyển động. Nền, icon và font được phục vụ local.

## Trải nghiệm combat

Chọn trực tiếp thẻ mục tiêu: luôn giữ một đồng đội và một kẻ địch bằng bốn góc cam. Mục tiêu được nhớ qua lượt/chuyển route; tự chuyển khi gục và tôn trọng Khiêu khích. AoE làm sáng mọi mục tiêu, tự buff đánh dấu người sử dụng.

Skill chỉ hiện tên/hệ số thật; hover hoặc focus để xem thông tin, chạm giữ trên điện thoại. Trạng thái có tooltip về tác dụng, nguồn và số lượt. Có tốc độ Bình thường/Nhanh, thứ tự lượt tương tác và nhãn Liên kích (FuA)/Phản công. FuA là thuật ngữ dùng chung, không thay ID hoặc luật cấm tự kích hoạt và liên kích nối nhau.

## Chiêu Mộ Prisma

Tỷ lệ cơ bản: 30% trang bị cấp thấp, 50% cấp trung, 15% cấp cao (12% chuyên biệt, 3% đa dụng), 5% nhân vật. Nếu 49 lượt liên tiếp không có nhân vật, lượt 50 bảo đảm nhân vật; reset khi quay ra nhân vật kể cả bản trùng. Đổi mảnh và thưởng nhiệm vụ không thay đổi pity. Quay 10 xử lý tuần tự từng lượt.

Lưu phần thưởng, pity theo banner và lượt chiêu mộ gần nhất cùng một giao dịch trước hoạt ảnh. Skip, tải lại trang kết quả hoặc xem lại reveal không tốn coin hay cấp thưởng lại. Save cũ vẫn nhập được; vì không có lịch sử quay cũ, bộ đếm pity bắt đầu từ 0.

Đá Prisma dùng màu rarity cao nhất trong batch, có giảm chuyển động. SVG căn giữa và sáu silhouette vai trò được sinh bởi `node scripts/generate-summon-art.mjs`; giữ file summon.svg gốc. Cardback tăng chi tiết theo cấp, dùng biểu tượng trang bị/vai trò.

Nhạc quán trọ lặp tại `/home`, tạm dừng khi rời quán hoặc ẩn tab, tiếp tục từ vị trí cũ khi trở lại. Nhạc trận/victory giữ vị trí riêng, dùng chung nút BGM và âm lượng.

## Shop và tiền tệ

Coin dùng để đổi Prisma thường màu tím: **300 Coin = 1 Prisma**. Quay 1/10 dùng 1/10 Prisma. Nếu thiếu, modal báo đúng lượng thiếu và giá Coin; chỉ sau xác nhận mới đổi và quay trong cùng một giao dịch lưu. Hủy hoặc lỗi lưu giữ nguyên ví/phần thưởng.

Mảnh chiêu mộ cũ đổi tên hiển thị thành **Pure Prisma**, màu vàng cam; giữ khóa save `recruitmentShards` để tương thích. Shop có tab Chuyển đổi Prisma và tab Chiêu Mộ: 120 Pure Prisma đổi một nhân vật chưa sở hữu. Bản trùng vẫn cho 10 Pure Prisma và mở slot theo luật cũ; đổi tự chọn không làm reset pity.

Ví header hiện Prisma, Pure Prisma rồi Coin, có icon Shop. Quán trọ cũng có lối vào Shop. Thông tin Coin, tổng lượt, pity, kết quả gần nhất và tỷ lệ nằm dưới banner; đổi tự chọn chuyển sang Shop.

Thưởng mỗi chiến thắng: thường 50 Coin, boss 150 Coin, siêu trùm 1.000 Coin. `rewardTier` trong encounter quyết định thưởng và loại màn, độc lập với BGM. Save cũ giữ toàn bộ Coin, mảnh, pity và lịch sử; trường `prisma` thiếu được mặc định 0, không tự tiêu Coin. Cấp bù chiến thắng save v1 vẫn theo mức lịch sử 100 Coin, không suy đoán lại loại trận cũ.

## Settings và tay cầm Xbox

Bánh răng ngoài cùng bên phải header mở Settings; Menu ☰ cũng mở/đóng Settings. Màn khởi động có bánh răng riêng. Âm thanh chỉ còn trong Settings: bật/tắt nhạc nền và thanh âm lượng. Điều khiển cho chọn Chuột hoặc Tay cầm Xbox, hướng dẫn nút và rung nếu có hỗ trợ. Thiết lập lưu riêng ở `northern-prisma.settings.v1`, không nằm trong save tiến trình.

Web nhận bố trí chuẩn qua [Gamepad API](https://www.w3.org/TR/gamepad/); không gọi trực tiếp DirectInput/XInput native. D-pad/cần trái di chuyển focus; A chọn/xác nhận; B đóng modal hoặc trở về; X hành động phụ; Y chi tiết/bộ lọc; LB/RB tab/đội; cần phải cuộn; Menu mở Settings. Chuột vẫn dùng được khi chọn tay cầm. Thiết bị không có mapping standard được báo rõ và không đoán nút để tránh kích hoạt nhầm.

Focus có viền sáng riêng với bốn góc cam của mục tiêu combat, cuộn theo thẻ và nhớ vị trí khi trở về. Select và ô nhập có bảng lựa chọn/bàn phím trong game. Hồ sơ tự tải từ thư mục lưu, không có Import/Export. Bàn phím trong game hỗ trợ chữ Latin, đ, số, dấu cách và xóa.

Combat: A ở kỹ năng chuyển sang chọn mục tiêu hợp lệ; A tiếp theo mới thực hiện; B quay lại chọn chiêu; Y mở mô tả/hệ số và lý do không dùng được. Đổi lượt quay về chọn chiêu. Giữ nút không xác nhận xuyên modal hoặc sang lượt mới. Mất kết nối không đóng modal hoặc thay đổi giao dịch. Hướng dẫn ở góc dưới phải đổi theo màn hình và hiện cả trong modal; trên điện thoại có khoảng trống bên dưới.

Kiểm thử tự động giả lập thiết bị standard qua navigator.getGamepads, gồm nhấn/giữ, mất kết nối, modal, tìm kiếm, đội hình, trang bị, Shop và combat. Cần xác minh thêm độ tương thích/rung với tay cầm vật lý của người chơi.

## Mỏ vàng nhiều đợt

Ba cửa SVG: Mỏ vàng, Hiểm trở, Ảo ảnh. Mỏ vàng Dễ chọn 3 Quest thường: HP ×1,1, MP ×1,5; Trung bình chọn 4 Quest: HP ×1,75, MP ×2,25, ATK/MAG ×1,25; Khó chọn 4 Quest: HP ×1,9, MP ×2,25, ATK/MAG ×1,6. Không trùng Quest trong một chuyến. DEF/RES/SPD giữ nguyên. Hiểm trở đã mở ba mức với 1/2/2 phòng trùm; HP/MP ×1,2/1,6/2 và ATK/MAG ×1/1,25/1,5, thưởng 1/3/5 Pure Prisma. Xem trước toàn bộ địch theo Phòng 1/Phòng 2, danh sách được giữ khi chỉnh đội hoặc tải lại trong cùng cửa sổ; Ảo ảnh tạm đóng. Chưa triển khai Phân rã, Original Prisma hoặc Blacksmith trong đợt này.

Sau mỗi lần dọn hết quái, tự sang wave mới. Giữ snapshot đội hình, chỉ số/gear, HP/MP (kể cả thành viên đã gục), khiên/nguồn khiên, buff/debuff, tài nguyên và hồi chiêu. Mỗi wave bắt đầu một vòng mới theo nhịp engine: cooldown giảm một lần và các hiệu ứng đầu lượt chạy khi tới lượt. Không hồi đầy, không hồi sinh, không nhận 50 Coin hay thưởng Quest lần đầu ở từng wave. ID quái riêng theo wave; lưu nguồn cũ để độc/tooltip không nhầm sang quái mới.

Vượt trọn chuỗi nhận 1.000/2.000/3.000 Coin và tính một chiến thắng. Ba lượt Mỏ vàng dùng chung các độ khó, chỉ trừ khi hoàn thành và ghi thưởng thành công. Ngày đặt lại lúc 00:00 Asia/Ho_Chi_Minh; tính theo ngày nhận thưởng. Quota và Coin ghi cùng một giao dịch, lỗi ghi có thể thử lại. Ledger `dungeonDaily` được giữ trong save JSON v4, save cũ thiếu được khởi tạo rỗng. Không cấp bù hoặc trừ lại những trận cũ.

Trận/chuyến đang chạy vẫn chỉ nằm trong phiên như hệ thống combat trước đây. Đổi route có thể tiếp tục, nhưng tải lại trang kết thúc chuyến dở dang; không mất lượt nhận thưởng. Thay đội/gear giữa chuyến chỉ áp dụng khi bắt đầu chuyến mới. `data/dungeons.json` chứa cấu hình và phần thưởng; `src/core/dungeon.js` xử lý chuỗi, `dungeon-rules.js` xử lý ngày/quota/validation.

## Thợ Rèn và Trấn Phái

Route /blacksmith có hai thẻ Phân rã / Trấn Phái, nền SVG Tobin và bố cục dùng chung Tiệm Prisma. Phân rã 1–99 đồ thường chưa dùng để lấy Vụn Prisma. Túi đồ có lưới 5 tài nguyên. Đã mở 13 mẫu Trấn Phái cho sáu nhân vật đầu, gồm một mẫu thưởng quest ATK +5 và 12 mẫu chế tạo; tái rèn hai bước và ô Trấn Phái riêng hoạt động đầy đủ. Ảo Ảnh vẫn tạm đóng. Chi tiết: [docs/BLACKSMITH.md](docs/BLACKSMITH.md).

## Vòng Phụ và đợt nhân vật 29/10/2026

Thêm Helena, Leonardo, Kyle, Iwayn, Percival, Mandred, Lionel; 13 Trấn Phái cho sáu nhân vật đầu; quest boss Lợn rừng khổng lồ thưởng Trấn Arthur ATK +5 và bản trùng Arthur/Iris/Takeshi. Các effect và nội tại khai báo qua dữ liệu, có kiểm tra schema. Quy tắc Vòng Phụ, lựa chọn mặc định và hướng kiểm thử: [đặc tả triển khai](docs/EXTRA_TURNS_AND_RECRUITS.md).

## Chuẩn mô tả nhân vật và kỹ năng

Đã rà soát 32 nhân vật, 144 kỹ năng và 13 Trấn Phái. UI chia tác dụng ngắn / thông số / chi tiết cơ chế; bối cảnh nhân vật tách khỏi giới thiệu cách chơi. Chuẩn biên soạn, đánh giá từ hai góc nhìn và danh mục câu chữ nằm trong [đặc tả mô tả kỹ năng](docs/SKILL_COPY_AND_UX_SPEC.md).
